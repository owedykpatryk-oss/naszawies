"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  etykietaDniaWiadomosci,
  kluczDniaWiadomosci,
  skrotCzasWiadomosci,
} from "@/lib/czat/formatuj-czas-wiadomosci";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { oznaczPrzeczytane, pobierzStarszeWiadomosciCzat, wyslijWiadomoscCzat } from "./akcje";

export type WiadomoscWiersz = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  nadawca: string;
  toJa: boolean;
};

export function CzatOknoKlient({
  conversationId,
  wiadomosci: poczatkowe,
  mojUserId,
  mojaNazwa,
  kind,
  odczytInnych,
  maStarsze = false,
}: {
  conversationId: string;
  wiadomosci: WiadomoscWiersz[];
  mojUserId: string;
  mojaNazwa: string;
  kind: "direct" | "group";
  /** last_read_at pozostałych członków (do potwierdzenia odczytu w rozmowie 1:1) */
  odczytInnych: { user_id: string; last_read_at: string | null }[];
  maStarsze?: boolean;
}) {
  const [wiadomosci, ustawWiadomosci] = useState(poczatkowe);
  const [tekst, ustawTekst] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [ladujeStarsze, ustawLadujeStarsze] = useState(false);
  const [maWiecejHistorii, ustawMaWiecejHistorii] = useState(maStarsze);
  const [piszeKtos, ustawPiszeKtos] = useState<string | null>(null);
  const dol = useRef<HTMLDivElement>(null);
  const kontener = useRef<HTMLDivElement>(null);
  const kanalRef = useRef<ReturnType<ReturnType<typeof utworzKlientaSupabasePrzegladarka>["channel"]> | null>(null);
  const timeoutPisania = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ostatniePisanie = useRef(0);

  useEffect(() => {
    ustawWiadomosci(poczatkowe);
    ustawMaWiecejHistorii(maStarsze);
  }, [poczatkowe, maStarsze]);

  useEffect(() => {
    dol.current?.scrollIntoView({ behavior: "smooth" });
  }, [wiadomosci.length, piszeKtos]);

  const oznaczAktywnyOdczyt = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      void oznaczPrzeczytane(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    const supabase = utworzKlientaSupabasePrzegladarka();
    const kanal = supabase
      .channel(`czat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            created_at: string;
            sender_id: string;
          };

          let nadawca = "Użytkownik";
          const { data: u } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", row.sender_id)
            .maybeSingle();
          if (u?.display_name) nadawca = u.display_name;

          const nowa: WiadomoscWiersz = {
            id: row.id,
            body: row.body,
            created_at: row.created_at,
            sender_id: row.sender_id,
            nadawca,
            toJa: row.sender_id === mojUserId,
          };

          ustawWiadomosci((prev) => (prev.some((w) => w.id === row.id) ? prev : [...prev, nowa]));

          if (row.sender_id !== mojUserId) {
            oznaczAktywnyOdczyt();
          }
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        const d = payload.payload as { userId?: string; name?: string };
        if (!d.userId || d.userId === mojUserId) return;
        ustawPiszeKtos(d.name ?? "Ktoś");
        if (timeoutPisania.current) clearTimeout(timeoutPisania.current);
        timeoutPisania.current = setTimeout(() => ustawPiszeKtos(null), 3000);
      })
      .subscribe();

    kanalRef.current = kanal;

    return () => {
      if (timeoutPisania.current) clearTimeout(timeoutPisania.current);
      kanalRef.current = null;
      void supabase.removeChannel(kanal);
    };
  }, [conversationId, mojUserId, oznaczAktywnyOdczyt]);

  const wyslijSygnalPisania = useCallback(() => {
    const teraz = Date.now();
    if (teraz - ostatniePisanie.current < 2000) return;
    ostatniePisanie.current = teraz;
    void kanalRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: mojUserId, name: mojaNazwa },
    });
  }, [mojUserId, mojaNazwa]);

  const czyPrzeczytane = useCallback(
    (createdAt: string) => {
      if (kind !== "direct" || odczytInnych.length === 0) return false;
      const ts = Date.parse(createdAt);
      return odczytInnych.every((o) => o.last_read_at && Date.parse(o.last_read_at) >= ts);
    },
    [kind, odczytInnych],
  );

  const wiadomosciZDniem = useMemo(() => {
    const out: { typ: "dzien" | "wiadomosc"; klucz: string; etykieta?: string; wiadomosc?: WiadomoscWiersz }[] = [];
    let poprzedniDzien = "";
    for (const m of wiadomosci) {
      const dzien = kluczDniaWiadomosci(m.created_at);
      if (dzien !== poprzedniDzien) {
        out.push({ typ: "dzien", klucz: `dzien-${dzien}`, etykieta: etykietaDniaWiadomosci(m.created_at) });
        poprzedniDzien = dzien;
      }
      out.push({ typ: "wiadomosc", klucz: m.id, wiadomosc: m });
    }
    return out;
  }, [wiadomosci]);

  async function zaladujStarsze() {
    if (ladujeStarsze || wiadomosci.length === 0) return;
    ustawLadujeStarsze(true);
    ustawBlad("");
    const pierwsza = wiadomosci[0]!;
    const poprzedniaWysokosc = kontener.current?.scrollHeight ?? 0;

    const w = await pobierzStarszeWiadomosciCzat(conversationId, pierwsza.created_at);
    ustawLadujeStarsze(false);

    if ("blad" in w) {
      ustawBlad(w.blad);
      return;
    }

    if (w.wiadomosci.length === 0) {
      ustawMaWiecejHistorii(false);
      return;
    }

    const starsze: WiadomoscWiersz[] = w.wiadomosci.map((row) => ({
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      sender_id: row.sender_id,
      nadawca: w.nadawcy[row.sender_id] ?? "Użytkownik",
      toJa: row.sender_id === mojUserId,
    }));

    ustawWiadomosci((prev) => {
      const istniejace = new Set(prev.map((p) => p.id));
      const nowe = starsze.filter((s) => !istniejace.has(s.id));
      return [...nowe, ...prev];
    });

    if (w.wiadomosci.length < 50) ustawMaWiecejHistorii(false);

    requestAnimationFrame(() => {
      if (kontener.current) {
        kontener.current.scrollTop = kontener.current.scrollHeight - poprzedniaWysokosc;
      }
    });
  }

  function wyslij(e: FormEvent) {
    e.preventDefault();
    if (!tekst.trim()) return;
    ustawBlad("");
    const tresc = tekst.trim();
    startT(async () => {
      const w = await wyslijWiadomoscCzat(conversationId, tresc);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawTekst("");
      if (w.wiadomosc) {
        const nowa: WiadomoscWiersz = {
          id: w.wiadomosc.id,
          body: w.wiadomosc.body,
          created_at: w.wiadomosc.created_at,
          sender_id: w.wiadomosc.sender_id,
          nadawca: mojaNazwa,
          toJa: true,
        };
        ustawWiadomosci((prev) => (prev.some((p) => p.id === nowa.id) ? prev : [...prev, nowa]));
      }
    });
  }

  return (
    <div className="flex min-h-[min(55vh,520px)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm lg:min-h-[min(72dvh,780px)]">
      <div
        ref={kontener}
        className="flex-1 space-y-2 overflow-y-auto p-4"
        style={{ maxHeight: "min(62vh, 560px)" }}
      >
        {maWiecejHistorii ? (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              disabled={ladujeStarsze}
              onClick={() => void zaladujStarsze()}
              className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs text-stone-700 hover:bg-white disabled:opacity-50"
            >
              {ladujeStarsze ? "Ładowanie…" : "Pokaż starsze wiadomości"}
            </button>
          </div>
        ) : null}

        {wiadomosci.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">Brak wiadomości — napisz pierwszą.</p>
        ) : (
          wiadomosciZDniem.map((w) =>
            w.typ === "dzien" ? (
              <div key={w.klucz} className="flex justify-center py-2">
                <span className="rounded-full bg-stone-100 px-3 py-0.5 text-[11px] font-medium text-stone-600">
                  {w.etykieta}
                </span>
              </div>
            ) : (
              <div key={w.klucz} className={`flex ${w.wiadomosc!.toJa ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                    w.wiadomosc!.toJa ? "bg-green-800 text-white" : "bg-stone-100 text-stone-900"
                  }`}
                >
                  {!w.wiadomosc!.toJa ? (
                    <p className="mb-0.5 text-[10px] font-semibold opacity-80">{w.wiadomosc!.nadawca}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{w.wiadomosc!.body}</p>
                  <div
                    className={`mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] ${
                      w.wiadomosc!.toJa ? "text-green-100" : "text-stone-500"
                    }`}
                  >
                    <span>{skrotCzasWiadomosci(w.wiadomosc!.created_at)}</span>
                    {w.wiadomosc!.toJa && czyPrzeczytane(w.wiadomosc!.created_at) ? (
                      <span className="font-medium">· Przeczytane</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ),
          )
        )}

        {piszeKtos ? (
          <p className="text-center text-xs italic text-stone-500">{piszeKtos} pisze…</p>
        ) : null}
        <div ref={dol} />
      </div>

      <form onSubmit={wyslij} className="border-t border-stone-200 bg-stone-50/50 p-3">
        {blad ? (
          <p className="mb-2 text-xs text-red-800" role="alert">
            {blad}
          </p>
        ) : null}
        <div className="flex gap-2">
          <textarea
            value={tekst}
            onChange={(e) => {
              ustawTekst(e.target.value);
              wyslijSygnalPisania();
            }}
            placeholder="Wiadomość… (Enter — wyślij, Shift+Enter — nowa linia)"
            maxLength={4000}
            rows={2}
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={czek || !tekst.trim()}
            className="shrink-0 self-end rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
          >
            {czek ? "…" : "Wyślij"}
          </button>
        </div>
        <p className="mt-1 text-right text-[10px] text-stone-400">{tekst.length}/4000</p>
      </form>
    </div>
  );
}
