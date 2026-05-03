import { htmlSzablonNaszawies, siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
import { wyslijPrzezResend } from "@/lib/email/wyslij-przez-resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { escapeHtml } from "@/lib/tekst/escape-html";

/**
 * Wysyła jednorazowy e-mail z szablonu naszawies (Resend), jeśli skonfigurowano API
 * i użytkownik ma adres w Supabase Auth. Nie blokuje akcji serwerowej — loguje ostrzeżenia.
 */
export function zaplanujPowiadomienieEmail(
  userId: string,
  temat: string,
  naglowekSzablonu: string,
  trescAkapitow: string[],
): void {
  void (async () => {
    const admin = createAdminSupabaseClient();
    if (!admin) return;
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error || !data?.user?.email) return;
    const email = data.user.email;
    const akapity = trescAkapitow
      .filter((t) => t.trim().length > 0)
      .map((t) => `<p style="margin:0 0 12px 0;">${escapeHtml(t)}</p>`)
      .join("");
    const html = htmlSzablonNaszawies({
      siteUrl: siteUrlDlaSzablonuEmail(),
      naglowek: naglowekSzablonu,
      trescHtml: akapity || `<p style="margin:0;">${escapeHtml(temat)}</p>`,
    });
    const w = await wyslijPrzezResend({ do: email, temat, trescHtml: html });
    if (!w.ok) console.warn("[powiadomienie-email]", w.blad);
  })().catch((e) => console.warn("[powiadomienie-email]", e));
}
