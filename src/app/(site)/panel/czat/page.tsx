import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { etykietaPresetu } from "@/lib/czat/grupy-preset";
import { pobierzNieprzeczytanePoKonwersacji } from "@/lib/czat/pobierz-nieprzeczytane";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { CzatListaGrupKlient } from "./czat-lista-grup-klient";

export const metadata: Metadata = { title: "Wiadomości" };

export default async function CzatPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/czat");

  const { data: czlonkostwa } = await supabase
    .from("chat_members")
    .select(
      "conversation_id, last_read_at, chat_conversations(id, title, kind, group_preset, village_id, listing_id, updated_at, villages(name))",
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const wsie = (roleRows ?? []).map((r) => {
    const v = Array.isArray(r.villages) ? r.villages[0] : r.villages;
    return { id: r.village_id, name: (v as { name: string } | null)?.name ?? "Wieś" };
  });

  type KonwersacjaJoin = {
    id: string;
    title: string | null;
    kind: string;
    group_preset: string | null;
    village_id: string;
    listing_id: string | null;
    updated_at: string;
    villages: { name: string } | { name: string }[] | null;
  };

  const lista = (czlonkostwa ?? []).map((c) => {
    const conv = (Array.isArray(c.chat_conversations)
      ? c.chat_conversations[0]
      : c.chat_conversations) as KonwersacjaJoin | null;
    if (!conv) return null;
    const v = Array.isArray(conv.villages) ? conv.villages[0] : conv.villages;
    const tytul =
      conv.title ??
      (conv.kind === "group" ? etykietaPresetu(conv.group_preset) : conv.listing_id ? "Ogłoszenie" : "Rozmowa");
    return {
      id: conv.id,
      tytul,
      wies: v?.name ?? "",
      kind: conv.kind,
      preset: conv.group_preset,
      updated_at: conv.updated_at,
    };
  }).filter((x): x is NonNullable<typeof x> => x != null);

  lista.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));

  const nieprzeczytane = await pobierzNieprzeczytanePoKonwersacji(supabase, user.id);

  return (
    <main>
      <p className="text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Panel
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-3xl text-green-950">Wiadomości</h1>
      <p className="mt-2 text-sm text-stone-600">
        Czat jak w komunikatorze — rozmowy przy ogłoszeniach, grupy mieszkańców, KGW, myśliwi, OSP.
      </p>

      <CzatListaGrupKlient wsie={wsie} />

      {lista.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600">Brak rozmów — dołącz do grupy powyżej lub napisz z ogłoszenia na rynku.</p>
      ) : (
        <ul className="mt-6 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
          {lista.map((k) => (
            <li key={k.id}>
              <Link
                href={`/panel/czat/${k.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">{k.tytul}</p>
                  <p className="text-xs text-stone-500">
                    {k.wies}
                    {k.kind === "group" ? " · grupa" : " · rozmowa"}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  {(nieprzeczytane[k.id] ?? 0) > 0 ? (
                    <span className="rounded-full bg-green-800 px-2 py-0.5 text-[10px] font-bold text-white">
                      {nieprzeczytane[k.id]}
                    </span>
                  ) : null}
                  <span className="text-xs text-stone-400">
                    {new Date(k.updated_at).toLocaleDateString("pl-PL")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
