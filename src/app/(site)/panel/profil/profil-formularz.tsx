"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AwatarUpload } from "@/components/profil/awatar-upload";
import { aktualizujProfilZFormularza, type WynikAkcjiProfilu } from "./akcje";

type Poczatkowe = {
  user_id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  phone: string;
  phone_visible_public: boolean;
};

export function ProfilFormularz({ poczatkowe }: { poczatkowe: Poczatkowe }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [laduje, ustawLaduje] = useState(false);
  const [sukces, ustawSukces] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawSukces(false);
    ustawLaduje(true);
    try {
      const wynik: WynikAkcjiProfilu = await aktualizujProfilZFormularza(new FormData(e.currentTarget));
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawSukces(true);
      router.refresh();
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="max-w-xl space-y-10">
      <section>
        <AwatarUpload userId={poczatkowe.user_id} aktualnyUrl={poczatkowe.avatar_url || null} />
      </section>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-stone-700">
            Nazwa wyświetlana
          </label>
          <input
            id="display_name"
            name="display_name"
            required
            minLength={1}
            maxLength={80}
            defaultValue={poczatkowe.display_name}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
          />
          <p className="mt-1 text-xs text-stone-500">
            Widoczna na{" "}
            <Link href={`/u/${poczatkowe.user_id}`} className="text-green-800 underline">
              publicznym profilu
            </Link>{" "}
            (konto aktywne).
          </p>
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium text-stone-700">
            Krótki opis
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={500}
            defaultValue={poczatkowe.bio}
            placeholder="Opcjonalnie: kim jesteś we wsi, czym się zajmujesz…"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-stone-700">
            Telefon (opcjonalnie)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={poczatkowe.phone}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
          />
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
            <input
              id="phone_visible_public"
              name="phone_visible_public"
              type="checkbox"
              value="true"
              defaultChecked={poczatkowe.phone_visible_public}
              className="mt-1 h-4 w-4 shrink-0 rounded border-stone-300 text-green-800 focus:ring-green-800"
            />
            <label htmlFor="phone_visible_public" className="text-sm leading-snug text-stone-700">
              <strong>Zgoda (RODO)</strong> — wyświetlaj mój numer telefonu na publicznym profilu{" "}
              <code className="rounded bg-white px-1 text-xs">/u/…</code>. Bez zaznaczenia numer nie jest widoczny
              publicznie.
            </label>
          </div>
        </div>

        {blad ? (
          <p className="text-sm text-red-800" role="alert">
            {blad}
          </p>
        ) : null}
        {sukces ? (
          <p className="text-sm text-green-900" role="status">
            Zapisano profil.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={laduje}
          className="rounded-lg bg-green-800 px-5 py-2.5 font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          {laduje ? "Zapisuję…" : "Zapisz profil"}
        </button>
      </form>
    </div>
  );
}
