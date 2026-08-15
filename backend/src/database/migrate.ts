import { createPoolFromEnv, runMigrations } from "./migration-runner";
import { formatMigrationError } from "./script-errors";

async function main() {
  const pool = createPoolFromEnv();
  try {
    const result = await runMigrations(pool);
    if (result.applied.length === 0) {
      process.stdout.write("No pending migrations.\n");
      return;
    }
    process.stdout.write(`Applied migrations: ${result.applied.join(", ")}\n`);
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`Migration failed: ${formatMigrationError(error)}\n`);
  process.exitCode = 1;
});
