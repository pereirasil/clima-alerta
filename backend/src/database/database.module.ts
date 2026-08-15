import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { AppConfig } from "../config/configuration";
import { DatabaseService } from "./database.service";
import { DRIZZLE_DB, PG_POOL } from "./database.tokens";
import * as schema from "./schema";

@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const database = configService.get("database", { infer: true });
        return new Pool({
          connectionString: database.url,
          host: database.host,
          port: database.port,
          database: database.name,
          user: database.user,
          password: database.password,
          ssl: database.ssl ? { rejectUnauthorized: true } : false,
          connectionTimeoutMillis: database.connectionTimeoutMs,
          query_timeout: database.queryTimeoutMs,
          max: 10,
        });
      },
    },
    {
      provide: DRIZZLE_DB,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
    DatabaseService,
  ],
  exports: [DatabaseService, DRIZZLE_DB, PG_POOL],
})
export class DatabaseModule {}
