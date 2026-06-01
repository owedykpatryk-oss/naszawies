import type { Metadata } from "next";
import Link from "next/link";
import { KreatorGrafikiKlient } from "@/components/grafika/kreator-grafiki-klient";
import { NaglowekModuluMieszkaniec } from "@/components/pomoc/naglowek-modulu-panelu";
import {
  parsujParametryPrefillRezerwacji,
  zbudujPrefillZRezerwacji,
} from "@/lib/grafika/prefill-rezerwacja";
import { pobierzVillageIdsMieszkanca } from "@/lib/panel/grafika-uprawnienia";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const metadata: Metadata = {
  title: "Kreator grafiki",
  description: "Zaproszenia na imprezy, urodziny, wesela w sali wiejskiej — pobierz PDF.",
};

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function MieszkaniecGrafikaPage({ searchParams }: Props) {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const villageIds = await pobierzVillageIdsMieszkanca(supabase, user.id);
  const wiesParam = searchParams?.wies;
  const wybranyParam = typeof wiesParam === "string" ? wiesParam : villageIds[0] ?? "";

  let villageId: string | null = null;
  if (wybranyParam && villageIds.includes(wybranyParam)) {
    villageId = wybranyParam;
  } else if (villageIds.length === 1) {
    villageId = villageIds[0] ?? null;
  }

  const { data: wiesRows } =
    villageIds.length > 0
      ? await supabase.from("villages").select("id, name, commune").in("id", villageIds)
      : { data: [] as { id: string; name: string; commune: string | null }[] };

  const wiesMap = Object.fromEntries((wiesRows ?? []).map((v) => [v.id, v]));
  const aktywna = villageId ? wiesMap[villageId] : null;
  const domyslnaWies = aktywna?.name ?? "";
  const domyslnaGmina = aktywna?.commune ?? "";

  const { data: orgRoles } = await supabase
    .from("user_village_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active");

  const roleSet = new Set((orgRoles ?? []).map((r) => r.role));
  const trybKgw = roleSet.has("kgw_przewodniczaca");
  const trybOsp = roleSet.has("osp_naczelnik");

  const paramRezerwacji = parsujParametryPrefillRezerwacji(searchParams ?? {});
  const prefill = paramRezerwacji
    ? zbudujPrefillZRezerwacji({
        eventType: paramRezerwacji.eventType,
        eventTitle: paramRezerwacji.eventTitle,
        startAt: paramRezerwacji.startAt,
        endAt: paramRezerwacji.endAt,
        hallName: paramRezerwacji.hallName,
        villageName: domyslnaWies || "…",
        bookingId: paramRezerwacji.bookingId ?? undefined,
        kontekst: { wies: domyslnaWies, gmina: domyslnaGmina },
      })
    : null;

  const zapisDoBazy = Boolean(villageId);

  return (
    <main>
      <NaglowekModuluMieszkaniec
        tytul="Kreator grafiki"
        hrefPomocy="/panel/mieszkaniec/pomoc"
        opis={
          <>
            Stwórz zaproszenie na urodziny, wesele w świetlicy, plakat akcji albo dyplom dla dziecka. Kreator ma{" "}
            <strong>3 zakładki</strong> — zacznij od trybu „Zaproszenie lub plakat”.
            {zapisDoBazy ? (
              <>
                {" "}
                <strong className="text-green-900">Projekty zapisują się w chmurze</strong> dla wybranej wsi.
              </>
            ) : (
              <> Wybierz wieś poniżej, aby włączyć zapis w chmurze.</>
            )}
            {prefill ? (
              <>
                {" "}
                <strong className="text-green-900">
                  Wczytano dane rezerwacji sali — sprawdź datę i miejsce w podglądzie.
                </strong>
              </>
            ) : null}
          </>
        }
      />

      {villageIds.length > 1 ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="w-full text-xs font-semibold uppercase tracking-wide text-stone-500">Twoja wieś:</span>
          {villageIds.map((id) => {
            const w = wiesMap[id];
            const aktywny = id === villageId;
            return (
              <Link
                key={id}
                href={`/panel/mieszkaniec/grafika?wies=${id}`}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  aktywny
                    ? "bg-green-800 font-medium text-white"
                    : "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
                }`}
              >
                {w?.name ?? "Wieś"}
              </Link>
            );
          })}
        </div>
      ) : null}

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Potrzebujesz aktywnej roli mieszkańca, aby zapisywać projekty w chmurze.{" "}
          <Link href="/panel/mieszkaniec" className="font-medium underline">
            Wniosek o rolę
          </Link>
          . Możesz nadal korzystać z kreatora — szkic zostanie w przeglądarce.
        </p>
      ) : null}

      <div className="mt-10">
        <KreatorGrafikiKlient
          kontekst={{ wies: domyslnaWies, gmina: domyslnaGmina }}
          villageId={villageId}
          trybSoltys={false}
          trybKgw={trybKgw}
          trybOsp={trybOsp}
          zapisDoBazy={zapisDoBazy}
          prefill={prefill}
        />
      </div>
    </main>
  );
}
