/**
 * Lekki klient katalogu https://api.dane.gov.pl (JSON:API 1.4).
 * Służy do wyszukiwania datasetów — nie zastępuje WFS Geoportalu.
 */

const API_BASE = "https://api.dane.gov.pl";

export type DaneGovDatasetSkrot = {
  id: string;
  title: string;
  slug: string;
  notes: string;
  institutionId: string | null;
  formats: string[];
  types: string[];
  url: string | null;
  apiUrl: string | null;
  modified: string | null;
  link: string;
};

type JsonApiDataset = {
  id: string;
  type: string;
  attributes?: {
    title?: string;
    slug?: string;
    notes?: string;
    url?: string;
    modified?: string;
    formats?: string[];
    types?: string[];
  };
  relationships?: {
    institution?: { data?: { id?: string } };
  };
  links?: { self?: string };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapDataset(row: JsonApiDataset): DaneGovDatasetSkrot {
  const a = row.attributes ?? {};
  const instId = row.relationships?.institution?.data?.id ?? null;
  const self = row.links?.self ?? `${API_BASE}/1.4/datasets/${row.id}`;
  return {
    id: row.id,
    title: a.title ?? "",
    slug: a.slug ?? "",
    notes: a.notes ? stripHtml(a.notes).slice(0, 400) : "",
    institutionId: instId,
    formats: a.formats ?? [],
    types: a.types ?? [],
    url: a.url && a.url.length > 0 ? a.url : null,
    apiUrl: null,
    modified: a.modified ?? null,
    link: self,
  };
}

export async function szukajDatasetowDaneGovPl(
  query: string,
  opts?: { perPage?: number },
): Promise<{ ok: true; items: DaneGovDatasetSkrot[]; count: number } | { ok: false; reason: string }> {
  const q = query.trim();
  if (!q) return { ok: false, reason: "Puste zapytanie." };

  const perPage = Math.min(20, Math.max(1, opts?.perPage ?? 8));
  const params = new URLSearchParams({
    title: q,
    per_page: String(perPage),
    sort: "-metadata_modified",
  });

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/datasets?${params.toString()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "application/vnd.api+json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg };
  }

  if (!res.ok) {
    return { ok: false, reason: `API dane.gov.pl HTTP ${res.status}` };
  }

  let body: { data?: JsonApiDataset[]; meta?: { count?: number } };
  try {
    body = (await res.json()) as typeof body;
  } catch {
    return { ok: false, reason: "Nieprawidłowa odpowiedź JSON." };
  }

  const items = (body.data ?? []).map(mapDataset);
  return { ok: true, items, count: body.meta?.count ?? items.length };
}
