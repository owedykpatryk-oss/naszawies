const BDL_BASE = "https://bdl.stat.gov.pl/api/v1";

const OPOZNIENIE_MS = process.env.GUS_BDL_CLIENT_ID?.trim() ? 180 : 350;
const MAX_PROB_LIMITU = 3;

let ostatnieZapytanie = 0;

function czekaj(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function czekajNaLimit(): Promise<void> {
  const teraz = Date.now();
  const delta = teraz - ostatnieZapytanie;
  if (delta < OPOZNIENIE_MS) {
    await czekaj(OPOZNIENIE_MS - delta);
  }
  ostatnieZapytanie = Date.now();
}

function naglowkiBdl(clientId?: string): HeadersInit {
  const h: Record<string, string> = { Accept: "application/json" };
  if (clientId?.trim()) h["X-ClientId"] = clientId.trim();
  return h;
}

async function pobierzJson<T>(url: string, clientId?: string, proba = 0): Promise<T | null> {
  await czekajNaLimit();
  try {
    const res = await fetch(url, {
      headers: naglowkiBdl(clientId),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    if (res.status === 429 && proba < MAX_PROB_LIMITU) {
      await czekaj(60_000 * (proba + 1));
      return pobierzJson<T>(url, clientId, proba + 1);
    }
    if (!res.ok) return null;
    const json = (await res.json()) as T & { errorResult?: string };
    if (
      proba < MAX_PROB_LIMITU &&
      typeof json?.errorResult === "string" &&
      /limit|przekrocz/i.test(json.errorResult)
    ) {
      await czekaj(60_000 * (proba + 1));
      return pobierzJson<T>(url, clientId, proba + 1);
    }
    return json;
  } catch {
    return null;
  }
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
  if (/m\.?\s*st\.?/i.test(nazwaBdl) && n.endsWith(c)) return true;
  return false;
}

/** Szuka powiatu w BDL (dokładna nazwa) i wędruje w górę do regionu NUTS2 (level 3). */
export async function znajdzRegionDlaPowiatu(
  countySlug: string,
  voivodeshipSlug?: string,
  clientId?: string,
): Promise<RegionBdl | null> {
  const nazwa = countySlug.trim().toLowerCase();
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

type BdlDataByVar = {
  results?: { id: string; name: string; values?: { year: string; val: number; attrId?: number }[] }[];
};

/** Pobiera wartości zmiennej dla wszystkich regionów NUTS2 w podanych latach. */
export async function pobierzDaneZmiennejRegionalnej(
  varId: number,
  lata: number[],
  clientId?: string,
): Promise<WartoscRegionalna[]> {
  const url = new URL(`${BDL_BASE}/data/by-variable/${varId}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("unit-level", "3");
  for (const y of lata) url.searchParams.append("year", String(y));

  const json = await pobierzJson<BdlDataByVar>(url.toString(), clientId);
  const out: WartoscRegionalna[] = [];
  for (const row of json?.results ?? []) {
    for (const v of row.values ?? []) {
      if (v.attrId != null && v.attrId !== 1) continue;
      if (v.val == null || v.val <= 0) continue;
      out.push({
        regionId: row.id,
        regionName: row.name.replace(/^REGION\s+/i, "").trim(),
        year: Number(v.year),
        value: v.val,
      });
    }
  }
  return out;
}
