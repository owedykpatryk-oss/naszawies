import type { Metadata } from "next";
import { PanelStronaMieszkaneca } from "@/components/panel/panel-strona-mieszkaneca";
import { najblizszeWydarzenie } from "@/lib/przypomnienia/oblicz-terminy";
import {
  DOMYSLNE_PREFERENCJE,
  type PreferencjePrzypomnien,
  type RodzajPrzypomnienia,
} from "@/lib/przypomnienia/rodzaje";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { PrzypomnieniaMieszkaniecKlient, type WiesPrzypomnien } from "./przypomnienia-mieszkaniec-klient";

export const metadata: Metadata = {
  title: "Przypomnienia — śmieci, podatki, działki",
};

export default async function MieszkaniecPrzypomnieniaPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name, slug, voivodeship, county, commune)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const villageIds = (roleRows ?? []).map((r) => r.village_id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaMieszkaneca
        tytul="Przypomnienia"
        opis="Automatyczne alerty o śmieciach, podatkach i terminach z Twojej wsi."
        hrefPowrotu="/panel/mieszkaniec"
        dzieci={<PrzypomnieniaMieszkaniecKlient wsie={[]} />}
      />
    );
  }

  const [{ data: reguly }, { data: prefsRows }] = await Promise.all([
    supabase
      .from("village_resident_reminders")
      .select(
        "id, village_id, kind, title, recurrence, day_of_week, day_of_month, month, days_before",
      )
      .in("village_id", villageIds)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("user_resident_reminder_prefs")
      .select("village_id, notify_smieci, notify_podatek, notify_dzialka, notify_pszok, notify_inne")
      .eq("user_id", user.id)
      .in("village_id", villageIds),
  ]);

  const prefsMap = new Map(
    (prefsRows ?? []).map((p) => [
      p.village_id,
      {
        notify_smieci: p.notify_smieci,
        notify_podatek: p.notify_podatek,
        notify_dzialka: p.notify_dzialka,
        notify_pszok: p.notify_pszok,
        notify_inne: p.notify_inne,
      } satisfies PreferencjePrzypomnien,
    ]),
  );

  const wsie: WiesPrzypomnien[] = (roleRows ?? []).map((r) => {
    const v = pojedynczaWies<{
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    }>(r.villages);
    const regulyWsi = (reguly ?? []).filter((x) => x.village_id === r.village_id);
    return {
      villageId: r.village_id,
      nazwa: v?.name ?? "Wieś",
      sciezkaWsi: v ? sciezkaProfiluWsi(v) : null,
      prefs: prefsMap.get(r.village_id) ?? DOMYSLNE_PREFERENCJE,
      reguly: regulyWsi.map((reg) => {
        const nast = najblizszeWydarzenie({
          recurrence: reg.recurrence as "weekly" | "monthly" | "yearly",
          day_of_week: reg.day_of_week,
          day_of_month: reg.day_of_month,
          month: reg.month,
          days_before: reg.days_before,
        });
        return {
          id: reg.id,
          kind: reg.kind as RodzajPrzypomnienia,
          title: reg.title,
          recurrence: reg.recurrence,
          day_of_week: reg.day_of_week,
          day_of_month: reg.day_of_month,
          month: reg.month,
          days_before: reg.days_before,
          nastepny: nast
            ? nast.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })
            : null,
        };
      }),
    };
  });

  return (
    <PanelStronaMieszkaneca
      tytul="Przypomnienia z wsi"
      opis="Wywóz śmieci, terminy podatków i opłat za działkę — dostaniesz powiadomienie w panelu z wyprzedzeniem, bez pilnowania kalendarza."
      hrefPowrotu="/panel/mieszkaniec"
      etykietaPowrotu="← Moja wieś"
      dzieci={<PrzypomnieniaMieszkaniecKlient wsie={wsie} />}
    />
  );
}
