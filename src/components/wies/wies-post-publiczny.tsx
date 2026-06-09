import Link from "next/link";
import { WyswietlTrescBogata } from "@/components/ui/tresc-bogata";
import { KomentarzeOgloszeniaKlient } from "@/components/wies/komentarze-ogloszenia-klient";
import type { KomentarzPublicznyWiersz } from "@/components/wies/komentarze-publiczne-klient";

export function WiesPostPubliczny({
  tytul,
  typ,
  utworzono,
  tresc,
  sciezkaWsi,
  nazwaWsi,
  postId,
  komentarze = [],
  zalogowany = false,
  sciezkaPowrotu,
}: {
  tytul: string;
  typ: string;
  utworzono: string;
  tresc: string | null;
  sciezkaWsi: string;
  nazwaWsi: string;
  postId?: string;
  komentarze?: KomentarzPublicznyWiersz[];
  zalogowany?: boolean;
  sciezkaPowrotu?: string;
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
        <div className="mt-8">
          <WyswietlTrescBogata tresc={tresc} className="text-stone-800" />
        </div>
      ) : (
        <p className="mt-8 text-sm text-stone-500">Brak treści tekstowej.</p>
      )}
      {postId && sciezkaPowrotu ? (
        <KomentarzeOgloszeniaKlient
          postId={postId}
          komentarze={komentarze}
          zalogowany={zalogowany}
          sciezkaPowrotu={sciezkaPowrotu}
        />
      ) : null}
    </article>
  );
}
