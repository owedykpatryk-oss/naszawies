/** Linki do oficjalnych wyszukiwarek rozkładów (PKP, PKS, agregatory). */

export type KontekstWsiTransport = {
  name: string;
  voivodeship?: string | null;
  county?: string | null;
  commune?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type LinkTransportuZewnetrzny = {
  id: string;
  etykieta: string;
  opis: string;
  href: string;
  rodzaj: "kolej" | "autobus" | "agregator";
};

function enkoduj(s: string): string {
  return encodeURIComponent(s.trim());
}

export function linkRozkladPkp(): string {
  return "https://rozklad.pkp.pl/pl/recommended";
}

export function linkJakdojadeZMiejsca(wies: KontekstWsiTransport): string {
  const fraza = [wies.name, wies.commune, wies.county].filter(Boolean).join(", ");
  return `https://jakdojade.pl/${enkoduj(wies.voivodeship ?? "polska")}/trasa/?tn=${enkoduj(fraza)}`;
}

export function linkGoogleMapsTransit(lat: number, lon: number, etykieta: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}&query_place_id=${enkoduj(etykieta)}`;
}

export function linkEpodroznikSzukaj(fraza: string): string {
  return `https://www.e-podroznik.pl/public/search?from=${enkoduj(fraza)}`;
}

export function linkMoovitSzukaj(lat: number, lon: number): string {
  return `https://moovitapp.com/?lat=${lat}&lon=${lon}`;
}

export function zbudujLinkiTransportuDlaWsi(wies: KontekstWsiTransport): LinkTransportuZewnetrzny[] {
  const frazaMiejsca = [wies.name, wies.commune, wies.county, wies.voivodeship].filter(Boolean).join(", ");
  const linki: LinkTransportuZewnetrzny[] = [
    {
      id: "pkp",
      etykieta: "PKP — rozkład pociągów",
      opis: "Oficjalna wyszukiwarka PKP (pociągi, opóźnienia).",
      href: linkRozkladPkp(),
      rodzaj: "kolej",
    },
    {
      id: "jakdojade",
      etykieta: "Jakdojade.pl",
      opis: "Połączenia autobus + kolej z okolicy wsi.",
      href: linkJakdojadeZMiejsca(wies),
      rodzaj: "agregator",
    },
    {
      id: "epodroznik",
      etykieta: "e-podróżnik",
      opis: "PKS i busy — wyszukaj kurs z lub do miejscowości.",
      href: linkEpodroznikSzukaj(frazaMiejsca || wies.name),
      rodzaj: "autobus",
    },
  ];

  if (wies.latitude != null && wies.longitude != null) {
    const lat = Number(wies.latitude);
    const lon = Number(wies.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      linki.push({
        id: "google-maps",
        etykieta: "Google Maps — transport",
        opis: "Przystanki i dojazd w pobliżu GPS wsi.",
        href: linkGoogleMapsTransit(lat, lon, wies.name),
        rodzaj: "agregator",
      });
      linki.push({
        id: "moovit",
        etykieta: "Moovit",
        opis: "Mapa komunikacji miejskiej i regionalnej.",
        href: linkMoovitSzukaj(lat, lon),
        rodzaj: "agregator",
      });
    }
  }

  return linki;
}

export function linkRozkladPrzystanku(nazwa: string, wies: KontekstWsiTransport): string {
  const fraza = `${nazwa}, ${wies.name}`;
  return linkEpodroznikSzukaj(fraza);
}
