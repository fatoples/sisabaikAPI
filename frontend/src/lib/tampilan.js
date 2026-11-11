const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const tanggal = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatRupiah = (nilai) => rupiah.format(nilai);
export const formatWaktu = (iso) => tanggal.format(new Date(iso));

export function tersedia(penawaran, waktuSekarang) {
  return (
    penawaran.status === "aktif" &&
    penawaran.stok > 0 &&
    Date.parse(penawaran.berakhirPada) > waktuSekarang
  );
}
