import * as service from "../services/pesanan.js";
import { idValid, halamanValid, pesananValid } from "../lib/api.js";

export async function daftar(req, res) {
  const hasil = await service.daftarPesanan(halamanValid(req.query));
  return res.json({ success: true, ...hasil });
}

export async function detail(req, res) {
  const hasil = await service.detailPesanan(idValid(req.params.id));
  return res.json({ success: true, data: hasil });
}

export async function buat(req, res) {
  const hasil = await service.buatPesanan(pesananValid(req.body));
  return res
    .status(201)
    .location(`/api/pesanan/${hasil.id}`)
    .json({ success: true, data: hasil });
}