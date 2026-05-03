import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { FotokronikaDodajKlient } from "./fotokronika-dodaj-klient";
import { FotokronikaUsunKlient } from "./fotokronika-usun-klient";

export const metadata: Metadata = {
  title: "Fotokronika",
};

const ROLA_FOTOKRONIKA = ["mieszkaniec", "soltys", "wspoladmin", "reprezentant_podmiotu"] as const;

const ETYKIETA_STATUSU: Record<string, string> = {
  pending: "Oczekuje na moderację",
  approved: "Zatwierdzone",
  rejected: "Odrzucone",
};

export default async function MieszkaniecFotokronikaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec/fotokronika");
  }

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [...ROLA_FOTOKRONIKA]);

  const wies = (roleRows ?? [])
    .map((r) => {
      const v = pojedynczaWies<{ name: string }>(r.villages);
      return { id: r.village_id as string, name: v?.name ?? "Wieś" };
    })
    .filter((w) => w.id);

  const vids = wies.map((w) => w.id);
  let albumy: { id: string; title: string; village_id: string }[] = [];
  if (vids.length > 0) {
    const { data: als } = await supabase
      .from("photo_albums")
      .select("id, title, village_id")
      .in("village_id", vids)
      .order("event_date", { ascending: false, nullsFirst: false });
    albumy = (als ?? []) as typeof albumy;
  }

  const { data: mojeZdj } = await supabase
    .from("photos")
    .select("id, url, status, created_at, caption, village_id, villages(name)")
    .eq("uploaded_by", user.id)
    .order("created_at", { ascending: false });

  const wierszeMoje = (mojeZdj ?? []).map((p) => {
    const wn = pojedynczaWies<{ name: string }>(p.villages);
    return {
      id: p.id,
      url: p.url,
      status: p.status,
      etykietStatusu: ETYKIETA_STATUSU[p.status] ?? p.status,
      opis: p.caption,
      wies: wn?.name ?? "—",
      created_at: p.created_at,
    };
  });

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Fotokronika</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Wyślij zdjęcia do wsi (JPEG, PNG, WebP, do 5 MB). Trafiają do moderacji u sołtysa. Publiczna fotokronika:{" "}
        <Link href="/panel/soltys/fotokronika" className="text-green-800 underline">
          panel sołtysa → Fotokronika
        </Link>
        .
      </p>

      <FotokronikaDodajKlient
        wies={wies}
        albumy={albumy}
        uzytkownik={{ id: user.id }}
      />

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Twoje zgłoszenia</h2>
        {wierszeMoje.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Jeszcze nic nie wysłałeś.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {wierszeMoje.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3 sm:flex-row sm:items-start"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="h-24 w-24 shrink-0 rounded-lg border border-stone-200 object-cover"
                />
                <div className="min-w-0 text-sm text-stone-800">
                  <p className="text-xs text-stone-500">
                    {p.wies} · {new Date(p.created_at).toLocaleString("pl-PL")}
                  </p>
                  <p className="mt-0.5 font-medium text-stone-900">{p.etykietStatusu}</p>
                  {p.opis ? <p className="mt-1">{p.opis}</p> : null}
                  {p.status === "pending" ? (
                    <div className="mt-2">
                      <FotokronikaUsunKlient idZdjecia={p.id} />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
