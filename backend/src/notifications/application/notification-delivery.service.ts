import { Injectable } from "@nestjs/common";
import { and, eq, lt } from "drizzle-orm";
import type { PushSubscription } from "web-push";
import { DatabaseService } from "../../database/database.service";
import {
  notificationDeliveries,
  notificationEndpoints,
  notificationMessages,
} from "../../database/schema";
import { StructuredLogger } from "../../common/logging/structured-logger.service";
import type { OutboundNotification } from "../domain/notification.types";
import { NotificationSecurityService } from "./notification-security.service";
import { NotificationSubscriptionService } from "./notification-subscription.service";
import { WebPushNotificationProvider } from "../infrastructure/providers/web-push.provider";

export interface NotificationDeliveryJob {
  deliveryId: string;
  notificationId: string;
  endpointId: string;
}

@Injectable()
export class NotificationDeliveryService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly securityService: NotificationSecurityService,
    private readonly subscriptionService: NotificationSubscriptionService,
    private readonly webPushProvider: WebPushNotificationProvider,
    private readonly logger: StructuredLogger,
  ) {}

  async process(job: NotificationDeliveryJob): Promise<void> {
    const delivery = await this.databaseService.db.query.notificationDeliveries.findFirst({
      where: eq(notificationDeliveries.id, job.deliveryId),
    });
    if (!delivery || delivery.status === "DELIVERED" || delivery.status === "SKIPPED") {
      return;
    }

    const message = await this.databaseService.db.query.notificationMessages.findFirst({
      where: eq(notificationMessages.id, job.notificationId),
    });
    const endpoint = await this.databaseService.db.query.notificationEndpoints.findFirst({
      where: and(
        eq(notificationEndpoints.id, job.endpointId),
        eq(notificationEndpoints.isActive, true),
      ),
    });

    if (!message || !endpoint) {
      await this.markSkipped(job.deliveryId, "ENDPOINT_OR_MESSAGE_UNAVAILABLE");
      return;
    }
    if (message.expiresAt && message.expiresAt.getTime() <= Date.now()) {
      await this.markExpired(job.deliveryId);
      return;
    }

    await this.databaseService.db
      .update(notificationDeliveries)
      .set({
        status: "PROCESSING",
        attempts: delivery.attempts + 1,
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, job.deliveryId));

    const subscription = this.securityService.decryptJson<PushSubscription>(
      endpoint.encryptedSubscription,
    );
    const result = await this.webPushProvider.send(subscription, {
      id: message.id,
      type: message.type,
      severity: message.severity,
      title: message.title,
      body: message.body,
      source: message.source,
      deepLink: message.deepLink,
      expiresAt: message.expiresAt ?? undefined,
    } satisfies OutboundNotification);

    if (result.status === "delivered") {
      await this.databaseService.db
        .update(notificationDeliveries)
        .set({
          status: "DELIVERED",
          providerMessageId: result.providerMessageId,
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(notificationDeliveries.id, job.deliveryId));
      this.logger.log(
        { deliveryId: job.deliveryId, endpointId: job.endpointId, provider: result.provider },
        "notification delivered",
      );
      return;
    }

    if (result.status === "invalid_endpoint") {
      await this.subscriptionService.disable(job.endpointId);
      await this.databaseService.db
        .update(notificationDeliveries)
        .set({
          status: "FAILED",
          failedAt: new Date(),
          errorCode: result.errorCode ?? "INVALID_ENDPOINT",
          updatedAt: new Date(),
        })
        .where(eq(notificationDeliveries.id, job.deliveryId));
      this.logger.warn(
        { endpointId: job.endpointId, errorCode: result.errorCode },
        "subscription disabled",
      );
      return;
    }

    await this.databaseService.db
      .update(notificationDeliveries)
      .set({
        status: "FAILED",
        failedAt: new Date(),
        errorCode: result.errorCode ?? "TEMPORARY_PROVIDER_FAILURE",
        updatedAt: new Date(),
      })
      .where(eq(notificationDeliveries.id, job.deliveryId));
    this.logger.warn(
      { deliveryId: job.deliveryId, errorCode: result.errorCode },
      "notification failed",
    );
    throw new Error("Temporary notification provider failure.");
  }

  async pruneOldDeliveries(retentionDays: number): Promise<void> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    await this.databaseService.db
      .delete(notificationDeliveries)
      .where(lt(notificationDeliveries.createdAt, cutoff));
  }

  private async markSkipped(deliveryId: string, errorCode: string): Promise<void> {
    await this.databaseService.db
      .update(notificationDeliveries)
      .set({ status: "SKIPPED", errorCode, updatedAt: new Date() })
      .where(eq(notificationDeliveries.id, deliveryId));
  }

  private async markExpired(deliveryId: string): Promise<void> {
    await this.databaseService.db
      .update(notificationDeliveries)
      .set({ status: "EXPIRED", updatedAt: new Date() })
      .where(eq(notificationDeliveries.id, deliveryId));
  }
}
