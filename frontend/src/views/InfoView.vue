<script setup>
import Ikon from "../components/Ikon.vue";
const props = defineProps({ judul: String, pesan: String });
</script>
<template>
  <section class="container section info-page">
    <span class="icon-tile"><Ikon nama="info" /></span>
    <p class="eyebrow">Mari kembali ke jalur yang tepat</p>
    <h1>{{ props.judul }}</h1>
    <p class="muted">{{ props.pesan }}</p>
    <RouterLink class="button" to="/"
      >Kembali ke katalog<Ikon nama="panah"
    /></RouterLink>
  </section>
</template>
