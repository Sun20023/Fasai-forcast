/**
 * Road Snapping Service
 * 
 * Uses OSRM (Open Source Routing Machine) free public API to snap
 * rough coordinate waypoints onto actual road geometry.
 * Results are cached in localStorage so the API is only called once per road.
 * 
 * This makes flooded road polylines follow the real road path on the map
 * instead of drawing straight lines between waypoints.
 */

const OSRM_BASE = 'https://router.project-osrm.org';
const CACHE_KEY = 'fasai_road_snap_cache_v2';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface RoadSnapCache {
  [roadId: string]: {
    coordinates: [number, number][];
    timestamp: number;
  };
}

function loadCache(): RoadSnapCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCache(cache: RoadSnapCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full — evict oldest entries
    try {
      const entries = Object.entries(cache);
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const trimmed: RoadSnapCache = {};
      // Keep only newest half
      entries.slice(Math.floor(entries.length / 2)).forEach(([k, v]) => {
        trimmed[k] = v;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }
}

/**
 * Decode an encoded polyline string (Google format used by OSRM) into coordinates.
 * Returns array of [lat, lng] pairs.
 */
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coords.push([lat / 1e5, lng / 1e5]);
  }

  return coords;
}

/**
 * Snap a set of rough waypoints to the actual road geometry using OSRM Route API.
 * 
 * @param roadId - Unique road identifier (for caching)
 * @param waypoints - Array of [lat, lng] rough waypoints along the road
 * @returns Array of [lat, lng] coordinates that follow the actual road path
 */
export async function snapToRoad(
  roadId: string,
  waypoints: [number, number][]
): Promise<[number, number][]> {
  if (!waypoints || waypoints.length < 2) return waypoints;

  // 1. Check cache first
  const cache = loadCache();
  const cached = cache[roadId];
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS && cached.coordinates.length > 0) {
    return cached.coordinates;
  }

  // 2. Call OSRM Route API
  try {
    // OSRM expects coordinates as lng,lat (reverse of [lat,lng])
    const coordString = waypoints
      .map(([lat, lng]) => `${lng},${lat}`)
      .join(';');

    const url = `${OSRM_BASE}/route/v1/driving/${coordString}?overview=full&geometries=polyline`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: {
        'User-Agent': 'FasaiForecast/1.0'
      }
    });

    if (!res.ok) {
      console.warn(`OSRM route failed for ${roadId}: ${res.status}`);
      return waypoints;
    }

    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn(`OSRM no route for ${roadId}:`, data.code);
      return waypoints;
    }

    const geometry = data.routes[0].geometry;
    const snappedCoords = decodePolyline(geometry);

    if (snappedCoords.length < 2) {
      return waypoints;
    }

    // 3. Save to cache
    cache[roadId] = {
      coordinates: snappedCoords,
      timestamp: Date.now()
    };
    saveCache(cache);

    return snappedCoords;
  } catch (err) {
    console.warn(`Road snap failed for ${roadId}:`, err);
    return waypoints;
  }
}

/**
 * Batch-snap multiple roads. Uses Promise.allSettled to avoid one failure
 * blocking all others. Processes in small batches to respect OSRM rate limits.
 */
export async function batchSnapRoads(
  roads: { id: string; coordinates: [number, number][] }[]
): Promise<Map<string, [number, number][]>> {
  const result = new Map<string, [number, number][]>();
  const cache = loadCache();

  // Separate cached vs uncached
  const needsFetch: typeof roads = [];

  for (const road of roads) {
    const cached = cache[road.id];
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS && cached.coordinates.length > 0) {
      result.set(road.id, cached.coordinates);
    } else {
      needsFetch.push(road);
    }
  }

  // Process uncached in batches of 5 with 200ms delay between batches
  const BATCH_SIZE = 5;
  for (let i = 0; i < needsFetch.length; i += BATCH_SIZE) {
    const batch = needsFetch.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (road) => {
      const snapped = await snapToRoad(road.id, road.coordinates);
      result.set(road.id, snapped);
    });

    await Promise.allSettled(promises);

    // Rate limit: wait 200ms between batches
    if (i + BATCH_SIZE < needsFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return result;
}

/**
 * Clear the road snap cache (useful for forcing re-fetch)
 */
export function clearRoadSnapCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
