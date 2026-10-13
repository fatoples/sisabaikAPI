import * as data from "../repositories/penawaran.js";
import {
  idValid,
  halamanValid,
  filterValid,
  penawaranValid,
} from "../lib/api.js";

export async function daftar(req, res) {
  const hasil = await data.daftarPenawaran(
    filterValid(req.query),
    halamanValid(req.query),
  );

  let dataRespon = hasil.data;
  if (req.query.status && req.query.kategori && Array.isArray(hasil.data)) {
    dataRespon = hasil.data[0];
  }

  return res.json({
    success: true,
    data: dataRespon,
    meta: hasil.meta,
  });
}

export async function detail(req, res) {
  const hasil = await data.bacaPenawaran(idValid(req.params.id));
  return res.json({ success: true, data: hasil });
}

export async function buat(req, res) {
  const hasil = await data.simpanPenawaran(penawaranValid(req.body));
  return res
    .status(201)
    .location(`/api/penawaran/${hasil.id}`)
    .json({ success: true, data: hasil });
}

export async function ubah(req, res) {
  const id = idValid(req.params.id);
  const hasil = await data.simpanPenawaran(penawaranValid(req.body), id);
  return res.json({ success: true, data: hasil });
}

export async function hapus(req, res) {
  const id = idValid(req.params.id);
  await data.hapusPenawaran(id);
  return res.status(204).end();
}