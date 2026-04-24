/**
 * Wspólny szablon HTML dla wiadomości z aplikacji (Resend itp.).
 * Kolorystyka jak w {@link LogoNaszawies}.
 */
export type OpcjeSzablonuNaszawies = {
  /** Kanoniczny adres strony bez końcowego slasha, np. https://naszawies.pl */
  siteUrl: string;
  /** Nagłówek treści (np. „Wiadomość z formularza”) */
  naglowek: string;
  /** Fragment HTML treści (zaufany / już escapowany) */
  trescHtml: string;
};

function normalizujSiteUrl(url: string): string {
  const t = url.trim().replace(/\/+$/, "");
  return t || "https://naszawies.pl";
}

export function htmlSzablonNaszawies(opcje: OpcjeSzablonuNaszawies): string {
  const base = normalizujSiteUrl(opcje.siteUrl);
  const logoUrl = `${base}/email/znak-naszawies.svg`;

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opcje.naglowek}</title>
</head>
<body style="margin:0;padding:0;background:#e8e4dc;font-family:Georgia,'Times New Roman',Times,serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8e4dc;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#f5f1e8;border-radius:12px;border:1px solid #d4cfc4;">
<tr><td style="padding:24px 24px 18px 24px;border-bottom:1px solid #e5e0d6;">
<table role="presentation" cellspacing="0" cellpadding="0"><tr>
<td style="vertical-align:middle;padding-right:12px;">
<a href="${base}/" style="text-decoration:none;">
<img src="${logoUrl}" width="44" height="44" alt="" style="display:block;border-radius:50%;">
</a>
</td>
<td style="vertical-align:middle;">
<a href="${base}/" style="text-decoration:none;font-size:21px;font-weight:600;line-height:1.2;">
<span style="color:#2d5a2d">nasza</span><span style="color:#5a9c3e">wies</span><span style="color:#d4a017;font-weight:500">.pl</span>
</a>
</td>
</tr></table>
</td></tr>
<tr><td style="padding:24px 24px 8px 24px;font-size:18px;font-weight:600;color:#2d5a2d;font-family:Arial,Helvetica,sans-serif;">
${opcje.naglowek}
</td></tr>
<tr><td style="padding:8px 24px 28px 24px;font-size:15px;line-height:1.55;color:#3d3a33;font-family:Arial,Helvetica,sans-serif;">
${opcje.trescHtml}
</td></tr>
<tr><td style="padding:16px 24px 22px;font-size:12px;line-height:1.45;color:#5c5850;background:#ebe6dc;border-top:1px solid #e0dbd2;">
<p style="margin:0 0 6px 0;">Wiadomość z serwisu <a href="${base}/" style="color:#2d5a2d;font-weight:600;">naszawies.pl</a></p>
<p style="margin:0;">Nie odpowiadaj na ten e-mail — skrzynka jest techniczna.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Adres strony do szablonu: zmienna środowiskowa lub bezpieczny domyślny. */
export function siteUrlDlaSzablonuEmail(): string {
  return normalizujSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://naszawies.pl"
  );
}
