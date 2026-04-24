"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { oznaczPowiadomienieJakoPrzeczytane } from "./akcje";

export type PowiadomienieWiersz = {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

export function PowiadomieniaLista({ wpisy }: { wpisy: PowiadomienieWiersz[] }) {
  const router = useRouter();
  const [laduje, ustawLaduje] = useState<string | null>(null);

  async function oznacz(id: string) {
    ustawLaduje(id);
    try {
      await oznaczPowiadomienieJakoPrzeczytane(id);
      router.refresh();
    } finally {
      ustawLaduje(null);
    }
  }

  if (wpisy.length === 0) {
    return <p className="text-sm text-stone-600">Brak powiadomień.</p>;
  }

  return (
    <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
      {wpisy.map((p) => (
        <li key={p.id} className={`px-4 py-4 ${p.is_read ? "opacity-70" : "bg-green-50/40"}`}>
          <p className="font-medium text-stone-900">{p.title}</p>
          {p.body ? <p className="mt-1 text-sm text-stone-700">{p.body}</p> : null}
          <p className="mt-2 text-xs text-stone-500">{new Date(p.created_at).toLocaleString("pl-PL")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {p.link_url ? (
              <Link href={p.link_url} className="text-sm font-medium text-green-800 underline">
                Otwórz
              </Link>
            ) : null}
            {!p.is_read ? (
              <button
                type="button"
                disabled={laduje !== null}
                onClick={() => void oznacz(p.id)}
                className="text-sm text-stone-600 underline hover:text-stone-900 disabled:opacity-50"
              >
                {laduje === p.id ? "…" : "Oznacz jako przeczytane"}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
