import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  MapPin, 
  Compass, 
  ZoomIn, 
  ZoomOut,
  ShieldAlert,
  Sparkles,
  X
} from 'lucide-react';
import { WaterStation, DamInfo, RadarData, FloodAlert, FloodZone, FloodedRoad, AiSafeRouteOption } from '../types/flood';
import { buildSingleRoadDetourUrls } from '../services/aiFloodRouter';
import { FeatureViewMode, FeatureModeSwitcher } from './FeatureModeSwitcher';

// Fix Leaflet default marker icon asset paths safeguard
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// All 100% Free Public Map Providers (ZERO API Key Required, No Watermarks)
const BASE_MAP_URLS = {
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    maxNativeZoom: 19
  },
  topo: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    maxNativeZoom: 18
  },
  street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    maxNativeZoom: 18
  },
  dark: {
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    maxNativeZoom: 16
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    maxNativeZoom: 18
  }
};

type BaseMapKey = keyof typeof BASE_MAP_URLS;

interface FloodMapProps {
  stations: WaterStation[];
  dams: DamInfo[];
  alerts: FloodAlert[];
  floodZones: FloodZone[];
  floodedRoads?: FloodedRoad[];
  roadLastUpdated?: string;
  onRefreshRoads?: () => void;
  activeAiRoute?: AiSafeRouteOption | null;
  onClearAiRoute?: () => void;
  onOpenAiRoutePlanner?: () => void;
  activeZoneFilter: 'all' | 'red' | 'orange' | 'yellow' | 'green';
  onSelectZone: (zone: FloodZone) => void;
  radarData: RadarData | null;
  currentRadarFrameIndex: number;
  isRadarVisible: boolean;
  radarOpacity: number;
  selectedStation: WaterStation | null;
  onSelectStation: (station: WaterStation) => void;
  onSelectDam: (dam: DamInfo) => void;
  onMapClickCoordinates: (coords: { lat: number; lng: number }) => void;
  centerCoords: { lat: number; lng: number; zoom?: number } | null;
  tempPinCoords: { lat: number; lng: number } | null;
  featureMode?: FeatureViewMode;
  onSelectFeatureMode?: (mode: FeatureViewMode) => void;
}

export const FloodMap: React.FC<FloodMapProps> = ({
  stations,
  dams,
  alerts,
  floodZones,
  floodedRoads = [],
  roadLastUpdated,
  onRefreshRoads,
  activeAiRoute,
  onClearAiRoute,
  onOpenAiRoutePlanner,
  activeZoneFilter,
  onSelectZone,
  radarData,
  currentRadarFrameIndex,
  isRadarVisible,
  radarOpacity,
  selectedStation,
  onSelectStation,
  onSelectDam,
  onMapClickCoordinates,
  centerCoords,
  tempPinCoords,
  featureMode,
  onSelectFeatureMode
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const radarTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const aiRouteLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tempPinMarkerRef = useRef<L.Marker | null>(null);

  // Default to 100% Free OpenStreetMap
  const [baseMapType, setBaseMapType] = useState<BaseMapKey>('osm');
  const [showStations, setShowStations] = useState(true);
  const [showDams, setShowDams] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showFloodedRoads, setShowFloodedRoads] = useState(true);
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // Sync individual layer visibility when featureMode switches
  useEffect(() => {
    if (!featureMode) return;
    if (featureMode === 'roads') {
      setShowFloodedRoads(true);
      setShowStations(false);
      setShowDams(false);
      setShowRiskZones(false);
    } else if (featureMode === 'radar') {
      setShowFloodedRoads(false);
      setShowStations(false);
      setShowDams(false);
      setShowRiskZones(false);
    } else if (featureMode === 'stations') {
      setShowFloodedRoads(false);
      setShowStations(true);
      setShowDams(true);
      setShowRiskZones(false);
    } else if (featureMode === 'zones') {
      setShowFloodedRoads(false);
      setShowStations(false);
      setShowDams(false);
      setShowRiskZones(true);
    } else if (featureMode === 'all') {
      setShowFloodedRoads(true);
      setShowStations(true);
      setShowDams(true);
      setShowRiskZones(true);
    }
  }, [featureMode]);

  // 1. Initialize Map Safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up container if already initialized
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Center on Thailand (lat: 14.8, lng: 100.8)
    const map = L.map(mapContainerRef.current, {
      center: [14.8, 100.8],
      zoom: 6,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Default to OpenStreetMap
    const config = BASE_MAP_URLS.osm;
    const initialTile = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom
    }).addTo(map);
    baseTileLayerRef.current = initialTile;

    // Markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    // AI Safe Route layer group
    const aiRouteGroup = L.layerGroup().addTo(map);
    aiRouteLayerGroupRef.current = aiRouteGroup;

    // Map Click Listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    // CRITICAL: Force map to calculate container dimensions
    map.invalidateSize();
    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    // ResizeObserver to ensure map always expands if layout changes
    let ro: ResizeObserver | null = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      ro = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      ro.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleWindowResize);
      if (ro) {
        ro.disconnect();
      }
      map.remove();
      mapInstanceRef.current = null;
      baseTileLayerRef.current = null;
      radarTileLayerRef.current = null;
      markersLayerGroupRef.current = null;
    };
  }, []);

  // 2. Update Base Layer when baseMapType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (baseTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }

    const config = BASE_MAP_URLS[baseMapType];
    const newLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      maxNativeZoom: config.maxNativeZoom
    }).addTo(mapInstanceRef.current);

    baseTileLayerRef.current = newLayer;

    // Bring radar layer to front if active
    if (radarTileLayerRef.current) {
      radarTileLayerRef.current.bringToFront();
    }
  }, [baseMapType]);

  // 3. Update Radar Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (radarTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(radarTileLayerRef.current);
      radarTileLayerRef.current = null;
    }

    if (!isRadarVisible || !radarData || !radarData.past || radarData.past.length === 0) {
      return;
    }

    const allFrames = [...radarData.past, ...(radarData.nowcast || [])];
    const frame = allFrames[currentRadarFrameIndex];
    if (!frame) return;

    // Use 256px tiles with maxNativeZoom: 7 to completely eliminate 'Zoom level not supported'
    const radarUrl = `${radarData.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    const radarLayer = L.tileLayer(radarUrl, {
      opacity: radarOpacity,
      zIndex: 400,
      tileSize: 256,
      minZoom: 1,
      maxNativeZoom: 7, // RainViewer free tier capped at zoom level 7
      maxZoom: 19       // Leaflet will smoothly upscale zoom 7 tiles for zoom 8-19 without requesting from server
    }).addTo(mapInstanceRef.current);

    radarTileLayerRef.current = radarLayer;
  }, [radarData, currentRadarFrameIndex, isRadarVisible, radarOpacity]);

  // 4. Center on change
  useEffect(() => {
    if (!mapInstanceRef.current || !centerCoords) return;
    mapInstanceRef.current.flyTo(
      [centerCoords.lat, centerCoords.lng],
      centerCoords.zoom || 11,
      { duration: 1.2 }
    );
  }, [centerCoords]);

  // 5. Temporary Click Pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tempPinMarkerRef.current) {
      mapInstanceRef.current.removeLayer(tempPinMarkerRef.current);
      tempPinMarkerRef.current = null;
    }

    if (tempPinCoords) {
      const pinIcon = L.divIcon({
        className: 'custom-temp-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center animate-ping absolute"></div>
            <div class="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      const marker = L.marker([tempPinCoords.lat, tempPinCoords.lng], { icon: pinIcon })
        .addTo(mapInstanceRef.current);
      tempPinMarkerRef.current = marker;
    }
  }, [tempPinCoords]);

  // 5.5 Render Active AI Safe Route Polyline & Waypoints
  useEffect(() => {
    if (!mapInstanceRef.current || !aiRouteLayerGroupRef.current) return;
    const group = aiRouteLayerGroupRef.current;
    group.clearLayers();

    if (!activeAiRoute || !activeAiRoute.coordinates || activeAiRoute.coordinates.length < 2) return;

    const isSafe = activeAiRoute.isSafe;

    // 1. Outer Neon Glow Line
    const glowPolyline = L.polyline(activeAiRoute.coordinates, {
      color: isSafe ? '#06b6d4' : '#ef4444',
      weight: 12,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    });

    // 2. Core Animated Route Line
    const corePolyline = L.polyline(activeAiRoute.coordinates, {
      color: isSafe ? '#10b981' : '#f87171',
      weight: 6,
      opacity: 0.95,
      dashArray: '8, 6',
      lineCap: 'round',
      lineJoin: 'round'
    });

    corePolyline.bindTooltip(`
      <div class="font-bold text-xs ${isSafe ? 'text-emerald-400' : 'text-rose-400'}">
        ${activeAiRoute.title}
      </div>
      <div class="text-[11px] text-slate-300">ระยะทาง ${activeAiRoute.distanceKm} กม. • ~${activeAiRoute.estimatedTimeMin} นาที</div>
    `, { sticky: true, opacity: 0.95 });

    group.addLayer(glowPolyline);
    group.addLayer(corePolyline);

    // Start & Destination Markers
    const startCoord = activeAiRoute.coordinates[0];
    const endCoord = activeAiRoute.coordinates[activeAiRoute.coordinates.length - 1];

    const startIcon = L.divIcon({
      className: 'ai-route-start-pin',
      html: `
        <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] shadow-2xl border-2 border-emerald-300 whitespace-nowrap">
          <span>🟢 จุดเริ่มต้น</span>
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 12]
    });
    const startMarker = L.marker(startCoord, { icon: startIcon });
    group.addLayer(startMarker);

    const endIcon = L.divIcon({
      className: 'ai-route-end-pin',
      html: `
        <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-600 text-white font-bold text-[10px] shadow-2xl border-2 border-cyan-300 whitespace-nowrap pulse-critical">
          <span>🏁 ปลายทาง</span>
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 12]
    });
    const endMarker = L.marker(endCoord, { icon: endIcon });
    group.addLayer(endMarker);

    // Auto fit bounds with gentle animation
    const bounds = L.latLngBounds(activeAiRoute.coordinates);
    mapInstanceRef.current.fitBounds(bounds, { padding: [70, 70], maxZoom: 13 });

  }, [activeAiRoute]);

  // 6. Render Color Zones, Stations, and Dams
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;
    const group = markersLayerGroupRef.current;
    group.clearLayers();

    // 6.1 Multi-Color Flood Risk Zones (Red / Orange / Yellow / Green)
    if (showRiskZones && floodZones) {
      const filteredZones = activeZoneFilter === 'all' 
        ? floodZones 
        : floodZones.filter(z => z.level === activeZoneFilter);

      filteredZones.forEach((zone) => {
        const isRed = zone.level === 'red';
        const isOrange = zone.level === 'orange';
        const isYellow = zone.level === 'yellow';

        const color = isRed ? '#ef4444' : isOrange ? '#f97316' : isYellow ? '#eab308' : '#10b981';
        const strokeColor = isRed ? '#b91c1c' : isOrange ? '#c2410c' : isYellow ? '#a16207' : '#047857';
        const fillOpacity = isRed ? 0.35 : isOrange ? 0.28 : isYellow ? 0.20 : 0.15;

        // Polygon boundary
        const polygon = L.polygon(zone.coordinates, {
          color: strokeColor,
          fillColor: color,
          fillOpacity,
          weight: isRed ? 2.5 : 2,
          dashArray: isRed || isYellow ? '6, 6' : undefined
        });

        // Tooltip on hover
        polygon.bindTooltip(`
          <div class="font-bold text-xs ${isRed ? 'text-red-400' : isOrange ? 'text-orange-400' : isYellow ? 'text-yellow-300' : 'text-emerald-400'}">
            ${isRed ? '🔴 โซนวิกฤต:' : isOrange ? '🟠 โซนเตือนภัย:' : isYellow ? '🟡 โซนเฝ้าระวัง:' : '🟢 โซนปกติ:'} ${zone.name}
          </div>
          <div class="text-[11px] text-slate-300">${zone.riskType} ${zone.waterDepth ? `• ${zone.waterDepth}` : ''}</div>
        `, { sticky: true, opacity: 0.95 });

        // Popup on click
        const popupHtml = `
          <div class="p-2.5 min-w-[260px]">
            <div class="flex items-center gap-1.5 mb-1.5">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isRed ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                isOrange ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                isYellow ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }">
                ${isRed ? '🔴 ระดับวิกฤตล้นตลิ่ง' : isOrange ? '🟠 ระดับเตือนภัย' : isYellow ? '🟡 ระดับเฝ้าระวัง' : '🟢 ระดับปกติ'}
              </span>
              <span class="text-xs font-semibold text-slate-300">จ.${zone.province}</span>
            </div>
            
            <h4 class="font-bold text-sm text-white mb-1 leading-snug">${zone.name}</h4>
            <p class="text-[11px] text-slate-300 mb-2 leading-relaxed">${zone.statusDescription}</p>

            <div class="bg-slate-800/80 p-2 rounded-xl text-[11px] space-y-1 mb-2.5 border border-slate-700/60">
              ${zone.waterDepth ? `<div class="flex justify-between"><span class="text-slate-400">ระดับน้ำ:</span><strong class="${isRed ? 'text-red-400 font-bold' : 'text-white'}">${zone.waterDepth}</strong></div>` : ''}
              ${zone.affectedCount ? `<div class="flex justify-between"><span class="text-slate-400">ผลกระทบ:</span><strong class="text-slate-200">${zone.affectedCount}</strong></div>` : ''}
              <div class="flex justify-between"><span class="text-slate-400">อำเภอเสี่ยง:</span><span class="text-slate-200 font-medium">${zone.districts.join(', ')}</span></div>
            </div>

            <div class="bg-amber-950/40 p-2 rounded-xl border border-amber-500/30 text-[10px] text-amber-200 mb-2.5">
              <strong>คำแนะนำ:</strong> ${zone.recommendedAction}
            </div>

            <button id="inspect-zone-${zone.id}" class="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-md">
              🔍 ตรวจสอบสภาพอากาศสด & น้ำหลากพิกัดนี้
            </button>
          </div>
        `;

        polygon.bindPopup(popupHtml, { maxWidth: 320 });
        polygon.on('popupopen', () => {
          const btn = document.getElementById(`inspect-zone-${zone.id}`);
          if (btn) {
            btn.onclick = () => {
              onMapClickCoordinates({ lat: zone.center[0], lng: zone.center[1] });
            };
          }
        });

        group.addLayer(polygon);

        // Center badge pin for easy identification
        const centerIcon = L.divIcon({
          className: 'zone-center-badge',
          html: `
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isRed ? 'bg-red-600/95 text-white border-2 border-red-300 pulse-critical' :
              isOrange ? 'bg-orange-500/95 text-slate-950 border border-orange-200' :
              isYellow ? 'bg-yellow-400/95 text-slate-950 border border-yellow-200' :
              'bg-emerald-600/95 text-white border border-emerald-200'
            } text-[10px] font-bold shadow-xl whitespace-nowrap cursor-pointer hover:scale-110 transition-transform">
              <span>${isRed ? '🔴' : isOrange ? '🟠' : isYellow ? '🟡' : '🟢'}</span>
              <span>${zone.province}</span>
            </div>
          `,
          iconSize: [80, 20],
          iconAnchor: [40, 10]
        });

        const centerMarker = L.marker(zone.center, { icon: centerIcon });
        centerMarker.bindPopup(popupHtml, { maxWidth: 320 });
        centerMarker.on('popupopen', () => {
          const btn = document.getElementById(`inspect-zone-${zone.id}`);
          if (btn) {
            btn.onclick = () => {
              onMapClickCoordinates({ lat: zone.center[0], lng: zone.center[1] });
            };
          }
        });

        group.addLayer(centerMarker);
      });
    }

    // 6.2 River Stations
    if (showStations) {
      stations.forEach((st) => {
        let badgeColor = 'bg-emerald-500 border-emerald-300';
        let pulseClass = '';
        let statusText = 'ปกติ';

        if (st.status === 'critical') {
          badgeColor = 'bg-red-600 border-red-300';
          pulseClass = 'pulse-critical';
          statusText = 'วิกฤตล้นตลิ่ง';
        } else if (st.status === 'warning') {
          badgeColor = 'bg-amber-500 border-amber-300';
          pulseClass = 'pulse-warning';
          statusText = 'เตือนภัย';
        } else if (st.status === 'watch') {
          badgeColor = 'bg-yellow-500 border-yellow-300';
          statusText = 'เฝ้าระวัง';
        }

        const iconHtml = `
          <div class="relative cursor-pointer transition-transform hover:scale-125">
            <div class="w-7 h-7 rounded-full ${badgeColor} ${pulseClass} text-white flex items-center justify-center font-bold text-[10px] shadow-xl border-2">
              🌊
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'station-marker',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([st.lat, st.lng], { icon });

        // Popup Content
        const popupContent = `
          <div class="p-2 min-w-[220px]">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="font-bold text-sm text-cyan-400">${st.stationCode}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                st.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                st.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                st.status === 'watch' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }">${statusText}</span>
            </div>
            <p class="font-semibold text-xs text-slate-100 mb-1">${st.name}</p>
            <p class="text-[11px] text-slate-400 mb-2">จ.${st.province} • ${st.river}</p>

            <div class="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-800/80 p-2 rounded-lg mb-2 border border-slate-700/60">
              <div>
                <span class="text-slate-400 block text-[10px]">ระดับน้ำ</span>
                <strong class="text-slate-100">${st.waterLevel.toFixed(2)} ม.</strong>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">ระดับตลิ่ง</span>
                <strong class="text-slate-300">${st.bankLevel.toFixed(2)} ม.</strong>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">ปริมาณน้ำไหล</span>
                <strong class="text-cyan-300">${st.dischargeRate.toLocaleString()} ลบ.ม./วิ</strong>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">ความจุลำน้ำ</span>
                <strong class="${st.capacityPercent >= 100 ? 'text-red-400 font-bold' : 'text-slate-200'}">${st.capacityPercent}%</strong>
              </div>
            </div>

            <button id="view-station-${st.id}" class="w-full py-1.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all">
              🔍 ดูพยากรณ์ฝนและน้ำหลาก
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-station-${st.id}`);
          if (btn) {
            btn.onclick = () => onSelectStation(st);
          }
        });

        marker.on('click', () => {
          onSelectStation(st);
        });

        group.addLayer(marker);
      });
    }

    // 6.3 Dams
    if (showDams) {
      dams.forEach((dam) => {
        const iconHtml = `
          <div class="relative cursor-pointer transition-transform hover:scale-125">
            <div class="w-7 h-7 rounded-lg bg-indigo-600 border border-indigo-300 text-white flex items-center justify-center font-bold text-[10px] shadow-lg">
              🏔️
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'dam-marker',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([dam.lat, dam.lng], { icon });

        const popupContent = `
          <div class="p-2 min-w-[210px]">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="font-bold text-sm text-indigo-400">${dam.name}</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300">
                ${dam.storagePercent}% ความจุ
              </span>
            </div>
            <p class="text-[11px] text-slate-400 mb-2">จ.${dam.province} (${dam.river})</p>

            <div class="bg-slate-800/80 p-2 rounded-lg text-[11px] mb-2 space-y-1 border border-slate-700/60">
              <div class="flex justify-between">
                <span class="text-slate-400">ปริมาณน้ำกักเก็บ:</span>
                <span class="text-white font-medium">${dam.currentStorage.toLocaleString()} ล้าน ลบ.ม.</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">น้ำไหลเข้าเขื่อน:</span>
                <span class="text-cyan-300 font-medium">${dam.inflowRate} ล้าน ลบ.ม./วัน</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">การระบายน้ำ:</span>
                <span class="text-amber-300 font-medium">${dam.dischargeRate} ล้าน ลบ.ม./วัน</span>
              </div>
            </div>

            <button id="view-dam-${dam.id}" class="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all">
              🔍 ดูสภาพอากาศและน้ำบริเวณเขื่อน
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`view-dam-${dam.id}`);
          if (btn) {
            btn.onclick = () => onSelectDam(dam);
          }
        });

        marker.on('click', () => {
          onSelectDam(dam);
        });

        group.addLayer(marker);
      });
    }

    // 6.4 Flooded Roads (Red / Orange Polylines with water depth badges)
    if (showFloodedRoads && floodedRoads && floodedRoads.length > 0) {
      floodedRoads.forEach((road) => {
        const isCritical = road.status === 'critical';
        const isWarning = road.status === 'warning';

        // Outer glow color & inner core color
        const glowColor = isCritical ? '#ef4444' : isWarning ? '#f97316' : '#10b981';
        const coreColor = isCritical ? '#ff2a2a' : isWarning ? '#fb923c' : '#34d399';

        // 1. Outer Glow Polyline
        const glowPolyline = L.polyline(road.coordinates, {
          color: glowColor,
          weight: isCritical ? 10 : 8,
          opacity: 0.45,
          className: 'road-glow-critical',
          lineCap: 'round',
          lineJoin: 'round'
        });

        // 2. Foreground Animated / Dashed Polyline
        const corePolyline = L.polyline(road.coordinates, {
          color: coreColor,
          weight: isCritical ? 5 : 4,
          opacity: 0.95,
          className: isCritical ? 'road-flood-line-critical' : isWarning ? 'road-flood-line-warning' : '',
          lineCap: 'round',
          lineJoin: 'round'
        });

        // Hover Tooltip
        const tooltipHtml = `
          <div class="font-bold text-xs ${isCritical ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-emerald-400'}">
            ${isCritical ? '⛔ เส้นทางน้ำท่วม:' : isWarning ? '⚠️ ระวังน้ำขัง:' : '✅ ทางสัญจร:'} ${road.name}
          </div>
          <div class="text-[11px] text-slate-300 font-semibold">${road.waterDepth} • ${road.passabilityText}</div>
        `;

        corePolyline.bindTooltip(tooltipHtml, { sticky: true, opacity: 0.95 });
        glowPolyline.bindTooltip(tooltipHtml, { sticky: true, opacity: 0.95 });

        // Click Popup
        const trendBadge = road.drainageTrend === 'rising'
          ? '<span class="text-rose-400 font-bold">🔺 ระดับน้ำกำลังเพิ่มขึ้น</span>'
          : road.drainageTrend === 'receding'
          ? '<span class="text-emerald-400 font-bold">🔻 สูบระบายลดลงต่อเนื่อง</span>'
          : '<span class="text-amber-300 font-medium">➡️ ระดับน้ำทรงตัว</span>';

        const detour = buildSingleRoadDetourUrls(road);

        const popupHtml = `
          <div class="p-2.5 min-w-[280px]">
            <div class="flex items-center justify-between gap-1.5 mb-1.5">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isCritical 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : isWarning 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }">
                ${isCritical ? '🔴 น้ำท่วมขังวิกฤต' : isWarning ? '🟠 น้ำท่วมขังรอระบาย' : '🟢 สัญจรได้ปกติ'}
              </span>
              <span class="text-xs font-semibold text-slate-300">จ.${road.province}</span>
            </div>
            
            <h4 class="font-bold text-sm text-white mb-1 leading-snug">${road.name}</h4>
            <div class="text-xs font-bold text-amber-300 mb-2 flex items-center justify-between">
              <span>🌊 ${road.waterDepth}</span>
              <span class="text-[10px] text-slate-300 font-normal">${trendBadge}</span>
            </div>

            <div class="bg-slate-800/80 p-2 rounded-xl text-[11px] space-y-1 mb-2.5 border border-slate-700/60">
              <div class="flex justify-between">
                <span class="text-slate-400">สถานะจราจร:</span>
                <strong class="${isCritical ? 'text-red-400' : 'text-slate-200'}">${road.trafficSpeed || road.passabilityText}</strong>
              </div>
              ${road.pumpStatus ? `
                <div class="flex justify-between items-start gap-1">
                  <span class="text-slate-400 shrink-0">เครื่องสูบน้ำ:</span>
                  <span class="text-cyan-300 text-right text-[10px]">${road.pumpStatus}</span>
                </div>
              ` : ''}
              <div class="flex justify-between items-start gap-1">
                <span class="text-slate-400 shrink-0">สาเหตุ:</span>
                <span class="text-slate-200 text-right max-w-[175px] truncate">${road.cause}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">พื้นที่:</span>
                <span class="text-slate-200">อ.${road.district} ${road.subdistrict ? `ต.${road.subdistrict}` : ''}</span>
              </div>
              <div class="flex justify-between items-center pt-1 border-t border-slate-700/50 text-[10px]">
                <span class="text-slate-400">📡 แหล่งเซนเซอร์:</span>
                <span class="text-slate-300 truncate max-w-[160px]">${road.sensorSource || 'สำนักการระบายน้ำ กทม.'}</span>
              </div>
            </div>

            <div class="bg-rose-950/40 p-2 rounded-xl border border-rose-500/30 text-[10px] text-rose-200 mb-2.5">
              <strong>ทางเลี่ยงแนะนำ:</strong> ${road.detourAdvice}
            </div>

            {/* Google Maps & Apple Maps 1-Click Detour */}
            <div class="grid grid-cols-2 gap-1.5 mb-2.5">
              <a 
                href="${detour.googleMapsUrl}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] text-center flex items-center justify-center gap-1 shadow-sm transition-all"
                title="เปิดเส้นทางเลี่ยงจุดนี้บน Google Maps ทันที"
              >
                <span>🗺️ เลี่ยงใน Google Maps</span>
              </a>
              <a 
                href="${detour.appleMapsUrl}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-bold text-[10px] text-center flex items-center justify-center gap-1 shadow-sm transition-all"
                title="เปิดเส้นทางเลี่ยงจุดนี้บน Apple Maps ทันที"
              >
                <span>🍏 เลี่ยงใน Apple Maps</span>
              </a>
            </div>

            <div class="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-1">
              <span>⏱️ สถานะล่าสุด:</span>
              <strong class="text-emerald-400">${road.reportedTime}</strong>
            </div>

            <button id="inspect-road-${road.id}" class="w-full py-1.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md">
              🔍 ตรวจสอบสภาพอากาศ & เรดาร์สดพิกัดนี้
            </button>
          </div>
        `;

        corePolyline.bindPopup(popupHtml, { maxWidth: 320 });
        glowPolyline.bindPopup(popupHtml, { maxWidth: 320 });

        const bindRoadEvent = (layer: L.Polyline) => {
          layer.on('popupopen', () => {
            const btn = document.getElementById(`inspect-road-${road.id}`);
            if (btn) {
              btn.onclick = () => {
                onMapClickCoordinates({ lat: road.center[0], lng: road.center[1] });
              };
            }
          });
        };

        bindRoadEvent(corePolyline);
        bindRoadEvent(glowPolyline);

        group.addLayer(glowPolyline);
        group.addLayer(corePolyline);

        // Center badge pin for clear identification even when zoomed out
        const depthShort = road.waterDepth.replace('น้ำท่วมขัง', '').trim();
        const badgeIcon = L.divIcon({
          className: 'road-center-badge',
          html: `
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isCritical
                ? 'bg-red-600 text-white border border-red-300 pulse-critical shadow-lg shadow-red-600/50'
                : 'bg-orange-500 text-slate-950 border border-orange-200 shadow-md'
            } text-[10px] font-bold whitespace-nowrap cursor-pointer hover:scale-110 transition-transform">
              <span>⛔</span>
              <span>${road.routeNumber || 'น้ำขัง'} ${depthShort}</span>
            </div>
          `,
          iconSize: [110, 20],
          iconAnchor: [55, 10]
        });

        const badgeMarker = L.marker(road.center, { icon: badgeIcon });
        badgeMarker.bindPopup(popupHtml, { maxWidth: 320 });
        badgeMarker.on('popupopen', () => {
          const btn = document.getElementById(`inspect-road-${road.id}`);
          if (btn) {
            btn.onclick = () => {
              onMapClickCoordinates({ lat: road.center[0], lng: road.center[1] });
            };
          }
        });

        group.addLayer(badgeMarker);
      });
    }

  }, [stations, dams, floodZones, floodedRoads, showStations, showDams, showRiskZones, showFloodedRoads, activeZoneFilter]);

  // Zoom helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleResetView = () => mapInstanceRef.current?.flyTo([14.8, 100.8], 6);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden select-none bg-slate-900">
      
      {/* Leaflet Map Div (Absolute inset-0 ensures 100% geometry) */}
      <div 
        ref={mapContainerRef} 
        id="leaflet-flood-map"
        className="absolute inset-0 w-full h-full z-0" 
        style={{ minHeight: '300px', width: '100%', height: '100%' }}
      />

      {/* Top Bar Quick Controls: 100% Free Map Styles (NO API KEY REQUIRED) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] flex flex-col items-end gap-1.5 sm:gap-2">
        
        {/* Direct 1-Click Map Switcher */}
        <div className="flex items-center gap-0.5 sm:gap-1 glass-panel rounded-xl sm:rounded-2xl p-0.5 sm:p-1 shadow-2xl border border-slate-700/80">
          <button
            onClick={() => setBaseMapType('osm')}
            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              baseMapType === 'osm'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="แผนที่ OpenStreetMap (ฟรี 100% ไม่ต้องใช้ API Key)"
          >
            <span>🗺️</span>
            <span className="hidden sm:inline ml-1">ปกติ</span>
          </button>

          <button
            onClick={() => setBaseMapType('topo')}
            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              baseMapType === 'topo'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="แผนที่ภูมิประเทศและลุ่มน้ำ (Esri Topo)"
          >
            <span>🏔️</span>
            <span className="hidden sm:inline ml-1">ลุ่มน้ำ</span>
          </button>

          <button
            onClick={() => setBaseMapType('street')}
            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              baseMapType === 'street'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="แผนที่ถนนคมชัด (Esri Street)"
          >
            <span>🛣️</span>
            <span className="hidden sm:inline ml-1">ถนน</span>
          </button>

          <button
            onClick={() => setBaseMapType('dark')}
            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              baseMapType === 'dark'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="โหมดมืด (Esri Dark Gray)"
          >
            <span>🌙</span>
            <span className="hidden sm:inline ml-1">มืด</span>
          </button>

          <button
            onClick={() => setBaseMapType('satellite')}
            className={`px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              baseMapType === 'satellite'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="ภาพถ่ายดาวเทียมความละเอียดสูง (Esri Satellite)"
          >
            <span>🛰️</span>
            <span className="hidden sm:inline ml-1">ดาวเทียม</span>
          </button>
        </div>

        {/* AI Route Planner Button */}
        {onOpenAiRoutePlanner && (
          <button
            onClick={onOpenAiRoutePlanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-xl shadow-cyan-600/30 border border-cyan-400/50 transition-all active:scale-95 group"
            title="เปิด AI คำนวณเส้นทางเลี่ยงน้ำท่วม พร้อมส่งออกไปยัง Apple Maps / Google Maps"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse group-hover:rotate-12 transition-transform" />
            <span>AI นำทางเลี่ยงน้ำท่วม</span>
          </button>
        )}

        {/* Layer Toggle Menu */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold text-slate-200 hover:text-white shadow-xl hover:bg-slate-800 transition-all border border-slate-700/80"
            title="เปิด/ปิด ชั้นข้อมูลมอนิเตอร์"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>ตัวกรองข้อมูล</span>
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-2 w-64 glass-dropdown rounded-2xl p-3 shadow-2xl border border-slate-700/80 text-xs text-slate-200 z-50">
              <p className="font-bold text-slate-100 text-xs mb-2 border-b border-slate-700/60 pb-1.5">
                เปิด/ปิด ข้อมูลมอนิเตอร์
              </p>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer hover:text-rose-300">
                  <input
                    type="checkbox"
                    checked={showFloodedRoads}
                    onChange={(e) => setShowFloodedRoads(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-rose-500 focus:ring-rose-500"
                  />
                  <span>🛣️ เส้นทางน้ำท่วมขัง ({floodedRoads.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-red-300">
                  <input
                    type="checkbox"
                    checked={showRiskZones}
                    onChange={(e) => setShowRiskZones(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-red-500 focus:ring-red-500"
                  />
                  <span>🎨 โซนสีระดับความเสี่ยงภัย ({floodZones.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-300">
                  <input
                    type="checkbox"
                    checked={showStations}
                    onChange={(e) => setShowStations(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>🌊 สถานีวัดระดับน้ำแม่น้ำ ({stations.length})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer hover:text-indigo-300">
                  <input
                    type="checkbox"
                    checked={showDams}
                    onChange={(e) => setShowDams(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-600 text-indigo-500 focus:ring-indigo-500"
                  />
                  <span>🏔️ อ่างเก็บน้ำและเขื่อนหลัก ({dams.length})</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Zoom & Reset Buttons */}
        <div className="flex flex-col gap-1 glass-panel rounded-xl p-1 shadow-xl border border-slate-700/80">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="ซูมเข้า"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            title="ซูมออก"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-2 rounded-lg hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition-colors"
            title="มุมมองทั่วประเทศ"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Top Floating Feature / Layer Mode Selector (Clean Viewport) */}
      {onSelectFeatureMode && featureMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] max-w-[95vw]">
          <FeatureModeSwitcher
            currentMode={featureMode}
            onSelectMode={onSelectFeatureMode}
            roadCount={floodedRoads.length}
            stationCount={stations.length}
            zoneCount={floodZones.length}
          />
        </div>
      )}

      {/* Map Hint Tag */}
      <div className="absolute top-4 left-4 z-[990] hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel text-slate-200 text-xs border border-slate-700/70 shadow-lg pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>คลิกบนแผนที่หรือโซนสี เพื่อวิเคราะห์สภาพอากาศ & เสี่ยงน้ำท่วมสด</span>
      </div>

      {/* Real-time BMA DDS Sensor Feed Status Dock */}
      {showFloodedRoads && floodedRoads && floodedRoads.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[990] hidden md:flex items-center gap-2.5 px-3 py-2 rounded-2xl glass-panel text-slate-100 text-xs border border-slate-700/80 shadow-2xl backdrop-blur-xl">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-bold text-slate-100 text-[11px]">
              <span>LIVE BMA DDS SENSOR FEED</span>
              <span className="text-[10px] text-cyan-400 font-semibold">• กทม. & ทางหลวง ({floodedRoads.length} สายทาง)</span>
            </div>
            <span className="text-[10px] text-slate-400">
              อัปเดตเรียลไทม์ {roadLastUpdated || 'เมื่อสักครู่'} (เซนเซอร์ กทม. & เรดาร์ฝนสด)
            </span>
          </div>
          {onRefreshRoads && (
            <button
              onClick={onRefreshRoads}
              className="ml-1 px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm"
              title="กดเพื่อรีเฟรชข้อมูลเซนเซอร์น้ำท่วมถนนทันที"
            >
              <span>⚡ สด</span>
            </button>
          )}
        </div>
      )}

      {/* Active AI Route Banner */}
      {activeAiRoute && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl glass-panel text-white text-xs border border-cyan-500/50 shadow-2xl backdrop-blur-2xl animate-fade-in max-w-[95vw]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div>
              <div className="font-bold text-xs text-cyan-300 flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-md">
                <span>{activeAiRoute.title}</span>
              </div>
              <span className="text-[10px] text-slate-300 block">
                ระยะทาง {activeAiRoute.distanceKm} กม. • ~{activeAiRoute.estimatedTimeMin} นาที • ปลอดภัย {activeAiRoute.safetyScorePercent}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={activeAiRoute.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 sm:px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] sm:text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <span>🗺️ Google Maps</span>
            </a>
            <a
              href={activeAiRoute.appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 sm:px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-bold text-[10px] sm:text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <span>🍏 Apple Maps</span>
            </a>
            {onClearAiRoute && (
              <button
                onClick={onClearAiRoute}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="ล้างเส้นทาง AI ออกจากแผนที่"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
