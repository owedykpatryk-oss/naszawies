import type { ReactNode } from "react";
import { PanelStronaModulu } from "@/components/panel/panel-strona-modulu";

type Props = {
  tytul: string;
  opis?: ReactNode;
  hrefPowrotu?: string;
  etykietaPowrotu?: string;
  akcje?: ReactNode;
  dzieci: ReactNode;
  hrefPomocy?: string;
  wariantNaglowka?: "domyslny" | "rynek";
};

export function PanelStronaMoje({
  hrefPowrotu = "/panel/moje",
  etykietaPowrotu = "← Moje",
  ...props
}: Props) {
  return (
    <PanelStronaModulu
      hrefPowrotu={hrefPowrotu}
      etykietaPowrotu={etykietaPowrotu}
      etykieta="Moje konto"
      {...props}
    />
  );
}
