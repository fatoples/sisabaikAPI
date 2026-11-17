import { pool } from "../db/pool.js";
import { transaksi } from "../db/transaksi.js";

const sql = `SELECT u.*, py.id AS penyedia_id, py.status_verifikasi,
  py.nama_usaha, py.alamat AS alamat_usaha, py.nomor_telepon AS telepon_usaha
  FROM pengguna u LEFT JOIN penyedia py ON py.pengguna_id=u.id`;

export async function cariEmail(email) {
  const r = await pool.query(`${sql} WHERE u.email=$1`, [email]);
  return r.rows[0] ?? null;
}

export async function cariId(id) {
  const r = await pool.query(`${sql} WHERE u.id=$1`, [id]);
  return r.rows[0] ?? null;
}

export function kePengguna(row) {
  return {
    id: String(row.id),
    namaLengkap: row.nama_lengkap,
    email: row.email,
    peran: row.peran,
    penyediaId: row.penyedia_id == null ? null : String(row.penyedia_id),
    statusVerifikasi: row.status_verifikasi ?? null,
    namaUsaha: row.nama_usaha ?? null,
    alamatUsaha: row.alamat_usaha ?? null,
    nomorTeleponUsaha: row.telepon_usaha ?? null,
  };
}

export async function buatPembeli(data, hash) {
  const r = await pool.query(
    `INSERT INTO pengguna (nama_lengkap, email, peran, kata_sandi_hash)
     VALUES ($1,$2,'pembeli',$3) RETURNING id`,
    [data.namaLengkap, data.email, hash],
  );
  return cariId(r.rows[0].id);
}

export async function cabutToken(id) {
  await pool.query(
    "UPDATE pengguna SET versi_token=versi_token+1 WHERE id=$1",
    [id],
  );
}

export async function buatPenyedia(data, hash) {
  return transaksi(async (client) => {
    const u = await client.query(
      `INSERT INTO pengguna (nama_lengkap,email,peran,kata_sandi_hash)
       VALUES ($1,$2,'penyedia',$3) RETURNING id`,
      [data.namaLengkap, data.email, hash],
    );
    await client.query(
      `INSERT INTO penyedia
       (pengguna_id,nama_usaha,alamat,nomor_telepon,status_verifikasi)
       VALUES ($1,$2,$3,$4,'menunggu')`,
      [u.rows[0].id, data.namaUsaha, data.alamat, data.nomorTelepon],
    );
    const row = await client.query(`${sql} WHERE u.id=$1`, [u.rows[0].id]);
    return row.rows[0];
  });
}