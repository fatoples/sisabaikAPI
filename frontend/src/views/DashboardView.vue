<script setup>
import { computed, onMounted } from "vue";
import { sesi } from "../lib/sesi.js";
import Ikon from "../components/Ikon.vue";
import StatusBaca from "../components/StatusBaca.vue";
import { useBaca } from "../composables/useBaca.js";
import { api } from "../lib/api.js";
import { formatRupiah, formatWaktu } from "../lib/tampilan.js";

const bilangan = new Intl.NumberFormat("id-ID");
const angka = (teks) => bilangan.format(BigInt(teks));
const uang = (teks) => formatRupiah(BigInt(teks));
const { data, sibuk, error, muat } = useBaca((signal) =>
  api("/api/dashboard", { auth: true, signal }),
);
onMounted(muat);
const pembeli = computed(
  () => (data.value?.data.peran ?? sesi.pengguna?.peran) === "pembeli",
);
const metrik = computed(() =>
  !data.value
    ? []
    : pembeli.value
      ? [
          {
            key: "jumlahPesananTotal",
            nama: "Pesanan saya",
            ikon: "tas",
            hint: "Seluruh riwayat, termasuk pembatalan.",
          },
          {
            key: "jumlahBerjalan",
            nama: "Pesanan berjalan",
            ikon: "jam",
            hint: "Menunggu, diterima, atau siap diambil.",
          },
          {
            key: "totalBelanja",
            nama: "Total belanja selesai",
            ikon: "grafik",
            uang: true,
            utama: true,
            hint: "Makanan diambil dan pembayaran tercatat.",
          },
          {
            key: "penghematanPembeli",
            nama: "Penghematan saya",
            ikon: "daun",
            uang: true,
            hint: "Selisih harga normal dan harga pesanan selesai.",
          },
          {
            key: "unitTersalurkan",
            nama: "Unit makanan diambil",
            ikon: "paket",
            hint: "Jumlah porsi atau paket yang benar-benar diambil.",
          },
          {
            key: "jumlahDibatalkan",
            nama: "Dibatalkan atau ditolak",
            ikon: "info",
            hint: "Pesanan ditutup; tidak dihitung sebagai belanja.",
          },
        ]
      : [
          {
            key: "jumlahMenunggu",
            nama: "Perlu konfirmasi",
            ikon: "jam",
            hint: "Pesanan baru yang menunggu keputusan Anda.",
          },
          {
            key: "penawaranAktif",
            nama: "Penawaran tersedia",
            ikon: "toko",
            hint: "Aktif, belum berakhir, dan masih memiliki stok.",
          },
          {
            key: "pendapatanDiterima",
            nama: "Pendapatan diterima",
            ikon: "grafik",
            uang: true,
            utama: true,
            hint: "Pembayaran tercatat dari pesanan yang sudah diambil.",
          },
          {
            key: "unitTersalurkan",
            nama: "Unit makanan tersalurkan",
            ikon: "paket",
            hint: "Jumlah porsi atau paket yang diserahkan.",
          },
          {
            key: "nilaiNormalTersalurkan",
            nama: "Nilai stok terselamatkan",
            ikon: "daun",
            uang: true,
            hint: "Nilai harga normal makanan yang sudah tersalurkan.",
          },
          {
            key: "diskonDiberikan",
            nama: "Penghematan untuk pembeli",
            ikon: "pengguna",
            uang: true,
            hint: "Total selisih harga pada pesanan selesai dan lunas.",
          },
        ],
);
</script>

<template>
  <section
    class="container workspace section"
    aria-labelledby="judul-dashboard"
  >
    <div class="page-heading">
      <div>
        <p class="eyebrow">
          <Ikon nama="grafik" />Angka yang sesuai aktivitas Anda
        </p>
        <h1 id="judul-dashboard">
          {{ pembeli ? "Dashboard pembeli" : "Dashboard usaha saya" }}
        </h1>
        <p class="muted">
          {{
            pembeli
              ? "Pantau belanja, penghematan, dan makanan yang telah Anda ambil."
              : "Pantau pesanan masuk, penawaran, pendapatan, dan makanan yang tersalurkan."
          }}
        </p>
      </div>
      <button
        class="button-secondary"
        type="button"
        :disabled="sibuk"
        @click="muat"
      >
        <Ikon nama="ulang" />Perbarui dashboard
      </button>
    </div>
    <StatusBaca :sibuk="sibuk" :error="error" @ulang="muat" />
    <div v-if="data">
      <div class="dashboard-scope">
        <span class="outline-pill"
          ><Ikon nama="pengguna" />{{ data.data.cakupan }} · Seluruh
          riwayat</span
        >
        <p>
          Dihitung
          <time :datetime="data.data.dihitungPada">{{
            formatWaktu(data.data.dihitungPada)
          }}</time>
        </p>
      </div>
      <dl class="metrik metric-grid">
        <div
          v-for="m in metrik"
          :key="m.key"
          class="metric-card"
          :class="{ 'metric-highlight': m.utama }"
          :data-metrik="m.key"
        >
          <dt>
            <span class="icon-tile"><Ikon :nama="m.ikon" /></span
            ><span class="metric-label">{{ m.nama }}</span>
          </dt>
          <dd>
            <strong class="metric-value">{{
              m.uang ? uang(data.data[m.key]) : angka(data.data[m.key])
            }}</strong>
            <p>{{ m.hint }}</p>
          </dd>
        </div>
      </dl>
      <div class="dashboard-bottom">
        <section
          class="dashboard-panel"
          aria-labelledby="judul-status-dashboard"
        >
          <h2 id="judul-status-dashboard">Status pesanan</h2>
          <dl class="status-summary">
            <div>
              <dt>Menunggu konfirmasi</dt>
              <dd>{{ angka(data.data.jumlahMenunggu) }}</dd>
            </div>
            <div>
              <dt>Diterima penyedia</dt>
              <dd>{{ angka(data.data.jumlahDikonfirmasi) }}</dd>
            </div>
            <div>
              <dt>Siap diambil</dt>
              <dd>{{ angka(data.data.jumlahSiapDiambil) }}</dd>
            </div>
            <div>
              <dt>Selesai &amp; diambil</dt>
              <dd>{{ angka(data.data.jumlahSelesai) }}</dd>
            </div>
            <div>
              <dt>Dibatalkan / ditolak</dt>
              <dd>{{ angka(data.data.jumlahDibatalkan) }}</dd>
            </div>
          </dl>
          <RouterLink class="button button-secondary" to="/pesanan"
            >{{ pembeli ? "Lihat pesanan saya" : "Kelola pesanan masuk"
            }}<Ikon nama="panah"
          /></RouterLink>
        </section>
        <section
          class="dashboard-panel"
          aria-labelledby="judul-makna-dashboard"
        >
          <h2 id="judul-makna-dashboard">
            {{
              pembeli
                ? "Bagaimana penghematan dihitung?"
                : "Nilai bisnis dan stok terselamatkan"
            }}
          </h2>
          <p v-if="pembeli">
            Penghematan = harga normal dikurangi harga penawaran, dikali jumlah
            makanan pada pesanan yang selesai, diambil, dan pembayaran tercatat.
            Pesanan gratis tetap menghasilkan penghematan.
          </p>
          <template v-else>
            <p>
              Pendapatan adalah pembayaran yang telah diterima. Nilai stok
              terselamatkan menggunakan harga normal makanan yang telah
              diserahkan. Diskon yang diberikan menjadi penghematan bagi
              pembeli.
            </p>
            <p class="field-hint">
              Nilai stok bukan laba atau penghematan biaya. Biaya modal dan
              pembuangan belum dicatat sehingga penghematan biaya penjual belum
              dapat dihitung.
            </p>
            <RouterLink class="button button-secondary" to="/penyedia"
              >Kelola penawaran<Ikon nama="panah"
            /></RouterLink>
          </template>
          <p v-if="data.data.pembayaranBelumTercatat !== '0'" class="notice">
            Ada {{ angka(data.data.pembayaranBelumTercatat) }} pesanan lama yang
            sudah diambil namun pembayaran belum tercatat. Nilainya belum
            dimasukkan ke belanja selesai atau pendapatan diterima.
          </p>
          <p class="field-hint">
            Angka dihitung dari seluruh data akun, termasuk halaman pesanan
            berikutnya. Unit porsi/paket tidak dikonversi menjadi kilogram atau
            emisi.
          </p>
        </section>
      </div>
    </div>
  </section>
</template>
