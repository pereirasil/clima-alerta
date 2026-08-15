import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DatabaseService } from "../../database/database.service";
import { notificationEndpoints, notificationPreferences } from "../../database/schema";
import type { RegisterSubscriptionDto } from "../dto/register-subscription.dto";
import type { SubscriptionResponse } from "../dto/notification-response.dto";
import { NotificationSecurityService } from "./notification-security.service";

@Injectable()
export class NotificationSubscriptionService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly securityService: NotificationSecurityService,
  ) {}

  async register(
    anonymousIdentityHash: string,
    dto: RegisterSubscriptionDto,
    userAgent?: string,
  ): Promise<SubscriptionResponse> {
    const endpointHash = this.securityService.hash(dto.subscription.endpoint);
    const userAgentHash = userAgent ? this.securityService.hash(userAgent) : null;
    const encryptedSubscription = this.securityService.encryptJson(dto.subscription);

    const [row] = await this.databaseService.db
      .insert(notificationEndpoints)
      .values({
        anonymousIdentityHash,
        channel: "WEB_PUSH",
        endpointHash,
        encryptedSubscription,
        platform: dto.platform,
        userAgentHash,
        isActive: true,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [notificationEndpoints.channel, notificationEndpoints.endpointHash],
        set: {
          anonymousIdentityHash,
          encryptedSubscription,
          platform: dto.platform,
          userAgentHash,
          isActive: true,
          updatedAt: new Date(),
          lastSeenAt: new Date(),
          disabledAt: null,
        },
      })
      .returning();

    await this.databaseService.db
      .insert(notificationPreferences)
      .values({
        anonymousIdentityHash,
        notificationsEnabled: true,
      })
      .onConflictDoUpdate({
        target: notificationPreferences.anonymousIdentityHash,
        set: {
          notificationsEnabled: true,
          updatedAt: new Date(),
        },
      });

    return mapSubscription(row);
  }

  async remove(
    anonymousIdentityHash: string,
    endpointId: string,
  ): Promise<{ removed: true }> {
    const existing = await this.databaseService.db.query.notificationEndpoints.findFirst({
      where: and(
        eq(notificationEndpoints.id, endpointId),
        eq(notificationEndpoints.anonymousIdentityHash, anonymousIdentityHash),
      ),
    });
    if (!existing) {
      throw new NotFoundException("Subscription not found.");
    }
    if (existing.anonymousIdentityHash !== anonymousIdentityHash) {
      throw new ForbiddenException("Subscription does not belong to this device.");
    }

    await this.databaseService.db
      .update(notificationEndpoints)
      .set({
        isActive: false,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationEndpoints.id, endpointId));

    return { removed: true };
  }

  async disable(endpointId: string): Promise<void> {
    await this.databaseService.db
      .update(notificationEndpoints)
      .set({
        isActive: false,
        disabledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationEndpoints.id, endpointId));
  }
}

function mapSubscription(
  row: typeof notificationEndpoints.$inferSelect,
): SubscriptionResponse {
  return {
    id: row.id,
    channel: "WEB_PUSH",
    platform: row.platform,
    isActive: row.isActive,
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
  };
}
