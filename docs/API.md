# Dokumentasi REST API SisaBaik

## 1. Penawaran (`/api/penawaran`)
* **GET `/api/penawaran`**: Mengambil daftar penawaran aktif.
  * *Query Parameter:* `q`, `page`, `limit`, `kategori`, `status`, `tersedia`.
* **POST `/api/penawaran`**: Menambah penawaran baru.
  * *Field Wajib:* `penyediaId`, `nama`, `kategori`, `harga`, `stok`.
* **GET `/api/penawaran/:id`**: Detail penawaran berdasarkan ID.
* **PUT `/api/penawaran/:id`**: Memperbarui penawaran.
* **DELETE `/api/penawaran/:id`**: Menghapus penawaran.

## 2. Pesanan (`/api/pesanan`)
* **POST `/api/pesanan`**: Membuat pesanan baru.
  * *Field Wajib:* `emailPembeli`, `items` (array objek dengan `penawaranId` dan `kuantitas`).
  * *Aturan Bisnis:* Semua item dalam satu pesanan harus berasal dari satu penyedia yang sama.
* **GET `/api/pesanan/:id`**: Detail pesanan dan item snapshot.

## 3. Penanganan Error HTTP
* `400 Bad Request` - Validation error (`INVALID_JSON`, `VALIDATION_ERROR`).
* `404 Not Found` - Resource tidak ditemukan.
* `409 Conflict` - Stok tidak mencukupi / `MIXED_PROVIDER`.
* `413 Payload Too Large` - Ukuran request melebihi batas.
* `415 Unsupported Media Type` - Format body bukan JSON.