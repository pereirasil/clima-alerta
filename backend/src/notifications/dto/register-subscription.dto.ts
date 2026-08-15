import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type { NotificationPlatform } from "../domain/notification.types";

class WebPushKeysDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  p256dh!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  auth!: string;
}

export class WebPushSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  endpoint!: string;

  @IsOptional()
  expirationTime?: number | null;

  @IsObject()
  @ValidateNested()
  @Type(() => WebPushKeysDto)
  keys!: WebPushKeysDto;
}

export class RegisterSubscriptionDto {
  @IsObject()
  @ValidateNested()
  @Type(() => WebPushSubscriptionDto)
  subscription!: WebPushSubscriptionDto;

  @IsOptional()
  @IsIn(["WEB", "ANDROID", "IOS", "UNKNOWN"])
  platform: NotificationPlatform = "WEB";
}
