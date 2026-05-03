import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DokumentacjaZniszczenRezerwacji } from "@/components/swietlica/dokumentacja-zniszczen-rezerwacji";
import { PrzyciskZakonczRezerwacjeSwietlicy } from "@/components/swietlica/przycisk-zakoncz-rezerwacje-swietlicy";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysRezerwacjeKalendarzEksport } from "./soltys-rezerwacje-kalendarz-eksport";
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

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  type WpisSali = { id: string; name: string; village_id: string; max_capacity: number | null };
  let sale: WpisSali[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("halls")
      .select("id, name, village_id, max_capacity")
      .in("village_id", villageIds);
    sale = (data ?? []) as WpisSali[];
  }

  const hallIds = sale.map((h) => h.id);
  const nazwaSali: Record<string, string> = {};
  const maxPojemnoscSali: Record<string, number | null> = {};
  for (const h of sale) {
    nazwaSali[h.id] = h.name;
    maxPojemnoscSali[h.id] = h.max_capacity ?? null;
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
    requested_inventory:
      | {
          inventoryId?: string;
          quantity?: number;
        }[]
      | null;
    layout_data: { preset?: string } | null;
    created_at: string;
  };

  let surowe: RawRez[] = [];
  if (hallIds.length > 0) {
    const { data } = await supabase
      .from("hall_bookings")
      .select(
        "id, hall_id, booked_by, start_at, end_at, event_type, event_title, expected_guests, has_alcohol, contact_phone, requested_inventory, layout_data, created_at"
      )
      .in("hall_id", hallIds)
      .eq("status", "pending")
      .order("start_at", { ascending: true })
      .limit(80);
    surowe = (data ?? []) as RawRez[];
  }

  const { data: hallInventoryRaw } =
    hallIds.length > 0
      ? await supabase.from("hall_inventory").select("id, hall_id, name, quantity, quantity_available").in("hall_id", hallIds)
      : { data: [] as { id: string; hall_id: string; name: string; quantity: number; quantity_available: number | null }[] };

  const requestedInventoryIds = Array.from(
    new Set(
      surowe
        .flatMap((r) => (Array.isArray(r.requested_inventory) ? r.requested_inventory : []))
        .map((x) => x?.inventoryId)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );
  const inventoryNameById: Record<string, string> = {};
  const inventoryAvailableById: Record<string, number> = {};
  const chairsAvailableByHall: Record<string, number> = {};
  const tablesAvailableByHall: Record<string, number> = {};
  const dishesAvailableByHall: Record<string, number> = {};
  for (const it of hallInventoryRaw ?? []) {
    inventoryAvailableById[it.id] = Number(it.quantity_available ?? it.quantity ?? 0);
    const nazwa = String(it.name).toLowerCase();
    const available = Number(it.quantity_available ?? it.quantity ?? 0);
    if (nazwa.includes("krzes")) {
      chairsAvailableByHall[it.hall_id] = (chairsAvailableByHall[it.hall_id] ?? 0) + available;
    }
    if (nazwa.includes("stol")) {
      tablesAvailableByHall[it.hall_id] = (tablesAvailableByHall[it.hall_id] ?? 0) + available;
    }
    if (nazwa.includes("nacz") || nazwa.includes("talerz") || nazwa.includes("sztuc")) {
      dishesAvailableByHall[it.hall_id] = (dishesAvailableByHall[it.hall_id] ?? 0) + available;
    }
  }
  if (requestedInventoryIds.length > 0) {
    const invNames = (hallInventoryRaw ?? []).filter((x) => requestedInventoryIds.includes(x.id));
    for (const it of invNames ?? []) {
      inventoryNameById[it.id] = it.name;
    }
  }

  type RawKalendarz = {
    id: string;
    hall_id: string;
    start_at: string;
    end_at: string;
    event_type: string;
    event_title: string | null;
    contact_phone: string | null;
    status: string;
    booked_by: string | null;
  };

  type RawEksport = {
    id: string;
    hall_id: string;
    start_at: string;
    end_at: string;
    event_type: string;
    event_title: string | null;
    expected_guests: number;
    contact_phone: string | null;
    status: string;
    created_at: string;
    booked_by: string | null;
  };

  let kalendarzSurowe: RawKalendarz[] = [];
  let eksportSurowe: RawEksport[] = [];
  if (hallIds.length > 0) {
    const teraz = new Date();
    const wPrzod = new Date(teraz.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data: dKal } = await supabase
      .from("hall_bookings")
      .select(
        "id, hall_id, start_at, end_at, event_type, event_title, contact_phone, status, booked_by"
      )
      .in("hall_id", hallIds)
      .in("status", ["pending", "approved"])
      .gt("end_at", teraz.toISOString())
      .lt("start_at", wPrzod.toISOString())
      .order("start_at", { ascending: true });
    kalendarzSurowe = (dKal ?? []) as RawKalendarz[];

    const wstecz = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const { data: dEks } = await supabase
      .from("hall_bookings")
      .select(
        "id, hall_id, start_at, end_at, event_type, event_title, expected_guests, contact_phone, status, created_at, booked_by"
      )
      .in("hall_id", hallIds)
      .gte("start_at", wstecz.toISOString())
      .order("start_at", { ascending: false })
      .limit(500);
    eksportSurowe = (dEks ?? []) as RawEksport[];
  }

  const userIds = Array.from(
    new Set(
      [
        ...surowe.map((r) => r.booked_by),
        ...kalendarzSurowe.map((r) => r.booked_by),
        ...eksportSurowe.map((r) => r.booked_by),
      ].filter(Boolean) as string[]
    )
  );
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
    requested_inventory: Array.isArray(r.requested_inventory)
      ? r.requested_inventory
          .map((x) => ({
            name:
              (x?.inventoryId && inventoryNameById[x.inventoryId]) ||
              (x?.inventoryId ? `Pozycja ${x.inventoryId.slice(0, 6)}` : "Pozycja"),
            quantity: Number(x?.quantity ?? 0),
            available:
              x?.inventoryId && inventoryAvailableById[x.inventoryId] != null
                ? inventoryAvailableById[x.inventoryId]
                : null,
          }))
          .filter((x) => Number.isFinite(x.quantity) && x.quantity > 0)
      : [],
    suggested_layout:
      r.layout_data?.preset === "auto_bankiet"
        ? "Auto bankiet"
        : r.layout_data?.preset === "teatralny"
          ? "Teatralny"
          : r.layout_data?.preset === "warsztatowy"
            ? "Warsztatowy (wyspy)"
            : r.layout_data?.preset === "u_ksztalt"
              ? "U-kształt"
              : "Własny / bez zmian",
    preparation_warnings: [
      ...(maxPojemnoscSali[r.hall_id] != null && r.expected_guests > Number(maxPojemnoscSali[r.hall_id])
        ? [`Liczba gości (${r.expected_guests}) przekracza pojemność sali (${maxPojemnoscSali[r.hall_id]}).`]
        : []),
      ...(chairsAvailableByHall[r.hall_id] != null && r.expected_guests > chairsAvailableByHall[r.hall_id]
        ? [`Może brakować krzeseł: goście ${r.expected_guests}, dostępne krzesła ${chairsAvailableByHall[r.hall_id]}.`]
        : []),
    ],
    procurement_recommendations: [
      `Przygotuj min. ${Math.ceil(r.expected_guests / 8)} stołów i ${r.expected_guests} miejsc siedzących.`,
      ...(r.event_type === "wesele" || r.event_type === "urodziny"
        ? [`Na wydarzenie rodzinne przygotuj naczynia/sztućce dla ${r.expected_guests} osób.`]
        : []),
      ...(tablesAvailableByHall[r.hall_id] != null && tablesAvailableByHall[r.hall_id] < Math.ceil(r.expected_guests / 8)
        ? [
            `Rozważ dokupienie lub wypożyczenie stołów: dostępne ${tablesAvailableByHall[r.hall_id]}, rekomendowane ${Math.ceil(
              r.expected_guests / 8
            )}.`,
          ]
        : []),
      ...(chairsAvailableByHall[r.hall_id] != null && chairsAvailableByHall[r.hall_id] < r.expected_guests
        ? [
            `Rozważ dokupienie lub wypożyczenie krzeseł: dostępne ${chairsAvailableByHall[r.hall_id]}, potrzebne ${r.expected_guests}.`,
          ]
        : []),
      ...(dishesAvailableByHall[r.hall_id] != null &&
      (r.event_type === "wesele" || r.event_type === "urodziny") &&
      dishesAvailableByHall[r.hall_id] < r.expected_guests
        ? [
            `Braki w naczyniach: dostępne ${dishesAvailableByHall[r.hall_id]}, potrzebne ${r.expected_guests}.`,
          ]
        : []),
    ],
    created_at: r.created_at,
  }));

  const wierszeKalendarz = kalendarzSurowe
    .filter(
      (r): r is RawKalendarz & { status: "pending" | "approved" } =>
        r.status === "pending" || r.status === "approved"
    )
    .map((r) => ({
      id: r.id,
      hall_id: r.hall_id,
      sala_nazwa: nazwaSali[r.hall_id] ?? "Sala",
      status: r.status,
      start_at: r.start_at,
      end_at: r.end_at,
      event_type: r.event_type,
      event_title: r.event_title,
      contact_phone: r.contact_phone,
      mieszkaniec: r.booked_by ? mapaUzytkownikow[r.booked_by] ?? r.booked_by.slice(0, 8) : "—",
    }));

  const wierszeEksport = eksportSurowe.map((r) => ({
    id: r.id,
    hall_id: r.hall_id,
    sala_nazwa: nazwaSali[r.hall_id] ?? "Sala",
    status: r.status,
    start_at: r.start_at,
    end_at: r.end_at,
    event_type: r.event_type,
    event_title: r.event_title,
    expected_guests: r.expected_guests,
    contact_phone: r.contact_phone,
    created_at: r.created_at,
    mieszkaniec: r.booked_by ? mapaUzytkownikow[r.booked_by] ?? r.booked_by.slice(0, 8) : "—",
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
      <h1 className="tytul-sekcji-panelu">Rezerwacje świetlic</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wnioski oczekujące na zatwierdzenie w Twoich sołectwach. Po zatwierdzeniu mieszkaniec zobaczy status przy
        swojej sali. Na publicznym kalendarzu i w panelu innych użytkowników widać tylko, że termin jest zajęty;{" "}
        <strong>imię, telefon i tytuł wydarzenia widać wyłącznie w tym panelu (sołtys).</strong>
      </p>

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie masz aktywnej roli sołtysa ani współadministratora.
        </p>
      ) : (
        <>
          <SoltysRezerwacjeKlient wiersze={wiersze} />
          <SoltysRezerwacjeKalendarzEksport kalendarz={wierszeKalendarz} eksport={wierszeEksport} />
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
