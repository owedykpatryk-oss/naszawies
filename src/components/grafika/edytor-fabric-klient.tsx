"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Canvas as FabricCanvas } from "fabric";

const FONTY = [
  { id: "serif", label: "Fraunces (szeryfowy)", css: "Fraunces, Georgia, serif" },
  { id: "sans", label: "Inter (nowoczesny)", css: "Inter, system-ui, sans-serif" },
  { id: "classic", label: "Times (klasyczny)", css: "Times New Roman, Times, serif" },
  { id: "mono", label: "Courier (techniczny)", css: "Courier New, monospace" },
];

type Props = {
  szerokosc?: number;
  wysokosc?: number;
  tloKolor?: string;
  tloObraz?: string | null;
  canvasJson?: Record<string, unknown> | null;
  onCanvasChange?: (json: Record<string, unknown>) => void;
  exportId?: string;
};

export function EdytorFabricKlient({
  szerokosc = 560,
  wysokosc = 794,
  tloKolor = "#ffffff",
  tloObraz = null,
  canvasJson = null,
  onCanvasChange,
  exportId = "fabric-export-canvas",
}: Props) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [fontId, ustawFontId] = useState("serif");
  const [tekstNowy, ustawTekstNowy] = useState("Nowy tekst");
  const [laduje, ustawLaduje] = useState(true);

  const zapiszStan = useCallback(() => {
    const c = fabricRef.current;
    if (!c || !onCanvasChange) return;
    const json = c.toJSON() as Record<string, unknown>;
    onCanvasChange(json);
  }, [onCanvasChange]);

  useEffect(() => {
    let aktywny = true;
    let canvas: FabricCanvas | null = null;

    void (async () => {
      const { Canvas, FabricText, Rect, FabricImage } = await import("fabric");
      if (!canvasElRef.current || !aktywny) return;

      canvas = new Canvas(canvasElRef.current, {
        width: szerokosc,
        height: wysokosc,
        backgroundColor: tloObraz ? undefined : tloKolor,
        preserveObjectStacking: true,
      });
      fabricRef.current = canvas;

      if (tloObraz) {
        try {
          const img = await FabricImage.fromURL(tloObraz, { crossOrigin: "anonymous" });
          img.set({
            scaleX: szerokosc / (img.width || szerokosc),
            scaleY: wysokosc / (img.height || wysokosc),
            selectable: false,
            evented: false,
          });
          canvas.backgroundImage = img;
          canvas.renderAll();
        } catch {
          canvas.backgroundColor = tloKolor;
        }
      }

      if (canvasJson && Object.keys(canvasJson).length > 0) {
        await canvas.loadFromJSON(canvasJson);
        canvas.renderAll();
      } else {
        const ramka = new Rect({
          left: 20,
          top: 20,
          width: szerokosc - 40,
          height: wysokosc - 40,
          fill: "transparent",
          stroke: "#86efac",
          strokeWidth: 2,
          strokeDashArray: [8, 4],
          selectable: false,
          evented: false,
        });
        canvas.add(ramka);
        const naglowek = new FabricText("Przeciągaj elementy · warstwy poniżej", {
          left: szerokosc / 2,
          top: 48,
          originX: "center",
          fontFamily: FONTY[0]!.css,
          fontSize: 18,
          fill: "#166534",
        });
        canvas.add(naglowek);
      }

      canvas.on("object:modified", zapiszStan);
      canvas.on("object:added", zapiszStan);
      canvas.on("object:removed", zapiszStan);

      ustawLaduje(false);
    })();

    return () => {
      aktywny = false;
      void fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, [szerokosc, wysokosc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const c = fabricRef.current;
    if (!c || laduje) return;
    if (tloObraz) {
      void (async () => {
        const { FabricImage } = await import("fabric");
        try {
          const img = await FabricImage.fromURL(tloObraz, { crossOrigin: "anonymous" });
          img.set({
            scaleX: szerokosc / (img.width || szerokosc),
            scaleY: wysokosc / (img.height || wysokosc),
            selectable: false,
            evented: false,
          });
          c.backgroundImage = img;
          c.backgroundColor = undefined as unknown as string;
          c.renderAll();
        } catch {
          /* ignore */
        }
      })();
    } else {
      c.backgroundImage = undefined;
      c.backgroundColor = tloKolor;
      c.renderAll();
    }
  }, [tloObraz, tloKolor, szerokosc, wysokosc, laduje]);

  const dodajTekst = async () => {
    const c = fabricRef.current;
    if (!c) return;
    const { FabricText } = await import("fabric");
    const font = FONTY.find((f) => f.id === fontId) ?? FONTY[0]!;
    const t = new FabricText(tekstNowy || "Tekst", {
      left: 80,
      top: 120 + Math.random() * 80,
      fontFamily: font.css,
      fontSize: 24,
      fill: "#14532d",
    });
    c.add(t);
    c.setActiveObject(t);
    c.renderAll();
    zapiszStan();
  };

  const dodajProstokat = async () => {
    const c = fabricRef.current;
    if (!c) return;
    const { Rect } = await import("fabric");
    const r = new Rect({
      left: 60,
      top: 200,
      width: 180,
      height: 60,
      fill: "#16653422",
      stroke: "#166534",
      strokeWidth: 1,
    });
    c.add(r);
    c.setActiveObject(r);
    c.renderAll();
    zapiszStan();
  };

  const dodajObraz = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const plik = e.target.files?.[0];
    const c = fabricRef.current;
    if (!plik || !c) return;
    const url = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(plik);
    });
    const { FabricImage } = await import("fabric");
    const img = await FabricImage.fromURL(url);
    img.scaleToWidth(160);
    img.set({ left: 100, top: 280 });
    c.add(img);
    c.setActiveObject(img);
    c.renderAll();
    zapiszStan();
    e.target.value = "";
  };

  const usunZaznaczone = () => {
    const c = fabricRef.current;
    if (!c) return;
    const aktywne = c.getActiveObjects();
    aktywne.forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.renderAll();
    zapiszStan();
  };

  const warstwaGora = () => {
    const c = fabricRef.current;
    const o = c?.getActiveObject();
    if (c && o) {
      c.bringObjectToFront(o);
      c.renderAll();
      zapiszStan();
    }
  };

  const warstwaDol = () => {
    const c = fabricRef.current;
    const o = c?.getActiveObject();
    if (c && o) {
      c.sendObjectToBack(o);
      c.renderAll();
      zapiszStan();
    }
  };

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
        <select
          value={fontId}
          onChange={(e) => ustawFontId(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5"
          aria-label="Czcionka"
        >
          {FONTY.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={tekstNowy}
          onChange={(e) => ustawTekstNowy(e.target.value)}
          placeholder="Treść tekstu"
          className="min-w-[140px] flex-1 rounded-lg border border-stone-300 px-2 py-1.5"
        />
        <button type="button" onClick={() => void dodajTekst()} className="rounded-lg bg-green-800 px-3 py-1.5 text-white">
          + Tekst
        </button>
        <button type="button" onClick={() => void dodajProstokat()} className="rounded-lg border border-stone-300 px-3 py-1.5">
          + Ramka
        </button>
        <label className="cursor-pointer rounded-lg border border-stone-300 px-3 py-1.5">
          + Obraz
          <input type="file" accept="image/*" className="hidden" onChange={(e) => void dodajObraz(e)} />
        </label>
        <button type="button" onClick={warstwaGora} className="rounded-lg border border-stone-300 px-2 py-1.5" title="Warstwa wyżej">
          ↑
        </button>
        <button type="button" onClick={warstwaDol} className="rounded-lg border border-stone-300 px-2 py-1.5" title="Warstwa niżej">
          ↓
        </button>
        <button type="button" onClick={usunZaznaczone} className="rounded-lg border border-red-200 px-3 py-1.5 text-red-800">
          Usuń
        </button>
      </div>

      <div id={exportId} className="overflow-x-auto rounded-xl border border-stone-200 bg-white p-2 shadow-inner">
        {laduje ? <p className="p-8 text-center text-sm text-stone-500">Ładowanie edytora…</p> : null}
        <canvas ref={canvasElRef} />
      </div>
      <p className="no-print text-xs text-stone-500">
        Edytor drag-and-drop (Fabric.js): zaznacz element i przeciągnij. Eksport PDF obejmuje aktywny podgląd w zakładce
        „Szablony” lub zrzut tego płótna po przełączeniu.
      </p>
    </div>
  );
}
