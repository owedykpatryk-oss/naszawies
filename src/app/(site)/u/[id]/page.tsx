import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ok = z.string().uuid().safeParse(params.id);
  if (!ok.success) {
    return { title: "Profil" };
  }
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { title: "Profil użytkownika" };
  }
  const { data } = await supabase.from("users").select("display_name").eq("id", ok.data).maybeSingle();
  return {
    title: data?.display_name ? data.display_name : "Profil użytkownika",
    robots: { index: true, follow: true },
  };
}

export default async function PublicznyProfilUzytkownika({ params }: Props) {
  const id = z.string().uuid().safeParse(params.id);
  if (!id.success) {
    notFound();
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-stone-700">
        <p>Brak konfiguracji publicznej bazy.</p>
      </main>
    );
  }

  const { data: u, error } = await supabase
    .from("users")
    .select("display_name, avatar_url, bio, phone, phone_visible_public, account_status")
    .eq("id", id.data)
    .maybeSingle();

  if (error || !u || u.account_status !== "active") {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <div className="flex flex-col gap-6 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm sm:flex-row">
        <div className="mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border border-stone-200 bg-stone-100 sm:mx-0">
          {u.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl text-stone-400">?</div>
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="font-serif text-2xl text-green-950">{u.display_name}</h1>
          {u.bio ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{u.bio}</p> : null}
          {u.phone_visible_public && u.phone ? (
            <p className="mt-4 text-sm text-stone-600">
              Telefon: <a href={`tel:${u.phone}`}>{u.phone}</a>
            </p>
          ) : null}
          <p className="mt-6 text-xs text-stone-500">
            Profil publiczny naszawies.pl · numer telefonu tylko przy zgodzie użytkownika (RODO).
          </p>
        </div>
      </div>
    </main>
  );
}
