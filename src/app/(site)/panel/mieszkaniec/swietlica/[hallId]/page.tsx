import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { PlanSaliRysunek } from "@/components/swietlica/plan-sali-rysunek";
import { parsujPlanZJsonb } from "@/lib/swietlica/plan-sali";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { DokumentacjaZniszczenRezerwacji } from "@/components/swietlica/dokumentacja-zniszczen-rezerwacji";
import {
  KalendarzZajetosciDlaHaliSekcja,
  pobierzKalendarzZajetosciDlaHali,
} from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import { RezerwacjaSwietlicyFormularz } from "./rezerwacja-swietlicy-formularz";

type PozycjaWyposazenia = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  quantity: number;
  quantity_available: number | null;
  condition: string | null;
  image_url: string | null;
};

type Props = { params: { hallId: string } };

export const metadata: Metadata = {
  title: "Sala — świetlica",
};

export default async function MieszkaniecSwietlicaHallPage({ params }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) {
    notFound();
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/logowanie?next=/panel/mieszkaniec/swietlica/${hallId}`);
  }

  const { data: sala, error: salaErr } = await supabase
    .from("halls")
    .select("id, name, description, address, max_capacity, village_id, layout_data, villages(name, playground_rules_text)")
    .eq("id", hallId)
    .maybeSingle();

  if (salaErr || !sala) {
    notFound();
  }

  const wies = pojedynczaWies<{ name: string; playground_rules_text: string | null }>(sala.villages);
  const regulaminPlacu = wies?.playground_rules_text?.trim() ?? "";

  const { data: inv } = await supabase
    .from("hall_inventory")
    .select("id, category, name, description, quantity, quantity_available, condition, image_url")
    .eq("hall_id", hallId)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  const pozycje = (inv ?? []) as PozycjaWyposazenia[];

  type WpisRezerwacji = {
    id: string;
    start_at: string;
    end_at: string;
    event_type: string;
    event_title: string | null;
    expected_guests: number;
    status: string;
    created_at: string;
    rejection_reason: string | null;
    damage_documentation_urls: string[] | null;
    completion_notes: string | null;
    was_damaged: boolean | null;
  };
  const { data: mojeRezerwacje } = await supabase
    .from("hall_bookings")
    .select(
      "id, start_at, end_at, event_type, event_title, expected_guests, status, created_at, rejection_reason, damage_documentation_urls, completion_notes, was_damaged"
    )
    .eq("hall_id", hallId)
    .eq("booked_by", user.id)
    .order("start_at", { ascending: false })
    .limit(15);
  const rezerwacje = (mojeRezerwacje ?? []) as WpisRezerwacji[];
  const plan = parsujPlanZJsonb(sala.layout_data);
  const zajeteTerminy = await pobierzKalendarzZajetosciDlaHali(supabase, hallId);

  function dostepne(p: PozycjaWyposazenia) {
    return p.quantity_available ?? p.quantity;
  }

  const statusRezerwacji: Record<string, string> = {
    pending: "Oczekuje na sołtysa",
    approved: "Zatwierdzona",
    rejected: "Odrzucona",
    cancelled: "Anulowana",
    completed: "Zakończona",
  };

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec/swietlica" className="text-green-800 underline">
          ← Lista sal
        </Link>
      </p>
      <NawigacjaSali hallId={hallId} rola="mieszkaniec" />
      <h1 className="font-serif text-3xl text-green-950">{sala.name}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {wies?.name ?? "Wieś"}
        {sala.max_capacity ? ` · do ${sala.max_capacity} osób` : ""}
        {sala.address ? ` · ${sala.address}` : ""}
      </p>
      {sala.description ? (
        <p className="mt-3 text-sm leading-relaxed text-stone-700">{sala.description}</p>
      ) : null}

      {regulaminPlacu ? (
        <section className="mt-10 rounded-2xl border border-green-900/10 bg-[#f7faf5] p-5 shadow-sm">
          <h2 className="font-serif text-xl text-green-950">Regulamin placu zabaw (sołectwo)</h2>
          <p className="mt-1 text-xs text-stone-500">Wspólna treść dla wsi {wies?.name ?? ""} — ustalana przez sołtysa.</p>
          <div className="mt-4 whitespace-pre-wrap rounded-lg border border-stone-200 bg-white p-4 text-sm leading-relaxed text-stone-800">
            {regulaminPlacu}
          </div>
        </section>
      ) : null}

      <KalendarzZajetosciDlaHaliSekcja
        wiersze={zajeteTerminy}
        naglowekDod={
          <p>
            Dla wszystkich bez roli sołtysa: tylko to, czy przedział jest zajęty (w tym czeka na sołtysa), bez
            wynajmującego. Imię i dane widać tylko w panelu sołtysa; w sekcji „Moje rezerwacje” widać wyłącznie
            własne zgłoszenia.
          </p>
        }
        pustyKomunikat="Brak wstępnych ani zatwierdzonych rezerwacji w kalendarzu (w tym widoku). Gdy będą, zobaczysz tylko przedział czasowy, bez cudzego imienia."
      />

      {plan.elementy.length > 0 ? (
        <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl text-green-950">Układ stołów (plan sali)</h2>
          <p className="mt-1 text-sm text-stone-600">
            Schemat przygotowany przez sołtysa. Wymiary sali w planie:{" "}
            {plan.szerokosc_sali_m != null && plan.dlugosc_sali_m != null
              ? `${plan.szerokosc_sali_m} × ${plan.dlugosc_sali_m} m`
              : "nie podano w systemie"}
            .
          </p>
          <div className="mt-4 max-w-xl rounded-lg border border-stone-100 bg-[#faf8f3] p-4">
            <PlanSaliRysunek plan={plan} className="h-56 w-full" />
          </div>
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border border-green-900/10 bg-[#f5f1e8]/40 p-5 sm:p-6">
        <h2 className="font-serif text-xl text-green-950">Wniosek o rezerwację</h2>
        <p className="mt-1 text-sm text-stone-600">
          Po wysłaniu sołtys dostanie prośbę w panelu „Rezerwacje sal”. Dopóki status to „oczekujący”, termin nie jest
          potwierdzony.
        </p>
        <RezerwacjaSwietlicyFormularz hallId={hallId} maxGosci={sala.max_capacity} />
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Moje rezerwacje tej sali</h2>
        {rezerwacje.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Brak zgłoszeń z Twojego konta.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {rezerwacje.map((b) => {
              const urlsZniszczen = Array.isArray(b.damage_documentation_urls)
                ? b.damage_documentation_urls
                : [];
              const pokazDokumentacje = b.status === "approved" || b.status === "completed";
              const terminMinel =
                b.status === "approved" && !Number.isNaN(new Date(b.end_at).getTime())
                  ? new Date(b.end_at).getTime() <= Date.now()
                  : false;
              return (
                <li key={b.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2">
                  <span className="font-medium text-stone-900">
                    {statusRezerwacji[b.status] ?? b.status}
                  </span>
                  {" · "}
                  {new Date(b.start_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} —{" "}
                  {new Date(b.end_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                  {" · "}
                  {b.event_type}
                  {b.event_title ? ` (${b.event_title})` : ""} · {b.expected_guests} os.
                  {b.rejection_reason ? (
                    <span className="mt-1 block text-red-800">Powód odrzucenia: {b.rejection_reason}</span>
                  ) : null}
                  {terminMinel ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Termin minął — sołtys może w panelu „Rezerwacje sal” oznaczyć wpis jako zakończony; Ty nadal możesz
                      uzupełniać dokumentację i uwagi.
                    </p>
                  ) : null}
                  {pokazDokumentacje ? (
                    <DokumentacjaZniszczenRezerwacji
                      bookingId={b.id}
                      urlsPoczatkowe={urlsZniszczen}
                      completionNotesPoczatkowe={b.completion_notes}
                      wasDamagedPoczatkowe={b.was_damaged}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Co jest w świetlicy (asortyment)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Lista prowadzona przez sołtysa — przy składaniu rezerwacji dopasujesz sprzęt w formularzu (pole wyposażenia /
          uwagi).
        </p>
        {pozycje.length === 0 ? (
          <p className="mt-4 text-sm text-stone-600">Brak wpisów w katalogu wyposażenia.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {pozycje.map((p) => (
              <li
                key={p.id}
                className="flex gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
              >
                {p.image_url ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-500">
                    {p.category} · stan: {p.condition ?? "—"} · łącznie: {p.quantity}, wolne: {dostepne(p)}
                  </p>
                  {p.description ? (
                    <p className="mt-2 text-sm text-stone-600">{p.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
