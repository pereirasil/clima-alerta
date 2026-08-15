export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface DataSourceRef {
  name: string;
  url?: string;
  fetchedAt: string;
  confidence?: "low" | "medium" | "high";
}

export interface WeatherObservation {
  kind: "observation";
  location: GeoPoint;
  timezone: string;
  observedAt: string;
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
  time: string;
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

export interface WeatherBundle {
  current: WeatherObservation;
  hourly: HourlyWeatherForecast[];
  daily: DailyWeatherForecast[];
}

export interface LocationPreset extends GeoPoint {
  label: string;
  detail: string;
}
