<script setup>
import { computed, onMounted, watch } from "vue";
import { sesi, perbaruiPengguna } from "../lib/sesi.js";
import { api } from "../lib/api.js";
import { useBaca } from "../composables/useBaca.js";
import Ikon from "../components/Ikon.vue";
import StatusBaca from "../components/StatusBaca.vue";
const { data, sibuk, error, muat } = useBaca((signal) =>
  api("/api/auth/saya", { auth: true, signal }),
);
const profil = computed(() => data.value?.data ?? sesi.pengguna);
watch(data, (hasil) => {
  if (hasil) perbaruiPengguna(hasil.data);
});
onMounted(muat);
</script>
<template>
  <section
    class="container workspace section"
    aria-labelledby="judul-profil-usaha"
  >
    <div class="page-heading">
      <div>
        <p class="eyebrow"><Ikon nama="toko" />Akun usaha Anda</p>
        <h1 id="judul-profil-usaha">Profil usaha</h1>
        <p class="muted">
          Informasi usaha dan status peninjauan dalam satu tempat.
        </p>
      </div>
      <button
        type="button"
        class="button-secondary"
        :disabled="sibuk"
        @click="muat"
      >
        <Ikon nama="ulang" />Periksa status
      </button>
    </div>
    <StatusBaca :sibuk="sibuk" :error="error" @ulang="muat" />
    <div v-if="profil" class="provider-profile-layout">
      <article class="dashboard-panel profile-data">
        <h2>{{ profil.namaUsaha || "Usaha saya" }}</h2>
        <dl class="profile-details">
          <div>
            <dt>Nama pemilik</dt>
            <dd>{{ profil.namaLengkap }}</dd>
          </div>
          <div>
            <dt>Email akun</dt>
            <dd>{{ profil.email }}</dd>
          </div>
          <div>
            <dt>Alamat pengambilan</dt>
            <dd>{{ profil.alamatUsaha }}</dd>
          </div>
          <div>
            <dt>Nomor telepon usaha</dt>
            <dd>{{ profil.nomorTeleponUsaha }}</dd>
          </div>
        </dl>
      </article>
      <aside
        class="dashboard-panel profile-status"
        aria-labelledby="judul-status-usaha"
      >
        <span class="icon-tile"
          ><Ikon
            :nama="profil.statusVerifikasi === 'terverifikasi' ? 'cek' : 'jam'"
        /></span>
        <template v-if="profil.statusVerifikasi === 'terverifikasi'">
          <h2 id="judul-status-usaha">Profil usaha terverifikasi</h2>
          <p>
            Anda dapat membuat penawaran, mengelola pesanan masuk, dan memantau
            pendapatan usaha.
          </p>
          <RouterLink class="button button-wide" to="/penyedia"
            >Kelola penawaran<Ikon nama="panah"
          /></RouterLink>
          <RouterLink
            class="button button-secondary button-wide"
            to="/dashboard"
            >Lihat dashboard</RouterLink
          >
        </template>
        <template v-else-if="profil.statusVerifikasi === 'ditolak'">
          <h2 id="judul-status-usaha">Profil belum disetujui</h2>
          <p>
            Profil usaha belum disetujui pengelola. Hubungi pengelola SisaBaik
            untuk meninjau informasi usaha Anda.
          </p>
        </template>
        <template v-else>
          <h2 id="judul-status-usaha">Menunggu peninjauan</h2>
          <p>
            Akun Anda sudah dibuat. Pengelola meninjau informasi usaha sebelum
            penawaran dapat dipublikasikan.
          </p>
          <p class="field-hint">
            Gunakan tombol Periksa status untuk melihat hasil terbaru. Anda
            tidak perlu membuat akun ulang.
          </p>
        </template>
      </aside>
    </div>
  </section>
</template>
