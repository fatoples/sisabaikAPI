import { pool } from "../src/db/pool.js";
import { ujiAlur } from "./lib/skenario-alur.js";

let server;
try {
  if (
    !["localhost", "127.0.0.1"].includes(process.env.PGHOST) ||
    process.env.PGDATABASE !== "sisabaik_dev" ||
    (process.env.PGSSL ?? "disable") !== "disable"
  ) {
    throw new Error(
      "Pengujian ini hanya untuk database latihan sisabaik_dev lokal.",
    );
  }
  const cek = await pool.query("SELECT current_database() AS nama");
  if (cek.rows[0].nama !== "sisabaik_dev")
    throw new Error("Database latihan tidak sesuai.");
  const { default: app } = await import("../src/app.js");
  server = app.listen(0, "127.0.0.1");
  await new Promise((r, j) => {
    server.once("listening", r);
    server.once("error", j);
  });
  const base = "http://127.0.0.1:" + server.address().port;
  async function api(path, method = "GET", body, token) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    const r = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const contentType = (r.headers.get("content-type") ?? "").split(";")[0];
    return contentType.startsWith("image/")
      ? {
          status: r.status,
          contentType,
          bytes: Buffer.from(await r.arrayBuffer()),
        }
      : { status: r.status, body: r.status === 204 ? null : await r.json() };
  }
  const hasil = await ujiAlur(pool, api);
  console.log(
    hasil.length +
      " skenario alur transaksi lulus. Fixture pengujian sudah dihapus.",
  );
} catch (e) {
  console.error(
    e.code === "42703"
      ? "Jalankan npm run db:migrate terlebih dahulu."
      : e.message,
  );
  process.exitCode = 1;
} finally {
  if (server) await new Promise((r) => server.close(r));
  await pool.end();
}