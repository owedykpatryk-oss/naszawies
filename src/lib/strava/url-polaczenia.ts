export function urlPolaczeniaStrava(villageId: string, returnTo: string): string {
  const params = new URLSearchParams({
    villageId,
    returnTo,
  });
  return `/api/strava/connect?${params.toString()}`;
}
