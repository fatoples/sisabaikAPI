<script setup>
import Ikon from "../components/Ikon.vue";
import makanan from "../assets/food-bowl.svg";
import { ref, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api, pesanError } from "../lib/api.js";
import { isiSesi, sesi } from "../lib/sesi.js";

const router = useRouter();
const route = useRoute();
const lihatSandi = ref(false);
const email = ref(
  typeof route.query.email === "string" ? route.query.email : "",
);
const kataSandi = ref("");
const sibuk = ref(false);
const error = ref("");
const controller = new AbortController();
onUnmounted(() => controller.abort());
async function login() {
  if (sibuk.value || sesi.keluar) return;
  sibuk.value = true;
  error.value = "";
  try {
    const hasil = await api("/api/auth/login", {
      method: "POST",
      body: { email: email.value, kataSandi: kataSandi.value },
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    isiSesi(hasil.data);
    kataSandi.value = "";
    await router.replace(
      hasil.data.pengguna.peran === "penyedia"
        ? hasil.data.pengguna.statusVerifikasi === "terverifikasi"
          ? "/penyedia"
          : "/akun/penyedia"
        : "/",
    );
  } catch (e) {
    if (e.name !== "AbortError")
      error.value =
        e.status === 401 ? "Email atau kata sandi tidak valid." : pesanError(e);
  } finally {
    sibuk.value = false;
  }
}
</script>

<template>
  <section class="container login-layout" aria-labelledby="judul-login">
    <div class="login-story">
      <p class="eyebrow"><Ikon nama="daun" />Selamat datang di SisaBaik</p>
      <h2>Mulai dari satu<br />pilihan <span>baik.</span></h2>
      <p>
        Untuk Anda yang mencari makanan terjangkau, dan usaha yang ingin memberi
        kesempatan kedua pada stoknya.
      </p>
      <img
        :src="makanan"
        width="640"
        height="420"
        alt="Ilustrasi makanan dengan sayuran dan lauk"
      />
      <div class="login-story-bottom">
        <Ikon nama="toko" /><span
          >Pembeli & penyedia.<br /><strong
            >Satu ekosistem kebaikan.</strong
          ></span
        >
      </div>
    </div>
    <div class="login-card">
      <span class="outline-pill"><Ikon nama="aman" />Akses sesuai akun</span>
      <h1 id="judul-login">Login SisaBaik</h1>
      <p class="muted">
        Senang melihat Anda kembali. Masuk untuk melanjutkan aktivitas Anda.
      </p>
      <p v-if="error" class="notice notice-error" role="alert">{{ error }}</p>
      <form class="form-login" @submit.prevent="login" :aria-busy="sibuk">
        <fieldset :disabled="sibuk || sesi.keluar">
          <legend class="sr-only">Identitas akun</legend>
          <div>
            <label for="email">Email</label
            ><input
              id="email"
              v-model.trim="email"
              type="email"
              maxlength="254"
              required
              autocomplete="username"
              placeholder="nama@contoh.com"
            />
          </div>
          <div>
            <label for="kata-sandi">Kata sandi</label>
            <div class="password-field">
              <input
                id="kata-sandi"
                v-model="kataSandi"
                :type="lihatSandi ? 'text' : 'password'"
                required
                autocomplete="current-password"
              /><button
                class="password-toggle button-quiet"
                type="button"
                :aria-label="
                  lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                "
                :aria-pressed="lihatSandi"
                @click="lihatSandi = !lihatSandi"
              >
                <Ikon nama="mata" />
              </button>
            </div>
          </div>
          <button class="button-wide" type="submit">
            {{ sibuk ? "Memproses…" : "Login" }}<Ikon nama="panah" />
          </button>
        </fieldset>
      </form>
      <div class="login-help">
        <Ikon nama="info" />
        <p>
          Belum punya akun?
          <RouterLink to="/daftar">Daftar gratis</RouterLink>
          dengan email dan kata sandi pilihan Anda.
        </p>
      </div>
      <RouterLink class="back-link" to="/"
        ><Ikon nama="kiri" />Jelajahi katalog terlebih dahulu</RouterLink
      >
    </div>
  </section>
</template>
