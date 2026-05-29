import fs from "node:fs";
import path from "node:path";

let szablonHtml: string | null = null;

/** Odczyt szablonu landingu raz na proces (nie przy każdym żądaniu). */
export function pobierzSzablonHtmlLandingu(): string {
  if (szablonHtml) return szablonHtml;
  const sciezkaHtml = path.join(process.cwd(), "src/content/landing-body.html");
  szablonHtml = fs.readFileSync(sciezkaHtml, "utf8");
  return szablonHtml;
}
