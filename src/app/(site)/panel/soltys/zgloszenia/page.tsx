import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { type WierszZgloszenia, SoltysZgloszeniaKlient } from "./soltys-zgloszenia-klient";

export const metadata: Metadata = {
  title: "Zgłoszenia (sołtys)",
};

export default async function SoltysZgloszeniaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/zgloszenia");
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <main>
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/panel/soltys" className="text-green-800 underline">
            ← Panel sołtysa
          </Link>
        </p>
        <h1 className="tytul-sekcji-panelu">Zgłoszenia i usterki</h1>
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie masz uprawnień do żadnej wsi w tej roli.
        </p>
      </main>
    );
  }

  const { data: raw, error } = await supabase
    .from("issues")
    .select(
      "id, village_id, title, description, category, status, is_urgent, created_at, observed_at, location_text, image_urls, quick_flags, resolution_note, reporter_id, villages(name)"
    )
    .in("village_id", villageIds)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("[SoltysZgloszeniaPage]", error.message);
  }

  const wierszow = (raw ?? []) as {
    id: string;
    village_id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    is_urgent: boolean;
    created_at: string;
    observed_at: string | null;
    location_text: string | null;
    image_urls: string[] | null;
    quick_flags: Record<string, unknown> | null;
    resolution_note: string | null;
    reporter_id: string | null;
    villages: { name: string } | { name: string }[] | null;
  }[];

  const idsRep = Array.from(
    new Set(wierszow.map((r) => r.reporter_id).filter((x): x is string => x != null))
  );
  const imiona: Record<string, string> = {};
  if (idsRep.length > 0) {
    const { data: users } = await supabase.from("users").select("id, display_name").in("id", idsRep);
    for (const u of users ?? []) {
      imiona[u.id] = u.display_name;
    }
  }

  const wiersze: WierszZgloszenia[] = wierszow.map((r) => ({
    id: r.id,
    village_id: r.village_id,
    title: r.title,
    description: r.description,
    category: r.category,
    status: r.status,
    is_urgent: r.is_urgent,
    created_at: r.created_at,
    observed_at: r.observed_at,
    location_text: r.location_text,
    image_urls: r.image_urls,
    quick_flags: r.quick_flags,
    resolution_note: r.resolution_note,
    wies_nazwa: pojedynczaWies<{ name: string }>(r.villages)?.name ?? "Wieś",
    zglaszajacy: r.reporter_id
      ? imiona[r.reporter_id] ?? `użytkownik ${r.reporter_id.slice(0, 8)}…`
      : "—",
  }));

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Zgłoszenia i usterki</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
        Widzisz <strong>z kim jest problem</strong> (imię z profilu), dane opisowe, zdjęcia i szybkie zaznaczenia. Na
        publicznych ekranach tych danych nie ma — tylko Ty i zgłaszający widzicie własny wątek w całości, zgodnie z
        uprawnieniami w serwisie.
      </p>
      <SoltysZgloszeniaKlient wiersze={wiersze} />
      <p className="mt-8 text-sm text-stone-500">
        Mieszkaniec składa zgłoszenie w{" "}
        <Link href="/panel/mieszkaniec/zgloszenia" className="text-green-800 underline">
          panelu mieszkańca
        </Link>
        .
      </p>
    </main>
  );
}
