import "reflect-metadata";
import { plainToInstance, Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from "class-validator";

class EnvironmentVariables {
  @IsIn(["development", "test", "production"])
  NODE_ENV = "development";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9-]*$/)
  API_PREFIX = "api";

  @IsString()
  @IsNotEmpty()
  @Matches(/^v[0-9]+$/)
  API_VERSION = "v1";

  @IsIn(["debug", "info", "warn", "error"])
  LOG_LEVEL = "info";

  @IsString()
  @IsNotEmpty()
  CORS_ORIGINS = "http://localhost:3000";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1000)
  @Max(3600000)
  RATE_LIMIT_TTL_MS = 60000;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(10000)
  RATE_LIMIT_LIMIT = 120;

  @IsString()
  @IsNotEmpty()
  PAYLOAD_LIMIT = "1mb";

  @IsString()
  DATABASE_URL = "";

  @IsString()
  @IsNotEmpty()
  DATABASE_HOST = "localhost";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  DATABASE_PORT = 5432;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME = "clima_alerta";

  @IsString()
  @IsNotEmpty()
  DATABASE_USER = "clima_alerta";

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD = "clima_alerta_dev_password";

  @IsIn(["true", "false", true, false])
  DATABASE_SSL: string | boolean = "false";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(500)
  @Max(30000)
  DATABASE_CONNECTION_TIMEOUT_MS = 3000;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(500)
  @Max(30000)
  DATABASE_QUERY_TIMEOUT_MS = 3000;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST = "localhost";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT = 6379;

  @IsString()
  REDIS_PASSWORD = "";

  @IsString()
  REDIS_URL = "";

  @IsIn(["true", "false", true, false])
  REDIS_TLS: string | boolean = "false";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  @Max(15)
  REDIS_DB = 0;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9:-]+$/)
  REDIS_KEY_PREFIX = "clima-alerta";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(500)
  @Max(30000)
  REDIS_CONNECT_TIMEOUT_MS = 3000;

  @IsIn(["open-meteo", "none"])
  WEATHER_PROVIDER = "open-meteo";

  @IsString()
  @IsNotEmpty()
  OPEN_METEO_BASE_URL = "https://api.open-meteo.com";

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1000)
  @Max(30000)
  WEATHER_PROVIDER_TIMEOUT_MS = 5000;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    validationError: {
      target: false,
      value: false,
    },
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    throw new Error(`Invalid backend environment: ${messages.join("; ")}`);
  }

  return validatedConfig;
}
