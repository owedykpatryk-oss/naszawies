import Link from "next/link";

type Props = {
  idPrefix?: string;
  wymagane?: boolean;
};

/** Checkboxy regulamin + polityka + wiek 16 lat (rejestracja / akceptacja OAuth). */
export function PolaZgodyRejestracji({ idPrefix = "zgoda", wymagane = true }: Props) {
  const req = wymagane ? { required: true } : {};

  return (
    <fieldset className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
      <legend className="px-1 text-sm font-medium text-stone-800">Zgody wymagane do założenia konta</legend>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
        <input
          type="checkbox"
          id={`${idPrefix}-regulamin`}
          name="zgoda_regulamin"
          value="1"
          className="mt-1 h-4 w-4 shrink-0 accent-green-800"
          {...req}
        />
        <span>
          Akceptuję{" "}
          <Link href="/regulamin" className="font-semibold text-green-800 underline" target="_blank" rel="noopener noreferrer">
            Regulamin
          </Link>{" "}
          platformy naszawies.pl.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
        <input
          type="checkbox"
          id={`${idPrefix}-polityka`}
          name="zgoda_polityka"
          value="1"
          className="mt-1 h-4 w-4 shrink-0 accent-green-800"
          {...req}
        />
        <span>
          Zapoznałem(-am) się z{" "}
          <Link
            href="/polityka-prywatnosci"
            className="font-semibold text-green-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Polityką prywatności
          </Link>{" "}
          i wyrażam zgodę na przetwarzanie danych w celu prowadzenia konta oraz świadczenia usług serwisu.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-800">
        <input
          type="checkbox"
          id={`${idPrefix}-wiek`}
          name="zgoda_wiek_16"
          value="1"
          className="mt-1 h-4 w-4 shrink-0 accent-green-800"
          {...req}
        />
        <span>
          Oświadczam, że mam ukończone <strong>16 lat</strong> (zgodnie z regulaminem) i podaję prawdziwe dane.
        </span>
      </label>
    </fieldset>
  );
}

export function czyZaznaczoneZgodyRejestracji(fd: FormData): boolean {
  return (
    fd.get("zgoda_regulamin") === "1" &&
    fd.get("zgoda_polityka") === "1" &&
    fd.get("zgoda_wiek_16") === "1"
  );
}
