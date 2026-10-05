-- Transaksi contoh: membuat satu pesanan dan mengurangi stok secara atomik.
BEGIN;

DO $$
DECLARE
    v_pembeli_id BIGINT;
    v_penyedia_id BIGINT;
    v_penawaran penawaran%ROWTYPE;
    v_pesanan_id BIGINT;
    v_kuantitas INTEGER := 1;
BEGIN
    SELECT id INTO STRICT v_pembeli_id
    FROM pengguna
    WHERE email = 'andi.pembeli@example.test'
      AND peran = 'pembeli';

    SELECT * INTO STRICT v_penawaran
    FROM penawaran
    WHERE id = 1
    FOR UPDATE;

    v_penyedia_id := v_penawaran.penyedia_id;

    IF v_penawaran.status <> 'aktif'
       OR v_penawaran.berakhir_pada <= CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Penawaran tidak aktif atau sudah kedaluwarsa';
    END IF;

    IF v_penawaran.stok < v_kuantitas THEN
        RAISE EXCEPTION 'Stok tidak mencukupi';
    END IF;

    INSERT INTO pesanan (pembeli_id, penyedia_id)
    VALUES (v_pembeli_id, v_penyedia_id)
    RETURNING id INTO v_pesanan_id;

    INSERT INTO detail_pesanan (
        pesanan_id,
        penawaran_id,
        penyedia_id,
        kuantitas,
        harga_normal_satuan,
        harga_penawaran_satuan
    ) VALUES (
        v_pesanan_id,
        v_penawaran.id,
        v_penyedia_id,
        v_kuantitas,
        v_penawaran.harga_normal,
        v_penawaran.harga_penawaran
    );

    UPDATE penawaran
    SET stok = stok - v_kuantitas
    WHERE id = v_penawaran.id;

    UPDATE pesanan AS ps
    SET
        total_transaksi = ringkasan.total,
        nilai_stok_terselamatkan = ringkasan.nilai_stok
    FROM (
        SELECT
            SUM(subtotal) AS total,
            SUM(nilai_stok) AS nilai_stok
        FROM detail_pesanan
        WHERE pesanan_id = v_pesanan_id
    ) AS ringkasan
    WHERE ps.id = v_pesanan_id;

END;
$$;

COMMIT;

SELECT
    id,
    pembeli_id,
    penyedia_id,
    total_transaksi,
    nilai_stok_terselamatkan,
    status
FROM pesanan
ORDER BY id DESC
LIMIT 1;