import pg from "pg";
const { Pool } = pg;

for (const nama of [
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD",
]) {
  if (!process.env[nama]) throw new Error(`Konfigurasi ${nama} belum diisi.`);
}

export const pool = new Pool({
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
  statement_timeout: 5000,
});

pool.on("error", (error) => {
  console.error("Koneksi idle bermasalah:", error.code ?? "DB ERROR");
});