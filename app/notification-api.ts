const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

const anonymousDeviceKey = "clima-alerta-anonymous-device-id";

export type BrowserNotificationState =
  | "not-supported"
  | "not-requested"
  | "granted"
  | "denied";

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  weatherNotifications: boolean;
  officialAlerts: boolean;
  earthquakes: boolean;
  fires: boolean;
  cyclones: boolean;
  minimumSeverity: "INFO" | "MINOR" | "MODERATE" | "SEVERE" | "EXTREME";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  radiusKm: number;
}

export interface NotificationSubscription {
  id: string;
  channel: "WEB_PUSH";
  platform: string;
  isActive: boolean;
  createdAt: string;
  lastSeenAt: string;
}

export function getBrowserNotificationState(): BrowserNotificationState {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "not-supported";
  }
  if (Notification.permission === "default") {
    return "not-requested";
  }
  return Notification.permission;
}

export function getAnonymousDeviceId(): string {
  const existing = window.localStorage.getItem(anonymousDeviceKey);
  if (existing) {
    return existing;
  }
  const nextId = crypto.randomUUID();
  window.localStorage.setItem(anonymousDeviceKey, nextId);
  return nextId;
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>("/api/v1/notifications/preferences");
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>("/api/v1/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

export async function subscribeToWebPush(): Promise<NotificationSubscription> {
  const publicKey = await apiFetch<{ publicKey: string }>(
    "/api/v1/notifications/vapid-public-key",
  );
  if (!publicKey.publicKey) {
    throw new Error("Chave publica VAPID nao configurada no backend.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey.publicKey),
    }));

  return apiFetch<NotificationSubscription>("/api/v1/notifications/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      platform: "WEB",
    }),
  });
}

export async function unsubscribeFromWebPush(subscriptionId?: string): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe();

  if (subscriptionId) {
    await apiFetch(`/api/v1/notifications/subscriptions/${subscriptionId}`, {
      method: "DELETE",
    });
  }
  await updateNotificationPreferences({ notificationsEnabled: false });
}

export async function sendTestNotification(): Promise<void> {
  await apiFetch("/api/v1/notifications/test", { method: "POST" });
}

async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Anonymous-Device-Id": getAnonymousDeviceId(),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API de notificacoes indisponivel (${response.status}).`);
  }
  return (await response.json()) as T;
}

function urlBase64ToUint8Array(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0))).buffer;
}
