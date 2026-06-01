import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { czyDzisWyslacPrzypomnienie } from "@/lib/przypomnienia/oblicz-terminy";
import {
  czyRodzajWlaczony,
  DOMYSLNE_PREFERENCJE,
  type PreferencjePrzypomnien,
  type RodzajPrzypomnienia,
} from "@/lib/przypomnienia/rodzaje";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { linkPowiadomienia } from "@/lib/tekst/bezpieczny-url";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type RegulaWiersz = {
  id: string;
  village_id: string;
  kind: RodzajPrzypomnienia;
  title: string;
  body: string | null;
  recurrence: "weekly" | "monthly" | "yearly";
  day_of_week: number | null;
  day_of_month: number | null;
  month: number | null;
  days_before: number;
  link_url: string | null;
  villages: { name: string; slug: string; voivodeship: string; county: string; commune: string } | { name: string; slug: string; voivodeship: string; county: string; commune: string }[] | null;
};

function prefsZWiersza(
  row: {
    notify_smieci: boolean;
    notify_podatek: boolean;
    notify_dzialka: boolean;
    notify_pszok: boolean;
    notify_inne: boolean;
  } | null,
): PreferencjePrzypomnien {
  if (!row) return DOMYSLNE_PREFERENCJE;
  return {
    notify_smieci: row.notify_smieci,
    notify_podatek: row.notify_podatek,
    notify_dzialka: row.notify_dzialka,
    notify_pszok: row.notify_pszok,
    notify_inne: row.notify_inne,
  };
}

const ROZMIAR_PACZKI = 80;

/** Cron: przypomnienia śmieci, podatków, działek dla mieszkańców z włączonymi zgodami. */
export async function powiadomMieszkancowOPrzypomnieniachWsi(villageId?: string): Promise<number> {
  const admin = createAdminSupabaseClient();
  if (!admin) return 0;

  const dzis = new Date();
  let zapytanie = admin
    .from("village_resident_reminders")
    .select(
      "id, village_id, kind, title, body, recurrence, day_of_week, day_of_month, month, days_before, link_url, villages(name, slug, voivodeship, county, commune)",
    )
    .eq("is_active", true);

  if (villageId) {
    zapytanie = zapytanie.eq("village_id", villageId);
  }

  const { data: reguly } = await zapytanie.limit(500);
  if (!reguly?.length) return 0;

  type RegulaDoWysylki = { regula: RegulaWiersz; fire_on: string };
  const doWysylki: RegulaDoWysylki[] = [];

  for (const regulaRaw of reguly as RegulaWiersz[]) {
    const { wyslij, fire_on } = czyDzisWyslacPrzypomnienie(
      {
        recurrence: regulaRaw.recurrence,
        day_of_week: regulaRaw.day_of_week,
        day_of_month: regulaRaw.day_of_month,
        month: regulaRaw.month,
        days_before: regulaRaw.days_before,
      },
      dzis,
    );
    if (wyslij && fire_on) {
      doWysylki.push({ regula: regulaRaw, fire_on });
    }
  }

  if (doWysylki.length === 0) return 0;

  const unikalneWsi = Array.from(new Set(doWysylki.map((d) => d.regula.village_id)));
  const mieszkancyWsi = new Map<string, string[]>();
  const prefsWsi = new Map<string, Map<string, PreferencjePrzypomnien>>();

  for (const vid of unikalneWsi) {
    const { data: mieszkancy } = await admin
      .from("user_village_roles")
      .select("user_id")
      .eq("village_id", vid)
      .eq("status", "active")
      .in("role", ["mieszkaniec", "wspoladmin"]);

    const userIds = Array.from(new Set((mieszkancy ?? []).map((m) => m.user_id)));
    mieszkancyWsi.set(vid, userIds);

    if (userIds.length === 0) {
      prefsWsi.set(vid, new Map());
      continue;
    }

    const { data: prefsRows } = await admin
      .from("user_resident_reminder_prefs")
      .select("user_id, notify_smieci, notify_podatek, notify_dzialka, notify_pszok, notify_inne")
      .eq("village_id", vid)
      .in("user_id", userIds);

    const mapa = new Map<string, PreferencjePrzypomnien>();
    for (const p of prefsRows ?? []) {
      mapa.set(p.user_id, prefsZWiersza(p));
    }
    prefsWsi.set(vid, mapa);
  }

  let wyslane = 0;

  for (const { regula: regulaRaw, fire_on } of doWysylki) {
    const userIds = mieszkancyWsi.get(regulaRaw.village_id) ?? [];
    if (userIds.length === 0) continue;

    const prefsMap = prefsWsi.get(regulaRaw.village_id) ?? new Map();
    const odbiorcy = userIds.filter((uid) =>
      czyRodzajWlaczony(prefsMap.get(uid) ?? DOMYSLNE_PREFERENCJE, regulaRaw.kind),
    );
    if (odbiorcy.length === 0) continue;

    const { data: juzWyslane } = await admin
      .from("resident_reminder_deliveries")
      .select("user_id")
      .eq("rule_id", regulaRaw.id)
      .eq("fire_on", fire_on)
      .in("user_id", odbiorcy);

    const juzSet = new Set((juzWyslane ?? []).map((r) => r.user_id));
    const doPowiadomienia = odbiorcy.filter((uid) => !juzSet.has(uid));
    if (doPowiadomienia.length === 0) continue;

    const v = Array.isArray(regulaRaw.villages) ? regulaRaw.villages[0] : regulaRaw.villages;
    const linkDomyslny =
      v?.slug ? `${sciezkaProfiluWsi(v)}#przewodnik-samorzadowy` : "/panel/mieszkaniec/przypomnienia";
    const link = linkPowiadomienia(regulaRaw.link_url, linkDomyslny);

    const dataTerminu = new Date(fire_on + "T12:00:00").toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const tytul = regulaRaw.title;
    const tresc =
      regulaRaw.body?.trim() ||
      `Termin: ${dataTerminu}. Sprawdź szczegóły w przewodniku wsi (${v?.name ?? "Twoja wieś"}).`;

    for (let i = 0; i < doPowiadomienia.length; i += ROZMIAR_PACZKI) {
      const paczka = doPowiadomienia.slice(i, i + ROZMIAR_PACZKI);
      const wierszeNotif = paczka.map((uid) => ({
        user_id: uid,
        type: "resident_reminder" as const,
        title: tytul,
        body: tresc,
        link_url: link,
        related_id: regulaRaw.id,
        related_type: "village_resident_reminder",
        channel: "in_app" as const,
      }));

      const { error: insN } = await admin.from("notifications").insert(wierszeNotif);
      if (insN) {
        console.warn("[powiadomMieszkancowOPrzypomnieniachWsi]", insN.message);
        continue;
      }

      const { error: insD } = await admin.from("resident_reminder_deliveries").insert(
        paczka.map((uid) => ({
          user_id: uid,
          rule_id: regulaRaw.id,
          fire_on,
        })),
      );
      if (insD) {
        console.warn("[powiadomMieszkancowOPrzypomnieniachWsi] deliveries", insD.message);
        continue;
      }

      for (const uid of paczka) {
        void wyslijWebPushDlaUzytkownika(admin, {
          userId: uid,
          title: tytul,
          body: tresc.slice(0, 180),
          linkUrl: link,
          tag: `resident-rem-${regulaRaw.id}-${fire_on}`,
        }).catch(() => {});
      }

      wyslane += paczka.length;
    }
  }

  return wyslane;
}
