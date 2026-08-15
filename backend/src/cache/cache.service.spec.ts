import Redis from "ioredis";
import { CacheService } from "./cache.service";
import type { StructuredLogger } from "../common/logging/structured-logger.service";

function isCacheObject(value: unknown): value is { ok: true } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    value.ok === true
  );
}

describe("CacheService", () => {
  const logger = {
    warn: jest.fn(),
  } as Pick<StructuredLogger, "warn">;

  it("returns cache miss as null", async () => {
    const redis = {
      get: jest.fn<Promise<string | null>, [string]>().mockResolvedValue(null),
      disconnect: jest.fn(),
    } as unknown as Redis;
    const service = new CacheService(redis, logger as StructuredLogger);

    await expect(service.get("key", isCacheObject)).resolves.toBeNull();
  });

  it("returns cache hit when JSON validates", async () => {
    const redis = {
      get: jest
        .fn<Promise<string | null>, [string]>()
        .mockResolvedValue(JSON.stringify({ ok: true })),
      disconnect: jest.fn(),
    } as unknown as Redis;
    const service = new CacheService(redis, logger as StructuredLogger);

    await expect(service.get("key", isCacheObject)).resolves.toEqual({ ok: true });
  });

  it("sets values with explicit TTL", async () => {
    const setMock = jest
      .fn<Promise<"OK">, [string, string, "EX", number]>()
      .mockResolvedValue("OK");
    const redis = {
      set: setMock,
      disconnect: jest.fn(),
    } as unknown as Redis;
    const service = new CacheService(redis, logger as StructuredLogger);

    await expect(service.set("key", { ok: true }, 60)).resolves.toBe(true);
    expect(setMock).toHaveBeenCalledWith("key", "{\"ok\":true}", "EX", 60);
  });

  it("fails open when Redis throws", async () => {
    const redis = {
      get: jest.fn<Promise<string | null>, [string]>().mockRejectedValue(new Error("down")),
      disconnect: jest.fn(),
    } as unknown as Redis;
    const service = new CacheService(redis, logger as StructuredLogger);

    await expect(service.get("key", isCacheObject)).resolves.toBeNull();
  });
});
