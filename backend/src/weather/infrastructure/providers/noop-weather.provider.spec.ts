import { ServiceUnavailableException } from "@nestjs/common";
import { NoopWeatherProvider } from "./noop-weather.provider";

describe("NoopWeatherProvider", () => {
  const provider = new NoopWeatherProvider();
  const location = { latitude: -23.5505, longitude: -46.6333 };

  it("does not call external services for current weather when disabled", async () => {
    await expect(provider.getCurrentWeather(location)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("does not call external services for forecast when disabled", async () => {
    await expect(provider.getForecast(location)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it("does not call external services for split forecasts when disabled", async () => {
    await expect(provider.getHourlyForecast(location)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(provider.getDailyForecast(location)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
