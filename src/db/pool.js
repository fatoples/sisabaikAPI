import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  max: 5,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000
});