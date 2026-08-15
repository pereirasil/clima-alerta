import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { CacheKeyService } from "../../cache/cache-key.service";
import { CacheService } from "../../cache/cache.service";
import type { GeoPoint } from "../domain/location";
import type {
  DailyWeatherForecast,
  HourlyWeatherForecast,
  WeatherObservation,
} from "../domain/weather.types";
import {
  WEATHER_PROVIDER,
  type WeatherProvider,
} from "./weather-provider.interface";
import { weatherCachePolicy } from "./weather-cache-policy";

@Injectable()
export class WeatherService {
  constructor(
    @Inject(WEATHER_PROVIDER) private readonly provider: WeatherProvider,
    private readonly cacheService: CacheService,
    private readonly cacheKeyService: CacheKeyService,
  ) {}

  async getCurrentWeather(location: GeoPoint): Promise<WeatherObservation> {
    return this.getWithCache(
      this.weatherKey("current", location),
      weatherCachePolicy.ttlSeconds.current,
      isWeatherObservation,
      () => this.provider.getCurrentWeather(location),
    );
  }

  async getHourlyForecast(location: GeoPoint): Promise<HourlyWeatherForecast[]> {
    return this.getWithCache(
      this.weatherKey("hourly", location),
      weatherCachePolicy.ttlSeconds.hourly,
      isHourlyForecastArray,
      () => this.provider.getHourlyForecast(location),
    );
  }

  async getDailyForecast(location: GeoPoint): Promise<DailyWeatherForecast[]> {
    return this.getWithCache(
      this.weatherKey("daily", location),
      weatherCachePolicy.ttlSeconds.daily,
      isDailyForecastArray,
      () => this.provider.getDailyForecast(location),
    );
  }

  private async getWithCache<T>(
    key: string,
    ttlSeconds: number,
    validate: (value: unknown) => value is T,
    load: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.cacheService.get(key, validate);
    if (cached !== null) {
      return cached;
    }

    try {
      const fresh = await load();
      await this.cacheService.set(key, fresh, ttlSeconds);
      return fresh;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException("Weather provider is unavailable.");
    }
  }

  private weatherKey(type: "current" | "hourly" | "daily", location: GeoPoint): string {
    const normalizedLatitude = roundCoordinate(location.latitude);
    const normalizedLongitude = roundCoordinate(location.longitude);
    return this.cacheKeyService.custom(
      "weather",
      type,
      normalizedLatitude.toFixed(weatherCachePolicy.coordinatePrecision),
      normalizedLongitude.toFixed(weatherCachePolicy.coordinatePrecision),
    );
  }
}

function roundCoordinate(value: number): number {
  const factor = 10 ** weatherCachePolicy.coordinatePrecision;
  return Math.round(value * factor) / factor;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWeatherObservation(value: unknown): value is WeatherObservation {
  return isRecord(value) && value.kind === "observation";
}

function isHourlyForecastArray(value: unknown): value is HourlyWeatherForecast[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && item.interval === "hourly");
}

function isDailyForecastArray(value: unknown): value is DailyWeatherForecast[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && item.interval === "daily");
}
