"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikSpolecznosc = { blad: string } | { ok: true; komunikat?: string };

const ZAKAZANE_SLOWA = [
  "idiot",
  "debil",
  "kretyn",
  "spierdal",
  "wypierdal",
  "kurw",
  "chuj",
  "pizd",
] as const;
const MAX_LINKOW_W_TEKSCIE = 2;
const MIN_ODSTEP_KOMENTARZA_SEK = 20;

function normalizujTekst(tresc: string): string {
  return tresc.trim().replace(/\s+/g, " ");
}

function policzLinki(tresc: string): number {
  return (tresc.match(/https?:\/\/|www\./gi) ?? []).length;
}

function zawieraZakazaneSlowa(tresc: string): boolean {
  const tekst = tresc.toLowerCase();
  return ZAKAZANE_SLOWA.some((rdzen) => tekst.includes(rdzen));
}

function wygladaJakKrzykLubSpam(tresc: string): boolean {
  const czyste = tresc.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, "");
  if (czyste.length < 20) return false;
  const wielkie = czyste.replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g, "").length;
  return wielkie / czyste.length >= 0.75;
}

function sprawdzBezpieczenstwoTresci(tresc: string): string | null {
  const tekst = normalizujTekst(tresc);
  if (policzLinki(tekst) > MAX_LINKOW_W_TEKSCIE) {
    return "Za dużo linków w jednej wiadomości. Ogranicz do 2.";
  }
  if (zawieraZakazaneSlowa(tekst)) {
    return "Treść zawiera obraźliwe słowa. Popraw i spróbuj ponownie.";
  }
  if (wygladaJakKrzykLubSpam(tekst)) {
    return "Treść wygląda jak spam/krzyk (zbyt dużo WIELKICH LITER).";
  }
  return null;
}

async function policzAkcjeOdCzasu(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  tabela: string,
  userField: string,
  userId: string,
  minuty: number,
): Promise<number> {
  const od = new Date(Date.now() - minuty * 60 * 1000).toISOString();
  const { count } = await supabase
    .from(tabela)
    .select("id", { count: "exact", head: true })
    .eq(userField, userId)
    .gte("created_at", od);
  return count ?? 0;
}

async function sprawdzLimit(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  tabela: string,
  userField: string,
  userId: string,
  minuty: number,
  limit: number,
  komunikat: string,
): Promise<string | null> {
  const ile = await policzAkcjeOdCzasu(supabase, tabela, userField, userId, minuty);
  if (ile >= limit) return komunikat;
  return null;
}

async function policzPunktyNaruszenAutora(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  userId: string,
): Promise<number> {
  const od30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [wHidden, kHidden, bRejected] = await Promise.all([
    supabase
      .from("village_discussion_threads")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId)
      .eq("status", "hidden")
      .gte("updated_at", od30),
    supabase
      .from("village_discussion_comments")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId)
      .eq("status", "hidden")
      .gte("updated_at", od30),
    supabase
      .from("village_blog_posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId)
      .eq("status", "rejected")
      .gte("updated_at", od30),
  ]);
  return (wHidden.count ?? 0) + (kHidden.count ?? 0) + (bRejected.count ?? 0);
}

function wyliczPoziomOgraniczen(punktyNaruszen: number): "none" | "medium" | "high" | "blocked" {
  if (punktyNaruszen >= 8) return "blocked";
  if (punktyNaruszen >= 5) return "high";
  if (punktyNaruszen >= 3) return "medium";
  return "none";
}

async function czyMaDostepDoWsi(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  userId: string,
  villageId: string,
): Promise<boolean> {
  const [{ data: rola }, { data: follow }] = await Promise.all([
    supabase
      .from("user_village_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("village_id", villageId)
      .eq("status", "active")
      .in("role", ["mieszkaniec", "soltys", "wspoladmin", "osp_naczelnik", "kgw_przewodniczaca", "rada_solecka"])
      .maybeSingle(),
    supabase.from("user_follows").select("id").eq("user_id", userId).eq("village_id", villageId).maybeSingle(),
  ]);
  return Boolean(rola || follow);
}

const schemaNowyWatek = z.object({
  villageId: z.string().uuid(),
  title: z.string().trim().min(5).max(180),
  body: z.string().trim().min(20).max(12000),
  category: z.string().trim().min(2).max(80).default("ogolne"),
});

export async function dodajWatekDyskusjiMieszkanca(
  dane: z.infer<typeof schemaNowyWatek>,
): Promise<WynikSpolecznosc> {
  const parsed = schemaNowyWatek.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź tytuł i treść wątku." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  if (!(await czyMaDostepDoWsi(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak dostępu do tej wsi." };
  }
  const punktyNaruszen = await policzPunktyNaruszenAutora(supabase, user.id);
  const poziom = wyliczPoziomOgraniczen(punktyNaruszen);
  if (poziom === "blocked") {
    return { blad: "Publikacja chwilowo zablokowana po wielu naruszeniach zasad. Spróbuj ponownie za kilka dni." };
  }
  const trescErr = sprawdzBezpieczenstwoTresci(`${parsed.data.title}\n${parsed.data.body}`);
  if (trescErr) return { blad: trescErr };

  const limitErr = await sprawdzLimit(
    supabase,
    "village_discussion_threads",
    "author_id",
    user.id,
    60,
    poziom === "high" ? 1 : poziom === "medium" ? 2 : 3,
    poziom === "none"
      ? "Limit wątków: maksymalnie 3 na godzinę."
      : "Masz tymczasowo zaostrzone limity publikacji przez wcześniejsze naruszenia.",
  );
  if (limitErr) return { blad: limitErr };

  const przedChwila = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: duplikat } = await supabase
    .from("village_discussion_threads")
    .select("id")
    .eq("author_id", user.id)
    .eq("village_id", parsed.data.villageId)
    .eq("title", parsed.data.title)
    .gte("created_at", przedChwila)
    .maybeSingle();
  if (duplikat) {
    return { blad: "Podobny wątek już został właśnie dodany. Unikaj duplikatów." };
  }

  const { error } = await supabase.from("village_discussion_threads").insert({
    village_id: parsed.data.villageId,
    author_id: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    category: parsed.data.category.toLowerCase(),
    visibility: "village",
    status: "open",
  });

  if (error) {
    console.error("[dodajWatekDyskusjiMieszkanca]", error.message);
    return { blad: "Nie udało się dodać wątku." };
  }

  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true, komunikat: "Wątek został opublikowany." };
}

const schemaKomentarz = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(2).max(4000),
  parentCommentId: z.string().uuid().optional().nullable(),
});

export async function dodajKomentarzDyskusjiMieszkanca(
  dane: z.infer<typeof schemaKomentarz>,
): Promise<WynikSpolecznosc> {
  const parsed = schemaKomentarz.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź treść komentarza." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: watek } = await supabase
    .from("village_discussion_threads")
    .select("id, village_id, status")
    .eq("id", parsed.data.threadId)
    .maybeSingle();
  if (!watek) return { blad: "Nie znaleziono wątku." };
  if (watek.status !== "open") return { blad: "Ten wątek jest już zamknięty." };
  if (!(await czyMaDostepDoWsi(supabase, user.id, watek.village_id))) {
    return { blad: "Brak dostępu do tej wsi." };
  }
  const punktyNaruszen = await policzPunktyNaruszenAutora(supabase, user.id);
  const poziom = wyliczPoziomOgraniczen(punktyNaruszen);
  if (poziom === "blocked") {
    return { blad: "Komentowanie chwilowo zablokowane po wielu naruszeniach zasad." };
  }
  const trescErr = sprawdzBezpieczenstwoTresci(parsed.data.body);
  if (trescErr) return { blad: trescErr };

  const limitErr = await sprawdzLimit(
    supabase,
    "village_discussion_comments",
    "author_id",
    user.id,
    10,
    poziom === "high" ? 4 : poziom === "medium" ? 7 : 12,
    poziom === "none"
      ? "Limit komentarzy: maksymalnie 12 na 10 minut."
      : "Masz tymczasowo zaostrzone limity komentarzy przez wcześniejsze naruszenia.",
  );
  if (limitErr) return { blad: limitErr };

  const { data: ostatniKomentarz } = await supabase
    .from("village_discussion_comments")
    .select("id, created_at, body")
    .eq("author_id", user.id)
    .eq("thread_id", parsed.data.threadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ostatniKomentarz?.created_at) {
    const roznicaSek = (Date.now() - new Date(ostatniKomentarz.created_at).getTime()) / 1000;
    const cooldownSek = poziom === "high" ? 90 : poziom === "medium" ? 45 : MIN_ODSTEP_KOMENTARZA_SEK;
    if (roznicaSek < cooldownSek) {
      return { blad: `Poczekaj ${Math.ceil(cooldownSek - roznicaSek)} s przed kolejnym komentarzem.` };
    }
    if (normalizujTekst(ostatniKomentarz.body ?? "") === normalizujTekst(parsed.data.body)) {
      return { blad: "To wygląda na duplikat poprzedniego komentarza." };
    }
  }

  const { error } = await supabase.from("village_discussion_comments").insert({
    thread_id: parsed.data.threadId,
    village_id: watek.village_id,
    author_id: user.id,
    body: parsed.data.body,
    parent_comment_id: parsed.data.parentCommentId ?? null,
    status: "visible",
  });
  if (error) {
    console.error("[dodajKomentarzDyskusjiMieszkanca]", error.message);
    return { blad: "Nie udało się dodać komentarza." };
  }

  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true, komunikat: "Komentarz został dodany." };
}

const schemaGlos = z.object({
  threadId: z.string().uuid(),
  vote: z.union([z.literal(-1), z.literal(1)]),
});

export async function glosujWatekDyskusjiMieszkanca(
  dane: z.infer<typeof schemaGlos>,
): Promise<WynikSpolecznosc> {
  const parsed = schemaGlos.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawny głos." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: watek } = await supabase
    .from("village_discussion_threads")
    .select("id, village_id")
    .eq("id", parsed.data.threadId)
    .maybeSingle();
  if (!watek) return { blad: "Nie znaleziono wątku." };
  if (!(await czyMaDostepDoWsi(supabase, user.id, watek.village_id))) {
    return { blad: "Brak dostępu do tej wsi." };
  }

  const { error } = await supabase.from("village_discussion_votes").upsert(
    {
      thread_id: parsed.data.threadId,
      user_id: user.id,
      vote: parsed.data.vote,
    },
    { onConflict: "thread_id,user_id" },
  );
  if (error) {
    console.error("[glosujWatekDyskusjiMieszkanca]", error.message);
    return { blad: "Nie udało się zapisać głosu." };
  }

  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true };
}

const schemaRaport = z.object({
  villageId: z.string().uuid(),
  contentType: z.enum(["thread", "comment", "blog_post"]),
  contentId: z.string().uuid(),
  reason: z.string().trim().min(3).max(120),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function zglosTrescSpolecznosciMieszkanca(
  dane: z.infer<typeof schemaRaport>,
): Promise<WynikSpolecznosc> {
  const parsed = schemaRaport.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź dane zgłoszenia." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  const punktyNaruszen = await policzPunktyNaruszenAutora(supabase, user.id);
  const poziom = wyliczPoziomOgraniczen(punktyNaruszen);
  if (poziom === "blocked") {
    return { blad: "Zgłaszanie treści chwilowo zablokowane po wielu naruszeniach." };
  }
  const limitErr = await sprawdzLimit(
    supabase,
    "village_content_reports",
    "reporter_id",
    user.id,
    24 * 60,
    poziom === "high" ? 3 : poziom === "medium" ? 6 : 10,
    poziom === "none"
      ? "Limit zgłoszeń: maksymalnie 10 na dobę."
      : "Masz tymczasowo zaostrzone limity zgłoszeń przez wcześniejsze naruszenia.",
  );
  if (limitErr) return { blad: limitErr };

  let villageIdDocelowe = parsed.data.villageId;
  if (parsed.data.contentType === "thread") {
    const { data } = await supabase
      .from("village_discussion_threads")
      .select("village_id")
      .eq("id", parsed.data.contentId)
      .maybeSingle();
    if (!data) return { blad: "Nie znaleziono zgłaszanego wątku." };
    villageIdDocelowe = data.village_id;
  } else if (parsed.data.contentType === "comment") {
    const { data } = await supabase
      .from("village_discussion_comments")
      .select("village_id")
      .eq("id", parsed.data.contentId)
      .maybeSingle();
    if (!data) return { blad: "Nie znaleziono zgłaszanego komentarza." };
    villageIdDocelowe = data.village_id;
  } else {
    const { data } = await supabase
      .from("village_blog_posts")
      .select("village_id")
      .eq("id", parsed.data.contentId)
      .maybeSingle();
    if (!data) return { blad: "Nie znaleziono zgłaszanego wpisu bloga." };
    villageIdDocelowe = data.village_id;
  }

  if (!(await czyMaDostepDoWsi(supabase, user.id, villageIdDocelowe))) {
    return { blad: "Brak dostępu do tej wsi." };
  }

  const { data: juzJest } = await supabase
    .from("village_content_reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("content_type", parsed.data.contentType)
    .eq("content_id", parsed.data.contentId)
    .eq("status", "open")
    .maybeSingle();
  if (juzJest) {
    return { blad: "To zgłoszenie jest już otwarte. Poczekaj na decyzję moderacji." };
  }

  const { error } = await supabase.from("village_content_reports").insert({
    village_id: villageIdDocelowe,
    reporter_id: user.id,
    content_type: parsed.data.contentType,
    content_id: parsed.data.contentId,
    reason: parsed.data.reason,
    note: parsed.data.note?.trim() || null,
    status: "open",
  });
  if (error) {
    console.error("[zglosTrescSpolecznosciMieszkanca]", error.message);
    return { blad: "Nie udało się wysłać zgłoszenia." };
  }

  const { count: ileOtwartych } = await supabase
    .from("village_content_reports")
    .select("id", { count: "exact", head: true })
    .eq("content_type", parsed.data.contentType)
    .eq("content_id", parsed.data.contentId)
    .eq("status", "open");

  if ((ileOtwartych ?? 0) >= 3) {
    if (parsed.data.contentType === "thread") {
      await supabase
        .from("village_discussion_threads")
        .update({ status: "hidden", moderation_note: "Auto-ukrycie po >=3 otwartych zgłoszeniach." })
        .eq("id", parsed.data.contentId);
    } else if (parsed.data.contentType === "comment") {
      await supabase
        .from("village_discussion_comments")
        .update({ status: "hidden", moderation_note: "Auto-ukrycie po >=3 otwartych zgłoszeniach." })
        .eq("id", parsed.data.contentId);
    } else {
      await supabase
        .from("village_blog_posts")
        .update({ status: "pending", moderation_note: "Wstrzymane automatycznie po wielu zgłoszeniach." })
        .eq("id", parsed.data.contentId);
    }
  }

  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true, komunikat: "Zgłoszenie wysłane do moderacji." };
}

const schemaBlogMieszkanca = z.object({
  villageId: z.string().uuid(),
  title: z.string().trim().min(5).max(180),
  body: z.string().trim().min(30).max(60000),
  slug: z.string().trim().min(3).max(140).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().max(500).optional().nullable(),
  tagsCsv: z.string().trim().max(500).optional().default(""),
});

export async function dodajWpisBlogaMieszkanca(
  dane: z.infer<typeof schemaBlogMieszkanca>,
): Promise<WynikSpolecznosc> {
  const parsed = schemaBlogMieszkanca.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź poprawność danych wpisu blogowego." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyMaDostepDoWsi(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak dostępu do tej wsi." };
  }
  const punktyNaruszen = await policzPunktyNaruszenAutora(supabase, user.id);
  const poziom = wyliczPoziomOgraniczen(punktyNaruszen);
  if (poziom === "blocked") {
    return { blad: "Publikacja bloga chwilowo zablokowana po wielu naruszeniach." };
  }
  const trescErr = sprawdzBezpieczenstwoTresci(
    `${parsed.data.title}\n${parsed.data.excerpt ?? ""}\n${parsed.data.body}`,
  );
  if (trescErr) return { blad: trescErr };

  const limitErr = await sprawdzLimit(
    supabase,
    "village_blog_posts",
    "author_id",
    user.id,
    24 * 60,
    poziom === "high" ? 1 : 2,
    poziom === "none"
      ? "Limit wpisów bloga: maksymalnie 2 na dobę."
      : "Masz tymczasowo zaostrzone limity wpisów przez wcześniejsze naruszenia.",
  );
  if (limitErr) return { blad: limitErr };

  const { data: profil } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const tags = parsed.data.tagsCsv
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 16);

  const { data: blogger, error: bloggerErr } = await supabase
    .from("village_bloggers")
    .upsert(
      {
        village_id: parsed.data.villageId,
        user_id: user.id,
        display_name: (profil?.display_name ?? "").trim() || "Mieszkaniec",
        is_active: true,
      },
      { onConflict: "village_id,user_id" },
    )
    .select("id")
    .single();

  if (bloggerErr || !blogger?.id) {
    console.error("[dodajWpisBlogaMieszkanca] blogger", bloggerErr?.message);
    return { blad: "Nie udało się przygotować profilu autora." };
  }

  const { error } = await supabase.from("village_blog_posts").insert({
    village_id: parsed.data.villageId,
    blogger_id: blogger.id,
    author_id: user.id,
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt?.trim() || null,
    body: parsed.data.body,
    tags,
    status: "pending",
  });

  if (error) {
    console.error("[dodajWpisBlogaMieszkanca]", error.message);
    return { blad: "Nie udało się dodać wpisu do moderacji." };
  }

  revalidatePath("/panel/mieszkaniec/spolecznosc");
  revalidatePath("/panel/soltys/spolecznosc");
  return { ok: true, komunikat: "Wpis dodany. Czeka na moderację sołtysa." };
}

export async function usunGlosWatekDyskusjiMieszkanca(threadId: string): Promise<WynikSpolecznosc> {
  const id = uuid.safeParse(threadId);
  if (!id.success) return { blad: "Niepoprawny identyfikator wątku." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { error } = await supabase
    .from("village_discussion_votes")
    .delete()
    .eq("thread_id", id.data)
    .eq("user_id", user.id);
  if (error) {
    console.error("[usunGlosWatekDyskusjiMieszkanca]", error.message);
    return { blad: "Nie udało się usunąć głosu." };
  }

  revalidatePath("/panel/mieszkaniec/spolecznosc");
  return { ok: true };
}
