import { ServiceUnavailableException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../../../config/configuration";
import { OpenMeteoProvider } from "./open-meteo.provider";

const location = { latitude: -22.9068, longitude: -43.1729 };

describe("OpenMeteoProvider", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("normalizes current weather into Brazilian units", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(fixture()));
    const provider = new OpenMeteoProvider(configService());

    const current = await provider.getCurrentWeather(location);

    expect(current).toMatchObject({
      kind: "observation",
      timezone: "America/Sao_Paulo",
      temperatureCelsius: 28.4,
      apparentTemperatureCelsius: 30.1,
      humidityPercent: 71,
      precipitationMm: 0,
      rainMm: 0,
      windSpeedKmh: 14.2,
      windDirectionDegrees: 130,
      weatherCode: 2,
      weatherDescription: "Parcialmente nublado",
      source: {
        name: "Open-Meteo",
        url: "https://open-meteo.com/",
      },
    });
  });

  it("requests Open-Meteo with current, hourly, daily, metric units and timezone auto", async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(fixture()));
    global.fetch = fetchMock;
    const provider = new OpenMeteoProvider(configService());

    await provider.getHourlyForecast(location);

    const firstCall = fetchMock.mock.calls.at(0) as [URL | string, RequestInit?] | undefined;
    expect(firstCall).toBeDefined();
    const requestedUrl = new URL(String(firstCall?.[0]));
    expect(requestedUrl.origin).toBe("https://api.open-meteo.com");
    expect(requestedUrl.pathname).toBe("/v1/forecast");
    expect(requestedUrl.searchParams.get("latitude")).toBe(String(location.latitude));
    expect(requestedUrl.searchParams.get("longitude")).toBe(String(location.longitude));
    expect(requestedUrl.searchParams.get("temperature_unit")).toBe("celsius");
    expect(requestedUrl.searchParams.get("wind_speed_unit")).toBe("kmh");
    expect(requestedUrl.searchParams.get("precipitation_unit")).toBe("mm");
    expect(requestedUrl.searchParams.get("timezone")).toBe("auto");
    expect(requestedUrl.searchParams.get("current")).toContain("temperature_2m");
    expect(requestedUrl.searchParams.get("hourly")).toContain("precipitation_probability");
    expect(requestedUrl.searchParams.get("daily")).toContain("temperature_2m_max");
  });

  it("normalizes hourly and daily forecasts", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(fixture()));
    const provider = new OpenMeteoProvider(configService());

    const hourly = await provider.getHourlyForecast(location);
    const daily = await provider.getDailyForecast(location);

    expect(hourly).toHaveLength(2);
    expect(hourly[0]).toMatchObject({
      kind: "forecast",
      interval: "hourly",
      timezone: "America/Sao_Paulo",
      temperatureCelsius: 28.4,
      precipitationProbabilityPercent: 12,
      weatherDescription: "Parcialmente nublado",
    });
    expect(daily).toHaveLength(2);
    expect(daily[0]).toMatchObject({
      kind: "forecast",
      interval: "daily",
      date: "2026-08-15",
      temperatureMinCelsius: 21.4,
      temperatureMaxCelsius: 29.2,
      precipitationSumMm: 1.2,
      weatherDescription: "Parcialmente nublado",
    });
  });

  it("turns provider HTTP errors into service unavailable", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn(),
    });
    const provider = new OpenMeteoProvider(configService());

    await expect(provider.getCurrentWeather(location)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("rejects invalid provider payloads", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ timezone: "UTC" }));
    const provider = new OpenMeteoProvider(configService());

    await expect(provider.getCurrentWeather(location)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

function configService(): ConfigService<AppConfig, true> {
  return {
    get: jest.fn().mockReturnValue({
      provider: "open-meteo",
      openMeteoBaseUrl: "https://api.open-meteo.com",
      timeoutMs: 5000,
    }),
  } as unknown as ConfigService<AppConfig, true>;
}

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

function fixture() {
  return {
    latitude: -22.875,
    longitude: -43.125,
    timezone: "America/Sao_Paulo",
    current: {
      time: "2026-08-15T11:15",
      temperature_2m: 28.4,
      apparent_temperature: 30.1,
      relative_humidity_2m: 71,
      precipitation: 0,
      rain: 0,
      weather_code: 2,
      wind_speed_10m: 14.2,
      wind_direction_10m: 130,
      wind_gusts_10m: 21.6,
    },
    hourly: {
      time: ["2026-08-15T12:00", "2026-08-15T13:00"],
      temperature_2m: [28.4, 29.1],
      apparent_temperature: [30.1, 31.4],
      relative_humidity_2m: [71, 69],
      precipitation_probability: [12, 18],
      precipitation: [0, 0.2],
      rain: [0, 0.2],
      weather_code: [2, 3],
      wind_speed_10m: [14.2, 16.3],
      wind_gusts_10m: [21.6, 23.5],
    },
    daily: {
      time: ["2026-08-15", "2026-08-16"],
      weather_code: [2, 61],
      temperature_2m_max: [29.2, 27.8],
      temperature_2m_min: [21.4, 20.9],
      apparent_temperature_max: [31.2, 29.3],
      apparent_temperature_min: [22.8, 22.1],
      precipitation_sum: [1.2, 8.4],
      precipitation_probability_max: [35, 74],
      wind_speed_10m_max: [18.2, 20.5],
      wind_gusts_10m_max: [29.4, 33.1],
    },
  };
}
