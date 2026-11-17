import { pool } from "../db/pool.js";
import { transaksi } from "../db/transaksi.js";
import { HttpError, metaHalaman } from "../lib/api.js";
import { siapkanFoto } from "../lib/foto.js";

const kolom = `p.id, p.penyedia_id, py.nama_usaha AS penyedia,
  p.nama, p.kategori, p.harga_normal, p.harga_penawaran,
  p.stok, p.satuan, p.status, p.berakhir_pada, p.dibuat_pada,
  p.versi, p.foto_hash`;
const gabung = `FROM penawaran p JOIN penyedia py ON py.id=p.penyedia_id
  JOIN pengguna pemilik ON pemilik.id=py.pengguna_id`;

export function kePenawaran(row) {
  return {
    id: String(row.id),
    penyediaId: String(row.penyedia_id),
    penyedia: row.penyedia,
    nama: row.nama,
    kategori: row.kategori,
    hargaNormal: Number(row.harga_normal),
    hargaPenawaran: Number(row.harga_penawaran),
    stok: row.stok,
    satuan: row.satuan,
    status: row.status,
    berakhirPada: new Date(row.berakhir_pada).toISOString(),
    dibuatPada: new Date(row.dibuat_pada).toISOString(),
    versi: String(row.versi),
    fotoUrl: row.foto_hash
      ? "/api/penawaran/" + row.id + "/foto?v=" + row.foto_hash
      : null,
  };
}

export async function bacaPenawaran(
  id,
  db = pool,
  publik = false,
  pemilikId = null,
) {
  const hasil = await db.query(
    `SELECT ${kolom} ${gabung} WHERE p.id=$1 AND ($3::bigint IS NULL OR p.penyedia_id=$3)
     AND (NOT $2::boolean OR (p.status='aktif' AND p.stok>0
       AND p.berakhir_pada>CURRENT_TIMESTAMP AND pemilik.aktif=TRUE
       AND pemilik.peran='penyedia' AND py.status_verifikasi='terverifikasi'))`,
    [id, publik, pemilikId],
  );
  if (!hasil.rowCount) {
    throw new HttpError(404, "OFFER_NOT_FOUND", "Penawaran tidak ditemukan.");
  }
  return kePenawaran(hasil.rows[0]);
}

export function daftarPenawaran(filter, paging, pemilikId = null) {
  return transaksi(async (client) => {
    const where = `WHERE ($1::text = '' OR
        POSITION(LOWER($1) IN LOWER(p.nama || ' ' || py.nama_usaha)) > 0)
      AND ($2::text = '' OR p.kategori = $2)
      AND ($3::text = '' OR p.status = $3)
      AND (NOT $4::boolean OR (p.status = 'aktif' AND p.stok > 0
        AND p.berakhir_pada>CURRENT_TIMESTAMP AND pemilik.aktif=TRUE
        AND pemilik.peran='penyedia' AND py.status_verifikasi='terverifikasi'))
      AND ($5::bigint IS NULL OR p.penyedia_id=$5)`;
    const nilai = [
      filter.q,
      filter.kategori,
      filter.status,
      filter.tersedia,
      pemilikId,
    ];
    const count = await client.query(
      `SELECT COUNT(*)::int AS jumlah ${gabung} ${where}`,
      nilai,
    );
    const hasil = await client.query(
      `SELECT ${kolom} ${gabung} ${where}
       ORDER BY p.id DESC LIMIT $6 OFFSET $7`,
      [...nilai, paging.limit, paging.offset],
    );
    return {
      data: hasil.rows.map(kePenawaran),
      meta: { ...metaHalaman(count.rows[0].jumlah, paging), ...filter },
    };
  }, true);
}

export async function simpanPenawaran(data, id = null) {
  const foto = await siapkanFoto(data.foto);
  return transaksi(async (client) => {
    if (id !== null) {
      const lama = await client.query(
        `SELECT penyedia_id, versi FROM penawaran
         WHERE id=$1 AND penyedia_id=$2 FOR UPDATE`,
        [id, data.penyediaId],
      );
      if (!lama.rowCount) {
        throw new HttpError(
          404,
          "OFFER_NOT_FOUND",
          "Penawaran tidak ditemukan.",
        );
      }
      if (String(lama.rows[0].penyedia_id) !== data.penyediaId) {
        throw new HttpError(
          409,
          "PROVIDER_IMMUTABLE",
          "Penyedia tidak boleh diganti.",
        );
      }
      if (String(lama.rows[0].versi) !== data.versi) {
        throw new HttpError(
          409,
          "OFFER_CHANGED",
          "Penawaran atau stok sudah berubah. Muat data terbaru sebelum mengedit kembali.",
        );
      }
    }
    const penyedia = await client.query(
      `SELECT py.id FROM penyedia py JOIN pengguna u ON u.id = py.pengguna_id
       WHERE py.id=$1 AND u.peran='penyedia' AND u.aktif=TRUE
       AND py.status_verifikasi='terverifikasi'`,
      [data.penyediaId],
    );
    if (!penyedia.rowCount) {
      throw new HttpError(
        404,
        "PROVIDER_NOT_FOUND",
        "Penyedia aktif tidak ditemukan.",
      );
    }
    const nilai = [
      data.penyediaId,
      data.nama,
      data.kategori,
      data.hargaNormal,
      data.hargaPenawaran,
      data.stok,
      data.satuan,
      data.status === "aktif" && data.stok === 0 ? "habis" : data.status,
      data.berakhirPada,
    ];
    const hasil =
      id === null
        ? await client.query(
            `INSERT INTO penawaran (penyedia_id, nama, kategori, harga_normal,
          harga_penawaran, stok, satuan, status, berakhir_pada, foto, foto_hash, foto_tipe)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [
              ...nilai,
              foto?.foto ?? null,
              foto?.fotoHash ?? null,
              foto?.fotoTipe ?? null,
            ],
          )
        : await client.query(
            `UPDATE penawaran SET nama=$2, kategori=$3, harga_normal=$4,
          harga_penawaran=$5, stok=$6, satuan=$7, status=$8, berakhir_pada=$9,
          versi=versi+1, foto=CASE WHEN $10 THEN $11::bytea ELSE foto END,
          foto_hash=CASE WHEN $10 THEN $12::text ELSE foto_hash END,
          foto_tipe=CASE WHEN $10 THEN $13::text ELSE foto_tipe END
         WHERE id=$14 AND penyedia_id=$1 RETURNING id`,
            [
              ...nilai,
              foto !== undefined,
              foto?.foto ?? null,
              foto?.fotoHash ?? null,
              foto?.fotoTipe ?? null,
              id,
            ],
          );
    return bacaPenawaran(hasil.rows[0].id, client);
  });
}

export async function bacaFoto(id, hash) {
  const hasil = await pool.query(
    "SELECT foto, foto_tipe FROM penawaran WHERE id=$1 AND foto_hash=$2 AND foto IS NOT NULL",
    [id, hash],
  );
  if (!hasil.rowCount)
    throw new HttpError(404, "PHOTO_NOT_FOUND", "Foto tidak ditemukan.");
  return hasil.rows[0];
}

export async function hapusPenawaran(id, penyediaId) {
  const hasil = await pool.query(
    "DELETE FROM penawaran WHERE id=$1 AND penyedia_id=$2 RETURNING id",
    [id, penyediaId],
  );
  if (!hasil.rowCount) {
    throw new HttpError(404, "OFFER_NOT_FOUND", "Penawaran tidak ditemukan.");
  }
}