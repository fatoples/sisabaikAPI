<script setup>
import { reactive, ref, nextTick, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import Ikon from "../components/Ikon.vue";
import makanan from "../assets/food-bowl.svg";
import { api } from "../lib/api.js";
import { periksaRegistrasi } from "../lib/registrasi.js";

const route = useRoute();
const form = reactive({
  peran: route.query.peran === "penyedia" ? "penyedia" : "pembeli",
  namaLengkap: "",
  email: "",
  kataSandi: "",
  konfirmasiSandi: "",
  namaUsaha: "",
  alamat: "",
  nomorTelepon: "",
});
const namaField = {
  namaLengkap: "Nama lengkap",
  email: "Email",
  kataSandi: "Kata sandi",
  konfirmasiSandi: "Ulangi kata sandi",
  namaUsaha: "Nama usaha",
  alamat: "Alamat pengambilan",
  nomorTelepon: "Nomor telepon",
};
const errors = ref({});
const error = ref("");
const sibuk = ref(false);
const lihatSandi = ref(false);
const akunBaru = ref(null);
const ringkasan = ref(null);
const selesai = ref(null);
const controller = new AbortController();
onUnmounted(() => controller.abort());

function deskripsi(key, hint = "") {
  return (
    [hint, errors.value[key] ? "error-daftar-" + key : ""]
      .filter(Boolean)
      .join(" ") || undefined
  );
}
function fokus(key) {
  document.getElementById("daftar-" + key)?.focus();
}
async function daftar() {
  if (sibuk.value) return;
  error.value = "";
  errors.value = periksaRegistrasi(form);
  if (Object.keys(errors.value).length) {
    await nextTick();
    ringkasan.value?.focus();
    return;
  }
  const body = {
    namaLengkap: form.namaLengkap.trim(),
    email: form.email.trim(),
    kataSandi: form.kataSandi,
  };
  if (form.peran === "penyedia") {
    Object.assign(body, {
      namaUsaha: form.namaUsaha.trim(),
      alamat: form.alamat.trim(),
      nomorTelepon: form.nomorTelepon.trim(),
    });
  }
  sibuk.value = true;
  try {
    const hasil = await api(
      form.peran === "penyedia"
        ? "/api/auth/registrasi-penyedia"
        : "/api/auth/registrasi",
      { method: "POST", body, signal: controller.signal },
    );
    if (controller.signal.aborted) return;
    akunBaru.value = hasil.data;
    form.kataSandi = "";
    form.konfirmasiSandi = "";
    lihatSandi.value = false;
    await nextTick();
    selesai.value?.focus();
  } catch (e) {
    if (e.name !== "AbortError") {
      error.value =
        e.status === 409
          ? "Pendaftaran tidak dapat diproses. Jika pernah mendaftar, coba login dengan email tersebut."
          : e.status === 0
            ? "Koneksi bermasalah. Periksa koneksi dan coba kembali. Jika akun sudah terbentuk, gunakan halaman login."
            : e.message || "Pendaftaran belum berhasil. Silakan coba kembali.";
      await nextTick();
      ringkasan.value?.focus();
    }
  } finally {
    sibuk.value = false;
  }
}
</script>

<template>
  <section
    class="container login-layout signup-layout"
    aria-labelledby="judul-daftar"
  >
    <div class="login-story signup-story">
      <p class="eyebrow"><Ikon nama="daun" />Mulai kesempatan baik Anda</p>
      <h2>Satu akun.<br /><span>Banyak pilihan baik.</span></h2>
      <p>
        Temukan makanan dengan harga lebih ramah atau bantu makanan berlebih
        dari usaha Anda menemukan pembelinya.
      </p>
      <img
        :src="makanan"
        width="640"
        height="420"
        alt="Ilustrasi makanan dengan sayuran dan lauk"
      />
      <div class="login-story-bottom">
        <Ikon nama="aman" /><span
          >Kata sandi pilihan Anda.<br /><strong
            >Akses sesuai aktivitas Anda.</strong
          ></span
        >
      </div>
    </div>
    <div class="login-card">
      <span class="outline-pill"
        ><Ikon nama="pengguna" />Bergabung dengan SisaBaik</span
      >
      <h1 id="judul-daftar">Daftar SisaBaik</h1>
      <template v-if="akunBaru">
        <div ref="selesai" class="signup-success" tabindex="-1" role="status">
          <span class="icon-tile"><Ikon nama="cek" /></span>
          <h2>Akun berhasil dibuat</h2>
          <p>
            {{ akunBaru.namaLengkap }}, silakan login dengan
            <strong>{{ akunBaru.email }}</strong> dan kata sandi yang baru Anda
            pilih.
          </p>
          <p v-if="akunBaru.peran === 'penyedia'" class="field-hint">
            Profil usaha menunggu peninjauan pengelola sebelum penawaran dapat
            dipublikasikan.
          </p>
          <RouterLink
            class="button button-wide"
            :to="{ path: '/login', query: { email: akunBaru.email } }"
            >Login sekarang<Ikon nama="panah"
          /></RouterLink>
        </div>
      </template>
      <template v-else>
        <p class="muted">Gunakan email Anda dan buat kata sandi sendiri.</p>
        <section
          v-if="error || Object.keys(errors).length"
          ref="ringkasan"
          class="notice notice-error signup-errors"
          role="alert"
          tabindex="-1"
          aria-labelledby="judul-error-daftar"
        >
          <h2 id="judul-error-daftar">
            {{ error ? "Pendaftaran belum berhasil" : "Periksa isian berikut" }}
          </h2>
          <p v-if="error">{{ error }}</p>
          <ul v-else>
            <li v-for="(pesan, key) in errors" :key="key">
              <button type="button" class="error-link" @click="fokus(key)">
                {{ namaField[key] }}: {{ pesan }}
              </button>
            </li>
          </ul>
        </section>
        <form
          class="form-login form-daftar"
          @submit.prevent="daftar"
          :aria-busy="sibuk"
          novalidate
        >
          <fieldset :disabled="sibuk">
            <legend class="sr-only">Informasi pendaftaran</legend>
            <fieldset class="role-picker">
              <legend>Saya ingin bergabung sebagai</legend>
              <label
                class="role-option"
                :class="{ selected: form.peran === 'pembeli' }"
              >
                <input
                  type="radio"
                  name="peran-daftar"
                  value="pembeli"
                  v-model="form.peran"
                />
                <span
                  ><strong>Pembeli</strong
                  ><small>Cari dan pesan makanan.</small></span
                >
              </label>
              <label
                class="role-option"
                :class="{ selected: form.peran === 'penyedia' }"
              >
                <input
                  type="radio"
                  name="peran-daftar"
                  value="penyedia"
                  v-model="form.peran"
                />
                <span
                  ><strong>Penyedia usaha</strong
                  ><small>Tawarkan makanan berlebih.</small></span
                >
              </label>
            </fieldset>
            <div>
              <label for="daftar-namaLengkap">Nama lengkap</label>
              <input
                id="daftar-namaLengkap"
                v-model.trim="form.namaLengkap"
                required
                maxlength="100"
                autocomplete="name"
                :aria-invalid="!!errors.namaLengkap"
                :aria-describedby="deskripsi('namaLengkap')"
              />
              <p
                v-if="errors.namaLengkap"
                id="error-daftar-namaLengkap"
                class="field-error"
              >
                {{ errors.namaLengkap }}
              </p>
            </div>
            <div>
              <label for="daftar-email">Email</label>
              <input
                id="daftar-email"
                v-model.trim="form.email"
                type="email"
                required
                maxlength="254"
                autocomplete="email"
                placeholder="nama@contoh.com"
                :aria-invalid="!!errors.email"
                :aria-describedby="deskripsi('email')"
              />
              <p
                v-if="errors.email"
                id="error-daftar-email"
                class="field-error"
              >
                {{ errors.email }}
              </p>
            </div>
            <div>
              <label for="daftar-kataSandi">Kata sandi</label>
              <div class="password-field">
                <input
                  id="daftar-kataSandi"
                  v-model="form.kataSandi"
                  :type="lihatSandi ? 'text' : 'password'"
                  required
                  autocomplete="new-password"
                  :aria-invalid="!!errors.kataSandi"
                  :aria-describedby="
                    deskripsi('kataSandi', 'hint-sandi-daftar')
                  "
                />
                <button
                  type="button"
                  class="password-toggle button-quiet"
                  :aria-label="
                    lihatSandi
                      ? 'Sembunyikan kata sandi pendaftaran'
                      : 'Tampilkan kata sandi pendaftaran'
                  "
                  :aria-pressed="lihatSandi"
                  @click="lihatSandi = !lihatSandi"
                >
                  <Ikon nama="mata" />
                </button>
              </div>
              <p id="hint-sandi-daftar" class="field-hint">
                Minimal 15 karakter. Gunakan frasa yang mudah Anda ingat.
              </p>
              <p
                v-if="errors.kataSandi"
                id="error-daftar-kataSandi"
                class="field-error"
              >
                {{ errors.kataSandi }}
              </p>
            </div>
            <div>
              <label for="daftar-konfirmasiSandi">Ulangi kata sandi</label>
              <input
                id="daftar-konfirmasiSandi"
                v-model="form.konfirmasiSandi"
                type="password"
                required
                autocomplete="new-password"
                :aria-invalid="!!errors.konfirmasiSandi"
                :aria-describedby="deskripsi('konfirmasiSandi')"
              />
              <p
                v-if="errors.konfirmasiSandi"
                id="error-daftar-konfirmasiSandi"
                class="field-error"
              >
                {{ errors.konfirmasiSandi }}
              </p>
            </div>
            <fieldset v-if="form.peran === 'penyedia'" class="signup-business">
              <legend>Informasi usaha</legend>
              <p class="field-hint">
                Profil usaha ditinjau pengelola sebelum Anda mempublikasikan
                penawaran.
              </p>
              <div>
                <label for="daftar-namaUsaha">Nama usaha</label>
                <input
                  id="daftar-namaUsaha"
                  v-model.trim="form.namaUsaha"
                  required
                  maxlength="120"
                  autocomplete="organization"
                  :aria-invalid="!!errors.namaUsaha"
                  :aria-describedby="deskripsi('namaUsaha')"
                />
                <p
                  v-if="errors.namaUsaha"
                  id="error-daftar-namaUsaha"
                  class="field-error"
                >
                  {{ errors.namaUsaha }}
                </p>
              </div>
              <div>
                <label for="daftar-alamat">Alamat pengambilan</label>
                <textarea
                  id="daftar-alamat"
                  v-model.trim="form.alamat"
                  required
                  maxlength="1000"
                  rows="3"
                  autocomplete="street-address"
                  :aria-invalid="!!errors.alamat"
                  :aria-describedby="deskripsi('alamat')"
                ></textarea>
                <p
                  v-if="errors.alamat"
                  id="error-daftar-alamat"
                  class="field-error"
                >
                  {{ errors.alamat }}
                </p>
              </div>
              <div>
                <label for="daftar-nomorTelepon">Nomor telepon usaha</label>
                <input
                  id="daftar-nomorTelepon"
                  v-model.trim="form.nomorTelepon"
                  type="tel"
                  required
                  maxlength="30"
                  autocomplete="tel"
                  placeholder="08xxxxxxxxxx"
                  :aria-invalid="!!errors.nomorTelepon"
                  :aria-describedby="deskripsi('nomorTelepon')"
                />
                <p
                  v-if="errors.nomorTelepon"
                  id="error-daftar-nomorTelepon"
                  class="field-error"
                >
                  {{ errors.nomorTelepon }}
                </p>
              </div>
            </fieldset>
            <button class="button-wide" type="submit">
              {{ sibuk ? "Membuat akun…" : "Buat akun" }}<Ikon nama="panah" />
            </button>
          </fieldset>
        </form>
        <p class="signup-login">
          Sudah punya akun? <RouterLink to="/login">Login di sini</RouterLink>.
        </p>
      </template>
    </div>
  </section>
</template>
