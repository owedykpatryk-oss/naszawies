/** Uzupełnia obrazy w HTML artykułu o lazy loading i decoding async. */
export function uzupelnijHtmlTresci(html: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (pelny, atrybuty: string) => {
    let attrs = atrybuty;
    if (!/\bloading\s*=/.test(attrs)) attrs += ' loading="lazy"';
    if (!/\bdecoding\s*=/.test(attrs)) attrs += ' decoding="async"';
    return `<img${attrs}>`;
  });
}
