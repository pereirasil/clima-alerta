import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  BadRequestException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationSecurityService } from "./application/notification-security.service";
import { NotificationService } from "./application/notification.service";
import { NotificationPreferencesService } from "./application/notification-preferences.service";
import { NotificationSubscriptionService } from "./application/notification-subscription.service";
import { RegisterSubscriptionDto } from "./dto/register-subscription.dto";
import { UpdateNotificationPreferencesDto } from "./dto/update-preferences.dto";

const anonymousDeviceHeader = "x-anonymous-device-id";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly preferencesService: NotificationPreferencesService,
    private readonly subscriptionService: NotificationSubscriptionService,
    private readonly securityService: NotificationSecurityService,
  ) {}

  @Get("vapid-public-key")
  @ApiOperation({ summary: "Retorna somente a chave publica VAPID para Web Push." })
  getVapidPublicKey(): { publicKey: string } {
    return this.notificationService.getVapidPublicKey();
  }

  @Post("subscriptions")
  @ApiOperation({ summary: "Registra uma subscription Web Push do dispositivo atual." })
  registerSubscription(
    @Headers(anonymousDeviceHeader) anonymousDeviceId: string | undefined,
    @Headers("user-agent") userAgent: string | undefined,
    @Body() dto: RegisterSubscriptionDto,
  ) {
    return this.subscriptionService.register(
      this.identityHash(anonymousDeviceId),
      dto,
      userAgent,
    );
  }

  @Delete("subscriptions/:id")
  @ApiOperation({ summary: "Desativa uma subscription do dispositivo atual." })
  removeSubscription(
    @Headers(anonymousDeviceHeader) anonymousDeviceId: string | undefined,
    @Param("id") id: string,
  ) {
    return this.subscriptionService.remove(this.identityHash(anonymousDeviceId), id);
  }

  @Get("preferences")
  @ApiOperation({ summary: "Retorna preferencias de notificacao do dispositivo atual." })
  getPreferences(@Headers(anonymousDeviceHeader) anonymousDeviceId: string | undefined) {
    return this.preferencesService.getOrCreate(this.identityHash(anonymousDeviceId));
  }

  @Put("preferences")
  @ApiOperation({ summary: "Atualiza preferencias de notificacao do dispositivo atual." })
  updatePreferences(
    @Headers(anonymousDeviceHeader) anonymousDeviceId: string | undefined,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.update(this.identityHash(anonymousDeviceId), dto);
  }

  @Post("test")
  @ApiOperation({ summary: "Enfileira uma NOTIFICACAO DE TESTE com rate limit forte." })
  sendTest(@Headers(anonymousDeviceHeader) anonymousDeviceId: string | undefined) {
    return this.notificationService.sendTest(this.identityHash(anonymousDeviceId));
  }

  private identityHash(anonymousDeviceId?: string): string {
    if (!anonymousDeviceId || anonymousDeviceId.length > 128) {
      throw new BadRequestException("Missing anonymous device identity.");
    }
    return this.securityService.hash(anonymousDeviceId);
  }
}
