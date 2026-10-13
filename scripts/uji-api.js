import assert from "node:assert/strict";

const base = process.argv[9] ?? "http://127.0.0.1:3000";
const host = new URL(base).hostname;
if (!["127.0.0.1", "localhost"].includes(host)) {
  throw new Error("Jalankan uji mutasi hanya pada server lokal latihan.");
}
const tanda = `Uji C7 ${Date.now()}`;
async function request(method, path, payload, status) {
  const respons = await fetch(new URL(path, base), {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });
  const body = respons.status === 204 ? null : await respons.json();
  assert.equal(respons.status, status, JSON.stringify(body));
  console.log(`PASS ${method} ${path} -> ${status}`);
  return { body, location: respons.headers.get("location") };
}
const payload = {
  penyediaId: "1",
  nama: tanda,
  kategori: "roti",
  hargaNormal: 10000,
  hargaPenawaran: 5000,
  stok: 2,
  satuan: "paket",
  status: "aktif",
  berakhirPada: new Date(Date.now() + 86400000).toISOString(),
};
try {
  await request("GET", "/api/health", undefined, 200);
  await request("GET", "/api/penawaran?page=0", undefined, 400);
  await request("GET", "/api/penawaran?limit=51", undefined, 400);
  await request("GET", "/api/penawaran?q=roti&q=nasi", undefined, 400);
  await request("GET", "/api/penawaran/abc", undefined, 400);
  await request("GET", "/api/penawaran/9223372036854775807", undefined, 404);
  await request(
    "POST",
    "/api/penawaran",
    { ...payload, hargaPenawaran: 20000 },
    400,
  );
  const dibuat = await request("POST", "/api/penawaran", payload, 201);
  const id = dibuat.body.data.id;
  assert.equal(dibuat.location, `/api/penawaran/${id}`);
  assert.equal(typeof id, "string");
  const path = `/api/penawaran/${id}`;
  const updated = { ...payload, nama: `${tanda} diperbarui` };
  const diubah = (await request("PUT", path, updated, 200)).body.data;
  assert.equal(diubah.id, id);
  assert.equal(diubah.penyediaId, dibuat.body.data.penyediaId);
  assert.equal(diubah.dibuatPada, dibuat.body.data.dibuatPada);
  await request("PUT", path, { nama: "Tidak lengkap" }, 400);
  const cari = await request(
    "GET",
    `/api/penawaran?q=${encodeURIComponent(tanda)}&limit=1&page=1`,
    undefined,
    200,
  );
  assert.equal(cari.body.meta.jumlah, 1);
  assert.equal(cari.body.data.length, 1);
  const gabungan = await request(
    "GET",
    `/api/penawaran?q=${encodeURIComponent(tanda)}` +
      "&kategori=roti&status=aktif&tersedia=true",
    undefined,
    200,
  );
  assert.equal(gabungan.body.meta.jumlah, 1);
  assert.equal(gabungan.body.data.id, id);
  const kosong = await request(
    "GET",
    `/api/penawaran?q=${encodeURIComponent(tanda)}&limit=1&page=2`,
    undefined,
    200,
  );
  assert.equal(kosong.body.meta.jumlah, 1);
  assert.equal(kosong.body.data.length, 0);
  const injeksi = await request(
    "GET",
    `/api/penawaran?q=${encodeURIComponent("' OR 1=1 --")}`,
    undefined,
    200,
  );
  assert.equal(injeksi.body.meta.jumlah, 0);
  await request("DELETE", path, undefined, 204);
  await request("GET", path, undefined, 404);

  const a = (await request("POST", "/api/penawaran", payload, 201)).body.data;
  const b = (
    await request(
      "POST",
      "/api/penawaran",
      { ...payload, penyediaId: "2", nama: `${tanda} kedua` },
      201,
    )
  ).body.data;
  const pesan = (items) => ({
    emailPembeli: "siti.pembeli@example.test",
    items,
  });
  const awalPesanan = (
    await request("GET", "/api/pesanan?limit=1", undefined, 200)
  ).body.meta.jumlah;
  const lintas = await request(
    "POST",
    "/api/pesanan",
    pesan([
      { penawaranId: a.id, kuantitas: 1 },
      { penawaranId: b.id, kuantitas: 1 },
    ]),
    409,
  );
  assert.equal(lintas.body.error.code, "MIXED_PROVIDER");
  const kurang = await request(
    "POST",
    "/api/pesanan",
    pesan([{ penawaranId: a.id, kuantitas: 999 }]),
    409,
  );
  assert.equal(kurang.body.error.code, "INSUFFICIENT_STOCK");
  const setelahGagal = await request(
    "GET",
    "/api/pesanan?limit=1",
    undefined,
    200,
  );
  assert.equal(setelahGagal.body.meta.jumlah, awalPesanan);
  const tetap = (
    await request("GET", `/api/penawaran/${a.id}`, undefined, 200)
  ).body;
  assert.equal(tetap.data.stok, 2);
  const order = await request(
    "POST",
    "/api/pesanan",
    pesan([{ penawaranId: a.id, kuantitas: 2 }]),
    201,
  );
  assert.equal(order.body.data.total, 10000);
  assert.equal(order.body.data.nilaiStokTerselamatkan, 20000);
  assert.equal(order.location, `/api/pesanan/${order.body.data.id}`);
  const setelahBerhasil = await request(
    "GET",
    "/api/pesanan?limit=1",
    undefined,
    200,
  );
  assert.equal(setelahBerhasil.body.meta.jumlah, awalPesanan + 1);
  await request("DELETE", `/api/penawaran/${a.id}`, undefined, 409);
  const habis = (
    await request("GET", `/api/penawaran/${a.id}`, undefined, 200)
  ).body;
  assert.equal(habis.data.stok, 0);
  assert.equal(habis.data.status, "habis");
  await request(
    "PUT",
    `/api/penawaran/${a.id}`,
    {
      ...payload,
      hargaNormal: 20000,
      hargaPenawaran: 8000,
      stok: 0,
      status: "habis",
    },
    200,
  );
  const snapshot = (await request("GET", order.location, undefined, 200))
    .body;
  assert.equal(snapshot.data.items[0].hargaSatuan, 5000);
  assert.equal(snapshot.data.total, 10000);
  await request("DELETE", `/api/penawaran/${b.id}`, undefined, 204);
  console.log(
    `SELESAI: pesanan ${order.body.data.id}, ` +
      `penawaran ${a.id} tetap tersimpan.`,
  );
} catch (error) {
  console.error("FAIL:", error.message);
  process.exitCode = 1;
}