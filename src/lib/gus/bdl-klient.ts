const BDL_BASE = "https://bdl.stat.gov.pl/api/v1";

const OPOZNIENIE_MS = process.env.GUS_BDL_CLIENT_ID?.trim() ? 180 : 350;
const MAX_PROB_LIMITU = 3;
const MAX_PROB_SIEC = 2;

let ostatnieZapytanie = 0;
let kolejkaZapytan: Promise<unknown> = Promise.resolve();

/** Ostatni błąd HTTP/sieci — do diagnostyki synców. */
export let ostatniBladBdl: string | null = null;

function czekaj(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function wKolejceBdl<T>(fn: () => Promise<T>): Promise<T> {
  const wykonanie = kolejkaZapytan.then(fn);
  kolejkaZapytan = wykonanie.then(
    () => undefined,
    () => undefined,
  );
  return wykonanie;
}

async function czekajNaLimit(): Promise<void> {
  const teraz = Date.now();
  const delta = teraz - ostatnieZapytanie;
  if (delta < OPOZNIENIE_MS) {
    await czekaj(OPOZNIENIE_MS - delta);
  }
}

function naglowkiBdl(clientId?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "naszawies-pl/1.0 (GUS BDL sync)",
  };
  if (clientId?.trim()) h["X-ClientId"] = clientId.trim();
  return h;
}

async function pobierzJson<T>(url: string, clientId?: string): Promise<T | null> {
  return wKolejceBdl(async () => {
    for (let proba = 0; proba <= Math.max(MAX_PROB_LIMITU, MAX_PROB_SIEC); proba += 1) {
      await czekajNaLimit();
      try {
        const res = await fetch(url, {
          headers: naglowkiBdl(clientId),
          cache: "no-store",
          signal: AbortSignal.timeout(45_000),
        });
        ostatnieZapytanie = Date.now();

        if ((res.status === 429 || res.status === 412) && proba < MAX_PROB_LIMITU) {
          ostatniBladBdl = `HTTP ${res.status} (limit BDL)`;
          await czekaj(60_000 * (proba + 1));
          continue;
        }
        if (res.status >= 500 && proba < MAX_PROB_SIEC) {
          ostatniBladBdl = `HTTP ${res.status}`;
          await czekaj(5000 * (proba + 1));
          continue;
        }
        if (!res.ok) {
          ostatniBladBdl = `HTTP ${res.status} ${url}`;
          return null;
        }

        const json = (await res.json()) as T & { errorResult?: string };
        if (
          proba < MAX_PROB_LIMITU &&
          typeof json?.errorResult === "string" &&
          /limit|przekrocz/i.test(json.errorResult)
        ) {
          ostatniBladBdl = json.errorResult;
          await czekaj(60_000 * (proba + 1));
          continue;
        }
        ostatniBladBdl = null;
        return json;
      } catch (err) {
        ostatniBladBdl = err instanceof Error ? err.message : "błąd sieci";
        if (proba < MAX_PROB_SIEC) {
          await czekaj(5000 * (proba + 1));
          continue;
        }
        return null;
      }
    }
    return null;
  });
}

function normalizujTekst(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function nazwaPowiatuZBdl(name: string): string {
  return name.replace(/^powiat\s+/i, "").trim();
}

export type RegionBdl = { id: string; name: string };

type JednostkaBdl = { id: string; name: string; parentId?: string; level: number };

function dopasujNazwePowiatu(nazwaBdl: string, countySlug: string): boolean {
  const n = normalizujTekst(nazwaPowiatuZBdl(nazwaBdl));
  const c = normalizujTekst(countySlug);
  if (n === c) return true;
  if (n === normalizujTekst(`m st ${countySlug}`)) return true;
  if (n === normalizujTekst(`miasto ${countySlug}`)) return true;
  if (/m\.?\s*st\.?/i.test(nazwaBdl) && n.endsWith(c)) return true;
  if (n.includes(c) && c.length >= 5) return true;
  if (c.includes(n) && n.length >= 5) return true;
  return false;
}

/** Szuka powiatu w BDL (dokładna nazwa) i wędruje w górę do regionu NUTS2 (level 3). */
export async function znajdzRegionDlaPowiatu(
  countySlug: string,
  voivodeshipSlug?: string,
  clientId?: string,
): Promise<RegionBdl | null> {
  const nazwa = countySlug.trim().toLowerCase().replace(/^powiat\s+/i, "");
  if (!nazwa) return null;

  const url = new URL(`${BDL_BASE}/units/search`);
  url.searchParams.set("name", nazwa);
  url.searchParams.set("level", "5");
  url.searchParams.set("page-size", "15");
  url.searchParams.set("format", "json");

  const json = await pobierzJson<{ results?: JednostkaBdl[] }>(url.toString(), clientId);
  let kandydaci = (json?.results ?? []).filter(
    (u) => u.level === 5 && dopasujNazwePowiatu(u.name, nazwa),
  );

  if (kandydaci.length === 0) {
    const urlMiasto = new URL(`${BDL_BASE}/units/search`);
    urlMiasto.searchParams.set("name", `m. st. ${nazwa}`);
    urlMiasto.searchParams.set("level", "5");
    urlMiasto.searchParams.set("page-size", "5");
    urlMiasto.searchParams.set("format", "json");
    const j2 = await pobierzJson<{ results?: JednostkaBdl[] }>(urlMiasto.toString(), clientId);
    kandydaci = (j2?.results ?? []).filter((u) => u.level === 5);
  }

  if (kandydaci.length === 0) return null;

  let powiat: JednostkaBdl | null = kandydaci[0] ?? null;
  if (kandydaci.length > 1 && voivodeshipSlug) {
    const wojNorm = normalizujTekst(voivodeshipSlug);
    for (const k of kandydaci) {
      const woj = await znajdzWojewodztwoNadrzedne(k, clientId);
      if (woj && normalizujTekst(woj).includes(wojNorm)) {
        powiat = k;
        break;
      }
    }
  }
  if (!powiat?.parentId) return null;

  let aktualny: JednostkaBdl | null = powiat;
  for (let g = 0; g < 6 && aktualny; g++) {
    if (aktualny.level === 3) {
      return { id: aktualny.id, name: aktualny.name.replace(/^REGION\s+/i, "").trim() };
    }
    const pid: string | undefined = aktualny.parentId;
    if (!pid) break;
    const parent: JednostkaBdl | null = await pobierzJson<JednostkaBdl>(
      `${BDL_BASE}/units/${pid}?format=json`,
      clientId,
    );
    aktualny = parent;
  }
  return null;
}

async function znajdzWojewodztwoNadrzedne(
  powiat: JednostkaBdl,
  clientId?: string,
): Promise<string | null> {
  let pid = powiat.parentId;
  for (let i = 0; i < 6 && pid; i++) {
    const u = await pobierzJson<JednostkaBdl>(`${BDL_BASE}/units/${pid}?format=json`, clientId);
    if (!u) break;
    if (u.level === 2) return u.name;
    pid = u.parentId;
  }
  return null;
}

export type WartoscRegionalna = { regionId: string; regionName: string; year: number; value: number };

export type WartoscJednostki = { unitId: string; unitName: string; year: number; value: number };

type BdlDataByVar = {
  totalRecords?: number;
  links?: { next?: string };
  results?: { id: string; name: string; values?: { year: string; val: number; attrId?: number }[] }[];
};

export type WynikDanychBdl = {
  wiersze: WartoscJednostki[];
  zapytaniaApi: number;
};

/** Pobiera wartości zmiennej dla jednostek na danym poziomie (np. 2=woj, 6=gmina). */
export async function pobierzDaneZmiennejPoPoziomie(
  varId: number,
  lata: number[],
  unitLevel: number,
  clientId?: string,
): Promise<WynikDanychBdl> {
  const out: WartoscJednostki[] = [];
  const pageSize = 500;
  let page = 0;
  let zapytaniaApi = 0;

  for (;;) {
    const url = new URL(`${BDL_BASE}/data/by-variable/${varId}`);
    url.searchParams.set("format", "json");
    url.searchParams.set("unit-level", String(unitLevel));
    url.searchParams.set("page-size", String(pageSize));
    url.searchParams.set("page", String(page));
    for (const y of lata) url.searchParams.append("year", String(y));

    const json = await pobierzJson<BdlDataByVar>(url.toString(), clientId);
    zapytaniaApi += 1;

    const rows = json?.results ?? [];
    if (rows.length === 0) break;

    for (const row of rows) {
      for (const v of row.values ?? []) {
        if (v.attrId != null && v.attrId !== 1) continue;
        if (v.val == null || v.val <= 0) continue;
        out.push({
          unitId: row.id,
          unitName: row.name,
          year: Number(v.year),
          value: v.val,
        });
      }
    }

    page += 1;
    if (rows.length < pageSize) break;
    if (json?.totalRecords != null && page * pageSize >= json.totalRecords) break;
  }

  return { wiersze: out, zapytaniaApi };
}

/** Pobiera wartości zmiennej dla wszystkich regionów NUTS2 w podanych latach. */
export async function pobierzDaneZmiennejRegionalnej(
  varId: number,
  lata: number[],
  clientId?: string,
): Promise<WartoscRegionalna[]> {
  const { wiersze } = await pobierzDaneZmiennejPoPoziomie(varId, lata, 3, clientId);
  return wiersze.map((w) => ({
    regionId: w.unitId,
    regionName: w.unitName.replace(/^REGION\s+/i, "").trim(),
    year: w.year,
    value: w.value,
  }));
}
