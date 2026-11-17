// Build Vue dan API lokal membaca satu file .env melalui npm run start:local.
process.env.NODE_ENV = "production";
process.env.HOST = "127.0.0.1";
process.env.TRUST_PROXY_HOPS = "0";
if (!["localhost", "127.0.0.1"].includes(process.env.PGHOST)) {
  console.error(
    "start:local hanya untuk database lokal; hosting menggunakan npm start.",
  );
  process.exitCode = 1;
} else {
  await import("../server.js");
}