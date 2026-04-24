"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zapiszRegulaminIKaucjeSali } from "@/app/(site)/panel/soltys/akcje";
import { REGULAMIN_SWIETLICY_SZABLON } from "@/lib/swietlica/regulamin-swietlica-szablon";

type Props = {
  hallId: string;
  rulesTextPoczatek: string | null;
  depositPoczatek: number | null;
  priceResidentPoczatek: number | null;
  priceExternalPoczatek: number | null;
};

function liczbaLubPuste(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function RegulaminSaliKlient({
  hallId,
  rulesTextPoczatek,
  depositPoczatek,
  priceResidentPoczatek,
  priceExternalPoczatek,
}: Props) {
  const router = useRouter();
  const [rulesText, ustawRulesText] = useState(rulesTextPoczatek ?? "");
  const [deposit, ustawDeposit] = useState(depositPoczatek != null ? String(depositPoczatek) : "");
  const [priceResident, ustawPriceResident] = useState(
    priceResidentPoczatek != null ? String(priceResidentPoczatek) : ""
  );
  const [priceExternal, ustawPriceExternal] = useState(
    priceExternalPoczatek != null ? String(priceExternalPoczatek) : ""
  );
  const [komunikat, ustawKomunikat] = useState<{ typ: "ok" | "blad"; t: string } | null>(null);
  const [oczekuje, startTransition] = useTransition();

  useEffect(() => {
    ustawRulesText(rulesTextPoczatek ?? "");
    ustawDeposit(depositPoczatek != null ? String(depositPoczatek) : "");
    ustawPriceResident(priceResidentPoczatek != null ? String(priceResidentPoczatek) : "");
    ustawPriceExternal(priceExternalPoczatek != null ? String(priceExternalPoczatek) : "");
  }, [rulesTextPoczatek, depositPoczatek, priceResidentPoczatek, priceExternalPoczatek]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dep = liczbaLubPuste(deposit);
    const price_resident = liczbaLubPuste(priceResident);
    const price_external = liczbaLubPuste(priceExternal);

    ustawKomunikat(null);
    startTransition(async () => {
      const w = await zapiszRegulaminIKaucjeSali({
        hallId,
        rules_text: rulesText.trim().length ? rulesText : null,
        deposit: dep,
        price_resident,
        price_external,
      });
      if ("blad" in w) {
        ustawKomunikat({ typ: "blad", t: w.blad });
        return;
      }
      ustawKomunikat({ typ: "ok", t: "Zapisano regulamin, kaucję i stawki — pojawią się w dokumencie wynajmu." });
      router.refresh();
    });
  }

  return (
    <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Regulamin świetlicy, kaucja i ceny</h2>
      <p className="mt-1 text-sm text-stone-600">
        Treść trafia do automatycznego dokumentu informacyjnego / wynajmu. Uzupełnij zgodnie z uchwałą rady lub
        zarządzeniem sołtysa — to szablon techniczny, nie zastępuje porady prawnej.
      </p>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        {komunikat ? (
          <p
            role="status"
            className={
              komunikat.typ === "ok"
                ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900"
                : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
            }
          >
            {komunikat.t}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-100"
            onClick={() => ustawRulesText(REGULAMIN_SWIETLICY_SZABLON)}
          >
            Wstaw przykładowy regulamin świetlicy
          </button>
        </div>

        <div>
          <label htmlFor="rs-rules" className="mb-1 block text-sm font-medium text-stone-700">
            Regulamin korzystania ze świetlicy (pełny tekst)
          </label>
          <textarea
            id="rs-rules"
            name="rules_text"
            rows={12}
            value={rulesText}
            onChange={(e) => ustawRulesText(e.target.value)}
            maxLength={50000}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm leading-relaxed text-stone-900 outline-none ring-green-800 focus:ring-2"
            placeholder={"§1. Wynajmujący zobowiązuje się…\n§2. Kaucja…\n§3. Sprzątanie…"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rs-deposit" className="mb-1 block text-sm font-medium text-stone-700">
              Kaucja (PLN, opcjonalnie)
            </label>
            <input
              id="rs-deposit"
              name="deposit"
              type="text"
              inputMode="decimal"
              value={deposit}
              onChange={(e) => ustawDeposit(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              placeholder="np. 500"
            />
          </div>
          <div>
            <label htmlFor="rs-pr" className="mb-1 block text-sm font-medium text-stone-700">
              Cena dla mieszkańca (PLN / doba lub h)
            </label>
            <input
              id="rs-pr"
              name="price_resident"
              type="text"
              inputMode="decimal"
              value={priceResident}
              onChange={(e) => ustawPriceResident(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="rs-pe" className="mb-1 block text-sm font-medium text-stone-700">
              Cena dla osób spoza wsi (PLN)
            </label>
            <input
              id="rs-pe"
              name="price_external"
              type="text"
              inputMode="decimal"
              value={priceExternal}
              onChange={(e) => ustawPriceExternal(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={oczekuje}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          {oczekuje ? "Zapisywanie…" : "Zapisz regulamin i ceny"}
        </button>
      </form>
    </section>
  );
}
