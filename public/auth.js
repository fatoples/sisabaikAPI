
"use strict";

const el = (id) => document.getElementById(id);

let token = null;
let pengguna = null;
let sibuk = false;

function tampilSesi() {
    el("identitas").textContent = pengguna
        ? `${pengguna.namaLengkap} (${pengguna.peran})`
        : "Belum login.";

    el("login").hidden = Boolean(pengguna);
    el("registrasi").hidden = Boolean(pengguna);
    el("logout").hidden = !pengguna;

    const penyedia = pengguna?.peran === "penyedia";
    const siapJual =
        penyedia &&
        pengguna.statusVerifikasi === "terverifikasi";

    el("area-profil").hidden = !penyedia;
    el("area-penyedia").hidden = !siapJual;

    el("area-pesanan").hidden = !(
        pengguna?.peran === "pembeli" || siapJual
    );

    el("profil-usaha").textContent = penyedia
        ? `${pengguna.namaUsaha} - ${pengguna.alamatUsaha}`
        : "";

    el("status-usaha").textContent = penyedia
        ? `Status peninjauan: ${pengguna.statusVerifikasi}.`
        : "";
}

function tampilFormUsaha() {
    const perlu = el("jenis-akun").value === "penyedia";

    el("profil-daftar").hidden = !perlu;

    el("profil-daftar")
        .querySelectorAll("input")
        .forEach((input) => {
            input.disabled = !perlu;
            input.required = perlu;
        });
}

el("jenis-akun").addEventListener("change", tampilFormUsaha);

function hapusSesi() {
    token = null;
    pengguna = null;

    el("pesanan").textContent = "";
    el("milik").textContent = "";

    tampilSesi();
}

async function api(path, method = "GET", body, privat = true) {
    const headers = {};

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (privat && token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 204) {
        return null;
    }

    const hasil = await response.json();

    if (!response.ok) {
        if (response.status === 401 && privat) {
            hapusSesi();
        }

        throw new Error(
            `${response.status} ${hasil.error?.code ?? "ERROR"}: ${
                hasil.error?.message ?? "Terjadi kesalahan."
            }`,
        );
    }

    return hasil;
}

async function kerjakan(aksi) {
    if (sibuk) return;

    sibuk = true;

    document.querySelectorAll("button").forEach((b) => {
        b.disabled = true;
    });

    try {
        el("pesan").textContent = "";
        await aksi();
    } catch (error) {
        el("pesan").textContent = error.message;
    } finally {
        sibuk = false;

        document.querySelectorAll("button").forEach((b) => {
            b.disabled = false;
        });
    }
}

async function katalog() {
    const hasil = await api(
        "/api/penawaran?limit=50",
        "GET",
        undefined,
        false,
    );

    el("katalog").replaceChildren();

    for (const p of hasil.data) {
        const tr = document.createElement("tr");

        for (const nilai of [
            p.id,
            p.nama,
            p.hargaPenawaran,
            `${p.stok} ${p.satuan}`,
        ]) {
            const td = document.createElement("td");
            td.textContent = nilai;
            tr.append(td);
        }

        const td = document.createElement("td");

        if (pengguna?.peran === "pembeli") {
            const b = document.createElement("button");

            b.type = "button";
            b.textContent = "Pesan 1 unit";

            b.addEventListener("click", () =>
                kerjakan(async () => {
                    const r = await api("/api/pesanan", "POST", {
                        items: [
                            {
                                penawaranId: p.id,
                                kuantitas: 1,
                            },
                        ],
                    });

                    el("pesan").textContent =
                        `Pesanan ${r.data.id} dibuat. Ini masih reservasi.`;

                    await katalog();
                }),
            );

            td.append(b);
        } else {
            td.textContent = "Login sebagai pembeli untuk memesan.";
        }

        tr.append(td);
        el("katalog").append(tr);
    }
}

el("login").addEventListener("submit", (e) => {
    e.preventDefault();

    kerjakan(async () => {
        const r = await api(
            "/api/auth/login",
            "POST",
            {
                email: el("email-login").value,
                kataSandi: el("sandi-login").value,
            },
            false,
        );

        token = r.data.accessToken;
        pengguna = (await api("/api/auth/saya")).data;

        el("sandi-login").value = "";

        tampilSesi();
        await katalog();

        el("pesan").textContent =
            "Login berhasil. Token hanya disimpan di memori halaman.";
    });
});

el("registrasi").addEventListener("submit", (e) => {
    e.preventDefault();

    kerjakan(async () => {
        const kataSandi = el("sandi-daftar").value;

        if (
            [...kataSandi].length < 15 ||
            new TextEncoder().encode(kataSandi).length > 72
        ) {
            throw new Error(
                "Kata sandi minimal 15 karakter dan maksimal 72 byte UTF-8.",
            );
        }

        if (kataSandi !== el("sandi-ulang").value) {
            throw new Error("Kedua kata sandi harus sama.");
        }

        const penyedia = el("jenis-akun").value === "penyedia";

        const data = {
            namaLengkap: el("nama-daftar").value,
            email: el("email-daftar").value,
            kataSandi,
        };

        if (penyedia) {
            Object.assign(data, {
                namaUsaha: el("usaha-daftar").value,
                alamat: el("alamat-daftar").value,
                nomorTelepon: el("telepon-daftar").value,
            });
        }

        await api(
            penyedia
                ? "/api/auth/registrasi-penyedia"
                : "/api/auth/registrasi",
            "POST",
            data,
            false,
        );

        el("email-login").value = data.email;
        el("registrasi").reset();

        tampilFormUsaha();

        el("pesan").textContent = penyedia
            ? "Akun berhasil dibuat. Silakan login; izin jual menunggu peninjauan."
            : "Pendaftaran berhasil. Silakan login dengan kata sandi Anda.";
    });
});

el("periksa-status").addEventListener("click", () =>
    kerjakan(async () => {
        pengguna = (await api("/api/auth/saya")).data;

        tampilSesi();
        await katalog();

        el("pesan").textContent =
            "Status akun diperbarui dari server.";
    }),
);

el("logout").addEventListener("click", () =>
    kerjakan(async () => {
        await api("/api/auth/logout", "POST", {});
        hapusSesi();

        await katalog();

        el("pesan").textContent =
            "Semua sesi akun telah dicabut.";
    }),
);

el("penawaran").addEventListener("submit", (e) => {
    e.preventDefault();

    kerjakan(async () => {
        const r = await api("/api/penawaran", "POST", {
            nama: el("nama-produk").value,
            kategori: el("kategori").value,
            hargaNormal: Number(el("normal").value),
            hargaPenawaran: Number(el("hemat").value),
            stok: Number(el("stok").value),
            satuan: el("satuan").value,
            status: el("status").value,
            berakhirPada: new Date(
                el("berakhir").value,
            ).toISOString(),
        });

        el("pesan").textContent =
            `Penawaran ${r.data.id} dibuat untuk profil penyedia Anda.`;

        el("penawaran").reset();

        await katalog();
    });
});

el("muat-katalog").addEventListener("click", () =>
    kerjakan(katalog),
);

el("muat-milik").addEventListener("click", () =>
    kerjakan(async () => {
        el("milik").textContent = JSON.stringify(
            await api("/api/penawaran/milik-saya?limit=50"),
            null,
            2,
        );
    }),
);

el("muat-pesanan").addEventListener("click", () =>
    kerjakan(async () => {
        el("pesanan").textContent = JSON.stringify(
            await api("/api/pesanan?limit=50"),
            null,
            2,
        );
    }),
);

tampilSesi();
tampilFormUsaha();

kerjakan(katalog);
