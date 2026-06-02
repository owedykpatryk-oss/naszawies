import type { KontekstGrafiki, SzablonGrafiki } from "./typy";

export type SugestiaPolaGrafiki = {
  id: string;
  etykieta: string;
  poleDocelowe: string;
  wartosc: string;
};

export type GrupaSugestiiGrafiki = {
  grupa: string;
  sugestie: SugestiaPolaGrafiki[];
};

function maPole(szablon: SzablonGrafiki, id: string): boolean {
  return szablon.pola.some((p) => p.id === id);
}

function zaDniIso(dni: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dni);
  return d.toISOString().slice(0, 10);
}

function najblizszaSobotaIso(): string {
  const d = new Date();
  const dzien = d.getDay();
  const doSoboty = (6 - dzien + 7) % 7 || 7;
  d.setDate(d.getDate() + doSoboty);
  return d.toISOString().slice(0, 10);
}

export function zbudujSugestieGrafiki(
  szablon: SzablonGrafiki,
  kontekst: KontekstGrafiki,
): GrupaSugestiiGrafiki[] {
  const wies = kontekst.wies?.trim() || "{{wies}}";
  const gmina = kontekst.gmina?.trim() || "{{gmina}}";
  const tel = kontekst.telefon?.trim();
  const grupy: GrupaSugestiiGrafiki[] = [];

  const daty: SugestiaPolaGrafiki[] = [];
  if (maPole(szablon, "data")) {
    daty.push(
      { id: "d-7", etykieta: "Za tydzień", poleDocelowe: "data", wartosc: zaDniIso(7) },
      { id: "d-sob", etykieta: "Najbliższa sobota", poleDocelowe: "data", wartosc: najblizszaSobotaIso() },
      { id: "d-14", etykieta: "Za 2 tygodnie", poleDocelowe: "data", wartosc: zaDniIso(14) },
    );
  }
  if (maPole(szablon, "godzina")) {
    daty.push(
      { id: "g-18", etykieta: "Godz. 18:00", poleDocelowe: "godzina", wartosc: "18:00" },
      { id: "g-10", etykieta: "Godz. 10:00", poleDocelowe: "godzina", wartosc: "10:00" },
      { id: "g-15", etykieta: "Godz. 15:00", poleDocelowe: "godzina", wartosc: "15:00" },
    );
  }
  if (daty.length) grupy.push({ grupa: "Data i godzina", sugestie: daty });

  const miejsca: SugestiaPolaGrafiki[] = [];
  if (maPole(szablon, "miejsce")) {
    miejsca.push(
      { id: "m-sw", etykieta: "Świetlica", poleDocelowe: "miejsce", wartosc: `Świetlica wiejska, ${wies}` },
      { id: "m-tab", etykieta: "Tablica ogłoszeń", poleDocelowe: "miejsce", wartosc: `Tablica ogłoszeń, ${wies}` },
      { id: "m-sala", etykieta: "Sala wiejska", poleDocelowe: "miejsce", wartosc: `Sala wiejska, ${wies}` },
    );
  }
  if (miejsca.length) grupy.push({ grupa: "Miejsce", sugestie: miejsca });

  const kontakt: SugestiaPolaGrafiki[] = [];
  if (maPole(szablon, "kontakt") && tel) {
    kontakt.push({ id: "k-tel", etykieta: "Tel. z profilu", poleDocelowe: "kontakt", wartosc: `tel. ${tel}` });
  }
  if (maPole(szablon, "organizator")) {
    kontakt.push({
      id: "o-sol",
      etykieta: "Sołectwo",
      poleDocelowe: "organizator",
      wartosc: kontekst.organizator?.trim() || `Sołectwo ${wies}`,
    });
    kontakt.push({
      id: "o-rada",
      etykieta: "Rada Sołecka",
      poleDocelowe: "organizator",
      wartosc: `Rada Sołecka ${wies} · Gmina ${gmina}`,
    });
  }
  if (kontakt.length) grupy.push({ grupa: "Kontakt i organizator", sugestie: kontakt });

  const program: SugestiaPolaGrafiki[] = [];
  if (maPole(szablon, "opis")) {
    if (szablon.tagi?.includes("zebranie") || szablon.id.includes("zebranie")) {
      program.push({
        id: "p-zeb",
        etykieta: "Porządek zebrania",
        poleDocelowe: "opis",
        wartosc:
          "Porządek obrad:\n1. Otwarcie zebrania\n2. Sprawozdanie sołtysa\n3. Fundusz sołecki\n4. Sprawy bieżące\n5. Sprawy różne",
      });
    }
    if (szablon.tagi?.includes("Dzień Dziecka") || szablon.layout === "plakat-dzieci") {
      program.push({
        id: "p-dd",
        etykieta: "Program dla dzieci",
        poleDocelowe: "opis",
        wartosc: "🎈 Animacje · 🎨 Warsztaty · 🍦 Poczęstunek · 🏆 Konkursy z nagrodami",
      });
    }
    if (szablon.tagi?.includes("festyn") || szablon.id.includes("festyn")) {
      program.push({
        id: "p-fes",
        etykieta: "Program festynu",
        poleDocelowe: "opis",
        wartosc: "• Stoiska KGW i rękodzieło\n• Koncert i zabawa\n• Gry i konkursy\n• Poczęstunek",
      });
    }
  }
  if (program.length) grupy.push({ grupa: "Program / treść", sugestie: program });

  return grupy;
}
