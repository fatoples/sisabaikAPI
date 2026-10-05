BEGIN;

INSERT INTO pengguna (nama_lengkap, email, peran) VALUES
 ('Rina Putri', 'rina.penyedia@example.test', 'penyedia'),
 ('Budi Santoso', 'budi.penyedia@example.test', 'penyedia'),
 ('Siti Rahma', 'siti.pembeli@example.test', 'pembeli'),
 ('Andi Saputra', 'andi.pembeli@example.test', 'pembeli');

INSERT INTO penyedia (
 pengguna_id, nama_usaha, alamat, nomor_telepon, status_verifikasi
) VALUES
 (1, 'Lapau Uni Rina', 'Jl. Merpati No. 10, Padang', '081200000001', 'terverifikasi'),
 (2, 'Roti Minang', 'Jl. Sudirman No. 21, Padang', '081200000002', 'terverifikasi');

INSERT INTO penawaran (
 penyedia_id, nama, kategori, harga_normal, harga_penawaran,
 stok, satuan, status, berakhir_pada
) VALUES
 (
 2, 'Paket Roti Sore', 'roti', 30000, 15000,
 6, 'paket', 'aktif', CURRENT_TIMESTAMP + INTERVAL '1 day'
 ),
 (
 1, 'Nasi Padang Hemat', 'makanan-siap-saji', 25000, 12000,
 4, 'porsi', 'aktif', CURRENT_TIMESTAMP + INTERVAL '8 hours'
 ),
 (
 1, 'Sayur Layak Olah', 'bahan-segar', 18000, 0,
 5, 'paket', 'aktif', CURRENT_TIMESTAMP + INTERVAL '12 hours'
 );

INSERT INTO pesanan (
 pembeli_id, penyedia_id, status, total_transaksi,
 nilai_stok_terselamatkan
) VALUES
 (3, 1, 'siap-diambil', 12000, 25000);

INSERT INTO detail_pesanan (
 pesanan_id, penawaran_id, penyedia_id, kuantitas,
 harga_normal_satuan, harga_penawaran_satuan
) VALUES
 (1, 2, 1, 1, 25000, 12000);

INSERT INTO pengambilan (
 pesanan_id, kode, jadwal_pada, status
) VALUES
 (1, 'AMBIL-0001', CURRENT_TIMESTAMP + INTERVAL '2 hours', 'terjadwal');

COMMIT;