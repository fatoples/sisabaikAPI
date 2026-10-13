import { pool } from "../db/pool.js";
import { transaksi } from "../db/transaksi.js";
import { HttpError, metaHalaman } from "../lib/api.js";

const headerSql = `SELECT ps.*, u.nama_lengkap AS nama_pemesan,
py.nama_usaha AS penyedia FROM pesanan ps
JOIN pengguna u ON u.id = ps.pembeli_id
JOIN penyedia py ON py.id = ps.penyedia_id`;

function keHeader(row) {
  return {
    id: String(row.id),
    pembeliId: String(row.pembeli_id),
    penyediaId: String(row.penyedia_id),
    penyedia: row.penyedia,
    namaPemesan: row.nama_pemesan,
    status: row.status,
    total: Number(row.total_transaksi),
    nilaiStokTerselamatkan: Number(row.nilai_stok_terselamatkan),
    dibuatPada: new Date(row.dibuat_pada).toISOString(),
  };
}

async function bacaDetail(id, client) {
  const header = await client.query(`${headerSql} WHERE ps.id = $1`, [id]);
  if (!header.rowCount) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Pesanan tidak ditemukan.");
  }
  const detail = await client.query(
    `SELECT dp.*, p.nama FROM detail_pesanan dp
JOIN penawaran p ON p.id = dp.penawaran_id
WHERE dp.pesanan_id = $1 ORDER BY dp.penawaran_id`,
    [id],
  );
  return {
    ...keHeader(header.rows[0]),
    items: detail.rows.map((row) => ({
      penawaranId: String(row.penawaran_id),
      nama: row.nama,
      kuantitas: row.kuantitas,
      hargaSatuan: Number(row.harga_penawaran_satuan),
      subtotal: Number(row.subtotal),
      nilaiStokTerselamatkan: Number(row.nilai_stok),
    })),
  };
}

export function detailPesanan(id) {
  return transaksi((client) => bacaDetail(id, client), true);
}

export function daftarPesanan(paging) {
  return transaksi(async (client) => {
    const count = await client.query(
      "SELECT COUNT(*)::int AS jumlah FROM pesanan",
    );
    const hasil = await client.query(
      `${headerSql} ORDER BY ps.id DESC LIMIT $1 OFFSET $2`,
      [paging.limit, paging.offset],
    );
    return {
      data: hasil.rows.map(keHeader),
      meta: metaHalaman(count.rows[0].jumlah, paging),
    };
  }, true);
}

export function buatPesanan(data) {
  return transaksi(async (client) => {
    const pembeli = await client.query(
      `SELECT id FROM pengguna WHERE email = $1
AND peran = 'pembeli' AND aktif = TRUE`,
      [data.emailPembeli],
    );
    if (!pembeli.rowCount) {
      throw new HttpError(
        404,
        "BUYER_NOT_FOUND",
        "Pembeli aktif tidak ditemukan.",
      );
    }
    const detail = [];
    let penyediaId;
    let totalNormal = 0n;
    for (const baris of data.items) {
      const hasil = await client.query(
        "SELECT * FROM penawaran WHERE id = $1 FOR UPDATE",
        [baris.penawaranId],
      );
      if (!hasil.rowCount) {
        throw new HttpError(
          404,
          "OFFER_NOT_FOUND",
          "Penawaran tidak ditemukan.",
        );
      }
      const item = hasil.rows[0];
      const waktu = await client.query(
        "SELECT $1::timestamptz > clock_timestamp() AS belum_berakhir",
        [item.berakhir_pada],
      );
      if (item.status !== "aktif" || !waktu.rows[0].belum_berakhir) {
        throw new HttpError(
          409,
          "OFFER_UNAVAILABLE",
          "Penawaran tidak tersedia.",
        );
      }
      if (item.stok < baris.kuantitas) {
        throw new HttpError(
          409,
          "INSUFFICIENT_STOCK",
          `Stok ${item.nama} tidak mencukupi.`,
        );
      }
      penyediaId ??= String(item.penyedia_id);
      if (penyediaId !== String(item.penyedia_id)) {
        throw new HttpError(
          409,
          "MIXED_PROVIDER",
          "Satu pesanan harus dari satu penyedia.",
        );
      }
      totalNormal += BigInt(item.harga_normal) * BigInt(baris.kuantitas);
      if (totalNormal > 999999999999n) {
        throw new HttpError(
          409,
          "ORDER_TOTAL_LIMIT",
          "Total melampaui kapasitas skema.",
        );
      }
      detail.push({ ...baris, item });
    }
    const pesanan = await client.query(
      `INSERT INTO pesanan (pembeli_id, penyedia_id)
VALUES ($1, $2) RETURNING id`,
      [pembeli.rows[0].id, penyediaId],
    );
    const id = pesanan.rows[0].id;
    for (const { item, kuantitas } of detail) {
      await client.query(
        `INSERT INTO detail_pesanan (pesanan_id, penawaran_id, penyedia_id,
kuantitas, harga_normal_satuan, harga_penawaran_satuan)
VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          item.id,
          penyediaId,
          kuantitas,
          item.harga_normal,
          item.harga_penawaran,
        ],
      );
      await client.query(
        `UPDATE penawaran SET stok = stok - $1,
status = CASE WHEN stok - $1 = 0 THEN 'habis' ELSE status END
WHERE id = $2`,
        [kuantitas, item.id],
      );
    }
    await client.query(
      `UPDATE pesanan ps SET total_transaksi = r.total,
nilai_stok_terselamatkan = r.nilai_stok
FROM (SELECT SUM(subtotal) AS total, SUM(nilai_stok) AS nilai_stok
FROM detail_pesanan WHERE pesanan_id = $1) r
WHERE ps.id = $1`,
      [id],
    );
    return bacaDetail(id, client);
  });
}