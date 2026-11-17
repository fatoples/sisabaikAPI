import { readFile } from "node:fs/promises";
import { pool } from "../src/db/pool.js";
import { transaksi } from "../src/db/transaksi.js";

try {
  const cloud = process.argv.includes("--cloud");
  if (cloud) {
    if (
      !(process.env.PGHOST ?? "").endsWith(".neon.tech") ||
      process.env.PGSSL !== "require" ||
      !(process.env.CLOUD_CONFIRM_DATABASE ?? process.env.DEMO_CONFIRM_DATABASE)
    ) {
      throw new Error(
        "Migrasi cloud memerlukan konfigurasi Neon dan CLOUD_CONFIRM_DATABASE.",
      );
    }
  } else if (
    !["localhost", "127.0.0.1"].includes(process.env.PGHOST) ||
    process.env.PGDATABASE !== "sisabaik_dev" ||
    (process.env.PGSSL ?? "disable") !== "disable"
  ) {
    throw new Error(
      "Gunakan sisabaik_dev lokal. Untuk Neon demo gunakan db:migrate:cloud.",
    );
  }
  const sql = [];
  for (const nama of ["07_auth.sql", "12_alur_transaksi.sql"]) {
    const teks = await readFile(
      new URL("../database/" + nama, import.meta.url),
      "utf8",
    );
    if (!/^\s*BEGIN;/.test(teks) || !/COMMIT;\s*$/.test(teks)) {
      throw new Error("Batas transaksi migrasi tidak sesuai: " + nama);
    }
    sql.push(teks.replace(/^\s*BEGIN;/, "").replace(/COMMIT;\s*$/, ""));
  }
  await transaksi(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(74091211)");
    const cek = await client.query(`SELECT current_database() AS nama,
  to_regclass('public.pengguna') AS pengguna,
  to_regclass('public.penawaran') AS penawaran,
  to_regclass('public.pesanan') AS pesanan`);
    const db = cek.rows[0];
const socket = client.connection.stream;
const tls =
  socket?.encrypted === true &&
  socket?.authorized === true;
    const tujuan = cloud
      ? (process.env.CLOUD_CONFIRM_DATABASE ??
        process.env.DEMO_CONFIRM_DATABASE)
      : "sisabaik_dev";
    if (
  db.nama !== tujuan ||
  !db.pengguna ||
  !db.penawaran ||
  !db.pesanan ||
  (cloud && !tls)
) {
      throw new Error(
        "Database tujuan atau schema dasar belum sesuai. Data tidak direset.",
      );
    }
    for (const teks of sql) await client.query(teks);
  });
  console.log(
    "Migrasi autentikasi dan alur transaksi selesai. Data serta password lama dipertahankan.",
  );
  console.log(
    "Untuk akun lokal yang belum memiliki password: jalankan npm run db:auth.",
  );
} catch (error) {
  console.error(error.code ? "Migrasi gagal: " + error.code : error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}