import { HttpException } from "@nestjs/common";
import { NotificationService } from "./notification.service";

describe("NotificationService", () => {
  const endpoint = {
    id: "endpoint-id",
    anonymousIdentityHash: "identity-hash",
    channel: "WEB_PUSH",
    isActive: true,
  };
  const message = { id: "message-id" };
  const delivery = {
    id: "delivery-id",
    status: "PENDING",
  };

  function createService(redisSetResult: "OK" | null) {
    const queueService = { enqueue: jest.fn().mockResolvedValue(undefined) };
    const logger = { log: jest.fn(), warn: jest.fn() };
    const configService = {
      get: jest.fn((path: string) =>
        path === "notifications.testCooldownSeconds" ? 300 : "",
      ),
    };
    let insertCount = 0;
    const databaseService = {
      db: {
        query: {
          notificationEndpoints: {
            findFirst: jest.fn().mockResolvedValue(endpoint),
          },
        },
        insert: jest.fn(() => {
          insertCount += 1;
          return {
            values: jest.fn(() => ({
              onConflictDoUpdate: jest.fn(() => ({
                returning: jest
                  .fn()
                  .mockResolvedValue(insertCount === 1 ? [message] : [delivery]),
              })),
            })),
          };
        }),
      },
    };
    const redis = { set: jest.fn().mockResolvedValue(redisSetResult) };
    const service = new NotificationService(
      databaseService as never,
      queueService as never,
      configService as never,
      logger as never,
      redis as never,
    );
    return { service, queueService, redis };
  }

  it("applies strong rate limit to test notifications", async () => {
    const { service } = createService(null);
    await expect(service.sendTest("identity-hash")).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  it("creates idempotent delivery and enqueues the test notification", async () => {
    const { service, queueService, redis } = createService("OK");
    await expect(service.sendTest("identity-hash")).resolves.toMatchObject({
      queued: true,
      notificationId: "message-id",
      deliveryId: "delivery-id",
    });
    expect(redis.set).toHaveBeenCalledWith(
      "notifications:test:identity-hash",
      "1",
      "EX",
      300,
      "NX",
    );
    expect(queueService.enqueue).toHaveBeenCalledWith(
      {
        deliveryId: "delivery-id",
        notificationId: "message-id",
        endpointId: "endpoint-id",
      },
      "notification:endpoint-id:message-id:1",
    );
  });
});
