import Redis from "ioredis";
import { createPoolFromEnv, runMigrations } from "../src/database/migration-runner";

const runInfraTests = process.env.CLIMA_ALERTA_RUN_INFRA_TESTS === "true";
const describeInfra = runInfraTests ? describe : describe.skip;

describeInfra("PostgreSQL/PostGIS/Redis infrastructure", () => {
  it("runs migrations and verifies PostGIS distance calculation", async () => {
    const pool = createPoolFromEnv();
    try {
      await runMigrations(pool);
      const extension = await pool.query<{ installed: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') AS installed",
      );
      expect(extension.rows[0]?.installed).toBe(true);

      const distance = await pool.query<{ meters: number }>(`
        SELECT ST_DistanceSphere(
          ST_MakePoint(-46.6333, -23.5505),
          ST_MakePoint(-46.6388, -23.5489)
        ) AS meters
      `);
      expect(distance.rows[0]?.meters).toBeGreaterThan(500);
    } finally {
      await pool.end();
    }
  });

  it("uses Redis cache TTL with miss and hit", async () => {
    const redis = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB ?? 0),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS ?? 3000),
    });
    const key = "clima-alerta:test:ttl";
    try {
      await redis.connect();
      await redis.del(key);
      await expect(redis.get(key)).resolves.toBeNull();
      await redis.set(key, JSON.stringify({ ok: true }), "EX", 2);
      await expect(redis.get(key)).resolves.toBe("{\"ok\":true}");
      const ttl = await redis.ttl(key);
      expect(ttl).toBeGreaterThan(0);
    } finally {
      redis.disconnect();
    }
  });
});
