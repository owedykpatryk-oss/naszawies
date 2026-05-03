"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { powiadomObserwujacychISoltysowOZmianieStatusuZgloszenia } from "@/lib/powiadomienia/powiadom-o-zmianie-statusu-zgloszenia";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const statusy = z.enum(["w_trakcie", "rozwiazane", "odrzucone"]);

function etykietaStatusuZgloszenia(status: z.infer<typeof statusy>): string {
  if (status === "w_trakcie") return "W trakcie";
  if (status === "rozwiazane") return "Rozwiązane";
  return "Odrzucone";
}

function zaplanujWebPushPoZmianieZgloszenia(
  userId: string,
  dane: { title: string; body: string; linkUrl?: string | null; tag?: string }
) {
  const admin = createAdminSupabaseClient();
  if (!admin) return;
  void wyslijWebPushDlaUzytkownika(admin, { userId, ...dane }).catch((e) => console.warn("[web-push zgloszenie]", e));
}

const schemaAkt = z.object({
  issueId: uuid,
  status: statusy,
  resolutionNote: z.string().trim().max(2000).optional().nullable(),
});

export type WynikAktZgl = { blad: string } | { ok: true };

export async function zaktualizujZgloszenieSoltys(
  dane: z.infer<typeof schemaAkt>
): Promise<WynikAktZgl> {
  const p = schemaAkt.safeParse(dane);
  if (!p.success) {
    return { blad: "Niepoprawne dane formularza." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return { blad: "Brak uprawnień sołtysa." };
  }

  const { data: w, error: rE } = await supabase
    .from("issues")
    .select("id, village_id, status, reporter_id, title")
    .eq("id", p.data.issueId)
    .maybeSingle();

  if (rE || !w) {
    return { blad: "Nie znaleziono zgłoszenia." };
  }
  if (!villageIds.includes(w.village_id)) {
    return { blad: "To zgłoszenie dotyczy innej wsi." };
  }

  const up: Record<string, unknown> = {
    status: p.data.status,
    resolution_note: p.data.resolutionNote?.length ? p.data.resolutionNote : null,
  };
  if (p.data.status === "w_trakcie") {
    up.resolved_at = null;
  } else {
    up.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("issues")
    .update(up)
    .eq("id", p.data.issueId)
    .eq("village_id", w.village_id);

  if (error) {
    console.error("[zaktualizujZgloszenieSoltys]", error.message);
    return { blad: "Nie udało się zapisać zmian." };
  }

  const reporterId = w.reporter_id as string | null | undefined;
  const tytulZgl = typeof w.title === "string" ? w.title : "";
  const statusSieZmienil = p.data.status !== w.status;
  if (statusSieZmienil) {
    const etykieta = etykietaStatusuZgloszenia(p.data.status);
    if (reporterId) {
      const notatka = p.data.resolutionNote?.trim();
      const tresc =
        notatka && notatka.length > 0
          ? `Status: ${etykieta}. Uwagi: ${notatka.length > 280 ? `${notatka.slice(0, 280)}…` : notatka}`
          : `Status zgłoszenia zmieniony na: ${etykieta}.`;
      const { error: nE } = await supabase.from("notifications").insert({
        user_id: reporterId,
        type: "issue_status_updated",
        title: `Zgłoszenie: ${etykieta}`,
        body: tytulZgl ? `„${tytulZgl.length > 80 ? `${tytulZgl.slice(0, 80)}…` : tytulZgl}” — ${tresc}` : tresc,
        link_url: "/panel/mieszkaniec/zgloszenia",
        related_id: w.village_id,
        related_type: "village",
        channel: "in_app",
      });
      if (nE) {
        console.warn("[zaktualizujZgloszenieSoltys] powiadomienie:", nE.message);
      } else {
        zaplanujWebPushPoZmianieZgloszenia(reporterId, {
          title: `Zgłoszenie: ${etykieta}`,
          body: tytulZgl ? tytulZgl.slice(0, 110) + (tytulZgl.length > 110 ? "…" : "") : tresc.slice(0, 120),
          linkUrl: "/panel/mieszkaniec/zgloszenia",
          tag: `issue-status-${p.data.issueId}`,
        });
      }
    }

    const adminPowiadomienia = createAdminSupabaseClient();
    if (adminPowiadomienia) {
      void powiadomObserwujacychISoltysowOZmianieStatusuZgloszenia(adminPowiadomienia, {
        villageId: w.village_id,
        issueId: p.data.issueId,
        issueTitle: tytulZgl,
        statusLabel: etykieta,
        reporterUserId: reporterId,
        actorUserId: user.id,
      }).catch((e) => console.warn("[powiadom status zgloszenia]", e));
    }
  }

  revalidatePath("/panel/soltys/zgloszenia");
  revalidatePath("/panel/mieszkaniec/zgloszenia");
  revalidatePath("/panel/powiadomienia");
  return { ok: true };
}
