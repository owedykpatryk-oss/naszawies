/** Normalizacja numeru PL do formatu WhatsApp (48…). */
export function normalizujTelPl(tel: string): string | null {
  const cyfry = tel.replace(/\D/g, "");
  if (cyfry.length < 9) return null;
  if (cyfry.startsWith("48") && cyfry.length >= 11) return cyfry;
  if (cyfry.startsWith("0") && cyfry.length >= 9) return `48${cyfry.slice(1)}`;
  if (cyfry.length === 9) return `48${cyfry}`;
  return cyfry.length >= 11 ? cyfry : null;
}

export function linkWhatsApp(tel: string, tekst: string): string | null {
  const n = normalizujTelPl(tel);
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(tekst)}`;
}

export function linkSms(tel: string, tekst: string): string | null {
  const n = normalizujTelPl(tel);
  if (!n) return null;
  return `sms:+${n}?body=${encodeURIComponent(tekst)}`;
}

export function tekstWiadomosciDoSprzedawcy(opts: {
  tytul: string;
  url: string;
  nazwaWsi?: string;
}): string {
  const wies = opts.nazwaWsi ? ` (${opts.nazwaWsi})` : "";
  return `Cześć! Pytam o ogłoszenie „${opts.tytul}”${wies} na naszawies.pl: ${opts.url}`;
}
