<script setup>
import Ikon from "./Ikon.vue";
const props = defineProps({
  sibuk: { type: Boolean, required: true },
  error: { type: String, required: true },
});
const emit = defineEmits(["ulang"]);
</script>
<template>
  <p v-if="props.sibuk" class="loading-state" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>Memuat data dari server…
  </p>
  <div v-if="props.error" class="notice notice-error">
    <Ikon nama="info" />
    <div>
      <p role="alert">{{ props.error }}</p>
      <button
        class="button-secondary"
        type="button"
        :disabled="props.sibuk"
        @click="emit('ulang')"
      >
        <Ikon nama="ulang" />Muat ulang data
      </button>
    </div>
  </div>
</template>
