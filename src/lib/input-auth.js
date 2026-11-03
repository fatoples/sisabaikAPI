import {
    objekValid,
    teksValid,
    salah,
    penawaranValid,
    pesananValid,
        }    from "./api.js";

function emailValid (value) {
    const email = teksValid(value, "email", 3, 254) .toLowerCase () ;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test (email) ) {
        salah ("Format email tidak valid.");
    }
    return email;
}
export function kataSandiValid(value, baru = true) {
    if (typeof value !== "string" || value. includes ("\0")) {
        salah ("kataSandi wajib berupa teks tanpa karakter NUL.");
    }
    const jumlah = [...value] . length;
    if (jumlah < (baru ? 15 : 1) || Buffer.byteLength (value, "utf8") > 72) {
        salah ("Kata sandi baru minimal 15 karakter dan maksimum 72 byte UTF-8.");
    }
    return value;
}

export function registrasiValid (body) {
    objekValid(body, ["namaLengkap", "email", "kataSandi"]);
    return {
        namaLengkap: teksValid (body.namaLengkap, "namaLengkap", 2, 100),
        email: emailValid (body.email),
        kataSandi: kataSandiValid (body. kataSandi),
    };
}

export function registrasiPenyediaValid (body) {
    objekValid (body, [
        "namaLengkap",
        "email",
        "kataSandi",
        "namaUsaha",
        "alamat",
        "nomorTelepon",
    ]);
    const nomor = teksValid(body.nomorTelepon, "nomorTelepon", 8, 30).replace(
    /[\s()-]/g,
    "",
);

if (!/^\+?[0-9]{8,15}$/.test(nomor)) {
    salah(
        "Nomor telepon harus berisi 8-15 digit, dengan tanda + di awal bila diperlukan.",
    );
}
    return {
        ...registrasiValid ({
            namaLengkap: body. namaLengkap,
            email: body.email,
            kataSandi: body. kataSandi,
        }),
        namaUsaha: teksValid (body.namaUsaha, "namaUsaha", 2, 120),
        alamat: teksValid (body.alamat, "alamat", 5, 1000),
        nomorTelepon: nomor,
    };
}

export function loginValid (body) {
    objekValid(body, ["email", "kataSandi"]);
    return {
        email: emailValid (body.email),
        kataSandi: kataSandiValid (body.kataSandi, false),
    };
}

export function penawaranSesiValid (body, pengguna) {
    objekValid (body, [
        "nama",
        "kategori",
        "hargaNormal",
        "hargaPenawaran",
        "stok",
        "satuan",
        "status",
        "berakhirPada",
    ]);
    return penawaranValid({ ... body, penyediaId: pengguna.penyediaId });
}

export function pesananSesiValid (body, pengguna) {
    objekValid(body, ["items"]);
    const data = pesananValid({
        emailPembeli: pengguna.email,
        items: body.items,
    });
    return { pembeliId: pengguna.id, items: data.items };
}