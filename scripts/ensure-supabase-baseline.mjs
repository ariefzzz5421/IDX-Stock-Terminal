import pg from "pg";
import { SUPABASE_ROOT_CA } from "../lib/db/supabase-ca.ts";

// The production database was created before Prisma migration tracking was
// introduced. Baseline only when every column from the initial schema exists;
// an unexpected schema must stop the deployment for manual review.
const initialColumns = {
  users: ["id", "username", "password_hash", "created_at"],
  profiles: ["user_id", "display_name", "bio", "avatar_url", "updated_at"],
  watchlists: ["id", "user_id", "stock_code", "added_at", "sort_order"],
  stocks: ["code", "name", "is_listed", "sector", "market_cap", "logo_url", "last_price", "prev_close", "last_change_pct", "last_volume", "last_value", "updated_at"],
  price_history: ["id", "stock_code", "interval", "timestamp", "open", "high", "low", "close", "volume"],
  news: ["id", "title", "summary", "source", "url", "published_at", "related_codes", "created_at"],
};

export async function needsLegacyBaseline(connectionString) {
  const url = new URL(connectionString);
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
    url.searchParams.delete(key);
  }
  const client = new pg.Client({
    connectionString: url.toString(),
    ssl: { ca: SUPABASE_ROOT_CA, rejectUnauthorized: true },
    connectionTimeoutMillis: 10_000,
  });

  try {
    await client.connect();
    const columns = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
    `, [Object.keys(initialColumns)]);
    const found = new Set(columns.rows.map(({ table_name, column_name }) => `${table_name}.${column_name}`));
    if (found.size === 0) return false; // New empty database: deploy all migrations.

    const missing = Object.entries(initialColumns).flatMap(([table, names]) =>
      names.filter((name) => !found.has(`${table}.${name}`)).map((name) => `${table}.${name}`)
    );
    if (missing.length) {
      throw new Error(`Production schema differs from the initial migration; missing: ${missing.join(", ")}`);
    }

    const migrationTable = await client.query("SELECT to_regclass('public._prisma_migrations') AS name");
    if (migrationTable.rows[0].name) {
      const migrations = await client.query("SELECT migration_name, finished_at, rolled_back_at FROM public._prisma_migrations");
      const initial = migrations.rows.find((row) => row.migration_name === "20260930_init" && row.finished_at && !row.rolled_back_at);
      if (initial) return false;
      if (migrations.rows.length) {
        throw new Error("Migration history exists without the initial migration; manual review is required.");
      }
    }
    return true;
  } finally {
    await client.end();
  }
}
