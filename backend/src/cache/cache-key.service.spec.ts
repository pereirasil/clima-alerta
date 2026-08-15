import { ConfigService } from "@nestjs/config";
import { CacheKeyService } from "./cache-key.service";
import type { AppConfig } from "../config/configuration";

describe("CacheKeyService", () => {
  it("builds cache keys without precise sensitive coordinates", () => {
    const config = new ConfigService<AppConfig, true>({
      redis: {
        keyPrefix: "clima-alerta",
      },
    });
    const service = new CacheKeyService(config);

    expect(service.weather(-23.55052, -46.63331)).toBe(
      "clima-alerta:weather:-23.5505:-46.6333",
    );
    expect(service.event("USGS Feed", "quake/123")).toBe(
      "clima-alerta:event:usgs-feed:quake-123",
    );
  });
});
