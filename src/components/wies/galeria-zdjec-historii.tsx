import { GaleriaZdjecHistoriiKlient } from "@/components/wies/galeria-zdjec-historii-klient";

type Props = {
  urls: string[];
  tytul?: string;
  kompakt?: boolean;
};

/** Galeria zdjęć wpisu historii — z lightboxem. */
export function GaleriaZdjecHistorii({ urls, tytul, kompakt = false }: Props) {
  return <GaleriaZdjecHistoriiKlient urls={urls} tytul={tytul} kompakt={kompakt} />;
}
