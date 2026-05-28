# Źródła otwarte — dane.gov.pl i Geoportal

## Jak to się ma do naszawies.pl

| Portal | Rola | Jak używamy |
|--------|------|-------------|
| **[dane.gov.pl](https://dane.gov.pl/pl)** | Katalog metadanych + linki do API i plików | Dokumentacja, wyszukiwanie datasetów (`api.dane.gov.pl`), plan rozwoju |
| **[Geoportal.gov.pl](https://www.geoportal.gov.pl/)** | Usługi WFS/WMS (PRG, PRNG, KIN) | **Cron** — granice, adresy, nazwy geograficzne, instytucje |
| **OpenStreetMap** | POI, przystanki | Cron + przycisk sołtysa „Uzupełnij z OSM” |

Większość danych przestrzennych **nie idzie przez dane.gov.pl**, tylko bezpośrednio z WFS Geoportalu (tak samo jak w QGIS).

## Wdrożone (Geoportal + OSM)

| Źródło | Endpoint / env | Efekt |
|--------|----------------|-------|
| PRG granice | `GEOPORTAL_PRG_WFS_*` | `boundary_geojson` na mapie |
| KIN adresy | `GEOPORTAL_PRG_ADDRESS_*` | `address_points`, sekcja na profilu wsi |
| PRNG | `GEOPORTAL_PRNG_WFS_TYPENAME` | `geo_context_features` (nazwy rzek, wzgórz…) |
| PRG instytucje | `GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES` | OSP/policja/nadleśnictwo w promieniu wsi |
| OSM | `POI_AUTO_SYNC_*` | Pinezki: szkoła, kościół, przystanek… |

**Uwaga techniczna:** usługi GUGiK zwracają dane głównie jako **GML2**, nie JSON. Klient `wfs-get-feature.ts` próbuje GML2, potem JSON.

## Przydatne z dane.gov.pl (katalog — do wdrożenia)

| Dataset (id) | Zastosowanie na naszawies |
|--------------|---------------------------|
| **726** PRG | Ten sam rejestr co Geoportal — link dla mieszkańców |
| **747** TERYT API (GUS) | Walidacja SIMC przy rejestracji wsi |
| **544** REGON BIR1 | Auto-fill profilu OSP / parafii / firmy (wymaga klucza GUS) |
| **2752** GDDKiA utrudnienia | Alert przy wyjeździe z wsi (drogi krajowe) |
| PKW / wybory | Statystyka obywatelska sołectwa (historycznie) |
| GUS spis rolny | Profil rolniczy gminy/wsi |

Wyszukiwanie API:

```text
GET https://api.dane.gov.pl/datasets?title=TERYT&per_page=5
```

W kodzie: `src/lib/otwarte-dane/dane-gov-api.ts`, katalog: `katalog-zrodel.ts`.

## Geoportal — co jeszcze warto

| Usługa | Po co |
|--------|-------|
| **Ortofotomapa WMS** | Podkład mapy zamiast OSM (`NEXT_PUBLIC_GEOPORTAL_WMS_URL`) |
| **R01/R02** rejony statystyczne | Kontekst GUS / planowanie |
| **U06 Nadleśnictwo** | Już w domyślnej liście instytucji |
| **W* ** warstwy morskie | Tylko wsi nad morzem |

Pełna lista warstw PRG WFS: `GetCapabilities` na  
`https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries`

## Domyślne warstwy instytucji (`.env`)

```env
GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES=K07_Komenda_powiatowa_strazy_pozarnej,K02_Komenda_powiatowa_policji,K05_Komisariat_policji,U06_Nadlesnictwo,U02_Urzad_skarbowy,U09_Regionalny_zarzad_gospodarki_wodnej_PGWWP
```

Prefix `ms:` w nazwie warstwy jest opcjonalny — WFS akceptuje obie formy.

## Attribution (PZGiK)

Przy publikacji map/opisów z danych Geoportalu:

> Wykorzystano materiały państwowego zasobu geodezyjnego i kartograficznego.

## Powiązane

- [AUTOMATYZACJA.md](./AUTOMATYZACJA.md) — cron, transport, GTFS
- `docs/Extra/PLAN_ROZWOJU_STRONY_WSI.md` §12.3 — starsza lista pomysłów
