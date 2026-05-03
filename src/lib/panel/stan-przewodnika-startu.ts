import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";

/** Minimalna długość opisu wsi, żeby uznać profil publiczny za „zainicjowany”. */
const MIN_OPISU_WSI = 30;

export type StanPrzewodnikaStartu = {
  /** Czy pokazać baner na stronie głównej panelu. */
  pokazBaner: boolean;
  /** Wyświetlana nazwa (nick) — min. 2 znaki. */
  profilNickOk: boolean;
  /** Wniosek o rolę, obserwacja wsi lub aktywna rola sołtysa / współadmina. */
  powiazanieZWisiaOk: boolean;
  /** Aktywna rola panelu sołtysa w co najmniej jednej wsi. */
  jestSoltysem: boolean;
  /** Dla wszystkich „twoich” wsi (sołtys): opis publiczny ma sensowną długość. */
  wiesOpisWypelniony: boolean;
  /** Liczba kroków w checklistie (2 bez roli sołtysa, 3 ze sołtysem). */
  lacznieKrokow: number;
  /** Ile kroków jest już spełnionych. */
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
  if (jestSoltysem) {
    const { data: wsi } = await supabase.from("villages").select("description").in("id", villageIds);
    const opisy = (wsi ?? []).map((w) => (w.description ?? "").trim());
    wiesOpisWypelniony =
      opisy.length === villageIds.length && opisy.every((t) => t.length >= MIN_OPISU_WSI);
  }

  const pokazBaner =
    !profilNickOk || !powiazanieZWisiaOk || (jestSoltysem && !wiesOpisWypelniony);

  const lacznieKrokow = jestSoltysem ? 3 : 2;
  let ukonczoneKrokow = 0;
  if (profilNickOk) ukonczoneKrokow += 1;
  if (powiazanieZWisiaOk) ukonczoneKrokow += 1;
  if (jestSoltysem && wiesOpisWypelniony) ukonczoneKrokow += 1;

  return {
    pokazBaner,
    profilNickOk,
    powiazanieZWisiaOk,
    jestSoltysem,
    wiesOpisWypelniony,
    lacznieKrokow,
    ukonczoneKrokow,
  };
}
