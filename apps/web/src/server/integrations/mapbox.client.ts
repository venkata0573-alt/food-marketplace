import { CircuitOpenError, mapboxCircuit } from '@food-marketplace/resilience';

export interface MapboxFeature {
  placeName: string;
  latitude: number;
  longitude: number;
}

export interface MapboxGeocodeResult {
  ok: true;
  feature: MapboxFeature;
}

export interface MapboxDegradedResult {
  ok: false;
  degraded: true;
  message: string;
}

export type MapboxLookupResult = MapboxGeocodeResult | MapboxDegradedResult;

export async function geocodeCity(city: string): Promise<MapboxLookupResult> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return { ok: false, degraded: true, message: 'Map unavailable' };
  }

  try {
    const feature = await mapboxCircuit.execute(async () => {
      const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json`,
      );
      url.searchParams.set('access_token', token);
      url.searchParams.set('limit', '1');
      const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) {
        throw new Error(`mapbox ${response.status}`);
      }
      const data = (await response.json()) as {
        features?: { place_name?: string; center?: [number, number] }[];
      };
      const first = data.features?.[0];
      if (!first?.center) {
        throw new Error('mapbox empty');
      }
      return {
        placeName: first.place_name ?? city,
        latitude: first.center[1],
        longitude: first.center[0],
      };
    });
    return { ok: true, feature };
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      return { ok: false, degraded: true, message: 'Map temporarily unavailable' };
    }
    return { ok: false, degraded: true, message: 'Map unavailable' };
  }
}
