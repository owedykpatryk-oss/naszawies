import { BramkiChronionychTras } from "@/components/panel/bramki-chronionych-tras";

export const dynamic = "force-dynamic";

export default function WybierzWiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BramkiChronionychTras />
      {children}
    </>
  );
}
