import { verifikasiToken } from "../lib/token.js";
import { cariId, kePengguna } from "../repositories/pengguna.js";
import { HttpError } from "../lib/api.js";

export async function wajibLogin(req, res, next) {
  res.set("WWW-Authenticate", "Bearer");
  const header = req.get("authorization") ?? "";
  if (!header)
    throw new HttpError(
      401,
      "AUTH_REQUIRED",
      "Silakan login terlebih dahulu.",
    );
  const cocok =
    header.length <= 2048 &&
    /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(
      header,
    );
  if (!cocok)
    throw new HttpError(401, "TOKEN_INVALID", "Token tidak valid.");
  const p = verifikasiToken(cocok[1]);
  const row = await cariId(p.sub);
  if (
    !row ||
    !row.aktif ||
    !row.kata_sandi_hash ||
    row.versi_token !== p.v
  ) {
    throw new HttpError(
      401,
      "SESSION_REVOKED",
      "Sesi tidak berlaku. Silakan login lagi.",
    );
  }
  req.pengguna = kePengguna(row);
  res.removeHeader("WWW-Authenticate");
  next();
}

export function wajibPeran(...peran) {
  return (req, res, next) => {
    if (!req.pengguna || !peran.includes(req.pengguna.peran)) {
      throw new HttpError(
        403,
        "ROLE_FORBIDDEN",
        "Peran Anda tidak diizinkan.",
      );
    }
    next();
  };
}

export function wajibPenyediaTerverifikasi(req, res, next) {
  if (
    !req.pengguna.penyediaId ||
    req.pengguna.statusVerifikasi !== "terverifikasi"
  ) {
    throw new HttpError(
      403,
      "PROVIDER_NOT_VERIFIED",
      "Profil penyedia belum terverifikasi.",
    );
  }
  next();
}