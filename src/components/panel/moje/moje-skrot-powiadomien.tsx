import Link from "next/link";
import type { SkrotPowiadomienia } from "@/lib/panel/pobierz-ostatnie-powiadomienia";

export function MojeSkrotPowiadomien({ wpisy }: { wpisy: SkrotPowiadomienia[] }) {
  if (wpisy.length === 0) return null;

  const nieprzeczytane = wpisy.filter((w) => !w.is_read).length;

  return (
    <section className="mt-8 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-serif text-xl text-green-950">Powiadomienia</h2>
        <Link href="/panel/powiadomienia" className="text-sm font-medium text-green-800 underline">
          Cała skrzynka →
        </Link>
      </div>
      {nieprzeczytane > 0 ? (
        <p className="mt-1 text-sm text-emerald-900">
          <strong>{nieprzeczytane}</strong> nieprzeczytanych w ostatnich wpisach poniżej.
        </p>
      ) : (
        <p className="mt-1 text-sm text-stone-600">Ostatnie wiadomości z portalu.</p>
      )}
      <ul className="mt-4 space-y-2">
        {wpisy.map((w) => {
          const tresc = (
            <>
              <p className={`text-sm font-medium ${w.is_read ? "text-stone-700" : "text-green-950"}`}>{w.title}</p>
              {w.body ? <p className="mt-0.5 line-clamp-2 text-xs text-stone-600">{w.body}</p> : null}
              <p className="mt-1 text-[10px] text-stone-500">
                {new Date(w.created_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                {!w.is_read ? " · nowe" : ""}
              </p>
            </>
          );
          return (
            <li key={w.id}>
              {w.link_url ? (
                <Link
                  href={w.link_url}
                  className={`karta-wow block rounded-xl border px-4 py-3 shadow-sm ${
                    w.is_read ? "border-stone-200 bg-stone-50/50" : "border-emerald-200 bg-emerald-50/40"
                  }`}
                >
                  {tresc}
                </Link>
              ) : (
                <div
                  className={`rounded-xl border px-4 py-3 ${
                    w.is_read ? "border-stone-200 bg-stone-50/50" : "border-emerald-200 bg-emerald-50/40"
                  }`}
                >
                  {tresc}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
