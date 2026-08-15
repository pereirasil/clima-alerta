import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { WeatherProvider } from "../../application/weather-provider.interface";
import type { GeoPoint } from "../../domain/location";
import type {
  DailyWeatherForecast,
  HourlyWeatherForecast,
  WeatherForecast,
  WeatherObservation,
} from "../../domain/weather.types";

@Injectable()
export class NoopWeatherProvider implements WeatherProvider {
  readonly code = "none";

  getCurrentWeather(location: GeoPoint): Promise<WeatherObservation> {
    void location;
    return Promise.reject(
      new ServiceUnavailableException(
        "Weather provider is not configured.",
      ),
    );
  }

  getForecast(location: GeoPoint): Promise<WeatherForecast[]> {
    void location;
    return Promise.reject(
      new ServiceUnavailableException(
        "Weather provider is not configured.",
      ),
    );
  }

  getHourlyForecast(location: GeoPoint): Promise<HourlyWeatherForecast[]> {
    void location;
    return Promise.reject(
      new ServiceUnavailableException("Weather provider is not configured."),
    );
  }

  getDailyForecast(location: GeoPoint): Promise<DailyWeatherForecast[]> {
    void location;
    return Promise.reject(
      new ServiceUnavailableException("Weather provider is not configured."),
    );
  }
}
