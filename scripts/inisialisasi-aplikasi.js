// Membuat schema kosong untuk pendaftaran mandiri. Tidak menjalankan seed.
import { readFile } from "node:fs/promises";
import { pool } from "../src/db/pool.js";
import { transaksi } from "../src/db/transaksi.js";
try {
  const cloud = process.argv.includes("--cloud");
  const tujuan = cloud
    ? (process.env.CLOUD_CONFIRM_DATABASE ?? process.env.DEMO_CONFIRM_DATABASE)
    : "sisabaik_dev";
  if (cloud) {
    if (
      !(process.env.PGHOST ?? "").endsWith(".neon.tech") ||
      process.env.PGSSL !== "require" ||
      !tujuan
    )
      throw new Error(
        "Isi koneksi Neon, PGSSL=require, dan CLOUD_CONFIRM_DATABASE.",
      );
  } else if (
    !["localhost", "127.0.0.1"].includes(process.env.PGHOST) ||
    process.env.PGDATABASE !== tujuan ||
    (process.env.PGSSL ?? "disable") !== "disable"
  ) {
    throw new Error("Inisialisasi lokal hanya untuk sisabaik_dev.");
  }
  const schema = await readFile(
    new URL("../database/11_schema_cloud.sql", import.meta.url),
    "utf8",
  );
  const migration = (
    await readFile(
      new URL("../database/12_alur_transaksi.sql", import.meta.url),
      "utf8",
    )
  )
    .replace(/^\s*BEGIN;/, "")
    .replace(/COMMIT;\s*$/, "");
  await transaksi(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(74091211)");
    const r = await c.query("SELECT current_database() AS nama");
    const socket = c.connection.stream;
    const tls = socket?.encrypted === true && socket?.authorized === true;

    if (r.rows[0].nama !== tujuan || (cloud && !tls))
      throw new Error("Database tujuan atau TLS belum sesuai.");
    const cek = await c.query(
      "SELECT COUNT(*)::int AS jumlah FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
    );
    if (cek.rows[0].jumlah !== 0)
      throw new Error(
        "Database sudah berisi tabel. Gunakan db:migrate, bukan inisialisasi ulang.",
      );
    await c.query("SET LOCAL search_path=public");
    await c.query(schema);
    await c.query(migration);
  });
  console.log(
    "Schema aplikasi siap tanpa akun contoh. Buat akun melalui halaman Daftar.",
  );
} catch (e) {
  console.error(e.code ? "Inisialisasi gagal: " + e.code : e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}