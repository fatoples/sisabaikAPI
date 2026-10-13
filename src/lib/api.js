export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const salah = (pesan) => {
  throw new HttpError(400, "VALIDATION_ERROR", pesan);
};

export function idValid(nilai, nama = "id") {
  if (typeof nilai === "number" && !Number.isSafeInteger(nilai)) {
    salah(`${nama} harus integer yang aman atau string digit.`);
  }
  if (!["string", "number"].includes(typeof nilai)) {
    salah(`${nama} wajib berupa ID positif.`);
  }
  const teks = String(nilai);
  if (
    !/^[1-9][0-9]{0,18}$/.test(teks) ||
    BigInt(teks) > 9223372036854775807n
  ) {
    salah(`${nama} tidak valid.`);
  }
  return teks;
}

export function teksValid(nilai, nama, min, max) {
  if (typeof nilai !== "string") salah(`${nama} wajib berupa teks.`);
  const teks = nilai.trim();
  if (teks.length < min || teks.length > max) {
    salah(`${nama} harus ${min}-${max} karakter.`);
  }
  return teks;
}

export function angkaValid(nilai, nama, min, max) {
  if (!Number.isSafeInteger(nilai) || nilai < min || nilai > max) {
    salah(`${nama} wajib berupa integer ${min}-${max}.`);
  }
  return nilai;
}

export function objekValid(body, kolom) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    salah("Body wajib berupa object JSON.");
  }
  if (Object.keys(body).some((k) => !kolom.includes(k))) {
    salah("Body mengandung kolom yang tidak didukung.");
  }
}

export function halamanValid(query) {
  const baca = (nama, awal, max) => {
    const nilai = query[nama] ?? String(awal);
    if (typeof nilai !== "string" || !/^[1-9][0-9]*$/.test(nilai)) {
      salah(`${nama} wajib integer positif; jangan kirim berulang.`);
    }
    return angkaValid(Number(nilai), nama, 1, max);
  };
  const page = baca("page", 1, 10000);
  const limit = baca("limit", 10, 50);
  return { page, limit, offset: (page - 1) * limit };
}

export function metaHalaman(jumlah, paging) {
  const total = Number(jumlah);
  return {
    jumlah: total,
    page: paging.page,
    limit: paging.limit,
    totalPages: Math.ceil(total / paging.limit) || 1,
  };
}

export function filterValid(query) {
  const q = teksValid(query.q ?? "", "q", 0, 100);
  const kategori = teksValid(query.kategori ?? "", "kategori", 0, 40);
  const status = teksValid(query.status ?? "", "status", 0, 20);
  if (
    status &&
    !["draft", "aktif", "habis", "kedaluwarsa"].includes(status)
  ) {
    salah("status tidak dikenal.");
  }
  const tersedia = query.tersedia ?? "false";
  if (!["true", "false"].includes(tersedia)) {
    salah("tersedia hanya menerima true atau false.");
  }
  return { q, kategori, status, tersedia: tersedia === "true" };
}

export function penawaranValid(body) {
  objekValid(body, [
    "penyediaId",
    "nama",
    "kategori",
    "hargaNormal",
    "hargaPenawaran",
    "stok",
    "satuan",
    "status",
    "berakhirPada",
  ]);
  const hasil = {
    penyediaId: idValid(body.penyediaId, "penyediaId"),
    nama: teksValid(body.nama, "nama", 3, 120),
    kategori: teksValid(body.kategori, "kategori", 1, 40),
    hargaNormal: angkaValid(body.hargaNormal, "hargaNormal", 1, 999999999999),
    hargaPenawaran: angkaValid(
      body.hargaPenawaran,
      "hargaPenawaran",
      0,
      999999999999,
    ),
    stok: angkaValid(body.stok, "stok", 0, 2147483647),
    satuan: teksValid(body.satuan, "satuan", 1, 20),
    status: teksValid(body.status, "status", 1, 20),
  };
  if (hasil.hargaPenawaran > hasil.hargaNormal) {
    salah("hargaPenawaran tidak boleh melebihi hargaNormal.");
  }
  if (!["draft", "aktif", "habis", "kedaluwarsa"].includes(hasil.status)) {
    salah("status tidak dikenal.");
  }
  const waktu = teksValid(body.berakhirPada, "berakhirPada", 20, 35);
  const polaWaktu = new RegExp(
    String.raw`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}` +
      String.raw`(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$`,
  );
  if (!polaWaktu.test(waktu)) {
    salah("berakhirPada wajib ISO 8601 dengan zona waktu.");
  }
  const tahun = Number(waktu.slice(0, 4));
  const bulan = Number(waktu.slice(5, 7));
  const hari = Number(waktu.slice(8, 10));
  const kabisat =
    (tahun % 4 === 0 && tahun % 100 !== 0) || tahun % 400 === 0;
  const hariBulan = [
    31,
    kabisat ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (bulan < 1 || bulan > 12 || hari < 1 || hari > hariBulan[bulan - 1]) {
    salah("Tanggal kalender tidak valid.");
  }
  if (
    Number(waktu.slice(11, 13)) > 23 ||
    Number(waktu.slice(14, 16)) > 59 ||
    Number(waktu.slice(17, 19)) > 59
  ) {
    salah("Jam tidak valid.");
  }
  const tanggal = new Date(waktu);
  if (!Number.isFinite(tanggal.getTime()) || tanggal <= new Date()) {
    salah("berakhirPada harus valid dan berada di masa depan.");
  }
  return { ...hasil, berakhirPada: tanggal.toISOString() };
}

export function pesananValid(body) {
  objekValid(body, ["emailPembeli", "items"]);
  const emailPembeli = teksValid(body.emailPembeli, "emailPembeli", 3, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPembeli)) {
    salah("Format emailPembeli tidak valid.");
  }
  if (
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 10
  ) {
    salah("items wajib array berisi 1-10 item.");
  }
  const unik = new Set();
  const items = body.items.map((item) => {
    objekValid(item, ["penawaranId", "kuantitas"]);
    const penawaranId = idValid(item.penawaranId, "penawaranId");
    const kuantitas = angkaValid(item.kuantitas, "kuantitas", 1, 1000);
    if (unik.has(penawaranId)) salah("ID penawaran tidak boleh ganda.");
    unik.add(penawaranId);
    return { penawaranId, kuantitas };
  });
  items.sort((a, b) =>
    BigInt(a.penawaranId) < BigInt(b.penawaranId) ? -1 : 1,
  );
  return { emailPembeli, items };
}