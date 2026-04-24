/**
 * Generowanie PDF po stronie klienta (html2pdf.js + html2canvas).
 * Wywołuj wyłącznie z handlerów w przeglądarce (np. onClick).
 *
 * Uwagi (pusta strona w PDF): klon z kontenera `overflow: auto` bywa rasteryzowany
 * jako pusty — unikaj overflow na elemencie z `id`; po wstawieniu do DOM czekamy
 * na layout (requestAnimationFrame) i ustawiamy jawne wymiary + `overflow: visible`.
 */

export function bezpiecznaNazwaPlikuPdf(nazwa: string): string {
  const trimmed = (nazwa || "dokument").trim() || "dokument";
  const bez = trimmed.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_").replace(/\s+/g, "_");
  const base = bez.slice(0, 100).replace(/_+/g, "_").replace(/^_|_$/g, "") || "dokument";
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

type WynikPdf = { ok: true } | { ok: false; komunikat: string };

/**
 * Renderuje klon węzła (bez elementów .no-print), generuje PDF i usuwa klon.
 */
function czekajNaMalowanie(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function pobierzPdfZElementuHtml(
  zrodlo: HTMLElement,
  opcje: { nazwaPliku: string }
): Promise<WynikPdf> {
  if (typeof document === "undefined") {
    return { ok: false, komunikat: "Funkcja dostępna tylko w przeglądarce." };
  }

  const klon = zrodlo.cloneNode(true) as HTMLElement;
  klon.querySelectorAll(".no-print").forEach((node) => {
    node.parentElement?.removeChild(node);
  });
  klon.removeAttribute("id");

  const rect = zrodlo.getBoundingClientRect();
  const szer = Math.ceil(Math.max(rect.width || 0, zrodlo.scrollWidth || 0, 320));
  const wys = Math.ceil(Math.max(rect.height || 0, zrodlo.scrollHeight || 0, 120));
  klon.style.cssText = [
    "box-sizing:border-box",
    "overflow:visible",
    "max-width:none",
    `width:${szer}px`,
    `min-height:${wys}px`,
    "background:#ffffff",
    "color:#1c1917",
    "-webkit-print-color-adjust:exact",
    "print-color-adjust:exact",
  ].join(";");

  const wrap = document.createElement("div");
  wrap.setAttribute("data-naszawies-pdf-export", "");
  wrap.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${szer}px`,
    `min-height:${wys}px`,
    "max-width:100vw",
    "z-index:2147483646",
    "background:#ffffff",
    "overflow:visible",
    "pointer-events:none",
    "box-sizing:border-box",
  ].join(";");

  wrap.appendChild(klon);
  document.body.appendChild(wrap);
  void wrap.offsetHeight;
  await czekajNaMalowanie();

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const scale = Math.min(1.75, Math.max(1, Math.round(dpr * 100) / 100));

    await html2pdf()
      .from(wrap)
      .set({
        margin: [8, 8, 8, 8],
        filename: opcje.nazwaPliku,
        image: { type: "jpeg", quality: 0.93 },
        html2canvas: {
          scale,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          allowTaint: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save();

    return { ok: true };
  } catch (e) {
    const komunikat = e instanceof Error ? e.message : "Nie udało się utworzyć pliku PDF.";
    return { ok: false, komunikat };
  } finally {
    wrap.parentElement?.removeChild(wrap);
  }
}
