import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";

/** Minimalna długość opisu wsi, żeby uznać profil publiczny za „zainicjowany”. */
const MIN_OPISU_WSI = 30;

export type StanPrzewodnikaStartu = {
  pokazBaner: boolean;
  profilNickOk: boolean;
  powiazanieZWisiaOk: boolean;
  jestSoltysem: boolean;
  wiesOpisWypelniony: boolean;
  pierwszeOgloszenieOk: boolean;
  swietlicaSkonfigurowana: boolean;
  lacznieKrokow: number;
  ukonczoneKrokow: number;
};

export async function pobierzStanPrzewodnikaStartu(
  supabase: SupabaseClient,
  userId: string,
  maWyborWsiZRejestracji = false,
): Promise<StanPrzewodnikaStartu> {
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  const jestSoltysem = villageIds.length > 0;

  const [{ data: u }, rc, fc] = await Promise.all([
    supabase.from("users").select("display_name").eq("id", userId).maybeSingle(),
    supabase.from("user_village_roles").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("user_follows").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const profilNickOk = (u?.display_name ?? "").trim().length >= 2;
  const maRoleLubObserwacje =
    (typeof rc.count === "number" && rc.count > 0) || (typeof fc.count === "number" && fc.count > 0);
  // Wybór wsi przy rejestracji to także sygnał, że użytkownik powiązał konto z obszarem.
  const powiazanieZWisiaOk = maRoleLubObserwacje || jestSoltysem || maWyborWsiZRejestracji;

  let wiesOpisWypelniony = true;
  let pierwszeOgloszenieOk = true;
  let swietlicaSkonfigurowana = true;

  if (jestSoltysem) {
    const [{ data: wsi }, { count: postCount }, { count: hallCount }] = await Promise.all([
      supabase.from("villages").select("description").in("id", villageIds),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .in("village_id", villageIds)
        .eq("status", "approved"),
      supabase.from("halls").select("id", { count: "exact", head: true }).in("village_id", villageIds),
    ]);
    const opisy = (wsi ?? []).map((w) => (w.description ?? "").trim());
    wiesOpisWypelniony =
      opisy.length === villageIds.length && opisy.every((t) => t.length >= MIN_OPISU_WSI);
    pierwszeOgloszenieOk = typeof postCount === "number" && postCount > 0;
    swietlicaSkonfigurowana = typeof hallCount === "number" && hallCount > 0;
  }

  const pokazBaner =
    !profilNickOk ||
    !powiazanieZWisiaOk ||
    (jestSoltysem && (!wiesOpisWypelniony || !pierwszeOgloszenieOk || !swietlicaSkonfigurowana));

  const lacznieKrokow = jestSoltysem ? 5 : 2;
  let ukonczoneKrokow = 0;
  if (profilNickOk) ukonczoneKrokow += 1;
  if (powiazanieZWisiaOk) ukonczoneKrokow += 1;
  if (jestSoltysem) {
    if (wiesOpisWypelniony) ukonczoneKrokow += 1;
    if (pierwszeOgloszenieOk) ukonczoneKrokow += 1;
    if (swietlicaSkonfigurowana) ukonczoneKrokow += 1;
  }

  return {
    pokazBaner,
    profilNickOk,
    powiazanieZWisiaOk,
    jestSoltysem,
    wiesOpisWypelniony,
    pierwszeOgloszenieOk,
    swietlicaSkonfigurowana,
    lacznieKrokow,
    ukonczoneKrokow,
  };
}
