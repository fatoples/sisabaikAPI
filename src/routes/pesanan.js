import { randomUUID } from "node:crypto";
import { Router } from "express";
import { penawaran, pesanan } from "../data/store.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: pesanan,
    meta: { jumlah: pesanan.length }
  });
});

router.post("/", (req, res) => {
  const { namaPemesan, items } = req.body;

  if (typeof namaPemesan !== "string" || namaPemesan.trim().length < 3) {
    return kirimValidasi(res, "namaPemesan minimal terdiri dari 3 karakter.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    return kirimValidasi(res, "items harus berupa array yang tidak kosong.");
  }

  const idUnik = new Set();
  const detail = [];

  for (const baris of items) {
    if (!Number.isInteger(baris.penawaranId) || !Number.isInteger(baris.kuantitas) || baris.kuantitas < 1) {
      return kirimValidasi(res, "penawaranId dan kuantitas harus berupa bilangan bulat positif.");
    }
    if (idUnik.has(baris.penawaranId)) {
      return kirimValidasi(res, "Satu penawaran tidak boleh muncul lebih dari sekali.");
    }
    idUnik.add(baris.penawaranId);

    const item = penawaran.find((penawaranItem) => penawaranItem.id === baris.penawaranId);

    if (!item) {
      return kirimValidasi(res, `Penawaran ${baris.penawaranId} tidak ditemukan.`, 404, "OFFER_NOT_FOUND");
    }
    if (baris.kuantitas > item.stok) {
      return kirimValidasi(res, `Stok ${item.nama} hanya ${item.stok}.`, 409, "INSUFFICIENT_STOCK");
    }

    detail.push({
      penawaranId: item.id,
      nama: item.nama,
      kuantitas: baris.kuantitas,
      hargaSatuan: item.hargaPenawaran,
      subtotal: item.hargaPenawaran * baris.kuantitas,
      nilaiStokTerselamatkan: item.hargaNormal * baris.kuantitas
    });
  }

  for (const baris of detail) {
    const item = penawaran.find((penawaranItem) => penawaranItem.id === baris.penawaranId);
    item.stok -= baris.kuantitas;
  }

  const pesananBaru = {
    id: randomUUID(),
    namaPemesan: namaPemesan.trim(),
    status: "menunggu-konfirmasi",
    items: detail,
    total: detail.reduce((jumlah, baris) => jumlah + baris.subtotal, 0),
    nilaiStokTerselamatkan: detail.reduce((jumlah, baris) => jumlah + baris.nilaiStokTerselamatkan, 0),
    dibuatPada: new Date().toISOString()
  };

  pesanan.push(pesananBaru);

  return res.status(201).location(`/api/pesanan/${pesananBaru.id}`).json({
    success: true,
    data: pesananBaru
  });
});

router.get("/:id", (req, res) => {
  const pesananItem = pesanan.find((item) => item.id === req.params.id);
  if (!pesananItem) {
    return res.status(404).json({
      success: false,
      error: { code: "ORDER_NOT_FOUND", message: "Pesanan tidak ditemukan." }
    });
  }
  return res.status(200).json({ success: true, data: pesananItem });
});

function kirimValidasi(res, message, status = 400, code = "VALIDATION_ERROR") {
  return res.status(status).json({ success: false, error: { code, message } });
}

export default router;