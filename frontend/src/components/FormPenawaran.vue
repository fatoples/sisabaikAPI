<script setup>
import { nextTick, ref } from "vue";
import {
    formKosong,
    validasiForm,
} from "../lib/form-penawaran.js";

const emit = defineEmits(["simpan"]);

const form = ref(formKosong());
const errors = ref({});
const ringkasan = ref(null);

async function simpan() {
    const hasil = validasiForm(form.value);

    errors.value = hasil.errors;

    if (!hasil.data) {
        await nextTick();
        ringkasan.value?.focus();
        return;
    }

    emit("simpan", hasil.data);

    form.value = formKosong();
    errors.value = {};
}
</script>

<template>
    <form
        class="form-penawaran"
        novalidate
        @submit.prevent="simpan"
    >
        <p
            v-if="Object.keys(errors).length"
            ref="ringkasan"
            class="notice"
            tabindex="-1"
            role="status"
            aria-live="polite"
        >
            Periksa isian yang ditandai.
        </p>

        <div>
            <label for="nama">
                Nama penawaran
            </label>

            <input
                id="nama"
                v-model.trim="form.nama"
                required
                minlength="3"
                maxlength="120"
                :aria-invalid="Boolean(errors.nama)"
                :aria-describedby="
                    errors.nama ? 'error-nama' : undefined
                "
            />

            <p
                v-if="errors.nama"
                id="error-nama"
                class="error"
            >
                {{ errors.nama }}
            </p>
        </div>

        <div>
            <label for="kategori-form">
                Kategori
            </label>

            <select
                id="kategori-form"
                v-model="form.kategori"
                required
                :aria-invalid="Boolean(errors.kategori)"
                :aria-describedby="
                    errors.kategori
                        ? 'error-kategori'
                        : undefined
                "
            >
                <option value="roti">
                    Roti &amp; kue
                </option>

                <option value="makanan-siap-saji">
                    Makanan siap saji
                </option>

                <option value="bahan-segar">
                    Bahan segar
                </option>
            </select>

            <p
                v-if="errors.kategori"
                id="error-kategori"
                class="error"
            >
                {{ errors.kategori }}
            </p>
        </div>

        <div>
            <label for="normal">
                Harga normal dalam rupiah
            </label>

            <input
                id="normal"
                v-model.number="form.hargaNormal"
                type="number"
                min="1"
                max="999999999999"
                step="1"
                required
                :aria-invalid="Boolean(errors.hargaNormal)"
                :aria-describedby="
                    errors.hargaNormal
                        ? 'error-normal'
                        : undefined
                "
            />

            <p
                v-if="errors.hargaNormal"
                id="error-normal"
                class="error"
            >
                {{ errors.hargaNormal }}
            </p>
        </div>

        <div>
            <label for="hemat">
                Harga penawaran dalam rupiah
            </label>

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
                    errors.hargaPenawaran
                        ? 'error-hemat'
                        : undefined
                "
            />

            <p
                v-if="errors.hargaPenawaran"
                id="error-hemat"
                class="error"
            >
                {{ errors.hargaPenawaran }}
            </p>
        </div>

        <div>
            <label for="stok">
                Jumlah stok
            </label>

            <input
                id="stok"
                v-model.number="form.stok"
                type="number"
                min="0"
                max="2147483647"
                step="1"
                required
                :aria-invalid="Boolean(errors.stok)"
                :aria-describedby="
                    errors.stok ? 'error-stok' : undefined
                "
            />

            <p
                v-if="errors.stok"
                id="error-stok"
                class="error"
            >
                {{ errors.stok }}
            </p>
        </div>

        <div>
            <label for="satuan">
                Satuan
            </label>

            <input
                id="satuan"
                v-model.trim="form.satuan"
                maxlength="20"
                required
                :aria-invalid="Boolean(errors.satuan)"
                :aria-describedby="
                    errors.satuan ? 'error-satuan' : undefined
                "
            />

            <p
                v-if="errors.satuan"
                id="error-satuan"
                class="error"
            >
                {{ errors.satuan }}
            </p>
        </div>

        <div>
            <label for="status">
                Status
            </label>

            <select
                id="status"
                v-model="form.status"
                required
                :aria-invalid="Boolean(errors.status)"
                :aria-describedby="
                    errors.status ? 'error-status' : undefined
                "
            >
                <option value="draft">
                    Draft
                </option>

                <option value="aktif">
                    Aktif
                </option>
            </select>

            <p
                v-if="errors.status"
                id="error-status"
                class="error"
            >
                {{ errors.status }}
            </p>
        </div>

        <div>
            <label for="berakhir">
                Berakhir pada waktu lokal perangkat
            </label>

            <input
                id="berakhir"
                v-model="form.berakhirPada"
                type="datetime-local"
                required
                :aria-invalid="Boolean(errors.berakhirPada)"
                :aria-describedby="
                    errors.berakhirPada
                        ? 'error-berakhir'
                        : undefined
                "
            />

            <p
                v-if="errors.berakhirPada"
                id="error-berakhir"
                class="error"
            >
                {{ errors.berakhirPada }}
            </p>
        </div>

        <button type="submit">
            Tambahkan penawaran
        </button>
    </form>
</template>