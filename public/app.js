
"use strict";

const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

document.addEventListener("DOMContentLoaded", () => {
    void muatPenawaran();

    document
        .querySelector("#muat-ulang")
        .addEventListener("click", muatPenawaran);
});

async function muatPenawaran() {
    const status = document.querySelector("#status");
    const katalog = document.querySelector("#katalog");
    const tombol = document.querySelector("#muat-ulang");

    tombol.disabled = true;

    try {
        status.classList.remove("error");
        status.textContent = "Memuat data...";

        const respons = await fetch(
            "/api/penawaran?tersedia=true&limit=50"
        );

        const body = await respons.json();

        if (!respons.ok) {
            throw new Error(
                body.error?.message || "Data gagal dimuat."
            );
        }

        katalog.replaceChildren(
            ...body.data.map(buatKartu)
        );

        status.textContent =
            `${body.data.length} penawaran berhasil ditampilkan.`;

    } catch (error) {
        status.textContent = error.message;
        status.classList.add("error");

    } finally {
        tombol.disabled = false;
    }
}

function buatKartu(item) {
    const artikel = document.createElement("article");

    const judul = document.createElement("h3");
    judul.textContent = item.nama;

    const detail = document.createElement("p");

    detail.textContent =
        `ID: ${item.id}\n` +
        `Stok: ${item.stok} ${item.satuan}\n` +
        `Harga: ${rupiah.format(item.hargaPenawaran)}`;

    const tombol = document.createElement("a");

    tombol.className = "tombol";
    tombol.href = "/auth.html";
    tombol.textContent = "Login untuk memesan";

    artikel.append(judul, detail, tombol);

    return artikel;
}
