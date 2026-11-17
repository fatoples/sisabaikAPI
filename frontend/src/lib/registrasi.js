export function periksaRegistrasi(f) {
  const e = {};
  const teks = (key, nama, min, max) => {
    const s = f[key].trim();
    if (s.length < min || s.length > max)
      e[key] = nama + " harus " + min + "–" + max + " karakter.";
  };
  teks("namaLengkap", "Nama lengkap", 2, 100);
  const email = f.email.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    e.email = "Masukkan alamat email yang valid.";
  if ([...f.kataSandi].length < 15 || f.kataSandi.includes("\0"))
    e.kataSandi = "Gunakan kata sandi minimal 15 karakter.";
  else if (new TextEncoder().encode(f.kataSandi).length > 72)
    e.kataSandi =
      "Kata sandi terlalu panjang. Batasnya 72 byte; gunakan frasa yang lebih singkat.";
  if (f.konfirmasiSandi !== f.kataSandi || !f.konfirmasiSandi)
    e.konfirmasiSandi = "Ulangi kata sandi yang sama.";
  if (f.peran === "penyedia") {
    teks("namaUsaha", "Nama usaha", 2, 120);
    teks("alamat", "Alamat pengambilan", 5, 1000);
    if (!/^\+?[0-9]{8,15}$/.test(f.nomorTelepon.trim().replace(/[\s()-]/g, "")))
      e.nomorTelepon =
        "Masukkan nomor telepon 8–15 digit; tanda + boleh di awal.";
  }
  return e;
}