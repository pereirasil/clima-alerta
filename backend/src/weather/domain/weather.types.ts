import type { GeoPoint } from "./location";

export type WeatherDataKind = "observation" | "forecast";
export type WeatherProviderCode = "open-meteo" | "none";

export interface DataSourceRef {
  name: string;
  url?: string;
  fetchedAt: Date;
  confidence?: "low" | "medium" | "high";
}

export interface WeatherObservation {
  kind: "observation";
  location: GeoPoint;
  timezone: string;
  observedAt: Date;
  source: DataSourceRef;
  temperatureCelsius: number;
  apparentTemperatureCelsius: number;
  humidityPercent: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  windGustKmh?: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface HourlyWeatherForecast {
  kind: "forecast";
  interval: "hourly";
  location: GeoPoint;
  timezone: string;
  time: Date;
  source: DataSourceRef;
  temperatureCelsius: number;
  apparentTemperatureCelsius: number;
  humidityPercent: number;
  precipitationProbabilityPercent?: number;
  precipitationMm: number;
  rainMm: number;
  windSpeedKmh: number;
  windGustKmh?: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface DailyWeatherForecast {
  kind: "forecast";
  interval: "daily";
  location: GeoPoint;
  timezone: string;
  date: string;
  source: DataSourceRef;
  temperatureMinCelsius: number;
  temperatureMaxCelsius: number;
  apparentTemperatureMinCelsius?: number;
  apparentTemperatureMaxCelsius?: number;
  precipitationSumMm: number;
  precipitationProbabilityMaxPercent?: number;
  windSpeedMaxKmh?: number;
  windGustMaxKmh?: number;
  weatherCode: number;
  weatherDescription: string;
}

export type WeatherForecast = HourlyWeatherForecast | DailyWeatherForecast;
