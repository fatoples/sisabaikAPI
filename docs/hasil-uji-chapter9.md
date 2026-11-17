# Laporan Hasil Uji Chapter 9 - Membangun Antarmuka dengan Vue

- **Penguji**: Ilda Hidayati
- **Tanggal**: 2 November 2026
- **Versi Node.js**: v22.18.0
- **Branch**: feature/vue-components

## Ringkasan Hasil Pengujian
1. **Katalog Pembeli**: Menampilkan 3 kartu aktif, 15 total unit, dan 2 penyedia aktif dari fixture memori.
2. **Filter & Pencarian**: Filter nama, penyedia, dan kategori menyaring data tanpa merusak array sumber.
3. **Formulir Penawaran**: Validasi menolak input invalid (stok pecahan, harga kosong, tanggal lampau) dan menerima harga Rp0 (Gratis).
4. **Ringkasan Penyedia (Lapau Uni Rina)**: Menampilkan 3 penawaran milik Rina, 2 penawaran tersedia, dan 9 unit tersedia.
5. **Aliran Data**: Props mengalir turun ke anak, event `emit` naik ke induk (`App.vue`), dan state terpusat di induk.

## Tangkapan Layar (Screenshot)
- Screenshot Katalog Utama
- Screenshot Empty State
- Screenshot Validasi Form Invalid
- Screenshot Form Valid
- Screenshot Tampilan Mobile
- Screenshot Terminal Build