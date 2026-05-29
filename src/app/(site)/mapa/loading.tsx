export default function MapaLoading() {
  return (
    <main className="page-shell py-10 sm:py-14" aria-busy="true" aria-label="Ładowanie mapy">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200/80" />
      <div className="mt-4 h-4 max-w-xl animate-pulse rounded bg-stone-100" />
      <div
        className="mt-10 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-green-900/15 bg-gradient-to-b from-stone-50 to-emerald-50/30"
        role="status"
      >
        <p className="text-sm font-medium text-green-900/80">Ładowanie mapy…</p>
      </div>
    </main>
  );
}
