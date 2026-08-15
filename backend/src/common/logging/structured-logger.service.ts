import { Injectable, LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig, LogLevel } from "../../config/configuration";

type LogPayload = string | Record<string, unknown>;

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

@Injectable()
export class StructuredLogger implements LoggerService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  log(message: LogPayload, context?: string): void {
    this.write("info", message, context);
  }

  error(message: LogPayload, trace?: string, context?: string): void {
    this.write("error", message, context, trace);
  }

  warn(message: LogPayload, context?: string): void {
    this.write("warn", message, context);
  }

  debug(message: LogPayload, context?: string): void {
    this.write("debug", message, context);
  }

  verbose(message: LogPayload, context?: string): void {
    this.debug(message, context);
  }

  private write(
    level: LogLevel,
    message: LogPayload,
    context?: string,
    trace?: string,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      service: this.configService.get("serviceName", { infer: true }),
      context,
      message,
      trace:
        this.configService.get("nodeEnv", { infer: true }) === "production"
          ? undefined
          : trace,
    };

    const line = JSON.stringify(payload);
    if (level === "error") {
      process.stderr.write(`${line}\n`);
      return;
    }
    process.stdout.write(`${line}\n`);
  }

  private shouldLog(level: LogLevel): boolean {
    const configuredLevel = this.configService.get("logLevel", { infer: true });
    return levelWeight[level] >= levelWeight[configuredLevel];
  }
}
