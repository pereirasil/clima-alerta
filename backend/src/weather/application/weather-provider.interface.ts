import type { GeoPoint } from "../domain/location";
import type {
  DailyWeatherForecast,
  HourlyWeatherForecast,
  WeatherForecast,
  WeatherObservation,
  WeatherProviderCode,
} from "../domain/weather.types";

export interface WeatherProvider {
  readonly code: WeatherProviderCode;
  getCurrentWeather(location: GeoPoint): Promise<WeatherObservation>;
  getForecast(location: GeoPoint): Promise<WeatherForecast[]>;
  getHourlyForecast(location: GeoPoint): Promise<HourlyWeatherForecast[]>;
  getDailyForecast(location: GeoPoint): Promise<DailyWeatherForecast[]>;
}

export const WEATHER_PROVIDER = Symbol("WEATHER_PROVIDER");
