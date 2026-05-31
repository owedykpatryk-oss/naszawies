/* global self, clients, caches */
/**
 * Service worker: PWA + Web Push + cache offline (shell + alerty).
 */
const CACHE_SHELL = "naszawies-shell-v3";
const CACHE_ALERTY = "naszawies-alerty-v1";
/** Bez "/" — middleware przekierowuje zalogowanych na /panel (addAll wymaga statusu 200). */
const SHELL_URLS = ["/manifest.webmanifest", "/icon", "/apple-icon", "/api/pwa/icon/192"];

async function zapiszShellDoCache(cache) {
  await Promise.all(
    SHELL_URLS.map((url) =>
      cache.add(url).catch(() => {
        /* pojedynczy zasób może chwilowo niedostępny — nie blokuj instalacji SW */
      }),
    ),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) => zapiszShellDoCache(cache)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_SHELL && k !== CACHE_ALERTY && k.startsWith("naszawies-"))
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/wies/") && url.searchParams.get("offline") === "1") {
    event.respondWith(
      caches.open(CACHE_ALERTY).then((cache) =>
        cache.match(req).then((cached) => cached ?? fetch(req).then((res) => {
          if (res.ok) void cache.put(req, res.clone());
          return res;
        })),
      ),
    );
    return;
  }

  if (req.mode === "navigate" || SHELL_URLS.includes(url.pathname)) {
    event.respondWith(
      fetch(req).catch(() => caches.match("/").then((r) => r ?? caches.match(req))),
    );
  }
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
  const icon = new URL("/icon", self.location.origin).href;

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
