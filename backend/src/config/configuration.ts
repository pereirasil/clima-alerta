export type NodeEnvironment = "development" | "test" | "production";
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppConfig {
  nodeEnv: NodeEnvironment;
  serviceName: string;
  port: number;
  apiPrefix: string;
  apiVersion: string;
  logLevel: LogLevel;
  corsOrigins: string[];
  rateLimit: {
    ttlMs: number;
    limit: number;
  };
  payloadLimit: string;
  database: {
    url?: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    connectionTimeoutMs: number;
    queryTimeoutMs: number;
  };
  redis: {
    url?: string;
    host: string;
    port: number;
    password?: string;
    tls: boolean;
    db: number;
    keyPrefix: string;
    connectTimeoutMs: number;
  };
  weather: {
    provider: "open-meteo" | "none";
    openMeteoBaseUrl: string;
    timeoutMs: number;
  };
}

function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export default (): AppConfig => ({
  nodeEnv: (process.env.NODE_ENV ?? "development") as NodeEnvironment,
  serviceName: "clima-alerta-api",
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? "api",
  apiVersion: process.env.API_VERSION ?? "v1",
  logLevel: (process.env.LOG_LEVEL ?? "info") as LogLevel,
  corsOrigins: parseCorsOrigins(
    process.env.CORS_ORIGINS ?? "http://localhost:3000",
  ),
  rateLimit: {
    ttlMs: Number(process.env.RATE_LIMIT_TTL_MS ?? 60000),
    limit: Number(process.env.RATE_LIMIT_LIMIT ?? 120),
  },
  payloadLimit: process.env.PAYLOAD_LIMIT ?? "1mb",
  database: {
    url: process.env.DATABASE_URL || undefined,
    host: process.env.DATABASE_HOST ?? "localhost",
    port: Number(process.env.DATABASE_PORT ?? 5432),
    name: process.env.DATABASE_NAME ?? "clima_alerta",
    user: process.env.DATABASE_USER ?? "clima_alerta",
    password: process.env.DATABASE_PASSWORD ?? "clima_alerta_dev_password",
    ssl: process.env.DATABASE_SSL === "true",
    connectionTimeoutMs: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 3000),
    queryTimeoutMs: Number(process.env.DATABASE_QUERY_TIMEOUT_MS ?? 3000),
  },
  redis: {
    url: process.env.REDIS_URL || undefined,
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === "true",
    db: Number(process.env.REDIS_DB ?? 0),
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? "clima-alerta",
    connectTimeoutMs: Number(process.env.REDIS_CONNECT_TIMEOUT_MS ?? 3000),
  },
  weather: {
    provider: (process.env.WEATHER_PROVIDER ?? "open-meteo") as
      | "open-meteo"
      | "none",
    openMeteoBaseUrl:
      process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com",
    timeoutMs: Number(process.env.WEATHER_PROVIDER_TIMEOUT_MS ?? 5000),
  },
});
