import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { CacheService } from "../src/cache/cache.service";
import { GlobalExceptionFilter } from "../src/common/filters/global-exception.filter";
import { DatabaseService } from "../src/database/database.service";

type RequestTarget = Parameters<typeof request>[0];

describe("Health API", () => {
  let app: INestApplication;
  let server: RequestTarget;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "4000";
    process.env.API_PREFIX = "api";
    process.env.API_VERSION = "v1";
    process.env.LOG_LEVEL = "error";
    process.env.CORS_ORIGINS = "http://localhost:3000";
    process.env.RATE_LIMIT_TTL_MS = "60000";
    process.env.RATE_LIMIT_LIMIT = "120";
    process.env.PAYLOAD_LIMIT = "1mb";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({ ping: jest.fn().mockResolvedValue("up") })
      .overrideProvider(CacheService)
      .useValue({ ping: jest.fn().mockResolvedValue("up") })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    server = app.getHttpServer() as RequestTarget;
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health", async () => {
    const response = await request(server)
      .get("/api/v1/health")
      .expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "clima-alerta-api",
      services: {
        application: "up",
        database: "up",
        redis: "up",
      },
    });
    expect(response.body).not.toHaveProperty("providers");
  });

  it("GET /api/v1/health/live", async () => {
    const response = await request(server)
      .get("/api/v1/health/live")
      .expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "clima-alerta-api",
    });
    expect(response.body).not.toHaveProperty("services");
  });

  it("standardizes validation errors", async () => {
    const response = await request(server)
      .get("/api/v1/health?includeVersion=maybe")
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: "Bad Request",
      path: "/api/v1/health?includeVersion=maybe",
    });
    expect(response.body).toHaveProperty("timestamp");
  });

  it("standardizes unexpected HTTP errors", async () => {
    const response = await request(server)
      .get("/api/v1/missing")
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: "Not Found",
      path: "/api/v1/missing",
    });
  });
});
