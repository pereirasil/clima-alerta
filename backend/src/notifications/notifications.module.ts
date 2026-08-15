import { Module } from "@nestjs/common";
import { CacheModule } from "../cache/cache.module";
import { DatabaseModule } from "../database/database.module";
import { WebPushNotificationProvider } from "./infrastructure/providers/web-push.provider";
import { NotificationQueueService } from "./infrastructure/queue/notification-queue.service";
import { NotificationDeliveryService } from "./application/notification-delivery.service";
import { NotificationPreferencesService } from "./application/notification-preferences.service";
import { NotificationPolicyService } from "./application/notification-policy.service";
import { NotificationSecurityService } from "./application/notification-security.service";
import { NotificationService } from "./application/notification.service";
import { NotificationSubscriptionService } from "./application/notification-subscription.service";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [CacheModule, DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationSecurityService,
    NotificationPreferencesService,
    NotificationPolicyService,
    NotificationSubscriptionService,
    NotificationService,
    NotificationDeliveryService,
    NotificationQueueService,
    WebPushNotificationProvider,
  ],
  exports: [NotificationQueueService],
})
export class NotificationsModule {}
