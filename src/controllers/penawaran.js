import * as data from "../repositories/penawaran.js";
import { idValid, halamanValid, filterValid, salah } from "../lib/api.js";
import { penawaranSesiValid } from "../lib/input-auth.js";

export async function daftar(req, res) {
  const filter = filterValid(req.query);
  if (
    (filter.status && filter.status !== "aktif") ||
    req.query.tersedia === "false"
  ) {
    salah("Katalog publik hanya menampilkan penawaran aktif yang tersedia.");
  }
  const hasil = await data.daftarPenawaran(
    { ...filter, status: "aktif", tersedia: true },
    halamanValid(req.query),
  );
  return res.json({ success: true, ...hasil });
}
export async function milikSaya(req, res) {
  const hasil = await data.daftarPenawaran(
    filterValid(req.query),
    halamanValid(req.query),
    req.pengguna.penyediaId,
  );
  return res.json({ success: true, ...hasil });
}
export async function detail(req, res) {
  const hasil = await data.bacaPenawaran(
    idValid(req.params.id),
    undefined,
    true,
  );
  return res.json({ success: true, data: hasil });
}
export async function detailMilikSaya(req, res) {
  const hasil = await data.bacaPenawaran(
    idValid(req.params.id),
    undefined,
    false,
    req.pengguna.penyediaId,
  );
  return res.json({ success: true, data: hasil });
}
export async function buat(req, res) {
  const hasil = await data.simpanPenawaran(
    penawaranSesiValid(req.body, req.pengguna),
  );
  return res
    .status(201)
    .location(`/api/penawaran/${hasil.id}`)
    .json({ success: true, data: hasil });
}
export async function ubah(req, res) {
  const hasil = await data.simpanPenawaran(
    penawaranSesiValid(req.body, req.pengguna, true),
    idValid(req.params.id),
  );
  return res.json({ success: true, data: hasil });
}
export async function foto(req, res) {
  const versi = req.query.v;
  if (typeof versi !== "string" || !/^[a-f0-9]{64}$/.test(versi)) {
    salah("Versi foto tidak valid.");
  }
  const hasil = await data.bacaFoto(idValid(req.params.id), versi);
  res.set("Cache-Control", "public, max-age=86400");
  res.type(hasil.foto_tipe);
  return res.send(Buffer.from(hasil.foto));
}
export async function hapus(req, res) {
  await data.hapusPenawaran(idValid(req.params.id), req.pengguna.penyediaId);
  return res.status(204).end();
}