import { unzip } from "fflate";

/** Wyciąga stops.txt i stop_times.txt z publicznego archiwum GTFS (np. mkuran.pl/gtfs/lublin.zip). */
export async function wczytajPlikiGtfsZZip(url: string): Promise<{ stopsText: string; stopTimesText: string }> {
  const res = await fetch(url.trim(), { signal: AbortSignal.timeout(180_000) });
  if (!res.ok) throw new Error(`GTFS ZIP HTTP ${res.status}`);

  const buf = new Uint8Array(await res.arrayBuffer());
  const pliki = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(buf, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const klucze = Object.keys(pliki);
  const stopsKey = klucze.find((k) => /(^|\/)stops\.txt$/i.test(k));
  const timesKey = klucze.find((k) => /(^|\/)stop_times\.txt$/i.test(k));
  if (!stopsKey || !timesKey) {
    throw new Error("GTFS ZIP: brak stops.txt lub stop_times.txt w archiwum.");
  }

  const dekoder = new TextDecoder("utf-8");
  return {
    stopsText: dekoder.decode(pliki[stopsKey]!),
    stopTimesText: dekoder.decode(pliki[timesKey]!),
  };
}
