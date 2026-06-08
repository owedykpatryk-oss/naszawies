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
    { count: ogloszeniaSzkoly },
    { count: ostrzezeniaLow },
    { count: lesnictwoProfil },
    { count: lesnictwoOstrzezenia },
    { count: rolnictwoProfil },
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
    supabase
      .from("school_announcements")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("village_hunting_notices")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("village_forestry_profiles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("is_published", true),
    supabase
      .from("village_forestry_notices")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "approved"),
    supabase
      .from("village_agriculture_profiles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("is_published", true),
  ]);

  const profilAktywny = (wsi ?? []).some((w) => w.is_active === true);
  const maGranice = typeof granice === "number" && granice > 0;
  const maMieszkanca = typeof mieszkancy === "number" && mieszkancy > 0;
  const maPost =
    (typeof posty === "number" && posty > 0) || (typeof wiadomosci === "number" && wiadomosci > 0);
  const wnioskiCzyste = typeof wnioskiPending !== "number" || wnioskiPending === 0;
  const maTabliceSzkoly = typeof ogloszeniaSzkoly === "number" && ogloszeniaSzkoly > 0;
  const maPolowanie = typeof ostrzezeniaLow === "number" && ostrzezeniaLow > 0;
  const maLesnictwo =
    (typeof lesnictwoProfil === "number" && lesnictwoProfil > 0) ||
    (typeof lesnictwoOstrzezenia === "number" && lesnictwoOstrzezenia > 0);
  const maRolnictwo = typeof rolnictwoProfil === "number" && rolnictwoProfil > 0;

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
      id: "szkola-tablica",
      tytul: "6. Tablica szkoły (opcj.)",
      opis: "Przynajmniej jedno ogłoszenie na tablicy — dla rodziców i uczniów.",
      href: "/panel/soltys/szkola",
      ok: maTabliceSzkoly,
    },
    {
      id: "rolnictwo",
      tytul: "7. Rolnictwo (opcj.)",
      opis: "Opublikowany profil rolniczy wsi (ARiMR, dopłaty, skup).",
      href: "/panel/soltys/rolnictwo",
      ok: maRolnictwo,
    },
    {
      id: "lesnictwo",
      tytul: "8. Leśnictwo (opcj.)",
      opis: "Opublikowany profil leśny lub aktywne ostrzeżenie (zakaz, wycinka).",
      href: "/panel/soltys/lesnictwo",
      ok: maLesnictwo,
    },
    {
      id: "polowania",
      tytul: "9. Polowania (opcj.)",
      opis: "Przynajmniej jedno ostrzeżenie o polowaniu na mapie.",
      href: "/panel/soltys/lowiectwo",
      ok: maPolowanie,
    },
    {
      id: "wnioski",
      tytul: "10. Wnioski rozpatrzone",
      opis: "Brak oczekujących wniosków o role (mieszkaniec, OSP, KGW…).",
      href: "/panel/soltys#wnioski-o-role",
      ok: wnioskiCzyste,
    },
    {
      id: "qr",
      tytul: "10. QR / link na tablicę",
      opis: "Wygeneruj kod QR w profilu wsi i powieś na tablicy ogłoszeń.",
      href: "/panel/soltys/moja-wies#qr-profil-wsi",
      ok: profilAktywny && wiesOpisWypelniony,
    },
  ];

  const ukonczone = kroki.filter((k) => k.ok).length;
  return { kroki, ukonczone, lacznie: kroki.length };
}
