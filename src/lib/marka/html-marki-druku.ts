import { MARKA_SCIEZKI } from "./sciezki";

/** Style znaku wodnego i logo w rogu — HTML drukowany / PDF z generatora. */
export function cssMarkiNaDokumencieHtml(): string {
  const znak = MARKA_SCIEZKI.znakOkrag;
  const rog = MARKA_SCIEZKI.znakOkrag64;
  return `
    .marka-doc-znak-wodny {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
      user-select: none;
    }
    .marka-doc-znak-wodny::after {
      content: "";
      width: min(52%, 300px);
      aspect-ratio: 1;
      background: url("${znak}") center / contain no-repeat;
      opacity: 0.07;
    }
    .marka-doc-rog {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 2;
      width: 52px;
      height: 52px;
      pointer-events: none;
    }
    .marka-doc-rog img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .marka-doc-tresc > *:not(.marka-doc-znak-wodny):not(.marka-doc-rog) {
      position: relative;
      z-index: 1;
    }
  `;
}

/** Znak wodny + małe logo w prawym górnym rogu (wstrzyknij wewnątrz kontenera dokumentu). */
export function htmlMarkiNaDokumencie(): string {
  const znak = MARKA_SCIEZKI.znakOkrag;
  const rog = MARKA_SCIEZKI.znakOkrag64;
  return `<div class="marka-doc-znak-wodny" aria-hidden="true"></div>
<div class="marka-doc-rog" aria-hidden="true"><img src="${rog}" alt="naszawies.pl" width="52" height="52" /></div>`;
}

type OtoczenieDrukuOpcje = {
  tytul: string;
  body: string;
  /** Dodatkowe reguły CSS (np. style dokumentu sołtysa). */
  dodatkowyCss?: string;
};

/** Pełna strona HTML do `window.open` + druk (checklisty, protokoły). */
export function otoczenieHtmlDoDruku({ tytul, body, dodatkowyCss = "" }: OtoczenieDrukuOpcje): string {
  const znak = MARKA_SCIEZKI.znakOkrag;
  const rog = MARKA_SCIEZKI.znakOkrag64;
  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8"/>
<title>${tytul}</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; padding: 28px 32px 36px; line-height: 1.55; color: #1c1917; margin: 0; }
  h1 { font-size: 1.35rem; margin: 0 0 0.75rem; color: #14532d; }
  h2 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; color: #14532d; }
  .muted { color: #57534e; font-size: 0.85rem; }
  .marka-wrap { position: relative; isolation: isolate; min-height: 120px; }
  .marka-wrap::before {
    content: "";
    position: absolute;
    inset: 0;
    background: url("${znak}") center / min(42%, 260px) no-repeat;
    opacity: 0.06;
    pointer-events: none;
    z-index: 0;
  }
  .marka-rog {
    position: absolute;
    top: 0;
    right: 0;
    width: 48px;
    height: 48px;
    z-index: 2;
  }
  .marka-rog img { width: 100%; height: 100%; object-fit: contain; display: block; }
  .marka-tresc { position: relative; z-index: 1; }
  .stopka-marka { margin-top: 2rem; padding-top: 0.75rem; border-top: 1px solid #e7e5e4; font-size: 0.7rem; color: #a8a29e; text-align: center; }
  @media print { body { padding: 12mm; } }
  ${cssMarkiNaDokumencieHtml()}
  ${dodatkowyCss}
</style>
</head>
<body>
<div class="marka-wrap">
  <div class="marka-rog" aria-hidden="true"><img src="${rog}" alt="naszawies.pl" width="48" height="48" /></div>
  <div class="marka-tresc">
    ${body}
    <p class="stopka-marka">Wygenerowano w serwisie naszawies.pl</p>
  </div>
</div>
</body>
</html>`;
}
