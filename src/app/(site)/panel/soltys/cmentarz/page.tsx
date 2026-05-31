import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { PlanCmentarzaEdytor } from "@/components/cmentarz/plan-cmentarza-edytor";
import { parsujPlanCmentarza, szablonPlanuCmentarzaStartowy } from "@/lib/cmentarz/plan-cmentarza";
import { centroidPolygon } from "@/lib/cmentarz/overpass-cmentarz-obrys";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Plan cmentarza (sołtys)",
};

export default async function SoltysCmentarzPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/cmentarz");
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  type WiesRow = {
    id: string;
    name: string;
    voivodeship: string;
    county: string;
    commune: string;
    slug: string;
    latitude: number | null;
    longitude: number | null;
  };

  let wies: WiesRow[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("villages")
      .select("id, name, voivodeship, county, commune, slug, latitude, longitude")
      .in("id", villageIds)
      .order("name", { ascending: true });
    wies = (data ?? []) as WiesRow[];
  }

  const plany: Record<
    string,
    {
      id: string;
      name: string;
      is_published: boolean;
      virtual_candles_enabled: boolean;
      orthophoto_enabled: boolean;
      boundary_geojson: unknown;
      plan_data: ReturnType<typeof parsujPlanCmentarza>;
      oczekujaceCsv: number;
    }
  > = {};

  if (villageIds.length > 0) {
    const { data: istniejace } = await supabase
      .from("village_cemetery_plans")
      .select("id, village_id, name, is_published, virtual_candles_enabled, orthophoto_enabled, boundary_geojson, plan_data")
      .in("village_id", villageIds);

    for (const w of wies) {
      let plan = istniejace?.find((p) => p.village_id === w.id);
      if (!plan) {
        const { data: wstaw } = await supabase
          .from("village_cemetery_plans")
          .insert({
            village_id: w.id,
            name: `Cmentarz — ${w.name}`,
            plan_data: szablonPlanuCmentarzaStartowy(),
            gate_slug: `cmentarz-${w.id.slice(0, 8)}`,
          })
          .select("id, village_id, name, is_published, virtual_candles_enabled, orthophoto_enabled, boundary_geojson, plan_data")
          .single();
        plan = wstaw ?? undefined;
      }
      if (!plan) continue;

      const { count } = await supabase
        .from("cemetery_grave_records")
        .select("id", { count: "exact", head: true })
        .eq("cemetery_plan_id", plan.id)
        .eq("status", "pending");

      plany[w.id] = {
        id: plan.id,
        name: plan.name,
        is_published: plan.is_published,
        virtual_candles_enabled: plan.virtual_candles_enabled,
        orthophoto_enabled: plan.orthophoto_enabled,
        boundary_geojson: plan.boundary_geojson,
        plan_data: parsujPlanCmentarza(plan.plan_data),
        oczekujaceCsv: count ?? 0,
      };
    }
  }

  return (
    <PanelStronaSoltysa
      tytul="Plan cmentarza"
      opis={
        <>
          Układ <strong>kwater, rzędów i grobów</strong> (jak plan sali świetlicy), import obrysu z OpenStreetMap,
          podkład ortofoto, wyszukiwarka dla rodzin, link QR przy bramie i wirtualne znicze.
        </>
      }
      szeroki
      dzieci={
        <>
          {villageIds.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Nie masz aktywnej roli sołtysa. Skontaktuj się z zespołem naszawies.pl w sprawie przypisania.
            </p>
          ) : null}

          <div className="space-y-8">
            {wies.map((w) => {
              const plan = plany[w.id];
              if (!plan) return null;
              const sciezka = sciezkaProfiluWsi(w);
              let centroidLat: number | null = w.latitude != null ? Number(w.latitude) : null;
              let centroidLng: number | null = w.longitude != null ? Number(w.longitude) : null;
              if (plan.boundary_geojson) {
                try {
                  const c = centroidPolygon(plan.boundary_geojson as GeoJSON.Polygon | GeoJSON.MultiPolygon);
                  if (c.lat && c.lon) {
                    centroidLat = c.lat;
                    centroidLng = c.lon;
                  }
                } catch {
                  /* zostaw GPS wsi */
                }
              }

              return (
                <div key={w.id}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-500">{w.name}</p>
                  <PlanCmentarzaEdytor
                    planId={plan.id}
                    nazwaPoczatkowa={plan.name}
                    poczatkowyPlan={plan.plan_data}
                    opublikowany={plan.is_published}
                    zniczeWlaczone={plan.virtual_candles_enabled}
                    ortofotoWlaczone={plan.orthophoto_enabled}
                    maObrys={!!plan.boundary_geojson}
                    centroidLat={centroidLat}
                    centroidLng={centroidLng}
                    sciezkaPubliczna={sciezka}
                    oczekujaceCsv={plan.oczekujaceCsv}
                  />
                </div>
              );
            })}
          </div>

          <p className="mt-10 text-sm text-stone-500">
            <Link href="/panel/soltys/moja-wies" className="text-green-800 underline">
              Profil wsi (pinezka cmentarza na mapie)
            </Link>
          </p>
        </>
      }
    />
  );
}
