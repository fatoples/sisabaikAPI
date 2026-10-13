import { Router } from "express";
import * as controller from "../controllers/pesanan.js";

const router = Router();
router.get("/", controller.daftar);
router.get("/:id", controller.detail);
router.post("/", controller.buat);

export default router;