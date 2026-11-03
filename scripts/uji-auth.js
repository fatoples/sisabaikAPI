
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { pool } from "../src/db/pool.js";
import { verifikasiPenyedia } from "./verifikasi-penyedia.js";

const baseUrl = "http://127.0.0.1:3000";
const marker = `Uji Auth ${randomBytes(5).toString("hex")}`;
const password = `Uji-Aman-${randomBytes(12).toString("hex")}!`;

let checks = 0;
let idPenawaran;
let idPesanan;

const akun = {
    rina: {
        namaLengkap: "Rina Uji",
        email: `rina.${randomBytes(4).toString("hex")}@example.test`,
        namaUsaha: "Usaha Rina Uji",
        alamat: "Padang",
        nomorTelepon: "081234567890",
    },
    budi: {
        namaLengkap: "Budi Uji",
        email: `budi.${randomBytes(4).toString("hex")}@example.test`,
        namaUsaha: "Usaha Budi Uji",
        alamat: "Padang",
        nomorTelepon: "081234567891",
    },
    siti: {
        namaLengkap: "Siti Uji",
        email: `siti.${randomBytes(4).toString("hex")}@example.test`,
    },
    andi: {
        namaLengkap: "Andi Uji",
        email: `andi.${randomBytes(4).toString("hex")}@example.test`,
    },
};

async function api(path, method = "GET", body, token) {
    const headers = {};

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await response.text();

    return {
        status: response.status,
        headers: response.headers,
        body: text ? JSON.parse(text) : null,
    };
}

function status(response, expected) {
    assert.equal(
        response.status,
        expected,
        `HTTP ${response.status}; code=${response.body?.error?.code ?? response.body?.code ?? "tidak ada kode"}`,
    );

    checks++;
    return response;
}

function data(response) {
    return response.body?.data;
}

async function login(email) {
    const response = status(
        await api("/api/auth/login", "POST", {
            email,
            kataSandi: password,
        }),
        200,
    );

    const hasil = data(response);
    const token = hasil?.accessToken;

    assert.ok(token, "Access token login tidak ditemukan.");
    assert.equal(hasil.tokenType, "Bearer");
    assert.ok(hasil.pengguna?.id);

    checks += 3;

    return token;
}

async function registrasiPembeli(pengguna) {
    return status(
        await api("/api/auth/registrasi", "POST", {
            namaLengkap: pengguna.namaLengkap,
            email: pengguna.email,
            kataSandi: password,
        }),
        201,
    );
}

async function registrasiPenyedia(pengguna) {
    return status(
        await api("/api/auth/registrasi-penyedia", "POST", {
            namaLengkap: pengguna.namaLengkap,
            email: pengguna.email,
            kataSandi: password,
            namaUsaha: pengguna.namaUsaha,
            alamat: pengguna.alamat,
            nomorTelepon: pengguna.nomorTelepon,
        }),
        201,
    );
}

async function main() {
    const database = await pool.query(
        "SELECT current_database() AS nama",
    );

    assert.equal(database.rows[0].nama, "sisabaik_dev");
    checks++;

    console.log("Database:", database.rows[0].nama);

    status(await api("/api/pesanan"), 401);

    status(
        await api("/api/auth/saya", "GET", undefined, "token-tidak-valid"),
        401,
    );

    console.log("1. Pemeriksaan akses tanpa login berhasil.");

    const rinaDaftar = data(await registrasiPenyedia(akun.rina));
    const budiDaftar = data(await registrasiPenyedia(akun.budi));

    assert.equal(rinaDaftar.peran, "penyedia");
    assert.equal(budiDaftar.peran, "penyedia");
    checks += 2;

    await verifikasiPenyedia(pool, akun.rina.email);
    await verifikasiPenyedia(pool, akun.budi.email);

    const rinaDb = await pool.query(
        `
        SELECT u.id, u.kata_sandi_hash, py.status_verifikasi
        FROM pengguna u
        JOIN penyedia py ON py.pengguna_id = u.id
        WHERE u.email = $1
        `,
        [akun.rina.email],
    );

    assert.equal(rinaDb.rowCount, 1);
    assert.equal(rinaDb.rows[0].status_verifikasi, "terverifikasi");
    assert.ok(rinaDb.rows[0].kata_sandi_hash);
    checks += 3;

    const rinaToken = await login(akun.rina.email);
    const budiToken = await login(akun.budi.email);

    const rinaSaya = status(
        await api("/api/auth/saya", "GET", undefined, rinaToken),
        200,
    );

    assert.equal(data(rinaSaya).statusVerifikasi, "terverifikasi");
    checks++;

    console.log("2. Registrasi dan verifikasi penyedia berhasil.");

    await registrasiPembeli(akun.siti);
    await registrasiPembeli(akun.andi);

    const sitiDb = await pool.query(
        `
        SELECT peran, kata_sandi_hash
        FROM pengguna
        WHERE email = $1
        `,
        [akun.siti.email],
    );

    assert.equal(sitiDb.rows[0].peran, "pembeli");
    assert.ok(sitiDb.rows[0].kata_sandi_hash);
    checks += 2;

    status(
        await api("/api/auth/registrasi", "POST", {
            namaLengkap: "Penyamaran",
            email: `spoof.${randomBytes(4).toString("hex")}@example.test`,
            kataSandi: password,
            peran: "penyedia",
        }),
        400,
    );

    status(
        await api("/api/auth/registrasi", "POST", {
            namaLengkap: akun.siti.namaLengkap,
            email: akun.siti.email,
            kataSandi: password,
        }),
        409,
    );

    const sitiToken = await login(akun.siti.email);
    const sitiTokenKedua = await login(akun.siti.email);
    const andiToken = await login(akun.andi.email);

    console.log("3. Registrasi dan login pembeli berhasil.");

    const pesananAndiAwal = status(
        await api("/api/pesanan", "GET", undefined, andiToken),
        200,
    );

    assert.equal(data(pesananAndiAwal).length, 0);
    checks++;

    const loginSalah = status(
        await api("/api/auth/login", "POST", {
            email: akun.siti.email,
            kataSandi: "password-salah",
        }),
        401,
    );

    const loginTidakDikenal = status(
        await api("/api/auth/login", "POST", {
            email: `tidak.ada.${randomBytes(4).toString("hex")}@example.test`,
            kataSandi: password,
        }),
        401,
    );

    assert.deepEqual(loginSalah.body, loginTidakDikenal.body);
    checks++;

    console.log("4. Pemeriksaan login berhasil.");

    const payload = {
        nama: marker,
        kategori: "roti",
        hargaNormal: 10000,
        hargaPenawaran: 5000,
        stok: 5,
        satuan: "paket",
        status: "aktif",
        berakhirPada: new Date(Date.now() + 86400000).toISOString(),
    };

    status(
        await api("/api/penawaran", "POST", payload, sitiToken),
        403,
    );

    status(
        await api(
            "/api/penawaran",
            "POST",
            {
                ...payload,
                penyediaId: "999999",
            },
            rinaToken,
        ),
        400,
    );

    const buatPenawaran = status(
        await api("/api/penawaran", "POST", payload, rinaToken),
        201,
    );

    const penawaran = data(buatPenawaran);

    assert.ok(penawaran?.id);
    assert.equal(penawaran.nama, marker);
    assert.equal(penawaran.penyedia, akun.rina.namaUsaha);
    checks += 3;

    idPenawaran = penawaran.id;

    console.log("5. Pembuatan penawaran berhasil.");

    status(
        await api(
            `/api/penawaran/${idPenawaran}`,
            "PUT",
            payload,
            budiToken,
        ),
        409,
    );

    status(
        await api(
            `/api/penawaran/${idPenawaran}`,
            "DELETE",
            undefined,
            budiToken,
        ),
        404,
    );

    console.log("6. Pengujian kepemilikan penawaran berhasil.");

    status(
        await api(
            "/api/pesanan",
            "POST",
            {
                items: [
                    {
                        penawaranId: idPenawaran,
                        kuantitas: 1,
                    },
                ],
            },
            rinaToken,
        ),
        403,
    );

    status(
        await api(
            "/api/pesanan",
            "POST",
            {
                items: [
                    {
                        penawaranId: idPenawaran,
                        kuantitas: 1,
                    },
                ],
                emailPembeli: akun.andi.email,
            },
            sitiToken,
        ),
        400,
    );

    const buatPesanan = status(
        await api(
            "/api/pesanan",
            "POST",
            {
                items: [
                    {
                        penawaranId: idPenawaran,
                        kuantitas: 1,
                    },
                ],
            },
            sitiToken,
        ),
        201,
    );

    const pesanan = data(buatPesanan);

    assert.ok(pesanan?.id);
    idPesanan = pesanan.id;
    checks++;

    console.log("7. Pembuatan pesanan berhasil.");

    status(
        await api(
            `/api/pesanan/${idPesanan}`,
            "GET",
            undefined,
            andiToken,
        ),
        404,
    );

    status(
        await api(
            `/api/pesanan/${idPesanan}`,
            "GET",
            undefined,
            budiToken,
        ),
        404,
    );

    status(
        await api(
            `/api/pesanan/${idPesanan}`,
            "GET",
            undefined,
            rinaToken,
        ),
        200,
    );

    const pesananSiti = status(
        await api(
            "/api/pesanan",
            "GET",
            undefined,
            sitiToken,
        ),
        200,
    );

    assert.ok(
        data(pesananSiti).some(
            (item) => String(item.id) === String(idPesanan),
        ),
    );
    checks++;

    console.log("8. Pembatasan akses pesanan berhasil.");

    const penawaranBudi = status(
        await api(
            "/api/penawaran/milik-saya",
            "GET",
            undefined,
            budiToken,
        ),
        200,
    );

    assert.equal(
        data(penawaranBudi).some(
            (item) => String(item.id) === String(idPenawaran),
        ),
        false,
    );
    checks++;

    console.log("9. Daftar penawaran penyedia berhasil.");

    const payloadUbah = {
        ...payload,
        stok: 4,
        hargaPenawaran: 6000,
    };

    const ubahPenawaran = status(
        await api(
            `/api/penawaran/${idPenawaran}`,
            "PUT",
            payloadUbah,
            rinaToken,
        ),
        200,
    );

    assert.equal(data(ubahPenawaran).stok, 4);
    assert.equal(data(ubahPenawaran).hargaPenawaran, 6000);
    checks += 2;

    const pesananSnapshot = status(
        await api(
            `/api/pesanan/${idPesanan}`,
            "GET",
            undefined,
            sitiToken,
        ),
        200,
    );

    assert.equal(Number(data(pesananSnapshot).total), 5000);
    checks++;

    status(
        await api(
            `/api/penawaran/${idPenawaran}`,
            "DELETE",
            undefined,
            rinaToken,
        ),
        409,
    );

    console.log("10. Update penawaran dan snapshot pesanan berhasil.");

    const payloadDraft = {
        ...payload,
        nama: `${marker} Draft`,
        status: "draft",
    };

    const buatDraft = status(
        await api(
            "/api/penawaran",
            "POST",
            payloadDraft,
            rinaToken,
        ),
        201,
    );

    const idDraft = data(buatDraft).id;

    assert.ok(idDraft);
    checks++;

    status(
        await api(`/api/penawaran/${idDraft}`),
        404,
    );

    status(
        await api(
            `/api/penawaran/${idDraft}`,
            "DELETE",
            undefined,
            rinaToken,
        ),
        204,
    );

    console.log("11. Pengujian penawaran draft berhasil.");

        status(
        await api(
            "/api/auth/logout",
            "POST",
            {},
            sitiToken,
        ),
        204,
    );

    status(
        await api(
            "/api/auth/saya",
            "GET",
            undefined,
            sitiToken,
        ),
        401,
    );

    status(
        await api(
            "/api/auth/saya",
            "GET",
            undefined,
            sitiTokenKedua,
        ),
        401,
    );

    console.log("12. Logout dan pencabutan sesi berhasil.");

    console.log("\n================================");
    console.log("SEMUA PENGUJIAN SELESAI");
    console.log(`Total pemeriksaan: ${checks}`);
    console.log("================================");
    console.log("Akun pengujian:");
    console.log("Rina:", akun.rina.email);
    console.log("Budi:", akun.budi.email);
    console.log("Siti:", akun.siti.email);
    console.log("Andi:", akun.andi.email);
    console.log("ID Penawaran:", idPenawaran);
    console.log("ID Pesanan:", idPesanan);
}

main()
    .catch((error) => {
        console.error("\nPENGUJIAN GAGAL");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
