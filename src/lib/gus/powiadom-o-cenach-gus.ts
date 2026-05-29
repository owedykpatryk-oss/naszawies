import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const MIESIACE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

export type NowyOkresGus = {
  powiat_teryt_kod: string;
  year: number;
  month: number;
  region_nazwa: string;
};

/** Powiadom mieszkańców wsi z danego powiatu o nowych średnich cenach GUS (raz na okres). */
export async function powiadomONowychCenachGus(
  admin: SupabaseClient,
  okresy: NowyOkresGus[],
): Promise<number> {
  if (okresy.length === 0) return 0;

  let wyslane = 0;
  const teraz = new Date();
  const granicaDuplikatu = new Date(teraz.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString();

  for (const okres of okresy) {
    const { data: wsie } = await admin
      .from("villages")
      .select("id, name, slug, voivodeship, county, commune")
      .eq("powiat_teryt_kod", okres.powiat_teryt_kod)
      .eq("is_active", true)
      .limit(200);

    if (!wsie?.length) continue;

    const villageIds = wsie.map((w) => w.id);
    const { data: roleRows } = await admin
      .from("user_village_roles")
      .select("user_id, village_id")
      .in("village_id", villageIds)
      .eq("status", "active")
      .in("role", ["mieszkaniec", "soltys", "rada_solecka", "wspoladmin", "kgw_przewodniczaca", "osp_naczelnik"]);

    if (!roleRows?.length) continue;

    const miesiacNazwa = MIESIACE[okres.month - 1] ?? String(okres.month);
    const tytul = `Nowe średnie ceny skupu GUS — ${miesiacNazwa} ${okres.year}`;
    const tresc = `GUS opublikował średnie ceny skupu za ${miesiacNazwa} ${okres.year} (region ${okres.region_nazwa}). To orientacja statystyczna — sprawdź też ceny od sąsiadów na profilu wsi.`;

    for (const rola of roleRows) {
      const wies = wsie.find((w) => w.id === rola.village_id);
      if (!wies) continue;

      const link = `${sciezkaProfiluWsi(wies)}#sekcja-rolnictwo`;
      const tag = `gus-${okres.powiat_teryt_kod}-${okres.year}-${okres.month}`;

      const { data: istniejace } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", rola.user_id)
        .eq("type", "agri_gus_new_prices")
        .eq("related_id", rola.village_id)
        .gte("created_at", granicaDuplikatu)
        .ilike("body", `%${okres.year}%${miesiacNazwa}%`)
        .limit(1);

      if (istniejace?.length) continue;

      const { error } = await admin.from("notifications").insert({
        user_id: rola.user_id,
        type: "agri_gus_new_prices",
        title: tytul,
        body: tresc,
        link_url: link,
        related_id: rola.village_id,
        related_type: "village",
        channel: "in_app",
      });

      if (error) {
        console.warn("[powiadomONowychCenachGus]", error.message);
        continue;
      }

      void wyslijWebPushDlaUzytkownika(admin, {
        userId: rola.user_id,
        title: tytul,
        body: tresc.slice(0, 180),
        linkUrl: link,
        tag,
      }).catch(() => {});

      wyslane += 1;
    }
  }

  return wyslane;
}
