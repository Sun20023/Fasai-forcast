import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  ExternalLink, 
  Clock, 
  Gauge, 
  Layers, 
  ChevronRight,
  TrendingUp,
  Droplets,
  Car,
  ArrowUpDown,
  LocateFixed
} from 'lucide-react';
import { FloodedRoad, AiSafeRouteOption, AiRoutePlanResult, AiFloodForecast } from '../types/flood';
import { 
  POPULAR_ROUTE_PRESETS, 
  POPULAR_ORIGIN_PRESETS,
  planAiFloodFreeRoute, 
  calculateAiFloodForecasts 
} from '../services/aiFloodRouter';

interface AiRoutePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  floodedRoads: FloodedRoad[];
  userLocation: { lat: number; lng: number } | null;
  onSelectRouteOnMap: (route: AiSafeRouteOption) => void;
}

export const AiRoutePlannerModal: React.FC<AiRoutePlannerModalProps> = ({
  isOpen,
  onClose,
  floodedRoads,
  userLocation,
  onSelectRouteOnMap
}) => {
  // Check if coordinates are in Bangkok / Central plains corridor
  const isBangkokArea = (lat: number, lng: number) => {
    return lat >= 13.3 && lat <= 14.3 && lng >= 100.1 && lng <= 101.0;
  };

  const getInitialOrigin = (): { name: string; coords: [number, number] } => {
    if (userLocation && isBangkokArea(userLocation.lat, userLocation.lng)) {
      return { name: 'ตำแหน่ง GPS ของคุณ (กทม.)', coords: [userLocation.lat, userLocation.lng] };
    }
    return { name: 'อนุสาวรีย์ชัยสมรภูมิ (ใจกลาง กทม.)', coords: [13.765, 100.538] };
  };

  const initialOrigin = getInitialOrigin();

  // Origin & Destination states
  const [originName, setOriginName] = useState(initialOrigin.name);
  const [originCoords, setOriginCoords] = useState<[number, number]>(initialOrigin.coords);

  const [destinationName, setDestinationName] = useState('สนามบินดอนเมือง (DMK)');
  const [destinationCoords, setDestinationCoords] = useState<[number, number]>([13.913, 100.604]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [routePlanResult, setRoutePlanResult] = useState<AiRoutePlanResult | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-ai-safe');
  const [forecasts, setForecasts] = useState<AiFloodForecast[]>([]);

  // Update origin if user GPS arrives and is in Bangkok area
  useEffect(() => {
    if (userLocation && isBangkokArea(userLocation.lat, userLocation.lng)) {
      setOriginCoords([userLocation.lat, userLocation.lng]);
      setOriginName('ตำแหน่ง GPS ปัจจุบัน');
    }
  }, [userLocation]);

  // Compute initial route plan & flood forecasts when opened
  useEffect(() => {
    if (isOpen) {
      handleCalculate();
      const fc = calculateAiFloodForecasts(floodedRoads.slice(0, 5));
      setForecasts(fc);
    }
  }, [isOpen]);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const plan = planAiFloodFreeRoute(
        { name: originName, coords: originCoords },
        { name: destinationName, coords: destinationCoords },
        floodedRoads
      );
      setRoutePlanResult(plan);
      setSelectedRouteId(plan.routes[0]?.id || 'route-ai-safe');
      setIsCalculating(false);
    }, 400);
  };

  const handleSelectPresetDest = (preset: typeof POPULAR_ROUTE_PRESETS[0]) => {
    setDestinationName(preset.label);
    setDestinationCoords(preset.coords);
    setIsCalculating(true);
    setTimeout(() => {
      const plan = planAiFloodFreeRoute(
        { name: originName, coords: originCoords },
        { name: preset.label, coords: preset.coords },
        floodedRoads
      );
      setRoutePlanResult(plan);
      setSelectedRouteId(plan.routes[0]?.id || 'route-ai-safe');
      setIsCalculating(false);
    }, 300);
  };

  const handleSelectPresetOrigin = (preset: typeof POPULAR_ORIGIN_PRESETS[0]) => {
    setOriginName(preset.label);
    setOriginCoords(preset.coords);
    setIsCalculating(true);
    setTimeout(() => {
      const plan = planAiFloodFreeRoute(
        { name: preset.label, coords: preset.coords },
        { name: destinationName, coords: destinationCoords },
        floodedRoads
      );
      setRoutePlanResult(plan);
      setSelectedRouteId(plan.routes[0]?.id || 'route-ai-safe');
      setIsCalculating(false);
    }, 300);
  };

  const handleFetchCurrentGps = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setOriginName('📍 ตำแหน่ง GPS ของฉัน');
        setOriginCoords([latitude, longitude]);
        setIsCalculating(true);
        setTimeout(() => {
          const plan = planAiFloodFreeRoute(
            { name: '📍 ตำแหน่ง GPS ของฉัน', coords: [latitude, longitude] },
            { name: destinationName, coords: destinationCoords },
            floodedRoads
          );
          setRoutePlanResult(plan);
          setSelectedRouteId(plan.routes[0]?.id || 'route-ai-safe');
          setIsCalculating(false);
        }, 300);
      },
      (err) => {
        alert('ไม่สามารถดึงตำแหน่ง GPS ได้: ' + err.message);
      }
    );
  };

  const handleSwapOriginDest = () => {
    const tempName = originName;
    const tempCoords = originCoords;
    setOriginName(destinationName);
    setOriginCoords(destinationCoords);
    setDestinationName(tempName);
    setDestinationCoords(tempCoords);
    setIsCalculating(true);
    setTimeout(() => {
      const plan = planAiFloodFreeRoute(
        { name: destinationName, coords: destinationCoords },
        { name: tempName, coords: tempCoords },
        floodedRoads
      );
      setRoutePlanResult(plan);
      setSelectedRouteId(plan.routes[0]?.id || 'route-ai-safe');
      setIsCalculating(false);
    }, 300);
  };

  if (!isOpen) return null;

  const activeRoute = routePlanResult?.routes.find(r => r.id === selectedRouteId) || routePlanResult?.routes[0];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  ฟ้าใส AI คำนวณเส้นทางเลี่ยงน้ำท่วม
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI Model v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                โมเดลวิเคราะห์มวลน้ำหลาก & นำทางหลบถนนน้ำท่วมขัง ส่งออกเข้า Apple Maps และ Google Maps ได้ทันที (ไร้จุดแวะอ้อม)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* 1. Origin & Destination Input Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 shadow-inner">
            
            {/* Origin */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  จุดเริ่มต้น (Origin)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={originName}
                    onChange={(e) => setOriginName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                    placeholder="ระบุจุดเริ่มต้น หรือเลือกปุ่มด่วนด้านล่าง"
                  />
                  <button
                    onClick={handleFetchCurrentGps}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold shrink-0 hover:bg-cyan-500/30 flex items-center gap-1 transition-all"
                    title="ดึงพิกัดปัจจุบันจาก GPS เครื่องของคุณ"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>ใช้ GPS</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Origin Presets */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                เลือกจุดเริ่มต้นด่วน (กทม.):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ORIGIN_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleSelectPresetOrigin(preset)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                      originName === preset.label
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/25'
                        : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                    }`}
                  >
                    {preset.label.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center -my-1">
              <button
                type="button"
                onClick={handleSwapOriginDest}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 hover:bg-slate-600 text-cyan-300 text-[11px] font-bold border border-slate-600 shadow-md transition-all active:scale-95"
                title="สลับจุดเริ่มต้นและจุดหมายปลายทาง"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>สลับต้นทาง ↔ ปลายทาง</span>
              </button>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                  จุดหมายปลายทาง (Destination)
                </label>
                <input
                  type="text"
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="ระบุจุดหมายปลายทาง"
                />
              </div>
            </div>

            {/* Destination Presets */}
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                เลือกจุดหมายยอดนิยมด่วน:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ROUTE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleSelectPresetDest(preset)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                      destinationName === preset.label
                        ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25'
                        : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700/60'
                    }`}
                  >
                    {preset.label.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>AI กำลังวิเคราะห์แนวฝน & คำนวณทางเลี่ยง...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>🧠 คำนวณเส้นทางเลี่ยงน้ำท่วมด้วย AI เดี๋ยวนี้</span>
                </>
              )}
            </button>
          </div>

          {/* 2. AI Hydrology Insight Banner */}
          {routePlanResult && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>ผลการวิเคราะห์มวลน้ำหลาก & ความเสี่ยงโดย ฟ้าใส AI</span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed">
                {routePlanResult.aiHydrologyInsight.safestTravelAdvice}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-cyan-200 font-medium">
                <span>🌧️ อัตราฝนสด กทม.: <strong>{routePlanResult.aiHydrologyInsight.bkkOverallRainVolumeMm} มม./ชม.</strong></span>
                <span>⏱️ ช่วงเสี่ยงสูงสุด: <strong>{routePlanResult.aiHydrologyInsight.peakInflowWindow}</strong></span>
                <span>🛣️ ถนนเสี่ยงในโซน: <strong>{routePlanResult.floodedRoadsInVicinity.length} สายทาง</strong></span>
              </div>
            </div>
          )}

          {/* 3. Calculated Routes Comparison */}
          {routePlanResult && (
            <div className="space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
                <span>เปรียบเทียบตัวเลือกเส้นทาง ({routePlanResult.routes.length} เส้นทาง)</span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5">
                {routePlanResult.routes.map((route) => {
                  const isSelected = selectedRouteId === route.id;
                  const isSafe = route.isSafe;

                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? isSafe
                            ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg'
                            : 'bg-red-950/40 border-red-500 ring-2 ring-red-500/30'
                          : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            route.routeType === 'safe_recommended'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : route.routeType === 'alternative_tollway'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {route.routeType === 'safe_recommended' ? '✨ แนะนำ ปลอดภัย 100%' : route.routeType === 'alternative_tollway' ? '⚡ ทางด่วนลอยฟ้า' : '⚠️ เสี่ยงน้ำท่วม'}
                          </span>
                          <h5 className="font-bold text-xs sm:text-sm text-white">
                            {route.title}
                          </h5>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-white block">
                            {route.distanceKm} กม.
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ~{route.estimatedTimeMin} นาที
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                        {route.summaryDescription}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] bg-slate-900/80 p-2 rounded-xl border border-slate-700/50 mb-2.5">
                        <div>
                          <span className="text-slate-400 block">ระดับความปลอดภัย</span>
                          <strong className={route.safetyScorePercent >= 90 ? 'text-emerald-400' : 'text-rose-400'}>
                            {route.safetyScorePercent}%
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">เลี่ยงจุดน้ำท่วม</span>
                          <strong className="text-cyan-300">{route.floodedPointsAvoided} จุดเสี่ยง</strong>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block">ประเภทรถที่แนะนำ</span>
                          <strong className={route.isSafe ? 'text-emerald-300' : 'text-amber-300'}>
                            {route.isSafe ? 'รถเก๋ง / ทุกชนิดผ่านได้' : 'รถยกสูงเท่านั้น'}
                          </strong>
                        </div>
                      </div>

                      {/* Turn-by-Turn Key Waypoints */}
                      <div className="space-y-1 mb-3 text-[11px] text-slate-300 pl-1 border-l-2 border-slate-700">
                        {route.keyWaypointsDescription.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>

                      {/* External Map Deep-Link Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/50">
                        
                        {/* 1. Google Maps Direct Button */}
                        <a
                          href={route.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[130px] py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 group"
                        >
                          <span>🗺️ เปิดใน Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </a>

                        {/* 2. Apple Maps Direct Button */}
                        <a
                          href={route.appleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[130px] py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 group"
                        >
                          <span>🍏 เปิดใน Apple Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </a>

                        {/* 3. Show on Leaflet Map */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRouteOnMap(route);
                            onClose();
                          }}
                          className="py-1.5 px-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition-all flex items-center gap-1 shrink-0"
                          title="พล็อตเส้นทางนี้ลงบนแผนที่ฟ้าใสพยากรณ์"
                        >
                          <span>📍 วาดบนแผนที่</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. AI Water Volume Inflow & Escalation Forecast Table */}
          {forecasts.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>โมเดล AI พยากรณ์มวลน้ำและแนวโน้มเพิ่มขึ้น (1-3-6 ชม.)</span>
                </h4>
                <span className="text-[10px] text-slate-400">คำนวณตามอัตราฝนและขีดความสามารถสูบน้ำ</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-700/80">
                <table className="w-full text-[11px] text-left text-slate-300">
                  <thead className="text-[10px] uppercase bg-slate-800 text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="px-3 py-2">เส้นทางถนน</th>
                      <th className="px-2 py-2">ระดับน้ำตอนนี้</th>
                      <th className="px-2 py-2">ใน 1 ชม.</th>
                      <th className="px-2 py-2">ใน 3 ชม.</th>
                      <th className="px-2 py-2">น้ำไหลเข้า (ม³/ชม.)</th>
                      <th className="px-2 py-2">ระดับความเสี่ยง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {forecasts.map((fc) => (
                      <tr key={fc.roadId} className="hover:bg-slate-800/50">
                        <td className="px-3 py-2 font-medium text-white max-w-[160px] truncate">
                          {fc.roadName.split('(')[0]}
                        </td>
                        <td className="px-2 py-2 text-slate-200">
                          {fc.currentDepthCm} ซม.
                        </td>
                        <td className={`px-2 py-2 font-bold ${fc.predictedDepth1h > fc.currentDepthCm ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {fc.predictedDepth1h} ซม.
                        </td>
                        <td className={`px-2 py-2 font-bold ${fc.predictedDepth3h > fc.currentDepthCm ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {fc.predictedDepth3h} ซม.
                        </td>
                        <td className="px-2 py-2 text-cyan-300">
                          {fc.waterVolumeInflowM3PerHr.toLocaleString()}
                        </td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            fc.riskEscalationLevel === 'critical'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : fc.riskEscalationLevel === 'high'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {fc.riskEscalationLevel === 'critical' ? '🔴 วิกฤตเพิ่มขึ้น' : fc.riskEscalationLevel === 'high' ? '🟠 เสี่ยงสูง' : '🟢 ระบายทัน'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>เชื่อมต่อ Apple Maps & Google Maps แบบ Live Directions API</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
