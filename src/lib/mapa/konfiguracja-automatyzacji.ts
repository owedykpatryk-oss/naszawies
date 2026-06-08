/** Czy cron / ręczny sync może tworzyć POI „przystanek” z współrzędnych GTFS. */
export function autoTworzPoiPrzystankowZGtfs(): boolean {
  return String(process.env.TRANSPORT_AUTO_CREATE_STOP_POI ?? "1") !== "0";
}

/** Czy sync PKP może tworzyć POI „stacja_kolejowa” (słownik PKP + współrzędne OSM). */
export function autoTworzPoiStacjiZKpk(): boolean {
  return (
    transportKolejWlaczony() && String(process.env.TRANSPORT_AUTO_CREATE_RAIL_POI ?? "1") !== "0"
  );
}

export function transportKolejWlaczony(): boolean {
  return (
    String(process.env.TRANSPORT_SYNC_ENABLED ?? "0") === "1" &&
    !!process.env.PKP_PLK_API_KEY?.trim()
  );
}

export function transportAutobusWlaczony(): boolean {
  return String(process.env.TRANSPORT_BUS_SYNC_ENABLED ?? "0") === "1";
}

export function transportAutobusSkonfigurowany(): boolean {
  if (!transportAutobusWlaczony()) return false;
  const gtfs =
    !!process.env.TRANSPORT_GTFS_ZIP_URL?.trim() ||
    (!!process.env.TRANSPORT_GTFS_STOPS_URL?.trim() &&
      !!process.env.TRANSPORT_GTFS_STOP_TIMES_URL?.trim());
  const ep =
    String(process.env.TRANSPORT_EPODROZNIK_ENABLED ?? "0") === "1" &&
    !!process.env.EPODROZNIK_API_KEY?.trim();
  return gtfs || ep;
}
