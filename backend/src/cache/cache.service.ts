import { Inject, Injectable, OnApplicationShutdown } from "@nestjs/common";
import Redis from "ioredis";
import { StructuredLogger } from "../common/logging/structured-logger.service";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");
export type CacheStatus = "up" | "down";

@Injectable()
export class CacheService implements OnApplicationShutdown {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly logger: StructuredLogger,
  ) {}

  async get<T>(
    key: string,
    validate: (value: unknown) => value is T,
  ): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      if (raw === null) {
        return null;
      }
      const parsed: unknown = JSON.parse(raw);
      return validate(parsed) ? parsed : null;
    } catch (error) {
      this.logCacheFailure("get", key, error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    try {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return true;
    } catch (error) {
      this.logCacheFailure("set", key, error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logCacheFailure("delete", key, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) === 1;
    } catch (error) {
      this.logCacheFailure("exists", key, error);
      return false;
    }
  }

  async ping(): Promise<CacheStatus> {
    try {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }
      const pong = await this.redis.ping();
      return pong === "PONG" ? "up" : "down";
    } catch (error) {
      this.logCacheFailure("ping", "health", error);
      return "down";
    }
  }

  onApplicationShutdown(): void {
    this.redis.disconnect();
  }

  private logCacheFailure(operation: string, key: string, error: unknown): void {
    const message = error instanceof Error ? error.message : "Unknown Redis error";
    this.logger.warn(
      {
        operation,
        key,
        message,
      },
      "CacheService",
    );
  }
}
