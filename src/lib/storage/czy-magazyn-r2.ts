/** Klient: czy wgrywać przez R2 (wymaga publicznego originu w bundlu). */
export function czyKlientUzywaMagazynuR2(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.trim());
}
