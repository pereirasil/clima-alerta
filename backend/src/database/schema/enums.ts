import { pgEnum } from "drizzle-orm/pg-core";

export const dataSourceTypeEnum = pgEnum("data_source_type", [
  "WEATHER",
  "OFFICIAL_ALERT",
  "EARTHQUAKE",
  "FIRE",
  "AIR_QUALITY",
  "OTHER",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "INFO",
  "MINOR",
  "MODERATE",
  "SEVERE",
  "EXTREME",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "EARTHQUAKE",
  "CYCLONE",
  "FLOOD",
  "FIRE",
  "VOLCANO",
  "TSUNAMI",
  "OTHER",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "OBSERVED",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "WEB_PUSH",
  "EXPO",
  "FCM",
  "APNS",
]);

export const notificationPlatformEnum = pgEnum("notification_platform", [
  "WEB",
  "ANDROID",
  "IOS",
  "UNKNOWN",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "TEST",
  "WEATHER_INFO",
  "OFFICIAL_ALERT",
  "EARTHQUAKE",
  "FIRE",
  "CYCLONE",
  "SYSTEM",
]);

export const notificationDeliveryStatusEnum = pgEnum(
  "notification_delivery_status",
  ["PENDING", "PROCESSING", "DELIVERED", "FAILED", "EXPIRED", "SKIPPED"],
);
