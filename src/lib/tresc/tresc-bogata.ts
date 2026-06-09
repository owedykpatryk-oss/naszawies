/** Prosty format tekstu: akapity, **pogrubienie**, *kursywa*, [link](url), listy - bez zewnętrznych zależności. */

export function ucieknijHtml(tekst: string): string {
  return tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function przetworzTrescBogata(tekst: string): string {
  const zrodlo = tekst.trim();
  if (!zrodlo) return "";

  let s = ucieknijHtml(zrodlo);
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" class="text-green-800 underline hover:text-green-950" rel="noopener noreferrer" target="_blank">$1</a>',
  );
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>");

  const linie = s.split("\n");
  const fragmenty: string[] = [];
  let buforListy: string[] = [];
  let buforAkapit: string[] = [];

  function domknijAkapit() {
    if (buforAkapit.length === 0) return;
    fragmenty.push(
      `<p class="mb-3 last:mb-0">${buforAkapit.join("<br />")}</p>`,
    );
    buforAkapit = [];
  }

  function domknijListe() {
    if (buforListy.length === 0) return;
    fragmenty.push(
      `<ul class="my-2 list-disc space-y-1 pl-5">${buforListy.map((li) => `<li>${li}</li>`).join("")}</ul>`,
    );
    buforListy = [];
  }

  for (const linia of linie) {
    const punkt = linia.match(/^- (.+)$/);
    if (punkt) {
      domknijAkapit();
      buforListy.push(punkt[1]!);
      continue;
    }
    domknijListe();
    if (linia.trim() === "") {
      domknijAkapit();
      continue;
    }
    buforAkapit.push(linia);
  }
  domknijListe();
  domknijAkapit();

  return fragmenty.join("");
}

export function wstawFormatTresci(
  tekst: string,
  poczatek: number,
  koniec: number,
  przed: string,
  po: string,
): { tresc: string; kursor: number } {
  const zaznaczenie = tekst.slice(poczatek, koniec) || "tekst";
  const nowy =
    tekst.slice(0, poczatek) + przed + zaznaczenie + po + tekst.slice(koniec);
  const kursor = poczatek + przed.length + zaznaczenie.length + po.length;
  return { tresc: nowy, kursor };
}
