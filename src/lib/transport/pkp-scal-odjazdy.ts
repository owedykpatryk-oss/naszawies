import type { PkpDeparture } from "@/lib/transport/pkp-plk-api";

function kluczOdjazdu(d: PkpDeparture): string {
  const plan = d.plannedWhenIso.slice(0, 16);
  const train = d.trainLabel.trim().toLowerCase();
  const dest = (d.destination ?? "").trim().toLowerCase();
  return `${train}|${plan}|${dest}`;
}

/** Łączy plan rozkładu z danymi operacyjnymi (opóźnienia, odwołania). */
export function scalOdjazdyPkpPlanIRzeczywistosc(
  planowane: PkpDeparture[],
  operacyjne: PkpDeparture[],
): PkpDeparture[] {
  if (operacyjne.length === 0) return planowane;
  if (planowane.length === 0) return operacyjne;

  const mapaOp = new Map<string, PkpDeparture>();
  for (const o of operacyjne) {
    mapaOp.set(kluczOdjazdu(o), o);
  }

  const scalone: PkpDeparture[] = [];
  const uzyteOp = new Set<string>();

  for (const p of planowane) {
    const k = kluczOdjazdu(p);
    const op = mapaOp.get(k);
    if (op) {
      uzyteOp.add(k);
      scalone.push({
        ...p,
        whenIso: op.whenIso,
        realtimeWhenIso: op.realtimeWhenIso,
        delayMinutes: op.delayMinutes ?? p.delayMinutes,
        isCancelled: op.isCancelled || p.isCancelled,
        status: op.status ?? p.status,
        platform: op.platform ?? p.platform,
        sourceUpdatedAtIso: op.sourceUpdatedAtIso ?? p.sourceUpdatedAtIso,
      });
    } else {
      scalone.push(p);
    }
  }

  for (const o of operacyjne) {
    const k = kluczOdjazdu(o);
    if (!uzyteOp.has(k)) scalone.push(o);
  }

  return scalone
    .filter((d) => Date.parse(d.plannedWhenIso) >= Date.now() - 10 * 60 * 1000)
    .sort((a, b) => Date.parse(a.whenIso) - Date.parse(b.whenIso))
    .slice(0, 32);
}
