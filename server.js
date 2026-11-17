import app from "./src/app.js";
import { pool } from "./src/db/pool.js";

const PORT = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT wajib integer 1-65535.");
}
const HOST = process.env.HOST ?? "127.0.0.1";
if (!["127.0.0.1", "0.0.0.0"].includes(HOST)) {
  throw new Error("HOST wajib 127.0.0.1 atau 0.0.0.0.");
}
const server = app.listen(PORT, HOST, () => {
  console.log(`SisaBaik berjalan pada ${HOST}:${PORT}`);
});
server.on("error", (error) => {
  console.error("Server gagal:", error.code);
  process.exitCode = 1;
  void pool.end();
});
let menutup = false;
function tutupServer() {
  if (menutup) return;
  menutup = true;
  const batas = setTimeout(() => process.exit(1), 10000);
  batas.unref();
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });
}
process.on("SIGINT", tutupServer);
process.on("SIGTERM", tutupServer);