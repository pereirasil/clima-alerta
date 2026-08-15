import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as webPush from "web-push";
import { type PushSubscription, type WebPushError } from "web-push";
import type { AppConfig } from "../../../config/configuration";
import type {
  DeliveryResult,
  NotificationProvider,
  OutboundNotification,
} from "../../domain/notification.types";

@Injectable()
export class WebPushNotificationProvider implements NotificationProvider {
  readonly channel = "WEB_PUSH" as const;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const notifications = this.configService.get("notifications", { infer: true });
    if (notifications.vapidPublicKey && notifications.vapidPrivateKey) {
      webPush.setVapidDetails(
        notifications.vapidSubject,
        notifications.vapidPublicKey,
        notifications.vapidPrivateKey,
      );
    }
  }

  async send(
    subscription: PushSubscription,
    notification: OutboundNotification,
  ): Promise<DeliveryResult> {
    const notifications = this.configService.get("notifications", { infer: true });
    if (!notifications.vapidPublicKey || !notifications.vapidPrivateKey) {
      throw new ServiceUnavailableException("Web Push VAPID is not configured.");
    }

    const payload = JSON.stringify({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      severity: notification.severity,
      deepLink: notification.deepLink,
    });

    try {
      const response = await webPush.sendNotification(subscription, payload, {
        TTL: 3600,
        urgency: notification.severity === "INFO" ? "normal" : "high",
      });
      return {
        provider: "web-push",
        status: "delivered",
        providerMessageId: response.headers.location,
      };
    } catch (error) {
      const webPushError = error as Partial<WebPushError>;
      if (webPushError.statusCode === 404 || webPushError.statusCode === 410) {
        return {
          provider: "web-push",
          status: "invalid_endpoint",
          errorCode: String(webPushError.statusCode),
        };
      }
      return {
        provider: "web-push",
        status: "temporary_failure",
        errorCode:
          typeof webPushError.statusCode === "number"
            ? String(webPushError.statusCode)
            : "WEB_PUSH_UNAVAILABLE",
      };
    }
  }
}
