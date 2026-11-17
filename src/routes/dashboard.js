import { Router } from "express";
import { ringkasanDashboard } from "../services/dashboard.js";
import {
  wajibLogin,
  wajibPeran,
  wajibPenyediaTerverifikasi,
} from "../middleware/auth.js";

const router = Router();
router.use(wajibLogin, wajibPeran("pembeli", "penyedia"));
router.use((req, res, next) => {
  if (req.pengguna.peran === "penyedia") {
    return wajibPenyediaTerverifikasi(req, res, next);
  }
  next();
});
router.get("/", async (req, res) => {
  const data = await ringkasanDashboard(req.pengguna);
  res.json({ success: true, data });
});
export default router;