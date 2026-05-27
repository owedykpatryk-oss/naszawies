/** Informacja ogólna — nie stanowi porady prawnej. */
export function InformacjaPrawnaRol() {
  return (
    <details className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-xs text-amber-950">
      <summary className="cursor-pointer font-medium">Sprzedaż bezpośrednia — informacja (nie porada prawna)</summary>
      <div className="mt-2 space-y-2 leading-relaxed text-amber-900/90">
        <p>
          Ogłoszenia na rynku lokalnym publikują mieszkańcy we własnym imieniu. Przy sprzedaży żywności z gospodarstwa
          rolnego (np. miód, jaja, warzywa) obowiązują przepisy o sprzedaży bezpośredniej — m.in. oznakowanie, limity
          ilościowe i zakazy dla niektórych produktów.
        </p>
        <p>
          Sprzedawca odpowiada za prawdziwość opisu, jakość produktu i ewentualne alergeny. Platforma NaszaWieś pełni
          rolę tablicy ogłoszeń po moderacji sołtysa — nie jest stroną umowy kupna-sprzedaży.
        </p>
        <p className="text-[10px] text-amber-800">
          W razie wątpliwości skonsultuj się z ARiMR, sanepidem lub prawnikiem. Ten tekst ma charakter wyłącznie
          informacyjny.
        </p>
      </div>
    </details>
  );
}
