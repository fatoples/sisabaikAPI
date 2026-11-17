// Bantuan instalasi pertama: hanya database lokal kosong, tanpa reset data lama.
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { pool } from "../src/db/pool.js";
import { transaksi } from "../src/db/transaksi.js";
import { kataSandiValid } from "../src/lib/input-auth.js";

try {
  if (
    !["localhost", "127.0.0.1"].includes(process.env.PGHOST) ||
    process.env.PGDATABASE !== "sisabaik_dev" ||
    (process.env.PGSSL ?? "disable") !== "disable"
  ) {
    throw new Error(
      "Inisialisasi ini hanya untuk sisabaik_dev pada PostgreSQL lokal.",
    );
  }
  const sandi = kataSandiValid(process.env.LATIHAN_KATA_SANDI);
  const berkas = [
    "01_schema.sql",
    "02_seed.sql",
    "07_auth.sql",
    "12_alur_transaksi.sql",
  ];
  const sql = [];
  for (const nama of berkas) {
    const teks = await readFile(
      new URL(`../database/${nama}`, import.meta.url),
      "utf8",
    );
    if (!/^\s*BEGIN;/.test(teks) || !/COMMIT;\s*$/.test(teks)) {
      throw new Error(`Batas transaksi ${nama} tidak sesuai modul.`);
    }
    // Tiga berkas modul dijalankan dalam satu transaksi luar, bukan transaksi bersarang.
    sql.push(teks.replace(/^\s*BEGIN;\s*/, "").replace(/\s*COMMIT;\s*$/, ""));
  }
  await transaksi(async (client) => {
    await client.query("SET LOCAL search_path = public");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext(current_database()), hashtext('sisabaik:init:local'))",
    );
    const r = await client.query(`SELECT current_database() AS nama,
      (SELECT COUNT(*)::int FROM information_schema.tables
       WHERE table_schema='public' AND table_type='BASE TABLE') AS jumlah`);
    if (r.rows[0].nama !== "sisabaik_dev" || r.rows[0].jumlah !== 0) {
      throw new Error(
        "Database tidak kosong atau tidak sesuai. Inisialisasi ditolak tanpa reset. Ikuti bagian database yang sudah ada pada README.",
      );
    }
    for (const teks of sql) await client.query(teks);
    const daftar = [
      ["rina.penyedia@example.test", "penyedia"],
      ["budi.penyedia@example.test", "penyedia"],
      ["siti.pembeli@example.test", "pembeli"],
      ["andi.pembeli@example.test", "pembeli"],
    ];
    for (const [email, peran] of daftar) {
      const hash = await bcrypt.hash(sandi, 12);
      const akun = await client.query(
        `UPDATE pengguna
        SET kata_sandi_hash=$1, versi_token=versi_token+1
        WHERE email=$2 AND peran=$3 AND aktif=TRUE RETURNING id`,
        [hash, email, peran],
      );
      if (akun.rowCount !== 1) throw new Error("Akun seed tidak sesuai modul.");
    }
  });
  console.log(
    "Database lokal siap: enam tabel, empat akun, dua penyedia, tiga penawaran, satu pesanan, satu detail, satu pengambilan.",
  );
  console.log(
    "Akun memakai LATIHAN_KATA_SANDI dari .env; sandi dan hash tidak dicetak. Inisialisasi tidak perlu diulang.",
  );
} catch (error) {
  console.error(
    error.code ? `Inisialisasi gagal: ${error.code}` : error.message,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}