import app from "./src/app.js";

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log(`SisaBaik API berjalan di http://localhost:${PORT}`);
});

function tutupServer(sinyal) {
  console.log(`\n${sinyal} diterima. Menutup server...`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => tutupServer("SIGINT"));
process.on("SIGTERM", () => tutupServer("SIGTERM"));