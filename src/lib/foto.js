import sharp from "sharp";
import { createHash } from "node:crypto";
import { salah } from "./api.js";

// Satu foto per penawaran. Input 2 MiB; hasil WebP maksimal 400 KiB.
export async function siapkanFoto(value) {
  if (value === undefined) return undefined; // Pertahankan foto saat mengedit.
  if (value === null) return null; // Hapus foto dan gunakan ilustrasi kategori.
  if (typeof value !== "string" || value.length > 2800000) {
    salah("Foto maksimal 2 MiB, berupa JPEG, PNG, atau WebP.");
  }
  const cocok =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!cocok) salah("Pilih foto JPEG, PNG, atau WebP yang valid.");
  const input = Buffer.from(cocok[2], "base64");
  if (
    !input.length ||
    input.length > 2 * 1024 * 1024 ||
    input.toString("base64") !== cocok[2]
  ) {
    salah("Foto tidak valid atau melebihi 2 MiB.");
  }
  try {
    const image = sharp(input, {
      failOn: "warning",
      limitInputPixels: 24000000,
    });
    const metadata = await image.metadata();
    if (
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages ?? 1) !== 1 ||
      metadata.format !== cocok[1]
    ) {
      salah("Gunakan satu foto JPEG, PNG, atau WebP; animasi tidak didukung.");
    }
    // sharp menghapus metadata secara default. rotate mengikuti orientasi EXIF.
    const foto = await image
      .rotate()
      .resize({
        width: 1280,
        height: 1280,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
    if (foto.length > 409600)
      salah("Foto terlalu kompleks. Pilih foto yang lebih kecil.");
    return {
      foto,
      fotoHash: createHash("sha256").update(foto).digest("hex"),
      fotoTipe: "image/webp",
    };
  } catch (error) {
    if (error.code === "VALIDATION_ERROR") throw error;
    salah(
      "Foto tidak dapat dibaca. Pilih berkas JPEG, PNG, atau WebP yang utuh.",
    );
  }
}