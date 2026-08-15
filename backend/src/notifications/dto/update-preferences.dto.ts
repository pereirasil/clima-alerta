import { IsBoolean, IsIn, IsNumber, IsOptional, Matches, Max, Min } from "class-validator";
import type { NotificationSeverity } from "../domain/notification.types";

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  weatherNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  officialAlerts?: boolean;

  @IsOptional()
  @IsBoolean()
  earthquakes?: boolean;

  @IsOptional()
  @IsBoolean()
  fires?: boolean;

  @IsOptional()
  @IsBoolean()
  cyclones?: boolean;

  @IsOptional()
  @IsIn(["INFO", "MINOR", "MODERATE", "SEVERE", "EXTREME"])
  minimumSeverity?: NotificationSeverity;

  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @IsOptional()
  @Matches(/^[0-2][0-9]:[0-5][0-9]$/)
  quietHoursStart?: string;

  @IsOptional()
  @Matches(/^[0-2][0-9]:[0-5][0-9]$/)
  quietHoursEnd?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  radiusKm?: number;
}
