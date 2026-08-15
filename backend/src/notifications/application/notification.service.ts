import {
  Inject,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { and, eq, sql } from "drizzle-orm";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../../cache/cache.service";
import { StructuredLogger } from "../../common/logging/structured-logger.service";
import type { AppConfig } from "../../config/configuration";
import { DatabaseService } from "../../database/database.service";
import {
  notificationDeliveries,
  notificationEndpoints,
  notificationMessages,
} from "../../database/schema";
import { NotificationQueueService } from "../infrastructure/queue/notification-queue.service";

@Injectable()
export class NotificationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queueService: NotificationQueueService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly logger: StructuredLogger,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  getVapidPublicKey(): { publicKey: string } {
    const publicKey = this.configService.get("notifications.vapidPublicKey", {
      infer: true,
    });
    return { publicKey };
  }

  async sendTest(anonymousIdentityHash: string): Promise<{
    queued: boolean;
    notificationId: string;
    deliveryId: string;
  }> {
    const cooldownSeconds = this.configService.get(
      "notifications.testCooldownSeconds",
      { infer: true },
    );
    const cooldownKey = `notifications:test:${anonymousIdentityHash}`;
    const allowed = await this.redis.set(
      cooldownKey,
      "1",
      "EX",
      cooldownSeconds,
      "NX",
    );
    if (allowed !== "OK") {
      throw new HttpException(
        "Test notification cooldown is active.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const endpoint = await this.databaseService.db.query.notificationEndpoints.findFirst({
      where: and(
        eq(notificationEndpoints.anonymousIdentityHash, anonymousIdentityHash),
        eq(notificationEndpoints.channel, "WEB_PUSH"),
        eq(notificationEndpoints.isActive, true),
      ),
      orderBy: (table, { desc }) => [desc(table.lastSeenAt)],
    });
    if (!endpoint) {
      throw new ServiceUnavailableException("No active notification subscription.");
    }

    const version = new Date().toISOString().slice(0, 10);
    const idempotencyKey = `test:${anonymousIdentityHash}:${endpoint.id}:${version}`;
    const deduplicationKey = `test:${anonymousIdentityHash}:${endpoint.id}`;

    const [message] = await this.databaseService.db
      .insert(notificationMessages)
      .values({
        type: "TEST",
        severity: "INFO",
        title: "Clima Alerta",
        body: "NOTIFICACAO DE TESTE recebida com sucesso.",
        source: "Clima Alerta - teste interno",
        idempotencyKey,
        deduplicationKey,
        version,
        deepLink: "/",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      .onConflictDoUpdate({
        target: notificationMessages.idempotencyKey,
        set: { createdAt: sql`notification_messages.created_at` },
      })
      .returning();

    const deliveryIdempotencyKey = `notification:${endpoint.id}:${message.id}:1`;
    const [delivery] = await this.databaseService.db
      .insert(notificationDeliveries)
      .values({
        notificationId: message.id,
        endpointId: endpoint.id,
        provider: "web-push",
        status: "PENDING",
        idempotencyKey: deliveryIdempotencyKey,
      })
      .onConflictDoUpdate({
        target: notificationDeliveries.idempotencyKey,
        set: { updatedAt: new Date() },
      })
      .returning();

    if (delivery.status !== "DELIVERED") {
      await this.queueService.enqueue(
        {
          deliveryId: delivery.id,
          notificationId: message.id,
          endpointId: endpoint.id,
        },
        deliveryIdempotencyKey,
      );
    }

    this.logger.log(
      { notificationId: message.id, deliveryId: delivery.id },
      "test notification requested",
    );

    return {
      queued: true,
      notificationId: message.id,
      deliveryId: delivery.id,
    };
  }
}
