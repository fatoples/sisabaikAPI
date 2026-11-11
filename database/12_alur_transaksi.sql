
BEGIN;

ALTER TABLE penawaran
    ADD COLUMN IF NOT EXISTS versi BIGINT NOT NULL DEFAULT 0
        CHECK (versi >= 0),
    ADD COLUMN IF NOT EXISTS foto BYTEA
        CHECK (octet_length(foto) <= 409600),
    ADD COLUMN IF NOT EXISTS foto_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS foto_tipe VARCHAR(30)
        CHECK (foto_tipe IS NULL OR foto_tipe = 'image/webp');

ALTER TABLE pesanan
    ADD COLUMN IF NOT EXISTS metode_pembayaran VARCHAR(20) NOT NULL
        DEFAULT 'di-tempat'
        CHECK (metode_pembayaran = 'di-tempat'),
    ADD COLUMN IF NOT EXISTS status_pembayaran VARCHAR(20) NOT NULL
        DEFAULT 'belum-dibayar'
        CHECK (
            status_pembayaran IN (
                'belum-dibayar',
                'dibayar',
                'gratis'
            )
        ),
    ADD COLUMN IF NOT EXISTS dibayar_pada TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dikonfirmasi_pada TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS siap_pada TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS selesai_pada TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dibatalkan_pada TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS jenis_pembatalan VARCHAR(30)
        CHECK (
            jenis_pembatalan IN (
                'pembeli',
                'penyedia',
                'ditolak-penyedia'
            )
        ),
    ADD COLUMN IF NOT EXISTS alasan_pembatalan VARCHAR(500);

ALTER TABLE detail_pesanan
    ADD COLUMN IF NOT EXISTS nama_penawaran VARCHAR(120),
    ADD COLUMN IF NOT EXISTS satuan VARCHAR(20);

UPDATE detail_pesanan dp
SET
    nama_penawaran = COALESCE(dp.nama_penawaran, p.nama),
    satuan = COALESCE(dp.satuan, p.satuan)
FROM penawaran p
WHERE p.id = dp.penawaran_id
  AND (
      dp.nama_penawaran IS NULL
      OR dp.satuan IS NULL
  );

UPDATE pesanan
SET status_pembayaran = 'gratis'
WHERE total_transaksi = 0
  AND status_pembayaran = 'belum-dibayar';

CREATE INDEX IF NOT EXISTS idx_pesanan_pembeli_status
    ON pesanan (pembeli_id, status, id DESC);

CREATE INDEX IF NOT EXISTS idx_pesanan_penyedia_status
    ON pesanan (penyedia_id, status, id DESC);

COMMIT;
