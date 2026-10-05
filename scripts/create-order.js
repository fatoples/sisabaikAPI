import { pool } from "../src/db/pool.js";

const emailPembeli = process.argv[2] ?? "siti.pembeli@example.test";
const penawaranId = Number(process.argv[3] ?? 1);
const kuantitas = Number(process.argv[4] ?? 1);

if (!Number.isInteger(penawaranId) || !Number.isInteger(kuantitas) || kuantitas < 1) {
  console.error("penawaranId dan kuantitas harus berupa bilangan bulat positif.");
  process.exitCode = 1;
} else {
  let client;
  let transaksiDimulai = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    transaksiDimulai = true;

    const pembeli = await client.query(
      "SELECT id FROM pengguna WHERE email = $1 AND peran = $2",
      [emailPembeli, "pembeli"]
    );

    if (pembeli.rowCount !== 1) throw new Error("Pembeli tidak ditemukan.");

    const penawaran = await client.query(
      `SELECT id, penyedia_id, nama, harga_normal, harga_penawaran,
              stok, status, berakhir_pada
       FROM penawaran
       WHERE id = $1
       FOR UPDATE`,
      [penawaranId]
    );

    if (penawaran.rowCount !== 1) throw new Error("Penawaran tidak ditemukan.");

    const item = penawaran.rows[0];

    if (
      item.status !== "aktif" ||
      new Date(item.berakhir_pada) <= new Date()
    ) {
      throw new Error("Penawaran tidak aktif atau sudah kedaluwarsa.");
    }

    if (item.stok < kuantitas) throw new Error("Stok tidak mencukupi.");

    const pesanan = await client.query(
      `INSERT INTO pesanan (pembeli_id, penyedia_id)
       VALUES ($1, $2)
       RETURNING id`,
      [pembeli.rows[0].id, item.penyedia_id]
    );

    const pesananId = pesanan.rows[0].id;

    await client.query(
      `INSERT INTO detail_pesanan (
         pesanan_id, penawaran_id, penyedia_id, kuantitas,
         harga_normal_satuan, harga_penawaran_satuan
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        pesananId,
        item.id,
        item.penyedia_id,
        kuantitas,
        item.harga_normal,
        item.harga_penawaran
      ]
    );

    await client.query(
      "UPDATE penawaran SET stok = stok - $1 WHERE id = $2",
      [kuantitas, item.id]
    );

    const diperbarui = await client.query(
      `UPDATE pesanan AS ps
       SET total_transaksi = r.total,
           nilai_stok_terselamatkan = r.nilai_stok
       FROM (
         SELECT SUM(subtotal) AS total, SUM(nilai_stok) AS nilai_stok
         FROM detail_pesanan
         WHERE pesanan_id = $1
       ) AS r
       WHERE ps.id = $1
       RETURNING ps.*`,
      [pesananId]
    );

    await client.query("COMMIT");
    transaksiDimulai = false;

    console.log("Pesanan berhasil dibuat:");
    console.table(diperbarui.rows);
  } catch (error) {
    if (client && transaksiDimulai) {
      await client.query("ROLLBACK").catch((rollbackError) => {
        console.error("Rollback gagal:", rollbackError.message);
      });
    }

    console.error("Pesanan dibatalkan:", error.message);
    process.exitCode = 1;
  } finally {
    client?.release();
    await pool.end();
  }
}