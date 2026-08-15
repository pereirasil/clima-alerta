import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";
import { migrations } from "./migrations";

loadEnv({ quiet: true });

export interface MigrationStatus {
  id: string;
  filename: string;
  applied: boolean;
  appliedAt?: Date;
}

export interface MigrationResult {
  applied: string[];
}

export function createPoolFromEnv(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL || undefined,
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number(process.env.DATABASE_PORT ?? 5432),
    database: process.env.DATABASE_NAME ?? "clima_alerta",
    user: process.env.DATABASE_USER ?? "clima_alerta",
    password: process.env.DATABASE_PASSWORD ?? "clima_alerta_dev_password",
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
    connectionTimeoutMillis: Number(
      process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 3000,
    ),
    query_timeout: Number(process.env.DATABASE_QUERY_TIMEOUT_MS ?? 3000),
  });
}

async function ensureMigrationTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      filename text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function getMigrationStatus(pool: Pool): Promise<MigrationStatus[]> {
  await ensureMigrationTable(pool);
  const result = await pool.query<{ id: string; filename: string; applied_at: Date }>(
    "SELECT id, filename, applied_at FROM schema_migrations ORDER BY id",
  );
  const applied = new Map(
    result.rows.map((row) => [
      row.id,
      { filename: row.filename, appliedAt: row.applied_at },
    ]),
  );

  return migrations.map((migration) => ({
    id: migration.id,
    filename: migration.filename,
    applied: applied.has(migration.id),
    appliedAt: applied.get(migration.id)?.appliedAt,
  }));
}

export async function runMigrations(pool: Pool): Promise<MigrationResult> {
  await ensureMigrationTable(pool);
  const statuses = await getMigrationStatus(pool);
  const pending = statuses.filter((status) => !status.applied);
  const applied: string[] = [];

  for (const migration of pending) {
    const sql = await readFile(
      join(__dirname, "migrations", migration.filename),
      "utf8",
    );
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (id, filename) VALUES ($1, $2)",
        [migration.id, migration.filename],
      );
      await client.query("COMMIT");
      applied.push(migration.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  return { applied };
}
