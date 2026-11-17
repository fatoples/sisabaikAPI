import { pool } from "./pool.js";

export async function transaksi(kerja, bacaSaja = false) {
  const client = await pool.connect();
  let dimulai = false;
  let rusak;
  try {
    await client.query(
      bacaSaja
        ? "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY"
        : "BEGIN",
    );
    dimulai = true;
    await client.query("SET LOCAL lock_timeout = '2s'");
    const hasil = await kerja(client);
    await client.query("COMMIT");
    dimulai = false;
    return hasil;
  } catch (error) {
    if (dimulai) {
      try {
        await client.query("ROLLBACK");
      } catch (gagal) {
        rusak = gagal;
      }
    }
    throw error;
  } finally {
    client.release(rusak);
  }
}