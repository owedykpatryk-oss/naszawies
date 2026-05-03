/* global self, clients */
/**
 * Service worker: instalacja PWA + powiadomienia Web Push (payload JSON: title, body, link_url).
 * Rejestracja: / (komponent w layout).
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: event.data ? String(event.data.text()) : "naszawies.pl" };
  }
  const title = payload.title || "naszawies.pl";
  const body = payload.body || "";
  const linkUrl = typeof payload.link_url === "string" ? payload.link_url : "/panel/powiadomienia";
  const icon = new URL("/api/pwa/icon/192", self.location.origin).href;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag: payload.tag || "naszawies-default",
      data: { url: linkUrl },
      lang: "pl",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/panel/powiadomienia";
  const abs = new URL(url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const c of lista) {
        if (c.url.startsWith(self.location.origin) && "focus" in c) {
          return c.focus();
        }
      }
      return self.clients.openWindow ? self.clients.openWindow(abs) : Promise.resolve();
    }),
  );
});
