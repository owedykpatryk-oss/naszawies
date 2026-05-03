import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { MieszkaniecKlient } from "./mieszkaniec-klient";

function klasyStatusu(status: string): string {
  if (status === "active") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (status === "pending") return "border-amber-300 bg-amber-50 text-amber-900";
  if (status === "suspended") return "border-rose-300 bg-rose-50 text-rose-900";
  return "border-stone-300 bg-stone-50 text-stone-700";
}

export const metadata: Metadata = {
  title: "Panel mieszkańca",
};

export default async function MieszkaniecPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec");
  }

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select(
      "id, role, status, created_at, village_id, villages (name, slug, voivodeship, county, commune)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const roleList = (roleRows ?? []).map((r) => {
    const v = pojedynczaWies<{
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    }>(r.villages);
    return {
      id: r.id,
      rola: r.role,
      status: r.status,
      created_at: r.created_at,
      wies: v?.name ?? "—",
      sciezkaWsi: v ? sciezkaProfiluWsi(v) : null,
    };
  });
  const { count: nieprzeczytaneCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  const aktywneRole = roleList.filter((r) => r.status === "active").length;
  const oczekujaceRole = roleList.filter((r) => r.status === "pending").length;
  const maRoleSoltys = roleList.some((r) => r.rola === "soltys" || r.rola === "wspoladmin");

  const aktywneWsieDlaRelacji = (roleRows ?? [])
    .filter((r) => r.status === "active")
    .map((r) => ({
      village_id: r.village_id,
      village: pojedynczaWies<{ county: string; voivodeship: string }>(r.villages),
    }))
    .filter((x) => x.village != null);

  if (aktywneWsieDlaRelacji.length > 0) {
    const defaults = aktywneWsieDlaRelacji.flatMap((x) => {
      const county = x.village?.county ?? "";
      const voivodeship = x.village?.voivodeship ?? "";
      return [
        {
          user_id: user.id,
          village_id: x.village_id,
          relation_key: "powiat_default",
          title: "Do miasta powiatowego",
          target_label: county ? `Powiat ${county}` : "Miasto powiatowe",
          is_active: true,
        },
        {
          user_id: user.id,
          village_id: x.village_id,
          relation_key: "wojewodztwo_default",
          title: "Do miasta wojewódzkiego",
          target_label: voivodeship ? `Woj. ${voivodeship}` : "Miasto wojewódzkie",
          is_active: true,
        },
      ];
    });
    await supabase.from("user_transport_favorite_relations").upsert(defaults, {
      onConflict: "user_id,village_id,relation_key",
      ignoreDuplicates: true,
    });
  }

  const { data: ulubioneRelacjeRaw } = await supabase
    .from("user_transport_favorite_relations")
    .select("id, village_id, title, target_label, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  const ulubioneRelacje = (ulubioneRelacjeRaw ?? []) as {
    id: string;
    village_id: string;
    title: string;
    target_label: string | null;
    is_active: boolean;
  }[];

  return (
    <main>
      <h1 className="tytul-sekcji-panelu">Mieszkaniec</h1>
      <p className="mt-2 text-sm text-stone-600">
        Twoje role we wsiach, wnioski i obserwowane miejscowości. Publiczny profil:{" "}
        <Link href={`/u/${user.id}`} className="font-medium text-green-800 underline">
          /u/{user.id.slice(0, 8)}…
        </Link>
      </p>
      <p className="mt-1 text-sm text-stone-600">
        Nie wiesz od czego zacząć? Wejdź w{" "}
        <Link href="/panel/mieszkaniec/pomoc" className="text-green-800 underline">
          pomoc krok po kroku
        </Link>
        .
      </p>

      <section className="mt-8 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/50 via-white to-emerald-50/30 p-4 sm:p-5">
        <h2 className="font-serif text-lg text-green-950">Na co dzień</h2>
        <p className="mt-1 text-xs text-stone-600">Skróty do modułów mieszkańca — jeden klik zamiast szukania w menu.</p>
        <div className="siatka-kafli-responsywna mt-4">
          <Link
            href="/panel/mieszkaniec/ogloszenia"
            className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
          >
            <span className="font-semibold text-green-950">Ogłoszenia</span>
            <span className="mt-1 block text-xs text-stone-600">Lokalne ogłoszenia i informacje z Twojej okolicy.</span>
          </Link>
          <Link
            href="/panel/mieszkaniec/lista-zakupow"
            className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
          >
            <span className="font-semibold text-green-950">Lista zakupów</span>
            <span className="mt-1 block text-xs text-stone-600">Wspólna lista na KGW i sąsiadów — także na profilu wsi.</span>
          </Link>
          <Link
            href="/panel/mieszkaniec/swietlica"
            className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
          >
            <span className="font-semibold text-green-950">Świetlica</span>
            <span className="mt-1 block text-xs text-stone-600">Rezerwacje sali, układ miejsc i prośby o asortyment.</span>
          </Link>
          <Link
            href="/panel/mieszkaniec/zgloszenia"
            className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
          >
            <span className="font-semibold text-green-950">Zgłoszenia</span>
            <span className="mt-1 block text-xs text-stone-600">Zgłoś sprawę do sołtysa lub współadministratora.</span>
          </Link>
          <Link
            href="/panel/mieszkaniec/fotokronika"
            className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md"
          >
            <span className="font-semibold text-green-950">Fotokronika</span>
            <span className="mt-1 block text-xs text-stone-600">Dodawaj zdjęcia z życia wsi i wydarzeń.</span>
          </Link>
          <Link
            href="/panel/powiadomienia"
            className="rounded-xl border border-stone-200 bg-white/95 p-4 text-sm shadow-sm transition hover:border-green-800/25 hover:shadow-md sm:col-span-2"
          >
            <span className="font-semibold text-green-950">Powiadomienia</span>
            <span className="mt-1 block text-xs text-stone-600">
              Odpowiedzi sołtysa, moderacja postów i inne wiadomości z filtrem nieprzeczytanych.
            </span>
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-violet-200/80 bg-violet-50/30 p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">Co dalej? (szybki plan)</h2>
        <p className="mt-1 text-xs text-stone-600">
          Aktywne role: <strong>{aktywneRole}</strong> · Oczekujące: <strong>{oczekujaceRole}</strong>
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-stone-700">
          {aktywneRole === 0 ? (
            <li>Złóż pierwszy wniosek o rolę mieszkańca (sekcja „Dołącz do wsi”).</li>
          ) : (
            <li>Masz aktywną rolę — wejdź do ogłoszeń i ustaw powiadomienia na telefonie.</li>
          )}
          <li>Sprawdź moduł świetlicy i listę zakupów — to najszybsze funkcje do codziennego użycia.</li>
          {maRoleSoltys ? (
            <li>Masz też dostęp sołecki — skróty administracyjne znajdziesz w panelu sołtysa.</li>
          ) : (
            <li>Jeśli jesteś w zarządzie lub KGW, poproś o odpowiednią rolę w systemie.</li>
          )}
        </ol>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
          <span className="rounded-full border border-stone-200 bg-white px-2 py-1">
            Nieprzeczytane powiadomienia: <strong>{nieprzeczytaneCount ?? 0}</strong>
          </span>
          <span className="rounded-full border border-stone-200 bg-white px-2 py-1">
            Role oczekujące: <strong>{oczekujaceRole}</strong>
          </span>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">Ulubione relacje transportowe</h2>
        <p className="mt-1 text-xs text-stone-600">
          Domyślnie dodajemy relacje „do miasta powiatowego” i „do wojewódzkiego” dla Twoich aktywnych wsi.
        </p>
        {ulubioneRelacje.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Brak aktywnych relacji transportowych.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ulubioneRelacje.map((r) => (
              <li key={r.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                <strong>{r.title}</strong>
                {r.target_label ? ` · ${r.target_label}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Moje role we wsiach</h2>
        {roleList.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Brak zapisów — złóż wniosek poniżej.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {roleList.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-stone-900">{r.wies}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-stone-300 bg-stone-50 px-2 py-0.5 text-stone-800">
                      {etykietaRoliWsi(r.rola)}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 ${klasyStatusu(r.status)}`}>{r.status}</span>
                  </div>
                  {r.sciezkaWsi ? (
                    <Link href={r.sciezkaWsi} className="text-xs text-green-800 underline">
                      Profil wsi
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        <MieszkaniecKlient />
      </div>
    </main>
  );
}
