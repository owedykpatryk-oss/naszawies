import { MojeObserwujWiesPrzycisk } from "@/components/panel/moje/moje-obserwuj-wies-przycisk";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type Props = {
  villageId: string;
  wies: { name: string; slug: string; voivodeship: string; county: string; commune: string };
};

export async function MojeObserwujWiesPasek({ villageId, wies }: Props) {
  const user = await pobierzUzytkownikaSerwer();
  const supabase = utworzKlientaSupabaseSerwer();
  let followId: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("user_id", user.id)
      .eq("village_id", villageId)
      .maybeSingle();
    followId = data?.id ?? null;
  }

  return (
    <MojeObserwujWiesPrzycisk
      villageId={villageId}
      nazwaWsi={wies.name}
      followId={followId}
      zalogowany={!!user}
      sciezkaPowrotu={sciezkaProfiluWsi(wies)}
    />
  );
}
