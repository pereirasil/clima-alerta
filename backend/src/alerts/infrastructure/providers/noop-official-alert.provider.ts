import { Injectable } from "@nestjs/common";
import type { OfficialAlertProvider } from "../../application/official-alert-provider.interface";
import type { OfficialAlert } from "../../domain/alert.types";

@Injectable()
export class NoopOfficialAlertProvider implements OfficialAlertProvider {
  listActiveAlerts(): Promise<OfficialAlert[]> {
    return Promise.resolve([]);
  }
}
