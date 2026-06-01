import { BramkiChronionychTras } from "@/components/panel/bramki-chronionych-tras";

export const dynamic = "force-dynamic";

export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BramkiChronionychTras />
      {children}
    </>
  );
}
