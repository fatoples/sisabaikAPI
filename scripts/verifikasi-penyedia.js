
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function verifikasiPenyedia(
    pool,
    email,
    status = "terverifikasi",
) {
    if (
        !["terverifikasi", "ditolak"].includes(status) ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254
    ) {
        throw new Error(
            "Email atau status peninjauan tidak valid.",
        );
    }

    const c = await pool.connect();
    let mulai = false;
    let rusak;

    try {
        await c.query("BEGIN");
        mulai = true;

        await c.query("SET LOCAL lock_timeout = '2s'");

        const r = await c.query(
            `
            SELECT py.id, u.email
            FROM penyedia py
            JOIN pengguna u ON u.id = py.pengguna_id
            WHERE u.email = $1
              AND u.peran = 'penyedia'
              AND u.aktif = TRUE
            FOR UPDATE OF py, u
            `,
            [email.trim().toLowerCase()],
        );

        if (r.rows.length !== 1) {
            throw new Error(
                "Akun penyedia aktif tidak ditemukan.",
            );
        }

        await c.query(
            `
            UPDATE penyedia
            SET status_verifikasi = $1
            WHERE id = $2
            `,
            [status, r.rows[0].id],
        );

        await c.query("COMMIT");
        mulai = false;

        return {
            email: r.rows[0].email,
            status,
        };
    } catch (e) {
        if (mulai) {
            try {
                await c.query("ROLLBACK");
            } catch (gagal) {
                rusak = gagal;
            }
        }

        throw e;
    } finally {
        c.release(rusak);
    }
}

if (
    process.argv[1] &&
    resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
    let pool;

    try {
        const cloud = process.argv.includes("--cloud");

        const tujuan = cloud
            ? (
                process.env.CLOUD_CONFIRM_DATABASE ??
                process.env.DEMO_CONFIRM_DATABASE
            )
            : "sisabaik_dev";

        if (cloud) {
            if (
                !(process.env.PGHOST ?? "").endsWith(".neon.tech") ||
                process.env.PGSSL !== "require" ||
                !tujuan
            ) {
                throw new Error(
                    "Peninjauan cloud memerlukan Neon/TLS dan CLOUD_CONFIRM_DATABASE.",
                );
            }
        } else if (
            !["localhost", "127.0.0.1"].includes(
                process.env.PGHOST,
            ) ||
            process.env.PGDATABASE !== tujuan
        ) {
            throw new Error(
                "Peninjauan lokal hanya untuk sisabaik_dev.",
            );
        }

        const args = process.argv
            .slice(2)
            .filter(
                (x) => !["--cloud", "--tolak"].includes(x),
            );

        if (args.length !== 1) {
            throw new Error(
                "Gunakan: npm run penyedia:verifikasi -- email@domain.com [--tolak]",
            );
        }

        ({ pool } = await import("../src/db/pool.js"));

        const db = await pool.query(
            `
            SELECT
                current_database() AS nama,
                (
                    SELECT ssl
                    FROM pg_stat_ssl
                    WHERE pid = pg_backend_pid()
                ) AS tls
            `,
        );

        if (
            db.rows[0].nama !== tujuan ||
            (cloud && !db.rows[0].tls)
        ) {
            throw new Error(
                "Database tujuan atau TLS tidak sesuai.",
            );
        }

        const r = await verifikasiPenyedia(
            pool,
            args[0],
            process.argv.includes("--tolak")
                ? "ditolak"
                : "terverifikasi",
        );

        console.log(
            "Status penyedia " +
                r.email +
                ": " +
                r.status +
                ". Pengguna dapat menekan Periksa status.",
        );
    } catch (e) {
        console.error(
            e.code
                ? "Peninjauan gagal: " + e.code
                : e.message,
        );

        process.exitCode = 1;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}
