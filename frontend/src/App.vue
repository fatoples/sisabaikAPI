
<script setup>
import {
    computed,
    nextTick,
    onMounted,
    onUnmounted,
    ref,
} from "vue";

import FilterPenawaran from "./components/FilterPenawaran.vue";
import KartuPenawaran from "./components/KartuPenawaran.vue";
import FormPenawaran from "./components/FormPenawaran.vue";
import Ikon from "./components/Ikon.vue";

import logo from "./assets/brand-mark.svg";
import makanan from "./assets/food-bowl.svg";
import roti from "./assets/food-bread.svg";

import {
    buatDataLatihan,
    penyediaLatihan,
} from "./data/penawaran-latihan.js";

import {
    formatRupiah,
    tersedia,
} from "./lib/tampilan.js";

const penawaran = ref(buatDataLatihan());
const modeTampilan = ref("pembeli");
const pencarian = ref("");
const kategori = ref("");
const pesan = ref("");
const pilihanId = ref(null);
const waktuSekarang = ref(Date.now());

const konten = ref(null);
const ringkasanPilihan = ref(null);

let timer;
let idBerikutnya = 7;

onMounted(() => {
    timer = setInterval(() => {
        waktuSekarang.value = Date.now();
    }, 1000);
});

onUnmounted(() => {
    clearInterval(timer);
});

const penawaranTersedia = computed(() =>
    penawaran.value.filter((p) =>
        tersedia(p, waktuSekarang.value)
    )
);

const daftarKategori = computed(() =>
    [
        ...new Set(
            penawaranTersedia.value.map((p) => p.kategori)
        ),
    ].sort()
);

const katalog = computed(() => {
    const q = pencarian.value.trim().toLowerCase();

    return penawaranTersedia.value.filter((p) => {
        const cocokKategori =
            !kategori.value || p.kategori === kategori.value;

        const cocokPencarian =
            `${p.nama} ${p.penyedia}`
                .toLowerCase()
                .includes(q);

        return cocokKategori && cocokPencarian;
    });
});

const milikRina = computed(() =>
    penawaran.value.filter(
        (p) => p.penyediaId === penyediaLatihan.id
    )
);

const milikTersedia = computed(() =>
    milikRina.value.filter((p) =>
        tersedia(p, waktuSekarang.value)
    )
);

const pilihan = computed(() =>
    penawaranTersedia.value.find(
        (p) => p.id === pilihanId.value
    ) ?? null
);

const jumlahUnit = computed(() =>
    penawaranTersedia.value.reduce(
        (jumlah, p) => jumlah + p.stok,
        0
    )
);

const jumlahUnitMilik = computed(() =>
    milikTersedia.value.reduce(
        (jumlah, p) => jumlah + p.stok,
        0
    )
);

const jumlahPenyedia = computed(() =>
    new Set(
        penawaranTersedia.value.map((p) => p.penyediaId)
    ).size
);

function resetFilter() {
    pencarian.value = "";
    kategori.value = "";
}

function ubahMode(nilai) {
    modeTampilan.value = nilai;
    pesan.value = "";
}

async function pilihPenawaran(id) {
    if (
        !penawaranTersedia.value.some((p) => p.id === id)
    ) {
        return;
    }

    pilihanId.value = id;
    pesan.value = "Pilihan Anda diperbarui.";

    await nextTick();
    ringkasanPilihan.value?.focus();
}

function tambahPenawaran(data) {
    penawaran.value.unshift({
        ...data,
        id: String(idBerikutnya++),
        penyediaId: penyediaLatihan.id,
        penyedia: penyediaLatihan.nama,
        dibuatPada: new Date().toISOString(),
    });

    pesan.value = "Penawaran ditambahkan ke daftar Anda.";
}
</script>

<template>
    <a
        class="lewati"
        href="#konten"
        @click.prevent="konten?.focus()"
    >
        Lewati ke konten
    </a>

    <header class="site-header">
        <div class="container header-inner">
            <a
                class="brand"
                href="#konten"
                @click="ubahMode('pembeli')"
            >
                <img
                    :src="logo"
                    width="42"
                    height="42"
                    alt=""
                />

                <span>
                    Sisa<span class="brand-accent">Baik</span>
                    <small>
                        kesempatan kedua, kebaikan baru
                    </small>
                </span>
            </a>

            <div class="mode-control">
                <label for="mode">Tampilan</label>

                <select
                    id="mode"
                    v-model="modeTampilan"
                    @change="pesan = ''"
                >
                    <option value="pembeli">Pembeli</option>
                    <option value="penyedia">Penyedia Rina</option>
                </select>
            </div>
        </div>
    </header>

    <main id="konten" ref="konten" tabindex="-1">
        <p
            v-if="pesan"
            class="container session-message"
            role="status"
            aria-live="polite"
        >
            <Ikon nama="cek" />
            {{ pesan }}
        </p>

        <template v-if="modeTampilan === 'pembeli'">
            <section
                class="hero"
                aria-labelledby="judul-utama"
            >
                <div class="container hero-layout">
                    <div class="hero-copy">
                        <p class="eyebrow">
                            <span class="eyebrow-dot"></span>
                            Setiap porsi punya kesempatan kedua
                        </p>

                        <h1 id="judul-utama">
                            Makanan enak.
                            <br />
                            <span>Harga lebih ramah.</span>
                            <br />
                            Dampak lebih baik.
                        </h1>

                        <p class="hero-lead">
                            Temukan makanan berlebih yang masih
                            layak konsumsi. Nikmati harga khusus
                            atau penawaran gratis, sambil memberi
                            nilai baru pada stok yang tersedia.
                        </p>

                        <div class="button-group">
                            <a class="button" href="#katalog">
                                Jelajahi makanan
                                <Ikon nama="panah" />
                            </a>

                            <button
                                type="button"
                                class="button-secondary"
                                @click="ubahMode('penyedia')"
                            >
                                Saya punya usaha
                                <Ikon nama="toko" />
                            </button>
                        </div>

                        <div class="hero-values">
                            <span>
                                <Ikon nama="daun" />
                                Lebih sedikit terbuang
                            </span>

                            <span>
                                <Ikon nama="tas" />
                                Lebih banyak manfaat
                            </span>
                        </div>
                    </div>

                    <div class="hero-art">
                        <div class="hero-orbit"></div>

                        <img
                            class="hero-food"
                            :src="makanan"
                            width="640"
                            height="420"
                            alt="Ilustrasi sepiring makanan dengan nasi dan sayuran"
                            fetchpriority="high"
                        />

                        <div class="hero-art-note">
                            <span class="icon-tile">
                                <Ikon nama="daun" />
                            </span>

                            <div>
                                <strong>
                                    Masih layak. Masih bernilai.
                                </strong>

                                <small>
                                    Kesempatan baik dimulai dari sini.
                                </small>
                            </div>
                        </div>

                        <img
                            class="hero-bread"
                            :src="roti"
                            width="640"
                            height="420"
                            alt="Ilustrasi roti di atas papan kayu"
                        />

                        <span class="hero-art-label">
                            Ilustrasi menu
                        </span>
                    </div>
                </div>
            </section>

            <section
                id="katalog"
                class="section container"
                aria-labelledby="judul-katalog"
            >
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">
                            Kebaikan tersedia hari ini
                        </p>

                        <h2 id="judul-katalog">
                            Temukan makanan pilihan Anda
                        </h2>

                        <p class="muted">
                            Pilih sesuai kebutuhan.
                            Ambil langsung di penyedia.
                        </p>
                    </div>

                    <span class="outline-pill">
                        <Ikon nama="toko" />
                        {{ jumlahPenyedia }} penyedia
                    </span>
                </div>

                <dl
                    class="availability"
                    aria-label="Ketersediaan katalog"
                >
                    <div>
                        <dt>Penawaran tersedia</dt>
                        <dd>{{ penawaranTersedia.length }}</dd>
                    </div>

                    <div>
                        <dt>Unit tersedia</dt>
                        <dd>{{ jumlahUnit }}</dd>
                    </div>

                    <div>
                        <dt>Penyedia dengan stok tersedia</dt>
                        <dd>{{ jumlahPenyedia }}</dd>
                    </div>
                </dl>

                <FilterPenawaran
                    :pencarian="pencarian"
                    :kategori="kategori"
                    :daftar-kategori="daftarKategori"
                    @ubah-pencarian="pencarian = $event"
                    @ubah-kategori="kategori = $event"
                    @reset="resetFilter"
                />

                <p
                    class="catalog-hint"
                    role="status"
                    aria-live="polite"
                >
                    <Ikon nama="tas" />
                    {{ katalog.length }} penawaran cocok.
                </p>

                <div
                    v-if="katalog.length === 0"
                    class="empty-state"
                >
                    <span class="icon-tile">
                        <Ikon nama="cari" />
                    </span>

                    <h3>
                        Belum ada makanan yang cocok
                    </h3>

                    <p class="muted">
                        Coba kata lain atau tampilkan semua kategori.
                    </p>

                    <button
                        type="button"
                        class="button-secondary"
                        @click="resetFilter"
                    >
                        Tampilkan semua
                    </button>
                </div>

                <div
                    v-else
                    class="daftar catalog-grid"
                >
                    <KartuPenawaran
                        v-for="p in katalog"
                        :key="p.id"
                        :penawaran="p"
                        :waktu-sekarang="waktuSekarang"
                        :boleh-pilih="true"
                        @pilih="pilihPenawaran"
                    />
                </div>

                <section
                    v-if="pilihan"
                    ref="ringkasanPilihan"
                    tabindex="-1"
                    class="checkout-panel"
                    aria-labelledby="judul-pilihan"
                >
                    <div>
                        <p class="eyebrow">Pilihan Anda</p>

                        <h3 id="judul-pilihan">
                            {{ pilihan.nama }}
                        </h3>

                        <p class="muted">
                            {{ pilihan.penyedia }}
                        </p>
                    </div>

                    <p class="harga">
                        {{ formatRupiah(pilihan.hargaPenawaran) }}
                        <span>/ {{ pilihan.satuan }}</span>
                    </p>

                    <p class="muted">
                        Pilihan ini belum menjadi pesanan.
                    </p>

                    <button
                        class="button-secondary"
                        type="button"
                        @click="pilihanId = null"
                    >
                        Hapus pilihan
                    </button>
                </section>
            </section>
        </template>

        <section
            v-else
            class="section container workspace"
            aria-labelledby="judul-penyedia"
        >
            <div class="section-heading">
                <div>
                    <p class="eyebrow">Ruang usaha Anda</p>

                    <h1 id="judul-penyedia">
                        Kelola penawaran
                    </h1>

                    <p class="muted">
                        {{ penyediaLatihan.nama }}
                    </p>
                </div>

                <span class="outline-pill">
                    <Ikon nama="toko" />
                    Penyedia
                </span>
            </div>

            <dl
                class="availability"
                aria-label="Ketersediaan milik Rina"
            >
                <div>
                    <dt>Penawaran saya</dt>
                    <dd>{{ milikRina.length }}</dd>
                </div>

                <div>
                    <dt>Penawaran tersedia</dt>
                    <dd>{{ milikTersedia.length }}</dd>
                </div>

                <div>
                    <dt>Unit tersedia</dt>
                    <dd>{{ jumlahUnitMilik }}</dd>
                </div>
            </dl>

            <div class="provider-layout">
                <section
                    class="panel"
                    aria-labelledby="judul-form"
                >
                    <p class="eyebrow">
                        <Ikon nama="plus" />
                        Tambahkan kesempatan
                    </p>

                    <h2 id="judul-form">
                        Penawaran baru
                    </h2>

                    <p class="muted panel-intro">
                        Tuliskan makanan, harga, dan batas
                        waktu pengambilannya.
                    </p>

                    <FormPenawaran @simpan="tambahPenawaran" />
                </section>

                <aside class="provider-guide">
                    <span class="icon-tile">
                        <Ikon nama="daun" />
                    </span>

                    <h2>
                        Masih bernilai untuk orang lain.
                    </h2>

                    <p>
                        Utamakan makanan yang masih layak konsumsi.
                        Jelaskan jumlah, satuan, dan harga dengan jujur.
                    </p>

                    <div class="guide-step">
                        <span>1</span>
                        <p>
                            Siapkan makanan dan tetapkan batas pengambilan.
                        </p>
                    </div>

                    <div class="guide-step">
                        <span>2</span>
                        <p>
                            Pilih status draft atau aktif sesuai kesiapan.
                        </p>
                    </div>

                    <div class="guide-step">
                        <span>3</span>
                        <p>
                            Periksa kembali daftar penawaran Anda.
                        </p>
                    </div>

                    <img
                        :src="makanan"
                        width="640"
                        height="420"
                        alt=""
                        loading="lazy"
                    />
                </aside>
            </div>

            <div class="section-heading offer-list-heading">
                <div>
                    <p class="eyebrow">Daftar milik Anda</p>

                    <h2>
                        Penawaran {{ penyediaLatihan.nama }}
                    </h2>
                </div>

                <span class="outline-pill">
                    {{ milikRina.length }} penawaran
                </span>
            </div>

            <p
                v-if="milikRina.length === 0"
                class="empty-state"
            >
                Belum ada penawaran. Mulai dengan formulir di atas.
            </p>

            <div
                v-else
                class="daftar catalog-grid"
            >
                <KartuPenawaran
                    v-for="p in milikRina"
                    :key="p.id"
                    :penawaran="p"
                    :waktu-sekarang="waktuSekarang"
                />
            </div>
        </section>
    </main>

    <footer class="site-footer">
        <div class="container footer-top">
            <div class="footer-brand">
                <a
                    class="brand"
                    href="#konten"
                    @click="ubahMode('pembeli')"
                >
                    <img
                        :src="logo"
                        width="42"
                        height="42"
                        alt=""
                    />

                    <span>SisaBaik</span>
                </a>

                <p>
                    Makanan punya nilai.
                    <br />
                    Kebaikan punya kesempatan.
                </p>
            </div>

            <div class="footer-note">
                <h2>
                    Tujuan yang baik, informasi yang jelas
                </h2>

                <p>
                    Menghubungkan makanan berlebih yang masih
                    layak konsumsi dengan orang yang membutuhkan,
                    sekaligus memulihkan nilai stok usaha.
                </p>
            </div>
        </div>

        <div class="container footer-bottom">
            <p>
                Kesempatan kedua untuk makanan yang masih bernilai.
            </p>

            <p>SisaBaik</p>
        </div>
    </footer>
</template>
