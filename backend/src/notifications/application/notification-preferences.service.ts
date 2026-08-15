import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../../database/database.service";
import { notificationPreferences } from "../../database/schema";
import type { UpdateNotificationPreferencesDto } from "../dto/update-preferences.dto";
import type { NotificationPreferencesResponse } from "../dto/notification-response.dto";

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getOrCreate(
    anonymousIdentityHash: string,
  ): Promise<NotificationPreferencesResponse> {
    const existing = await this.databaseService.db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.anonymousIdentityHash, anonymousIdentityHash),
    });
    if (existing) {
      return mapPreferences(existing);
    }

    const [created] = await this.databaseService.db
      .insert(notificationPreferences)
      .values({ anonymousIdentityHash })
      .returning();
    return mapPreferences(created);
  }

  async update(
    anonymousIdentityHash: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponse> {
    await this.getOrCreate(anonymousIdentityHash);
    const [updated] = await this.databaseService.db
      .update(notificationPreferences)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(notificationPreferences.anonymousIdentityHash, anonymousIdentityHash))
      .returning();
    return mapPreferences(updated);
  }
}

function mapPreferences(
  row: typeof notificationPreferences.$inferSelect,
): NotificationPreferencesResponse {
  return {
    notificationsEnabled: row.notificationsEnabled,
    weatherNotifications: row.weatherNotifications,
    officialAlerts: row.officialAlerts,
    earthquakes: row.earthquakes,
    fires: row.fires,
    cyclones: row.cyclones,
    minimumSeverity: row.minimumSeverity,
    quietHoursEnabled: row.quietHoursEnabled,
    quietHoursStart: row.quietHoursStart,
    quietHoursEnd: row.quietHoursEnd,
    radiusKm: row.radiusKm,
  };
}
