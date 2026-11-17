\# MATRIKS PENGUJIAN SISABAIK



\## 1. Informasi Pengujian



| Keterangan | Detail |

|---|---|

| Nama aplikasi | SisaBaik |

| Jenis aplikasi | Aplikasi web |

| Backend | Node.js dan Express |

| Frontend | Vue.js |

| Database | PostgreSQL (Neon Cloud) |

| Platform deployment | Render |

| URL aplikasi | https://sisabaik-ilda.onrender.com |

| Waktu pengujian | 17 November 2026 |



\## 2. Pengujian Otomatis Deployment



Pengujian otomatis dilakukan menggunakan script `scripts/uji-deployment.js` terhadap aplikasi yang telah di-deploy pada Render.



| No. | Skenario Pengujian | Hasil yang Diharapkan | Hasil Aktual | Status |

|---|---|---|---|---|

| 1 | Mengakses `/healthz` | Server memberikan respons 200 | Respons 200 | Lulus |

| 2 | Mengakses `/api/health` | API dan database terhubung | Respons 200 | Lulus |

| 3 | Mengakses halaman utama `/` | HTML aplikasi berhasil dimuat | Elemen aplikasi ditemukan | Lulus |

| 4 | Memuat aset JavaScript dan CSS | Aset frontend dapat diakses | Aset berhasil diakses | Lulus |

| 5 | Mengakses endpoint yang tidak tersedia | Server memberikan respons 404 | Respons 404 | Lulus |

| 6 | Mengakses `/api/auth/saya` tanpa autentikasi | Server menolak akses dengan 401 | Respons 401 | Lulus |

| 7 | Mengakses `/api/dashboard` tanpa autentikasi | Server menolak akses dengan 401 | Respons 401 | Lulus |

| 8 | Mengakses `/api/pesanan` tanpa autentikasi | Server menolak akses dengan 401 | Respons 401 | Lulus |

| 9 | Mengakses file `/.env` | File konfigurasi tidak dapat diakses | Respons 404 | Lulus |

| 10 | Mengakses `/server.js` | File internal server tidak dapat diakses | Respons 404 | Lulus |



\*\*Hasil:\*\* 10 dari 10 pemeriksaan otomatis berhasil.



Bukti pengujian tersimpan pada:

`bukti/pengujian-deployment.txt`



\## 3. Pengujian Fungsional Manual



Pengujian manual dilakukan dengan mencoba fitur aplikasi berdasarkan alur penggunaan pembeli dan penyedia makanan.



| No. | Skenario | Hasil Pengujian |

|---|---|---|

| 1 | Registrasi akun penyedia | Berhasil diuji |

| 2 | Verifikasi akun penyedia melalui proses cloud | Berhasil diuji |

| 3 | Login akun penyedia | Berhasil diuji |

| 4 | Membuka dashboard penyedia | Berhasil diuji |

| 5 | Membuat penawaran makanan | Berhasil diuji |

| 6 | Melihat penawaran dari sisi pembeli | Berhasil diuji |

| 7 | Melakukan pemesanan sebagai pembeli | Berhasil diuji |

| 8 | Melihat pesanan pada dashboard pembeli | Berhasil diuji |

| 9 | Melihat pesanan pada dashboard penyedia | Berhasil diuji |

| 10 | Mengubah status pesanan | Berhasil diuji |

| 11 | Login dan logout | Berhasil diuji |

| 12 | Membuka dashboard tanpa autentikasi | Berhasil diuji |

| 13 | Membuka halaman utama melalui mode incognito | Berhasil diuji |



Catatan: Hasil pengujian manual dicatat berdasarkan fitur yang telah dicoba. Pengujian yang belum dilakukan tidak dinyatakan lulus.



\## 4. Pengujian yang Belum Didokumentasikan



Beberapa aspek berikut masih perlu diperiksa dan dilengkapi dengan bukti pengujian:



1\. Pengujian pembatalan pesanan dan pemulihan stok.

2\. Pengujian konfirmasi pesanan oleh penyedia.

3\. Pengujian proses pengambilan makanan dan pembayaran.

4\. Pengujian navigasi menggunakan keyboard.

5\. Pengujian responsivitas pada berbagai ukuran layar.

6\. Audit aksesibilitas dan kontras warna.

7\. Pengukuran performa aplikasi.

8\. Pemeriksaan Console browser dan log aplikasi setelah pengujian alur transaksi.



\## 5. Kesimpulan



Berdasarkan pengujian otomatis deployment, seluruh 10 pemeriksaan berhasil dijalankan pada aplikasi SisaBaik yang telah di-deploy menggunakan Render. Pemeriksaan tersebut mencakup ketersediaan server, koneksi database, pemuatan halaman utama, aset frontend, penanganan endpoint yang tidak tersedia, perlindungan endpoint API, serta pembatasan akses terhadap file internal.



Pengujian manual juga telah dilakukan terhadap sejumlah fitur utama aplikasi, termasuk autentikasi, pengelolaan penawaran makanan, pemesanan, dan dashboard pengguna. Meskipun demikian, masih terdapat beberapa aspek yang perlu diuji lebih lanjut agar dokumentasi pengujian mencakup keseluruhan alur aplikasi.
