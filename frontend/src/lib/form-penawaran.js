export function formKosong() {
  return {
    nama: "",
    kategori: "roti",
    hargaNormal: "",
    hargaPenawaran: "",
    stok: "",
    satuan: "paket",
    status: "draft",
    berakhirPada: "",
  };
}

export function validasiForm(form, waktuSekarang = Date.now()) {
  const errors = {};
  const data = {};
  const teks = (field, min, max) => {
    const nilai = String(form[field] ?? "").trim();
    if (nilai.length < min || nilai.length > max) {
      errors[field] = `${field} harus ${min} sampai ${max} karakter.`;
    }
    return nilai;
  };
  const angka = (field, min, max) => {
    const mentah = form[field];
    const kosong = mentah == null || String(mentah).trim() === "";
    const nilai = Number(mentah);
    if (
      kosong ||
      !Number.isSafeInteger(nilai) ||
      nilai < min ||
      nilai > max
    ) {
      errors[field] =
        `${field} wajib bilangan bulat ${min} sampai ${max}.`;
    }
    return nilai;
  };
  data.nama = teks("nama", 3, 120);
  data.kategori = teks("kategori", 1, 40);
  data.satuan = teks("satuan", 1, 20);
  data.hargaNormal = angka("hargaNormal", 1, 999999999999);
  data.hargaPenawaran = angka("hargaPenawaran", 0, 999999999999);
  data.stok = angka("stok", 0, 2147483647);
  if (
    !errors.hargaNormal &&
    !errors.hargaPenawaran &&
    data.hargaPenawaran > data.hargaNormal
  ) {
    errors.hargaPenawaran =
      "Harga penawaran tidak boleh melebihi harga normal.";
  }
  data.status = form.status;
  if (!["draft", "aktif"].includes(data.status)) {
    errors.status = "Pilih status draft atau aktif.";
  }
  const waktu = new Date(form.berakhirPada);
  if (
    !form.berakhirPada ||
    !Number.isFinite(waktu.getTime()) ||
    waktu.getTime() <= waktuSekarang
  ) {
    errors.berakhirPada =
      "Pilih tanggal dan jam yang masih di masa depan.";
  } else {
    data.berakhirPada = waktu.toISOString();
  }
  return { errors, data: Object.keys(errors).length ? null : data };
}
