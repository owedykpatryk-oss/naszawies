import Link from "next/link";
import { redirect } from "next/navigation";
import {
  etykietaRodzajuWydarzenia,
  etykietaSekcjiOrganizacji,
  pobierzMojeOrganizacje,
} from "@/lib/panel/pobierz-moje-organizacje";
import { pobierzMojePowiazania } from "@/lib/panel/pobierz-moje-powiazania";

export const metadata = { title: "Parafia / KGW / OSP — Moje" };

const KOLEJNOSC = ["parafia", "kgw", "lowiectwo", "osp", "sport"] as const;

export default async function MojeOrganizacjePage() {
  const dane = await pobierzMojePowiazania();
  if (!dane) {
    redirect("/logowanie?next=/panel/moje/organizacje");
  }

  const { organizacje, wydarzenia } = await pobierzMojeOrganizacje(dane.villageIdsFeed);
  const maTresc = organizacje.length > 0 || wydarzenia.length > 0;

  return (
    <main>
      <h1 className="font-serif text-2xl text-green-950">Parafia, KGW, OSP</h1>
      <p className="mt-2 max-w-prose text-sm text-stone-600">
        Organizacje i zbliżające się wydarzenia ze wszystkich Twoich miejscowości — gdy sołtysi uzupełnią profile, ten
        widok będzie coraz pełniejszy.
      </p>

      {!maTresc ? (
        <section className="mt-8 rounded-2xl border border-dashed border-violet-300/80 bg-violet-50/30 px-5 py-8 text-center">
          <p className="font-medium text-violet-950">Jeszcze brak treści organizacji</p>
          <p className="mt-2 text-sm text-stone-600">
            Sołtysi mogą dodać koła (KGW, OSP, parafia, sport) w module społeczności. Obserwuj wsie lub gminy, aby widzieć
            je tutaj, gdy się pojawią.
          </p>
          <Link href="/panel/moje/wies" className="mt-4 inline-flex text-sm font-medium text-green-800 underline">
            Moje wsie →
          </Link>
        </section>
      ) : (
        <>
          {KOLEJNOSC.map((typ) => {
            const lista = organizacje.filter((o) => o.group_type === typ);
            if (lista.length === 0) return null;
            return (
              <section key={typ} className="mt-8">
                <h2 className="font-serif text-lg text-green-950">{etykietaSekcjiOrganizacji(typ)}</h2>
                <ul className="mt-4 space-y-3">
                  {lista.map((o) => (
                    <li key={o.id} className="karta-wow rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                      <p className="text-xs text-stone-500">{o.nazwaWsi}</p>
                      <p className="mt-1 font-medium text-stone-900">{o.name}</p>
                      {o.short_description ? <p className="mt-1 text-sm text-stone-600">{o.short_description}</p> : null}
                      {o.group_type === "parafia" && o.mszeSkrot ? (
                        <p className="mt-2 text-xs text-violet-900">
                          <span className="font-medium">Msze:</span> {o.mszeSkrot}
                        </p>
                      ) : null}
                      {o.group_type === "kgw" && o.zebraniaSkrot ? (
                        <p className="mt-2 text-xs text-rose-900">
                          <span className="font-medium">Zebrania:</span> {o.zebraniaSkrot}
                        </p>
                      ) : null}
                      {o.group_type === "lowiectwo" && o.obszarSkrot ? (
                        <p className="mt-2 text-xs text-emerald-900">
                          <span className="font-medium">Rejon:</span> {o.obszarSkrot}
                          {o.obszarSkrot.length >= 120 ? "…" : ""}
                        </p>
                      ) : null}
                      {(o.group_type === "parafia" || o.group_type === "kgw" || o.group_type === "lowiectwo") &&
                      !o.profilUzupelniony ? (
                        <p className="mt-1 text-xs text-amber-800">Profil w trakcie uzupełniania.</p>
                      ) : null}
                      {(o.contact_phone || o.contact_email) &&
                      (o.group_type === "parafia" || o.group_type === "kgw" || o.group_type === "lowiectwo") ? (
                        <p className="mt-1 text-xs text-stone-500">
                          {o.contact_phone ? <>Tel. {o.contact_phone}</> : null}
                          {o.contact_phone && o.contact_email ? " · " : null}
                          {o.contact_email ? <>{o.contact_email}</> : null}
                        </p>
                      ) : null}
                      <Link href={o.sciezkaProfilu} className="mt-2 inline-block text-xs font-medium text-green-800 underline">
                        {o.group_type === "parafia"
                          ? "Sekcja parafii →"
                          : o.group_type === "kgw"
                            ? "Sekcja KGW →"
                            : o.group_type === "lowiectwo"
                              ? "Sekcja myśliwych →"
                              : "Profil wsi →"}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          {wydarzenia.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-serif text-lg text-green-950">Nadchodzące wydarzenia organizacji</h2>
              <ul className="mt-4 space-y-2">
                {wydarzenia.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={ev.href}
                      className="karta-wow block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <p className="text-xs text-indigo-800">
                        {etykietaRodzajuWydarzenia(ev.event_kind)}
                        {ev.nazwaGrupy ? ` · ${ev.nazwaGrupy}` : ""} · {ev.nazwaWsi}
                      </p>
                      <p className="mt-1 font-medium text-stone-900">{ev.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {new Date(ev.starts_at).toLocaleString("pl-PL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
