const SYGNATURY: ReadonlyArray<{ mime: string; bajty: readonly number[]; offset?: number }> = [
  { mime: "image/jpeg", bajty: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bajty: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bajty: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

/** Sprawdza magic bytes — MIME z przeglądarki nie wystarcza. */
export function rozpoznajMimeObrazuZBajtow(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "image/webp";
  }

  for (const s of SYGNATURY) {
    const off = s.offset ?? 0;
    if (buf.length < off + s.bajty.length) continue;
    const pasuje = s.bajty.every((b, i) => buf[off + i] === b);
    if (pasuje) return s.mime;
  }

  return null;
}

export function czyBuforZgodnyZMimeObrazu(buf: Buffer, deklarowanyMime: string): boolean {
  const wykryty = rozpoznajMimeObrazuZBajtow(buf);
  if (!wykryty) return false;
  return wykryty === deklarowanyMime;
}
