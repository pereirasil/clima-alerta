import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../../../config/configuration";
import type { WeatherProvider } from "../../../application/weather-provider.interface";
import type { GeoPoint } from "../../../domain/location";
import { describeWeatherCode } from "../../../domain/weather-code";
import type {
  DailyWeatherForecast,
  DataSourceRef,
  HourlyWeatherForecast,
  WeatherForecast,
  WeatherObservation,
} from "../../../domain/weather.types";
import type { OpenMeteoForecastResponse } from "./open-meteo.types";

const currentVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "rain",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
] as const;

const hourlyVariables = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation_probability",
  "precipitation",
  "rain",
  "weather_code",
  "wind_speed_10m",
  "wind_gusts_10m",
] as const;

const dailyVariables = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
] as const;

@Injectable()
export class OpenMeteoProvider implements WeatherProvider {
  readonly code = "open-meteo";

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async getCurrentWeather(location: GeoPoint): Promise<WeatherObservation> {
    const response = await this.fetchForecast(location);
    const current = response.current;
    if (!current || typeof current.time !== "string") {
      throw new ServiceUnavailableException("Weather provider returned no current data.");
    }

    const source = this.sourceRef();
    const weatherCode = readNumber(current.weather_code, "current.weather_code");

    return {
      kind: "observation",
      location: this.responseLocation(response),
      timezone: response.timezone,
      observedAt: new Date(current.time),
      source,
      temperatureCelsius: readNumber(current.temperature_2m, "current.temperature_2m"),
      apparentTemperatureCelsius: readNumber(
        current.apparent_temperature,
        "current.apparent_temperature",
      ),
      humidityPercent: readNumber(
        current.relative_humidity_2m,
        "current.relative_humidity_2m",
      ),
      precipitationMm: readNumber(current.precipitation, "current.precipitation"),
      rainMm: readNumber(current.rain, "current.rain"),
      windSpeedKmh: readNumber(current.wind_speed_10m, "current.wind_speed_10m"),
      windDirectionDegrees: readNumber(
        current.wind_direction_10m,
        "current.wind_direction_10m",
      ),
      windGustKmh: current.wind_gusts_10m,
      weatherCode,
      weatherDescription: describeWeatherCode(weatherCode),
    };
  }

  async getForecast(location: GeoPoint): Promise<WeatherForecast[]> {
    const [hourly, daily] = await Promise.all([
      this.getHourlyForecast(location),
      this.getDailyForecast(location),
    ]);
    return [...hourly, ...daily];
  }

  async getHourlyForecast(location: GeoPoint): Promise<HourlyWeatherForecast[]> {
    const response = await this.fetchForecast(location);
    const hourly = response.hourly;
    if (!hourly?.time) {
      throw new ServiceUnavailableException("Weather provider returned no hourly data.");
    }

    const length = Math.min(hourly.time.length, 24);
    return Array.from({ length }, (_, index) => {
      const weatherCode = readArrayNumber(hourly.weather_code, index, "hourly.weather_code");
      return {
        kind: "forecast",
        interval: "hourly",
        location: this.responseLocation(response),
        timezone: response.timezone,
        time: new Date(hourly.time?.[index] ?? ""),
        source: this.sourceRef(),
        temperatureCelsius: readArrayNumber(hourly.temperature_2m, index, "hourly.temperature_2m"),
        apparentTemperatureCelsius: readArrayNumber(
          hourly.apparent_temperature,
          index,
          "hourly.apparent_temperature",
        ),
        humidityPercent: readArrayNumber(
          hourly.relative_humidity_2m,
          index,
          "hourly.relative_humidity_2m",
        ),
        precipitationProbabilityPercent: hourly.precipitation_probability?.[index],
        precipitationMm: readArrayNumber(hourly.precipitation, index, "hourly.precipitation"),
        rainMm: readArrayNumber(hourly.rain, index, "hourly.rain"),
        windSpeedKmh: readArrayNumber(hourly.wind_speed_10m, index, "hourly.wind_speed_10m"),
        windGustKmh: hourly.wind_gusts_10m?.[index],
        weatherCode,
        weatherDescription: describeWeatherCode(weatherCode),
      };
    });
  }

  async getDailyForecast(location: GeoPoint): Promise<DailyWeatherForecast[]> {
    const response = await this.fetchForecast(location);
    const daily = response.daily;
    if (!daily?.time) {
      throw new ServiceUnavailableException("Weather provider returned no daily data.");
    }

    const length = Math.min(daily.time.length, 7);
    return Array.from({ length }, (_, index) => {
      const weatherCode = readArrayNumber(daily.weather_code, index, "daily.weather_code");
      return {
        kind: "forecast",
        interval: "daily",
        location: this.responseLocation(response),
        timezone: response.timezone,
        date: daily.time?.[index] ?? "",
        source: this.sourceRef(),
        temperatureMinCelsius: readArrayNumber(
          daily.temperature_2m_min,
          index,
          "daily.temperature_2m_min",
        ),
        temperatureMaxCelsius: readArrayNumber(
          daily.temperature_2m_max,
          index,
          "daily.temperature_2m_max",
        ),
        apparentTemperatureMinCelsius: daily.apparent_temperature_min?.[index],
        apparentTemperatureMaxCelsius: daily.apparent_temperature_max?.[index],
        precipitationSumMm: readArrayNumber(
          daily.precipitation_sum,
          index,
          "daily.precipitation_sum",
        ),
        precipitationProbabilityMaxPercent: daily.precipitation_probability_max?.[index],
        windSpeedMaxKmh: daily.wind_speed_10m_max?.[index],
        windGustMaxKmh: daily.wind_gusts_10m_max?.[index],
        weatherCode,
        weatherDescription: describeWeatherCode(weatherCode),
      };
    });
  }

  private async fetchForecast(
    location: GeoPoint,
  ): Promise<OpenMeteoForecastResponse> {
    const weatherConfig = this.configService.get("weather", { infer: true });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), weatherConfig.timeoutMs);
    try {
      const url = new URL("/v1/forecast", weatherConfig.openMeteoBaseUrl);
      url.searchParams.set("latitude", String(location.latitude));
      url.searchParams.set("longitude", String(location.longitude));
      url.searchParams.set("current", currentVariables.join(","));
      url.searchParams.set("hourly", hourlyVariables.join(","));
      url.searchParams.set("daily", dailyVariables.join(","));
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("forecast_days", "7");
      url.searchParams.set("temperature_unit", "celsius");
      url.searchParams.set("wind_speed_unit", "kmh");
      url.searchParams.set("precipitation_unit", "mm");
      url.searchParams.set("timeformat", "iso8601");

      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new ServiceUnavailableException(
          `Weather provider request failed with status ${response.status}.`,
        );
      }
      const payload: unknown = await response.json();
      if (!isOpenMeteoForecastResponse(payload)) {
        throw new ServiceUnavailableException("Weather provider returned invalid payload.");
      }
      return payload;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableException("Weather provider request timed out.");
      }
      throw new ServiceUnavailableException("Weather provider is unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private sourceRef(): DataSourceRef {
    return {
      name: "Open-Meteo",
      url: "https://open-meteo.com/",
      fetchedAt: new Date(),
      confidence: "medium",
    };
  }

  private responseLocation(response: OpenMeteoForecastResponse): GeoPoint {
    return {
      latitude: response.latitude,
      longitude: response.longitude,
    };
  }
}

function isOpenMeteoForecastResponse(
  value: unknown,
): value is OpenMeteoForecastResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<OpenMeteoForecastResponse>;
  return (
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    typeof candidate.timezone === "string"
  );
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ServiceUnavailableException(`Weather provider missing ${path}.`);
  }
  return value;
}

function readArrayNumber(
  values: number[] | undefined,
  index: number,
  path: string,
): number {
  return readNumber(values?.[index], `${path}[${index}]`);
}
