import pg from "pg";

const p = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: true },
});

try {
  const r = await p.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
  );

  console.table(r.rows);
  console.log("Jumlah tabel:", r.rowCount);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await p.end();
}
