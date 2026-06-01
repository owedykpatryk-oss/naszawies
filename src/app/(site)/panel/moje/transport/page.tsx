import { PanelStronaMoje } from "@/components/panel/panel-strona-moje";
import { MojeTransportUstawieniaKlient } from "@/components/panel/moje/moje-transport-ustawienia-klient";
import { uzupelnijRelacjeTransportoweUzytkownika } from "@/lib/transport/uzupelnij-relacje-transportowe";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const metadata = { title: "Transport — Moje" };

export default async function MojeTransportPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  await uzupelnijRelacjeTransportoweUzytkownika(supabase, user.id);

  const { data: raw } = await supabase
    .from("user_transport_favorite_relations")
    .select(
      "id, village_id, relation_key, title, target_label, target_station_id, target_station_name, notify_delay_min, notify_cancelled, notify_disruptions, is_active, villages(name, slug, voivodeship, county, commune)",
    )
    .eq("user_id", user.id)
    .order("title");

  const relacje = (raw ?? []).map((r) => {
    const v = Array.isArray(r.villages) ? r.villages[0] : r.villages;
    const wies = v
      ? {
          name: String(v.name),
          slug: String(v.slug),
          voivodeship: String(v.voivodeship),
          county: String(v.county),
          commune: String(v.commune),
        }
      : null;
    return {
      id: r.id,
      villageId: r.village_id,
      wiesNazwa: wies?.name ?? "Wieś",
      wiesSciezka: wies ? sciezkaProfiluWsi(wies) : "/szukaj",
      relationKey: r.relation_key,
      title: r.title,
      targetLabel: r.target_label,
      targetStationId: r.target_station_id,
      targetStationName: r.target_station_name,
      notifyDelayMin: r.notify_delay_min,
      notifyCancelled: r.notify_cancelled,
      notifyDisruptions: r.notify_disruptions,
      isActive: r.is_active,
    };
  });

  return (
    <PanelStronaMoje
      tytul="Ustawienia transportu"
      opis="Powiadomienia o kolei oraz relacje do miasta powiatowego i wojewódzkiego."
      dzieci={<MojeTransportUstawieniaKlient relacje={relacje} />}
    />
  );
}
