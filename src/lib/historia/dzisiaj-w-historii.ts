import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

/** Wpis z tym samym dniem i miesiącem co dziś (dowolny rok). */
export function znajdzWpisDzisiajWHistorii(
  wpisy: WpisHistoriiPubliczny[],
  teraz = new Date(),
): WpisHistoriiPubliczny | null {
  const m = teraz.getMonth();
  const d = teraz.getDate();
  for (const w of wpisy) {
    const raw = w.event_date ?? w.created_at;
    const dt = new Date(raw);
    if (dt.getMonth() === m && dt.getDate() === d) {
      return w;
    }
  }
  return null;
}
