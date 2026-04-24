type OpcjeWiadomosci = {
  do: string | string[];
  temat: string;
  trescHtml: string;
  odpowiedzDo?: string;
};

/** Wysyłka przez Resend. Zwraca false gdy brak klucza lub błąd API. */
export async function wyslijPrzezResend(
  opcje: OpcjeWiadomosci
): Promise<{ ok: true } | { ok: false; blad: string }> {
  const klucz = process.env.RESEND_API_KEY;
  const z = process.env.RESEND_ZE_STRONY;
  if (!klucz || !z) {
    return { ok: false, blad: "Wysyłka e-maili jest chwilowo niedostępna." };
  }

  const odbiorcy = Array.isArray(opcje.do) ? opcje.do : [opcje.do];

  const odp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${klucz}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: z,
      to: odbiorcy,
      subject: opcje.temat,
      html: opcje.trescHtml,
      reply_to: opcje.odpowiedzDo,
    }),
  });

  if (!odp.ok) {
    const tekst = await odp.text();
    return { ok: false, blad: tekst.slice(0, 500) };
  }

  return { ok: true };
}
