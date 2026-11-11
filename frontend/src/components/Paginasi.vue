<script setup>
import Ikon from "./Ikon.vue";
const props = defineProps({
  meta: { type: Object, required: true },
  sibuk: { type: Boolean, default: false },
});
const emit = defineEmits(["halaman"]);
</script>
<template>
  <nav class="paginasi" aria-label="Halaman hasil">
    <button
      class="button-secondary"
      type="button"
      :disabled="props.sibuk || props.meta.page <= 1"
      @click="emit('halaman', props.meta.page - 1)"
    >
      <Ikon nama="kiri" />Sebelumnya
    </button>
    <p role="status" aria-live="polite">
      Halaman {{ props.meta.page }} dari {{ Math.max(1, props.meta.totalPages)
      }}<span> — {{ props.meta.jumlah }} hasil</span>
    </p>
    <button
      class="button-secondary"
      type="button"
      :disabled="props.sibuk || props.meta.page >= props.meta.totalPages"
      @click="emit('halaman', props.meta.page + 1)"
    >
      Berikutnya<Ikon nama="panah" />
    </button>
  </nav>
</template>
