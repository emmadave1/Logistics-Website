export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

const CACHE_KEY = 'movemate_geocode_cache';

type Cache = Record<string, GeoPoint | null>;

function readCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota errors */
  }
}

/** Basic sanity validation for coordinates. */
export function isValidGeoPoint(p: GeoPoint | null | undefined): p is GeoPoint {
  return (
    !!p &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180 &&
    !(p.lat === 0 && p.lng === 0)
  );
}

/**
 * Geocode a "City, Country" string using the free OpenStreetMap Nominatim API.
 * Successful results are cached in localStorage so the map loads instantly next time.
 */
export async function geocodePlace(query: string): Promise<GeoPoint | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;

  const cache = readCache();
  const cached = cache[key];
  if (isValidGeoPoint(cached)) return cached;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
    const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = results[0];
    const point: GeoPoint | null = first
      ? { lat: parseFloat(first.lat), lng: parseFloat(first.lon), label: first.display_name }
      : null;

    if (!isValidGeoPoint(point)) return null;

    cache[key] = point;
    writeCache(cache);
    return point;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Geocode with automatic retry and exponential backoff (500ms, 1s, 2s, …).
 * `onAttempt` reports the attempt number (1-based) so the UI can show progress.
 */
export async function geocodePlaceWithRetry(
  query: string,
  attempts = 3,
  baseDelay = 500,
  onAttempt?: (attempt: number) => void
): Promise<GeoPoint | null> {
  for (let i = 0; i < attempts; i++) {
    onAttempt?.(i + 1);
    const point = await geocodePlace(query);
    if (isValidGeoPoint(point)) return point;
    if (i < attempts - 1) await sleep(baseDelay * 2 ** i);
  }
  return null;
}


/** Clear the geocoding cache. Pass a specific query to clear only that key, or omit to clear all. */
export function clearGeocodeCache(query?: string): void {
  if (!query) {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  const key = query.trim().toLowerCase();
  const cache = readCache();
  if (key in cache) {
    delete cache[key];
    writeCache(cache);
  }
}


/** Great-circle interpolation between two points (t = 0..1). */
export function interpolate(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lat1 = toRad(a.lat);
  const lon1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const lon2 = toRad(b.lng);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
      )
    );

  if (d === 0 || Number.isNaN(d)) return { lat: a.lat, lng: a.lng };

  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
  const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  return {
    lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lng: toDeg(Math.atan2(y, x)),
  };
}

/** Build a smooth great-circle path of `steps` points. */
export function buildArc(a: GeoPoint, b: GeoPoint, steps = 128): GeoPoint[] {
  return Array.from({ length: steps + 1 }, (_, i) => interpolate(a, b, i / steps));
}
