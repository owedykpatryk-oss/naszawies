import Link from "next/link";
import type { AlertWiesPubliczny } from "@/lib/wies/filtruj-pilne-alerty";

export function WiesPilneAlerty({ alerty, sciezkaOgloszenia }: { alerty: AlertWiesPubliczny[]; sciezkaOgloszenia: string }) {
  if (alerty.length === 0) return null;

  return (
    <div
      className="wow-wejscie mb-6 rounded-2xl border-2 border-amber-400/90 bg-gradient-to-br from-amber-50 via-white to-red-50/40 p-4 shadow-md ring-1 ring-amber-300/50 sm:p-5"
      role="region"
      aria-label="Komunikaty pilne"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-amber-950">Ważne teraz</p>
      <ul className="mt-3 space-y-2">
        {alerty.map((a) => (
          <li key={a.id}>
            <Link
              href={`${sciezkaOgloszenia}/${a.id}`}
              className="block rounded-xl border border-amber-200/90 bg-white/95 px-3 py-2.5 text-sm shadow-sm transition hover:border-amber-400 hover:bg-amber-50/80"
            >
              <span className="font-semibold text-amber-950">
                {a.type === "awaria" ? "Awaria / alert" : "Przypięte"}
                {a.is_pinned ? " · przypięte" : ""}
              </span>
              <span className="mt-0.5 block font-medium text-stone-900">{a.title}</span>
              {a.event_end_at ? (
                <span className="mt-1 block text-xs text-stone-600">
                  Ważne do: {new Date(a.event_end_at).toLocaleString("pl-PL")}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
