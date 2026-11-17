import { readFile, writeFile, appendFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { parseEnv } from "node:util";
try {
  const template = await readFile(".env.example", "utf8");
  const baru = template.replace(
    /^JWT_SECRET=.*$/m,
    "JWT_SECRET=" + randomBytes(32).toString("hex"),
  );
  try {
    await writeFile(".env", baru, { flag: "wx", mode: 0o600 });
    console.log(
      ".env dibuat dengan JWT acak. Lengkapi koneksi PostgreSQL melalui VS Code.",
    );
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
    console.log(".env sudah ada dan dipertahankan.");
  }
  let teks = await readFile(".env", "utf8");
  let env = parseEnv(teks);
  if (process.argv.includes("--akun-latihan") && !env.LATIHAN_KATA_SANDI) {
    await appendFile(
      ".env",
      "\nLATIHAN_KATA_SANDI=" + randomBytes(24).toString("hex") + "\n",
    );
    teks = await readFile(".env", "utf8");
    env = parseEnv(teks);
    console.log(
      "Konfigurasi akun contoh ditambahkan; nilai sandi tidak dicetak.",
    );
  }
  if (!env.PGPASSWORD) {
    console.log("Isi PGPASSWORD pada .env sebelum menjalankan aplikasi.");
  } else {
    if (
      !["localhost", "127.0.0.1"].includes(env.PGHOST) ||
      env.PGDATABASE !== "sisabaik_dev"
    )
      throw new Error("Bantuan ini hanya untuk PostgreSQL lokal sisabaik_dev.");
    if (!/^[a-f0-9]{64}$/.test(env.JWT_SECRET ?? ""))
      throw new Error(
        "Isi JWT_SECRET dengan 64 digit hex acak. Nilai lama tidak ditimpa.",
      );
    console.log(
      "Konfigurasi lokal siap. npm run start:local memakai .env yang sama.",
    );
    if (process.argv.includes("--perbarui-produksi")) {
      await writeFile(
        ".env.production-local",
        teks +
          "\nNODE_ENV=production\nHOST=127.0.0.1\nTRUST_PROXY_HOPS=0\nPGSSL=disable\n",
        { mode: 0o600 },
      );
      console.log(
        "Salinan konfigurasi produksi lama diselaraskan untuk kompatibilitas.",
      );
    }
  }
} catch (e) {
  console.error(e.code ?? e.message);
  process.exitCode = 1;
}