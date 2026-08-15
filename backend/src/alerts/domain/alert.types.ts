import type { GeoPoint } from "../../weather/domain/location";

export type AlertSeverity = "informational" | "watch" | "danger" | "emergency";
export type AlertStatus = "active" | "expired" | "cancelled";

export interface OfficialAlert {
  id: string;
  eventType: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  sourceName: string;
  issuedAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  status: AlertStatus;
  affectedAreaCentroid?: GeoPoint;
}
