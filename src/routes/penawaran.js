import { Router } from "express";
import * as c from "../controllers/penawaran.js";
import {
  wajibLogin,
  wajibPeran,
  wajibPenyediaTerverifikasi,
} from "../middleware/auth.js";

const router = Router();
const penyedia = [
  wajibLogin,
  wajibPeran("penyedia"),
  wajibPenyediaTerverifikasi,
];
router.get("/", c.daftar);
router.get("/milik-saya", ...penyedia, c.milikSaya);
router.get("/milik-saya/:id", ...penyedia, c.detailMilikSaya);
router.get("/:id/foto", c.foto);
router.get("/:id", c.detail);
router.post("/", ...penyedia, c.buat);
router.put("/:id", ...penyedia, c.ubah);
router.delete("/:id", ...penyedia, c.hapus);
export default router;