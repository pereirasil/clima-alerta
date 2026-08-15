import * as webPush from "web-push";
import { WebPushNotificationProvider } from "./web-push.provider";

describe("WebPushNotificationProvider", () => {
  const configService = {
    get: jest.fn(() => ({
      vapidPublicKey: "public-key",
      vapidPrivateKey: "private-key",
      vapidSubject: "mailto:test@example.com",
    })),
  };

  beforeEach(() => {
    jest.spyOn(webPush, "setVapidDetails").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("marks 410 provider responses as invalid endpoint", async () => {
    jest
      .spyOn(webPush, "sendNotification")
      .mockRejectedValue({ statusCode: 410 });
    const provider = new WebPushNotificationProvider(configService as never);

    await expect(
      provider.send(
        {
          endpoint: "https://push.example/expired",
          keys: { p256dh: "key", auth: "auth" },
        },
        {
          id: "notification-id",
          type: "TEST",
          severity: "INFO",
          title: "Clima Alerta",
          body: "NOTIFICACAO DE TESTE recebida com sucesso.",
          source: "Clima Alerta - teste interno",
          deepLink: "/",
        },
      ),
    ).resolves.toMatchObject({
      status: "invalid_endpoint",
      errorCode: "410",
    });
  });
});
