import type {
  DailyWeatherForecast,
  GeoPoint,
  HourlyWeatherForecast,
  WeatherBundle,
  WeatherObservation,
} from "./weather-types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

export async function fetchWeatherBundle(location: GeoPoint): Promise<WeatherBundle> {
  const [current, hourly, daily] = await Promise.all([
    fetchWeather<WeatherObservation>("current", location),
    fetchWeather<HourlyWeatherForecast[]>("hourly", location),
    fetchWeather<DailyWeatherForecast[]>("daily", location),
  ]);

  return { current, hourly, daily };
}

async function fetchWeather<T>(
  path: "current" | "hourly" | "daily",
  location: GeoPoint,
): Promise<T> {
  const url = new URL(`/api/v1/weather/${path}`, apiBaseUrl);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API de clima indisponivel (${response.status}).`);
  }

  return (await response.json()) as T;
}
