
import express from "express";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { pool } from "./db/pool.js";
import { HttpError } from "./lib/api.js";

import penawaranRouter from "./routes/penawaran.js";
import pesananRouter from "./routes/pesanan.js";
import authRouter from "./routes/auth.js";
import dashboardRouter from "./routes/dashboard.js";

import { catatRequest } from "./middleware/catat-request.js";
import { routeTidakDitemukan } from "./middleware/not-found.js";
import { tanganiError } from "./middleware/error-handler.js";

const app = express();

const produksi = process.env.NODE_ENV === "production";
const hop = process.env.TRUST_PROXY_HOPS ?? "0";

if (!["0", "1"].includes(hop)) {
    throw new Error("TRUST_PROXY_HOPS wajib 0 atau 1.");
}

app.set("trust proxy", Number(hop));

const melaluiProxy = produksi && hop === "1";

app.disable("x-powered-by");
app.set("query parser", "simple");

// Konfigurasi keamanan HTTP.
app.use(
    helmet({
        strictTransportSecurity: melaluiProxy
            ? {
                  maxAge: 15552000,
                  includeSubDomains: false,
              }
            : false,

        contentSecurityPolicy: {
            directives: {
                upgradeInsecureRequests: melaluiProxy ? [] : null,
            },
        },
    })
);

// Mencatat setiap request.
app.use(catatRequest);

// Memastikan request API menggunakan JSON untuk POST dan PUT.
app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");

    if (
        ["POST", "PUT"].includes(req.method) &&
        !req.is("application/json")
    ) {
        return next(
            new HttpError(
                415,
                "JSON REQUIRED",
                "Gunakan Content-Type application/json."
            )
        );
    }

    next();
});

// Batas ukuran JSON biasa dan JSON dengan foto.
const jsonBiasa = express.json({
    limit: "20kb",
});

const jsonFoto = express.json({
    limit: "3mb",
});

// Penawaran dapat menerima JSON berukuran lebih besar karena foto.
app.use((req, res, next) => {
    const penawaran =
        /^\/api\/penawaran(?:\/[1-9][0-9]*)?\/?$/.test(req.path) &&
        ["POST", "PUT"].includes(req.method);

    return (penawaran ? jsonFoto : jsonBiasa)(
        req,
        res,
        next
    );
});

// Health check aplikasi.
app.get("/healthz", (req, res) => {
    res.set("Cache-Control", "no-store");

    res.json({
        success: true,
        data: {
            status: "ok",
        },
    });
});

// Health check database.
app.get("/api/health", async (req, res, next) => {
    try {
        await pool.query("SELECT 1");

        return res.json({
            success: true,
            data: {
                status: "ok",
                database: "connected",
                waktu: new Date().toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

// API routes.
app.use("/api/auth", authRouter);
app.use("/api/penawaran", penawaranRouter);
app.use("/api/pesanan", pesananRouter);
app.use("/api/dashboard", dashboardRouter);

// API yang tidak dikenal tetap mengembalikan JSON 404.
app.use("/api", routeTidakDitemukan);

// Penyajian frontend Vue saat production.
if (produksi) {
    const dist = fileURLToPath(
        new URL("../frontend/dist/", import.meta.url)
    );

    if (!existsSync(join(dist, "index.html"))) {
        throw new Error(
            "Build Vue belum ada. Jalankan npm run build."
        );
    }

    app.use(
        "/assets",
        express.static(join(dist, "assets"), {
            immutable: true,
            maxAge: "1y",
        })
    );

    app.use(
        express.static(dist, {
            setHeaders(res, path) {
                if (path.endsWith(".html")) {
                    res.set("Cache-Control", "no-cache");
                }
            },
        })
    );
} else {
    // Folder public digunakan saat development.
    app.use(
        express.static(
            fileURLToPath(
                new URL("../public/", import.meta.url)
            )
        )
    );
}

// Route tidak ditemukan dan error handler harus berada paling akhir.
app.use(routeTidakDitemukan);
app.use(tanganiError);

export default app;
