import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../config/configuration";

@Injectable()
export class CacheKeyService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  weather(latitude: number, longitude: number): string {
    return this.key("weather", this.coordinate(latitude), this.coordinate(longitude));
  }

  event(provider: string, externalId: string): string {
    return this.key("event", this.safe(provider), this.safe(externalId));
  }

  alerts(region: string): string {
    return this.key("alerts", this.safe(region));
  }

  custom(...parts: string[]): string {
    return this.key(...parts.map((part) => this.safe(part)));
  }

  private key(...parts: string[]): string {
    const prefix = this.configService.get("redis.keyPrefix", { infer: true });
    return [prefix, ...parts].join(":");
  }

  private coordinate(value: number): string {
    return value.toFixed(4);
  }

  private safe(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}
