/** Kafelki satelitarne (Esri World Imagery) — ten sam podkład co na mapie wsi. */

export type KafelSatelitarny = {
  url: string;
  x: number;
  y: number;
  szer: number;
  wys: number;
};

const ROZMIAR_KAFELKA = 256;
const URL_SATELITA =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

function pikseleSwiata(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const skala = ROZMIAR_KAFELKA * 2 ** zoom;
  const x = ((lng + 180) / 360) * skala;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * skala;
  return { x, y };
}

/** Siatka 3×3 (domyślnie) kafelków satelitarnych dopasowana do viewBox 100×70. */
export function kafelkiSatelitarne(
  lat: number,
  lng: number,
  zoom = 18,
  promienKafelkow = 1,
): KafelSatelitarny[] {
  const srodek = pikseleSwiata(lat, lng, zoom);
  const tileX0 = Math.floor(srodek.x / ROZMIAR_KAFELKA);
  const tileY0 = Math.floor(srodek.y / ROZMIAR_KAFELKA);
  const liczbaKafelkow = 2 * promienKafelkow + 1;
  const siatkaPx = liczbaKafelkow * ROZMIAR_KAFELKA;
  const lewoPx = (tileX0 - promienKafelkow) * ROZMIAR_KAFELKA;
  const goraPx = (tileY0 - promienKafelkow) * ROZMIAR_KAFELKA;
  const vbW = 100;
  const vbH = 70;
  const wynik: KafelSatelitarny[] = [];

  for (let dy = -promienKafelkow; dy <= promienKafelkow; dy++) {
    for (let dx = -promienKafelkow; dx <= promienKafelkow; dx++) {
      const tx = tileX0 + dx;
      const ty = tileY0 + dy;
      const px = tx * ROZMIAR_KAFELKA;
      const py = ty * ROZMIAR_KAFELKA;
      wynik.push({
        url: `${URL_SATELITA}/${zoom}/${ty}/${tx}`,
        x: ((px - lewoPx) / siatkaPx) * vbW,
        y: ((py - goraPx) / siatkaPx) * vbH,
        szer: (ROZMIAR_KAFELKA / siatkaPx) * vbW,
        wys: (ROZMIAR_KAFELKA / siatkaPx) * vbH,
      });
    }
  }
  return wynik;
}

/** Pojedynczy kafelek (legacy) — zachowane dla starszych widoków. */
export function urlPodkladuOrtofoto(lat: number, lon: number, zoom = 18): string {
  const srodek = pikseleSwiata(lat, lon, zoom);
  const tx = Math.floor(srodek.x / ROZMIAR_KAFELKA);
  const ty = Math.floor(srodek.y / ROZMIAR_KAFELKA);
  return `${URL_SATELITA}/${zoom}/${ty}/${tx}`;
}
