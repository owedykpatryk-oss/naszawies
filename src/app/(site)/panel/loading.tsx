export default function PanelLoading() {
  return (
    <main className="animate-pulse space-y-6" aria-busy="true" aria-label="Ładowanie panelu">
      <div className="h-36 rounded-2xl border border-stone-200/80 bg-stone-100/60" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-stone-200/60 bg-stone-100/50" />
        ))}
      </div>
    </main>
  );
}
