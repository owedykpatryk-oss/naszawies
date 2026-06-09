import { FotokronikaGaleriaKlient } from "@/components/wies/fotokronika-galeria-klient";
import type { AlbumPublicznyFotokroniki, ZdjeciePubliczne } from "@/lib/fotokronika/pobierz-fotokronike-publiczna";

type Props = {
  zdjecia: ZdjeciePubliczne[];
  albumy?: AlbumPublicznyFotokroniki[];
  nazwaWsi: string;
  pokazLinkDodaj?: boolean;
  pokazPusta?: boolean;
};

export function FotokronikaPublicznaWsi({
  zdjecia,
  albumy = [],
  nazwaWsi,
  pokazLinkDodaj = true,
  pokazPusta = false,
}: Props) {
  if (zdjecia.length === 0 && !pokazPusta) return null;

  return (
    <FotokronikaGaleriaKlient
      zdjecia={zdjecia}
      albumy={albumy}
      nazwaWsi={nazwaWsi}
      pokazLinkDodaj={pokazLinkDodaj}
      pusta={zdjecia.length === 0}
    />
  );
}
