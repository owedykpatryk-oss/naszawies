"use client";

/** Krótka instrukcja Web Push na iOS (PWA z ekranu początkowego). */
export function IosPushOnboarding() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const ios = /iPhone|iPad|iPod/i.test(ua);
  const standalone =
    typeof window !== "undefined" &&
    ("standalone" in window.navigator
      ? (window.navigator as Navigator & { standalone?: boolean }).standalone
      : window.matchMedia("(display-mode: standalone)").matches);

  if (!ios) return null;

  return (
    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-stone-800">
      <p className="font-semibold text-sky-950">iPhone / iPad — powiadomienia push</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        <li>W Safari: Udostępnij → <strong>Dodaj do ekranu początkowego</strong>.</li>
        <li>Otwórz aplikację <strong>z ikony</strong> na ekranie głównym (nie z zakładki Safari).</li>
        <li>Wróć tutaj i włącz powiadomienia przyciskiem poniżej.</li>
      </ol>
      {standalone ? (
        <p className="mt-2 text-xs text-emerald-800">Wygląda na to, że uruchamiasz PWA z ikony — możesz włączyć push.</p>
      ) : (
        <p className="mt-2 text-xs text-amber-900">Obecnie prawdopodobnie jesteś w Safari — push na iOS działa po dodaniu do ekranu początkowego.</p>
      )}
    </div>
  );
}
