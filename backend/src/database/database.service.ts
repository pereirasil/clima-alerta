import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import { sql, type SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { DRIZZLE_DB, PG_POOL } from "./database.tokens";
import * as schema from "./schema";

export type DatabaseConnectionStatus = "up" | "down";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(DRIZZLE_DB)
    readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async ping(): Promise<DatabaseConnectionStatus> {
    try {
      await this.pool.query("SELECT 1");
      return "up";
    } catch {
      return "down";
    }
  }

  async assertPostgisEnabled(): Promise<boolean> {
    const result = await this.pool.query<{ installed: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS installed",
    );
    return result.rows[0]?.installed === true;
  }

  async query<T extends Record<string, unknown>>(
    query: SQL,
  ): Promise<Awaited<ReturnType<NodePgDatabase<typeof schema>["execute"]>>> {
    return this.db.execute<T>(query);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

export { sql };
