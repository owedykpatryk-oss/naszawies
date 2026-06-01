import { htmlSzablonNaszawies, siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
import { wyslijPrzezResend } from "@/lib/email/wyslij-przez-resend";
import { escapeHtml } from "@/lib/tekst/escape-html";
import type { RodzajAnkiety } from "@/lib/feedback/konfiguracja-ankiety";

export async function powiadomOperatoraONowejOpinii(params: {
  emailUzytkownika: string | undefined;
  displayName: string | null;
  surveyKind: RodzajAnkiety;
  ratingOverall: number | null;
  whatImprove: string | null;
}): Promise<void> {
  const docelowy =
    process.env.FEEDBACK_EMAIL_DOCELOWY?.trim() ||
    process.env.KONTAKT_EMAIL_DOCELOWY?.trim() ||
    "kontakt@naszawies.pl";

  const tresc = `
    <p><strong>Nowa opinia</strong> (${escapeHtml(params.surveyKind)})</p>
    <p><strong>Użytkownik:</strong> ${escapeHtml(params.displayName ?? "—")} · ${escapeHtml(params.emailUzytkownika ?? "—")}</p>
    <p><strong>Ocena ogólna:</strong> ${params.ratingOverall ?? "—"}/5</p>
    <p><strong>Do poprawy:</strong></p>
    <p>${escapeHtml((params.whatImprove ?? "—").slice(0, 800))}</p>
    <p><a href="${siteUrlDlaSzablonuEmail()}/panel/admin/sugestie">Otwórz panel opinii →</a></p>
  `;

  void wyslijPrzezResend({
    do: docelowy,
    temat: `[naszawies] Nowa sugestia użytkownika`,
    trescHtml: htmlSzablonNaszawies({
      siteUrl: siteUrlDlaSzablonuEmail(),
      naglowek: "Nowa opinia użytkownika",
      trescHtml: tresc,
    }),
  }).then((w) => {
    if (!w.ok) console.warn("[powiadom feedback]", w.blad);
  });
}
