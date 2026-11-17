import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { authConfig } from "../config/auth.js";
import { HttpError } from "./api.js";

export function buatToken(row) {
  return jwt.sign({ v: row.versi_token }, authConfig.secret, {
    algorithm: "HS256",
    subject: String(row.id),
    issuer: authConfig.issuer,
    audience: authConfig.audience,
    expiresIn: authConfig.ttl,
    jwtid: randomUUID(),
  });
}

export function verifikasiToken(token) {
  try {
    const p = jwt.verify(token, authConfig.secret, {
      algorithms: ["HS256"],
      issuer: authConfig.issuer,
      audience: authConfig.audience,
    });
    if (
      !p ||
      typeof p !== "object" ||
      typeof p.sub !== "string" ||
      !/^[1-9][0-9]{0,18}$/.test(p.sub) ||
      BigInt(p.sub) > 9223372036854775807n ||
      !Number.isSafeInteger(p.v) ||
      p.v < 0 ||
      !Number.isSafeInteger(p.exp)
    ) {
      throw new Error("Invalid claims");
    }
    return p;
  } catch (error) {
    const expired = error.name === "TokenExpiredError";
    throw new HttpError(
      401,
      expired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      expired ? "Sesi berakhir. Silakan login lagi." : "Token tidak valid.",
    );
  }
}