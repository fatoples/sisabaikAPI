import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db/pool.js";

const fileMigrasi = fileURLToPath(
    new URL("../database/12_alur_transaksi.sql", import.meta.url)
);

async function migrate() {
    try {
        const sql = await readFile(fileMigrasi, "utf8");

        await pool.query(sql);

        console.log("Migrasi 12_alur_transaksi berhasil dijalankan.");
    } catch (error) {
        console.error("Migrasi gagal:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

await migrate();