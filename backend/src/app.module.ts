import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration, { type AppConfig } from "./config/configuration";
import { validateEnvironment } from "./config/env.validation";
import { LoggingModule } from "./common/logging/logging.module";
import { HealthModule } from "./health/health.module";
import { WeatherModule } from "./weather/weather.module";
import { AlertsModule } from "./alerts/alerts.module";
import { LocationsModule } from "./locations/locations.module";
import { DatabaseModule } from "./database/database.module";
import { CacheModule } from "./cache/cache.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => [
        {
          ttl: configService.get("rateLimit.ttlMs", { infer: true }),
          limit: configService.get("rateLimit.limit", { infer: true }),
        },
      ],
    }),
    LoggingModule,
    HealthModule,
    DatabaseModule,
    CacheModule,
    WeatherModule,
    AlertsModule,
    LocationsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
