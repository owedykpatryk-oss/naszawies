import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { StudzienkiProjektSwietlicy } from "@/components/wies/studzienki-projekt-swietlicy";
import { WiesPostPubliczny } from "@/components/wies/wies-post-publiczny";
import { pobierzKalendarzZajetosciDlaWsi } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import { WiesProfilPubliczny } from "@/components/wies/wies-profil-publiczny";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { znajdzWiesPoSciezce } from "@/lib/wies/znajdz-wies-po-sciezce";

type Props = { params: { segmenty?: string[] } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = params.segmenty ?? [];
  const supabase = createPublicSupabaseClient();
  if (s.length === 4) {
    if (!supabase) return { title: "Profil wsi" };
    const wies = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
    if (wies) {
      return { title: `${wies.name} — profil wsi`, description: wies.description?.slice(0, 160) ?? undefined };
    }
  }
  if (s.length === 5 && s[4] === "projekt-swietlicy") {
    if (!supabase) return { title: "Projekt świetlicy" };
    const wiesMeta = await znajdzWiesPoSciezce(supabase, s[0], s[1], s[2], s[3]);
    if (wiesMeta?.teryt_id === "0088390") {
      return {
        title: `Projekt świetlicy — ${wiesMeta.name}`,
        description:
          "Rozbudowa i przebudowa świetlicy wiejskiej w Studzienkach: rzut parteru, zestawienie pomieszczeń, elewacje i kolorystyka.",
      };
    }
  }
  if (s.length === 6 && s[4] === "ogloszenie") {
    const id = z.string().uuid().safeParse(s[5]);
    if (id.success) {
      if (!supabase) return { title: "Ogłoszenie" };
      const { data: post } = await supabase
        .from("posts")
        .select("title, village_id")
        .eq("id", id.data)
        .maybeSingle();
      if (post?.title) {
        return { title: `${post.title} — ogłoszenie` };
      }
    }
  }
  return { title: "Profil wsi" };
}

export default async function WiesCatchAllPage({ params }: Props) {
  const segmenty = params.segmenty ?? [];

  if (segmenty.length < 4) {
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Niepełny adres strony wsi</h1>
        <p className="mt-2 text-stone-600">
          Użyj pełnego linku do wsi (np. ze strony wyników wyszukiwania albo z paska przeglądarki, gdy już jesteś na
          stronie sołectwa). Adres zawiera województwo, powiat, gminę i skróconą nazwę wsi.
        </p>
        <p className="mt-4 text-sm text-stone-600">
          <Link href="/szukaj" className="text-green-800 underline">
            Wyszukaj miejscowość
          </Link>
        </p>
      </main>
    );
  }

  const [woj, powiat, gmina, slug, ...reszta] = segmenty;
  if (!woj || !powiat || !gmina || !slug) {
    notFound();
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Strona chwilowo niedostępna</h1>
        <p className="mt-2 text-sm text-stone-600">
          Nie udało się załadować danych. Spróbuj ponownie za chwilę albo wróć na stronę główną.
        </p>
      </main>
    );
  }

  const wies = await znajdzWiesPoSciezce(supabase, woj, powiat, gmina, slug);
  if (!wies) {
    notFound();
  }

  if (reszta.length === 0) {
    const { data: postyRaw } = await supabase
      .from("posts")
      .select("id, title, type, created_at")
      .eq("village_id", wies.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(25);

    const posty = (postyRaw ?? []) as { id: string; title: string; type: string; created_at: string }[];

    const kalendarz = wies.is_active ? await pobierzKalendarzZajetosciDlaWsi(supabase, wies.id) : [];

    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-6 text-sm text-stone-500">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
          {" · "}
          <Link href="/mapa" className="text-green-800 underline">
            Mapa wsi
          </Link>
        </p>
        <WiesProfilPubliczny wies={wies} posty={posty} kalendarzZajetosci={kalendarz} />
      </main>
    );
  }

  if (reszta.length === 1 && reszta[0] === "projekt-swietlicy") {
    if (wies.teryt_id !== "0088390") {
      notFound();
    }
    const sciezka = sciezkaProfiluWsi(wies);
    return (
      <main className="mx-auto min-w-0 max-w-5xl py-12 sm:py-16 text-stone-800">
        <StudzienkiProjektSwietlicy sciezkaWsi={sciezka} nazwaWsi={wies.name} />
      </main>
    );
  }

  if (reszta.length === 2 && reszta[0] === "ogloszenie") {
    const idPosta = z.string().uuid().safeParse(reszta[1]);
    if (!idPosta.success) {
      notFound();
    }

    const { data: post, error } = await supabase
      .from("posts")
      .select("id, title, type, body, created_at, village_id, status")
      .eq("id", idPosta.data)
      .maybeSingle();

    if (error || !post || post.village_id !== wies.id) {
      notFound();
    }

    const sciezka = sciezkaProfiluWsi(wies);

    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <WiesPostPubliczny
          tytul={post.title}
          typ={post.type}
          utworzono={post.created_at}
          tresc={post.body}
          sciezkaWsi={sciezka}
          nazwaWsi={wies.name}
        />
      </main>
    );
  }

  const podstrona = reszta.join(" / ");
  return (
    <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
      <p className="mb-4 text-sm text-stone-500">
        <Link href={sciezkaProfiluWsi(wies)} className="text-green-800 underline">
          ← {wies.name}
        </Link>
      </p>
      <h1 className="font-serif text-2xl text-green-950">{wies.name}</h1>
      <p className="mt-4 text-stone-700">
        Sekcja <strong>{podstrona}</strong> — moduł w przygotowaniu.
      </p>
    </main>
  );
}
