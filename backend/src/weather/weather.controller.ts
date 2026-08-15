import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WeatherService } from "./application/weather.service";
import { WeatherQueryDto } from "./dto/weather-query.dto";
import type {
  DailyWeatherForecast,
  HourlyWeatherForecast,
  WeatherObservation,
} from "./domain/weather.types";

@ApiTags("weather")
@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get("current")
  @ApiOperation({ summary: "Retorna clima atual normalizado por coordenadas." })
  @ApiOkResponse({ description: "Clima atual obtido do provider configurado." })
  getCurrentWeather(
    @Query() query: WeatherQueryDto,
  ): Promise<WeatherObservation> {
    return this.weatherService.getCurrentWeather(query);
  }

  @Get("hourly")
  @ApiOperation({ summary: "Retorna previsao horaria normalizada." })
  @ApiOkResponse({ description: "Previsao horaria do provider configurado." })
  getHourlyForecast(
    @Query() query: WeatherQueryDto,
  ): Promise<HourlyWeatherForecast[]> {
    return this.weatherService.getHourlyForecast(query);
  }

  @Get("daily")
  @ApiOperation({ summary: "Retorna previsao diaria normalizada." })
  @ApiOkResponse({ description: "Previsao diaria do provider configurado." })
  getDailyForecast(
    @Query() query: WeatherQueryDto,
  ): Promise<DailyWeatherForecast[]> {
    return this.weatherService.getDailyForecast(query);
  }
}
