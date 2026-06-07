#!/usr/bin/env node
/**
 * Tworzy (lub odnajduje) widget Cloudflare Turnstile dla naszawies.pl,
 * zapisuje klucze do .env.local i dodaje na Vercel (production + preview).
 *
 * Wymaga tokena API z uprawnieniem: Account → Turnstile → Edit
 * Używa CLOUDFLARE_TURNSTILE_API_TOKEN albo CLOUDFLARE_API_TOKEN.
 *
 *   npm run turnstile:setup
 *   node scripts/utworz-turnstile.mjs --dry-run
 *   node scripts/utworz-turnstile.mjs --tylko-env
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { wczytajEnvLocal } from "./wczytaj-env-local.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const dryRun = process.argv.includes("--dry-run");
const tylkoEnv = process.argv.includes("--tylko-env");
const testowe = process.argv.includes("--testowe");
const wymus = process.argv.includes("--wymus");

/** Oficjalne klucze testowe Cloudflare — tylko dev, bez realnej ochrony botów. */
const KLUCZE_TESTOWE = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
};

const LINK_TOKEN_TURNSTILE =
  "https://dash.cloudflare.com/profile/api-tokens/create?permissionGroupKeys=%5B%7B%22key%22%3A%22turnstile%22%2C%22type%22%3A%22edit%22%7D%5D&name=Naszawies+Turnstile&accountId=all&zoneId=all";

const DOMENY = ["naszawies.pl", "www.naszawies.pl", "localhost", "127.0.0.1"];
const NAZWA_WIDGETU = "NaszaWies.pl — formularze";

wczytajEnvLocal();

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
const apiToken = (
  process.env.CLOUDFLARE_TURNSTILE_API_TOKEN?.trim() ||
  process.env.CLOUDFLARE_API_TOKEN?.trim() ||
  ""
);

function blad(msg, kod = 1) {
  console.error(`\n✗ ${msg}`);
  process.exit(kod);
}

function info(msg) {
  console.log(msg);
}

async function cfApi(sciezka, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${sciezka}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const kod = json.errors?.[0]?.code;
    const komunikat = json.errors?.[0]?.message || res.statusText;
    const err = new Error(komunikat);
    err.kod = kod;
    throw err;
  }
  return json.result;
}

function widgetPasuje(widget) {
  const domeny = widget.domains ?? [];
  return DOMENY.every((d) => domeny.some((w) => w === d || w.endsWith(`.${d}`) || d.endsWith(w)));
}

function widgetMaDomenyProdukcyjne(widget) {
  const domeny = widget.domains ?? [];
  return domeny.some((d) => d === "naszawies.pl" || d.endsWith(".naszawies.pl"));
}

function ustawKluczeWEnvLocal(siteKey, secretKey) {
  if (!fs.existsSync(ENV_LOCAL)) blad("Brak pliku .env.local");
  const klucze = {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: siteKey,
    TURNSTILE_SECRET_KEY: secretKey,
  };

  let linie = fs.readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/);
  const ustawione = new Set();

  linie = linie.map((line) => {
    for (const [key, val] of Object.entries(klucze)) {
      const re = new RegExp(`^#?\\s*${key}\\s*=`);
      if (re.test(line.trim())) {
        ustawione.add(key);
        return `${key}=${val}`;
      }
    }
    return line;
  });

  for (const [key, val] of Object.entries(klucze)) {
    if (!ustawione.has(key)) {
      linie.push(`${key}=${val}`);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(ENV_LOCAL, linie.join("\n").replace(/\n{3,}/g, "\n\n") + "\n", "utf8");
  }
  info(`✓ Zapisano w .env.local: NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY${dryRun ? " [dry-run]" : ""}`);
}

function dodajDoVercel(key, value) {
  if (dryRun) {
    info(`[dry-run] Vercel: ${key} → production, preview`);
    return true;
  }
  for (const target of ["production", "preview"]) {
    const proc = spawnSync(
      "vercel",
      ["env", "add", key, target, "--force", "--sensitive"],
      {
        cwd: ROOT,
        input: value,
        encoding: "utf8",
        shell: process.platform === "win32",
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    if (proc.status !== 0) {
      const err = ((proc.stderr || "") + (proc.stdout || "")).trim().slice(0, 220);
      blad(`Vercel env add ${key} (${target}): ${err}`);
    }
  }
  info(`✓ Vercel: ${key}`);
  return true;
}

async function main() {
  info("Cloudflare Turnstile — konfiguracja NaszaWies.pl\n");

  if (testowe) {
    info("Tryb --testowe: klucze deweloperskie Cloudflare (zawsze przechodzą, bez ochrony produkcyjnej).\n");
    ustawKluczeWEnvLocal(KLUCZE_TESTOWE.NEXT_PUBLIC_TURNSTILE_SITE_KEY, KLUCZE_TESTOWE.TURNSTILE_SECRET_KEY);
    if (!tylkoEnv && !dryRun) {
      info("Pominięto Vercel (--testowe dotyczy tylko .env.local). Na produkcji: npm run turnstile:setup");
    }
    info("\nGotowe (dev). Uruchom npm run dev i sprawdź /logowanie.");
    return;
  }

  if (!accountId) blad("Brak CLOUDFLARE_R2_ACCOUNT_ID w .env.local");
  if (!apiToken) {
    blad(
      [
        "Brak CLOUDFLARE_TURNSTILE_API_TOKEN (lub CLOUDFLARE_API_TOKEN) w .env.local.",
        "",
        "Utwórz token z uprawnieniem Account → Turnstile → Edit:",
        LINK_TOKEN_TURNSTILE,
        "",
        "Wklej token jako CLOUDFLARE_TURNSTILE_API_TOKEN i uruchom: npm run turnstile:setup",
        "Tymczasowo lokalnie: npm run turnstile:dev",
      ].join("\n"),
    );
  }

  const istniejacySite = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const istniejacySecret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const kluczeTestowe =
    istniejacySite === KLUCZE_TESTOWE.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
    istniejacySecret === KLUCZE_TESTOWE.TURNSTILE_SECRET_KEY;

  if (istniejacySite && istniejacySecret && !wymus && !kluczeTestowe) {
    info("Klucze Turnstile już są w .env.local — pomijam tworzenie widgetu.");
    info("  (użyj --wymus aby utworzyć nowy widget przez API)\n");
    if (!tylkoEnv) {
      dodajDoVercel("NEXT_PUBLIC_TURNSTILE_SITE_KEY", istniejacySite);
      dodajDoVercel("TURNSTILE_SECRET_KEY", istniejacySecret);
      info("\nGotowe. Zrób redeploy na Vercel (vercel --prod).");
    }
    return;
  }

  let widget;
  try {
    const lista = await cfApi(`/accounts/${accountId}/challenges/widgets?per_page=50`);
    widget =
      lista.find((w) => widgetPasuje(w)) ??
      lista.find((w) => widgetMaDomenyProdukcyjne(w)) ??
      lista.find((w) => (w.name || "").toLowerCase().includes("naszawies"));
  } catch (e) {
    if (e.kod === 10000 || /auth/i.test(e.message)) {
      blad(
        [
          "Token Cloudflare nie ma uprawnień Turnstile (Account → Turnstile → Edit).",
          "",
          "Utwórz nowy token (1 klik):",
          LINK_TOKEN_TURNSTILE,
          "",
          "1. Wklej token jako CLOUDFLARE_TURNSTILE_API_TOKEN w .env.local",
          "2. Uruchom ponownie: npm run turnstile:setup",
          "",
          "Tymczasowo lokalnie (bez ochrony): npm run turnstile:dev",
          "",
          `Szczegóły API: ${e.message}`,
        ].join("\n"),
      );
    }
    throw e;
  }

  if (!widget) {
    info(`Tworzę widget „${NAZWA_WIDGETU}” dla: ${DOMENY.join(", ")}…`);
    if (dryRun) {
      info("[dry-run] POST /challenges/widgets");
      return;
    }
    widget = await cfApi(`/accounts/${accountId}/challenges/widgets`, {
      method: "POST",
      body: {
        name: NAZWA_WIDGETU,
        domains: DOMENY,
        mode: "managed",
      },
    });
    info(`✓ Utworzono widget (sitekey: ${widget.sitekey?.slice(0, 16)}…)`);
  } else {
    info(`✓ Znaleziono istniejący widget: ${widget.name} (${widget.sitekey?.slice(0, 16)}…)`);
    if (!widget.secret) {
      info("Brak secret w odpowiedzi API — rotuję secret…");
      widget = await cfApi(
        `/accounts/${accountId}/challenges/widgets/${widget.sitekey}/rotate_secret`,
        {
          method: "POST",
          body: { invalidate_immediately: true },
        },
      );
    }
  }

  const siteKey = widget.sitekey?.trim();
  const secretKey = widget.secret?.trim();
  if (!siteKey || !secretKey) blad("API nie zwróciło sitekey/secret");

  ustawKluczeWEnvLocal(siteKey, secretKey);

  if (!tylkoEnv) {
    dodajDoVercel("NEXT_PUBLIC_TURNSTILE_SITE_KEY", siteKey);
    dodajDoVercel("TURNSTILE_SECRET_KEY", secretKey);
    info("\nGotowe. Zrób redeploy produkcji: vercel --prod");
  } else {
    info("\nGotowe (.env.local). Vercel pominięty (--tylko-env).");
  }
}

main().catch((e) => blad(e.message || String(e)));
