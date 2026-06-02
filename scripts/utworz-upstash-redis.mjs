#!/usr/bin/env node
/**
 * Tworzy (lub odnajduje) bazę Upstash Redis dla rate limitu, zapisuje do .env.local i Vercel.
 *
 * Wymaga natywnego konta Upstash (nie Vercel Marketplace):
 *   UPSTASH_EMAIL + UPSTASH_API_KEY  (Console → Account → Management API)
 *
 *   npm run upstash:setup
 *   node scripts/utworz-upstash-redis.mjs --dry-run
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
const NAZWA_BAZY = "naszawies-ratelimit";
const REGION = "eu-central-1";

wczytajEnvLocal();

const email = process.env.UPSTASH_EMAIL?.trim();
const apiKey = process.env.UPSTASH_API_KEY?.trim();

function blad(msg, kod = 1) {
  console.error(`\n✗ ${msg}`);
  process.exit(kod);
}

function info(msg) {
  console.log(msg);
}

async function upstashApi(sciezka, { method = "GET", body } = {}) {
  const auth = Buffer.from(`${email}:${apiKey}`).toString("base64");
  const res = await fetch(`https://api.upstash.com${sciezka}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok) {
    const msg = typeof json === "object" ? json.message || JSON.stringify(json) : String(json);
    throw new Error(msg || res.statusText);
  }
  return json;
}

function ustawKluczeWEnvLocal(url, token) {
  const klucze = {
    UPSTASH_REDIS_REST_URL: url,
    UPSTASH_REDIS_REST_TOKEN: token,
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
    if (!ustawione.has(key)) linie.push(`${key}=${val}`);
  }
  if (!dryRun) {
    fs.writeFileSync(ENV_LOCAL, linie.join("\n").replace(/\n{3,}/g, "\n\n") + "\n", "utf8");
  }
  info(`✓ Zapisano w .env.local: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN${dryRun ? " [dry-run]" : ""}`);
}

function dodajDoVercel(key, value) {
  if (dryRun) {
    info(`[dry-run] Vercel: ${key}`);
    return;
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
      blad(`Vercel env add ${key} (${target}): ${((proc.stderr || "") + (proc.stdout || "")).trim().slice(0, 200)}`);
    }
  }
  info(`✓ Vercel: ${key}`);
}

async function main() {
  info("Upstash Redis — rate limit NaszaWies.pl\n");

  if (!email || !apiKey) {
    blad(
      [
        "Brak UPSTASH_EMAIL lub UPSTASH_API_KEY w .env.local.",
        "",
        "1. https://console.upstash.com/ → Account → Management API → Create API Key",
        "2. Dodaj do .env.local:",
        "   UPSTASH_EMAIL=twoj@email.com",
        "   UPSTASH_API_KEY=...",
        "3. Uruchom: npm run upstash:setup",
        "",
        "Albo: Vercel Dashboard → Marketplace → Upstash for Redis → Connect",
        "potem: npm run env:pull-vercel && npm run env:merge-vercel",
      ].join("\n"),
    );
  }

  const istniejacyUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const istniejacyToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (istniejacyUrl && istniejacyToken && !process.argv.includes("--wymus")) {
    info("Klucze Upstash Redis już są w .env.local — pomijam tworzenie.");
    if (!dryRun) {
      dodajDoVercel("UPSTASH_REDIS_REST_URL", istniejacyUrl);
      dodajDoVercel("UPSTASH_REDIS_REST_TOKEN", istniejacyToken);
    }
    return;
  }

  let baza;
  try {
    const lista = await upstashApi("/v2/redis/databases");
    const bazy = Array.isArray(lista) ? lista : lista.result ?? [];
    baza = bazy.find((b) => b.name === NAZWA_BAZY);
    if (!baza && !dryRun) {
      info(`Tworzę bazę „${NAZWA_BAZY}” (${REGION})…`);
      baza = await upstashApi("/v2/redis/database", {
        method: "POST",
        body: {
          name: NAZWA_BAZY,
          region: REGION,
          tls: true,
          multizone: true,
        },
      });
    } else if (baza) {
      info(`✓ Znaleziono bazę: ${baza.name}`);
    }
  } catch (e) {
    blad(`Upstash API: ${e.message}`);
  }

  if (dryRun) {
    info("[dry-run] Gotowe.");
    return;
  }

  const url = baza.endpoint || baza.rest_url || baza.restURL;
  const token = baza.rest_token || baza.restToken;
  if (!url || !token) blad("API nie zwróciło REST URL/token");

  if (url.includes("search.upstash.io")) {
    blad("To jest Upstash Search, nie Redis. Użyj produktu „Upstash for Redis”.");
  }

  ustawKluczeWEnvLocal(url.startsWith("http") ? url : `https://${url}`, token);
  dodajDoVercel("UPSTASH_REDIS_REST_URL", url.startsWith("http") ? url : `https://${url}`);
  dodajDoVercel("UPSTASH_REDIS_REST_TOKEN", token);
  info("\nGotowe. Zrób redeploy: vercel --prod");
}

main().catch((e) => blad(e.message || String(e)));
