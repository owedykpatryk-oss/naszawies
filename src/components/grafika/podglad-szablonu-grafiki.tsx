"use client";

import { useDeferredValue, useEffect, useState } from "react";
import type { FormatSocialGrafiki, MotywGrafiki, SzablonGrafiki, WartosciPolGrafiki } from "@/lib/grafika/typy";
import { RamkaMarkiDokument } from "@/components/marka/ramka-marki-dokument";
import { WYMIARY_SOCIAL } from "@/lib/grafika/eksport-social";
import { formatDatyPolskiej } from "@/lib/grafika/szablony";
import { generujQrDataUrl } from "@/lib/grafika/qr-kod";

type Props = {
  szablon: SzablonGrafiki;
  motyw: MotywGrafiki;
  wartosci: WartosciPolGrafiki;
  logoDataUrl?: string | null;
  backgroundDataUrl?: string | null;
  /** URL do zakodowania w QR (np. profil wsi) */
  qrDataUrl?: string | null;
  elementId?: string;
  /** Wymusza wymiary pod eksport social (post / story) */
  formatSocial?: FormatSocialGrafiki;
};

function w(wartosci: WartosciPolGrafiki, klucz: string, fallback = "…"): string {
  const v = wartosci[klucz]?.trim();
  return v || fallback;
}

function linie(tekst: string) {
  return tekst.split("\n").map((l, i) => (
    <span key={i} className="block">
      {l || "\u00A0"}
    </span>
  ));
}

function wymiaryKontenera(
  szablon: SzablonGrafiki,
  formatSocial?: FormatSocialGrafiki,
): { szer: number; wys: number } {
  if (formatSocial) {
    const w = WYMIARY_SOCIAL[formatSocial];
    return { szer: w.szer, wys: w.wys };
  }
  if (szablon.format === "kwadrat") return { szer: 400, wys: 400 };
  if (szablon.format === "a5") {
    return szablon.orientacja === "poziom" ? { szer: 560, wys: 396 } : { szer: 396, wys: 560 };
  }
  return szablon.orientacja === "poziom" ? { szer: 794, wys: 560 } : { szer: 560, wys: 794 };
}

function Logo({ logoDataUrl, motyw }: { logoDataUrl?: string | null; motyw: MotywGrafiki }) {
  if (!logoDataUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoDataUrl}
      alt=""
      className="mx-auto mb-4 max-h-20 max-w-[140px] object-contain"
      style={{ filter: motyw.id === "klasyczny-bialy" ? undefined : "none" }}
    />
  );
}

function Podpisy({ wartosci }: { wartosci: WartosciPolGrafiki }) {
  const p1 = w(wartosci, "podpis1", "");
  const p2 = w(wartosci, "podpis2", "");
  if (!p1 && !p2) return null;
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-10 text-center text-sm">
      {p1 ? (
        <div>
          <div className="mb-8 border-b border-current opacity-40" style={{ minWidth: 140 }} />
          <div className="whitespace-pre-line opacity-90">{p1}</div>
        </div>
      ) : null}
      {p2 ? (
        <div>
          <div className="mb-8 border-b border-current opacity-40" style={{ minWidth: 140 }} />
          <div className="whitespace-pre-line opacity-90">{p2}</div>
        </div>
      ) : null}
    </div>
  );
}

function PodpisCyfrowy({ wartosci, motyw }: { wartosci: WartosciPolGrafiki; motyw: MotywGrafiki }) {
  const tekst = w(wartosci, "podpis_cyfrowy", "");
  if (!tekst || tekst === "…") return null;
  const data = w(wartosci, "data", "");
  return (
    <div className="mt-6 rounded-lg border border-dashed px-4 py-3 text-center" style={{ borderColor: motyw.ramka ?? motyw.akcent }}>
      <p className="text-[10px] uppercase tracking-wider opacity-60">Podpis elektroniczny</p>
      <p className="mt-1 font-serif text-xl italic" style={{ color: motyw.akcent, fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {tekst}
      </p>
      {data ? (
        <p className="mt-1 text-[11px] opacity-70">
          {formatDatyPolskiej(data)} · {w(wartosci, "miejsce", "")}
        </p>
      ) : null}
    </div>
  );
}

function MetaWydarzenia({ wartosci, motyw }: { wartosci: WartosciPolGrafiki; motyw: MotywGrafiki }) {
  const data = w(wartosci, "data", "");
  const godzina = w(wartosci, "godzina", "");
  const miejsce = w(wartosci, "miejsce", "");
  if (!data && !godzina && !miejsce) return null;
  return (
    <div
      className="mt-6 space-y-2 rounded-xl px-4 py-3 text-sm"
      style={{ backgroundColor: `${motyw.akcent}12`, color: motyw.tekst }}
    >
      {data ? (
        <p>
          <span style={{ color: motyw.akcent, fontWeight: 600 }}>Data: </span>
          {formatDatyPolskiej(data)}
        </p>
      ) : null}
      {godzina && godzina !== "…" ? (
        <p>
          <span style={{ color: motyw.akcent, fontWeight: 600 }}>Godzina: </span>
          {godzina}
        </p>
      ) : null}
      {miejsce && miejsce !== "…" ? (
        <p>
          <span style={{ color: motyw.akcent, fontWeight: 600 }}>Miejsce: </span>
          {miejsce}
        </p>
      ) : null}
    </div>
  );
}

function LayoutZaproszenieEleganckie({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 py-10 text-center">
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <div className="mb-2 text-xs uppercase tracking-[0.35em]" style={{ color: motyw.akcent }}>
        {w(wartosci, "naglowek")}
      </div>
      <h2 className="font-serif text-3xl font-semibold leading-tight" style={{ color: motyw.tekst }}>
        {w(wartosci, "tytul")}
      </h2>
      <div
        className="my-5 h-px w-24"
        style={{ background: `linear-gradient(90deg, transparent, ${motyw.akcent}, transparent)` }}
      />
      <p className="max-w-md text-base leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <MetaWydarzenia wartosci={wartosci} motyw={motyw} />
      <p className="mt-6 text-sm font-medium" style={{ color: motyw.akcent }}>
        {w(wartosci, "organizator")}
      </p>
      {w(wartosci, "kontakt", "") && w(wartosci, "kontakt") !== "…" ? (
        <p className="mt-1 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "kontakt")}
        </p>
      ) : null}
    </div>
  );
}

function LayoutZaproszenieNowoczesne({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-8 py-6 text-white" style={{ backgroundColor: motyw.akcent }}>
        <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
        <p className="text-xs uppercase tracking-widest opacity-90">{w(wartosci, "naglowek")}</p>
        <h2 className="mt-2 font-serif text-2xl font-bold">{w(wartosci, "tytul")}</h2>
      </div>
      <div className="flex flex-1 flex-col px-8 py-6">
        <p className="flex-1 text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "opis")}
        </p>
        <MetaWydarzenia wartosci={wartosci} motyw={motyw} />
        <div className="mt-4 border-t pt-4 text-xs" style={{ borderColor: motyw.ramka, color: motyw.tekstDrugorzedny }}>
          <p className="font-semibold" style={{ color: motyw.akcent }}>
            {w(wartosci, "organizator")}
          </p>
          {w(wartosci, "kontakt", "") !== "…" && w(wartosci, "kontakt", "") ? (
            <p className="mt-1">{w(wartosci, "kontakt")}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LayoutZaproszenieRustykalne({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 py-8 text-center">
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <p className="font-serif text-4xl" style={{ color: motyw.akcent2 ?? motyw.akcent }}>
        ✦
      </p>
      <p className="mt-2 text-sm italic" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "naglowek")}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-bold" style={{ color: motyw.tekst }}>
        {w(wartosci, "tytul")}
      </h2>
      <p className="mt-4 max-w-sm text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <MetaWydarzenia wartosci={wartosci} motyw={motyw} />
      <p className="mt-4 font-serif text-lg" style={{ color: motyw.akcent }}>
        {w(wartosci, "organizator")}
      </p>
    </div>
  );
}

function MetaDwujezyczne({ wartosci, motyw }: { wartosci: WartosciPolGrafiki; motyw: MotywGrafiki }) {
  const data = w(wartosci, "data", "");
  const godzina = w(wartosci, "godzina", "");
  const miejsce = w(wartosci, "miejsce", "");
  const miejsceUa = w(wartosci, "miejsce_ua", "");
  if (!data && !godzina && !miejsce) return null;
  return (
    <div className="mt-4 space-y-1 text-sm" style={{ color: motyw.tekstDrugorzedny }}>
      {data ? (
        <p>
          <strong style={{ color: motyw.akcent }}>{formatDatyPolskiej(data)}</strong>
          {godzina && godzina !== "…" ? ` · ${godzina}` : ""}
        </p>
      ) : null}
      {miejsce && miejsce !== "…" ? <p>{miejsce}</p> : null}
      {miejsceUa && miejsceUa !== "…" ? (
        <p className="text-xs italic opacity-90">{miejsceUa}</p>
      ) : null}
    </div>
  );
}

function LayoutZaproszenieDwujezyczne({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col px-7 py-7">
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex-1 rounded-lg border px-4 py-3" style={{ borderColor: motyw.ramka ?? "#d6d3d1" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: motyw.akcent }}>
            Polski
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide opacity-80">{w(wartosci, "naglowek")}</p>
          <h2 className="mt-2 font-serif text-2xl font-bold leading-tight" style={{ color: motyw.tekst }}>
            {w(wartosci, "tytul")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
            {w(wartosci, "opis")}
          </p>
        </div>
        <div
          className="flex-1 rounded-lg border px-4 py-3"
          style={{ borderColor: `${motyw.akcent2 ?? motyw.akcent}55`, backgroundColor: `${motyw.akcent}08` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Українська</p>
          <p className="mt-1 text-xs uppercase tracking-wide opacity-80">{w(wartosci, "naglowek_ua", w(wartosci, "naglowek"))}</p>
          <h2 className="mt-2 font-serif text-2xl font-bold leading-tight" style={{ color: motyw.tekst }}>
            {w(wartosci, "tytul_ua", w(wartosci, "tytul"))}
          </h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
            {w(wartosci, "opis_ua", w(wartosci, "opis"))}
          </p>
        </div>
      </div>
      <MetaDwujezyczne wartosci={wartosci} motyw={motyw} />
      <div className="mt-3 border-t pt-3 text-center text-xs" style={{ borderColor: motyw.ramka, color: motyw.tekstDrugorzedny }}>
        <p className="font-semibold" style={{ color: motyw.akcent }}>
          {w(wartosci, "organizator")}
        </p>
        {w(wartosci, "kontakt", "") !== "…" && w(wartosci, "kontakt", "") ? (
          <p className="mt-1">{w(wartosci, "kontakt")}</p>
        ) : null}
      </div>
    </div>
  );
}

function LayoutDyplomKlasyczny({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-12 py-8 text-center">
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <p className="text-sm uppercase tracking-[0.4em]" style={{ color: motyw.akcent }}>
        {w(wartosci, "naglowek")}
      </p>
      <p className="mt-4 text-lg" style={{ color: motyw.tekstDrugorzedny }}>
        niniejszym przyznaje się
      </p>
      <h2 className="my-4 font-serif text-4xl font-bold italic" style={{ color: motyw.tekst }}>
        {w(wartosci, "tytul")}
      </h2>
      <p className="max-w-lg text-base leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <p className="mt-4 text-sm" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "miejsce")}, {formatDatyPolskiej(w(wartosci, "data", ""))}
      </p>
      <p className="mt-2 text-sm font-medium" style={{ color: motyw.akcent }}>
        {w(wartosci, "organizator")}
      </p>
      <Podpisy wartosci={wartosci} />
      <PodpisCyfrowy wartosci={wartosci} motyw={motyw} />
    </div>
  );
}

function LayoutDyplomOzdobny({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-10 py-8 text-center">
      <div
        className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-double"
        style={{ borderColor: motyw.ramka ?? motyw.akcent }}
      />
      <div
        className="pointer-events-none absolute inset-8 rounded-xl border"
        style={{ borderColor: `${motyw.akcent}55` }}
      />
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <p className="font-serif text-2xl" style={{ color: motyw.akcent }}>
        ★ {w(wartosci, "naglowek")} ★
      </p>
      <h2 className="my-5 font-serif text-4xl font-bold" style={{ color: motyw.tekst }}>
        {w(wartosci, "tytul")}
      </h2>
      <p className="max-w-md text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <p className="mt-4 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "organizator")} · {formatDatyPolskiej(w(wartosci, "data", ""))}
      </p>
      <Podpisy wartosci={wartosci} />
      <PodpisCyfrowy wartosci={wartosci} motyw={motyw} />
    </div>
  );
}

function LayoutPlakat({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="px-6 py-8 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${motyw.akcent}, ${motyw.akcent2 ?? motyw.akcent})` }}
      >
        <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
        <p className="text-sm font-bold uppercase tracking-wider opacity-95">{w(wartosci, "naglowek")}</p>
        <h2 className="mt-2 font-serif text-4xl font-black leading-none">{w(wartosci, "tytul")}</h2>
      </div>
      <div className="flex flex-1 flex-col px-6 py-5">
        <div className="flex-1 text-base leading-relaxed" style={{ color: motyw.tekst }}>
          {linie(w(wartosci, "opis"))}
        </div>
        <div
          className="mt-4 rounded-lg px-4 py-3 text-center text-white"
          style={{ backgroundColor: motyw.akcent }}
        >
          <p className="text-lg font-bold">{formatDatyPolskiej(w(wartosci, "data", ""))}</p>
          {w(wartosci, "godzina", "") !== "…" ? (
            <p className="text-sm opacity-90">godz. {w(wartosci, "godzina")}</p>
          ) : null}
          <p className="mt-1 text-sm opacity-90">{w(wartosci, "miejsce")}</p>
        </div>
        <p className="mt-3 text-center text-xs" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "organizator")} · {w(wartosci, "kontakt")}
        </p>
      </div>
    </div>
  );
}

function LayoutPodziekowanie({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 py-8 text-center">
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <p className="text-xs uppercase tracking-[0.3em]" style={{ color: motyw.akcent }}>
        {w(wartosci, "naglowek")}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-semibold" style={{ color: motyw.tekst }}>
        {w(wartosci, "tytul")}
      </h2>
      <p className="mt-5 max-w-sm text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <p className="mt-4 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "miejsce", "") !== "…" ? `${w(wartosci, "miejsce")}, ` : ""}
        {formatDatyPolskiej(w(wartosci, "data", ""))}
      </p>
      <p className="mt-2 text-sm font-medium" style={{ color: motyw.akcent }}>
        {w(wartosci, "organizator")}
      </p>
      <Podpisy wartosci={wartosci} />
    </div>
  );
}

function LayoutKartaInformacyjna({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col px-6 py-6">
      <div className="flex items-start gap-4 border-b pb-4" style={{ borderColor: motyw.ramka }}>
        {logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoDataUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-xl font-bold text-white"
            style={{ backgroundColor: motyw.akcent }}
          >
            i
          </div>
        )}
        <div>
          <h2 className="font-serif text-xl font-bold" style={{ color: motyw.tekst }}>
            {w(wartosci, "naglowek")}
          </h2>
          <p className="text-sm" style={{ color: motyw.akcent }}>
            {w(wartosci, "tytul")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex-1 text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </div>
      <div
        className="mt-4 rounded-lg px-4 py-3 text-xs"
        style={{ backgroundColor: `${motyw.akcent}15`, color: motyw.tekst }}
      >
        <p>{w(wartosci, "kontakt")}</p>
        <p className="mt-1 opacity-75">{w(wartosci, "organizator")}</p>
      </div>
    </div>
  );
}

function LayoutZaproszenieLesne({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col">
      <div
        className="px-6 py-5 text-center"
        style={{
          background: `linear-gradient(180deg, ${motyw.akcent} 0%, ${motyw.akcent2 ?? motyw.akcent} 100%)`,
          color: "#fafaf9",
        }}
      >
        <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
        <p className="text-xs uppercase tracking-[0.35em] opacity-90">{w(wartosci, "naglowek")}</p>
        <h2 className="mt-2 font-serif text-2xl font-bold">{w(wartosci, "tytul")}</h2>
        <p className="mt-2 text-sm opacity-90" aria-hidden>
          🌲 · 🦌 · 🌲
        </p>
      </div>
      <div className="flex flex-1 flex-col px-6 py-5">
        <p className="flex-1 text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "opis")}
        </p>
        <MetaWydarzenia wartosci={wartosci} motyw={motyw} />
        <p className="mt-4 text-center text-sm font-semibold" style={{ color: motyw.akcent }}>
          {w(wartosci, "organizator")}
        </p>
        {w(wartosci, "kontakt", "") !== "…" ? (
          <p className="mt-1 text-center text-xs" style={{ color: motyw.tekstDrugorzedny }}>
            {w(wartosci, "kontakt")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LayoutZaproszenieParafialne({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="flex h-full flex-col items-center px-8 py-8 text-center">
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <div
        className="mb-4 h-px w-20"
        style={{ background: `linear-gradient(90deg, transparent, ${motyw.akcent2 ?? motyw.akcent}, transparent)` }}
      />
      <p className="text-xs uppercase tracking-[0.3em]" style={{ color: motyw.akcent2 ?? motyw.akcent }}>
        {w(wartosci, "naglowek")}
      </p>
      <h2 className="mt-3 font-serif text-3xl font-semibold" style={{ color: motyw.tekst }}>
        {w(wartosci, "tytul")}
      </h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <MetaWydarzenia wartosci={wartosci} motyw={motyw} />
      <p className="mt-5 text-sm font-medium" style={{ color: motyw.akcent }}>
        {w(wartosci, "organizator")}
      </p>
    </div>
  );
}

function renderLayout(props: Omit<Props, "elementId">) {
  switch (props.szablon.layout) {
    case "zaproszenie-eleganckie":
      return <LayoutZaproszenieEleganckie {...props} />;
    case "zaproszenie-nowoczesne":
      return <LayoutZaproszenieNowoczesne {...props} />;
    case "zaproszenie-rustykalne":
      return <LayoutZaproszenieRustykalne {...props} />;
    case "zaproszenie-lesne":
      return <LayoutZaproszenieLesne {...props} />;
    case "zaproszenie-parafialne":
      return <LayoutZaproszenieParafialne {...props} />;
    case "zaproszenie-dwujezyczne":
      return <LayoutZaproszenieDwujezyczne {...props} />;
    case "dyplom-klasyczny":
      return <LayoutDyplomKlasyczny {...props} />;
    case "dyplom-ozdobny":
      return <LayoutDyplomOzdobny {...props} />;
    case "plakat":
      return <LayoutPlakat {...props} />;
    case "podziekowanie":
      return <LayoutPodziekowanie {...props} />;
    case "karta-informacyjna":
      return <LayoutKartaInformacyjna {...props} />;
    default:
      return <LayoutZaproszenieEleganckie {...props} />;
  }
}

export function PodgladSzablonuGrafiki({
  szablon,
  motyw,
  wartosci,
  logoDataUrl,
  backgroundDataUrl,
  qrDataUrl,
  elementId = "podglad-grafiki",
  formatSocial,
}: Props) {
  const { szer, wys } = wymiaryKontenera(szablon, formatSocial);
  const [qrObraz, ustawQrObraz] = useState<string | null>(null);
  const qrOpozniony = useDeferredValue(qrDataUrl?.trim() ?? "");

  useEffect(() => {
    if (!qrOpozniony) {
      ustawQrObraz(null);
      return;
    }
    let anuluj = false;
    const t = window.setTimeout(() => {
      void generujQrDataUrl(qrOpozniony, 120).then((url) => {
        if (!anuluj) ustawQrObraz(url);
      });
    }, 180);
    return () => {
      anuluj = true;
      window.clearTimeout(t);
    };
  }, [qrOpozniony]);

  const tloStyle = backgroundDataUrl
    ? {
        backgroundImage: `url(${backgroundDataUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {};

  return (
    <div
      id={elementId}
      className="relative mx-auto overflow-visible shadow-lg"
      style={{
        width: szer,
        minHeight: wys,
        ...(formatSocial ? { height: wys, display: "flex", flexDirection: "column", justifyContent: "center" } : {}),
        backgroundColor: backgroundDataUrl ? undefined : motyw.tlo,
        color: motyw.tekst,
        border: motyw.ramka ? `3px solid ${motyw.ramka}` : undefined,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        ...tloStyle,
      }}
    >
      {backgroundDataUrl ? (
        <div className="absolute inset-0 bg-white/75" aria-hidden />
      ) : null}
      <RamkaMarkiDokument className="relative z-[1] min-h-[120px]">
        {renderLayout({ szablon, motyw, wartosci, logoDataUrl })}
      </RamkaMarkiDokument>
      {qrObraz ? (
        <div className="absolute bottom-3 right-3 z-[2] rounded-lg bg-white/95 p-1.5 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrObraz} alt="Kod QR wydarzenia" width={72} height={72} className="block" />
        </div>
      ) : null}
    </div>
  );
}

export function MiniaturaSzablonuGrafiki({
  szablon,
  motyw,
}: {
  szablon: SzablonGrafiki;
  motyw: MotywGrafiki;
}) {
  return (
    <div
      className="flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-lg border border-stone-200 p-2 shadow-sm"
      style={{
        backgroundColor: motyw.tlo,
        color: motyw.tekst,
        borderColor: motyw.ramka ?? undefined,
      }}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide opacity-70">{szablon.kategoria}</p>
      <p className="mt-0.5 line-clamp-2 font-serif text-[11px] font-semibold leading-tight">{szablon.tytul}</p>
    </div>
  );
}
