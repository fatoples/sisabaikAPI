<script setup>
import { nextTick } from "vue";
import Ikon from "../components/Ikon.vue";
import makanan from "../assets/food-bowl.svg";
import roti from "../assets/food-bread.svg";
import bahan from "../assets/food-produce.svg";
import { ref, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import FilterPenawaran from "../components/FilterPenawaran.vue";
import KartuPenawaran from "../components/KartuPenawaran.vue";
import Paginasi from "../components/Paginasi.vue";
import StatusBaca from "../components/StatusBaca.vue";
import { useBaca } from "../composables/useBaca.js";
import { api, pesanError } from "../lib/api.js";
import { sesi } from "../lib/sesi.js";
import { formatRupiah, tersedia } from "../lib/tampilan.js";

const router = useRouter();
const ringkasan = ref(null);
function jelajahi() {
  document.getElementById("katalog")?.scrollIntoView({ block: "start" });
}
const pencarian = ref("");
const kategori = ref("");
const page = ref(1);
const limit = 2;
const pilihan = ref(null);
const kuantitas = ref(1);
const memesan = ref(false);
const errorPesan = ref("");
const waktu = ref(Date.now());
const timer = setInterval(() => {
  waktu.value = Date.now();
}, 1000);
let tunda;
const kirim = new AbortController();
onUnmounted(() => {
  clearInterval(timer);
  clearTimeout(tunda);
  kirim.abort();
});
const { data, sibuk, error, muat, batalkan } = useBaca((signal) => {
  const query = new URLSearchParams({
    q: pencarian.value.trim(),
    kategori: kategori.value,
    page: String(page.value),
    limit: String(limit),
  });
  return api(`/api/penawaran?${query}`, { signal });
});
watch(
  [pencarian, kategori, page],
  () => {
    clearTimeout(tunda);
    batalkan();
    pilihan.value = null;
    tunda = setTimeout(muat, 300);
  },
  { immediate: true },
);
watch(data, (hasil) => {
  if (hasil && page.value > Math.max(1, hasil.meta.totalPages)) {
    page.value = Math.max(1, hasil.meta.totalPages);
  }
});
function cari(nilai) {
  pencarian.value = nilai;
  page.value = 1;
}
function filter(nilai) {
  kategori.value = nilai;
  page.value = 1;
}
function reset() {
  cari("");
  filter("");
}
async function pilih(id) {
  pilihan.value = data.value?.data.find((p) => p.id === id) ?? null;
  kuantitas.value = 1;
  errorPesan.value = "";
  await nextTick();
  ringkasan.value?.focus();
  ringkasan.value?.scrollIntoView?.({ block: "center" });
}
async function pesan() {
  if (memesan.value || sesi.keluar) return;
  const p = pilihan.value;
  if (sesi.pengguna?.peran !== "pembeli") return;
  if (
    !p ||
    !tersedia(p, Date.now()) ||
    !Number.isSafeInteger(kuantitas.value) ||
    kuantitas.value < 1 ||
    kuantitas.value > Math.min(1000, p.stok)
  ) {
    errorPesan.value = "Periksa pilihan, waktu berlaku, dan jumlah unit.";
    return;
  }
  memesan.value = true;
  errorPesan.value = "";
  try {
    const hasil = await api("/api/pesanan", {
      method: "POST",
      auth: true,
      signal: kirim.signal,
      body: {
        items: [{ penawaranId: p.id, kuantitas: kuantitas.value }],
      },
    });
    await router.push(`/pesanan/${hasil.data.id}`);
  } catch (e) {
    if (e.name !== "AbortError") {
      errorPesan.value = pesanError(e);
    }
  } finally {
    memesan.value = false;
  }
}
</script>

<template>
  <section class="hero" aria-labelledby="judul-utama">
    <div class="container hero-layout">
      <div class="hero-copy">
        <p class="eyebrow">
          <span class="eyebrow-dot"></span>Setiap porsi punya kesempatan kedua
        </p>
        <h1 id="judul-utama">
          Makanan enak.<br /><span>Harga lebih ramah.</span><br />Dampak lebih
          baik.
        </h1>
        <p class="hero-lead">
          Temukan makanan berlebih yang masih layak konsumsi. Nikmati harga
          khusus atau penawaran gratis, sambil memberi nilai baru pada stok yang
          tersedia.
        </p>
        <div class="button-group">
          <button type="button" @click="jelajahi">
            Jelajahi makanan<Ikon nama="panah" /></button
          ><RouterLink
            class="button button-secondary"
            :to="
              sesi.pengguna?.peran === 'penyedia'
                ? '/akun/penyedia'
                : '/daftar?peran=penyedia'
            "
            >Saya punya usaha<Ikon nama="toko"
          /></RouterLink>
        </div>
        <div class="hero-values">
          <span><Ikon nama="daun" />Lebih sedikit terbuang</span
          ><span><Ikon nama="tas" />Lebih banyak manfaat</span>
        </div>
      </div>
      <div class="hero-art" aria-label="Ilustrasi makanan dan roti">
        <div class="hero-orbit"></div>
        <img
          class="hero-food"
          :src="makanan"
          width="640"
          height="420"
          alt="Ilustrasi sepiring makanan dengan sayuran, nasi, dan lauk"
          fetchpriority="high"
        />
        <div class="hero-art-note">
          <span class="icon-tile"><Ikon nama="daun" /></span>
          <div>
            <strong>Masih layak. Masih bernilai.</strong
            ><small>Kesempatan baik dimulai dari sini.</small>
          </div>
        </div>
        <img
          class="hero-bread"
          :src="roti"
          width="640"
          height="420"
          alt="Ilustrasi roti di atas papan kayu"
        />
        <span class="hero-art-label">Ilustrasi menu, bukan foto produk.</span>
      </div>
    </div>
  </section>
  <div class="container value-bar" aria-label="Manfaat SisaBaik">
    <div>
      <Ikon nama="tas" /><span
        ><strong>Harga yang lebih bersahabat</strong
        ><small>Pilih penawaran sesuai kebutuhan.</small></span
      >
    </div>
    <div>
      <Ikon nama="toko" /><span
        ><strong>Peluang untuk usaha</strong
        ><small>Pulihkan nilai makanan berlebih.</small></span
      >
    </div>
    <div>
      <Ikon nama="daun" /><span
        ><strong>Kebaikan dari kebiasaan kecil</strong
        ><small>Utamakan makanan layak konsumsi.</small></span
      >
    </div>
  </div>
  <section
    id="katalog"
    class="section container"
    aria-labelledby="judul-katalog"
  >
    <div class="section-heading">
      <div>
        <p class="eyebrow">Pilih baik, nikmati baik</p>
        <h2 id="judul-katalog">Katalog makanan berlebih</h2>
        <p class="muted">
          Roti, makanan siap saji, dan bahan segar. Temukan yang cocok untuk
          Anda.
        </p>
      </div>
      <span class="outline-pill"
        ><Ikon nama="jam" />Perhatikan batas waktu</span
      >
    </div>
    <FilterPenawaran
      :pencarian="pencarian"
      :kategori="kategori"
      :daftar-kategori="['roti', 'makanan-siap-saji', 'bahan-segar']"
      @ubah-pencarian="cari"
      @ubah-kategori="filter"
      @reset="reset"
    />
    <StatusBaca :sibuk="sibuk" :error="error" @ulang="muat" />
    <p v-if="!sesi.pengguna" class="catalog-hint">
      <Ikon nama="info" />Login sebagai pembeli untuk memesan. Anda tetap bisa
      menjelajahi katalog.
    </p>
    <div v-if="data && data.data.length === 0" class="empty-state">
      <span class="icon-tile"><Ikon nama="cari" /></span>
      <h3>Tidak ada penawaran yang cocok.</h3>
      <p>
        Coba kata kunci lain atau reset filter. Penawaran aktif ditampilkan
        selama stok dan waktunya masih tersedia.
      </p>
      <button class="button-secondary" type="button" @click="reset">
        Tampilkan semua kategori
      </button>
    </div>
    <div v-if="data" class="daftar catalog-grid" :aria-busy="sibuk">
      <KartuPenawaran
        v-for="p in data.data"
        :key="p.id"
        :penawaran="p"
        :waktu-sekarang="waktu"
        :boleh-pilih="sesi.pengguna?.peran === 'pembeli' && !sesi.keluar"
        :ajak-login="!sesi.pengguna"
        @pilih="pilih"
      />
    </div>
    <Paginasi
      v-if="data"
      :meta="data.meta"
      :sibuk="sibuk || memesan"
      @halaman="page = $event"
    />
    <section
      v-if="pilihan && sesi.pengguna?.peran === 'pembeli'"
      ref="ringkasan"
      tabindex="-1"
      class="checkout-panel"
      aria-labelledby="judul-pilihan"
    >
      <div class="checkout-description">
        <p class="eyebrow">Pilihan Anda</p>
        <h3 id="judul-pilihan">Pesan {{ pilihan.nama }}</h3>
        <p>{{ pilihan.penyedia }}</p>
        <p class="checkout-price">
          {{ formatRupiah(pilihan.hargaPenawaran)
          }}<span>/ {{ pilihan.satuan }}</span>
        </p>
        <p class="muted">
          Harga dan ketersediaan dikonfirmasi saat pemesanan. Atur pengambilan
          dengan penyedia sebelum batas waktu.
        </p>
      </div>
      <div>
        <form @submit.prevent="pesan" :aria-busy="memesan">
          <fieldset :disabled="memesan || sesi.keluar">
            <legend>Jumlah pemesanan</legend>
            <label for="kuantitas">Jumlah {{ pilihan.satuan }}</label
            ><input
              id="kuantitas"
              v-model.number="kuantitas"
              type="number"
              min="1"
              :max="Math.min(1000, pilihan.stok)"
              step="1"
              required
            />
            <p class="field-hint">
              Tersedia {{ pilihan.stok }} {{ pilihan.satuan }}. Maksimum 1.000
              unit per item.
            </p>
            <label class="check-row payment-choice"
              ><input
                type="radio"
                name="metode-pembayaran"
                value="di-tempat"
                checked
              />
              <span>{{
                pilihan.hargaPenawaran === 0
                  ? "Gratis, tanpa pembayaran"
                  : "Bayar di tempat saat pengambilan"
              }}</span></label
            >
            <div class="button-group">
              <button type="submit">
                {{ memesan ? "Memproses…" : "Buat pesanan"
                }}<Ikon nama="panah" /></button
              ><button
                class="button-quiet"
                type="button"
                @click="pilihan = null"
              >
                Batal
              </button>
            </div>
          </fieldset>
        </form>
        <div v-if="errorPesan" class="notice notice-error">
          <div>
            <p role="alert">{{ errorPesan }}</p>
            <p>
              Jika hasil belum pasti, periksa Pesanan sebelum mengirim lagi.
            </p>
            <RouterLink to="/pesanan">Periksa pesanan saya</RouterLink
            ><button
              class="button-secondary"
              type="button"
              :disabled="memesan"
              @click="muat"
            >
              Perbarui katalog
            </button>
          </div>
        </div>
      </div>
    </section>
  </section>
  <section class="how-section section" aria-labelledby="judul-cara">
    <div class="container">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Sederhana dari awal</p>
          <h2 id="judul-cara">Tiga langkah, satu kesempatan baik.</h2>
        </div>
      </div>
      <div class="steps-grid">
        <article>
          <span class="step-number">01</span><Ikon nama="cari" />
          <h3>Temukan pilihan Anda</h3>
          <p>
            Cari makanan, bandingkan harga, dan periksa stok serta batas waktu
            penawaran.
          </p>
        </article>
        <article>
          <span class="step-number">02</span><Ikon nama="tas" />
          <h3>Pesan sesuai kebutuhan</h3>
          <p>
            Login sebagai pembeli, tentukan jumlah, dan lihat rincian pesanan
            yang tercatat.
          </p>
        </article>
        <article>
          <span class="step-number">03</span><Ikon nama="daun" />
          <h3>Koordinasikan pengambilan</h3>
          <p>
            Atur pengambilan bersama penyedia. Reservasi belum berarti makanan
            telah diambil.
          </p>
        </article>
      </div>
    </div>
  </section>
  <section class="container section">
    <div class="business-banner">
      <div>
        <p class="eyebrow">Untuk penyedia makanan</p>
        <h2>Stok berlebih,<br />peluang baru.</h2>
        <p>
          Tawarkan makanan yang masih layak konsumsi, pulihkan nilainya, dan
          catat perkembangan usaha Anda dalam satu tempat.
        </p>
        <RouterLink
          class="button button-light"
          :to="
            sesi.pengguna?.peran === 'penyedia'
              ? '/akun/penyedia'
              : '/daftar?peran=penyedia'
          "
          >Mulai menawarkan<Ikon nama="panah"
        /></RouterLink>
      </div>
      <div class="banner-art">
        <img
          :src="bahan"
          width="640"
          height="420"
          alt="Ilustrasi bahan segar dalam tas belanja"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
    <p class="food-notice">
      <Ikon nama="aman" /><span
        >Utamakan makanan yang masih layak konsumsi. Periksa kondisi makanan dan
        koordinasikan informasi alergen serta penyimpanan dengan penyedia.</span
      >
    </p>
  </section>
</template>
