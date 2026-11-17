import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { pool } from "../src/db/pool.js";
import { transaksi } from "../src/db/transaksi.js";
import { kataSandiValid } from "../src/lib/input-auth.js";

try {
  if (
    !(process.env.PGHOST ?? "").endsWith(".neon.tech") ||
    process.env.PGSSL !== "require" ||
    !process.env.DEMO_CONFIRM_DATABASE
  ) {
    throw new Error("Gunakan proyek Neon demo terpisah dan PGSSL=require.");
  }
  const sandi = {
    penyedia: kataSandiValid(process.env.DEMO_PENYEDIA_PASSWORD),
    pembeli: kataSandiValid(process.env.DEMO_PEMBELI_PASSWORD),
  };
  if (sandi.penyedia === sandi.pembeli) {
    throw new Error("Gunakan kata sandi berbeda untuk kedua peran.");
  }
  const schema = await readFile(
    new URL("../database/11_schema_cloud.sql", import.meta.url),
    "utf8",
  );
  const migrasi = (
    await readFile(
      new URL("../database/12_alur_transaksi.sql", import.meta.url),
      "utf8",
    )
  )
    .replace(/^\s*BEGIN;/, "")
    .replace(/COMMIT;\s*$/, "");
  await transaksi(async (client) => {
    const cek = await client.query(
      `SELECT current_database() AS nama,
        (SELECT COUNT(*)::int FROM information_schema.tables
         WHERE table_schema='public'
           AND table_type='BASE TABLE') AS tabel,
        (SELECT ssl FROM pg_stat_ssl
         WHERE pid=pg_backend_pid()) AS tls`,
    );
    const db = cek.rows[0];
    if (db.nama !== process.env.DEMO_CONFIRM_DATABASE || !db.tls) {
      throw new Error("Nama database atau koneksi TLS tidak sesuai.");
    }
    if (db.tabel !== 0) {
      throw new Error(
        "Database tidak kosong. " + "Inisialisasi dibatalkan tanpa reset.",
      );
    }
    await client.query(schema);
    await client.query(migrasi);
    const akun = [
      ["Rina Putri", "rina.penyedia@example.test", "penyedia"],
      ["Budi Santoso", "budi.penyedia@example.test", "penyedia"],
      ["Siti Rahma", "siti.pembeli@example.test", "pembeli"],
      ["Andi Saputra", "andi.pembeli@example.test", "pembeli"],
    ];
    const id = new Map();
    for (const [nama, email, peran] of akun) {
      const hash = await bcrypt.hash(sandi[peran], 12);
      const r = await client.query(
        `INSERT INTO pengguna
          (nama_lengkap,email,peran,kata_sandi_hash)
         VALUES ($1,$2,$3,$4) RETURNING id`,
        [nama, email, peran, hash],
      );
      id.set(email, r.rows[0].id);
    }
    const penyedia = [];
    for (const [email, usaha] of [
      ["rina.penyedia@example.test", "Lapau Uni Rina Demo"],
      ["budi.penyedia@example.test", "Roti Minang Demo"],
    ]) {
      const r = await client.query(
        `INSERT INTO penyedia (pengguna_id,nama_usaha,alamat,
          nomor_telepon,status_verifikasi)
         VALUES ($1,$2,'Alamat simulasi kelas','000000000000',
          'terverifikasi') RETURNING id`,
        [id.get(email), usaha],
      );
      penyedia.push(r.rows[0].id);
    }
    for (const [pemilik, nama, kategori, normal, hemat, satuan] of [
      [penyedia[1], "Paket Roti Demo", "roti", 30000, 15000, "paket"],
      [
        penyedia[0],
        "Nasi Hemat Demo",
        "makanan-siap-saji",
        25000,
        12000,
        "porsi",
      ],
      [penyedia[0], "Sayur Berbagi Demo", "bahan-segar", 18000, 0, "paket"],
    ]) {
      await client.query(
        `INSERT INTO penawaran (penyedia_id,nama,kategori,
          harga_normal,harga_penawaran,stok,satuan,
          status,berakhir_pada)
         VALUES ($1,$2,$3,$4,$5,6,$6,'aktif',
          CURRENT_TIMESTAMP+INTERVAL '1 day')`,
        [pemilik, nama, kategori, normal, hemat, satuan],
      );
    }
  });
  console.log(
    "Demo cloud siap: enam tabel; " + "akun 4, penyedia 2, penawaran 3.",
  );
  console.log(
    "Pesanan, detail_pesanan, pengambilan masih 0. " +
      "Kata sandi tidak dicetak.",
  );
} catch (error) {
  console.error(
    error.code ? `Inisialisasi gagal: ${error.code}` : error.message,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}