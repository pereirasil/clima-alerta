import { NotificationSecurityService } from "./notification-security.service";

describe("NotificationSecurityService", () => {
  const configService = {
    get: jest.fn(() => ({
      encryptionKey: "test-encryption-secret",
      hashSalt: "test-hash-salt",
      vapidPrivateKey: "",
    })),
  };

  it("encrypts subscription payloads and hashes deterministically", () => {
    const service = new NotificationSecurityService(configService as never);
    const subscription = {
      endpoint: "https://push.example/subscription",
      keys: { p256dh: "public-key", auth: "auth-secret" },
    };

    const encrypted = service.encryptJson(subscription);
    expect(encrypted).not.toContain(subscription.endpoint);
    expect(service.decryptJson(encrypted)).toEqual(subscription);
    expect(service.hash(subscription.endpoint)).toBe(service.hash(subscription.endpoint));
  });
});
