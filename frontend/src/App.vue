<script setup>
import { ref, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "./lib/api.js";
import { sesi, hapusSesi, tandaiKeluar } from "./lib/sesi.js";
import Ikon from "./components/Ikon.vue";
import logo from "./assets/brand-mark.svg";
const router = useRouter();
const route = useRoute();
const konten = ref(null);
const menuTerbuka = ref(false);
const pembukaMenu = ref(null);
function tutupMenu() {
  menuTerbuka.value = false;
  pembukaMenu.value?.focus();
}
watch(
  () => route.fullPath,
  async () => {
    menuTerbuka.value = false;
    await nextTick();
    konten.value?.focus();
  },
);
watch(
  () => sesi.pengguna,
  (p) => {
    if (!p && route.meta.auth) router.replace("/login");
  },
);
async function logout() {
  if (sesi.keluar) return;
  tandaiKeluar(true);
  let pesan = "Anda telah keluar dari akun.";
  try {
    await api("/api/auth/logout", { method: "POST", auth: true, body: {} });
  } catch (e) {
    pesan =
      e.status === 401
        ? "Sesi sudah tidak berlaku. Silakan login lagi."
        : "Sesi di perangkat ini telah ditutup.";
  } finally {
    hapusSesi(pesan);
    tandaiKeluar(false);
    await router.replace("/login");
  }
}
</script>
<template>
  <a class="lewati" href="#konten" @click.prevent="konten?.focus()"
    >Lewati ke konten</a
  >
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink
        class="brand"
        to="/"
        aria-label="SisaBaik — kembali ke katalog"
        ><img :src="logo" width="42" height="42" alt="" /><span
          >Sisa<span class="brand-accent">Baik</span
          ><small>kesempatan kedua, kebaikan baru</small></span
        ></RouterLink
      >
      <button
        ref="pembukaMenu"
        class="menu-toggle button-quiet"
        type="button"
        :aria-expanded="menuTerbuka"
        aria-controls="menu-utama"
        @click="menuTerbuka = !menuTerbuka"
      >
        <Ikon :nama="menuTerbuka ? 'tutup' : 'menu'" /><span>{{
          menuTerbuka ? "Tutup menu" : "Buka menu"
        }}</span>
      </button>
      <nav
        id="menu-utama"
        class="menu"
        :class="{ 'menu-open': menuTerbuka }"
        aria-label="Navigasi utama"
        @keydown.esc="tutupMenu"
      >
        <RouterLink to="/">Katalog</RouterLink>
        <RouterLink
          v-if="sesi.pengguna?.peran === 'penyedia'"
          to="/akun/penyedia"
          >Profil usaha</RouterLink
        >
        <RouterLink
          v-if="
            sesi.pengguna?.peran === 'penyedia' &&
            sesi.pengguna.statusVerifikasi === 'terverifikasi'
          "
          to="/penyedia"
          >Penawaran saya</RouterLink
        >
        <template v-if="sesi.pengguna">
          <RouterLink
            v-if="
              sesi.pengguna.peran === 'pembeli' ||
              sesi.pengguna.statusVerifikasi === 'terverifikasi'
            "
            to="/pesanan"
            >Pesanan</RouterLink
          ><RouterLink
            v-if="
              sesi.pengguna.peran === 'pembeli' ||
              sesi.pengguna.statusVerifikasi === 'terverifikasi'
            "
            to="/dashboard"
            >Dashboard</RouterLink
          >
          <div class="account-chip">
            <span class="avatar" aria-hidden="true">{{
              sesi.pengguna.namaLengkap?.slice(0, 1)
            }}</span
            ><span
              >{{ sesi.pengguna.namaLengkap
              }}<small>{{ sesi.pengguna.peran }}</small></span
            >
          </div>
          <button
            class="button-quiet logout-button"
            type="button"
            :disabled="sesi.keluar"
            @click="logout"
          >
            <Ikon nama="keluar" />{{ sesi.keluar ? "Keluar…" : "Logout" }}
          </button>
        </template>
        <template v-else>
          <RouterLink class="button button-secondary button-small" to="/login"
            ><Ikon nama="pengguna" />Login</RouterLink
          >
          <RouterLink class="button button-small" to="/daftar"
            >Daftar</RouterLink
          >
        </template>
      </nav>
    </div>
  </header>
  <div
    v-if="sesi.pesan"
    class="container session-message"
    role="status"
    aria-live="polite"
  >
    <Ikon nama="info" />{{ sesi.pesan }}
  </div>
  <main id="konten" ref="konten" tabindex="-1"><RouterView /></main>
  <footer class="site-footer">
    <div class="container footer-top">
      <div class="footer-brand">
        <RouterLink class="brand" to="/"
          ><img :src="logo" width="42" height="42" alt="" /><span
            >SisaBaik</span
          ></RouterLink
        >
        <p>Makanan punya nilai.<br />Kebaikan punya kesempatan.</p>
      </div>
      <div>
        <h2>Jelajahi SisaBaik</h2>
        <RouterLink to="/">Katalog makanan</RouterLink
        ><RouterLink
          :to="
            sesi.pengguna?.peran === 'penyedia'
              ? '/akun/penyedia'
              : '/daftar?peran=penyedia'
          "
          >Untuk penyedia</RouterLink
        ><RouterLink :to="sesi.pengguna ? '/dashboard' : '/login'"
          >Dashboard akun</RouterLink
        >
      </div>
      <div class="footer-note">
        <h2>Tujuan yang baik, informasi yang jelas</h2>
        <p>
          Menghubungkan makanan berlebih yang masih layak konsumsi dengan orang
          yang membutuhkan, sekaligus memulihkan nilai stok usaha.
        </p>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>© 2026 SisaBaik</p>
      <p>Kesempatan kedua untuk makanan yang masih bernilai.</p>
    </div>
  </footer>
</template>
