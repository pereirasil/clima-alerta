import { createPoolFromEnv, getMigrationStatus } from "./migration-runner";
import { formatMigrationError } from "./script-errors";

async function main() {
  const pool = createPoolFromEnv();
  try {
    const statuses = await getMigrationStatus(pool);
    for (const status of statuses) {
      process.stdout.write(
        `${status.applied ? "applied" : "pending"} ${status.id} ${status.filename}\n`,
      );
    }
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(`Migration status failed: ${formatMigrationError(error)}\n`);
  process.exitCode = 1;
});
