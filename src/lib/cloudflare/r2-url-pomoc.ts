import { R2_WSZYSTKIE_BUCKETY } from "./r2-bucket-znaczniki";

/** Zwraca możliwe bazy publiczne (bez końcowego /), bez duplikatów. */
export function pobierzZnaneBazyPubliczneR2(): string[] {
  const raw = [
    process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL,
    process.env.CLOUDFLARE_R2_CUSTOM_DOMAIN,
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL,
  ];
  const zestaw = new Set<string>();
  for (const s of raw) {
    const t = s?.trim().replace(/\/$/, "");
    if (t) zestaw.add(t);
  }
  return Array.from(zestaw);
}

/**
 * Publiczny URL obiektu: `{origin}/{bucket}/{segment1}/{segment2}/…`
 * (jedna domena / Worker mapujący ścieżki na buckety R2).
 */
function jestZnanymBucketemR2(s: string): boolean {
  return (R2_WSZYSTKIE_BUCKETY as readonly string[]).includes(s);
}

export function zbudujPublicznyUrlObiektuR2(bucket: string, klucz: string): string | null {
  const bazy = pobierzZnaneBazyPubliczneR2();
  const origin = bazy[0];
  if (!origin) return null;
  if (!jestZnanymBucketemR2(bucket)) return null;
  const sciezka = klucz.split("/").map(encodeURIComponent).join("/");
  return `${origin}/${encodeURIComponent(bucket)}/${sciezka}`;
}

/** Czy URL wygląda na nasz obiekt R2 (dowolna znana baza). */
export function czyUrlToObiektR2(publicUrl: string): boolean {
  return pobierzZnaneBazyPubliczneR2().some((baza) => publicUrl.startsWith(`${baza}/`));
}

/** Z publicznego URL zwraca bucket R2 i klucz obiektu lub null. */
export function wyciagnijBucketIKluczZUrlaR2(publicUrl: string): { bucket: string; key: string } | null {
  for (const baza of pobierzZnaneBazyPubliczneR2()) {
    if (!publicUrl.startsWith(`${baza}/`)) continue;
    const rest = publicUrl.slice(baza.length + 1);
    const slash = rest.indexOf("/");
    if (slash <= 0) continue;
    const bucketEnc = rest.slice(0, slash);
    const pathRest = rest.slice(slash + 1);
    let bucket: string;
    try {
      bucket = decodeURIComponent(bucketEnc);
    } catch {
      continue;
    }
    if (!jestZnanymBucketemR2(bucket)) continue;
    const segmenty = pathRest.split("/").filter(Boolean);
    let key: string;
    try {
      key = segmenty.map((s) => decodeURIComponent(s)).join("/");
    } catch {
      continue;
    }
    if (!key) continue;
    return { bucket, key };
  }
  return null;
}
