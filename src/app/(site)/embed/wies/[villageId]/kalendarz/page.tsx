import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { KalendarzMiesiacaSwietlicyKlient } from "@/components/swietlica/kalendarz-miesiaca-swietlicy-klient";
import { pobierzKalendarzZajetosciDlaWsi } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

type Props = { params: { villageId: string } };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase.from("villages").select("name").eq("id", params.villageId).maybeSingle();
  return {
    title: data?.name ? `Kalendarz świetlicy — ${data.name}` : "Kalendarz świetlicy",
    robots: { index: false, follow: false },
  };
}

function formatZakres(a: string, b: string) {
  const s = new Date(a).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  const e = new Date(b).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  return `${s} — ${e}`;
}

export default async function EmbedKalendarzWsiPage({ params }: Props) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const [{ data: wies }, wiersze] = await Promise.all([
    supabase.from("villages").select("id, name, is_active").eq("id", id.data).maybeSingle(),
    pobierzKalendarzZajetosciDlaWsi(supabase, id.data),
  ]);

  if (!wies?.is_active) notFound();

  const terminy = wiersze.map((r) => ({ start_at: r.start_at, end_at: r.end_at }));

  return (
    <article className="mx-auto max-w-2xl rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Kalendarz świetlicy</p>
        <h1 className="font-serif text-xl text-green-950">{wies.name}</h1>
        <p className="mt-1 text-xs text-stone-600">Zajęte terminy — bez danych wynajmujących.</p>
      </header>

      <div className="mt-4">
        <KalendarzMiesiacaSwietlicyKlient terminy={terminy} />
      </div>

      {wiersze.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">Brak publicznie widocznych zajętych terminów.</p>
      ) : (
        <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm">
          {wiersze.slice(0, 12).map((r, i) => (
            <li key={`${r.hall_id}-${r.start_at}-${i}`} className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2">
              <p className="text-xs font-medium text-stone-500">{r.hall_name}</p>
              <p className="text-stone-800">{formatZakres(r.start_at, r.end_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
