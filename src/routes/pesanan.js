
import { Router } from "express";
import * as c from "../controllers/pesanan.js";
import {
    wajibLogin,
    wajibPeran,
    wajibPenyediaTerverifikasi,
} from "../middleware/auth.js";

const router = Router();

router.use(
    wajibLogin,
    wajibPeran("pembeli", "penyedia"),
);

router.use((req, res, next) => {
    if (req.pengguna.peran === "penyedia") {
        return wajibPenyediaTerverifikasi(req, res, next);
    }

    next();
});

router.get("/", c.daftar);
router.get("/:id", c.detail);
router.post("/", wajibPeran("pembeli"), c.buat);

export default router;
