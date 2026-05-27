export type KategoriaGrafiki =
  | "zaproszenia"
  | "dyplomy"
  | "plakaty"
  | "podziekowania"
  | "karty";

export type TypPolaGrafiki = "text" | "textarea" | "date" | "time";

export type PoleSzablonuGrafiki = {
  id: string;
  etykieta: string;
  typ: TypPolaGrafiki;
  /** Wartość domyślna — może zawierać {{wies}}, {{gmina}}, {{organizator}} */
  domysl?: string;
  wymagane?: boolean;
};

export type LayoutGrafiki =
  | "zaproszenie-eleganckie"
  | "zaproszenie-nowoczesne"
  | "zaproszenie-rustykalne"
  | "zaproszenie-lesne"
  | "zaproszenie-parafialne"
  | "zaproszenie-dwujezyczne"
  | "dyplom-klasyczny"
  | "dyplom-ozdobny"
  | "plakat"
  | "podziekowanie"
  | "karta-informacyjna";

export type FormatGrafiki = "a4" | "a5" | "kwadrat";
export type OrientacjaGrafiki = "pion" | "poziom";

export type DostepSzablonu = "wszyscy" | "soltys" | "kgw" | "osp";

export type SzablonGrafiki = {
  id: string;
  kategoria: KategoriaGrafiki;
  tytul: string;
  opis: string;
  layout: LayoutGrafiki;
  format: FormatGrafiki;
  orientacja: OrientacjaGrafiki;
  pola: PoleSzablonuGrafiki[];
  domyslnyMotyw: string;
  dostep: DostepSzablonu;
  tagi?: string[];
};

export type MotywGrafiki = {
  id: string;
  nazwa: string;
  tlo: string;
  akcent: string;
  akcent2?: string;
  tekst: string;
  tekstDrugorzedny: string;
  ramka?: string;
};

export type WartosciPolGrafiki = Record<string, string>;

export type ProjektGrafiki = {
  id: string;
  templateId: string;
  tytul: string;
  motywId: string;
  wartosci: WartosciPolGrafiki;
  logoDataUrl?: string | null;
  backgroundDataUrl?: string | null;
  canvasJson?: Record<string, unknown> | null;
  qrUrl?: string | null;
  isPublic?: boolean;
  villageId?: string | null;
  bookingId?: string | null;
  updatedAt: string;
};

export type KontekstGrafiki = {
  wies?: string;
  gmina?: string;
  organizator?: string;
  telefon?: string;
  email?: string;
};

/** Dane z profilu wsi do szybkiego wstawienia w kreatorze */
export type ProfilWsiGrafiki = {
  telefon?: string | null;
  email?: string | null;
  zdjecieTloUrl?: string | null;
};

export type FormatSocialGrafiki = "post" | "story";
