"use client";

import { useDeferredValue, useEffect, useState } from "react";
import type { FormatSocialGrafiki, MotywGrafiki, SzablonGrafiki, WartosciPolGrafiki } from "@/lib/grafika/typy";
import { RamkaMarkiDokument } from "@/components/marka/ramka-marki-dokument";
import { LOGO_GRAFIKA_SRC } from "@/lib/grafika/logo-marki";
import { WYMIARY_SOCIAL } from "@/lib/grafika/eksport-social";
import { formatDatyPolskiej } from "@/lib/grafika/szablony";
import { generujQrDataUrl } from "@/lib/grafika/qr-kod";
import { DOMYSLNY_BACKGROUND_OVERLAY, normalizujBackgroundOverlay } from "@/lib/grafika/meta-tla-grafiki";
import {
  cienGlow,
  cienTekstuGlow,
  gradientMesh,
  gradientNaglowka,
  gradientTlaSubtelny,
  kolorAlpha,
  wzorKropek,
  wzorPromieni,
} from "@/lib/grafika/efekty-wizualne";

type Props = {
  szablon: SzablonGrafiki;
  motyw: MotywGrafiki;
  wartosci: WartosciPolGrafiki;
  logoDataUrl?: string | null;
  backgroundDataUrl?: string | null;
  /** 0–1: biały overlay na zdjęciu tła */
  backgroundOverlay?: number;
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

function Logo({
  logoDataUrl,
  motyw,
  rozmiar = "standard",
}: {
  logoDataUrl?: string | null;
  motyw: MotywGrafiki;
  rozmiar?: "standard" | "plakat";
}) {
  const src = logoDataUrl || LOGO_GRAFIKA_SRC;
  const klasy =
    rozmiar === "plakat"
      ? "mx-auto mb-3 max-h-24 max-w-[180px] object-contain drop-shadow-md"
      : "mx-auto mb-4 max-h-20 max-w-[140px] object-contain";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Logo"
      className={klasy}
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

function LiniaSwietlna({ motyw, szer = 96 }: { motyw: MotywGrafiki; szer?: number }) {
  return (
    <div
      className="mx-auto my-4 h-[2px] rounded-full"
      style={{
        width: szer,
        background: `linear-gradient(90deg, transparent, ${motyw.akcent2 ?? motyw.akcent}, ${motyw.akcent}, transparent)`,
        boxShadow: cienGlow(motyw.akcent, 8, 0.5),
      }}
      aria-hidden
    />
  );
}

function RogiOzdobne({ motyw }: { motyw: MotywGrafiki }) {
  const kolor = motyw.akcent;
  const rog = (
    pos: "tl" | "tr" | "bl" | "br",
  ) => {
    const klasy = {
      tl: "left-3 top-3 border-l-2 border-t-2",
      tr: "right-3 top-3 border-r-2 border-t-2",
      bl: "bottom-3 left-3 border-b-2 border-l-2",
      br: "bottom-3 right-3 border-b-2 border-r-2",
    };
    return (
      <div
        className={`pointer-events-none absolute h-8 w-8 ${klasy[pos]}`}
        style={{ borderColor: kolorAlpha(kolor, 0.55) }}
        aria-hidden
      />
    );
  };
  return (
    <>
      {rog("tl")}
      {rog("tr")}
      {rog("bl")}
      {rog("br")}
    </>
  );
}

function PieczecOzdobna({ motyw, emoji = "✦" }: { motyw: MotywGrafiki; emoji?: string }) {
  return (
    <div
      className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full border-[3px] text-xl shadow-lg"
      style={{
        borderColor: kolorAlpha(motyw.akcent, 0.7),
        background: `radial-gradient(circle at 30% 30%, ${kolorAlpha(motyw.akcent2 ?? motyw.akcent, 0.25)} 0%, ${kolorAlpha(motyw.akcent, 0.12)} 100%)`,
        color: motyw.akcent,
        boxShadow: cienGlow(motyw.akcent, 16, 0.35),
      }}
      aria-hidden
    >
      {emoji}
    </div>
  );
}

function FalaSeparator({ motyw }: { motyw: MotywGrafiki }) {
  return (
    <div className="relative -mb-px h-4 w-full overflow-hidden" aria-hidden>
      <svg viewBox="0 0 560 16" preserveAspectRatio="none" className="h-full w-full">
        <path
          d="M0,8 Q70,0 140,8 T280,8 T420,8 T560,8 L560,16 L0,16 Z"
          fill={motyw.tlo}
        />
        <path
          d="M0,10 Q70,2 140,10 T280,10 T420,10 T560,10"
          fill="none"
          stroke={kolorAlpha(motyw.akcent, 0.25)}
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function NaglowekPlakatWow({
  motyw,
  logoDataUrl,
  naglowek,
  tytul,
  dekoracja,
}: {
  motyw: MotywGrafiki;
  logoDataUrl?: string | null;
  naglowek: string;
  tytul: string;
  dekoracja?: string;
}) {
  return (
    <div
      className="relative overflow-hidden px-6 py-8 text-center text-white"
      style={{
        background: gradientNaglowka(motyw),
        boxShadow: `inset 0 -2px 0 ${kolorAlpha("#fff", 0.2)}`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]" style={wzorKropek("#fff", 26)} aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-30" style={wzorPromieni("#fff")} aria-hidden />
      <div
        className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full blur-2xl"
        style={{ backgroundColor: kolorAlpha(motyw.akcent2 ?? motyw.akcent, 0.5) }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full blur-2xl"
        style={{ backgroundColor: kolorAlpha("#fff", 0.25) }}
        aria-hidden
      />
      <div className="relative">
        <Logo logoDataUrl={logoDataUrl} motyw={motyw} rozmiar="plakat" />
        <p className="text-[11px] font-bold uppercase tracking-[0.4em] drop-shadow-sm opacity-95">{naglowek}</p>
        {dekoracja ? (
          <p className="mt-2 text-base tracking-[0.35em] drop-shadow-md" aria-hidden>
            {dekoracja}
          </p>
        ) : null}
        <h2
          className="mt-2 font-serif text-[2.35rem] font-black leading-[1.02] tracking-tight"
          style={{ textShadow: cienTekstuGlow(motyw.akcent) }}
        >
          {tytul}
        </h2>
      </div>
    </div>
  );
}

function MetaKafelkiWow({
  data,
  godzina,
  miejsce,
  motyw,
}: {
  data: string;
  godzina: string;
  miejsce: string;
  motyw: MotywGrafiki;
}) {
  const kafelki = [
    { label: "Data", val: data, icon: "📅" },
    { label: "Godzina", val: godzina !== "…" ? godzina : "—", icon: "🕐" },
    { label: "Miejsce", val: miejsce, icon: "📍", maly: true },
  ];
  return (
    <div
      className="mt-5 overflow-hidden rounded-2xl text-center text-white"
      style={{
        background: gradientNaglowka(motyw, 120),
        boxShadow: cienGlow(motyw.akcent, 20, 0.4),
      }}
    >
      <div className="grid grid-cols-3 divide-x divide-white/20">
        {kafelki.map((k) => (
          <div key={k.label} className="px-2 py-3">
            <p className="text-sm opacity-90" aria-hidden>
              {k.icon}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider opacity-85">{k.label}</p>
            <p className={`font-bold leading-tight ${k.maly ? "text-[11px]" : "text-sm"}`}>{k.val}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaWydarzenia({ wartosci, motyw }: { wartosci: WartosciPolGrafiki; motyw: MotywGrafiki }) {
  const data = w(wartosci, "data", "");
  const godzina = w(wartosci, "godzina", "");
  const miejsce = w(wartosci, "miejsce", "");
  if (!data && !godzina && !miejsce) return null;
  const dataFmt = data ? formatDatyPolskiej(data) : "…";
  return (
    <MetaKafelkiWow data={dataFmt} godzina={godzina} miejsce={miejsce} motyw={motyw} />
  );
}

function LayoutZaproszenieEleganckie({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-8 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: gradientMesh(motyw) }} aria-hidden />
      <RogiOzdobne motyw={motyw} />
      <div className="relative">
        <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
        <div
          className="mb-2 inline-block rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.35em]"
          style={{ backgroundColor: kolorAlpha(motyw.akcent, 0.12), color: motyw.akcent }}
        >
          {w(wartosci, "naglowek")}
        </div>
        <h2
          className="font-serif text-3xl font-semibold leading-tight"
          style={{ color: motyw.tekst, textShadow: `0 1px 0 ${kolorAlpha(motyw.akcent, 0.15)}` }}
        >
          {w(wartosci, "tytul")}
        </h2>
        <LiniaSwietlna motyw={motyw} szer={120} />
        <p className="max-w-md text-base leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "opis")}
        </p>
        <MetaWydarzenia wartosci={wartosci} motyw={motyw} />
        <p className="mt-6 text-sm font-semibold" style={{ color: motyw.akcent }}>
          {w(wartosci, "organizator")}
        </p>
        {w(wartosci, "kontakt", "") && w(wartosci, "kontakt") !== "…" ? (
          <p className="mt-1 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
            {w(wartosci, "kontakt")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LayoutZaproszenieNowoczesne({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div
        className="relative px-8 py-7 text-white"
        style={{
          background: gradientNaglowka(motyw),
          clipPath: "polygon(0 0, 100% 0, 100% 88%, 50% 100%, 0 88%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20" style={wzorKropek("#fff", 20)} aria-hidden />
        <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
        <p className="text-xs font-bold uppercase tracking-[0.35em] opacity-95">{w(wartosci, "naglowek")}</p>
        <h2 className="mt-2 font-serif text-2xl font-bold" style={{ textShadow: cienTekstuGlow(motyw.akcent) }}>
          {w(wartosci, "tytul")}
        </h2>
      </div>
      <div className="flex flex-1 flex-col px-8 py-6" style={{ background: gradientTlaSubtelny(motyw) }}>
        <p className="flex-1 text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "opis")}
        </p>
        <MetaWydarzenia wartosci={wartosci} motyw={motyw} />
        <div
          className="mt-4 rounded-xl border px-4 py-3 text-xs"
          style={{ borderColor: kolorAlpha(motyw.akcent, 0.25), backgroundColor: kolorAlpha(motyw.akcent, 0.06), color: motyw.tekstDrugorzedny }}
        >
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
    <div className="relative flex h-full flex-col items-center justify-center px-12 py-8 text-center">
      <div
        className="pointer-events-none absolute inset-4 rounded-xl border-2 border-double opacity-70"
        style={{ borderColor: kolorAlpha(motyw.akcent, 0.45) }}
        aria-hidden
      />
      <RogiOzdobne motyw={motyw} />
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <p
        className="text-sm font-bold uppercase tracking-[0.45em]"
        style={{ color: motyw.akcent2 ?? motyw.akcent }}
      >
        {w(wartosci, "naglowek")}
      </p>
      <LiniaSwietlna motyw={motyw} szer={80} />
      <p className="text-lg italic" style={{ color: motyw.tekstDrugorzedny }}>
        niniejszym przyznaje się
      </p>
      <h2
        className="my-4 font-serif text-4xl font-bold italic"
        style={{ color: motyw.tekst, textShadow: `0 2px 8px ${kolorAlpha(motyw.akcent, 0.2)}` }}
      >
        {w(wartosci, "tytul")}
      </h2>
      <p className="max-w-lg text-base leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <PieczecOzdobna motyw={motyw} emoji="★" />
      <p className="mt-2 text-sm" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "miejsce")}, {formatDatyPolskiej(w(wartosci, "data", ""))}
      </p>
      <p className="mt-2 text-sm font-semibold" style={{ color: motyw.akcent }}>
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
        className="pointer-events-none absolute inset-3 rounded-2xl border-[3px] border-double"
        style={{ borderColor: motyw.ramka ?? motyw.akcent }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-7 rounded-xl border"
        style={{ borderColor: kolorAlpha(motyw.akcent, 0.35) }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 opacity-30"
        style={{ background: gradientNaglowka(motyw, 90) }}
        aria-hidden
      />
      <RogiOzdobne motyw={motyw} />
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <p
        className="relative font-serif text-2xl font-bold"
        style={{ color: motyw.akcent, textShadow: cienTekstuGlow(motyw.akcent) }}
      >
        ★ {w(wartosci, "naglowek")} ★
      </p>
      <h2
        className="relative my-5 font-serif text-4xl font-black"
        style={{ color: motyw.tekst, textShadow: `0 2px 12px ${kolorAlpha(motyw.akcent, 0.25)}` }}
      >
        {w(wartosci, "tytul")}
      </h2>
      <LiniaSwietlna motyw={motyw} szer={140} />
      <p className="relative max-w-md text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <PieczecOzdobna motyw={motyw} emoji="🏆" />
      <p className="relative mt-2 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "organizator")} · {formatDatyPolskiej(w(wartosci, "data", ""))}
      </p>
      <Podpisy wartosci={wartosci} />
      <PodpisCyfrowy wartosci={wartosci} motyw={motyw} />
    </div>
  );
}

function LayoutDyplomPergamin({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div
      className="relative flex h-full flex-col items-center justify-center px-12 py-10 text-center"
      style={{
        background: `linear-gradient(165deg, #fdf8ef 0%, ${motyw.tlo} 35%, #f5ebe0 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-3 rounded-sm border-2"
        style={{ borderColor: `${motyw.akcent}88` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-6 rounded-sm border border-dashed opacity-60"
        style={{ borderColor: motyw.akcent2 ?? motyw.akcent }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 opacity-50"
        style={{ borderColor: motyw.akcent }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 opacity-50"
        style={{ borderColor: motyw.akcent }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-6 left-6 h-10 w-10 border-b-2 border-l-2 opacity-50"
        style={{ borderColor: motyw.akcent }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-6 right-6 h-10 w-10 border-b-2 border-r-2 opacity-50"
        style={{ borderColor: motyw.akcent }}
        aria-hidden
      />
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <p
        className="text-[11px] font-bold uppercase tracking-[0.45em]"
        style={{ color: motyw.akcent2 ?? motyw.akcent }}
      >
        {w(wartosci, "naglowek")}
      </p>
      <p className="mt-3 font-serif text-base italic" style={{ color: motyw.tekstDrugorzedny }}>
        niniejszym wyróżnia się
      </p>
      <h2
        className="my-4 font-serif text-[2.35rem] font-bold leading-tight"
        style={{ color: motyw.tekst, textShadow: `0 1px 0 ${motyw.akcent}22` }}
      >
        {w(wartosci, "tytul")}
      </h2>
      <div
        className="mx-auto mb-4 h-px w-32"
        style={{ background: `linear-gradient(90deg, transparent, ${motyw.akcent}, transparent)` }}
        aria-hidden
      />
      <p className="max-w-lg text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <p className="mt-5 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "miejsce")}, {formatDatyPolskiej(w(wartosci, "data", ""))}
      </p>
      <p className="mt-1 text-sm font-semibold" style={{ color: motyw.akcent }}>
        {w(wartosci, "organizator")}
      </p>
      <div
        className="mt-4 flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg shadow-inner"
        style={{ borderColor: `${motyw.akcent}66`, backgroundColor: `${motyw.akcent}12`, color: motyw.akcent }}
        aria-hidden
      >
        ✦
      </div>
      <Podpisy wartosci={wartosci} />
      <PodpisCyfrowy wartosci={wartosci} motyw={motyw} />
    </div>
  );
}

function LayoutDyplomMedal({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="relative flex h-full flex-col text-center">
      <div
        className="relative px-8 py-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${motyw.akcent} 0%, ${motyw.akcent2 ?? motyw.akcent} 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
        }}
      >
        <Logo logoDataUrl={logoDataUrl} motyw={{ ...motyw, tlo: "transparent" }} />
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] opacity-90">{w(wartosci, "naglowek")}</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-10 py-6">
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-4 text-2xl shadow-lg"
          style={{
            borderColor: motyw.akcent,
            backgroundColor: `${motyw.akcent}18`,
            color: motyw.akcent,
            boxShadow: `0 4px 20px ${motyw.akcent}44`,
          }}
          aria-hidden
        >
          🏅
        </div>
        <h2 className="font-serif text-4xl font-bold" style={{ color: motyw.tekst }}>
          {w(wartosci, "tytul")}
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "opis")}
        </p>
        <p className="mt-4 text-xs font-medium" style={{ color: motyw.akcent }}>
          {w(wartosci, "organizator")}
        </p>
        <p className="mt-1 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "miejsce")} · {formatDatyPolskiej(w(wartosci, "data", ""))}
        </p>
        <Podpisy wartosci={wartosci} />
        <PodpisCyfrowy wartosci={wartosci} motyw={motyw} />
      </div>
    </div>
  );
}

function LayoutPlakat({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  const data = formatDatyPolskiej(w(wartosci, "data", ""));
  const godzina = w(wartosci, "godzina", "");
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <NaglowekPlakatWow
        motyw={motyw}
        logoDataUrl={logoDataUrl}
        naglowek={w(wartosci, "naglowek")}
        tytul={w(wartosci, "tytul")}
        dekoracja="✦ ✦ ✦"
      />
      <FalaSeparator motyw={motyw} />
      <div className="flex flex-1 flex-col px-6 py-5" style={{ background: gradientTlaSubtelny(motyw) }}>
        <div
          className="relative flex-1 overflow-hidden rounded-2xl border px-4 py-4 text-base leading-relaxed shadow-sm"
          style={{
            color: motyw.tekst,
            borderColor: kolorAlpha(motyw.akcent, 0.25),
            backgroundColor: kolorAlpha("#fff", 0.85),
            boxShadow: cienGlow(motyw.akcent, 12, 0.12),
          }}
        >
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-2xl"
            style={{ background: gradientNaglowka(motyw, 180) }}
            aria-hidden
          />
          <div className="pl-2">{linie(w(wartosci, "opis"))}</div>
        </div>
        <MetaKafelkiWow data={data} godzina={godzina} miejsce={w(wartosci, "miejsce")} motyw={motyw} />
        <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "organizator")}
          {w(wartosci, "kontakt", "") !== "…" ? (
            <>
              <br />
              <span className="font-semibold">{w(wartosci, "kontakt")}</span>
            </>
          ) : null}
        </p>
        <p
          className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] opacity-50"
          style={{ color: motyw.tekstDrugorzedny }}
        >
          naszawies.pl · plakat dla Twojej wsi
        </p>
      </div>
    </div>
  );
}

function LayoutPlakatDzieci({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  const data = formatDatyPolskiej(w(wartosci, "data", ""));
  const godzina = w(wartosci, "godzina", "");
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <NaglowekPlakatWow
        motyw={motyw}
        logoDataUrl={logoDataUrl}
        naglowek={w(wartosci, "naglowek")}
        tytul={w(wartosci, "tytul")}
        dekoracja="⭐ 🎈 🎨 🎈 ⭐"
      />
      <div className="pointer-events-none absolute inset-x-0 top-[38%] z-[1] flex justify-between px-3 opacity-80" aria-hidden>
        {["🎈", "🌈", "🎪", "🍭", "🎁"].map((e, i) => (
          <span key={i} className="text-lg drop-shadow-sm">
            {e}
          </span>
        ))}
      </div>
      <FalaSeparator motyw={motyw} />
      <div className="relative flex flex-1 flex-col px-5 py-4" style={{ background: gradientTlaSubtelny(motyw) }}>
        <div
          className="flex-1 rounded-2xl border-[3px] border-dashed px-4 py-4 text-[15px] leading-relaxed shadow-inner"
          style={{
            color: motyw.tekst,
            borderColor: kolorAlpha(motyw.akcent, 0.45),
            backgroundColor: kolorAlpha("#fff", 0.92),
            boxShadow: `inset 0 2px 8px ${kolorAlpha(motyw.akcent, 0.08)}`,
          }}
        >
          {linie(w(wartosci, "opis"))}
        </div>
        <MetaKafelkiWow data={data} godzina={godzina} miejsce={w(wartosci, "miejsce")} motyw={motyw} />
        <p className="mt-3 text-center text-xs font-medium" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "organizator")}
          {w(wartosci, "kontakt", "") !== "…" ? (
            <>
              <br />
              <span className="font-bold" style={{ color: motyw.akcent }}>
                {w(wartosci, "kontakt")}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function LayoutPlakatSwietlica({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  const data = formatDatyPolskiej(w(wartosci, "data", ""));
  const godzina = w(wartosci, "godzina", "");
  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div
        className="relative border-b-4 px-6 py-6 text-white"
        style={{
          borderColor: motyw.akcent2 ?? motyw.akcent,
          background: gradientNaglowka(motyw, 160),
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-15" style={wzorKropek("#fff", 24)} aria-hidden />
        <div className="relative flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg"
            style={{
              backgroundColor: kolorAlpha("#fff", 0.2),
              border: `2px solid ${kolorAlpha("#fff", 0.35)}`,
              boxShadow: cienGlow(motyw.akcent, 12, 0.4),
            }}
            aria-hidden
          >
            🏠
          </div>
          <div className="min-w-0 flex-1">
            <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
            <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-95">{w(wartosci, "naglowek")}</p>
            <h2
              className="mt-1 font-serif text-2xl font-black leading-tight"
              style={{ textShadow: cienTekstuGlow(motyw.akcent) }}
            >
              {w(wartosci, "tytul")}
            </h2>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-6 py-5" style={{ background: gradientTlaSubtelny(motyw) }}>
        <div
          className="relative flex-1 overflow-hidden rounded-2xl px-4 py-4 text-sm leading-relaxed whitespace-pre-line shadow-sm"
          style={{
            color: motyw.tekst,
            backgroundColor: kolorAlpha("#fff", 0.9),
            borderLeft: `5px solid ${motyw.akcent}`,
            boxShadow: cienGlow(motyw.akcent, 10, 0.15),
          }}
        >
          {w(wartosci, "opis")}
        </div>
        <MetaKafelkiWow
          data={data !== "…" ? data : "—"}
          godzina={godzina}
          miejsce={w(wartosci, "miejsce")}
          motyw={motyw}
        />
        <div
          className="mt-4 rounded-xl px-4 py-3 text-xs"
          style={{
            background: gradientNaglowka(motyw, 100),
            color: "#fff",
            boxShadow: cienGlow(motyw.akcent, 8, 0.25),
          }}
        >
          <p className="font-semibold">{w(wartosci, "organizator")}</p>
          <p className="mt-1 opacity-90">{w(wartosci, "kontakt")}</p>
        </div>
      </div>
    </div>
  );
}

function LayoutPlakatOgloszenie({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  const data = formatDatyPolskiej(w(wartosci, "data", ""));
  const godzina = w(wartosci, "godzina", "");
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden shadow-inner"
      style={{
        border: `4px solid ${motyw.akcent}`,
        boxShadow: `inset 0 0 0 2px ${kolorAlpha(motyw.akcent, 0.2)}, ${cienGlow(motyw.akcent, 16, 0.2)}`,
      }}
    >
      <div
        className="absolute -left-1 top-3 z-10 h-4 w-4 rounded-full shadow-md"
        style={{ backgroundColor: motyw.akcent2 ?? motyw.akcent, boxShadow: cienGlow(motyw.akcent, 6, 0.5) }}
        aria-hidden
        title=""
      />
      <div
        className="relative px-5 py-3 text-center text-xs font-black uppercase tracking-[0.35em] text-white"
        style={{ background: gradientNaglowka(motyw, 90) }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20" style={wzorPromieni("#fff")} aria-hidden />
        <span className="relative">{w(wartosci, "naglowek")}</span>
      </div>
      <div className="relative flex flex-1 flex-col px-6 py-5" style={{ background: gradientTlaSubtelny(motyw) }}>
        <div className="pointer-events-none absolute inset-0 opacity-30" style={wzorKropek(kolorAlpha(motyw.akcent, 0.15), 18)} aria-hidden />
        <Logo logoDataUrl={logoDataUrl} motyw={motyw} rozmiar="plakat" />
        <h2
          className="relative mt-3 text-center font-serif text-[1.85rem] font-black leading-tight"
          style={{ color: motyw.tekst, textShadow: `0 1px 0 ${kolorAlpha(motyw.akcent, 0.2)}` }}
        >
          {w(wartosci, "tytul")}
        </h2>
        <LiniaSwietlna motyw={motyw} szer={100} />
        <div
          className="relative flex-1 rounded-xl border-2 px-4 py-4 text-[15px] leading-relaxed whitespace-pre-line shadow-sm"
          style={{
            color: motyw.tekst,
            borderColor: motyw.akcent,
            backgroundColor: kolorAlpha("#fff", 0.95),
            boxShadow: `inset 0 1px 4px ${kolorAlpha(motyw.akcent, 0.08)}`,
          }}
        >
          {w(wartosci, "opis")}
        </div>
        <MetaKafelkiWow data={data} godzina={godzina} miejsce={w(wartosci, "miejsce")} motyw={motyw} />
        <p className="relative mt-3 text-center text-xs font-medium" style={{ color: motyw.tekstDrugorzedny }}>
          {w(wartosci, "organizator")}
          {w(wartosci, "kontakt", "") !== "…" ? (
            <>
              <br />
              <span className="font-bold" style={{ color: motyw.akcent }}>
                {w(wartosci, "kontakt")}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function LayoutKartaRegulamin({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  const punkty = w(wartosci, "opis")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <div className="relative flex h-full flex-col px-6 py-6">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: gradientMesh(motyw) }} aria-hidden />
      <div
        className="relative flex items-start gap-4 overflow-hidden rounded-2xl px-4 py-4 shadow-sm"
        style={{
          background: gradientNaglowka(motyw, 120),
          color: "#fff",
          boxShadow: cienGlow(motyw.akcent, 12, 0.3),
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-15" style={wzorKropek("#fff", 20)} aria-hidden />
        {logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoDataUrl} alt="" className="relative h-14 w-14 shrink-0 rounded-xl object-cover ring-2 ring-white/40" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={LOGO_GRAFIKA_SRC} alt="" className="relative h-14 w-14 shrink-0 rounded-xl bg-white/90 object-contain p-1 ring-2 ring-white/40" />
        )}
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-90">
            📋 {w(wartosci, "naglowek")}
          </p>
          <h2 className="mt-1 font-serif text-xl font-black" style={{ textShadow: cienTekstuGlow(motyw.akcent) }}>
            {w(wartosci, "tytul")}
          </h2>
        </div>
      </div>
      <ol className="relative mt-4 flex-1 space-y-2">
        {punkty.map((punkt, i) => {
          const bezNumeru = punkt.replace(/^\d+[\).\s]+/, "");
          return (
            <li
              key={`${i}-${bezNumeru.slice(0, 20)}`}
              className="flex gap-3 rounded-xl px-3 py-2.5 text-sm leading-snug shadow-sm"
              style={{
                backgroundColor: i % 2 === 0 ? kolorAlpha("#fff", 0.85) : kolorAlpha(motyw.akcent, 0.06),
                color: motyw.tekst,
                borderLeft: `3px solid ${i % 2 === 0 ? motyw.akcent : motyw.akcent2 ?? motyw.akcent}`,
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white shadow-sm"
                style={{ background: gradientNaglowka(motyw, 135) }}
              >
                {i + 1}
              </span>
              <span>{bezNumeru}</span>
            </li>
          );
        })}
      </ol>
      <div
        className="relative mt-4 rounded-xl px-4 py-3 text-xs text-white"
        style={{
          background: gradientNaglowka(motyw, 100),
          boxShadow: cienGlow(motyw.akcent, 8, 0.25),
        }}
      >
        <p className="font-semibold">{w(wartosci, "kontakt")}</p>
        <p className="mt-1 opacity-90">{w(wartosci, "organizator")}</p>
      </div>
    </div>
  );
}

function LayoutPodziekowanie({ wartosci, motyw, logoDataUrl }: Omit<Props, "szablon" | "elementId">) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center px-10 py-8 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: gradientMesh(motyw) }} aria-hidden />
      <RogiOzdobne motyw={motyw} />
      <Logo logoDataUrl={logoDataUrl} motyw={motyw} />
      <div
        className="rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em]"
        style={{ backgroundColor: kolorAlpha(motyw.akcent, 0.12), color: motyw.akcent }}
      >
        {w(wartosci, "naglowek")}
      </div>
      <h2
        className="mt-3 font-serif text-3xl font-bold"
        style={{ color: motyw.tekst, textShadow: `0 2px 8px ${kolorAlpha(motyw.akcent, 0.2)}` }}
      >
        {w(wartosci, "tytul")}
      </h2>
      <LiniaSwietlna motyw={motyw} szer={100} />
      <p className="mt-5 max-w-sm text-sm leading-relaxed whitespace-pre-line" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "opis")}
      </p>
      <PieczecOzdobna motyw={motyw} emoji="🙏" />
      <p className="mt-2 text-xs" style={{ color: motyw.tekstDrugorzedny }}>
        {w(wartosci, "miejsce", "") !== "…" ? `${w(wartosci, "miejsce")}, ` : ""}
        {formatDatyPolskiej(w(wartosci, "data", ""))}
      </p>
      <p className="mt-2 text-sm font-semibold" style={{ color: motyw.akcent }}>
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
          // eslint-disable-next-line @next/next/no-img-element
          <img src={LOGO_GRAFIKA_SRC} alt="" className="h-14 w-14 shrink-0 rounded-lg object-contain" />
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
    case "dyplom-pergamin":
      return <LayoutDyplomPergamin {...props} />;
    case "dyplom-medal":
      return <LayoutDyplomMedal {...props} />;
    case "plakat":
      return <LayoutPlakat {...props} />;
    case "plakat-dzieci":
      return <LayoutPlakatDzieci {...props} />;
    case "plakat-swietlica":
      return <LayoutPlakatSwietlica {...props} />;
    case "plakat-ogloszenie":
      return <LayoutPlakatOgloszenie {...props} />;
    case "karta-regulamin":
      return <LayoutKartaRegulamin {...props} />;
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
  backgroundOverlay = DOMYSLNY_BACKGROUND_OVERLAY,
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

  const overlay = normalizujBackgroundOverlay(backgroundOverlay);

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
      className="relative mx-auto overflow-hidden"
      style={{
        width: szer,
        minHeight: wys,
        ...(formatSocial ? { height: wys, display: "flex", flexDirection: "column", justifyContent: "center" } : {}),
        background: backgroundDataUrl ? undefined : gradientTlaSubtelny(motyw),
        color: motyw.tekst,
        border: motyw.ramka ? `3px solid ${motyw.ramka}` : undefined,
        boxShadow: `${cienGlow(motyw.akcent, 28, 0.22)}, 0 1px 0 ${kolorAlpha("#fff", 0.8)} inset`,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
        ...tloStyle,
      }}
    >
      {!backgroundDataUrl ? (
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: gradientMesh(motyw) }} aria-hidden />
      ) : null}
      {backgroundDataUrl ? (
        <div className="absolute inset-0 bg-white" style={{ opacity: overlay }} aria-hidden />
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
  const layoutEtykieta =
    szablon.layout === "plakat-ogloszenie"
      ? "Tablica"
      : szablon.layout === "plakat-dzieci"
      ? "Dzieci"
      : szablon.layout === "plakat-swietlica" || szablon.layout === "karta-regulamin"
        ? "Świetlica"
        : szablon.layout === "dyplom-pergamin"
          ? "Pergamin"
          : szablon.layout === "dyplom-medal"
            ? "Medal"
            : szablon.layout.startsWith("dyplom")
              ? "Dyplom"
              : szablon.layout === "plakat"
                ? "Plakat"
                : null;

  const maWow = szablon.tagi?.includes("wow");

  return (
    <div
      className="relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-lg border p-2 shadow-sm transition group-hover:shadow-md"
      style={{
        background: gradientTlaSubtelny(motyw),
        color: motyw.tekst,
        borderColor: motyw.ramka ?? undefined,
        boxShadow: maWow ? cienGlow(motyw.akcent, 10, 0.25) : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{ background: gradientMesh(motyw) }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%]"
        style={{ background: gradientNaglowka(motyw, 180), opacity: 0.35 }}
        aria-hidden
      />
      {maWow ? (
        <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[8px] font-black uppercase text-white shadow-sm">
          WOW
        </span>
      ) : null}
      {layoutEtykieta ? (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[8px] font-bold uppercase text-amber-950 shadow-sm">
          {layoutEtykieta}
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_GRAFIKA_SRC}
        alt=""
        className="absolute left-2 top-2 z-[1] h-7 w-7 rounded-full bg-white/90 object-contain p-0.5 shadow-sm ring-1 ring-white/80"
      />
      <div
        className="relative mb-1 h-1 w-3/4 rounded-full opacity-70"
        style={{ background: gradientNaglowka(motyw, 90) }}
        aria-hidden
      />
      <p className="relative text-[9px] font-semibold uppercase tracking-wide opacity-70">{szablon.kategoria}</p>
      <p className="relative mt-0.5 line-clamp-2 font-serif text-[11px] font-bold leading-tight">{szablon.tytul}</p>
    </div>
  );
}
