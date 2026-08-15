import { Module } from "@nestjs/common";
import { OFFICIAL_ALERT_PROVIDER } from "./application/official-alert-provider.interface";
import { NoopOfficialAlertProvider } from "./infrastructure/providers/noop-official-alert.provider";

@Module({
  providers: [
    {
      provide: OFFICIAL_ALERT_PROVIDER,
      useClass: NoopOfficialAlertProvider,
    },
  ],
  exports: [OFFICIAL_ALERT_PROVIDER],
})
export class AlertsModule {}
