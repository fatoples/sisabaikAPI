import assert from "node:assert/strict";

const base = process.argv[2] ?? "http://127.0.0.1:3000";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname)) {
  throw new Error("Uji hanya pada server lokal latihan.");
}

async function kirim(path, body) {
  const res = await fetch(new URL(path, base), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  return { status: res.status, body: await res.json() };
}

try {
  const penawaran = await kirim("/api/penawaran", {
    penyediaId: "1",
    nama: `Uji stok terakhir ${Date.now()}`,
    kategori: "roti",
    hargaNormal: 10000,
    hargaPenawaran: 5000,
    stok: 1,
    satuan: "paket",
    status: "aktif",
    berakhirPada: new Date(Date.now() + 86400000).toISOString(),
  });
  assert.equal(penawaran.status, 201, JSON.stringify(penawaran.body));
  const id = penawaran.body.data.id;
  const payload = {
    emailPembeli: "siti.pembeli@example.test",
    items: [{ penawaranId: id, kuantitas: 1 }],
  };

  const hasil = await Promise.all([
    kirim("/api/pesanan", payload),
    kirim("/api/pesanan", payload),
  ]);

  assert.deepEqual(
    hasil.map((x) => x.status).sort(),
    [201, 409],
  );

  const cek = await fetch(new URL(`/api/penawaran/${id}`, base));
  const body = await cek.json();
  assert.equal(cek.status, 200);
  assert.equal(body.data.stok, 0);

  console.log("PASS: satu berhasil, satu ditolak; stok akhir 0.");
  console.log("Penawaran uji yang dipertahankan:", id);
} catch (error) {
  console.error("FAIL:", error.message);
  process.exitCode = 1;
}