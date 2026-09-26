import React from 'react';
import { 
  X, 
  Layers, 
  Navigation, 
  CloudRain, 
  Waves, 
  Map, 
  Eye, 
  Check, 
  ShieldAlert, 
  SlidersHorizontal,
  Compass,
  Sparkles
} from 'lucide-react';
import { FeatureViewMode } from './FeatureModeSwitcher';

export interface DisplayModeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: FeatureViewMode;
  onSelectMode: (mode: FeatureViewMode) => void;
  roadCount: number;
  stationCount: number;
  damCount: number;
  zoneCount: number;
  baseMapType?: 'osm' | 'topo' | 'street' | 'dark' | 'satellite';
  onSelectBaseMap?: (type: 'osm' | 'topo' | 'street' | 'dark' | 'satellite') => void;
  showFloodedRoads?: boolean;
  setShowFloodedRoads?: (val: boolean) => void;
  showRiskZones?: boolean;
  setShowRiskZones?: (val: boolean) => void;
  showStations?: boolean;
  setShowStations?: (val: boolean) => void;
  showDams?: boolean;
  setShowDams?: (val: boolean) => void;
}

export const DisplayModeDrawer: React.FC<DisplayModeDrawerProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  roadCount,
  stationCount,
  damCount,
  zoneCount,
  baseMapType = 'osm',
  onSelectBaseMap,
  showFloodedRoads,
  setShowFloodedRoads,
  showRiskZones,
  setShowRiskZones,
  showStations,
  setShowStations,
  showDams,
  setShowDams,
}) => {
  if (!isOpen) return null;

  const modeOptions: {
    id: FeatureViewMode;
    title: string;
    subtitle: string;
    desc: string;
    icon: string;
    badge: string;
    badgeColor: string;
    borderColor: string;
    activeBg: string;
  }[] = [
    {
      id: 'roads',
      title: 'เส้นทางน้ำท่วมขัง (Road Flood Network)',
      subtitle: 'แนะนำสำหรับการขับขี่ & ตรวจสอบเส้นทาง',
      desc: 'แสดงเฉพาะเส้นทางถนนที่มีน้ำท่วมขัง ระดับน้ำในแต่ละเลน และเส้นทางเลี่ยงน้ำท่วม ซ่อนข้อมูลอื่นเพื่อความคมชัดสูงสุดบนจอ',
      icon: '🛣️',
      badge: `${roadCount} สายทาง`,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      borderColor: 'border-rose-500/50',
      activeBg: 'bg-rose-950/40 border-rose-500 shadow-rose-950/50'
    },
    {
      id: 'radar',
      title: 'เรดาร์ฝนสด & พายุ (RainViewer Radar)',
      subtitle: 'ติดตามทิศทางกลุ่มเมฆฝนและลมพัด',
      desc: 'แสดงเฉพาะภาพเรดาร์ตรวจวัดกลุ่มฝนสดแบบแอนิเมชัน ทิศทางพายุ และแนวโน้มฝนตกหนัก ซ่อนข้อมูลถนนเพื่อดูเมฆฝนได้ชัดเจน',
      icon: '🌧️',
      badge: 'ภาพเรดาร์สด 10 นาที',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      borderColor: 'border-cyan-500/50',
      activeBg: 'bg-cyan-950/40 border-cyan-400 shadow-cyan-950/50'
    },
    {
      id: 'stations',
      title: 'สถานีวัดระดับน้ำ & เขื่อน (Hydrological Stations)',
      subtitle: 'ติดตามแม่น้ำเจ้าพระยา ป่าสัก ท่าจีน และอ่างเก็บน้ำ',
      desc: 'แสดงเฉพาะสถานีวัดระดับน้ำหลัก 31 แห่ง อัตราน้ำล้นตลิ่ง ปริมาณน้ำไหลผ่าน (ลบ.ม./วิ) และความจุกักเก็บน้ำของเขื่อนทั่วประเทศ',
      icon: '🌊',
      badge: `${stationCount} สถานี + ${damCount} เขื่อน`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      borderColor: 'border-blue-500/50',
      activeBg: 'bg-blue-950/40 border-blue-400 shadow-blue-950/50'
    },
    {
      id: 'zones',
      title: 'โซนสีระดับความเสี่ยงภัย (Flood Risk Zones)',
      subtitle: 'พื้นที่สี แดง / ส้ม / เหลือง / เขียว',
      desc: 'แสดงเฉพาะขอบเขตพื้นที่เสี่ยงภัยน้ำท่วมตามระดับสีเตือนภัย พร้อมคำแนะนำการเตรียมตัวและการรับมือในแต่ละพื้นที่',
      icon: '🎨',
      badge: `${zoneCount} พื้นที่เสี่ยง`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      borderColor: 'border-amber-500/50',
      activeBg: 'bg-amber-950/40 border-amber-400 shadow-amber-950/50'
    },
    {
      id: 'all',
      title: 'แสดงข้อมูลทั้งหมดพร้อมกัน (All-in-One Tactical)',
      subtitle: 'สำหรับผู้บัญชาการเหตุการณ์และมอนิเตอร์ภาพรวม',
      desc: 'เปิดแสดงทุกเลเยอร์พร้อมกัน ทั้งถนน เรดาร์ สถานีน้ำ เขื่อน และโซนสี เพื่อประเมินสถานการณ์แบบ 360 องศา',
      icon: '👁️',
      badge: 'ครบทุกมิติ',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      borderColor: 'border-purple-500/50',
      activeBg: 'bg-purple-950/40 border-purple-400 shadow-purple-950/50'
    }
  ];

  return (
    <div className="fixed inset-0 z-[2100] flex justify-start bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sidebar Drawer Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md h-full bg-slate-900/95 border-r border-slate-700/80 shadow-2xl flex flex-col z-10 overflow-hidden text-slate-100"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>เลือกโหมดแสดงผล</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  Clean View
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                เลือกมุมมองเพื่อให้หน้าจอสะอาด ไม่ซ้อนทับ และตรงงานที่สุด
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Section 1: Tactile Mode Selection Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                โหมดการมองเห็น (View Modes)
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold">
                แตะเพื่อสลับทันที
              </span>
            </div>

            {modeOptions.map((opt) => {
              const isSelected = currentMode === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    onSelectMode(opt.id);
                  }}
                  className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer group shadow-sm ${
                    isSelected
                      ? `${opt.activeBg} ring-2 ring-cyan-500/40 shadow-xl`
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{opt.icon}</span>
                      <div>
                        <h3 className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white font-black' : 'text-slate-200'}`}>
                          {opt.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {opt.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed pl-7">
                    {opt.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Section 2: Base Map Switcher */}
          {onSelectBaseMap && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                รูปแบบแผนที่ฐาน (Base Maps - ฟรี 100%)
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { key: 'osm', label: '🗺️ แผนที่ปกติ (OSM)', desc: 'มาตรฐาน คมชัด' },
                  { key: 'topo', label: '🏔️ แผนที่ลุ่มน้ำ (Topo)', desc: 'แสดงระดับความสูง' },
                  { key: 'street', label: '🛣️ แผนที่ถนน (Street)', desc: 'เน้นเส้นทางจราจร' },
                  { key: 'dark', label: '🌙 โหมดมืด (Dark)', desc: 'สบายตา เรดาร์ชัด' },
                  { key: 'satellite', label: '🛰️ ภาพดาวเทียม (Sat)', desc: 'ภาพถ่ายจริง' }
                ].map((mapItem) => (
                  <button
                    key={mapItem.key}
                    onClick={() => onSelectBaseMap(mapItem.key as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      baseMapType === mapItem.key
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md'
                        : 'bg-slate-800/70 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-bold text-xs">{mapItem.label}</span>
                    <span className={`block text-[10px] ${baseMapType === mapItem.key ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                      {mapItem.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Fine-tuning Layer Checkboxes (Optional quick toggles) */}
          {(setShowFloodedRoads || setShowRiskZones || setShowStations || setShowDams) && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                ปรับแต่งชั้นข้อมูลย่อย (Custom Layer Toggles)
              </span>
              <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 space-y-2 text-xs">
                {setShowFloodedRoads && showFloodedRoads !== undefined && (
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span>🛣️</span>
                      <span>เส้นทางน้ำท่วมขัง ({roadCount})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showFloodedRoads}
                      onChange={(e) => setShowFloodedRoads(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                )}

                {setShowRiskZones && showRiskZones !== undefined && (
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span>🎨</span>
                      <span>โซนสีระดับความเสี่ยงภัย ({zoneCount})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showRiskZones}
                      onChange={(e) => setShowRiskZones(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                )}

                {setShowStations && showStations !== undefined && (
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span>🌊</span>
                      <span>สถานีวัดระดับน้ำแม่น้ำ ({stationCount})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showStations}
                      onChange={(e) => setShowStations(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                )}

                {setShowDams && showDams !== undefined && (
                  <label className="flex items-center justify-between cursor-pointer hover:text-white">
                    <span className="flex items-center gap-2">
                      <span>🏔️</span>
                      <span>อ่างเก็บน้ำและเขื่อนหลัก ({damCount})</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showDams}
                      onChange={(e) => setShowDams(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>แผนที่คลีน 100% ไร้สิ่งบดบัง</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            เรียบร้อย
          </button>
        </div>

      </div>
    </div>
  );
};
