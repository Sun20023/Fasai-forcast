import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, MapPin, Eye, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { FloodZone } from '../types/flood';

interface ZoneLegendProps {
  zones: FloodZone[];
  onSelectZone: (zone: FloodZone) => void;
  activeFilter: 'all' | 'red' | 'orange' | 'yellow' | 'green';
  onChangeFilter: (filter: 'all' | 'red' | 'orange' | 'yellow' | 'green') => void;
}

export const ZoneLegend: React.FC<ZoneLegendProps> = ({
  zones,
  onSelectZone,
  activeFilter,
  onChangeFilter
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [selectedLevelForList, setSelectedLevelForList] = useState<'red' | 'orange' | 'yellow' | 'green' | null>(null);

  const redZones = zones.filter(z => z.level === 'red');
  const orangeZones = zones.filter(z => z.level === 'orange');
  const yellowZones = zones.filter(z => z.level === 'yellow');
  const greenZones = zones.filter(z => z.level === 'green');

  return (
    <div className={`absolute top-3 left-3 sm:top-4 sm:left-4 z-[990] glass-panel rounded-2xl shadow-2xl border border-slate-700/80 text-slate-100 transition-all overflow-hidden ${
      isExpanded ? 'w-[calc(100vw-6.5rem)] max-w-xs sm:w-80' : 'w-auto'
    }`}>
      
      {/* Header / Pill Trigger */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/90 transition-colors select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h3 className="text-[11px] sm:text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>โซนสีเสี่ยงภัย</span>
              {!isExpanded && (
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </span>
              )}
            </h3>
            {isExpanded && (
              <p className="text-[10px] text-slate-400">
                เกณฑ์ สทนช. / ปภ. ทั่วประเทศ ({zones.length} โซน)
              </p>
            )}
          </div>
        </div>

        <button className="text-slate-400 hover:text-white p-0.5 ml-1">
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2 text-xs">
          
          {/* Level Summary Pills */}
          <div className="grid grid-cols-2 gap-1.5">
            {/* Red */}
            <button
              onClick={() => {
                onChangeFilter(activeFilter === 'red' ? 'all' : 'red');
                setSelectedLevelForList(selectedLevelForList === 'red' ? null : 'red');
              }}
              className={`p-2 rounded-xl border text-left transition-all ${
                activeFilter === 'red' || selectedLevelForList === 'red'
                  ? 'bg-red-500/25 border-red-500 ring-1 ring-red-500 text-white'
                  : 'bg-red-950/30 border-red-500/40 text-red-200 hover:bg-red-950/50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block"></span>
                  สีแดง วิกฤต
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-red-500/30 text-[10px] font-bold">
                  {redZones.length}
                </span>
              </div>
              <span className="text-[10px] text-red-300 block">ล้นตลิ่ง/ท่วมฉับพลัน</span>
            </button>

            {/* Orange */}
            <button
              onClick={() => {
                onChangeFilter(activeFilter === 'orange' ? 'all' : 'orange');
                setSelectedLevelForList(selectedLevelForList === 'orange' ? null : 'orange');
              }}
              className={`p-2 rounded-xl border text-left transition-all ${
                activeFilter === 'orange' || selectedLevelForList === 'orange'
                  ? 'bg-orange-500/25 border-orange-500 ring-1 ring-orange-500 text-white'
                  : 'bg-orange-950/30 border-orange-500/40 text-orange-200 hover:bg-orange-950/50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                  สีส้ม เตือนภัย
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-orange-500/30 text-[10px] font-bold">
                  {orangeZones.length}
                </span>
              </div>
              <span className="text-[10px] text-orange-300 block">เตรียมยกของรับมือ</span>
            </button>

            {/* Yellow */}
            <button
              onClick={() => {
                onChangeFilter(activeFilter === 'yellow' ? 'all' : 'yellow');
                setSelectedLevelForList(selectedLevelForList === 'yellow' ? null : 'yellow');
              }}
              className={`p-2 rounded-xl border text-left transition-all ${
                activeFilter === 'yellow' || selectedLevelForList === 'yellow'
                  ? 'bg-yellow-500/25 border-yellow-500 ring-1 ring-yellow-500 text-white'
                  : 'bg-yellow-950/30 border-yellow-500/40 text-yellow-200 hover:bg-yellow-950/50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"></span>
                  สีเหลือง เฝ้าระวัง
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-yellow-500/30 text-[10px] font-bold">
                  {yellowZones.length}
                </span>
              </div>
              <span className="text-[10px] text-yellow-300 block">ฝนสะสม/น้ำหนุน</span>
            </button>

            {/* Green */}
            <button
              onClick={() => {
                onChangeFilter(activeFilter === 'green' ? 'all' : 'green');
                setSelectedLevelForList(selectedLevelForList === 'green' ? null : 'green');
              }}
              className={`p-2 rounded-xl border text-left transition-all ${
                activeFilter === 'green' || selectedLevelForList === 'green'
                  ? 'bg-emerald-500/25 border-emerald-500 ring-1 ring-emerald-500 text-white'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  สีเขียว ปกติ
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-[10px] font-bold">
                  {greenZones.length}
                </span>
              </div>
              <span className="text-[10px] text-emerald-300 block">ระบายน้ำคล่องตัว</span>
            </button>
          </div>

          {/* Expanded List of zones when a level is clicked */}
          {selectedLevelForList && (
            <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <span className="text-[10px] text-slate-400 block font-semibold">
                คลิกเพื่อซูมดูพื้นที่ ({zones.filter(z => z.level === selectedLevelForList).length}):
              </span>
              {zones
                .filter(z => z.level === selectedLevelForList)
                .map(z => (
                  <button
                    key={z.id}
                    onClick={() => onSelectZone(z)}
                    className="w-full text-left p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 flex items-center justify-between gap-1 transition-colors text-xs"
                  >
                    <span className="truncate text-slate-200 font-medium">📍 {z.name}</span>
                    <span className="text-[10px] text-cyan-400 shrink-0">ซูมดู</span>
                  </button>
                ))}
            </div>
          )}

          {activeFilter !== 'all' && (
            <button
              onClick={() => {
                onChangeFilter('all');
                setSelectedLevelForList(null);
              }}
              className="w-full py-1 text-center text-[10px] text-cyan-400 hover:text-cyan-300 underline"
            >
              แสดงทุกโซนสีบนแผนที่
            </button>
          )}

          {/* Realtime Flooded Road Status */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span>
              <span>เซนเซอร์ถนนน้ำท่วมขัง:</span>
            </span>
            <span className="text-red-400 font-bold bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
              32 สายทาง (กทม. & ปริมณฑล)
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
