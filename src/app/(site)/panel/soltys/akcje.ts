"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { R2_BUCKET_HALL_INVENTORY } from "@/lib/cloudflare/r2-bucket-znaczniki";
import { wyciagnijBucketIKluczZUrlaR2 } from "@/lib/cloudflare/r2-url-pomoc";
import { usunObiektR2JesliUrlNasz } from "@/lib/storage/usun-plik-r2-po-url";
import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { zaplanujPowiadomienieEmail } from "@/lib/email/zaplanuj-powiadomienie-email";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { powiadomObserwujacychOOpublikowanyPost } from "@/lib/powiadomienia/powiadom-obserwujacych-wies-post";
import { synchronizujKanalyRssDlaWsi } from "@/lib/rss/synchronizuj-kanaly-rss";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { schemaPlanSali, type PlanSaliJson } from "@/lib/swietlica/plan-sali";

const uuid = z.string().uuid();

const ROLE_WNIOSKOW_SOLTYS = new Set([
  "mieszkaniec",
  "osp_naczelnik",
  "kgw_przewodniczaca",
  "rada_solecka",
]);

function zaplanujWebPushDlaUzytkownika(
  userId: string,
  dane: { title: string; body: string; linkUrl?: string | null; tag?: string },
) {
  const admin = createAdminSupabaseClient();
  if (!admin) return;
  void wyslijWebPushDlaUzytkownika(admin, { userId, ...dane }).catch((e) =>
    console.warn("[web-push]", e),
  );
}

export type WynikProsty = { blad: string } | { ok: true };

export async function zatwierdzWniosekMieszkanca(rolaId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(rolaId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wiersz, error: readErr } = await supabase
    .from("user_village_roles")
    .select("user_id, village_id, status, role")
    .eq("id", id.data)
    .maybeSingle();

  if (readErr || !wiersz || wiersz.status !== "pending" || !ROLE_WNIOSKOW_SOLTYS.has(wiersz.role)) {
    return { blad: "Nie znaleziono wniosku lub został już rozpatrzony." };
  }

  const { error: upErr } = await supabase
    .from("user_village_roles")
    .update({
      status: "active",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (upErr) {
    if (upErr.code === "23505") {
      const rola = wiersz.role;
      const msgUnikalna =
        rola === "osp_naczelnik"
          ? "W tej wsi jest już inny aktywny naczelnik OSP — odrzuć ten wniosek albo zmień rolę u dotychczasowej osoby."
          : rola === "kgw_przewodniczaca"
            ? "W tej wsi jest już inna aktywna przewodnicząca KGW."
            : rola === "rada_solecka"
              ? "W tej wsi jest już inna aktywna rola rady sołeckiej."
              : "Nie można aktywować — naruszenie reguły unikalności ról we wsi.";
      return { blad: msgUnikalna };
    }
    console.error("[zatwierdzWniosek]", upErr.message);
    return { blad: "Nie udało się zaakceptować (sprawdź, czy jesteś sołtysem tej wsi)." };
  }

  const rolaEtykieta = etykietaRoliWsi(wiersz.role);
  const tytulNotif =
    wiersz.role === "mieszkaniec" ? "Zaakceptowano wniosek mieszkańca" : `Zaakceptowano: ${rolaEtykieta}`;
  const trescNotif =
    wiersz.role === "mieszkaniec"
      ? "Twoja rola we wsi została aktywowana."
      : `Twoja rola „${rolaEtykieta}” we wsi została aktywowana.`;

  const { error: notifErr } = await supabase.from("notifications").insert({
    user_id: wiersz.user_id,
    type: "role_approved",
    title: tytulNotif,
    body: trescNotif,
    link_url: "/panel/mieszkaniec",
    related_id: wiersz.village_id,
    related_type: "village",
    channel: "in_app",
  });

  if (notifErr) {
    console.warn("[zatwierdzWniosek] powiadomienie:", notifErr.message);
  } else {
    zaplanujWebPushDlaUzytkownika(wiersz.user_id, {
      title: tytulNotif,
      body: trescNotif.length > 110 ? `${trescNotif.slice(0, 110)}…` : trescNotif,
      linkUrl: "/panel/mieszkaniec",
      tag: `role-approved-${wiersz.village_id}`,
    });
    if (wiersz.role === "mieszkaniec") {
      zaplanujPowiadomienieEmail(
        wiersz.user_id,
        "naszawies.pl — zaakceptowano wniosek mieszkańca",
        "Witaj na portalu",
        [
          "Sołtys zaakceptował Twój wniosek o rolę mieszkańca we wsi.",
          "Możesz korzystać z panelu mieszkańca: ogłoszenia, świetlica, lista zakupów i inne moduły przypisane do Twojej wsi.",
        ],
      );
    } else {
      zaplanujPowiadomienieEmail(
        wiersz.user_id,
        `naszawies.pl — zaakceptowano wniosek (${rolaEtykieta})`,
        "Informacja z portalu",
        [
          `Sołtys zaakceptował Twój wniosek o rolę „${rolaEtykieta}” we wsi w serwisie naszawies.pl.`,
          "Szczegóły uprawnień ustalisz ze sołtysem — moduły panelu są rozbudowywane etapami.",
        ],
      );
    }
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/mieszkaniec");
  revalidatePath("/panel/powiadomienia");
  return { ok: true };
}

export async function odrzucWniosekMieszkanca(rolaId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(rolaId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wierszWniosku, error: readW } = await supabase
    .from("user_village_roles")
    .select("user_id, village_id, role")
    .eq("id", id.data)
    .eq("status", "pending")
    .maybeSingle();

  if (readW || !wierszWniosku || !ROLE_WNIOSKOW_SOLTYS.has(wierszWniosku.role)) {
    return { blad: "Nie znaleziono oczekującego wniosku lub został już rozpatrzony." };
  }

  const { data: zaktualizowano, error } = await supabase
    .from("user_village_roles")
    .update({ status: "suspended" })
    .eq("id", id.data)
    .eq("status", "pending")
    .in("role", Array.from(ROLE_WNIOSKOW_SOLTYS))
    .select("id");

  if (error) {
    console.error("[odrzucWniosek]", error.message);
    return { blad: "Nie udało się odrzucić wniosku." };
  }
  if (!zaktualizowano?.length) {
    return { blad: "Wniosek został już rozpatrzony — odśwież stronę." };
  }

  if (wierszWniosku.user_id) {
    const rolaEtykieta = etykietaRoliWsi(wierszWniosku.role);
    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id: wierszWniosku.user_id,
      type: "role_rejected",
      title:
        wierszWniosku.role === "mieszkaniec"
          ? "Wniosek mieszkańca nie został zaakceptowany"
          : `Wniosek (${rolaEtykieta}) nie został zaakceptowany`,
      body: "Sołtys odrzucił wniosek o rolę we wsi w portalu. W razie pytań skontaktuj się ze sołtysem poza portalem.",
      link_url: "/panel/mieszkaniec",
      related_id: wierszWniosku.village_id,
      related_type: "village",
      channel: "in_app",
    });
    if (notifErr) {
      console.warn("[odrzucWniosek] powiadomienie:", notifErr.message);
    } else {
      zaplanujWebPushDlaUzytkownika(wierszWniosku.user_id, {
        title: wierszWniosku.role === "mieszkaniec" ? "Wniosek mieszkańca" : `Wniosek: ${rolaEtykieta}`,
        body: "Wniosek nie został zaakceptowany przez sołtysa.",
        linkUrl: "/panel/mieszkaniec",
        tag: `role-rejected-${wierszWniosku.village_id}`,
      });
      zaplanujPowiadomienieEmail(
        wierszWniosku.user_id,
        wierszWniosku.role === "mieszkaniec"
          ? "naszawies.pl — wniosek mieszkańca"
          : `naszawies.pl — wniosek (${rolaEtykieta})`,
        "Informacja z portalu",
        [
          wierszWniosku.role === "mieszkaniec"
            ? "Sołtys nie zaakceptował wniosku o rolę mieszkańca dla tej wsi w serwisie naszawies.pl."
            : `Sołtys nie zaakceptował wniosku o rolę „${rolaEtykieta}” dla tej wsi w serwisie naszawies.pl.`,
          "Szczegóły możesz ustalić bezpośrednio ze sołtysem.",
        ],
      );
    }
    revalidatePath("/panel/powiadomienia");
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/mieszkaniec");
  return { ok: true };
}

const schemaWyposazenieDodaj = z.object({
  hallId: z.string().uuid(),
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99999),
  quantity_available: z.coerce.number().int().min(0).max(99999).nullable().optional(),
  condition: z.string().trim().max(50).optional().default("good"),
});

export async function dodajWyposazenieSwietlicy(
  dane: z.infer<typeof schemaWyposazenieDodaj>
): Promise<WynikProsty> {
  const parsed = schemaWyposazenieDodaj.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź poprawność pól formularza." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const opis = p.description?.length ? p.description : null;
  const { error } = await supabase.from("hall_inventory").insert({
    hall_id: p.hallId,
    category: p.category,
    name: p.name,
    description: opis,
    quantity: p.quantity,
    quantity_available: p.quantity_available ?? p.quantity,
    condition: p.condition || "good",
  });

  if (error) {
    console.error("[dodajWyposazenie]", error.message);
    return { blad: "Nie udało się dodać pozycji (sprawdź uprawnienia sołtysa dla tej sali)." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath("/panel/mieszkaniec/swietlica");
  return { ok: true };
}

const schemaDodajPakietWyposazenia = z.object({
  hallId: z.string().uuid(),
  pakiet: z.enum(["zebranie_wiejskie", "warsztaty", "impreza_rodzinna"]),
});

export async function dodajPakietWyposazeniaSwietlicy(
  dane: z.infer<typeof schemaDodajPakietWyposazenia>
): Promise<WynikProsty> {
  const parsed = schemaDodajPakietWyposazenia.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Niepoprawny pakiet wyposażenia." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const szablony: Record<
    z.infer<typeof schemaDodajPakietWyposazenia>["pakiet"],
    { category: string; name: string; quantity: number; condition: string; description: string }[]
  > = {
    zebranie_wiejskie: [
      {
        category: "Sala główna",
        name: "Krzesła składane",
        quantity: 80,
        condition: "good",
        description: "Pakiet startowy do zebrań i spotkań mieszkańców.",
      },
      {
        category: "Sala główna",
        name: "Stoły prostokątne",
        quantity: 12,
        condition: "good",
        description: "Stoły do układu bankietowego i warsztatowego.",
      },
      {
        category: "Technika",
        name: "Mikrofon przewodowy",
        quantity: 2,
        condition: "good",
        description: "Mikrofony na zebrania i prezentacje.",
      },
    ],
    warsztaty: [
      {
        category: "Sala główna",
        name: "Stoły warsztatowe",
        quantity: 8,
        condition: "good",
        description: "Pakiet do zajęć grupowych i warsztatów.",
      },
      {
        category: "Magazyn",
        name: "Krzesła dla uczestników",
        quantity: 40,
        condition: "good",
        description: "Krzesła pod warsztaty i szkolenia.",
      },
      {
        category: "Technika",
        name: "Przedłużacze",
        quantity: 6,
        condition: "good",
        description: "Zasilanie stanowisk podczas warsztatów.",
      },
    ],
    impreza_rodzinna: [
      {
        category: "Sala główna",
        name: "Stoły okolicznościowe",
        quantity: 10,
        condition: "good",
        description: "Pakiet pod urodziny i przyjęcia rodzinne.",
      },
      {
        category: "Sala główna",
        name: "Krzesła bankietowe",
        quantity: 70,
        condition: "good",
        description: "Krzesła dla gości wydarzeń rodzinnych.",
      },
      {
        category: "Zaplecze kuchenne",
        name: "Zestaw naczyń wielorazowych",
        quantity: 70,
        condition: "good",
        description: "Talerze i sztućce dla uczestników wydarzenia.",
      },
    ],
  };

  const wybrane = szablony[p.pakiet];
  const { error } = await supabase.from("hall_inventory").insert(
    wybrane.map((it) => ({
      hall_id: p.hallId,
      category: it.category,
      name: it.name,
      description: it.description,
      quantity: it.quantity,
      quantity_available: it.quantity,
      condition: it.condition,
    }))
  );

  if (error) {
    console.error("[dodajPakietWyposazeniaSwietlicy]", error.message);
    return { blad: "Nie udało się dodać pakietu wyposażenia (sprawdź uprawnienia)." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath("/panel/mieszkaniec/swietlica");
  return { ok: true };
}

export async function usunWyposazenieSwietlicy(
  hallId: string,
  pozycjaId: string
): Promise<WynikProsty> {
  const h = uuid.safeParse(hallId);
  const id = uuid.safeParse(pozycjaId);
  if (!h.success || !id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: poz } = await supabase
    .from("hall_inventory")
    .select("image_url")
    .eq("id", id.data)
    .eq("hall_id", h.data)
    .maybeSingle();
  const staryImg = poz?.image_url ?? null;
  if (staryImg) {
    await usunObiektR2JesliUrlNasz(staryImg);
    const baza = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (baza && staryImg.startsWith(`${baza}/storage/v1/object/public/hall_inventory/`)) {
      const marker = "/hall_inventory/";
      const i = staryImg.indexOf(marker);
      if (i !== -1) {
        const sciezka = staryImg.slice(i + marker.length);
        const { error: rmErr } = await supabase.storage.from("hall_inventory").remove([sciezka]);
        if (rmErr) console.warn("[usunWyposazenie] Storage:", rmErr.message);
      }
    }
  }

  const { error } = await supabase.from("hall_inventory").delete().eq("id", id.data).eq("hall_id", h.data);

  if (error) {
    console.error("[usunWyposazenie]", error.message);
    return { blad: "Nie udało się usunąć pozycji." };
  }

  revalidatePath(`/panel/soltys/swietlica/${h.data}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${h.data}`);
  revalidatePath("/panel/mieszkaniec/swietlica");
  return { ok: true };
}

const schemaWyposazenieAktualizuj = z.object({
  hallId: z.string().uuid(),
  pozycjaId: z.string().uuid(),
  category: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(99999),
  quantity_available: z.coerce.number().int().min(0).max(99999).nullable().optional(),
  condition: z.string().trim().max(50).optional().default("good"),
});

export async function aktualizujWyposazenieSwietlicy(
  dane: z.infer<typeof schemaWyposazenieAktualizuj>
): Promise<WynikProsty> {
  const parsed = schemaWyposazenieAktualizuj.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź poprawność pól formularza." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const opis = p.description?.length ? p.description : null;
  const { error } = await supabase
    .from("hall_inventory")
    .update({
      category: p.category,
      name: p.name,
      description: opis,
      quantity: p.quantity,
      quantity_available: p.quantity_available ?? p.quantity,
      condition: p.condition || "good",
    })
    .eq("id", p.pozycjaId)
    .eq("hall_id", p.hallId);

  if (error) {
    console.error("[aktualizujWyposazenie]", error.message);
    return { blad: "Nie udało się zapisać zmian." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath("/panel/mieszkaniec/swietlica");
  return { ok: true };
}

const schemaZdjecieWyposazenia = z.object({
  hallId: z.string().uuid(),
  pozycjaId: z.string().uuid(),
  image_url: z.union([z.string().url().max(2048), z.null()]),
});

function czyUrlZdjeciaInwentarza(publicUrl: string, hallId: string, pozycjaId: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (base) {
    const pref = `${base}/storage/v1/object/public/hall_inventory/${hallId}/${pozycjaId}-`;
    if (publicUrl.startsWith(pref)) return true;
  }
  const r2 = wyciagnijBucketIKluczZUrlaR2(publicUrl);
  return r2?.bucket === R2_BUCKET_HALL_INVENTORY && r2.key.startsWith(`${hallId}/${pozycjaId}-`);
}

export async function ustawZdjecieWyposazeniaSwietlicy(
  dane: z.infer<typeof schemaZdjecieWyposazenia>
): Promise<WynikProsty> {
  const parsed = schemaZdjecieWyposazenia.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Niepoprawny adres URL zdjęcia." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  if (p.image_url != null && !czyUrlZdjeciaInwentarza(p.image_url, p.hallId, p.pozycjaId)) {
    return { blad: "Adres zdjęcia musi pochodzić z zatwierdzonego wgrania w serwisie dla tej pozycji." };
  }

  const { data: istniejacy } = await supabase
    .from("hall_inventory")
    .select("image_url")
    .eq("id", p.pozycjaId)
    .eq("hall_id", p.hallId)
    .maybeSingle();
  const staryUrl = istniejacy?.image_url ?? null;
  if (staryUrl && staryUrl !== p.image_url) {
    await usunObiektR2JesliUrlNasz(staryUrl);
    const baza = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (baza && staryUrl.startsWith(`${baza}/storage/v1/object/public/hall_inventory/`)) {
      const marker = "/hall_inventory/";
      const i = staryUrl.indexOf(marker);
      if (i !== -1) {
        const sciezka = staryUrl.slice(i + marker.length);
        const { error: rmErr } = await supabase.storage.from("hall_inventory").remove([sciezka]);
        if (rmErr) console.warn("[ustawZdjecieWyposazenia] Supabase Storage:", rmErr.message);
      }
    }
  }

  const { error } = await supabase
    .from("hall_inventory")
    .update({ image_url: p.image_url })
    .eq("id", p.pozycjaId)
    .eq("hall_id", p.hallId);

  if (error) {
    console.error("[ustawZdjecieWyposazenia]", error.message);
    return { blad: "Nie udało się zapisać zdjęcia (uprawnienia?)." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath(`/panel/soltys/swietlica/${p.hallId}/dokument`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}/dokument`);
  return { ok: true };
}

export async function zatwierdzRezerwacjeSwietlicy(bookingId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: b, error: readE } = await supabase
    .from("hall_bookings")
    .select("id, hall_id, start_at, end_at, status, booked_by, halls!inner(village_id)")
    .eq("id", id.data)
    .maybeSingle();

  if (readE || !b) {
    return { blad: "Nie znaleziono rezerwacji." };
  }
  if (b.status !== "pending") {
    return { blad: "Wniosek jest już rozpatrzony." };
  }

  const { data: kolid, error: kE } = await supabase
    .from("hall_bookings")
    .select("id")
    .eq("hall_id", b.hall_id)
    .neq("id", id.data)
    .in("status", ["approved", "pending"])
    .lt("start_at", b.end_at)
    .gt("end_at", b.start_at)
    .limit(1);

  if (kE) {
    console.error("[zatwierdzRezerwacjeSwietlicy] kolid", kE.message);
    return { blad: "Nie udało się zweryfikować kolidni terminów (spróbuj ponownie)." };
  }
  if (kolid && kolid.length > 0) {
    return {
      blad: "Nie można zatwierdzić: ten przedział kolid z inną rezerwacją w tej sali (zatwierdzoną lub czekającą). Odrzuć zdublowany wniosek lub ustal inny termin.",
    };
  }

  const { data: poAkt, error } = await supabase
    .from("hall_bookings")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id.data)
    .eq("status", "pending")
    .select("id");

  if (error) {
    console.error("[zatwierdzRezerwacjeSwietlicy]", error.message);
    return { blad: "Nie udało się zatwierdzić (sprawdź uprawnienia sołtysa)." };
  }
  if (!poAkt?.length) {
    return { blad: "Wniosek został w międzyczasie rozpatrzony — odśwież stronę." };
  }

  const halls = b.halls as { village_id: string } | { village_id: string }[] | null;
  const wiesId = Array.isArray(halls) ? halls[0]?.village_id : halls?.village_id;
  if (b.booked_by && wiesId) {
    const tStart = new Date(b.start_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const tKoniec = new Date(b.end_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id: b.booked_by,
      type: "hall_booking_approved",
      title: "Zatwierdzono rezerwację sali",
      body: `Termin: ${tStart} – ${tKoniec}. Zobacz status przy swojej rezerwacji w panelu mieszkańca.`,
      link_url: "/panel/mieszkaniec/swietlica",
      related_id: wiesId,
      related_type: "village",
      channel: "in_app",
    });
    if (notifErr) {
      console.warn("[zatwierdzRezerwacjeSwietlicy] powiadomienie:", notifErr.message);
    } else {
      zaplanujWebPushDlaUzytkownika(b.booked_by, {
        title: "Zatwierdzono rezerwację sali",
        body: `Termin: ${tStart} – ${tKoniec}. Zobacz status przy swojej rezerwacji w panelu mieszkańca.`,
        linkUrl: "/panel/mieszkaniec/swietlica",
        tag: `hall-booking-${b.hall_id}`,
      });
      zaplanujPowiadomienieEmail(
        b.booked_by,
        "naszawies.pl — zatwierdzono rezerwację świetlicy",
        "Rezerwacja sali",
        [
          `Sołtys zatwierdził Twój wniosek o salę. Termin: ${tStart} – ${tKoniec}.`,
          "Szczegóły i dokumenty po wydarzeniu znajdziesz w panelu mieszkańca w sekcji Świetlica.",
        ],
      );
    }
  }

  revalidatePath("/panel/soltys/rezerwacje");
  revalidatePath("/panel/mieszkaniec/swietlica");
  revalidatePath("/panel/powiadomienia");
  revalidatePath(`/panel/mieszkaniec/swietlica/${b.hall_id}`);
  return { ok: true };
}

export async function odrzucRezerwacjeSwietlicy(bookingId: string, powod: string): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
  const powodOk = z.string().trim().min(3).max(500).safeParse(powod);
  if (!id.success || !powodOk.success) {
    return { blad: "Podaj powód odrzucenia (3–500 znaków)." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: b, error: readE } = await supabase
    .from("hall_bookings")
    .select("id, hall_id, start_at, end_at, status, booked_by, halls!inner(village_id)")
    .eq("id", id.data)
    .maybeSingle();

  if (readE || !b) {
    return { blad: "Nie znaleziono rezerwacji." };
  }
  if (b.status !== "pending") {
    return { blad: "Wniosek jest już rozpatrzony." };
  }

  const { error } = await supabase
    .from("hall_bookings")
    .update({
      status: "rejected",
      rejection_reason: powodOk.data,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (error) {
    console.error("[odrzucRezerwacjeSwietlicy]", error.message);
    return { blad: "Nie udało się odrzucić rezerwacji." };
  }

  const halls = b.halls as { village_id: string } | { village_id: string }[] | null;
  const wiesId = Array.isArray(halls) ? halls[0]?.village_id : halls?.village_id;
  if (b.booked_by && wiesId) {
    const tStart = new Date(b.start_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const tKoniec = new Date(b.end_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id: b.booked_by,
      type: "hall_booking_rejected",
      title: "Odrzucono wniosek o rezerwację sali",
      body: `Termin wniosku: ${tStart} – ${tKoniec}. Powód: ${powodOk.data}`,
      link_url: "/panel/mieszkaniec/swietlica",
      related_id: wiesId,
      related_type: "village",
      channel: "in_app",
    });
    if (notifErr) {
      console.warn("[odrzucRezerwacjeSwietlicy] powiadomienie:", notifErr.message);
    } else {
      zaplanujWebPushDlaUzytkownika(b.booked_by, {
        title: "Odrzucono rezerwację sali",
        body: `Powód: ${powodOk.data.slice(0, 120)}${powodOk.data.length > 120 ? "…" : ""}`,
        linkUrl: "/panel/mieszkaniec/swietlica",
        tag: `hall-booking-rejected-${b.hall_id}`,
      });
      zaplanujPowiadomienieEmail(
        b.booked_by,
        "naszawies.pl — odrzucono rezerwację świetlicy",
        "Rezerwacja sali",
        [
          `Sołtys odrzucił wniosek o salę. Proponowany termin: ${tStart} – ${tKoniec}.`,
          `Powód: ${powodOk.data}`,
          "Możesz złożyć nowy wniosek z innym terminem w panelu mieszkańca.",
        ],
      );
    }
  }

  revalidatePath("/panel/soltys/rezerwacje");
  revalidatePath("/panel/mieszkaniec/swietlica");
  revalidatePath("/panel/powiadomienia");
  if (b.hall_id) {
    revalidatePath(`/panel/mieszkaniec/swietlica/${b.hall_id}`);
  }
  return { ok: true };
}

/** Po zakończeniu terminu rezerwacji sołtys przechodzi ze statusu „zatwierdzona” na „zakończona” (protokół / rozliczenie). */
export async function oznaczRezerwacjeJakoZakonczonaSwietlicy(bookingId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wiersz, error: readErr } = await supabase
    .from("hall_bookings")
    .select("id, hall_id, status, end_at")
    .eq("id", id.data)
    .maybeSingle();

  if (readErr || !wiersz) {
    return { blad: "Nie znaleziono rezerwacji." };
  }

  if (wiersz.status !== "approved") {
    return { blad: "Tylko zatwierdzoną rezerwację można oznaczyć jako zakończoną." };
  }

  const koniec = new Date(wiersz.end_at);
  if (Number.isNaN(koniec.getTime()) || koniec.getTime() > Date.now()) {
    return {
      blad: "Oznaczenie możliwe dopiero po zakończeniu zaplanowanego terminu rezerwacji.",
    };
  }

  const { error } = await supabase
    .from("hall_bookings")
    .update({ status: "completed" })
    .eq("id", id.data)
    .eq("status", "approved");

  if (error) {
    console.error("[oznaczRezerwacjeJakoZakonczonaSwietlicy]", error.message);
    return { blad: "Nie udało się zaktualizować statusu (sprawdź uprawnienia sołtysa)." };
  }

  revalidatePath("/panel/soltys/rezerwacje");
  revalidatePath("/panel/mieszkaniec/swietlica");
  revalidatePath(`/panel/mieszkaniec/swietlica/${wiersz.hall_id}`);
  revalidatePath(`/panel/soltys/swietlica/${wiersz.hall_id}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${wiersz.hall_id}/dokument`);
  revalidatePath(`/panel/soltys/swietlica/${wiersz.hall_id}/dokument`);
  return { ok: true };
}

export async function zapiszPlanSali(hallId: string, plan: PlanSaliJson): Promise<WynikProsty> {
  const idHall = uuid.safeParse(hallId);
  if (!idHall.success) {
    return { blad: "Niepoprawny identyfikator sali." };
  }
  const parsed = schemaPlanSali.safeParse(plan);
  if (!parsed.success) {
    return { blad: "Niepoprawna struktura planu (zbyt wiele elementów lub złe wartości)." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase
    .from("halls")
    .update({ layout_data: parsed.data as unknown as Record<string, unknown> })
    .eq("id", idHall.data);

  if (error) {
    console.error("[zapiszPlanSali]", error.message);
    return { blad: "Nie udało się zapisać planu (uprawnienia sołtysa?)." };
  }

  revalidatePath(`/panel/soltys/swietlica/${idHall.data}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${idHall.data}`);
  revalidatePath(`/panel/soltys/swietlica/${idHall.data}/dokument`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${idHall.data}/dokument`);
  return { ok: true };
}

const schemaRegulaminSali = z.object({
  hallId: z.string().uuid(),
  rules_text: z.string().max(50000).nullable().optional(),
  deposit: z.number().min(0).max(999_999).nullable().optional(),
  price_resident: z.number().min(0).max(999_999).nullable().optional(),
  price_external: z.number().min(0).max(999_999).nullable().optional(),
});

export async function zapiszRegulaminIKaucjeSali(
  dane: z.infer<typeof schemaRegulaminSali>
): Promise<WynikProsty> {
  const parsed = schemaRegulaminSali.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź wprowadzone kwoty i tekst regulaminu." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const rules = p.rules_text?.trim().length ? p.rules_text.trim() : null;

  const { error } = await supabase
    .from("halls")
    .update({
      rules_text: rules,
      deposit: p.deposit ?? null,
      price_resident: p.price_resident ?? null,
      price_external: p.price_external ?? null,
    })
    .eq("id", p.hallId);

  if (error) {
    console.error("[zapiszRegulaminIKaucjeSali]", error.message);
    return { blad: "Nie udało się zapisać danych sali." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.hallId}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath(`/panel/soltys/swietlica/${p.hallId}/dokument`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}/dokument`);
  return { ok: true };
}

const schemaRegulaminPlacuZabaw = z.object({
  villageId: z.string().uuid(),
  playground_rules_text: z.string().max(50000).nullable().optional(),
});

export async function zapiszRegulaminPlacuZabawWsi(
  dane: z.infer<typeof schemaRegulaminPlacuZabaw>
): Promise<WynikProsty> {
  const parsed = schemaRegulaminPlacuZabaw.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Niepoprawne dane regulaminu placu zabaw." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const tekst =
    parsed.data.playground_rules_text?.trim().length
      ? parsed.data.playground_rules_text.trim()
      : null;

  const { error } = await supabase
    .from("villages")
    .update({ playground_rules_text: tekst })
    .eq("id", parsed.data.villageId);

  if (error) {
    console.error("[zapiszRegulaminPlacuZabawWsi]", error.message);
    return { blad: "Nie udało się zapisać regulaminu (uprawnienia sołtysa w tej wsi?)." };
  }

  const { data: sale } = await supabase.from("halls").select("id").eq("village_id", parsed.data.villageId);
  for (const h of sale ?? []) {
    revalidatePath(`/panel/soltys/swietlica/${h.id}`);
    revalidatePath(`/panel/mieszkaniec/swietlica/${h.id}`);
    revalidatePath(`/panel/soltys/swietlica/${h.id}/dokument`);
    revalidatePath(`/panel/mieszkaniec/swietlica/${h.id}/dokument`);
  }
  return { ok: true };
}

export async function zatwierdzPostSoltysa(postId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(postId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator posta." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wiersz, error: readErr } = await supabase
    .from("posts")
    .select(
      "id, status, author_id, village_id, title, type, villages ( voivodeship, county, commune, slug )",
    )
    .eq("id", id.data)
    .maybeSingle();

  type WierszPostu = {
    id: string;
    status: string;
    author_id: string | null;
    village_id: string;
    title: string;
    type: string;
    villages:
      | { voivodeship: string; county: string; commune: string; slug: string }
      | { voivodeship: string; county: string; commune: string; slug: string }[]
      | null;
  };

  const w = wiersz as WierszPostu | null;
  if (readErr || !w || w.status !== "pending") {
    return { blad: "Nie znaleziono posta lub został już rozpatrzony." };
  }

  const teraz = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "approved",
      moderated_by: user.id,
      moderated_at: teraz,
      moderation_note: null,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (error) {
    console.error("[zatwierdzPostSoltysa]", error.message);
    return { blad: "Nie udało się zatwierdzić (uprawnienia sołtysa?)." };
  }

  const vRel = w.villages;
  const v = Array.isArray(vRel) ? vRel[0] : vRel;

  if (w.author_id) {
    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id: w.author_id,
      type: "post_approved",
      title: "Post został opublikowany",
      body: `„${w.title.slice(0, 120)}${w.title.length > 120 ? "…" : ""}” — treść jest widoczna na profilu wsi.`,
      link_url: "/panel/mieszkaniec",
      related_id: w.village_id,
      related_type: "village",
      channel: "in_app",
    });
    if (notifErr) {
      console.warn("[zatwierdzPostSoltysa] powiadomienie:", notifErr.message);
    } else {
      zaplanujWebPushDlaUzytkownika(w.author_id, {
        title: "Zaakceptowano Twój post",
        body: w.title.slice(0, 110) + (w.title.length > 110 ? "…" : ""),
        linkUrl: "/panel/mieszkaniec",
        tag: `post-approved-${w.id}`,
      });
      zaplanujPowiadomienieEmail(
        w.author_id,
        "naszawies.pl — zaakceptowano post",
        "Treść opublikowana",
        [
          `Sołtys zaakceptował Twój wpis: „${w.title}”.`,
          v != null
            ? `Zobacz na profilu wsi: ${sciezkaProfiluWsi(v)}/ogloszenie/${w.id}`
            : "Zobacz profil wsi w serwisie naszawies.pl.",
        ],
      );
    }
  }

  const adminPowiadomienia = createAdminSupabaseClient();
  if (adminPowiadomienia && v != null) {
    const linkPelny = `${sciezkaProfiluWsi(v)}/ogloszenie/${w.id}`;
    await powiadomObserwujacychOOpublikowanyPost(adminPowiadomienia, {
      villageId: w.village_id,
      postId: w.id,
      postType: w.type,
      title: w.title,
      linkUrlPelny: linkPelny,
      excludeUserId: w.author_id,
    });
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/powiadomienia");
  revalidatePath("/panel/mieszkaniec");
  if (v != null) {
    revalidatePath(sciezkaProfiluWsi(v));
    revalidatePath(`${sciezkaProfiluWsi(v)}/ogloszenie/${w.id}`);
  }
  return { ok: true };
}

const notatkaModeracji = z.string().trim().min(3).max(500);

export async function odrzucPostSoltysa(postId: string, notatka: string): Promise<WynikProsty> {
  const id = uuid.safeParse(postId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator posta." };
  }
  const nt = notatkaModeracji.safeParse(notatka);
  if (!nt.success) {
    return { blad: "Krótka notatka dla autora (3–500 znaków) jest wymagana przy odrzuceniu." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { data: wiersz, error: readErr } = await supabase
    .from("posts")
    .select("id, status, author_id, village_id")
    .eq("id", id.data)
    .maybeSingle();

  if (readErr || !wiersz || wiersz.status !== "pending") {
    return { blad: "Nie znaleziono posta lub został już rozpatrzony." };
  }

  const teraz = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "rejected",
      moderated_by: user.id,
      moderated_at: teraz,
      moderation_note: nt.data,
    })
    .eq("id", id.data)
    .eq("status", "pending");

  if (error) {
    console.error("[odrzucPostSoltysa]", error.message);
    return { blad: "Nie udało się odrzucić (uprawnienia sołtysa?)." };
  }

  if (wiersz.author_id) {
    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id: wiersz.author_id,
      type: "post_rejected",
      title: "Post nie został zaakceptowany",
      body: nt.data,
      link_url: "/panel/mieszkaniec",
      related_id: wiersz.village_id,
      related_type: "village",
      channel: "in_app",
    });
    if (notifErr) {
      console.warn("[odrzucPostSoltysa] powiadomienie:", notifErr.message);
    } else {
      zaplanujWebPushDlaUzytkownika(wiersz.author_id, {
        title: "Post nie został zaakceptowany",
        body: nt.data,
        linkUrl: "/panel/mieszkaniec",
        tag: `post-rejected-${wiersz.id}`,
      });
      zaplanujPowiadomienieEmail(
        wiersz.author_id,
        "naszawies.pl — post niezaakceptowany",
        "Moderacja treści",
        [
          "Sołtys nie zaakceptował Twojego wpisu w module ogłoszeń.",
          `Notatka: ${nt.data}`,
          "Możesz przygotować poprawioną treść i wysłać ją ponownie zgodnie z zasadami wsi.",
        ],
      );
    }
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/powiadomienia");
  return { ok: true };
}

const schemaProfilPublicznyWsi = z.object({
  villageId: z.string().uuid(),
  description: z.string().max(20000).optional().nullable(),
  website: z.string().max(2000).optional().nullable(),
  cover_image_url: z.string().max(2048).optional().nullable(),
});

function czyPustyLubUrlHttp(s: string | null | undefined) {
  if (s == null || String(s).trim() === "") return { ok: true as const, val: null as string | null };
  const t = String(s).trim();
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false as const, blad: "Adres musi zaczynać się od http:// lub https://." };
    }
  } catch {
    return { ok: false as const, blad: "Nieprawidłowy adres URL." };
  }
  return { ok: true as const, val: t };
}

/**
 * Sołtys (lub współadmin) uzupełnia publiczne informacje o wsi: opis, linki.
 */
export async function zapiszProfilPublicznyWsi(
  dane: z.infer<typeof schemaProfilPublicznyWsi>
): Promise<WynikProsty> {
  const p = schemaProfilPublicznyWsi.safeParse(dane);
  if (!p.success) {
    return { blad: "Nieprawidłowe dane formularza." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }
  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(p.data.villageId)) {
    return { blad: "Nie możesz edytować danych tej wsi." };
  }
  const www = czyPustyLubUrlHttp(p.data.website);
  if (!www.ok) {
    return { blad: www.blad };
  }
  const cover = czyPustyLubUrlHttp(p.data.cover_image_url);
  if (!cover.ok) {
    return { blad: cover.blad };
  }
  const opis =
    p.data.description != null && p.data.description.trim().length > 0 ? p.data.description.trim() : null;

  const { error } = await supabase
    .from("villages")
    .update({
      description: opis,
      website: www.val,
      cover_image_url: cover.val,
    })
    .eq("id", p.data.villageId);

  if (error) {
    console.error("[zapiszProfilPublicznyWsi]", error.message);
    return { blad: "Nie udało się zapisać danych (uprawnienia lub błąd bazy)." };
  }

  const { data: wiersz } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", p.data.villageId)
    .maybeSingle();
  if (wiersz) {
    revalidatePath(sciezkaProfiluWsi(wiersz));
  }
  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaVillageScoped = z.object({
  villageId: z.string().uuid(),
});

async function czyUzytkownikMozeZarzadzacWsia(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  userId: string,
  villageId: string
) {
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  return ids.includes(villageId);
}

const schemaBlogger = z.object({
  villageId: z.string().uuid(),
  display_name: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(2000).nullable().optional(),
  avatar_url: z.string().trim().max(2048).nullable().optional(),
  specialties_csv: z.string().trim().max(500).optional().default(""),
});

export async function dodajProfilBlogeraWsi(dane: z.infer<typeof schemaBlogger>): Promise<WynikProsty> {
  const parsed = schemaBlogger.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź dane profilu blogera." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const tags = parsed.data.specialties_csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);

  const { error } = await supabase.from("village_bloggers").upsert(
    {
      village_id: parsed.data.villageId,
      user_id: user.id,
      display_name: parsed.data.display_name,
      bio: parsed.data.bio?.trim() || null,
      avatar_url: parsed.data.avatar_url?.trim() || null,
      specialties: tags,
      is_active: true,
    },
    { onConflict: "village_id,user_id" }
  );

  if (error) {
    console.error("[dodajProfilBlogeraWsi]", error.message);
    return { blad: "Nie udało się zapisać profilu blogera." };
  }

  revalidatePath("/panel/soltys/spolecznosc");
  return { ok: true };
}

const schemaBlogWpis = z.object({
  villageId: z.string().uuid(),
  title: z.string().trim().min(5).max(180),
  excerpt: z.string().trim().max(600).nullable().optional(),
  body: z.string().trim().min(20).max(60000),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  cover_image_url: z.string().trim().max(2048).nullable().optional(),
  tags_csv: z.string().trim().max(600).optional().default(""),
});

export async function dodajWpisBlogaWsi(dane: z.infer<typeof schemaBlogWpis>): Promise<WynikProsty> {
  const parsed = schemaBlogWpis.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź poprawność pól wpisu blogowego." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const { data: blogger } = await supabase
    .from("village_bloggers")
    .select("id")
    .eq("village_id", parsed.data.villageId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!blogger?.id) {
    return { blad: "Najpierw zapisz profil blogera w tej wsi." };
  }

  const tags = parsed.data.tags_csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);

  const teraz = new Date().toISOString();
  const { error } = await supabase.from("village_blog_posts").insert({
    village_id: parsed.data.villageId,
    blogger_id: blogger.id,
    author_id: user.id,
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt?.trim() || null,
    body: parsed.data.body,
    cover_image_url: parsed.data.cover_image_url?.trim() || null,
    tags,
    status: "approved",
    published_at: teraz,
    moderated_by: user.id,
    moderated_at: teraz,
  });
  if (error) {
    console.error("[dodajWpisBlogaWsi]", error.message);
    return { blad: "Nie udało się dodać wpisu blogowego." };
  }
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaHistoriaWpis = z.object({
  villageId: z.string().uuid(),
  title: z.string().trim().min(5).max(180),
  short_description: z.string().trim().max(500).nullable().optional(),
  body: z.string().trim().min(20).max(60000),
  event_date: z.string().trim().max(20).nullable().optional(),
  era_label: z.string().trim().max(120).nullable().optional(),
  source_links_csv: z.string().trim().max(1000).optional().default(""),
});

export async function dodajWpisHistoriiWsi(dane: z.infer<typeof schemaHistoriaWpis>): Promise<WynikProsty> {
  const parsed = schemaHistoriaWpis.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź dane wpisu historii." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const links = parsed.data.source_links_csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const eventDate = parsed.data.event_date?.trim() ? parsed.data.event_date.trim() : null;
  const teraz = new Date().toISOString();

  const { error } = await supabase.from("village_history_entries").insert({
    village_id: parsed.data.villageId,
    author_id: user.id,
    title: parsed.data.title,
    short_description: parsed.data.short_description?.trim() || null,
    body: parsed.data.body,
    event_date: eventDate,
    era_label: parsed.data.era_label?.trim() || null,
    source_links: links,
    status: "approved",
    published_at: teraz,
    moderated_by: user.id,
    moderated_at: teraz,
  });
  if (error) {
    console.error("[dodajWpisHistoriiWsi]", error.message);
    return { blad: "Nie udało się dodać wpisu historii." };
  }
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaMarketplaceProfil = z.object({
  villageId: z.string().uuid(),
  business_name: z.string().trim().min(2).max(160),
  short_description: z.string().trim().max(600).nullable().optional(),
  details: z.string().trim().max(5000).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(200).nullable().optional(),
  website: z.string().trim().max(2048).nullable().optional(),
  categories_csv: z.string().trim().max(500).optional().default(""),
  service_area: z.string().trim().max(200).nullable().optional(),
});

export async function zapiszMarketplaceProfil(dane: z.infer<typeof schemaMarketplaceProfil>): Promise<WynikProsty> {
  const parsed = schemaMarketplaceProfil.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź pola profilu usług." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const categories = parsed.data.categories_csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 15);

  const { error } = await supabase.from("marketplace_profiles").upsert(
    {
      village_id: parsed.data.villageId,
      owner_user_id: user.id,
      business_name: parsed.data.business_name,
      short_description: parsed.data.short_description?.trim() || null,
      details: parsed.data.details?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      website: parsed.data.website?.trim() || null,
      categories,
      service_area: parsed.data.service_area?.trim() || null,
      is_active: true,
    },
    { onConflict: "village_id,owner_user_id" }
  );
  if (error) {
    console.error("[zapiszMarketplaceProfil]", error.message);
    return { blad: "Nie udało się zapisać profilu usług." };
  }
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaMarketplaceOferta = z.object({
  villageId: z.string().uuid(),
  listing_type: z.enum(["sprzedam", "kupie", "oddam", "usluga", "praca"]),
  title: z.string().trim().min(4).max(200),
  description: z.string().trim().min(8).max(10000),
  category: z.string().trim().max(120).nullable().optional(),
  price_amount: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((v) => (v == null || String(v).trim() === "" ? null : Number(v))),
  phone: z.string().trim().max(40).nullable().optional(),
  location_text: z.string().trim().max(200).nullable().optional(),
  expires_in_days: z.coerce.number().int().min(1).max(180).optional().default(30),
});

export async function dodajMarketplaceOferte(dane: z.infer<typeof schemaMarketplaceOferta>): Promise<WynikProsty> {
  const parsed = schemaMarketplaceOferta.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź dane ogłoszenia marketplace." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }
  if (parsed.data.price_amount != null && Number.isNaN(parsed.data.price_amount)) {
    return { blad: "Kwota musi być liczbą albo pozostać pusta." };
  }
  const teraz = new Date();
  const expiresAt = new Date(teraz.getTime() + parsed.data.expires_in_days * 24 * 60 * 60 * 1000).toISOString();
  const { data: profil } = await supabase
    .from("marketplace_profiles")
    .select("id")
    .eq("village_id", parsed.data.villageId)
    .eq("owner_user_id", user.id)
    .maybeSingle();
  const { error } = await supabase.from("marketplace_listings").insert({
    village_id: parsed.data.villageId,
    owner_user_id: user.id,
    profile_id: profil?.id ?? null,
    listing_type: parsed.data.listing_type,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category?.trim() || null,
    price_amount: parsed.data.price_amount,
    currency: "PLN",
    phone: parsed.data.phone?.trim() || null,
    location_text: parsed.data.location_text?.trim() || null,
    expires_at: expiresAt,
    status: "approved",
    published_at: teraz.toISOString(),
    moderated_by: user.id,
    moderated_at: teraz.toISOString(),
  });
  if (error) {
    console.error("[dodajMarketplaceOferte]", error.message);
    return { blad: "Nie udało się dodać oferty." };
  }
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaWiadomoscLokalna = z.object({
  villageId: z.string().uuid(),
  title: z.string().trim().min(4).max(200),
  summary: z.string().trim().max(800).nullable().optional(),
  body: z.string().trim().max(10000).nullable().optional(),
  category: z.string().trim().max(120).nullable().optional(),
  source_name: z.string().trim().max(160).nullable().optional(),
  source_url: z.string().trim().max(2048).nullable().optional(),
  is_automated: z.boolean().optional().default(false),
  expires_in_days: z.coerce.number().int().min(1).max(90).optional().default(14),
});

export async function dodajWiadomoscLokalna(dane: z.infer<typeof schemaWiadomoscLokalna>): Promise<WynikProsty> {
  const parsed = schemaWiadomoscLokalna.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź dane wiadomości lokalnej." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const teraz = new Date();
  const expiresAt = new Date(teraz.getTime() + parsed.data.expires_in_days * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("local_news_items").insert({
    village_id: parsed.data.villageId,
    created_by: user.id,
    title: parsed.data.title,
    summary: parsed.data.summary?.trim() || null,
    body: parsed.data.body?.trim() || null,
    category: parsed.data.category?.trim() || null,
    source_name: parsed.data.source_name?.trim() || null,
    source_url: parsed.data.source_url?.trim() || null,
    is_automated: parsed.data.is_automated ?? false,
    status: "approved",
    published_at: teraz.toISOString(),
    expires_at: expiresAt,
    moderated_by: user.id,
    moderated_at: teraz.toISOString(),
  });
  if (error) {
    console.error("[dodajWiadomoscLokalna]", error.message);
    return { blad: "Nie udało się dodać wiadomości." };
  }
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/mapa");
  return { ok: true };
}

export async function uruchomAutomatyzacjeWsi(dane: z.infer<typeof schemaVillageScoped>): Promise<WynikProsty> {
  const parsed = schemaVillageScoped.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Nieprawidłowe dane." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do uruchomienia automatyzacji dla tej wsi." };
  }

  const { error } = await supabase.rpc("run_village_automation");
  if (error) {
    console.error("[uruchomAutomatyzacjeWsi]", error.message);
    return { blad: "Nie udało się uruchomić automatyzacji." };
  }
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/mapa");
  return { ok: true };
}

async function revalidateProfilWsiDlaWioski(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  villageId: string,
) {
  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  if (v?.slug) {
    revalidatePath(sciezkaProfiluWsi(v));
  }
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/panel/soltys/samorzad");
  revalidatePath("/panel/soltys/kanaly-rss");
  revalidatePath("/panel/soltys/wiadomosci-lokalne");
  revalidatePath("/mapa");
}

const schemaOrganizacjaWsi = z.object({
  villageId: z.string().uuid(),
  group_type: z.enum([
    "kgw",
    "osp",
    "parafia",
    "rada_solecka",
    "seniorzy",
    "mlodziez",
    "wolontariat",
    "rolnicy",
    "przedsiebiorcy",
    "sport",
    "taniec",
    "muzyka",
    "kolo",
    "inne",
  ]),
  name: z.string().trim().min(2).max(160),
  short_description: z.string().trim().max(800).nullable().optional(),
  contact_phone: z.string().trim().max(40).nullable().optional(),
  contact_email: z.string().trim().max(200).nullable().optional(),
  meeting_place: z.string().trim().max(200).nullable().optional(),
  schedule_text: z.string().trim().max(500).nullable().optional(),
});

export async function dodajOrganizacjeWsi(dane: z.infer<typeof schemaOrganizacjaWsi>): Promise<WynikProsty> {
  const parsed = schemaOrganizacjaWsi.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź dane organizacji (nazwa, typ)." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const { error } = await supabase.from("village_community_groups").insert({
    village_id: parsed.data.villageId,
    group_type: parsed.data.group_type,
    name: parsed.data.name,
    short_description: parsed.data.short_description?.trim() || null,
    contact_phone: parsed.data.contact_phone?.trim() || null,
    contact_email: parsed.data.contact_email?.trim() || null,
    meeting_place: parsed.data.meeting_place?.trim() || null,
    schedule_text: parsed.data.schedule_text?.trim() || null,
    is_active: true,
    created_by: user.id,
  });
  if (error) {
    console.error("[dodajOrganizacjeWsi]", error.message);
    return { blad: "Nie udało się dodać organizacji." };
  }
  await revalidateProfilWsiDlaWioski(supabase, parsed.data.villageId);
  return { ok: true };
}

const schemaKontaktUrzedowy = z.object({
  villageId: z.string().uuid(),
  office_key: z.enum(["soltys", "parafia", "osp", "kgw", "inne"]),
  role_label: z.string().trim().min(2).max(120),
  person_name: z.string().trim().min(2).max(160),
  organization_name: z.string().trim().max(200).nullable().optional(),
  contact_phone: z.string().trim().max(40).nullable().optional(),
  contact_email: z.string().trim().max(200).nullable().optional(),
  duty_hours_text: z.string().trim().max(300).nullable().optional(),
  note: z.string().trim().max(1200).nullable().optional(),
  cta_label: z.string().trim().max(120).nullable().optional(),
  cta_url: z.string().trim().max(2048).nullable().optional(),
  display_order: z.coerce.number().int().min(0).max(1000).optional().default(100),
});

export async function dodajKontaktUrzedowyWsi(
  dane: z.infer<typeof schemaKontaktUrzedowy>,
): Promise<WynikProsty> {
  const parsed = schemaKontaktUrzedowy.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź dane kontaktu urzędowego." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const ctaUrl = parsed.data.cta_url?.trim() || null;
  if (ctaUrl && !/^https?:\/\//i.test(ctaUrl) && !ctaUrl.startsWith("/")) {
    return { blad: "CTA URL musi zaczynać się od https://, http:// lub /." };
  }

  const { error } = await supabase.from("village_official_contacts").insert({
    village_id: parsed.data.villageId,
    office_key: parsed.data.office_key,
    role_label: parsed.data.role_label,
    person_name: parsed.data.person_name,
    organization_name: parsed.data.organization_name?.trim() || null,
    contact_phone: parsed.data.contact_phone?.trim() || null,
    contact_email: parsed.data.contact_email?.trim() || null,
    duty_hours_text: parsed.data.duty_hours_text?.trim() || null,
    note: parsed.data.note?.trim() || null,
    cta_label: parsed.data.cta_label?.trim() || null,
    cta_url: ctaUrl,
    display_order: parsed.data.display_order,
    is_verified_by_soltys: true,
    verified_at: new Date().toISOString(),
    verified_by: user.id,
    is_active: true,
    created_by: user.id,
  });
  if (error) {
    console.error("[dodajKontaktUrzedowyWsi]", error.message);
    return { blad: "Nie udało się dodać kontaktu urzędowego." };
  }

  await revalidateProfilWsiDlaWioski(supabase, parsed.data.villageId);
  return { ok: true };
}

const schemaKadencjaFunkcyjna = z.object({
  villageId: z.string().uuid(),
  office_key: z.enum(["soltys", "parafia", "osp", "kgw", "inne"]),
  role_label: z.string().trim().min(2).max(120),
  person_name: z.string().trim().min(2).max(160),
  organization_name: z.string().trim().max(200).nullable().optional(),
  term_start: z.string().trim().min(8).max(20),
  term_end: z.string().trim().max(20).nullable().optional(),
  note: z.string().trim().max(1200).nullable().optional(),
  is_current: z.boolean().optional().default(false),
});

export async function dodajKadencjeFunkcyjnaWsi(
  dane: z.infer<typeof schemaKadencjaFunkcyjna>,
): Promise<WynikProsty> {
  const parsed = schemaKadencjaFunkcyjna.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź dane kadencji." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const start = new Date(parsed.data.term_start);
  if (Number.isNaN(start.getTime())) {
    return { blad: "Niepoprawna data początku kadencji." };
  }
  const endRaw = parsed.data.term_end?.trim();
  let endIso: string | null = null;
  if (endRaw) {
    const end = new Date(endRaw);
    if (Number.isNaN(end.getTime())) {
      return { blad: "Niepoprawna data końca kadencji." };
    }
    if (end < start) {
      return { blad: "Data końca nie może być wcześniejsza niż początek." };
    }
    endIso = end.toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("village_official_terms").insert({
    village_id: parsed.data.villageId,
    office_key: parsed.data.office_key,
    role_label: parsed.data.role_label,
    person_name: parsed.data.person_name,
    organization_name: parsed.data.organization_name?.trim() || null,
    term_start: start.toISOString().slice(0, 10),
    term_end: endIso,
    note: parsed.data.note?.trim() || null,
    is_current: parsed.data.is_current,
    created_by: user.id,
  });
  if (error) {
    console.error("[dodajKadencjeFunkcyjnaWsi]", error.message);
    return { blad: "Nie udało się zapisać kadencji." };
  }

  await revalidateProfilWsiDlaWioski(supabase, parsed.data.villageId);
  return { ok: true };
}

const schemaWydarzenieSpolecznosci = z.object({
  villageId: z.string().uuid(),
  group_id: z.string().trim().max(40).optional().default(""),
  event_kind: z.enum(["mecz", "wyjazd", "proba", "wystep", "spotkanie", "festyn", "inne"]),
  title: z.string().trim().min(4).max(200),
  description: z.string().trim().max(8000).nullable().optional(),
  location_text: z.string().trim().max(240).nullable().optional(),
  starts_at: z.string().trim().min(4).max(50),
  ends_at: z.string().trim().max(50).optional().nullable(),
  expires_in_days: z.coerce.number().int().min(7).max(730).optional().default(365),
});

export async function dodajWydarzenieSpolecznosciWsi(
  dane: z.infer<typeof schemaWydarzenieSpolecznosci>,
): Promise<WynikProsty> {
  const parsed = schemaWydarzenieSpolecznosci.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź daty i tytuł wydarzenia." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const start = new Date(parsed.data.starts_at);
  const endRaw = parsed.data.ends_at?.trim();
  const end = endRaw ? new Date(endRaw) : null;
  if (Number.isNaN(start.getTime())) {
    return { blad: "Niepoprawna data rozpoczęcia wydarzenia." };
  }
  if (end && Number.isNaN(end.getTime())) {
    return { blad: "Niepoprawna data zakończenia wydarzenia." };
  }
  if (end && end < start) {
    return { blad: "Data zakończenia nie może być wcześniejsza niż rozpoczęcie." };
  }

  let groupId: string | null = null;
  const gid = parsed.data.group_id?.trim();
  if (gid) {
    const idOk = uuid.safeParse(gid);
    if (!idOk.success) {
      return { blad: "Niepoprawny identyfikator grupy." };
    }
    const { data: grupa } = await supabase
      .from("village_community_groups")
      .select("id, village_id")
      .eq("id", gid)
      .maybeSingle();
    if (!grupa || grupa.village_id !== parsed.data.villageId) {
      return { blad: "Wybrana grupa nie należy do tej wsi." };
    }
    groupId = grupa.id;
  }

  const teraz = new Date();
  const expiresAt = new Date(teraz.getTime() + parsed.data.expires_in_days * 24 * 60 * 60 * 1000).toISOString();
  const terazIso = teraz.toISOString();

  const { error } = await supabase.from("village_community_events").insert({
    village_id: parsed.data.villageId,
    group_id: groupId,
    event_kind: parsed.data.event_kind,
    title: parsed.data.title,
    description: parsed.data.description?.trim() || null,
    location_text: parsed.data.location_text?.trim() || null,
    starts_at: start.toISOString(),
    ends_at: end ? end.toISOString() : null,
    status: "approved",
    published_at: terazIso,
    expires_at: expiresAt,
    moderated_by: user.id,
    moderated_at: terazIso,
    created_by: user.id,
  });
  if (error) {
    console.error("[dodajWydarzenieSpolecznosciWsi]", error.message);
    return { blad: "Nie udało się dodać wydarzenia." };
  }
  await revalidateProfilWsiDlaWioski(supabase, parsed.data.villageId);
  return { ok: true };
}

const schemaHarmonogramTygodnia = z.object({
  villageId: z.string().uuid(),
  day_of_week: z.coerce.number().int().min(0).max(6),
  time_start: z.string().trim().min(3).max(8),
  time_end: z.string().trim().max(8).nullable().optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  group_id: z.string().optional().default(""),
});

function normalizujGodzineDoTime(s: string): string | null {
  const t = s.trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

export async function dodajSlotHarmonogramuTygodniaWsi(
  dane: z.infer<typeof schemaHarmonogramTygodnia>,
): Promise<WynikProsty> {
  const parsed = schemaHarmonogramTygodnia.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź dzień tygodnia, godziny i tytuł zajęć." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const ts = normalizujGodzineDoTime(parsed.data.time_start);
  if (!ts) {
    return { blad: "Niepoprawna godzina rozpoczęcia (np. 17:30)." };
  }
  let te: string | null = null;
  const endRaw = parsed.data.time_end?.trim();
  if (endRaw) {
    te = normalizujGodzineDoTime(endRaw);
    if (!te) {
      return { blad: "Niepoprawna godzina zakończenia." };
    }
  }

  let groupId: string | null = null;
  const gid = parsed.data.group_id?.trim();
  if (gid) {
    const idOk = uuid.safeParse(gid);
    if (!idOk.success) {
      return { blad: "Niepoprawny identyfikator grupy." };
    }
    const { data: grupa } = await supabase
      .from("village_community_groups")
      .select("id, village_id")
      .eq("id", gid)
      .maybeSingle();
    if (!grupa || grupa.village_id !== parsed.data.villageId) {
      return { blad: "Wybrana grupa nie należy do tej wsi." };
    }
    groupId = grupa.id;
  }

  const { error } = await supabase.from("village_weekly_schedule_slots").insert({
    village_id: parsed.data.villageId,
    day_of_week: parsed.data.day_of_week,
    time_start: ts,
    time_end: te,
    title: parsed.data.title,
    description: parsed.data.description?.trim() || null,
    group_id: groupId,
    is_active: true,
    created_by: user.id,
  });
  if (error) {
    console.error("[dodajSlotHarmonogramuTygodniaWsi]", error.message);
    return { blad: "Nie udało się dodać zajęcia do planu." };
  }
  await revalidateProfilWsiDlaWioski(supabase, parsed.data.villageId);
  return { ok: true };
}

export async function usunSlotHarmonogramuTygodniaWsi(slotId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(slotId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row, error: readErr } = await supabase
    .from("village_weekly_schedule_slots")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (readErr || !row) {
    return { blad: "Nie znaleziono wpisu harmonogramu." };
  }
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, row.village_id))) {
    return { blad: "Brak uprawnień." };
  }

  const { error } = await supabase.from("village_weekly_schedule_slots").delete().eq("id", id.data);
  if (error) {
    console.error("[usunSlotHarmonogramuTygodniaWsi]", error.message);
    return { blad: "Nie udało się usunąć wpisu." };
  }
  await revalidateProfilWsiDlaWioski(supabase, row.village_id);
  return { ok: true };
}

const schemaZrodloDotacji = z.object({
  villageId: z.string().uuid(),
  category: z.enum([
    "fundusz_solecki",
    "gmina_powiat_woj",
    "ue_prow",
    "ngo_fundacja",
    "sponsor",
    "inne",
  ]),
  title: z.string().trim().min(4).max(220),
  summary: z.string().trim().max(800).nullable().optional(),
  body: z.string().trim().max(12000).nullable().optional(),
  source_url: z.string().trim().max(2048).nullable().optional(),
  amount_hint: z.string().trim().max(120).nullable().optional(),
  application_deadline: z.string().trim().max(40).nullable().optional(),
});

export async function dodajZrodloDotacjiWsi(dane: z.infer<typeof schemaZrodloDotacji>): Promise<WynikProsty> {
  const parsed = schemaZrodloDotacji.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź tytuł i kategorię źródła dofinansowania." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  let deadline: string | null = null;
  const dr = parsed.data.application_deadline?.trim();
  if (dr) {
    const d = new Date(dr);
    if (Number.isNaN(d.getTime())) {
      return { blad: "Niepoprawny termin naboru." };
    }
    deadline = d.toISOString().slice(0, 10);
  }

  const terazIso = new Date().toISOString();
  const { error } = await supabase.from("village_funding_sources").insert({
    village_id: parsed.data.villageId,
    category: parsed.data.category,
    title: parsed.data.title,
    summary: parsed.data.summary?.trim() || null,
    body: parsed.data.body?.trim() || null,
    source_url: parsed.data.source_url?.trim() || null,
    amount_hint: parsed.data.amount_hint?.trim() || null,
    application_deadline: deadline,
    status: "approved",
    published_at: terazIso,
    created_by: user.id,
  });
  if (error) {
    console.error("[dodajZrodloDotacjiWsi]", error.message);
    return { blad: "Nie udało się zapisać informacji o dofinansowaniu." };
  }
  await revalidateProfilWsiDlaWioski(supabase, parsed.data.villageId);
  return { ok: true };
}

export async function usunZrodloDotacjiWsi(sourceId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(sourceId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row, error: readErr } = await supabase
    .from("village_funding_sources")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (readErr || !row) {
    return { blad: "Nie znaleziono wpisu." };
  }
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, row.village_id))) {
    return { blad: "Brak uprawnień." };
  }

  const { error } = await supabase.from("village_funding_sources").delete().eq("id", id.data);
  if (error) {
    console.error("[usunZrodloDotacjiWsi]", error.message);
    return { blad: "Nie udało się usunąć wpisu." };
  }
  await revalidateProfilWsiDlaWioski(supabase, row.village_id);
  return { ok: true };
}

const schemaPrzewodnikSamorzadowy = z.object({
  villageId: z.string().uuid(),
  commune_info: z.string().max(8000).nullable().optional(),
  county_info: z.string().max(8000).nullable().optional(),
  voivodeship_info: z.string().max(8000).nullable().optional(),
  roads_info: z.string().max(8000).nullable().optional(),
  waste_info: z.string().max(8000).nullable().optional(),
  utilities_info: z.string().max(8000).nullable().optional(),
  other_info: z.string().max(8000).nullable().optional(),
});

function oczyscPolePrzewodnika(t: string | null | undefined): string | null {
  const s = t?.trim();
  return s && s.length > 0 ? s : null;
}

export async function zapiszPrzewodnikSamorzadowyWsi(
  dane: z.infer<typeof schemaPrzewodnikSamorzadowy>,
): Promise<WynikProsty> {
  const parsed = schemaPrzewodnikSamorzadowy.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź długość pól (maks. ok. 8000 znaków na blok)." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const row = {
    village_id: parsed.data.villageId,
    commune_info: oczyscPolePrzewodnika(parsed.data.commune_info),
    county_info: oczyscPolePrzewodnika(parsed.data.county_info),
    voivodeship_info: oczyscPolePrzewodnika(parsed.data.voivodeship_info),
    roads_info: oczyscPolePrzewodnika(parsed.data.roads_info),
    waste_info: oczyscPolePrzewodnika(parsed.data.waste_info),
    utilities_info: oczyscPolePrzewodnika(parsed.data.utilities_info),
    other_info: oczyscPolePrzewodnika(parsed.data.other_info),
    updated_by: user.id,
  };

  const { error } = await supabase.from("village_civic_guides").upsert(row, { onConflict: "village_id" });
  if (error) {
    console.error("[zapiszPrzewodnikSamorzadowyWsi]", error.message);
    return { blad: "Nie udało się zapisać przewodnika (czy migracja bazy jest zastosowana?)." };
  }
  await revalidateProfilWsiDlaWioski(supabase, parsed.data.villageId);
  return { ok: true };
}

export async function zatwierdzWiadomoscLokalnaSoltys(newsId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(newsId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  const { data: row, error: rErr } = await supabase
    .from("local_news_items")
    .select("id, village_id, status")
    .eq("id", id.data)
    .maybeSingle();
  if (rErr || !row) return { blad: "Nie znaleziono wiadomości." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, row.village_id))) {
    return { blad: "Brak uprawnień." };
  }
  const teraz = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("local_news_items")
    .update({
      status: "approved",
      moderated_by: user.id,
      moderated_at: teraz,
      published_at: teraz,
      expires_at: expiresAt,
    })
    .eq("id", id.data)
    .in("status", ["pending", "draft"]);
  if (error) {
    console.error("[zatwierdzWiadomoscLokalnaSoltys]", error.message);
    return { blad: "Nie udało się zatwierdzić." };
  }
  await revalidateProfilWsiDlaWioski(supabase, row.village_id);
  revalidatePath("/panel/soltys/wiadomosci-lokalne");
  return { ok: true };
}

export async function odrzucWiadomoscLokalnaSoltys(newsId: string, notatka: string): Promise<WynikProsty> {
  const id = uuid.safeParse(newsId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };
  const note = notatka.trim().slice(0, 500);
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  const { data: row, error: rErr } = await supabase
    .from("local_news_items")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (rErr || !row) return { blad: "Nie znaleziono wiadomości." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, row.village_id))) {
    return { blad: "Brak uprawnień." };
  }
  const teraz = new Date().toISOString();
  const { error } = await supabase
    .from("local_news_items")
    .update({
      status: "rejected",
      moderated_by: user.id,
      moderated_at: teraz,
      moderation_note: note || "Odrzucono.",
    })
    .eq("id", id.data)
    .in("status", ["pending", "draft"]);
  if (error) {
    console.error("[odrzucWiadomoscLokalnaSoltys]", error.message);
    return { blad: "Nie udało się odrzucić." };
  }
  await revalidateProfilWsiDlaWioski(supabase, row.village_id);
  revalidatePath("/panel/soltys/wiadomosci-lokalne");
  return { ok: true };
}

const schemaKanalRss = z.object({
  villageId: z.string().uuid(),
  label: z.string().trim().min(2).max(160),
  feed_url: z
    .string()
    .trim()
    .min(8)
    .max(2048)
    .refine((u) => /^https?:\/\//i.test(u), "Podaj adres http lub https."),
});

export async function dodajKanalRssWsi(dane: z.infer<typeof schemaKanalRss>): Promise<WynikProsty> {
  const parsed = schemaKanalRss.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź nazwę i adres URL kanału RSS." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }
  const { error } = await supabase.from("village_news_feed_sources").insert({
    village_id: parsed.data.villageId,
    label: parsed.data.label,
    feed_url: parsed.data.feed_url,
    is_enabled: true,
  });
  if (error) {
    console.error("[dodajKanalRssWsi]", error.message);
    return { blad: "Nie udało się dodać kanału." };
  }
  revalidatePath("/panel/soltys/kanaly-rss");
  return { ok: true };
}

export async function usunKanalRssWsi(sourceId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(sourceId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  const { data: row, error: rErr } = await supabase
    .from("village_news_feed_sources")
    .select("id, village_id")
    .eq("id", id.data)
    .maybeSingle();
  if (rErr || !row) return { blad: "Nie znaleziono kanału." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, row.village_id))) {
    return { blad: "Brak uprawnień." };
  }
  const { error } = await supabase.from("village_news_feed_sources").delete().eq("id", id.data);
  if (error) {
    console.error("[usunKanalRssWsi]", error.message);
    return { blad: "Nie udało się usunąć." };
  }
  revalidatePath("/panel/soltys/kanaly-rss");
  return { ok: true };
}

export type WynikSyncRssAkcja =
  | { blad: string }
  | { ok: true; zrodlaPrzetworzone: number; noweWpisy: number; bledy: string[] };

export async function uruchomSynchronizacjeRssDlaMoichWsi(): Promise<WynikSyncRssAkcja> {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (vids.length === 0) return { blad: "Brak wsi w panelu sołtysa." };
  const klientPush = createAdminSupabaseClient();
  const wynik = await synchronizujKanalyRssDlaWsi(supabase, vids, {
    ...(klientPush ? { klientDoWebPush: klientPush } : {}),
  });
  for (const vid of vids) {
    await revalidateProfilWsiDlaWioski(supabase, vid);
  }
  revalidatePath("/panel/soltys/wiadomosci-lokalne");
  revalidatePath("/panel/soltys/kanaly-rss");
  return {
    ok: true,
    zrodlaPrzetworzone: wynik.zrodlaPrzetworzone,
    noweWpisy: wynik.noweWpisy,
    bledy: wynik.bledy,
  };
}
