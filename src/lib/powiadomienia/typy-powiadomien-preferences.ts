/** Typy powiadomień z domyślnymi preferencjami kanałów. */
export type TypPowiadomieniaPref = {
  klucz: string;
  etykieta: string;
  opis: string;
};

export const TYPY_POWIADOMIEN_PREFERENCJE: TypPowiadomieniaPref[] = [
  {
    klucz: "post_published",
    etykieta: "Ogłoszenia i wydarzenia",
    opis: "Nowe ogłoszenia sołtysa, zebrania, dożynki.",
  },
  {
    klucz: "issue_status",
    etykieta: "Zgłoszenia problemów",
    opis: "Status Twojego zgłoszenia lub nowe zgłoszenia we wsi.",
  },
  {
    klucz: "hall_booking",
    etykieta: "Rezerwacje świetlicy",
    opis: "Potwierdzenia, odrzucenia i przypomnienia o sali.",
  },
  {
    klucz: "marketplace",
    etykieta: "Rynek lokalny",
    opis: "Nowe ogłoszenia, zmiany cen, wygasające oferty.",
  },
  {
    klucz: "alert_awaria",
    etykieta: "Alerty awarii",
    opis: "Prąd, woda, droga — pilne komunikaty sołtysa.",
  },
  {
    klucz: "glosowanie",
    etykieta: "Głosowania i konkursy",
    opis: "Otwarcie głosowania sołeckiego lub konkursu foto.",
  },
  {
    klucz: "role_application",
    etykieta: "Wnioski o rolę",
    opis: "Akceptacja lub odrzucenie wniosku o mieszkańca/sołtysa.",
  },
  {
    klucz: "digest",
    etykieta: "Podsumowanie dnia",
    opis: "Zbiorczy e-mail wieczorem z najważniejszymi wiadomościami.",
  },
];

export type CzestotliwoscPowiadomienia = "natychmiast" | "digest_dzienny" | "digest_tygodniowy" | "wylaczone";

export type PreferencjaPowiadomieniaWiersz = {
  typ_powiadomienia: string;
  kanal_push: CzestotliwoscPowiadomienia;
  kanal_email: CzestotliwoscPowiadomienia;
  kanal_sms: CzestotliwoscPowiadomienia;
};

export function domyslnePreferencje(): PreferencjaPowiadomieniaWiersz[] {
  return TYPY_POWIADOMIEN_PREFERENCJE.map((t) => ({
    typ_powiadomienia: t.klucz,
    kanal_push: "natychmiast" as const,
    kanal_email: t.klucz === "digest" ? ("digest_dzienny" as const) : ("digest_dzienny" as const),
    kanal_sms: "wylaczone" as const,
  }));
}
