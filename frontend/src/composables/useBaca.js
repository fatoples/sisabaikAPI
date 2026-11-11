import { ref, onUnmounted } from "vue";
import { pesanError } from "../lib/api.js";

export function useBaca(baca) {
  const data = ref(null);
  const sibuk = ref(false);
  const error = ref("");
  let controller;
  let urutan = 0;
  function batalkan() {
    urutan++;
    controller?.abort();
    sibuk.value = false;
    data.value = null;
    error.value = "";
  }
  async function muat() {
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;
    const nomor = ++urutan;
    sibuk.value = true;
    error.value = "";
    data.value = null;
    try {
      const hasil = await baca(signal);
      if (nomor === urutan && !signal.aborted) data.value = hasil;
    } catch (e) {
      if (nomor === urutan && e.name !== "AbortError") {
        error.value = pesanError(e);
      }
    } finally {
      if (nomor === urutan) sibuk.value = false;
    }
  }
  onUnmounted(() => {
    urutan++;
    controller?.abort();
  });
  return { data, sibuk, error, muat, batalkan };
}
