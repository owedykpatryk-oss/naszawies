/** Wspólny szkielet ładowania segmentów panelu (mieszkaniec, sołtys, moje, czat). */
export function PanelSegmentLoading() {
  return (
    <main className="space-y-4" aria-busy="true" aria-label="Ładowanie">
      <div className="h-16 animate-pulse rounded-xl border border-stone-200/60 bg-stone-100/40" />
      <div className="h-32 animate-pulse rounded-2xl border border-stone-200/60 bg-stone-100/30" />
    </main>
  );
}
