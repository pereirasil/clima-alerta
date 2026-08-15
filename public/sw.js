self.addEventListener("push", (event) => {
  let payload = {
    title: "Clima Alerta",
    body: "Nova notificacao disponivel.",
    type: "SYSTEM",
    severity: "INFO",
    deepLink: "/",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const safePath =
    typeof payload.deepLink === "string" && payload.deepLink.startsWith("/")
      ? payload.deepLink
      : "/";
  const notificationOptions = {
    body: payload.body,
    icon: "/globe.svg",
    badge: "/globe.svg",
    tag: payload.id || "clima-alerta-notification",
    data: {
      url: safePath,
      notificationId: payload.id,
      type: payload.type,
      severity: payload.severity,
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin);
  if (targetUrl.origin !== self.location.origin) {
    targetUrl.pathname = "/";
    targetUrl.search = "";
    targetUrl.hash = "";
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === targetUrl.origin && "focus" in client) {
          client.navigate(targetUrl.href);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl.href);
    }),
  );
});
