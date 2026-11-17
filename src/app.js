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
app.use(
  helmet({
    strictTransportSecurity: melaluiProxy
      ? { maxAge: 15552000, includeSubDomains: false }
      : false,
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests: melaluiProxy ? [] : null,
      },
    },
  }),
);
app.use(catatRequest);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (["POST", "PUT"].includes(req.method) && !req.is("application/json")) {
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
const jsonBiasa = express.json({ limit: "20kb" });
const jsonFoto = express.json({ limit: "3mb" });
app.use((req, res, next) => {
  const penawaran =
    /^\/api\/penawaran(?:\/[1-9][0-9]*)?\/?$/.test(req.path) &&
    ["POST", "PUT"].includes(req.method);
  return (penawaran ? jsonFoto : jsonBiasa)(req, res, next);
});
app.get("/healthz", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ success: true, data: { status: "ok" } });
});
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
app.use("/api/dashboard", dashboardRouter);
// API yang tidak dikenal harus tetap mengembalikan JSON 404.
app.use("/api", routeTidakDitemukan);
if (produksi) {
  const dist = fileURLToPath(new URL("../frontend/dist/", import.meta.url));
  if (!existsSync(join(dist, "index.html"))) {
    throw new Error("Build Vue belum ada. Jalankan npm run build.");
  }
  app.use(
    "/assets",
    express.static(join(dist, "assets"), {
      immutable: true,
      maxAge: "1y",
    }),
  );
  app.use(
    express.static(dist, {
      setHeaders(res, path) {
        if (path.endsWith(".html")) {
          res.set("Cache-Control", "no-cache");
        }
      },
    }),
  );
} else {
  app.use(
    express.static(fileURLToPath(new URL("../public/", import.meta.url))),
  );
}
app.use(routeTidakDitemukan);
app.use(tanganiError);
export default app;