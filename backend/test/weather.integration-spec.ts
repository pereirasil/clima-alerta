import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../src/config/configuration";
import { OpenMeteoProvider } from "../src/weather/infrastructure/providers/open-meteo/open-meteo.provider";

describe("Open-Meteo real integration", () => {
  it("fetches current, hourly and daily weather from the real provider", async () => {
    const provider = new OpenMeteoProvider({
      get: jest.fn().mockReturnValue({
        provider: "open-meteo",
        openMeteoBaseUrl:
          process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com",
        timeoutMs: Number(process.env.WEATHER_PROVIDER_TIMEOUT_MS ?? 10000),
      }),
    } as unknown as ConfigService<AppConfig, true>);
    const rioDeJaneiro = { latitude: -22.9068, longitude: -43.1729 };

    const [current, hourly, daily] = await Promise.all([
      provider.getCurrentWeather(rioDeJaneiro),
      provider.getHourlyForecast(rioDeJaneiro),
      provider.getDailyForecast(rioDeJaneiro),
    ]);

    expect(current.source.name).toBe("Open-Meteo");
    expect(Number.isFinite(current.temperatureCelsius)).toBe(true);
    expect(current.timezone.length).toBeGreaterThan(0);
    expect(hourly.length).toBeGreaterThan(0);
    expect(daily.length).toBeGreaterThan(0);
  }, 15000);
});
