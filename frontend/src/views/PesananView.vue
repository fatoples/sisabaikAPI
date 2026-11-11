<script setup>
import Ikon from "../components/Ikon.vue";
import { sesi } from "../lib/sesi.js";
import { labelPesanan, labelPembayaran } from "../lib/visual.js";
import { ref, watch } from "vue";
import StatusBaca from "../components/StatusBaca.vue";
import Paginasi from "../components/Paginasi.vue";
import { useBaca } from "../composables/useBaca.js";
import { api } from "../lib/api.js";
import { formatRupiah, formatWaktu } from "../lib/tampilan.js";

const page = ref(1);
const { data, sibuk, error, muat } = useBaca((signal) =>
  api(`/api/pesanan?page=${page.value}&limit=2`, {
    auth: true,
    signal,
  }),
);
watch(page, muat, { immediate: true });
</script>

<template>
  <section class="container workspace section" aria-labelledby="judul-pesanan">
    <div class="page-heading">
      <div>
        <p class="eyebrow"><Ikon nama="tas" />Aktivitas yang tercatat</p>
        <h1 id="judul-pesanan">
          {{
            sesi.pengguna?.peran === "penyedia"
              ? "Pesanan masuk usaha saya"
              : "Pesanan saya"
          }}
        </h1>
        <p class="muted">
          {{
            sesi.pengguna?.peran === "penyedia"
              ? "Terima atau tolak pesanan, siapkan makanan, lalu catat pengambilan dan pembayaran."
              : "Pantau pesanan Anda. Pembatalan tersedia sebelum penyedia menerima pesanan."
          }}
        </p>
      </div>
      <button
        class="button-secondary"
        type="button"
        :disabled="sibuk"
        @click="muat"
      >
        <Ikon nama="ulang" />Perbarui daftar
      </button>
    </div>
    <StatusBaca :sibuk="sibuk" :error="error" @ulang="muat" />
    <div v-if="data && !data.data.length" class="empty-state">
      <span class="icon-tile"><Ikon nama="tas" /></span>
      <h2>Belum ada pesanan pada halaman ini.</h2>
      <p>Setiap pesanan akan muncul di sini sesuai akun Anda.</p>
      <RouterLink class="button" to="/"
        >Jelajahi makanan<Ikon nama="panah"
      /></RouterLink>
    </div>
    <div v-if="data" class="daftar order-grid">
      <article v-for="p in data.data" :key="p.id" class="kartu-pesanan">
        <div class="order-card-top">
          <span class="icon-tile"><Ikon nama="tas" /></span
          ><span class="status-badge" :class="`status-${p.status}`">{{
            labelPesanan(p)
          }}</span>
        </div>
        <p class="order-payment">{{ labelPembayaran(p) }}</p>
        <h2>Pesanan {{ p.id }}</h2>
        <p class="provider-line"><Ikon nama="toko" />{{ p.penyedia }}</p>
        <p class="order-buyer">Pemesan: {{ p.namaPemesan }}</p>
        <div class="order-value">
          <span>Nilai pemesanan</span
          ><strong>{{ formatRupiah(p.total) }}</strong>
        </div>
        <p class="order-date">
          <Ikon nama="jam" /><time :datetime="p.dibuatPada">{{
            formatWaktu(p.dibuatPada)
          }}</time>
        </p>
        <RouterLink
          class="button button-secondary button-wide"
          :to="`/pesanan/${p.id}`"
          >{{
            sesi.pengguna?.peran === "penyedia"
              ? "Kelola pesanan "
              : "Lihat detail pesanan "
          }}{{ p.id }}<Ikon nama="panah"
        /></RouterLink>
      </article>
    </div>
    <Paginasi
      v-if="data"
      :meta="data.meta"
      :sibuk="sibuk"
      @halaman="page = $event"
    />
    <p class="food-notice">
      <Ikon nama="info" />Pembayaran dilakukan di tempat saat pengambilan.
      Pesanan yang dibatalkan atau ditolak mengembalikan stok yang terreservasi.
    </p>
  </section>
</template>
