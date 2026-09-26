import React from 'react';
import { CloudRain, Navigation, Waves, Map, Eye } from 'lucide-react';

export type FeatureViewMode = 'roads' | 'radar' | 'stations' | 'zones' | 'all';

interface FeatureModeSwitcherProps {
  currentMode: FeatureViewMode;
  onSelectMode: (mode: FeatureViewMode) => void;
  roadCount?: number;
  stationCount?: number;
  zoneCount?: number;
  className?: string;
}

export const FeatureModeSwitcher: React.FC<FeatureModeSwitcherProps> = ({
  currentMode,
  onSelectMode,
  roadCount = 38,
  stationCount = 31,
  zoneCount = 12,
  className = ''
}) => {
  const modes: {
    id: FeatureViewMode;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    tooltip: string;
  }[] = [
    {
      id: 'roads',
      label: 'เส้นทางน้ำท่วม',
      shortLabel: 'ถนนน้ำท่วม',
      icon: <Navigation className="w-3.5 h-3.5" />,
      badge: `${roadCount} จุด`,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      tooltip: 'ดูเฉพาะถนนที่น้ำท่วมขังและเส้นทางเลี่ยง (ซ่อนเรดาร์และสถานีเพื่อให้จอโล่ง)'
    },
    {
      id: 'radar',
      label: 'เรดาร์ลม & ฝน',
      shortLabel: 'เรดาร์ฝน',
      icon: <CloudRain className="w-3.5 h-3.5" />,
      badge: 'สด',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      tooltip: 'ดูเฉพาะเมฆฝน ทิศทางพายุ และเรดาร์ตรวจวัดกลุ่มฝนสด (ซ่อนถนนเพื่อดูชัดเจน)'
    },
    {
      id: 'stations',
      label: 'สถานีน้ำ & เขื่อน',
      shortLabel: 'ลุ่มน้ำ/เขื่อน',
      icon: <Waves className="w-3.5 h-3.5" />,
      badge: `${stationCount}`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      tooltip: 'ดูเฉพาะระดับน้ำในแม่น้ำหลัก ประตูระบายน้ำ และอ่างเก็บน้ำเขื่อนทั่วประเทศ'
    },
    {
      id: 'zones',
      label: 'โซนเสี่ยงภัย',
      shortLabel: 'โซนเตือนภัย',
      icon: <Map className="w-3.5 h-3.5" />,
      badge: `${zoneCount}`,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      tooltip: 'ดูเฉพาะพื้นที่โซนสีระดับความเสี่ยงภัยน้ำท่วม'
    },
    {
      id: 'all',
      label: 'ดูทั้งหมด',
      shortLabel: 'ทั้งหมด',
      icon: <Eye className="w-3.5 h-3.5" />,
      tooltip: 'แสดงข้อมูลทุกชั้นพร้อมกัน'
    }
  ];

  return (
    <div className={`flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl glass-panel border border-slate-700/80 shadow-2xl backdrop-blur-2xl max-w-full overflow-x-auto no-scrollbar ${className}`}>
      <span className="hidden lg:inline text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider shrink-0">
        โหมดแสดงผล:
      </span>
      {modes.map((m) => {
        const isActive = currentMode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onSelectMode(m.id)}
            title={m.tooltip}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 whitespace-nowrap ${
              isActive
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <span className={isActive ? 'text-white' : 'text-slate-400'}>
              {m.icon}
            </span>
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.shortLabel}</span>

            {m.badge && (
              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                isActive 
                  ? 'bg-white/20 text-white border-white/30' 
                  : m.badgeColor
              }`}>
                {m.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
