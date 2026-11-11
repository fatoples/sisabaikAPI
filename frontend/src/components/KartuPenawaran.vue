<script setup>
import { computed, ref, watch } from "vue";
import { formatRupiah, formatWaktu, tersedia } from "../lib/tampilan.js";
import { visualKategori, labelStatus, sisaWaktu } from "../lib/visual.js";
import Ikon from "./Ikon.vue";
const props = defineProps({
  penawaran: { type: Object, required: true },
  waktuSekarang: { type: Number, required: true },
  bolehPilih: { type: Boolean, default: false },
  ajakLogin: { type: Boolean, default: false },
  bolehUbah: { type: Boolean, default: false },
});
const emit = defineEmits(["pilih", "ubah"]);
const fotoGagal = ref(false);
watch(
  () => props.penawaran.fotoUrl,
  () => {
    fotoGagal.value = false;
  },
);
const memakaiFoto = computed(
  () => Boolean(props.penawaran.fotoUrl) && !fotoGagal.value,
);
const hemat = computed(
  () => props.penawaran.hargaNormal - props.penawaran.hargaPenawaran,
);
const diskon = computed(() =>
  props.penawaran.hargaNormal > 0
    ? Math.floor((hemat.value / props.penawaran.hargaNormal) * 100)
    : 0,
);
const dapatDipilih = computed(() =>
  tersedia(props.penawaran, props.waktuSekarang),
);
const visual = computed(() => visualKategori(props.penawaran.kategori));
</script>
<template>
  <article class="kartu offer-card">
    <div
      class="offer-visual"
      :class="[`visual-${visual.nada}`, { 'food-photo': memakaiFoto }]"
    >
      <img
        :src="memakaiFoto ? props.penawaran.fotoUrl : visual.gambar"
        :alt="memakaiFoto ? 'Foto ' + props.penawaran.nama : ''"
        @error="fotoGagal = true"
        width="640"
        height="420"
        loading="lazy"
        decoding="async"
      /><span class="offer-badge" v-if="props.penawaran.hargaPenawaran === 0"
        >Gratis</span
      ><span class="offer-badge" v-else-if="diskon > 0"
        >Hemat {{ diskon }}%</span
      ><span class="art-label">{{
        memakaiFoto ? "Foto dari penyedia" : "Ilustrasi kategori"
      }}</span>
    </div>
    <div class="offer-body">
      <div class="offer-topline">
        <p class="kategori">{{ visual.label }}</p>
        <span class="stock-label"
          >{{ props.penawaran.stok }} {{ props.penawaran.satuan }}</span
        >
      </div>
      <h3>{{ props.penawaran.nama }}</h3>
      <p class="provider-line">
        <Ikon nama="toko" />{{ props.penawaran.penyedia }}
      </p>
      <div class="offer-price">
        <p class="harga">
          {{
            props.penawaran.hargaPenawaran === 0
              ? "Gratis"
              : formatRupiah(props.penawaran.hargaPenawaran)
          }}<span>/ {{ props.penawaran.satuan }}</span>
        </p>
        <p class="normal-price">
          <span class="sr-only">Harga normal </span
          ><s>{{ formatRupiah(props.penawaran.hargaNormal) }}</s>
        </p>
      </div>
      <p class="saving-note">
        Potensi hemat {{ formatRupiah(hemat) }} per {{ props.penawaran.satuan }}
      </p>
      <div class="offer-time">
        <Ikon nama="jam" />
        <div>
          <strong>{{
            sisaWaktu(props.penawaran.berakhirPada, props.waktuSekarang)
          }}</strong
          ><time :datetime="props.penawaran.berakhirPada">{{
            formatWaktu(props.penawaran.berakhirPada)
          }}</time>
        </div>
        <span class="status-dot" :class="`status-${props.penawaran.status}`">{{
          labelStatus(props.penawaran.status)
        }}</span>
      </div>
      <button
        v-if="props.bolehPilih"
        class="button-wide"
        type="button"
        :disabled="!dapatDipilih"
        :aria-label="`Pilih ${props.penawaran.nama}`"
        @click="emit('pilih', props.penawaran.id)"
      >
        Pilih makanan<Ikon nama="panah" />
      </button>
      <RouterLink
        v-else-if="props.ajakLogin"
        class="button button-secondary button-wide"
        to="/login"
        >Login untuk memesan<Ikon nama="panah"
      /></RouterLink>
      <button
        v-if="props.bolehUbah"
        type="button"
        class="button-secondary button-wide"
        :aria-label="'Ubah ' + props.penawaran.nama"
        @click="emit('ubah', props.penawaran)"
      >
        Ubah penawaran<Ikon nama="panah" />
      </button>
    </div>
  </article>
</template>
