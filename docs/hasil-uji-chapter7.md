# Laporan Hasil Pengujian Chapter 7

* **Nama Database:** `sisabaik_dev`
* **Status Pengujian:** LULUS (PASS 100%)

## Ringkasan Pengujian
1. **Uji Otomatis API (`npm run api:test`)**:
   * Seluruh skenario CRUD penawaran dan pesanan berhasil dijalankan (`PASS`).
   * Validasi error HTTP (`400`, `404`, `409`, `413`, `415`) terverifikasi.
2. **Uji Persistensi & Database**:
   * Data pesanan tersimpan utuh setelah restart server.
   * Snapshot harga tercatat sesuai saat pesanan dibuat.
3. **Uji Konkurensi (`node scripts/uji-konkurensi.js`)**:
   * Penanganan stok simultan terverifikasi (`PASS: satu berhasil, satu ditolak; stok akhir 0`).