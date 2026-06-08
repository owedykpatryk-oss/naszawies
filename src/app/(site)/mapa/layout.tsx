export const dynamic = "force-dynamic";

/** Wspólny layout mapy — bramki logowania tylko na stronie katalogu (`/mapa`), nie na kartach POI. */
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
