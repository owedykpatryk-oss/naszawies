import Link from "next/link";

export function WiesPostPubliczny({
  tytul,
  typ,
  utworzono,
  tresc,
  sciezkaWsi,
  nazwaWsi,
}: {
  tytul: string;
  typ: string;
  utworzono: string;
  tresc: string | null;
  sciezkaWsi: string;
  nazwaWsi: string;
}) {
  return (
    <article>
      <p className="mb-4 text-sm text-stone-500">
        <Link href={sciezkaWsi} className="text-green-800 underline">
          ← {nazwaWsi}
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">{tytul}</h1>
      <p className="mt-2 text-sm text-stone-500">
        {typ} · {new Date(utworzono).toLocaleString("pl-PL")}
      </p>
      {tresc ? (
        <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{tresc}</div>
      ) : (
        <p className="mt-8 text-sm text-stone-500">Brak treści tekstowej.</p>
      )}
    </article>
  );
}
