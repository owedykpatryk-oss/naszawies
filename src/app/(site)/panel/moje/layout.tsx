import type { Metadata } from "next";
import { MojeNawigacjaZakladek } from "@/components/panel/moje/moje-nawigacja-zakladek";

export const metadata: Metadata = {
  title: "Moje",
};

export default function MojeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <MojeNawigacjaZakladek />
      {children}
    </div>
  );
}
