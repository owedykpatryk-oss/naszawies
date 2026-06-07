"use client";

import { FormEvent, useState } from "react";
import { TurnstileAntybot } from "@/components/turnstile/TurnstileAntybot";
import { KATEGORIE_ZGLOSZENIA_STRONY } from "@/lib/pomoc/przewodniki";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function ZglosProblemStronyFormularz() {
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState(false);
  const [czek, ustawCzek] = useState(false);
  const [turnstileToken, ustawTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, ustawTurnstileKey] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawSukces(false);
    ustawCzek(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/zglos-problem-strony", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: fd.get("category"),
          title: fd.get("title"),
          description: fd.get("description"),
          pageUrl: fd.get("page_url") || "",
          contactEmail: fd.get("contact_email") || "",
          bottrap: fd.get("bottrap"),
          ...(turnstileToken ? { cfTurnstileResponse: turnstileToken } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        ustawBlad(data.error ?? "Nie udało się wysłać.");
        return;
      }
      ustawSukces(true);
      (e.target as HTMLFormElement).reset();
      ustawTurnstileToken(null);
      ustawTurnstileKey((k) => k + 1);
    } catch {
      ustawBlad("Błąd połączenia. Spróbuj ponownie lub napisz na kontakt@naszawies.pl.");
    } finally {
      ustawCzek(false);
    }
  }

  if (sukces) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-medium text-green-950">Dziękujemy — zgłoszenie zostało przyjęte.</p>
        <p className="mt-2 text-sm text-stone-600">Odpowiemy na podany e-mail, jeśli go podałeś.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="forms-premium space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <input type="text" name="bottrap" className="waitlist-honeypot" tabIndex={-1} autoComplete="off" aria-hidden />
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <p className="text-sm text-stone-600">
        To formularz dotyczy <strong>działania serwisu</strong> (strona, logowanie, panel). Sprawy we wsi (drogi, śmieci)
        zgłaszaj w{" "}
        <a href="/panel/mieszkaniec/zgloszenia" className="text-green-800 underline">
          panelu mieszkańca
        </a>
        .
      </p>
      <label className="block">
        Kategoria
        <select name="category" required className="form-control mt-1" defaultValue="blad_strony">
          {KATEGORIE_ZGLOSZENIA_STRONY.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Krótki tytuł
        <input name="title" required maxLength={200} className="form-control mt-1" placeholder="np. Nie mogę zapisać rezerwacji" />
      </label>
      <label className="block">
        Opis problemu
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={8000}
          rows={5}
          className="form-control mt-1"
          placeholder="Co się stało, co próbowałeś, jaka przeglądarka / telefon…"
        />
      </label>
      <label className="block">
        Adres strony (opcjonalnie)
        <input name="page_url" type="url" className="form-control mt-1" placeholder="https://naszawies.pl/..." />
      </label>
      <label className="block">
        E-mail do odpowiedzi (opcjonalnie)
        <input name="contact_email" type="email" className="form-control mt-1" />
      </label>
      {TURNSTILE_SITE_KEY ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="mb-2 text-xs text-stone-600">Weryfikacja antyspamowa (Cloudflare)</p>
          <TurnstileAntybot
            key={turnstileKey}
            siteKey={TURNSTILE_SITE_KEY}
            akcja="zglos-problem"
            onToken={ustawTurnstileToken}
          />
        </div>
      ) : null}
      <button type="submit" disabled={czek} className="btn-panel-primary w-full sm:w-auto">
        {czek ? "Wysyłam…" : "Wyślij zgłoszenie"}
      </button>
    </form>
  );
}
