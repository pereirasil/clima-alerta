import { ConfigService } from "@nestjs/config";
import { HealthService } from "./health.service";
import type { AppConfig } from "../config/configuration";
import type { DatabaseService } from "../database/database.service";
import type { CacheService } from "../cache/cache.service";

describe("HealthService", () => {
  const config = new ConfigService<AppConfig, true>({
    serviceName: "clima-alerta-api",
    apiVersion: "v1",
  });
  const databaseService = {
    ping: jest.fn<Promise<"up" | "down">, []>().mockResolvedValue("up"),
  } as Pick<DatabaseService, "ping">;
  const cacheService = {
    ping: jest.fn<Promise<"up" | "down">, []>().mockResolvedValue("up"),
  } as Pick<CacheService, "ping">;

  it("returns an honest health response with infrastructure status", async () => {
    const service = new HealthService(
      config,
      databaseService as DatabaseService,
      cacheService as CacheService,
    );
    const result = await service.getStatus();

    expect(result.status).toBe("ok");
    expect(result.service).toBe("clima-alerta-api");
    expect(result.services).toEqual({
      application: "up",
      database: "up",
      redis: "up",
    });
    expect(Date.parse(result.timestamp)).not.toBeNaN();
  });

  it("can include API version when requested", async () => {
    const service = new HealthService(
      config,
      databaseService as DatabaseService,
      cacheService as CacheService,
    );

    await expect(service.getStatus(true)).resolves.toMatchObject({
      status: "ok",
      version: "v1",
    });
  });

  it("marks status as degraded when infrastructure is down", async () => {
    const degradedDatabase = {
      ping: jest.fn<Promise<"up" | "down">, []>().mockResolvedValue("down"),
    } as Pick<DatabaseService, "ping">;
    const service = new HealthService(
      config,
      degradedDatabase as DatabaseService,
      cacheService as CacheService,
    );

    await expect(service.getStatus()).resolves.toMatchObject({
      status: "degraded",
      services: {
        database: "down",
        redis: "up",
      },
    });
  });
});
