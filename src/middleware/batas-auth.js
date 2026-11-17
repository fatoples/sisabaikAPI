import { rateLimit } from "express-rate-limit";

export const batasAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler(req, res) {
    res.status(429).json({
      success: false,
      error: {
        code: "AUTH_RATE_LIMIT",
        message: "Terlalu banyak percobaan. Tunggu sesuai Retry-After.",
      },
    });
  },
});

export const batasRegistrasi = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler(req, res) {
    res.status(429).json({
      success: false,
      error: {
        code: "REGISTRATION_RATE_LIMIT",
        message:
          "Terlalu banyak pendaftaran. Silakan coba kembali sesuai Retry-After.",
      },
    });
  },
});