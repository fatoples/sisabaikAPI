<script setup>
import Ikon from "./Ikon.vue";
import { visualKategori } from "../lib/visual.js";
const props = defineProps({
  pencarian: { type: String, required: true },
  kategori: { type: String, required: true },
  daftarKategori: { type: Array, required: true },
});
const emit = defineEmits(["ubah-pencarian", "ubah-kategori", "reset"]);
</script>
<template>
  <form
    class="filter"
    role="search"
    aria-label="Filter katalog makanan"
    @submit.prevent
  >
    <div>
      <label for="cari">Cari makanan atau penyedia</label>
      <div class="input-icon">
        <Ikon nama="cari" /><input
          id="cari"
          type="search"
          maxlength="100"
          placeholder="Roti, nasi, atau nama usaha…"
          :value="props.pencarian"
          @input="emit('ubah-pencarian', $event.target.value)"
        />
      </div>
    </div>
    <div>
      <label for="kategori-filter">Kategori makanan</label
      ><select
        id="kategori-filter"
        :value="props.kategori"
        @change="emit('ubah-kategori', $event.target.value)"
      >
        <option value="">Semua kategori</option>
        <option
          v-for="nilai in props.daftarKategori"
          :key="nilai"
          :value="nilai"
        >
          {{ visualKategori(nilai).label }}
        </option>
      </select>
    </div>
    <button class="button-secondary" type="button" @click="emit('reset')">
      <Ikon nama="ulang" />Reset filter
    </button>
  </form>
</template>
