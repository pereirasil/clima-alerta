import { NotificationPolicyService } from "./notification-policy.service";

describe("NotificationPolicyService", () => {
  const service = new NotificationPolicyService();

  it("sanitizes external or protocol-relative deep links", () => {
    expect(service.sanitizeDeepLink("https://evil.example")).toBe("/");
    expect(service.sanitizeDeepLink("//evil.example")).toBe("/");
    expect(service.sanitizeDeepLink("/")).toBe("/");
    expect(service.sanitizeDeepLink("/alerts/123")).toBe("/alerts/123");
  });

  it("detects quiet hours crossing midnight", () => {
    expect(
      service.isInQuietHours("22:00", "07:00", new Date("2026-08-15T02:00:00")),
    ).toBe(true);
    expect(
      service.isInQuietHours("22:00", "07:00", new Date("2026-08-15T12:00:00")),
    ).toBe(false);
  });

  it("detects expired notifications", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    expect(service.isExpired(new Date("2026-08-15T11:59:00Z"), now)).toBe(true);
    expect(service.isExpired(new Date("2026-08-15T12:01:00Z"), now)).toBe(false);
    expect(service.isExpired(null, now)).toBe(false);
  });
});
