/**
 * Generowanie PDF po stronie klienta (html2pdf.js).
 * Wywołuj wyłącznie z handlerów w przeglądarce (np. onClick).
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

  const wrap = document.createElement("div");
  wrap.setAttribute("data-naszawies-pdf-export", "");
  const szer = Math.min(820, Math.max(280, Math.round(zrodlo.getBoundingClientRect().width || zrodlo.scrollWidth || 794)));
  wrap.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${szer}px`,
    "max-width:100vw",
    "z-index:2147483646",
    "background:#ffffff",
    "overflow:visible",
    "pointer-events:none",
    "box-sizing:border-box",
  ].join(";");

  wrap.appendChild(klon);
  document.body.appendChild(wrap);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const scale = Math.min(2, Math.max(1, Math.round((typeof window !== "undefined" ? window.devicePixelRatio : 1) * 1.25)));

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
          windowWidth: szer,
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
