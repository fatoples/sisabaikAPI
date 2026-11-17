-- Uji negatif terkontrol: setiap pelanggaran harus ditolak PostgreSQL.
-- Blok EXCEPTION menangkap kegagalan yang memang diharapkan sehingga
-- skrip tetap selesai dan tidak meninggalkan transaksi dalam status gagal.
DO $$
BEGIN
BEGIN
INSERT INTO pengguna (nama_lengkap, email, peran)
VALUES ('Uji Peran', 'uji.peran@example.test', 'admin');
RAISE EXCEPTION 'FAIL: CHECK peran tidak bekerja';
EXCEPTION
WHEN check_violation THEN
RAISE NOTICE 'PASS: peran di luar daftar ditolak';
END;
END;
$$;
DO $$
BEGIN
BEGIN
INSERT INTO penawaran (
penyedia_id, nama, kategori, harga_normal, harga_penawaran,
stok, satuan, status, berakhir_pada
) VALUES (
1, 'Uji Harga', 'uji', 10000, 15000,
1, 'paket', 'aktif', CURRENT_TIMESTAMP + INTERVAL '1 hour'
);
RAISE EXCEPTION 'FAIL: CHECK harga tidak bekerja';
EXCEPTION
WHEN check_violation THEN
RAISE NOTICE 'PASS: harga penawaran di atas harga normal ditolak';
END;
END;
$$;
DO $$
BEGIN
BEGIN
INSERT INTO detail_pesanan (
pesanan_id, penawaran_id, penyedia_id, kuantitas,
harga_normal_satuan, harga_penawaran_satuan
) VALUES (1, 1, 1, 1, 30000, 15000);
RAISE EXCEPTION 'FAIL: FK pasangan penyedia tidak bekerja';
EXCEPTION
WHEN foreign_key_violation THEN
RAISE NOTICE 'PASS: penawaran dari penyedia lain ditolak';
END;
END;
$$;
DO $$
BEGIN
BEGIN
DELETE FROM pengguna WHERE id = 1;
RAISE EXCEPTION 'FAIL: aturan ON DELETE RESTRICT tidak bekerja';
EXCEPTION
WHEN restrict_violation OR foreign_key_violation THEN
RAISE NOTICE 'PASS: pengguna penyedia yang masih dirujuk tidak dihapus';
END;
END;
$$;
SELECT
(SELECT COUNT(*) FROM pengguna
WHERE email IN ('uji.peran@example.test')) AS residu_pengguna,
(SELECT COUNT(*) FROM penawaran
WHERE nama = 'Uji Harga') AS residu_penawaran;