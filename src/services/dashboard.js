
import { transaksi } from "../db/transaksi.js";

export function ringkasanDashboard(pengguna) {
    const pembeli = pengguna.peran === "pembeli";

    // Nama kolom dipilih dari dua nilai tetap agar aman dari SQL injection.
    const kolom = pembeli ? "pembeli_id" : "penyedia_id";
    const id = pembeli ? pengguna.id : pengguna.penyediaId;

    if (!id) {
        throw new Error("ID pengguna untuk dashboard tidak ditemukan.");
    }

    return transaksi(async (client) => {
        // EXISTS mencegah penggandaan angka akibat JOIN detail/pengambilan.
        const hasil = await client.query(
            `
            WITH ringkasan AS (
                SELECT
                    ps.*,
                    COALESCE(
                        (
                            SELECT SUM(dp.kuantitas)
                            FROM detail_pesanan dp
                            WHERE dp.pesanan_id = ps.id
                        ),
                        0
                    ) AS unit,
                    (
                        ps.status = 'selesai'
                        AND EXISTS (
                            SELECT 1
                            FROM pengambilan g
                            WHERE g.pesanan_id = ps.id
                              AND g.status = 'diambil'
                              AND g.diambil_pada IS NOT NULL
                        )
                    ) AS tersalur
                FROM pesanan ps
                WHERE ps.${kolom} = $1
            ),
            lengkap AS (
                SELECT
                    *,
                    (
                        tersalur
                        AND status_pembayaran IN ('dibayar', 'gratis')
                    ) AS lunas
                FROM ringkasan
            )
            SELECT
                COUNT(*)::text AS total,

                COUNT(*) FILTER (
                    WHERE status <> 'dibatalkan'
                )::text AS jumlah,

                COUNT(*) FILTER (
                    WHERE status = 'menunggu-konfirmasi'
                )::text AS menunggu,

                COUNT(*) FILTER (
                    WHERE status = 'dikonfirmasi'
                )::text AS dikonfirmasi,

                COUNT(*) FILTER (
                    WHERE status = 'siap-diambil'
                )::text AS siap,

                COUNT(*) FILTER (
                    WHERE tersalur
                )::text AS selesai,

                COUNT(*) FILTER (
                    WHERE status = 'dibatalkan'
                )::text AS batal,

                COUNT(*) FILTER (
                    WHERE status IN (
                        'menunggu-konfirmasi',
                        'dikonfirmasi',
                        'siap-diambil'
                    )
                )::text AS berjalan,

                COALESCE(
                    SUM(total_transaksi) FILTER (
                        WHERE status <> 'dibatalkan'
                    ),
                    0
                )::text AS nilai_pemesanan,

                COALESCE(
                    SUM(unit) FILTER (
                        WHERE status <> 'dibatalkan'
                    ),
                    0
                )::text AS unit_dipesan,

                COALESCE(
                    SUM(total_transaksi) FILTER (
                        WHERE lunas
                    ),
                    0
                )::text AS nilai_selesai,

                COALESCE(
                    SUM(unit) FILTER (
                        WHERE tersalur
                    ),
                    0
                )::text AS unit_tersalur,

                COALESCE(
                    SUM(nilai_stok_terselamatkan) FILTER (
                        WHERE tersalur
                    ),
                    0
                )::text AS nilai_normal,

                COALESCE(
                    SUM(total_transaksi) FILTER (
                        WHERE lunas
                    ),
                    0
                )::text AS pendapatan,

                COALESCE(
                    SUM(nilai_stok_terselamatkan - total_transaksi)
                    FILTER (WHERE lunas),
                    0
                )::text AS penghematan,

                COUNT(*) FILTER (
                    WHERE tersalur
                      AND status_pembayaran = 'belum-dibayar'
                )::text AS pembayaran_belum_tercatat

            FROM lengkap
            `,
            [id]
        );

        const r = hasil.rows[0];

        let penawaran = {
            jumlah: "0",
            aktif: "0",
            stok: "0",
        };

        // Ringkasan penawaran hanya berlaku untuk penyedia.
        if (!pembeli) {
            const offers = await client.query(
                `
                SELECT
                    COUNT(*)::text AS jumlah,

                    COUNT(*) FILTER (
                        WHERE status = 'aktif'
                          AND stok > 0
                          AND berakhir_pada > clock_timestamp()
                    )::text AS aktif,

                    COALESCE(
                        SUM(stok) FILTER (
                            WHERE status = 'aktif'
                              AND berakhir_pada > clock_timestamp()
                        ),
                        0
                    )::text AS stok

                FROM penawaran
                WHERE penyedia_id = $1
                `,
                [id]
            );

            penawaran = offers.rows[0];
        }

        return {
            peran: pengguna.peran,
            cakupan: pembeli
                ? "Pesanan saya"
                : "Pesanan usaha saya",

            jumlahPesananTotal: r.total,
            jumlahPesanan: r.jumlah,
            jumlahMenunggu: r.menunggu,
            jumlahDikonfirmasi: r.dikonfirmasi,
            jumlahSiapDiambil: r.siap,
            jumlahSelesai: r.selesai,
            jumlahDibatalkan: r.batal,
            jumlahBerjalan: r.berjalan,

            nilaiPemesanan: r.nilai_pemesanan,
            unitDipesan: r.unit_dipesan,
            nilaiTransaksiSelesai: r.nilai_selesai,
            unitTersalurkan: r.unit_tersalur,
            nilaiNormalTersalurkan: r.nilai_normal,

            totalBelanja: pembeli ? r.pendapatan : "0",
            pendapatanDiterima: pembeli ? "0" : r.pendapatan,

            penghematanPembeli: pembeli
                ? r.penghematan
                : "0",

            diskonDiberikan: pembeli
                ? "0"
                : r.penghematan,

            penghematanBiayaPenjual: null,
            pembayaranBelumTercatat: r.pembayaran_belum_tercatat,

            jumlahPenawaran: penawaran.jumlah,
            penawaranAktif: penawaran.aktif,
            stokTersedia: penawaran.stok,

            dihitungPada: new Date().toISOString(),
        };
    }, true);
}
