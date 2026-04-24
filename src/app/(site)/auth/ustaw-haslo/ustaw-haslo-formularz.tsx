"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

export function UstawHasloFormularz() {
  const router = useRouter();
  const [sesja, ustawSesje] = useState<"sprawdzanie" | "tak" | "nie">("sprawdzanie");
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");

  useEffect(() => {
    const supabase = utworzKlientaSupabasePrzegladarka();
    void supabase.auth.getUser().then(({ data }) => {
      ustawSesje(data.user ? "tak" : "nie");
    });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const haslo = String(fd.get("haslo") || "");
    const haslo2 = String(fd.get("haslo2") || "");
    ustawBlad("");
    if (haslo !== haslo2) {
      ustawBlad("Hasła muszą być takie same.");
      return;
    }
    if (haslo.length < 8) {
      ustawBlad("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }
    ustawLaduje(true);
    try {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const { error } = await supabase.auth.updateUser({ password: haslo });
      if (error) {
        ustawBlad(error.message);
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch {
      ustawBlad("Nie udało się zapisać hasła.");
    } finally {
      ustawLaduje(false);
    }
  }

  if (sesja === "sprawdzanie") {
    return (
      <p className="mt-8 text-center text-sm text-stone-600" role="status">
        Sprawdzanie sesji…
      </p>
    );
  }

  if (sesja === "nie") {
    return (
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p>Brak aktywnej sesji odzyskiwania hasła. Link mógł wygasnąć lub został już użyty.</p>
        <p className="mt-4">
          <Link href="/reset-hasla" className="font-medium text-green-900 underline">
            Poproś o nowy link
          </Link>
          {" · "}
          <Link href="/logowanie" className="text-green-900 underline">
            Logowanie
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      onSubmit={onSubmit}
    >
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <div>
        <label htmlFor="uh-haslo" className="mb-1 block text-sm font-medium text-stone-700">
          Nowe hasło
        </label>
        <input
          id="uh-haslo"
          name="haslo"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="uh-haslo2" className="mb-1 block text-sm font-medium text-stone-700">
          Powtórz hasło
        </label>
        <input
          id="uh-haslo2"
          name="haslo2"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={laduje}
        className="w-full rounded-lg bg-green-800 px-4 py-2.5 font-medium text-white transition hover:bg-green-900 disabled:opacity-60"
      >
        {laduje ? "Zapisywanie…" : "Zapisz nowe hasło"}
      </button>
    </form>
  );
}
