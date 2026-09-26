import { THAILAND_PROVINCES, INITIAL_STATIONS, INITIAL_DAMS } from '../data/mockStations';
import { FLOOD_COLOR_ZONES } from '../data/floodZones';
import { FLOODED_ROADS_DATA } from '../data/floodedRoads';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  zoom: number;
  category: 'subdistrict' | 'district' | 'province' | 'station' | 'dam' | 'zone' | 'place' | 'road';
  categoryLabel: string;
  color: string;
}

export async function searchLocations(query: string): Promise<SearchResultItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResultItem[] = [];

  // 1. Local Search: Flooded Roads
  FLOODED_ROADS_DATA.forEach(road => {
    if (
      road.name.toLowerCase().includes(q) ||
      (road.routeNumber && road.routeNumber.toLowerCase().includes(q)) ||
      road.province.toLowerCase().includes(q) ||
      road.district.toLowerCase().includes(q) ||
      (road.subdistrict && road.subdistrict.toLowerCase().includes(q))
    ) {
      const isCritical = road.status === 'critical';
      results.push({
        id: `road-${road.id}`,
        title: road.name,
        subtitle: `จ.${road.province} • ${road.waterDepth} (${road.passabilityText})`,
        lat: road.center[0],
        lng: road.center[1],
        zoom: 14,
        category: 'road',
        categoryLabel: isCritical ? '⛔ ถนนน้ำท่วม' : '🛣️ ทางน้ำขัง',
        color: isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      });
    }
  });

  // 2. Local Search: Stations
  INITIAL_STATIONS.forEach(st => {
    if (
      st.name.toLowerCase().includes(q) ||
      st.stationCode.toLowerCase().includes(q) ||
      st.district.toLowerCase().includes(q) ||
      st.province.toLowerCase().includes(q) ||
      st.river.toLowerCase().includes(q)
    ) {
      results.push({
        id: `st-${st.id}`,
        title: `${st.stationCode} - ${st.name}`,
        subtitle: `อ.${st.district} จ.${st.province} (${st.river})`,
        lat: st.lat,
        lng: st.lng,
        zoom: 13,
        category: 'station',
        categoryLabel: 'สถานีวัดน้ำ',
        color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
      });
    }
  });

  // 2. Local Search: Flood Zones
  FLOOD_COLOR_ZONES.forEach(zone => {
    if (
      zone.name.toLowerCase().includes(q) ||
      zone.province.toLowerCase().includes(q) ||
      zone.districts.some(d => d.toLowerCase().includes(q))
    ) {
      const isRed = zone.level === 'red';
      results.push({
        id: `zone-${zone.id}`,
        title: zone.name,
        subtitle: `จ.${zone.province} [${zone.districts.join(', ')}] • ${zone.warningHeadline}`,
        lat: zone.center[0],
        lng: zone.center[1],
        zoom: 12,
        category: 'zone',
        categoryLabel: isRed ? '🔴 โซนวิกฤต' : '🟠 โซนเตือนภัย',
        color: isRed ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      });
    }
  });

  // 3. Local Search: Dams
  INITIAL_DAMS.forEach(dam => {
    if (
      dam.name.toLowerCase().includes(q) ||
      dam.province.toLowerCase().includes(q) ||
      dam.river.toLowerCase().includes(q)
    ) {
      results.push({
        id: `dam-${dam.id}`,
        title: dam.name,
        subtitle: `จ.${dam.province} (${dam.river})`,
        lat: dam.lat,
        lng: dam.lng,
        zoom: 12,
        category: 'dam',
        categoryLabel: 'เขื่อนหลัก',
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
      });
    }
  });

  // 4. Local Search: Provinces
  THAILAND_PROVINCES.forEach(prov => {
    if (prov.name.toLowerCase().includes(q)) {
      results.push({
        id: `prov-${prov.name}`,
        title: `จังหวัด${prov.name}`,
        subtitle: 'ประเทศไทย',
        lat: prov.lat,
        lng: prov.lng,
        zoom: 10,
        category: 'province',
        categoryLabel: 'จังหวัด',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      });
    }
  });

  // 5. Live Online Search (OpenStreetMap Nominatim for all Subdistricts / Districts / Villages / Places)
  if (q.length >= 2) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=th&limit=8&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'th,en',
          'User-Agent': 'FasaiForecast-Geo/1.0 (https://fasaiforcast.com)'
        },
        signal: AbortSignal.timeout(3500)
      });
      if (res.ok) {
        const data = await res.json();
        (data || []).forEach((item: any) => {
          const lat = parseFloat(item.lat);
          const lng = parseFloat(item.lon);
          if (isNaN(lat) || isNaN(lng)) return;

          // Check if already in results (avoid exact lat/lng dupes)
          const isDupe = results.some(r => Math.abs(r.lat - lat) < 0.01 && Math.abs(r.lng - lng) < 0.01);
          if (isDupe) return;

          const addr = item.address || {};
          let category: SearchResultItem['category'] = 'place';
          let categoryLabel = 'สถานที่';
          let color = 'bg-slate-700/50 text-slate-300 border-slate-600';
          let zoom = 13;

          const displayName = item.display_name || '';

          if (displayName.includes('ตำบล') || addr.suburb || addr.village || addr.city_district) {
            category = 'subdistrict';
            categoryLabel = 'ตำบล/แขวง';
            color = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            zoom = 13;
          } else if (displayName.includes('อำเภอ') || displayName.includes('เขต') || addr.county) {
            category = 'district';
            categoryLabel = 'อำเภอ/เขต';
            color = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            zoom = 12;
          } else if (displayName.includes('จังหวัด') || addr.province || addr.state) {
            category = 'province';
            categoryLabel = 'จังหวัด';
            color = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            zoom = 10;
          }

          // Extract first part as title, remaining as subtitle
          const parts = displayName.split(',').map((p: string) => p.trim());
          const mainTitle = parts[0] || item.name;
          const subTitle = parts.slice(1, 4).join(', ');

          results.push({
            id: `nom-${item.place_id || Math.random()}`,
            title: mainTitle,
            subtitle: subTitle || 'ประเทศไทย',
            lat,
            lng,
            zoom,
            category,
            categoryLabel,
            color
          });
        });
      }
    } catch (err) {
      console.warn('Live geocoding error:', err);
    }
  }

  return results.slice(0, 12);
}
