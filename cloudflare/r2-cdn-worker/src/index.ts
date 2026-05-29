/**
 * Cloudflare Worker — publiczny CDN dla bucketów R2.
 * Ścieżka: https://cdn.naszawies.pl/{bucket}/{klucz}
 *
 * Deploy: npm run r2:deploy-worker (wymaga wrangler + CLOUDFLARE_API_TOKEN)
 */

export interface Env {
  R2_avatars: R2Bucket;
  R2_hall_inventory: R2Bucket;
  R2_hall_booking_damage: R2Bucket;
  R2_hall_rules: R2Bucket;
  R2_marketplace: R2Bucket;
  R2_village_photos: R2Bucket;
}

const MAPA_BUCKETOW: Record<string, keyof Env> = {
  avatars: "R2_avatars",
  "hall-inventory": "R2_hall_inventory",
  "hall-booking-damage": "R2_hall_booking_damage",
  "hall-rules": "R2_hall_rules",
  marketplace: "R2_marketplace",
  "village-photos": "R2_village_photos",
};

const CACHE_PUBLIC = "public, max-age=31536000, immutable";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/cdn-cgi/")) {
      return fetch(request);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405 });
    }

    const segmenty = url.pathname.split("/").filter(Boolean);
    if (segmenty.length < 2) {
      return new Response("Not found", { status: 404 });
    }

    const [bucket, ...reszta] = segmenty;
    const binding = MAPA_BUCKETOW[bucket];
    if (!binding) {
      return new Response("Unknown bucket", { status: 404 });
    }

    const klucz = decodeURIComponent(reszta.join("/"));
    const obiekt = await env[binding].get(klucz);
    if (!obiekt) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    obiekt.writeHttpMetadata(headers);
    headers.set("Cache-Control", CACHE_PUBLIC);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Content-Type-Options", "nosniff");

    if (request.method === "HEAD") {
      return new Response(null, { headers });
    }

    return new Response(obiekt.body, { headers });
  },
};
