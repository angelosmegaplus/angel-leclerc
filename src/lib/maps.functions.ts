import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MapsPlace = {
  address: string;
  lat: number;
  lng: number;
  mapUrl: string;
  directionsUrl: string;
  distanceFromBaseKm: number | null;
};

/** Base de référence : Sarlat-la-Canéda (zone d'intervention locale). */
const BASE = { lat: 44.8896, lng: 1.2166 };

function haversineKm(lat: number, lng: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat - BASE.lat);
  const dLng = toRad(lng - BASE.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(BASE.lat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(a)) * 10) / 10;
}

export const lookupAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query: string }) => {
    const query = (input.query ?? "").trim();
    if (query.length < 3) throw new Error("Saisis une adresse ou un lieu.");
    return { query: query.slice(0, 200) };
  })
  .handler(async ({ data }): Promise<MapsPlace[]> => {
    const { gatewayConfigured, gatewayRequest } = await import("./connectors/lovable-gateway.server");
    if (!gatewayConfigured("google_maps")) throw new Error("Connecteur Google Maps non relié à ce projet.");

    const geo = await gatewayRequest("google_maps", "/maps/api/geocode/json", {
      query: { address: data.query, region: "fr", language: "fr" },
    });

    if (geo?.status && geo.status !== "OK" && geo.status !== "ZERO_RESULTS") {
      throw new Error(`Recherche d’adresse refusée (${geo.status}).`);
    }

    const results = (geo?.results ?? []) as any[];
    return results.slice(0, 5).map((result) => {
      const lat = Number(result?.geometry?.location?.lat);
      const lng = Number(result?.geometry?.location?.lng);
      const address = String(result?.formatted_address ?? data.query);
      return {
        address,
        lat,
        lng,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${BASE.lat},${BASE.lng}&destination=${encodeURIComponent(address)}`,
        distanceFromBaseKm: Number.isFinite(lat) && Number.isFinite(lng) ? haversineKm(lat, lng) : null,
      } satisfies MapsPlace;
    });
  });
