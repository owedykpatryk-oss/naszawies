import { MojeObserwujGminePrzycisk } from "@/components/panel/moje/moje-obserwuj-gmine-przycisk";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaGminy } from "@/lib/wies/sciezka-publiczna";

type Props = {
  wojewodztwo: string;
  powiat: string;
  gmina: string;
};

export async function MojeObserwujGminePasek({ wojewodztwo, powiat, gmina }: Props) {
  const user = await pobierzUzytkownikaSerwer();
  const supabase = utworzKlientaSupabaseSerwer();
  let followId: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("user_commune_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("voivodeship", wojewodztwo)
      .eq("county", powiat)
      .eq("commune", gmina)
      .maybeSingle();
    followId = data?.id ?? null;
  }

  return (
    <MojeObserwujGminePrzycisk
      wojewodztwo={wojewodztwo}
      powiat={powiat}
      gmina={gmina}
      followId={followId}
      zalogowany={!!user}
      sciezkaPowrotu={sciezkaGminy({ voivodeship: wojewodztwo, county: powiat, commune: gmina })}
    />
  );
}
