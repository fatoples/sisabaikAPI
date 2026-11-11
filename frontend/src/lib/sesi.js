import { reactive, readonly } from "vue";

const state = reactive({ pengguna: null, pesan: "", keluar: false });
let accessToken = "";
let versi = 0;
export const sesi = readonly(state);
export const bacaToken = () => accessToken;
export const versiSesi = () => versi;
export function isiSesi(data) {
  versi++;
  accessToken = data.accessToken;
  state.pengguna = data.pengguna;
  state.pesan = "";
}
export function perbaruiPengguna(pengguna) {
  if (accessToken && state.pengguna && !state.keluar) {
    state.pengguna = pengguna;
  }
}
export function hapusSesi(pesan = "") {
  versi++;
  accessToken = "";
  state.pengguna = null;
  state.pesan = pesan;
}
export function tandaiKeluar(nilai) {
  state.keluar = nilai;
}
