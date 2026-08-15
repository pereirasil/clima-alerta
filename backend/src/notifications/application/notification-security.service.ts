import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../config/configuration";

@Injectable()
export class NotificationSecurityService {
  private readonly encryptionKey: Buffer;
  private readonly hashSalt: string;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const notifications = this.configService.get("notifications", { infer: true });
    this.encryptionKey = createHash("sha256")
      .update(
        notifications.encryptionKey ||
          notifications.vapidPrivateKey ||
          "clima-alerta-development-notification-key",
      )
      .digest();
    this.hashSalt =
      notifications.hashSalt ||
      notifications.vapidPrivateKey ||
      "clima-alerta-development-notification-salt";
  }

  hash(value: string): string {
    return createHash("sha256")
      .update(this.hashSalt)
      .update(":")
      .update(value)
      .digest("hex");
  }

  encryptJson(value: unknown): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(value), "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
  }

  decryptJson<T>(value: string): T {
    const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
    if (!ivRaw || !tagRaw || !encryptedRaw) {
      throw new Error("Invalid encrypted notification payload.");
    }
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.encryptionKey,
      Buffer.from(ivRaw, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedRaw, "base64url")),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  }
}
