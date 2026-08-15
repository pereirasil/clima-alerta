import "reflect-metadata";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { StructuredLogger } from "./common/logging/structured-logger.service";
import type { AppConfig } from "./config/configuration";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService<AppConfig, true>);
  const logger = app.get(StructuredLogger);

  app.useLogger(logger);
  app.use(helmet());
  app.use(json({ limit: configService.get("payloadLimit", { infer: true }) }));
  app.use(
    urlencoded({
      extended: true,
      limit: configService.get("payloadLimit", { infer: true }),
    }),
  );

  app.enableCors({
    origin: configService.get("corsOrigins", { infer: true }),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  const apiPrefix = configService.get("apiPrefix", { infer: true });
  const apiVersion = configService.get("apiVersion", { infer: true });
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor(logger));

  const openApiConfig = new DocumentBuilder()
    .setTitle("Clima Alerta API")
    .setDescription("API inicial para monitoramento e alertas preventivos.")
    .setVersion("0.1.0")
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs-json",
  });

  const port = configService.get("port", { infer: true });
  await app.listen(port);
  logger.log(
    {
      service: configService.get("serviceName", { infer: true }),
      port,
      apiBasePath: `/${apiPrefix}/${apiVersion}`,
      docsPath: "/api/docs",
    },
    "API started",
  );
}

void bootstrap();
