import { NoopOfficialAlertProvider } from "./noop-official-alert.provider";

describe("NoopOfficialAlertProvider", () => {
  it("returns no active alerts instead of inventing official alerts", async () => {
    const provider = new NoopOfficialAlertProvider();

    await expect(provider.listActiveAlerts()).resolves.toEqual([]);
  });
});
