import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import * as akun from "../repositories/pengguna.js";
import { authConfig } from "../config/auth.js";
import { buatToken } from "../lib/token.js";
import { HttpError } from "../lib/api.js";

const hashDummy = await bcrypt.hash(
  randomBytes(32).toString("hex"),
  authConfig.cost,
);

export async function registrasi(data) {
  const hash = await bcrypt.hash(data.kataSandi, authConfig.cost);
  try {
    const row = await akun.buatPembeli(data, hash);
    return akun.kePengguna(row);
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(
        409,
        "REGISTRATION_CONFLICT",
        "Pendaftaran tidak dapat diproses.",
      );
    }
    throw error;
  }
}

export async function login(data) {
  const row = await akun.cariEmail(data.email);
  const cocok = await bcrypt.compare(
    data.kataSandi,
    row?.kata_sandi_hash ?? hashDummy,
  );
  if (!row || !row.aktif || !row.kata_sandi_hash || !cocok) {
    throw new HttpError(
      401,
      "LOGIN_FAILED",
      "Email atau kata sandi tidak valid.",
    );
  }
  return {
    accessToken: buatToken(row),
    tokenType: "Bearer",
    expiresIn: authConfig.ttl,
    pengguna: akun.kePengguna(row),
  };
}

export async function registrasiPenyedia(data) {
  const hash = await bcrypt.hash(data.kataSandi, authConfig.cost);
  try {
    const row = await akun.buatPenyedia(data, hash);
    return akun.kePengguna(row);
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(
        409,
        "REGISTRATION_CONFLICT",
        "Pendaftaran tidak dapat diproses.",
      );
    }
    throw error;
  }
}