/** Uzupełnia obrazy w HTML artykułu o lazy loading i owija tabele w przewijany kontener. */
export function uzupelnijHtmlTresci(html: string): string {
  let wynik = html.replace(/<table class="blog-tabela"[^>]*>[\s\S]*?<\/table>/gi, (tabela) => {
    if (tabela.includes("blog-tabela-scroll")) return tabela;
    return `<div class="blog-tabela-scroll">${tabela}</div>`;
  });

  wynik = wynik.replace(/<img\b([^>]*)>/gi, (_pelny, atrybuty: string) => {
    let attrs = atrybuty;
    if (!/\bloading\s*=/.test(attrs)) attrs += ' loading="lazy"';
    if (!/\bdecoding\s*=/.test(attrs)) attrs += ' decoding="async"';
    return `<img${attrs}>`;
  });

  return wynik;
}
