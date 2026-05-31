import type { ReactNode } from "react";
import { PanelStronaModulu } from "@/components/panel/panel-strona-modulu";

type Props = {
  tytul: string;
  opis?: ReactNode;
  hrefPowrotu?: string;
  etykietaPowrotu?: string;
  akcje?: ReactNode;
  dzieci: ReactNode;
  szeroki?: boolean;
  etykieta?: string;
  hrefPomocy?: string;
  wariantNaglowka?: "domyslny" | "rynek";
  odstepTresci?: "sm" | "md" | "lg";
};

export function PanelStronaMieszkaneca({
  hrefPowrotu = "/panel/mieszkaniec",
  etykietaPowrotu = "← Panel mieszkańca",
  etykieta = "Mieszkaniec",
  ...props
}: Props) {
  return (
    <PanelStronaModulu
      hrefPowrotu={hrefPowrotu}
      etykietaPowrotu={etykietaPowrotu}
      etykieta={etykieta}
      {...props}
    />
  );
}
