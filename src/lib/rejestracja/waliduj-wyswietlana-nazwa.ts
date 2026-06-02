import { czyPelneImieINazwisko } from "@/lib/rejestracja/validate-imie-soltysa";

/** Gmail z kropkami co znak (np. u.z.i.v.u.l.o.le.h.7.6.6@…) — typowy spam botów. */
export function czyPodejrzanyEmailDotStuffing(email: string): boolean {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local.includes(".")) return false;
  const segmenty = local.split(".").filter(Boolean);
  if (segmenty.length < 5) return false;
  const pojedyncze = segmenty.filter((s) => s.length === 1).length;
  return pojedyncze >= Math.ceil(segmenty.length * 0.55);
}

function liczbaZmianWielkosciLiter(w: string): number {
  let n = 0;
  for (let i = 1; i < w.length; i++) {
    const a = w[i - 1]!;
    const b = w[i]!;
    if (!/[a-zA-Z]/.test(a) || !/[a-zA-Z]/.test(b)) continue;
    const aG = a === a.toUpperCase();
    const bG = b === b.toUpperCase();
    if (aG !== bG) n += 1;
  }
  return n;
}

/** Losowy token botów: długi ciąg alfanum. bez spacji, chaotyczna wielkość liter. */
export function czyLosowyToken(w: string): boolean {
  const t = w.trim();
  if (t.length < 10) return false;
  if (!/^[a-zA-Z0-9'`.-]+$/.test(t)) return false;
  if (/\s/.test(t)) return false;

  const samogloski = (t.match(/[aeiouyąęóAEIOUYĄĘÓ]/g) ?? []).length;
  if (samogloski === 0) return true;
  if (t.length >= 12 && samogloski / t.length < 0.18) return true;

  const maDuze = /[A-Z]/.test(t);
  const maMale = /[a-z]/.test(t);
  if (maDuze && maMale && t.length >= 11 && liczbaZmianWielkosciLiter(t) >= 4) {
    return true;
  }

  return false;
}

export function czyLosowyCiagZnakow(nazwa: string): boolean {
  const t = nazwa.trim();
  if (!t) return false;
  const wyrazy = t.split(/\s+/).filter(Boolean);
  if (wyrazy.length === 0) return false;
  if (wyrazy.length === 1) return czyLosowyToken(wyrazy[0]!);
  return wyrazy.some((w) => czyLosowyToken(w));
}

export type WynikWalidacjiNazwy =
  | { ok: true; nazwa: string }
  | { ok: false; blad: string };

/**
 * Wyświetlana nazwa przy rejestracji — odrzuca śmieciowe boty, akceptuje imię/nazwisko lub krótki pseudonim.
 */
export function walidujWyswietlanaNazwaRejestracji(
  surowa: string,
  intencja: "mieszkaniec" | "soltys" | "inne" | "nie_podano",
): WynikWalidacjiNazwy {
  const nazwa = surowa.trim().replace(/\s+/g, " ");
  if (nazwa.length < 2) {
    return { ok: false, blad: "Podaj wyświetlaną nazwę (min. 2 znaki)." };
  }
  if (nazwa.length > 80) {
    return { ok: false, blad: "Wyświetlana nazwa może mieć maks. 80 znaków." };
  }
  if (!/[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(nazwa)) {
    return { ok: false, blad: "Wyświetlana nazwa powinna zawierać litery." };
  }
  if (czyLosowyCiagZnakow(nazwa)) {
    return {
      ok: false,
      blad: "Podaj prawdziwe imię i nazwisko albo rozpoznawalny pseudonim (np. Jan Kowalski), nie losowy ciąg znaków.",
    };
  }
  if (intencja === "soltys" && !czyPelneImieINazwisko(nazwa)) {
    return {
      ok: false,
      blad: "Jako osoba deklarująca sołtysa podaj pełne imię i nazwisko: co najmniej dwa wyrazy (np. Jan Kowalski), każde po min. 2 znaki.",
    };
  }
  return { ok: true, nazwa };
}
