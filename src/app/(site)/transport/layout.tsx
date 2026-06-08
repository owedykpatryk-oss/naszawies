export const dynamic = "force-dynamic";

/** Bramki logowania tylko na hubie `/transport` — rozkład PKP (`/transport/rozklad`) jest publiczny. */
export default function TransportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
