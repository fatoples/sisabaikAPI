\# EVALUASI PERFORMA APLIKASI SISABAIK



\## 1. Informasi Aplikasi



| Keterangan | Detail |

|---|---|

| Nama aplikasi | SisaBaik |

| URL aplikasi | https://sisabaik-ilda.onrender.com |

| Platform deployment | Render |

| Database | PostgreSQL (Neon Cloud) |

| Tanggal pemeriksaan | 17 November 2026 |



\## 2. Tujuan Pengujian



Pengujian performa dilakukan untuk mengetahui kemampuan aplikasi SisaBaik dalam merespons permintaan pengguna setelah aplikasi di-deploy pada lingkungan cloud.



Aspek yang diperhatikan meliputi ketersediaan server, respons API, pemuatan halaman utama, pemuatan aset frontend, dan koneksi database.



\## 3. Hasil Pemeriksaan Performa



| No. | Aspek | Hasil Pemeriksaan |

|---|---|---|

| 1 | Ketersediaan server | Endpoint `/healthz` memberikan respons HTTP 200 |

| 2 | Ketersediaan API | Endpoint `/api/health` memberikan respons HTTP 200 |

| 3 | Koneksi database | Pemeriksaan health check menunjukkan database terhubung |

| 4 | Pemuatan halaman utama | HTML aplikasi berhasil dimuat |

| 5 | Aset frontend | Aset JavaScript dan CSS berhasil diakses |



\## 4. Pengamatan



Berdasarkan pengujian deployment, aplikasi SisaBaik dapat diakses melalui URL publik dan berhasil memberikan respons pada endpoint pemeriksaan kesehatan server maupun API.



Halaman utama dan aset frontend juga berhasil dimuat. Hasil tersebut menunjukkan bahwa komponen utama aplikasi telah berjalan pada lingkungan cloud.



Namun, keberhasilan pemeriksaan endpoint belum dapat digunakan untuk menyimpulkan bahwa seluruh halaman aplikasi memiliki waktu pemuatan yang optimal.



\## 5. Pengukuran yang Masih Perlu Dilakukan



Pengukuran berikut belum memiliki data numerik sehingga perlu dilakukan pengujian lanjutan:



1\. Waktu pemuatan halaman pertama (initial page load).

2\. Ukuran total halaman dan aset yang diunduh.

3\. Waktu respons beberapa endpoint utama.

4\. Perbandingan pemuatan dengan cache kosong dan cache terisi.

5\. Pengujian responsivitas pada perangkat dengan ukuran layar berbeda.

6\. Pengamatan performa ketika aplikasi diakses berulang kali.



Data pengukuran dapat diperoleh melalui fitur Network pada Developer Tools browser.



\## 6. Kesimpulan



Hasil pemeriksaan awal menunjukkan bahwa aplikasi SisaBaik telah berjalan dan dapat diakses melalui layanan cloud. Server, API, koneksi database, halaman utama, serta aset frontend berhasil melewati pemeriksaan deployment.



Meskipun demikian, pengukuran performa secara kuantitatif masih perlu dilakukan. Oleh karena itu, belum dapat ditentukan nilai waktu pemuatan, ukuran transfer aktual, maupun tingkat performa aplikasi secara keseluruhan.
