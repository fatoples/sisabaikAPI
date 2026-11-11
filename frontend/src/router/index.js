import { createRouter, createWebHashHistory } from "vue-router";
import { sesi } from "../lib/sesi.js";
import KatalogView from "../views/KatalogView.vue";
const LoginView = () => import("../views/LoginView.vue");
const RegistrasiView = () => import("../views/RegistrasiView.vue");
const ProfilPenyediaView = () => import("../views/ProfilPenyediaView.vue");
const PenyediaView = () => import("../views/PenyediaView.vue");
const PesananView = () => import("../views/PesananView.vue");
const DetailPesananView = () => import("../views/DetailPesananView.vue");
const DashboardView = () => import("../views/DashboardView.vue");
const InfoView = () => import("../views/InfoView.vue");

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: KatalogView, meta: { judul: "Katalog" } },
    {
      path: "/login",
      component: LoginView,
      meta: { judul: "Login" },
    },
    {
      path: "/daftar",
      component: RegistrasiView,
      meta: { judul: "Daftar" },
    },
    {
      path: "/akun/penyedia",
      component: ProfilPenyediaView,
      meta: { judul: "Profil usaha", auth: true, peran: "penyedia" },
    },
    {
      path: "/penyedia",
      component: PenyediaView,
      meta: {
        judul: "Penawaran saya",
        auth: true,
        peran: "penyedia",
        penyediaTerverifikasi: true,
      },
    },
    {
      path: "/pesanan",
      component: PesananView,
      meta: { judul: "Pesanan", auth: true, penyediaTerverifikasi: true },
    },
    {
      path: "/pesanan/:id([1-9][0-9]*)",
      component: DetailPesananView,
      meta: {
        judul: "Detail pesanan",
        auth: true,
        penyediaTerverifikasi: true,
      },
    },
    {
      path: "/dashboard",
      component: DashboardView,
      meta: { judul: "Dashboard", auth: true, penyediaTerverifikasi: true },
    },
    {
      path: "/ditolak",
      component: InfoView,
      props: {
        judul: "Akses ditolak",
        pesan: "Peran akun tidak sesuai halaman ini.",
      },
    },
    {
      path: "/:pathMatch(.*)*",
      component: InfoView,
      props: {
        judul: "Halaman tidak ditemukan",
        pesan: "Periksa alamat halaman.",
      },
    },
  ],
});
router.beforeEach((to) => {
  if (to.meta.auth && (!sesi.pengguna || sesi.keluar)) return "/login";
  if (to.meta.peran && sesi.pengguna?.peran !== to.meta.peran)
    return "/ditolak";
  if (
    to.meta.penyediaTerverifikasi &&
    sesi.pengguna?.peran === "penyedia" &&
    sesi.pengguna.statusVerifikasi !== "terverifikasi"
  )
    return "/akun/penyedia";
  if (["/login", "/daftar"].includes(to.path) && sesi.pengguna && !sesi.keluar)
    return "/";
});
router.afterEach((to) => {
  document.title = `${to.meta.judul ?? "Informasi"} | SisaBaik`;
});
