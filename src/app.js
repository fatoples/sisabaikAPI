
import express from "express";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { pool } from "./db/pool.js";
import { HttpError } from "./lib/api.js";

import penawaranRouter from "./routes/penawaran.js";
import pesananRouter from "./routes/pesanan.js";
import authRouter from "./routes/auth.js";

import { catatRequest } from "./middleware/catat-request.js";
import { routeTidakDitemukan } from "./middleware/not-found.js";
import { tanganiError } from "./middleware/error-handler.js";

const app = express();

app.disable("x-powered-by");
app.set("query parser", "simple");

app.use(
    helmet({
        strictTransportSecurity: false,
        contentSecurityPolicy: {
            directives: {
                upgradeInsecureRequests: null,
            },
        },
    }),
);

app.use(catatRequest);

app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");

    if (
        ["POST", "PUT"].includes(req.method) &&
        !req.is("application/json")
    ) {
        return next(
            new HttpError(
                415,
                "JSON_REQUIRED",
                "Gunakan Content-Type application/json.",
            ),
        );
    }

    next();
});

app.use(express.json({ limit: "20kb" }));

app.use(
    express.static(
        fileURLToPath(
            new URL("../public/", import.meta.url),
        ),
    ),
);

app.get("/api/health", async (req, res) => {
    await pool.query("SELECT 1");

    return res.json({
        success: true,
        data: {
            status: "ok",
            database: "connected",
            waktu: new Date().toISOString(),
        },
    });
});

app.use("/api/auth", authRouter);
app.use("/api/penawaran", penawaranRouter);
app.use("/api/pesanan", pesananRouter);

app.use(routeTidakDitemukan);
app.use(tanganiError);

export default app;