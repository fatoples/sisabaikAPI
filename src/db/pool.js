import pg from "pg";

const { Pool } = pg;
const produksi = process.env.NODE_ENV === "production";
const ssl = process.env.PGSSL ?? "disable";
if (!["disable", "require"].includes(ssl)) {
  throw new Error("PGSSL wajib disable atau require.");
}
const databaseLokal = ["localhost", "127.0.0.1"].includes(
  process.env.PGHOST,
);
if (produksi && !databaseLokal && ssl !== "require") {
  throw new Error("Database jarak jauh pada production wajib PGSSL=require.");
}
for (const nama of [
  "PGHOST",
  "PGPORT",
  "PGDATABASE",
  "PGUSER",
  "PGPASSWORD",
]) {
  if (!process.env[nama])
    throw new Error(`Konfigurasi ${nama} belum diisi.`);
}

export const pool = new Pool({
  ssl: ssl === "require" ? { rejectUnauthorized: true } : false,
  max: 5,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 10000,
  statement_timeout: 10000,
});

pool.on("error", (error) => {
  console.error("Koneksi idle bermasalah:", error.code ?? "DB_ERROR");
});