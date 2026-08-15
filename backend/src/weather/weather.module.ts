import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CacheModule } from "../cache/cache.module";
import type { AppConfig } from "../config/configuration";
import { WEATHER_PROVIDER } from "./application/weather-provider.interface";
import { WeatherService } from "./application/weather.service";
import { NoopWeatherProvider } from "./infrastructure/providers/noop-weather.provider";
import { OpenMeteoProvider } from "./infrastructure/providers/open-meteo/open-meteo.provider";
import { WeatherController } from "./weather.controller";

@Module({
  imports: [CacheModule],
  controllers: [WeatherController],
  providers: [
    NoopWeatherProvider,
    OpenMeteoProvider,
    {
      provide: WEATHER_PROVIDER,
      inject: [ConfigService, OpenMeteoProvider, NoopWeatherProvider],
      useFactory: (
        configService: ConfigService<AppConfig, true>,
        openMeteoProvider: OpenMeteoProvider,
        noopWeatherProvider: NoopWeatherProvider,
      ) => {
        const weather = configService.get("weather", { infer: true });
        return weather.provider === "open-meteo"
          ? openMeteoProvider
          : noopWeatherProvider;
      },
    },
    WeatherService,
  ],
  exports: [WEATHER_PROVIDER, WeatherService],
})
export class WeatherModule {}
