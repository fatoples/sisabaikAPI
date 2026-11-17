import { pool } from "../db/pool.js";
import { transaksi } from "../db/transaksi.js";
import { HttpError, metaHalaman } from "../lib/api.js";

const headerSql = `SELECT ps.*, u.nama_lengkap AS nama_pemesan,
  py.nama_usaha AS penyedia FROM pesanan ps
  JOIN pengguna u ON u.id=ps.pembeli_id
  JOIN penyedia py ON py.id=ps.penyedia_id`;

function keHeader(row) {
  return {
    id: String(row.id),
    pembeliId: String(row.pembeli_id),
    penyediaId: String(row.penyedia_id),
    penyedia: row.penyedia,
    namaPemesan: row.nama_pemesan,
    status: row.status,
    total: Number(row.total_transaksi),
    nilaiStokTerselamatkan: Number(row.nilai_stok_terselamatkan),
    dibuatPada: new Date(row.dibuat_pada).toISOString(),
    metodePembayaran: row.metode_pembayaran,
    statusPembayaran: row.status_pembayaran,
    dibayarPada: row.dibayar_pada
      ? new Date(row.dibayar_pada).toISOString()
      : null,
    dikonfirmasiPada: row.dikonfirmasi_pada
      ? new Date(row.dikonfirmasi_pada).toISOString()
      : null,
    siapPada: row.siap_pada ? new Date(row.siap_pada).toISOString() : null,
    selesaiPada: row.selesai_pada
      ? new Date(row.selesai_pada).toISOString()
      : null,
    dibatalkanPada: row.dibatalkan_pada
      ? new Date(row.dibatalkan_pada).toISOString()
      : null,
    jenisPembatalan: row.jenis_pembatalan,
    alasanPembatalan: row.alasan_pembatalan,
  };
}

function cakupan(pengguna) {
  if (pengguna.peran === "pembeli") {
    return { kolom: "ps.pembeli_id", id: pengguna.id };
  }
  if (pengguna.peran === "penyedia" && pengguna.penyediaId) {
    return { kolom: "ps.penyedia_id", id: pengguna.penyediaId };
  }
  throw new HttpError(
    403,
    "ROLE_FORBIDDEN",
    "Profil atau peran tidak diizinkan.",
  );
}

async function bacaDetail(id, client, pengguna) {
  const scope = cakupan(pengguna);
  const header = await client.query(
    `${headerSql} WHERE ps.id=$1 AND ${scope.kolom}=$2`,
    [id, scope.id],
  );
  if (!header.rowCount) {
    throw new HttpError(404, "ORDER_NOT_FOUND", "Pesanan tidak ditemukan.");
  }
  const detail = await client.query(
    `SELECT dp.*, COALESCE(dp.nama_penawaran, p.nama) AS nama FROM detail_pesanan dp
     JOIN penawaran p ON p.id=dp.penawaran_id
     WHERE dp.pesanan_id=$1 ORDER BY dp.penawaran_id`,
    [id],
  );
  const pickup = await client.query(
    "SELECT kode, jadwal_pada, diambil_pada, status FROM pengambilan WHERE pesanan_id=$1",
    [id],
  );
  const g = pickup.rows[0];
  const status = header.rows[0].status;
  const penyedia = pengguna.peran === "penyedia";
  const bolehAksi =
    status === "menunggu-konfirmasi"
      ? penyedia
        ? ["konfirmasi", "tolak", "batal"]
        : ["batal"]
      : penyedia && status === "dikonfirmasi"
        ? ["siap", "batal"]
        : penyedia && status === "siap-diambil"
          ? ["selesai", "batal"]
          : [];
  return {
    ...keHeader(header.rows[0]),
    bolehAksi,
    pengambilan: g
      ? {
          kode: g.kode,
          status: g.status,
          jadwalPada: new Date(g.jadwal_pada).toISOString(),
          diambilPada: g.diambil_pada
            ? new Date(g.diambil_pada).toISOString()
            : null,
        }
      : null,
    items: detail.rows.map((row) => ({
      penawaranId: String(row.penawaran_id),
      nama: row.nama,
      satuan: row.satuan,
      kuantitas: row.kuantitas,
      hargaSatuan: Number(row.harga_penawaran_satuan),
      subtotal: Number(row.subtotal),
      nilaiStokTerselamatkan: Number(row.nilai_stok),
    })),
  };
}

export function detailPesanan(id, pengguna) {
  return transaksi((client) => bacaDetail(id, client, pengguna), true);
}

export function daftarPesanan(paging, pengguna) {
  const scope = cakupan(pengguna);
  return transaksi(async (client) => {
    const count = await client.query(
      `SELECT COUNT(*)::int AS jumlah FROM pesanan ps WHERE ${scope.kolom}=$1`,
      [scope.id],
    );
    const hasil = await client.query(
      `${headerSql} WHERE ${scope.kolom}=$1
       ORDER BY ps.id DESC LIMIT $2 OFFSET $3`,
      [scope.id, paging.limit, paging.offset],
    );
    return {
      data: hasil.rows.map(keHeader),
      meta: metaHalaman(count.rows[0].jumlah, paging),
    };
  }, true);
}

export function buatPesanan(data, pengguna) {
  return transaksi(async (client) => {
    const pembeli = await client.query(
      `SELECT id FROM pengguna WHERE id=$1
       AND peran='pembeli' AND aktif=TRUE`,
      [data.pembeliId],
    );
    if (!pembeli.rowCount) {
      throw new HttpError(
        404,
        "BUYER_NOT_FOUND",
        "Pembeli aktif tidak ditemukan.",
      );
    }
    const detail = [];
    let penyediaId;
    let totalNormal = 0n;
    for (const baris of data.items) {
      const hasil = await client.query(
        `SELECT p.* FROM penawaran p JOIN penyedia py ON py.id=p.penyedia_id
         JOIN pengguna u ON u.id=py.pengguna_id WHERE p.id=$1
         AND u.peran='penyedia' AND u.aktif=TRUE
         AND py.status_verifikasi='terverifikasi' FOR UPDATE OF p`,
        [baris.penawaranId],
      );
      if (!hasil.rowCount) {
        throw new HttpError(
          404,
          "OFFER_NOT_FOUND",
          "Penawaran tidak ditemukan.",
        );
      }
      const item = hasil.rows[0];
      const waktu = await client.query(
        `SELECT $1::timestamptz > clock_timestamp() AS belum_berakhir`,
        [item.berakhir_pada],
      );
      if (item.status !== "aktif" || !waktu.rows[0].belum_berakhir) {
        throw new HttpError(
          409,
          "OFFER_UNAVAILABLE",
          "Penawaran tidak tersedia.",
        );
      }
      if (item.stok < baris.kuantitas) {
        throw new HttpError(
          409,
          "INSUFFICIENT_STOCK",
          `Stok ${item.nama} tidak mencukupi.`,
        );
      }
      penyediaId ??= String(item.penyedia_id);
      if (penyediaId !== String(item.penyedia_id)) {
        throw new HttpError(
          409,
          "MIXED_PROVIDER",
          "Satu pesanan harus dari satu penyedia.",
        );
      }
      totalNormal += BigInt(item.harga_normal) * BigInt(baris.kuantitas);
      if (totalNormal > 999999999999n) {
        throw new HttpError(
          409,
          "ORDER_TOTAL_LIMIT",
          "Total melampaui kapasitas skema.",
        );
      }
      detail.push({ ...baris, item });
    }
    const pesanan = await client.query(
      `INSERT INTO pesanan (pembeli_id, penyedia_id)
       VALUES ($1,$2) RETURNING id`,
      [pembeli.rows[0].id, penyediaId],
    );
    const id = pesanan.rows[0].id;
    for (const { item, kuantitas } of detail) {
      await client.query(
        `INSERT INTO detail_pesanan (pesanan_id, penawaran_id, penyedia_id,
          kuantitas, harga_normal_satuan, harga_penawaran_satuan, nama_penawaran, satuan)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          id,
          item.id,
          penyediaId,
          kuantitas,
          item.harga_normal,
          item.harga_penawaran,
          item.nama,
          item.satuan,
        ],
      );
      await client.query(
        `UPDATE penawaran SET stok=stok-$1, versi=versi+1,
          status=CASE WHEN stok-$1=0 THEN 'habis' ELSE status END
         WHERE id=$2`,
        [kuantitas, item.id],
      );
    }
    await client.query(
      `UPDATE pesanan ps SET total_transaksi=r.total,
        nilai_stok_terselamatkan=r.nilai_stok,
        status_pembayaran=CASE WHEN r.total=0 THEN 'gratis' ELSE 'belum-dibayar' END
       FROM (SELECT SUM(subtotal) AS total, SUM(nilai_stok) AS nilai_stok
         FROM detail_pesanan WHERE pesanan_id=$1) r
       WHERE ps.id=$1`,
      [id],
    );
    return bacaDetail(id, client, pengguna);
  });
}

export function prosesPesanan(id, data, pengguna) {
  return transaksi(async (client) => {
    const scope = cakupan(pengguna);
    const hasil = await client.query(
      `SELECT ps.* FROM pesanan ps WHERE ps.id=$1 AND ${scope.kolom}=$2 FOR UPDATE OF ps`,
      [id, scope.id],
    );
    const p = hasil.rows[0];
    if (!p)
      throw new HttpError(404, "ORDER_NOT_FOUND", "Pesanan tidak ditemukan.");
    const penyedia = pengguna.peran === "penyedia";
    const gagal = (pesan) => {
      throw new HttpError(409, "ORDER_STATE_CONFLICT", pesan);
    };
    if (!penyedia && data.aksi !== "batal") {
      throw new HttpError(
        403,
        "ROLE_FORBIDDEN",
        "Tindakan ini hanya untuk penyedia.",
      );
    }
    if (["selesai", "dibatalkan"].includes(p.status)) {
      gagal("Pesanan sudah selesai atau dibatalkan. Muat status terbaru.");
    }
    const g = await client.query(
      "SELECT status FROM pengambilan WHERE pesanan_id=$1 FOR UPDATE",
      [id],
    );
    if (g.rows[0]?.status === "diambil")
      gagal("Makanan sudah tercatat diambil.");

    if (["batal", "tolak"].includes(data.aksi)) {
      if (!penyedia && p.status !== "menunggu-konfirmasi") {
        gagal(
          "Pembeli hanya dapat membatalkan sebelum pesanan dikonfirmasi penyedia.",
        );
      }
      if (data.aksi === "tolak" && p.status !== "menunggu-konfirmasi") {
        gagal("Penolakan hanya untuk pesanan yang belum dikonfirmasi.");
      }
      const item = await client.query(
        `SELECT dp.penawaran_id, dp.kuantitas, pt.stok FROM detail_pesanan dp
          JOIN penawaran pt ON pt.id=dp.penawaran_id WHERE dp.pesanan_id=$1
          ORDER BY pt.id FOR UPDATE OF pt`,
        [id],
      );
      for (const baris of item.rows) {
        if (Number(baris.stok) + Number(baris.kuantitas) > 2147483647) {
          throw new HttpError(
            409,
            "STOCK_LIMIT",
            "Stok melebihi kapasitas. Periksa jumlah stok penawaran.",
          );
        }
        await client.query(
          `UPDATE penawaran SET stok=stok+$1, versi=versi+1,
          status=CASE WHEN status='habis' AND berakhir_pada>clock_timestamp()
            THEN 'aktif' WHEN status='habis' THEN 'kedaluwarsa' ELSE status END
          WHERE id=$2`,
          [baris.kuantitas, baris.penawaran_id],
        );
      }
      const jenis = !penyedia
        ? "pembeli"
        : data.aksi === "tolak"
          ? "ditolak-penyedia"
          : "penyedia";
      await client.query(
        `UPDATE pesanan SET status='dibatalkan',
        dibatalkan_pada=clock_timestamp(), jenis_pembatalan=$2, alasan_pembatalan=$3
        WHERE id=$1`,
        [id, jenis, data.alasan],
      );
      await client.query(
        "UPDATE pengambilan SET status='gagal' WHERE pesanan_id=$1",
        [id],
      );
    } else if (data.aksi === "konfirmasi") {
      if (p.status !== "menunggu-konfirmasi")
        gagal("Hanya pesanan menunggu yang dapat diterima.");
      await client.query(
        `UPDATE pesanan SET status='dikonfirmasi',
        dikonfirmasi_pada=clock_timestamp() WHERE id=$1`,
        [id],
      );
    } else if (data.aksi === "siap") {
      if (p.status !== "dikonfirmasi")
        gagal("Terima pesanan sebelum menandai siap diambil.");
      await client.query(
        `UPDATE pesanan SET status='siap-diambil',
        siap_pada=clock_timestamp() WHERE id=$1`,
        [id],
      );
      await client.query(
        `INSERT INTO pengambilan (pesanan_id,kode,jadwal_pada)
        VALUES ($1,$2,clock_timestamp()) ON CONFLICT (pesanan_id) DO UPDATE
        SET jadwal_pada=LEAST(pengambilan.jadwal_pada,EXCLUDED.jadwal_pada), status='terjadwal'`,
        [id, "SBX-" + BigInt(id).toString(36).toUpperCase()],
      );
    } else if (data.aksi === "selesai") {
      if (p.status !== "siap-diambil")
        gagal("Tandai siap diambil sebelum mencatat serah terima.");
      if (Number(p.total_transaksi) > 0 && !data.pembayaranDiterima) {
        throw new HttpError(
          400,
          "PAYMENT_CONFIRMATION_REQUIRED",
          "Konfirmasikan pembayaran di tempat setelah uang benar-benar diterima.",
        );
      }
      await client.query(
        `INSERT INTO pengambilan
        (pesanan_id,kode,jadwal_pada,diambil_pada,status)
        VALUES ($1,$2,clock_timestamp(),clock_timestamp(),'diambil')
        ON CONFLICT (pesanan_id) DO UPDATE SET status='diambil',
          diambil_pada=EXCLUDED.diambil_pada,
          jadwal_pada=LEAST(pengambilan.jadwal_pada,EXCLUDED.jadwal_pada)`,
        [id, "SBX-" + BigInt(id).toString(36).toUpperCase()],
      );
      await client.query(
        `UPDATE pesanan SET status='selesai',
        selesai_pada=clock_timestamp(),
        status_pembayaran=CASE WHEN total_transaksi=0 THEN 'gratis' ELSE 'dibayar' END,
        dibayar_pada=CASE WHEN total_transaksi>0 THEN clock_timestamp() ELSE NULL END
        WHERE id=$1`,
        [id],
      );
    }
    return bacaDetail(id, client, pengguna);
  });
}