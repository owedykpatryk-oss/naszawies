"use client";

import { useCallback, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PowiadomieniaPushKlient() {
  const kluczPubliczny = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? "";
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, ustawCzek] = useState(false);

  const wlaczPush = useCallback(async () => {
    ustawBlad("");
    ustawKomunikat("");
    if (!kluczPubliczny) {
      ustawBlad("Powiadomienia push są chwilowo niedostępne. Spróbuj ponownie później.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      ustawBlad("Ta przeglądarka nie obsługuje Web Push.");
      return;
    }
    ustawCzek(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        ustawBlad("Powiadomienia nie zostały zatwierdzone w przeglądarce.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const kluczBinarny = urlBase64ToUint8Array(kluczPubliczny);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: kluczBinarny as unknown as BufferSource,
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        ustawBlad("Nie udało się odczytać kluczy subskrypcji.");
        return;
      }
      const res = await fetch("/api/powiadomienia-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rodzaj: "zapisz",
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      const d = (await res.json()) as { ok?: boolean; blad?: string };
      if (!res.ok || !d.ok) {
        ustawBlad(d.blad ?? "Zapis subskrypcji nie powiódł się.");
        return;
      }
      ustawKomunikat(
        "Powiadomienia push na tym urządzeniu są włączone. Możesz zamknąć kartę — przy wybranych zdarzeniach dostaniesz alert w pasku powiadomień telefonu.",
      );
    } catch {
      ustawBlad("Błąd rejestracji push — spróbuj ponownie albo użyj innej przeglądarki.");
    } finally {
      ustawCzek(false);
    }
  }, [kluczPubliczny]);

  const wylaczPush = useCallback(async () => {
    ustawBlad("");
    ustawKomunikat("");
    if (!("serviceWorker" in navigator)) return;
    ustawCzek(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        ustawKomunikat("Brak aktywnej subskrypcji na tym urządzeniu.");
        return;
      }
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetch("/api/powiadomienia-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rodzaj: "usun", endpoint }),
      });
      ustawKomunikat("Wyłączono powiadomienia push na tym urządzeniu.");
    } catch {
      ustawBlad("Nie udało się wyrejestrować powiadomień.");
    } finally {
      ustawCzek(false);
    }
  }, []);

  return (
    <section className="mt-8 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm">
      <h2 className="font-serif text-lg text-green-950">Aplikacja na telefonie i powiadomienia</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-700">
        <li>
          <strong>Android / Chrome:</strong> zainstaluj z paska lub baneru „Zainstaluj aplikację”, potem włącz push
          poniżej (wymaga zgody przeglądarki).
        </li>
        <li>
          <strong>iPhone (Safari):</strong> ikona udostępniania →{" "}
          <em className="not-italic font-medium">Dodaj do ekranu początkowego</em> → uruchom naszawies z ikony (nie
          zwykła karta Safari). Web Push na iOS wymaga co najmniej iOS 16.4; po dodaniu do ekranu początkowego włącz
          powiadomienia poniżej — bez tego iOS zwykle nie pokaże pushy z przeglądarki.
        </li>
        {kluczPubliczny ? (
          <li>
            Po włączeniu push możesz dostać alert m.in. przy akceptacji lub odrzuceniu wniosku mieszkańca,
            zatwierdzeniu lub odrzuceniu rezerwacji świetlicy, podsumowaniu wpisów z RSS do moderacji (sołtysi) oraz
            przy decyzji sołtysa o poście. Na skrzynkę e-mail może trafić osobna kopia, jeśli masz ją podaną w koncie.
          </li>
        ) : null}
      </ul>

      {kluczPubliczny ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={czek}
            onClick={() => void wlaczPush()}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
          >
            Włącz powiadomienia push na tym urządzeniu
          </button>
          <button
            type="button"
            disabled={czek}
            onClick={() => void wylaczPush()}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50 disabled:opacity-60"
          >
            Wyłącz na tym urządzeniu
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-600">
          Powiadomienia w aplikacji powyżej działają zawsze. Alerty w przeglądarce na telefonie są opcjonalne — gdy
          portal włączy ten kanał, tutaj pojawią się przyciski włączenia i wyłączenia.
        </p>
      )}

      {komunikat ? <p className="mt-3 text-sm text-green-900">{komunikat}</p> : null}
      {blad ? <p className="mt-3 text-sm text-red-800">{blad}</p> : null}
    </section>
  );
}
