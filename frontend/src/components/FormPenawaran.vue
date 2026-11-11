<script setup>
import { ref, watch, nextTick, onUnmounted } from "vue";
import { formKosong, validasiForm } from "../lib/form-penawaran.js";

const props = defineProps({
  sibuk: { type: Boolean, default: false },
  berhasil: { type: Number, default: 0 },
  penawaran: { type: Object, default: null },
});
const emit = defineEmits(["simpan", "batal"]);
const form = ref(formKosong());
const errors = ref({});
const ringkasan = ref(null);
const fotoInput = ref(null);
const fotoBaru = ref(undefined);
const pratinjau = ref("");
const membacaFoto = ref(false);
let pembaca;
onUnmounted(() => pembaca?.abort());

function isiForm() {
  pembaca?.abort();
  pembaca = null;
  membacaFoto.value = false;
  fotoBaru.value = undefined;
  errors.value = {};
  if (fotoInput.value) fotoInput.value.value = "";
  const p = props.penawaran;
  form.value = p
    ? Object.fromEntries(Object.keys(formKosong()).map((k) => [k, p[k]]))
    : formKosong();
  if (p) {
    const d = new Date(p.berakhirPada);
    form.value.berakhirPada = new Date(
      d.getTime() - d.getTimezoneOffset() * 60000,
    )
      .toISOString()
      .slice(0, 16);
    form.value.status = p.status === "aktif" ? "aktif" : "draft";
  }
  pratinjau.value = p?.fotoUrl ?? "";
}
watch(() => props.penawaran, isiForm, { immediate: true });

function pilihFoto(event) {
  pembaca?.abort();
  const file = event.target.files?.[0];
  if (!file) return;
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  ) {
    errors.value.foto = "Pilih JPEG, PNG, atau WebP maksimal 2 MiB.";
    event.target.value = "";
    membacaFoto.value = false;
    return;
  }
  delete errors.value.foto;
  membacaFoto.value = true;
  const reader = new FileReader();
  pembaca = reader;
  reader.onload = () => {
    if (pembaca !== reader) return;
    fotoBaru.value = String(reader.result);
    pratinjau.value = fotoBaru.value;
    membacaFoto.value = false;
  };
  reader.onerror = () => {
    if (pembaca !== reader) return;
    errors.value.foto = "Foto tidak dapat dibaca. Pilih berkas lain.";
    membacaFoto.value = false;
  };
  reader.onabort = () => {
    if (pembaca === reader) membacaFoto.value = false;
  };
  reader.readAsDataURL(file);
}
function hapusFoto() {
  pembaca?.abort();
  pembaca = null;
  fotoBaru.value = null;
  pratinjau.value = "";
  delete errors.value.foto;
  if (fotoInput.value) fotoInput.value.value = "";
}

watch(
  () => props.berhasil,
  () => {
    isiForm();
  },
);

async function simpan() {
  if (props.sibuk || membacaFoto.value) return;
  const hasil = validasiForm(form.value);
  if (errors.value.foto) hasil.errors.foto = errors.value.foto;
  errors.value = hasil.errors;
  if (!hasil.data || Object.keys(errors.value).length) {
    await nextTick();
    ringkasan.value?.focus();
    return;
  }
  if (props.penawaran) hasil.data.versi = props.penawaran.versi;
  if (fotoBaru.value !== undefined) hasil.data.foto = fotoBaru.value;
  emit("simpan", hasil.data);
}
</script>

<template>
  <form
    class="form-penawaran"
    novalidate
    @submit.prevent="simpan"
    :aria-busy="props.sibuk"
  >
    <fieldset :disabled="props.sibuk">
      <legend>
        {{
          props.penawaran
            ? "Ubah penawaran makanan"
            : "Penawaran makanan berlebih"
        }}
      </legend>
      <p class="form-intro">
        Isi detail makanan, harga, stok, dan batas waktu. Pilih Draft untuk
        menyimpan tanpa menampilkan di katalog.
      </p>
      <p ref="ringkasan" tabindex="-1" role="status" aria-live="polite">
        <span v-if="Object.keys(errors).length"
          >Periksa isian yang ditandai.</span
        >
      </p>
      <div class="form-grid">
        <div class="field-full">
          <label for="nama">Nama penawaran</label>
          <input
            id="nama"
            v-model.trim="form.nama"
            required
            minlength="3"
            maxlength="120"
            :aria-invalid="Boolean(errors.nama)"
            :aria-describedby="errors.nama ? 'error-nama' : undefined"
          />
          <p v-if="errors.nama" id="error-nama" class="error">
            {{ errors.nama }}
          </p>
        </div>
        <div>
          <label for="kategori-form">Kategori</label>
          <select
            id="kategori-form"
            v-model="form.kategori"
            required
            :aria-invalid="Boolean(errors.kategori)"
            :aria-describedby="errors.kategori ? 'error-kategori' : undefined"
          >
            <option value="roti">Roti &amp; kue</option>
            <option value="makanan-siap-saji">Makanan siap saji</option>
            <option value="bahan-segar">Bahan segar</option>
          </select>
          <p v-if="errors.kategori" id="error-kategori" class="error">
            {{ errors.kategori }}
          </p>
        </div>
        <div>
          <label for="normal">Harga normal dalam rupiah</label>
          <input
            id="normal"
            v-model.number="form.hargaNormal"
            type="number"
            min="1"
            max="999999999999"
            step="1"
            required
            :aria-invalid="Boolean(errors.hargaNormal)"
            :aria-describedby="errors.hargaNormal ? 'error-normal' : undefined"
          />
          <p v-if="errors.hargaNormal" id="error-normal" class="error">
            {{ errors.hargaNormal }}
          </p>
        </div>
        <div>
          <label for="hemat">Harga penawaran dalam rupiah</label>
          <input
            id="hemat"
            v-model.number="form.hargaPenawaran"
            type="number"
            min="0"
            max="999999999999"
            step="1"
            required
            :aria-invalid="Boolean(errors.hargaPenawaran)"
            :aria-describedby="
              errors.hargaPenawaran ? 'error-hemat' : undefined
            "
          />
          <p v-if="errors.hargaPenawaran" id="error-hemat" class="error">
            {{ errors.hargaPenawaran }}
          </p>
        </div>
        <div>
          <label for="stok">Stok yang masih tersedia</label>
          <input
            id="stok"
            v-model.number="form.stok"
            type="number"
            min="0"
            max="2147483647"
            step="1"
            required
            :aria-invalid="Boolean(errors.stok)"
            :aria-describedby="errors.stok ? 'error-stok' : undefined"
          />
          <p v-if="errors.stok" id="error-stok" class="error">
            {{ errors.stok }}
          </p>
        </div>
        <div>
          <label for="satuan">Satuan</label>
          <input
            id="satuan"
            v-model.trim="form.satuan"
            maxlength="20"
            required
            :aria-invalid="Boolean(errors.satuan)"
            :aria-describedby="errors.satuan ? 'error-satuan' : undefined"
          />
          <p v-if="errors.satuan" id="error-satuan" class="error">
            {{ errors.satuan }}
          </p>
        </div>
        <div>
          <label for="status">Status</label>
          <select
            id="status"
            v-model="form.status"
            required
            :aria-invalid="Boolean(errors.status)"
            :aria-describedby="errors.status ? 'error-status' : undefined"
          >
            <option value="draft">Draft</option>
            <option value="aktif">Aktif</option>
          </select>
          <p v-if="errors.status" id="error-status" class="error">
            {{ errors.status }}
          </p>
        </div>
        <div>
          <label for="berakhir">Berakhir pada waktu lokal perangkat</label>
          <input
            id="berakhir"
            v-model="form.berakhirPada"
            type="datetime-local"
            required
            :aria-invalid="Boolean(errors.berakhirPada)"
            :aria-describedby="
              errors.berakhirPada ? 'error-berakhir' : undefined
            "
          />
          <p v-if="errors.berakhirPada" id="error-berakhir" class="error">
            {{ errors.berakhirPada }}
          </p>
        </div>
        <div class="field-full photo-field">
          <label for="foto">Foto makanan (opsional)</label>
          <input
            id="foto"
            ref="fotoInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="pilihFoto"
            :aria-invalid="Boolean(errors.foto)"
            :aria-describedby="
              errors.foto ? 'hint-foto error-foto' : 'hint-foto'
            "
          />
          <p id="hint-foto" class="field-hint">
            JPEG, PNG, atau WebP maksimal 2 MiB. Tanpa foto, ilustrasi kategori
            akan digunakan.
          </p>
          <p id="error-foto" class="error" v-if="errors.foto">
            {{ errors.foto }}
          </p>
          <p v-if="membacaFoto" role="status">Membaca foto…</p>
          <div v-if="pratinjau || errors.foto" class="photo-preview">
            <img
              v-if="pratinjau"
              :src="pratinjau"
              alt="Pratinjau foto makanan yang dipilih"
              width="320"
              height="210"
            />
            <button type="button" class="button-secondary" @click="hapusFoto">
              Gunakan ilustrasi default
            </button>
          </div>
        </div>
      </div>
      <p class="field-hint">
        Harga penawaran boleh nol (gratis). Tanggal dan jam mengikuti zona waktu
        perangkat Anda. Stok tersedia tidak termasuk makanan yang sudah
        terreservasi.
      </p>
      <button class="button-wide" type="submit" :disabled="membacaFoto">
        {{
          props.sibuk
            ? "Menyimpan…"
            : props.penawaran
              ? "Simpan perubahan"
              : "Simpan penawaran"
        }}
      </button>
      <button
        v-if="props.penawaran"
        type="button"
        class="button-secondary button-wide cancel-edit"
        @click="emit('batal')"
      >
        Batal edit
      </button>
    </fieldset>
  </form>
</template>
