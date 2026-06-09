"use client";

import { useRef } from "react";
import { wstawFormatTresci } from "@/lib/tresc/tresc-bogata";

type Props = {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  className?: string;
};

export function EdytorTresciProstej({
  id,
  value,
  onChange,
  rows = 5,
  maxLength = 6000,
  placeholder,
  className = "form-control form-control--textarea mt-2",
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function formatuj(przed: string, po: string) {
    const el = ref.current;
    if (!el) return;
    const { tresc, kursor } = wstawFormatTresci(
      value,
      el.selectionStart,
      el.selectionEnd,
      przed,
      po,
    );
    onChange(tresc.slice(0, maxLength));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(kursor, kursor);
    });
  }

  function wstawLink() {
    const el = ref.current;
    if (!el) return;
    const url = window.prompt("Adres URL (https://…)", "https://");
    if (!url?.trim()) return;
    const etykieta = el.value.slice(el.selectionStart, el.selectionEnd) || "link";
    const wstawka = `[${etykieta}](${url.trim()})`;
    const tresc = value.slice(0, el.selectionStart) + wstawka + value.slice(el.selectionEnd);
    onChange(tresc.slice(0, maxLength));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className="rounded border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          onClick={() => formatuj("**", "**")}
          title="Pogrubienie"
        >
          B
        </button>
        <button
          type="button"
          className="rounded border border-stone-200 bg-white px-2 py-1 text-xs italic text-stone-700 hover:bg-stone-50"
          onClick={() => formatuj("*", "*")}
          title="Kursywa"
        >
          I
        </button>
        <button
          type="button"
          className="rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
          onClick={wstawLink}
          title="Link"
        >
          Link
        </button>
        <button
          type="button"
          className="rounded border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 hover:bg-stone-50"
          onClick={() => {
            const el = ref.current;
            if (!el) return;
            const linia = el.value.slice(0, el.selectionStart).split("\n").length;
            const linie = value.split("\n");
            linie.splice(linia, 0, "- ");
            onChange(linie.join("\n").slice(0, maxLength));
          }}
          title="Lista"
        >
          Lista
        </button>
      </div>
      <textarea
        ref={ref}
        id={id}
        className={className}
        rows={rows}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-1 text-xs text-stone-500">
        **pogrubienie**, *kursywa*, [tekst](url), lista z „- ”. Podgląd na profilu wsi.
      </p>
    </div>
  );
}
