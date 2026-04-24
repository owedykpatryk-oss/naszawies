import Link from "next/link";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WpisPostu = {
  id: string;
  title: string;
  type: string;
  created_at: string;
};

export function WiesProfilPubliczny({
  wies,
  posty,
}: {
  wies: WiesPubliczna;
  posty: WpisPostu[];
}) {
  const sciezka = sciezkaProfiluWsi(wies);
  const prefixOgloszenia = `${sciezka}/ogloszenie`;

  return (
    <article>
      {wies.cover_image_url ? (
        <div className="relative mb-8 aspect-[21/9] max-h-64 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wies.cover_image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <header className="border-b border-stone-200 pb-6">
        <p className="text-sm text-stone-500">
          {wies.voivodeship} · {wies.county} · {wies.commune}
          {wies.is_active ? null : (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
              Profil w przygotowaniu
            </span>
          )}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-green-950">{wies.name}</h1>
        {wies.website ? (
          <p className="mt-3 text-sm">
            <a
              href={wies.website}
              className="text-green-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Strona gminy / sołectwa
            </a>
          </p>
        ) : null}
        {wies.latitude != null && wies.longitude != null ? (
          <p className="mt-2 text-xs text-stone-500">
            Współrzędne: {Number(wies.latitude).toFixed(5)}, {Number(wies.longitude).toFixed(5)} ·{" "}
            <a
              href={`https://www.openstreetmap.org/?mlat=${wies.latitude}&mlon=${wies.longitude}&zoom=14`}
              className="text-green-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Otwórz na mapie
            </a>
          </p>
        ) : null}
      </header>

      {wies.description ? (
        <section className="mt-8">
          <h2 className="font-serif text-xl text-green-950">O miejscowości</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{wies.description}</div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Ogłoszenia i oferty</h2>
        <p className="mt-1 text-sm text-stone-600">
          Na publicznym profilu widać m.in. zatwierdzone oferty typu „targ lokalny”. Pozostałe treści — po zalogowaniu,
          jeśli masz rolę mieszkańca w tej wsi.
        </p>
        {posty.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak publicznych wpisów do wyświetlenia.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {posty.map((p) => (
              <li key={p.id}>
                <Link
                  href={`${prefixOgloszenia}/${p.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
                >
                  <p className="font-medium text-stone-900">{p.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {p.type} · {new Date(p.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
        <p className="font-medium text-stone-900">Świetlica i rezerwacje</p>
        <p className="mt-2">
          Rezerwacja sali odbywa się w{" "}
          <Link href="/logowanie?next=/panel/mieszkaniec/swietlica" className="text-green-800 underline">
            panelu mieszkańca
          </Link>{" "}
          (po akceptacji roli we wsi).
        </p>
        {wies.teryt_id === "0088390" ? (
          <p className="mt-4 border-t border-stone-200 pt-4">
            <Link
              href={`${sciezka}/projekt-swietlicy`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-900"
            >
              Zobacz projekt świetlicy (rzut, elewacje, powierzchnie)
            </Link>
          </p>
        ) : null}
      </section>
    </article>
  );
}
