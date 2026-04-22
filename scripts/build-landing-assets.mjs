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
fs.writeFileSync(path.join(root, "src", "content", "landing-body.html"), body);

const ski = html.indexOf("<script>") + "<script>".length;
const skj = html.lastIndexOf("</script>");
const legacyScript = html.slice(ski, skj).trim();
fs.writeFileSync(path.join(root, "scripts", "landing-inline-script.txt"), legacyScript);

console.log("src/styles/landing.css", cssForNext.length);
console.log("src/content/landing-body.html", body.length);
