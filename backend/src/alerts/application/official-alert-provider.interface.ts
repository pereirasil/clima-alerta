import type { OfficialAlert } from "../domain/alert.types";

export interface OfficialAlertProvider {
  listActiveAlerts(): Promise<OfficialAlert[]>;
}

export const OFFICIAL_ALERT_PROVIDER = Symbol("OFFICIAL_ALERT_PROVIDER");
