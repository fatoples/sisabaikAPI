-- Seluruh perubahan pada latihan ini dibatalkan agar dapat diulang.
BEGIN;

-- CREATE
INSERT INTO pengguna (nama_lengkap, email, peran)
VALUES ('Pengguna Latihan', 'latihan@example.test', 'pembeli')
RETURNING id, nama_lengkap, email, peran;

-- READ
SELECT id, nama_lengkap, email, aktif
FROM pengguna
WHERE email = 'latihan@example.test';

-- UPDATE
UPDATE pengguna
SET nama_lengkap = 'Pengguna Latihan Diperbarui', aktif = FALSE
WHERE email = 'latihan@example.test'
RETURNING id, nama_lengkap, aktif;

-- DELETE
DELETE FROM pengguna
WHERE email = 'latihan@example.test'
RETURNING id, email;

ROLLBACK;

-- Baris latihan tidak tersimpan setelah ROLLBACK.
SELECT COUNT(*) AS jumlah_baris_latihan
FROM pengguna
WHERE email = 'latihan@example.test';