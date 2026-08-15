import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CacheService, type CacheStatus } from "../cache/cache.service";
import type { AppConfig } from "../config/configuration";
import {
  DatabaseService,
  type DatabaseConnectionStatus,
} from "../database/database.service";

export interface HealthStatus {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  services: {
    application: "up";
    database: DatabaseConnectionStatus;
    redis: CacheStatus;
  };
  version?: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
  ) {}

  getLiveness(includeVersion = false): Omit<HealthStatus, "services"> {
    const response: Omit<HealthStatus, "services"> = {
      status: "ok",
      service: this.configService.get("serviceName", { infer: true }),
      timestamp: new Date().toISOString(),
    };

    if (includeVersion) {
      response.version = this.configService.get("apiVersion", { infer: true });
    }

    return response;
  }

  async getStatus(includeVersion = false): Promise<HealthStatus> {
    const [database, redis] = await Promise.all([
      this.databaseService.ping(),
      this.cacheService.ping(),
    ]);

    const response: HealthStatus = {
      status: database === "up" && redis === "up" ? "ok" : "degraded",
      service: this.configService.get("serviceName", { infer: true }),
      timestamp: new Date().toISOString(),
      services: {
        application: "up",
        database,
        redis,
      },
    };

    if (includeVersion) {
      response.version = this.configService.get("apiVersion", { infer: true });
    }

    return response;
  }
}
