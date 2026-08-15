import { validateEnvironment } from "./env.validation";

describe("validateEnvironment", () => {
  it("accepts a valid backend configuration", () => {
    const result = validateEnvironment({
      NODE_ENV: "test",
      PORT: "4000",
      API_PREFIX: "api",
      API_VERSION: "v1",
      LOG_LEVEL: "info",
      CORS_ORIGINS: "http://localhost:3000",
      RATE_LIMIT_TTL_MS: "60000",
      RATE_LIMIT_LIMIT: "120",
      PAYLOAD_LIMIT: "1mb",
    });

    expect(result.PORT).toBe(4000);
    expect(result.API_VERSION).toBe("v1");
  });

  it("fails clearly when a required value is invalid", () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: "invalid",
        PORT: "99999",
        API_PREFIX: "api",
        API_VERSION: "1",
        LOG_LEVEL: "info",
        CORS_ORIGINS: "http://localhost:3000",
        RATE_LIMIT_TTL_MS: "60000",
        RATE_LIMIT_LIMIT: "120",
        PAYLOAD_LIMIT: "1mb",
      }),
    ).toThrow("Invalid backend environment");
  });
});
