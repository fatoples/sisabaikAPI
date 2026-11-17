import bcrypt from "bcryptjs";
import { pool } from "../src/db/pool.js";
import { transaksi } from "../src/db/transaksi.js";
import { kataSandiValid } from "../src/lib/input-auth.js";

const daftar = [
  ["rina.penyedia@example.test", "penyedia"],
  ["budi.penyedia@example.test", "penyedia"],
  ["siti.pembeli@example.test", "pembeli"],
  ["andi.pembeli@example.test", "pembeli"],
];

try {
  const password = kataSandiValid(process.env.LATIHAN_KATA_SANDI);
  const db = await pool.query("SELECT current_database() AS nama");
  if (db.rows[0].nama !== "sisabaik_dev")
    throw new Error("Gunakan sisabaik_dev lokal.");
  await transaksi(async (client) => {
    for (const [email, peran] of daftar) {
      const r = await client.query(
        `SELECT id, peran, aktif, kata_sandi_hash FROM pengguna
         WHERE email=$1 FOR UPDATE`,
        [email],
      );
      const u = r.rows[0];
      if (!u || u.peran !== peran || !u.aktif) {
        throw new Error(`Periksa akun seed ${email}; jangan reset database.`);
      }
      if (u.kata_sandi_hash) {
        if (!(await bcrypt.compare(password, u.kata_sandi_hash))) {
          throw new Error(
            "Hash sudah ada. Gunakan sandi awal; hash tidak ditimpa otomatis.",
          );
        }
        continue;
      }
      const hash = await bcrypt.hash(password, 12);
      await client.query(
        `UPDATE pengguna SET kata_sandi_hash=$1,
         versi_token=versi_token+1 WHERE id=$2`,
        [hash, u.id],
      );
    }
  });
  console.log("Empat akun fiktif siap; password dan hash tidak ditampilkan.");
} catch (error) {
  if (error.code === "42703") {
    console.error(
      "Kolom autentikasi belum tersedia. Jalankan npm run db:migrate, lalu npm run db:auth.",
    );
  } else {
    console.error(error.code ? `Database error: ${error.code}` : error.message);
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}