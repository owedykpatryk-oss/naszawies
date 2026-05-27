export type PresetQrGrafiki = {
  id: string;
  etykieta: string;
  opis: string;
  /** Zwraca URL lub null jeśli brak danych */
  budujUrl: (ctx: {
    sciezkaWsi: string;
    origin: string;
    linkAnkiety?: string;
  }) => string | null;
};

export const PRESETY_QR_GRAFIKI: PresetQrGrafiki[] = [
  {
    id: "profil-wsi",
    etykieta: "Profil wsi",
    opis: "Link do strony sołectwa na naszawies.pl",
    budujUrl: ({ sciezkaWsi, origin }) => {
      if (!sciezkaWsi.trim()) return null;
      const sciezka = sciezkaWsi.startsWith("/") ? sciezkaWsi : `/${sciezkaWsi}`;
      return `${origin}${sciezka}`;
    },
  },
  {
    id: "galeria-plakatow",
    etykieta: "Galeria plakatów",
    opis: "Sekcja plakatów na profilu wsi",
    budujUrl: ({ sciezkaWsi, origin }) => {
      if (!sciezkaWsi.trim()) return null;
      const sciezka = sciezkaWsi.startsWith("/") ? sciezkaWsi : `/${sciezkaWsi}`;
      return `${origin}${sciezka}#galeria-plakatow`;
    },
  },
  {
    id: "ankieta",
    etykieta: "Ankieta (Twój link)",
    opis: "Google Forms / Microsoft Forms — wklej adres w polu poniżej",
    budujUrl: ({ linkAnkiety }) => {
      const u = linkAnkiety?.trim();
      if (!u) return null;
      try {
        const parsed = new URL(u.startsWith("http") ? u : `https://${u}`);
        return parsed.href;
      } catch {
        return null;
      }
    },
  },
  {
    id: "fotokronika",
    etykieta: "Fotokronika wsi",
    opis: "Zachęta do dodawania zdjęć po imprezie",
    budujUrl: ({ origin }) => `${origin}/panel/mieszkaniec/fotokronika`,
  },
];

export function originStronyGrafiki(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://naszawies.pl";
}
