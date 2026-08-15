import type { PushSubscription } from "web-push";

export type NotificationChannel = "WEB_PUSH" | "EXPO" | "FCM" | "APNS";
export type NotificationPlatform = "WEB" | "ANDROID" | "IOS" | "UNKNOWN";
export type NotificationType =
  | "TEST"
  | "WEATHER_INFO"
  | "OFFICIAL_ALERT"
  | "EARTHQUAKE"
  | "FIRE"
  | "CYCLONE"
  | "SYSTEM";
export type NotificationSeverity =
  | "INFO"
  | "MINOR"
  | "MODERATE"
  | "SEVERE"
  | "EXTREME";
export type DeliveryStatus =
  | "PENDING"
  | "PROCESSING"
  | "DELIVERED"
  | "FAILED"
  | "EXPIRED"
  | "SKIPPED";

export interface OutboundNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  source: string;
  deepLink: string;
  expiresAt?: Date;
}

export interface DeliveryResult {
  provider: string;
  status: "delivered" | "temporary_failure" | "invalid_endpoint";
  providerMessageId?: string;
  errorCode?: string;
}

export interface WebPushSubscriptionRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(
    subscription: PushSubscription,
    notification: OutboundNotification,
  ): Promise<DeliveryResult>;
}
