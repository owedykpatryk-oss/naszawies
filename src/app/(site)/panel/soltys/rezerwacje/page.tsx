import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DokumentacjaZniszczenRezerwacji } from "@/components/swietlica/dokumentacja-zniszczen-rezerwacji";
import { PrzyciskZakonczRezerwacjeSwietlicy } from "@/components/swietlica/przycisk-zakoncz-rezerwacje-swietlicy";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysRezerwacjeKlient, type WierszRezerwacji } from "./soltys-rezerwacje-klient";

export const metadata: Metadata = {
  title: "Rezerwacje sal",
};

export default async function SoltysRezerwacjePage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/rezerwacje");
  }

  const { data: mojeWsi } = await supabase
    .from("user_village_roles")
    .select("village_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);

  const villageIds = (mojeWsi ?? []).map((m) => m.village_id).filter(Boolean);

  type WpisSali = { id: string; name: string; village_id: string };
  let sale: WpisSali[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase.from("halls").select("id, name, village_id").in("village_id", villageIds);
    sale = (data ?? []) as WpisSali[];
  }

  const hallIds = sale.map((h) => h.id);
  const nazwaSali: Record<string, string> = {};
  for (const h of sale) {
    nazwaSali[h.id] = h.name;
  }

  type RawRez = {
    id: string;
    hall_id: string;
    booked_by: string | null;
    start_at: string;
    end_at: string;
    event_type: string;
    event_title: string | null;
    expected_guests: number;
    has_alcohol: boolean | null;
    contact_phone: string | null;
    created_at: string;
  };

  let surowe: RawRez[] = [];
  if (hallIds.length > 0) {
    const { data } = await supabase
      .from("hall_bookings")
      .select(
        "id, hall_id, booked_by, start_at, end_at, event_type, event_title, expected_guests, has_alcohol, contact_phone, created_at"
      )
      .in("hall_id", hallIds)
      .eq("status", "pending")
      .order("start_at", { ascending: true })
      .limit(80);
    surowe = (data ?? []) as RawRez[];
  }

  const userIds = Array.from(new Set(surowe.map((r) => r.booked_by).filter(Boolean) as string[]));
  const mapaUzytkownikow: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, display_name").in("id", userIds);
    for (const u of users ?? []) {
      mapaUzytkownikow[u.id] = u.display_name;
    }
  }

  const wiersze: WierszRezerwacji[] = surowe.map((r) => ({
    id: r.id,
    hall_id: r.hall_id,
    sala_nazwa: nazwaSali[r.hall_id] ?? "Sala",
    mieszkaniec: r.booked_by ? mapaUzytkownikow[r.booked_by] ?? r.booked_by.slice(0, 8) : "—",
    start_at: r.start_at,
    end_at: r.end_at,
    event_type: r.event_type,
    event_title: r.event_title,
    expected_guests: r.expected_guests,
    has_alcohol: r.has_alcohol,
    contact_phone: r.contact_phone,
    created_at: r.created_at,
  }));

  type RawArchiwum = {
    id: string;
    hall_id: string;
    booked_by: string | null;
    start_at: string;
    end_at: string;
    event_type: string;
    event_title: string | null;
    expected_guests: number;
    status: string;
    damage_documentation_urls: string[] | null;
    completion_notes: string | null;
    was_damaged: boolean | null;
  };

  let archiwum: RawArchiwum[] = [];
  if (hallIds.length > 0) {
    const { data } = await supabase
      .from("hall_bookings")
      .select(
        "id, hall_id, booked_by, start_at, end_at, event_type, event_title, expected_guests, status, damage_documentation_urls, completion_notes, was_damaged"
      )
      .in("hall_id", hallIds)
      .in("status", ["approved", "completed"])
      .order("end_at", { ascending: false })
      .limit(40);
    archiwum = (data ?? []) as RawArchiwum[];
  }

  const userIdsArch = Array.from(new Set(archiwum.map((r) => r.booked_by).filter(Boolean) as string[]));
  const mapaArch: Record<string, string> = { ...mapaUzytkownikow };
  const brakujace = userIdsArch.filter((id) => mapaArch[id] == null);
  if (brakujace.length > 0) {
    const { data: usersA } = await supabase.from("users").select("id, display_name").in("id", brakujace);
    for (const u of usersA ?? []) {
      mapaArch[u.id] = u.display_name;
    }
  }

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Rezerwacje świetlic</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wnioski oczekujące na zatwierdzenie w Twoich sołectwach. Po zatwierdzeniu mieszkaniec zobaczy status przy
        swojej sali.
      </p>

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie masz aktywnej roli sołtysa ani współadministratora.
        </p>
      ) : (
        <>
          <SoltysRezerwacjeKlient wiersze={wiersze} />
          <section className="mt-14">
            <h2 className="font-serif text-xl text-green-950">Zatwierdzone i zakończone — dokumentacja po wydarzeniu</h2>
            <p className="mt-2 text-sm text-stone-600">
              Możesz uzupełniać zdjęcia i uwagi tak jak wynajmujący; wpisy widoczne są w załączniku informacyjnym do
              wynajmu danej sali.
            </p>
            {archiwum.length === 0 ? (
              <p className="mt-4 text-sm text-stone-600">Brak zakończonych lub zatwierdzonych rezerwacji w Twoich salach.</p>
            ) : (
              <ul className="mt-6 space-y-6">
                {archiwum.map((r) => {
                  const urls = Array.isArray(r.damage_documentation_urls) ? r.damage_documentation_urls : [];
                  const statusPl =
                    r.status === "approved" ? "Zatwierdzona" : r.status === "completed" ? "Zakończona" : r.status;
                  return (
                    <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                      <p className="font-medium text-stone-900">{nazwaSali[r.hall_id] ?? "Sala"}</p>
                      <p className="text-xs text-stone-500">
                        {r.booked_by ? mapaArch[r.booked_by] ?? r.booked_by.slice(0, 8) : "—"} · {statusPl}
                      </p>
                      <p className="mt-2 text-sm text-stone-800">
                        {new Date(r.start_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} —{" "}
                        {new Date(r.end_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                      <p className="text-sm text-stone-600">
                        {r.event_type}
                        {r.event_title ? ` — ${r.event_title}` : ""} · {r.expected_guests} os.
                      </p>
                      <PrzyciskZakonczRezerwacjeSwietlicy bookingId={r.id} status={r.status} endAtIso={r.end_at} />
                      <DokumentacjaZniszczenRezerwacji
                        bookingId={r.id}
                        urlsPoczatkowe={urls}
                        completionNotesPoczatkowe={r.completion_notes}
                        wasDamagedPoczatkowe={r.was_damaged}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="mt-10 text-sm text-stone-500">
        <Link href="/panel/soltys/swietlica" className="text-green-800 underline">
          Wyposażenie sal
        </Link>
      </p>
    </main>
  );
}
