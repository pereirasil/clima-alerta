import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import type { RedisOptions } from "ioredis";
import { StructuredLogger } from "../common/logging/structured-logger.service";
import type { AppConfig } from "../config/configuration";
import { CacheKeyService } from "./cache-key.service";
import { CacheService, REDIS_CLIENT } from "./cache.service";

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService, StructuredLogger],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        logger: StructuredLogger,
      ) => {
        const redis = configService.get("redis", { infer: true });
        const options: RedisOptions = {
          password: redis.password,
          db: redis.db,
          lazyConnect: true,
          connectTimeout: redis.connectTimeoutMs,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy: null,
          tls: redis.tls ? {} : undefined,
        };
        const client = redis.url
          ? new Redis(redis.url, options)
          : new Redis({
              ...options,
              host: redis.host,
              port: redis.port,
            });
        client.on("error", (error: Error) => {
          logger.warn(
            {
              message: formatRedisError(error),
            },
            "RedisClient",
          );
        });
        return client;
      },
    },
    CacheKeyService,
    CacheService,
  ],
  exports: [CacheKeyService, CacheService, REDIS_CLIENT],
})
export class CacheModule {}

function formatRedisError(error: Error): string {
  if (error instanceof AggregateError) {
    const messages = error.errors
      .map((item: unknown) => (item instanceof Error ? item.message : "unknown"))
      .filter((message: string) => message.length > 0);
    return messages.length > 0 ? messages.join("; ") : "Redis connection failed";
  }

  return error.message.length > 0 ? error.message : "Redis connection failed";
}
