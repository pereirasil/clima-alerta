import type { NotificationSeverity } from "../domain/notification.types";

export interface NotificationPreferencesResponse {
  notificationsEnabled: boolean;
  weatherNotifications: boolean;
  officialAlerts: boolean;
  earthquakes: boolean;
  fires: boolean;
  cyclones: boolean;
  minimumSeverity: NotificationSeverity;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  radiusKm: number;
}

export interface SubscriptionResponse {
  id: string;
  channel: "WEB_PUSH";
  platform: string;
  isActive: boolean;
  createdAt: Date;
  lastSeenAt: Date;
}

export interface VapidPublicKeyResponse {
  publicKey: string;
}
