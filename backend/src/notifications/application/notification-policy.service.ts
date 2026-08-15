import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationPolicyService {
  sanitizeDeepLink(value?: string): string {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return "/";
    }
    return value;
  }

  isExpired(expiresAt?: Date | null, now = new Date()): boolean {
    return expiresAt ? expiresAt.getTime() <= now.getTime() : false;
  }

  isInQuietHours(
    start: string,
    end: string,
    now = new Date(),
  ): boolean {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);

    if (startMinutes === endMinutes) {
      return false;
    }
    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

function parseTime(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return 0;
  }
  return hours * 60 + minutes;
}
