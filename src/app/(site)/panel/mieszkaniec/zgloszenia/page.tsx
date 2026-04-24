import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { etykietkiSzybkich, etykietaStanuZgloszenia, kategorieZgloszen } from "@/lib/zgloszenia/szybkie-etykiety";
import { ZgloszeniaFormularzKlient } from "./zgloszenia-formularz-klient";

export const metadata: Metadata = {
  title: "Zgłoszenia",
};

const roleAktywneMieszkaniec = [
  "mieszkaniec",
  "soltys",
  "wspoladmin",
  "reprezentant_podmiotu",
] as const;

export default async function MieszkaniecZgloszeniaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec/zgloszenia");
  }

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, role, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [...roleAktywneMieszkaniec]);

  const wiesZMapy = new Map<string, string>();
  for (const r of roleRows ?? []) {
    const v = pojedynczaWies<{ name: string }>(r.villages);
    if (r.village_id && v?.name) wiesZMapy.set(r.village_id, v.name);
  }
  const wiesOpcje = Array.from(wiesZMapy.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pl"));

  const { data: zgloszeniaRaw } = await supabase
    .from("issues")
    .select(
      "id, title, description, category, status, is_urgent, created_at, observed_at, location_text, image_urls, quick_flags, resolution_note, villages(name)"
    )
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);

  const zgloszenia = (zgloszeniaRaw ?? []) as {
    id: string;
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
    villages: { name: string } | { name: string }[] | null;
  }[];

  const etykietKat = (c: string) => kategorieZgloszen.find((x) => x.value === c)?.label ?? c;

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Zgłoszenia problemów</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
        Opisz usterkę, dodaj szybkie zaznaczenia, opcjonalnie <strong>datę i godzinę zauważenia</strong> oraz do sześciu
        zdjęć. Sołtys widzi zgłoszenie w swoim panelu; Ty widzisz tylko status — szczegóły rozpatrywania po stronie
        władz sołectwa.
      </p>

      <ZgloszeniaFormularzKlient wiesOpcje={wiesOpcje} uzytkownik={{ id: user.id }} />

      <section className="mt-12" aria-label="Moje zgłoszenia">
        <h2 className="font-serif text-xl text-green-950">Moje ostatnie zgłoszenia</h2>
        {zgloszenia.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Jeszcze brak wysłanych zgłoszeń z tego konta.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {zgloszenia.map((z) => {
              const wNazwa = pojedynczaWies<{ name: string }>(z.villages)?.name ?? "Wieś";
              const szybkie = etykietkiSzybkich(z.quick_flags);
              return (
                <li key={z.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-xs text-stone-500">
                    {wNazwa} · {etykietKat(z.category)} · wysłano {new Date(z.created_at).toLocaleString("pl-PL")}
                  </p>
                  <p className="mt-1 font-medium text-stone-900">
                    {z.is_urgent ? <span className="text-amber-800">[pilne] </span> : null}
                    {z.title}
                  </p>
                  <p className="text-sm text-stone-800">{z.description}</p>
                  {z.location_text ? (
                    <p className="mt-1 text-sm text-stone-600">Miejsce: {z.location_text}</p>
                  ) : null}
                  {z.observed_at ? (
                    <p className="mt-1 text-xs text-stone-500">
                      Zauważono: {new Date(z.observed_at).toLocaleString("pl-PL")} (wg formularza)
                    </p>
                  ) : null}
                  {szybkie.length > 0 ? (
                    <p className="mt-2 text-xs text-stone-600">Oznaczenia: {szybkie.join(" · ")}</p>
                  ) : null}
                  {z.image_urls && z.image_urls.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {z.image_urls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="h-20 w-20 rounded border border-stone-200 object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm text-green-900">
                    Status: <strong>{etykietaStanuZgloszenia(z.status)}</strong>
                  </p>
                  {z.resolution_note ? (
                    <p className="mt-1 text-sm text-stone-600">Notatka: {z.resolution_note}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-stone-500">
        Sołtys rozpatruje w{" "}
        <Link href="/panel/soltys/zgloszenia" className="text-green-800 underline">
          panelu sołtysa
        </Link>
        .
      </p>
    </main>
  );
}
