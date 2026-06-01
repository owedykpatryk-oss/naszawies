import Link from "next/link";
import type { WydarzenieSportowePubliczne } from "@/lib/wies/pobierz-terminarz-sportu-wsi";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

type Props = {
  wydarzenie: WydarzenieSportowePubliczne;
  sciezkaProfilu: string;
};

export function NastepnyWydarzenieSportBaner({ wydarzenie, sciezkaProfilu }: Props) {
  const start = new Date(wydarzenie.starts_at);
  const zaDni = Math.ceil((start.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <Link
      href={`${sciezkaProfilu}/wydarzenia/${wydarzenie.id}`}
      className="mt-4 block rounded-xl border border-emerald-400/70 bg-gradient-to-r from-emerald-100/90 to-white p-4 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
        {wydarzenie.event_kind === "mecz" ? "Następny mecz" : "Najbliższe wydarzenie"}
        {zaDni >= 0 && zaDni <= 14 ? ` · za ${zaDni === 0 ? "dziś" : zaDni === 1 ? "1 dzień" : `${zaDni} dni`}` : ""}
      </p>
      <p className="mt-1 font-serif text-lg text-green-950">{wydarzenie.title}</p>
      <p className="mt-1 text-sm text-stone-700">
        {etykietaRodzajuWydarzenia(wydarzenie.event_kind)} ·{" "}
        {start.toLocaleString("pl-PL", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
        {wydarzenie.location_text ? ` · ${wydarzenie.location_text}` : ""}
        {wydarzenie.nazwa_grupy ? ` · ${wydarzenie.nazwa_grupy}` : ""}
      </p>
    </Link>
  );
}
