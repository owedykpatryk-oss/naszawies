import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(
  root,
  "..",
  "Cloude Docs",
  "naszawies-package",
  "frontend",
  "landing.html"
);
const html = fs.readFileSync(htmlPath, "utf8");

const si = html.indexOf("<style>") + "<style>".length;
const sj = html.indexOf("</style>");
const css = html.slice(si, sj);

const bi = html.indexOf("<body>") + "<body>".length;
const bj = html.indexOf("<script>");
let body = html.slice(bi, bj).trim();
body = body.replace(/<form onsubmit="handleSubmit\(event\)">/g, "<form id=\"waitlist-form\">");
body = body.replace(/href="#">Polityka prywatności<\/a>/g, 'href="/polityka-prywatnosci">Polityka prywatności</a>');
body = body.replace(/href="#">Regulamin<\/a>/g, 'href="/regulamin">Regulamin</a>');
body = body.replace(/href="#">RODO<\/a>/g, 'href="/polityka-prywatnosci">RODO</a>');
body = body.replace(/href="#">Kontakt<\/a>/g, 'href="/kontakt">Kontakt</a>');

const staryFormularzWaitlist = `<form id="waitlist-form">
          <div class="form-field"><label>Imię i nazwisko</label><input type="text" placeholder="Jan Kowalski" required></div>
          <div class="form-field"><label>Email</label><input type="email" placeholder="twoj@email.pl" required></div>
          <div class="form-field"><label>Nazwa wsi</label><input type="text" placeholder="np. Arcelin, Szydłówek, Mała Wieś" required></div>
          <div class="form-field"><label>Gmina</label><input type="text" placeholder="np. Płońsk, Kraków-Świątniki" required></div>
          <button type="submit" class="form-submit">Chcę być pierwszy →</button>`;

const nowyFormularzWaitlist = `<form id="waitlist-form" novalidate>
          <div class="form-field"><label for="waitlist-imie">Imię i nazwisko</label><input id="waitlist-imie" name="imie_nazwisko" type="text" placeholder="Jan Kowalski" autocomplete="name" required maxlength="200"></div>
          <div class="form-field"><label for="waitlist-email">Email</label><input id="waitlist-email" name="email" type="email" placeholder="twoj@email.pl" autocomplete="email" required maxlength="254"></div>
          <div class="form-field"><label for="waitlist-wies">Nazwa wsi</label><input id="waitlist-wies" name="nazwa_wsi" type="text" placeholder="np. Arcelin, Szydłówek, Mała Wieś" autocomplete="address-level4" required maxlength="200"></div>
          <div class="form-field"><label for="waitlist-gmina">Gmina</label><input id="waitlist-gmina" name="gmina" type="text" placeholder="np. Płońsk, Kraków-Świątniki" autocomplete="address-level2" required maxlength="200"></div>
          <div class="waitlist-honeypot" aria-hidden="true">
            <label for="waitlist-bottrap">Nie wypełniaj tego pola</label>
            <input type="text" id="waitlist-bottrap" name="bottrap" tabindex="-1" autocomplete="off" value="">
          </div>
          <div class="form-field waitlist-zgoda">
            <label class="waitlist-zgoda__label">
              <input type="checkbox" id="waitlist-zgoda" name="zgoda_rodo" required value="1">
              <span>Akceptuję <a href="/regulamin" target="_blank" rel="noopener noreferrer">Regulamin</a> oraz zapoznałem(-am) się z <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer">Polityką prywatności</a>. Wyrażam zgodę na przetwarzanie moich danych w celu kontaktu w sprawie listy oczekujących.</span>
            </label>
          </div>
          <button type="submit" class="form-submit">Chcę być pierwszy →</button>`;

if (body.includes(staryFormularzWaitlist)) {
  body = body.replace(staryFormularzWaitlist, nowyFormularzWaitlist);
} else {
  console.warn(
    "build-landing-assets: nie znaleziono oczekiwanego bloku formularza waitlist — pomijam podmianę."
  );
}

fs.mkdirSync(path.join(root, "src", "content"), { recursive: true });
fs.mkdirSync(path.join(root, "src", "styles"), { recursive: true });

const cssForNext = css
  .replace(
    /font-family: 'Inter'/g,
    "font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif"
  )
  .replace(
    /font-family: 'Fraunces'/g,
    "font-family: var(--font-fraunces), ui-serif, Georgia, serif"
  );
fs.writeFileSync(path.join(root, "src", "styles", "landing.css"), cssForNext);
// Po sync sprawdź landing: nawigacja „Katalog/Mapa”, blok hero-dwie-sciezki i stopka — mogą wymagać ręcznego scalenia z repo.
fs.writeFileSync(path.join(root, "src", "content", "landing-body.html"), body);

const ski = html.indexOf("<script>") + "<script>".length;
const skj = html.lastIndexOf("</script>");
const legacyScript = html.slice(ski, skj).trim();
fs.writeFileSync(path.join(root, "scripts", "landing-inline-script.txt"), legacyScript);

console.log("src/styles/landing.css", cssForNext.length);
console.log("src/content/landing-body.html", body.length);
