import { Router } from "express";
import * as c from "../controllers/auth.js";
import { wajibLogin } from "../middleware/auth.js";
import { batasAuth, batasRegistrasi } from "../middleware/batas-auth.js";

const router = Router();
router.post("/registrasi", batasRegistrasi, c.registrasi);
router.post("/registrasi-penyedia", batasRegistrasi, c.registrasiPenyedia);
router.post("/login", batasAuth, c.login);
router.get("/saya", wajibLogin, c.saya);
router.post("/logout", wajibLogin, c.logout);
export default router;