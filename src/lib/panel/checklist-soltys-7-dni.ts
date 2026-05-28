import type { SupabaseClient } from "@supabase/supabase-js";

export type KrokChecklistySoltysa = {
  id: string;
  tytul: string;
  opis: string;
  href: string;
  ok: boolean;
};

export type ChecklistSoltys7Dni = {
  kroki: KrokChecklistySoltysa[];
  ukonczone: number;
  lacznie: number;
};

export async function pobierzChecklisteSoltys7Dni(
  supabase: SupabaseClient,
  villageIds: string[],
  profilNickOk: boolean,
  wiesOpisWypelniony: boolean,
): Promise<ChecklistSoltys7Dni> {
  if (villageIds.length === 0) {
    return { kroki: [], ukonczone: 0, lacznie: 0 };
  }

  const [
    { data: wsi },
    { count: mieszkancy },
    { count: posty },
    { count: wnioskiPending },
    { count: granice },
    { count: wiadomosci },
  ] = await Promise.all([
    supabase.from("villages").select("id, is_active, slug").in("id", villageIds),
    supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("role", "mieszkaniec")
      .eq("status", "active"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .in("role", ["mieszkaniec", "osp_naczelnik", "kgw_przewodniczaca", "rada_solecka"])
      .eq("status", "pending"),
    supabase
      .from("villages")
      .select("id", { count: "exact", head: true })
      .in("id", villageIds)
      .not("boundary_geojson", "is", null),
    supabase
      .from("village_bulletins")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "published"),
  ]);

  const profilAktywny = (wsi ?? []).some((w) => w.is_active === true);
  const maGranice = typeof granice === "number" && granice > 0;
  const maMieszkanca = typeof mieszkancy === "number" && mieszkancy > 0;
  const maPost =
    (typeof posty === "number" && posty > 0) || (typeof wiadomosci === "number" && wiadomosci > 0);
  const wnioskiCzyste = typeof wnioskiPending !== "number" || wnioskiPending === 0;

  const kroki: KrokChecklistySoltysa[] = [
    {
      id: "profil",
      tytul: "1. Profil konta",
      opis: "Nazwa wyświetlana — mieszkańcy widzą Cię przy decyzjach.",
      href: "/panel/profil",
      ok: profilNickOk,
    },
    {
      id: "wies-opis",
      tytul: "2. Opis wsi online",
      opis: "Publiczny opis miejscowości (min. ok. 30 znaków).",
      href: "/panel/soltys/moja-wies",
      ok: wiesOpisWypelniony,
    },
    {
      id: "granica",
      tytul: "3. Granica na mapie",
      opis: "Obrys sołectwa z PRG — synchronizacja lub import w profilu wsi.",
      href: "/panel/soltys/moja-wies",
      ok: maGranice,
    },
    {
      id: "mieszkaniec",
      tytul: "4. Pierwszy mieszkaniec",
      opis: "Zaakceptuj co najmniej jednego mieszkańca z wniosków.",
      href: "/panel/soltys#wnioski-o-role",
      ok: maMieszkanca,
    },
    {
      id: "tresc",
      tytul: "5. Pierwsza treść dla wsi",
      opis: "Opublikowany post lub wiadomość lokalna na profilu.",
      href: "/panel/soltys/wiadomosci-lokalne",
      ok: maPost,
    },
    {
      id: "wnioski",
      tytul: "6. Wnioski rozpatrzone",
      opis: "Brak oczekujących wniosków o role (mieszkaniec, OSP, KGW…).",
      href: "/panel/soltys#wnioski-o-role",
      ok: wnioskiCzyste,
    },
    {
      id: "qr",
      tytul: "7. QR / link na tablicę",
      opis: "Wygeneruj kod QR w profilu wsi i powieś na tablicy ogłoszeń.",
      href: "/panel/soltys/moja-wies#qr-profil-wsi",
      ok: profilAktywny && wiesOpisWypelniony,
    },
  ];

  const ukonczone = kroki.filter((k) => k.ok).length;
  return { kroki, ukonczone, lacznie: kroki.length };
}
