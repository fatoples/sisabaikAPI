-- 1. READ: seluruh penawaran aktif beserta nama penyedia.
SELECT
p.id,
p.nama,
py.nama_usaha AS penyedia,
p.harga_normal,
p.harga_penawaran,
p.stok,
p.satuan,
p.berakhir_pada
FROM penawaran AS p
JOIN penyedia AS py ON py.id = p.penyedia_id
WHERE p.status = 'aktif'
AND p.stok > 0
AND p.berakhir_pada > CURRENT_TIMESTAMP
ORDER BY p.berakhir_pada ASC;
-- 2. READ dengan filter teks yang tidak peka huruf besar-kecil.
SELECT id, nama, kategori, stok
FROM penawaran
WHERE nama ILIKE '%roti%'
ORDER BY nama;
-- 3. JOIN detail pesanan lengkap.
SELECT
ps.id AS pesanan_id,
u.nama_lengkap AS pembeli,
py.nama_usaha,
p.nama AS penawaran,
dp.kuantitas,
dp.harga_penawaran_satuan,
dp.subtotal,
ps.status
FROM pesanan AS ps
JOIN pengguna AS u ON u.id = ps.pembeli_id
JOIN penyedia AS py ON py.id = ps.penyedia_id
JOIN detail_pesanan AS dp ON dp.pesanan_id = ps.id
JOIN penawaran AS p ON p.id = dp.penawaran_id
ORDER BY ps.id, p.nama;
-- 4. Agregasi indikator bisnis dan dampak.
SELECT
COUNT(DISTINCT ps.id) AS jumlah_pesanan,
COALESCE(SUM(dp.kuantitas), 0) AS makanan_terselamatkan,
COALESCE(SUM(dp.subtotal), 0) AS nilai_transaksi,
COALESCE(SUM(dp.nilai_stok), 0) AS nilai_stok_terselamatkan,
COALESCE(SUM(dp.nilai_stok - dp.subtotal), 0) AS penghematan
FROM pesanan AS ps
JOIN detail_pesanan AS dp ON dp.pesanan_id = ps.id
WHERE ps.status <> 'dibatalkan';
-- 5. LEFT JOIN mempertahankan penawaran yang belum pernah dipesan.
SELECT
p.id,
p.nama,
COALESCE(SUM(dp.kuantitas), 0) AS total_dipesan
FROM penawaran AS p
LEFT JOIN detail_pesanan AS dp ON dp.penawaran_id = p.id
GROUP BY p.id, p.nama
ORDER BY total_dipesan DESC, p.nama;