\# LOG PENGUJIAN CLOUD SISABAIK



\## 1. Informasi Pengujian



| Keterangan | Detail |

|---|---|

| Nama aplikasi | SisaBaik |

| Platform deployment | Render |

| Database | PostgreSQL (Neon Cloud) |

| URL aplikasi | https://sisabaik-ilda.onrender.com |

| Tanggal pengujian | 17 November 2026 |



\## 2. Tujuan Pengujian



Pengujian cloud dilakukan untuk memastikan aplikasi SisaBaik dapat berjalan pada lingkungan produksi, dapat terhubung dengan database cloud, dan dapat diakses melalui alamat publik.



Pengujian juga bertujuan untuk memeriksa respons server, ketersediaan API, pemuatan frontend, serta perlindungan terhadap akses yang tidak diizinkan.



\## 3. Hasil Pemeriksaan Koneksi Cloud



| No. | Komponen | Pemeriksaan | Hasil |

|---|---|---|---|

| 1 | Render | Status layanan aplikasi | Berhasil diakses |

| 2 | Server | Endpoint `/healthz` | HTTP 200 OK |

| 3 | API | Endpoint `/api/health` | HTTP 200 OK |

| 4 | Database | Koneksi database melalui health check | Terhubung |

| 5 | Frontend | Halaman utama aplikasi | Berhasil dimuat |

| 6 | Aset frontend | JavaScript dan CSS | Berhasil diakses |



\## 4. Pengujian Keamanan Akses



Pengujian dilakukan untuk memastikan endpoint yang memerlukan autentikasi tidak dapat diakses secara langsung tanpa identitas pengguna yang sah.



| No. | Endpoint | Hasil Respons | Keterangan |

|---|---|---|---|

| 1 | `/api/auth/saya` | HTTP 401 | Akses tanpa autentikasi ditolak |

| 2 | `/api/dashboard` | HTTP 401 | Akses tanpa autentikasi ditolak |

| 3 | `/api/pesanan` | HTTP 401 | Akses tanpa autentikasi ditolak |

| 4 | `/.env` | HTTP 404 | File konfigurasi tidak dapat diakses |

| 5 | `/server.js` | HTTP 404 | File internal server tidak dapat diakses |

| 6 | `/api/tidak-ada` | HTTP 404 | Endpoint yang tidak tersedia ditangani dengan benar |



\## 5. Pengujian Fitur Aplikasi



Berdasarkan pengujian manual yang telah dilakukan, beberapa fitur utama aplikasi berhasil dicoba:



\- Registrasi dan login akun penyedia.

\- Proses verifikasi akun penyedia melalui cloud.

\- Pengelolaan penawaran makanan.

\- Penampilan penawaran pada sisi pembeli.

\- Pembuatan pesanan oleh pembeli.

\- Penampilan pesanan pada dashboard pembeli dan penyedia.

\- Perubahan status pesanan.

\- Login dan logout pengguna.

\- Pemeriksaan akses dashboard tanpa autentikasi.



\## 6. Bukti Pengujian Otomatis



Pengujian otomatis dijalankan menggunakan perintah:



`npm run deploy:test -- https://sisabaik-ilda.onrender.com`



Hasil pengujian menunjukkan:



`Selesai: 10 pemeriksaan lulus. Tidak ada data ditulis.`



File bukti hasil pengujian tersedia pada:



`bukti/pengujian-deployment.txt`



\## 7. Catatan dan Evaluasi



Pengujian menunjukkan bahwa aplikasi SisaBaik telah dapat diakses melalui server cloud Render dan terhubung dengan database PostgreSQL pada Neon.



Pemeriksaan endpoint juga menunjukkan bahwa server dapat membedakan permintaan yang valid, permintaan tanpa autentikasi, dan permintaan menuju endpoint yang tidak tersedia.



Pengujian lanjutan masih diperlukan untuk mendokumentasikan keseluruhan proses transaksi, termasuk pembatalan pesanan, konfirmasi penyedia, pengambilan makanan, dan pembayaran. Hasil pengujian tersebut akan ditambahkan setelah prosesnya benar-benar dilakukan.



\*\*Catatan keamanan:\*\* Dokumentasi ini tidak mencantumkan password database, token autentikasi, JWT secret, maupun informasi rahasia lainnya.
