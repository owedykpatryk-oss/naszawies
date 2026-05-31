/** Link rejestracji z prefill wsi — używany na profilu publicznym i w QR zaproszenia. */
export function linkRejestracjiDoWsi(villageId: string): string {
  const next = encodeURIComponent("/panel/mieszkaniec#dolacz-mieszkaniec");
  return `/rejestracja?wies=${encodeURIComponent(villageId)}&intencja=mieszkaniec&next=${next}`;
}

export function linkLogowaniaDoWsi(villageId: string): string {
  const next = encodeURIComponent("/panel/mieszkaniec#dolacz-mieszkaniec");
  return `/logowanie?wies=${encodeURIComponent(villageId)}&next=${next}`;
}
