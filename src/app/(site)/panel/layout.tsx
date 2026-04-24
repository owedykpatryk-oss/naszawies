import { PanelNawigacja } from "@/components/panel/panel-nawigacja";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-5 py-8 text-stone-800 sm:py-10">
        <div className="no-print">
          <PanelNawigacja />
        </div>
        {children}
      </div>
    </div>
  );
}
