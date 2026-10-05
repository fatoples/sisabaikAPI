import { pool } from "../src/db/pool.js";

const stokMinimum = Number(process.argv[2] ?? 1);

if (!Number.isInteger(stokMinimum) || stokMinimum < 0) {
  console.error("stokMinimum harus berupa bilangan bulat nonnegatif.");
  process.exitCode = 1;
} else {
  try {
    const koneksi = await pool.query(
      "SELECT current_database() AS database, CURRENT_TIMESTAMP AS waktu"
    );

    const hasil = await pool.query(
      `SELECT p.id, p.nama, py.nama_usaha, p.stok, p.harga_penawaran
       FROM penawaran AS p
       JOIN penyedia AS py ON py.id = p.penyedia_id
       WHERE p.stok >= $1 AND p.status = $2
       ORDER BY p.id`,
      [stokMinimum, "aktif"]
    );

    console.log("Koneksi berhasil:", koneksi.rows[0]);
    console.table(hasil.rows);
  } catch (error) {
    console.error("Pemeriksaan database gagal:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}