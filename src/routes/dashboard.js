
import { Router } from "express";
import { ringkasanDashboard } from "../services/dashboard.js";
import {
    wajibLogin,
    wajibPeran,
    wajibPenyediaTerverifikasi,
} from "../middleware/auth.js";

const router = Router();

// Semua pengguna harus login dan memiliki peran pembeli atau penyedia.
router.use(
    wajibLogin,
    wajibPeran("pembeli", "penyedia")
);

// Verifikasi penyedia sebelum mengakses dashboard.
router.use((req, res, next) => {
    if (req.pengguna.peran === "penyedia") {
        return wajibPenyediaTerverifikasi(req, res, next);
    }

    next();
});

// Mengambil ringkasan dashboard berdasarkan pengguna yang login.
router.get("/", async (req, res, next) => {
    try {
        const data = await ringkasanDashboard(req.pengguna);

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
