const hex = process.env.JWT_SECRET ?? "";
if (!/^[a-f0-9]{64}$/.test(hex)) {
  throw new Error("JWT_SECRET wajib 64 digit hex acak pada .env.");
}

export const authConfig = Object.freeze({
  secret: Buffer.from(hex, "hex"),
  issuer: "sisabaik-api",
  audience: "sisabaik-web",
  ttl: 15 * 60,
  cost: 12,
});