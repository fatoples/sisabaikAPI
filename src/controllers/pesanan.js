
import * as service from "../services/pesanan.js";
import { idValid, halamanValid } from "../lib/api.js";
import { pesananSesiValid } from "../lib/input-auth.js";

export async function daftar(req, res) {
    const hasil = await service.daftarPesanan(
        halamanValid(req.query),
        req.pengguna,
    );

    return res.json({
        success: true,
        ...hasil,
    });
}

export async function detail(req, res) {
    const hasil = await service.detailPesanan(
        idValid(req.params.id),
        req.pengguna,
    );

    return res.json({
        success: true,
        data: hasil,
    });
}

export async function buat(req, res) {
    const hasil = await service.buatPesanan(
        pesananSesiValid(req.body, req.pengguna),
        req.pengguna,
    );

    return res
        .status(201)
        .location(`/api/pesanan/${hasil.id}`)
        .json({
            success: true,
            data: hasil,
        });
}
