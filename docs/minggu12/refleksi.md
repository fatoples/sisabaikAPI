\# REFLEKSI PENGEMBANGAN APLIKASI SISABAIK



\## 1. Gambaran Umum Proyek



SisaBaik merupakan aplikasi berbasis web yang dikembangkan untuk membantu menghubungkan penyedia makanan dengan masyarakat yang ingin memperoleh makanan dengan harga lebih terjangkau. Aplikasi ini mengangkat permasalahan makanan berlebih yang masih layak konsumsi agar dapat ditawarkan kembali kepada calon pembeli.



Pengembangan SisaBaik berfokus pada dua jenis pengguna, yaitu penyedia makanan dan pembeli. Penyedia dapat membuat penawaran makanan, sedangkan pembeli dapat melihat penawaran dan melakukan pemesanan melalui aplikasi.



\## 2. Hasil Pengembangan



Selama proses pengembangan, beberapa fitur utama telah dibuat dan diuji, antara lain:



1\. Registrasi dan login pengguna.

2\. Proses verifikasi akun penyedia.

3\. Dashboard penyedia.

4\. Pengelolaan penawaran makanan.

5\. Tampilan daftar penawaran untuk pembeli.

6\. Fitur pemesanan makanan.

7\. Dashboard pembeli dan penyedia untuk melihat pesanan.

8\. Pengelolaan status pesanan.

9\. Pembatasan akses terhadap fitur yang membutuhkan autentikasi.



Aplikasi juga telah berhasil di-deploy menggunakan Render dan menggunakan PostgreSQL pada Neon sebagai database cloud.



\## 3. Hasil Pengujian dan Deployment



Pengujian otomatis deployment dilakukan terhadap sepuluh pemeriksaan yang mencakup ketersediaan server, koneksi database, pemuatan frontend, penanganan endpoint yang tidak tersedia, serta keamanan akses terhadap endpoint dan file internal.



Seluruh sepuluh pemeriksaan tersebut berhasil dilewati.



Selain pengujian otomatis, pengujian manual telah dilakukan terhadap sejumlah alur utama, seperti registrasi, login, pembuatan penawaran, pemesanan, tampilan dashboard, dan perubahan status pesanan.



Hasil ini menunjukkan bahwa aplikasi telah berhasil dijalankan pada lingkungan cloud dan fitur-fitur utama yang telah dicoba dapat digunakan.



\## 4. Manfaat Aplikasi



SisaBaik memiliki potensi manfaat bagi dua kelompok pengguna.



\*\*Bagi penyedia makanan:\*\*



\- Memberikan alternatif untuk menawarkan makanan berlebih yang masih layak konsumsi.

\- Membantu memperluas jangkauan calon pembeli.

\- Memberikan peluang untuk memperoleh kembali sebagian nilai ekonomi dari makanan yang ditawarkan.



\*\*Bagi pembeli:\*\*



\- Memberikan akses terhadap penawaran makanan dengan harga lebih terjangkau.

\- Membantu menemukan pilihan makanan melalui satu aplikasi.

\- Memberikan alternatif dalam memperoleh makanan yang masih layak konsumsi.



Manfaat tersebut merupakan tujuan dan potensi aplikasi. Dampak ekonomi maupun pengurangan limbah makanan secara nyata masih memerlukan pengukuran berdasarkan penggunaan aplikasi oleh pengguna sebenarnya.



\## 5. Kendala dan Keterbatasan



Dalam proses pengembangan, terdapat beberapa hal yang menjadi perhatian:



1\. Proses deployment memerlukan penyesuaian konfigurasi antara lingkungan lokal dan cloud.

2\. Koneksi database cloud perlu dikonfigurasi dengan benar agar aplikasi dapat berjalan pada lingkungan produksi.

3\. Pengujian perlu dilakukan secara berulang untuk memastikan fitur tetap berjalan setelah perubahan kode.

4\. Pengukuran performa secara kuantitatif belum diselesaikan.

5\. Audit aksesibilitas dan responsivitas belum dilakukan secara menyeluruh.

6\. Beberapa alur transaksi, seperti pembatalan pesanan, pengambilan makanan, dan pembayaran, masih memerlukan pengujian serta dokumentasi lanjutan.



Selain itu, proses transaksi pada aplikasi perlu dipahami sebagai simulasi alur pemesanan apabila belum melibatkan pembayaran uang secara nyata.



\## 6. Rencana Pengembangan Selanjutnya



Beberapa pengembangan yang dapat dilakukan untuk meningkatkan kualitas aplikasi SisaBaik adalah:



1\. Menyelesaikan pengujian seluruh alur transaksi dari sisi pembeli dan penyedia.

2\. Memperbaiki tampilan agar lebih konsisten dan responsif.

3\. Melakukan audit aksesibilitas dan memperbaiki elemen yang belum memenuhi kebutuhan pengguna.

4\. Melakukan pengukuran performa aplikasi menggunakan browser Developer Tools.

5\. Memperkuat validasi data dan penanganan kesalahan.

6\. Menambahkan dokumentasi penggunaan aplikasi bagi pembeli dan penyedia.

7\. Mengembangkan fitur pelaporan untuk membantu memantau aktivitas penawaran dan pemesanan.



\## 7. Pembelajaran yang Diperoleh



Pengembangan SisaBaik memberikan pengalaman dalam membangun aplikasi web yang melibatkan frontend, backend, database, autentikasi, dan deployment cloud.



Proses ini juga memberikan pemahaman bahwa keberhasilan sebuah aplikasi tidak hanya ditentukan oleh fitur yang tersedia, tetapi juga oleh keamanan, keandalan, kemudahan penggunaan, dan kualitas pengujian.



Melalui proses deployment, pengembang memperoleh pengalaman dalam menghubungkan aplikasi dengan layanan cloud serta memeriksa hasil penerapan melalui pengujian otomatis dan manual.



\## 8. Kesimpulan



Secara keseluruhan, pengembangan SisaBaik telah mencapai tahap aplikasi web yang dapat diakses melalui URL publik dan terhubung dengan database cloud. Sepuluh pemeriksaan otomatis deployment berhasil dilakukan, sedangkan beberapa fitur utama telah diuji secara manual.



Meskipun demikian, masih terdapat aspek yang perlu ditingkatkan, terutama pengujian alur transaksi secara menyeluruh, audit aksesibilitas, dan pengukuran performa. Hasil pengembangan ini menjadi dasar untuk penyempurnaan SisaBaik agar dapat menjadi aplikasi yang lebih stabil, aman, dan bermanfaat bagi pengguna.
