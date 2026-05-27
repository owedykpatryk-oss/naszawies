"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { wyslijWiadomoscCzat } from "./akcje";

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
}: {
  conversationId: string;
  wiadomosci: WiadomoscWiersz[];
  mojUserId: string;
}) {
  const router = useRouter();
  const [wiadomosci, ustawWiadomosci] = useState(poczatkowe);
  const [tekst, ustawTekst] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const dol = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ustawWiadomosci(poczatkowe);
  }, [poczatkowe]);

  useEffect(() => {
    dol.current?.scrollIntoView({ behavior: "smooth" });
  }, [wiadomosci.length]);

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
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(kanal);
    };
  }, [conversationId, mojUserId]);

  function wyslij(e: FormEvent) {
    e.preventDefault();
    if (!tekst.trim()) return;
    ustawBlad("");
    startT(async () => {
      const w = await wyslijWiadomoscCzat(conversationId, tekst);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawTekst("");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-[50vh] flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: "min(60vh, 520px)" }}>
        {wiadomosci.length === 0 ? (
          <p className="text-center text-sm text-stone-500">Brak wiadomości — napisz pierwszą.</p>
        ) : (
          wiadomosci.map((m) => (
            <div key={m.id} className={`flex ${m.toJa ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.toJa ? "bg-green-800 text-white" : "bg-stone-100 text-stone-900"
                }`}
              >
                {!m.toJa ? <p className="mb-0.5 text-[10px] font-semibold opacity-80">{m.nadawca}</p> : null}
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${m.toJa ? "text-green-100" : "text-stone-500"}`}>
                  {new Date(m.created_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={dol} />
      </div>
      <form onSubmit={wyslij} className="border-t border-stone-200 p-3">
        {blad ? <p className="mb-2 text-xs text-red-800">{blad}</p> : null}
        <div className="flex gap-2">
          <input
            value={tekst}
            onChange={(e) => ustawTekst(e.target.value)}
            placeholder="Wiadomość…"
            maxLength={4000}
            className="min-h-[44px] flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={czek || !tekst.trim()}
            className="shrink-0 rounded-xl bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
          >
            Wyślij
          </button>
        </div>
      </form>
    </div>
  );
}
