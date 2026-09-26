import React from 'react';
import { Play, Pause, RotateCcw, CloudRain, Layers, Eye } from 'lucide-react';
import { RadarData } from '../types/flood';

interface RadarControlsProps {
  radarData: RadarData | null;
  currentFrameIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectFrame: (index: number) => void;
  opacity: number;
  onChangeOpacity: (val: number) => void;
  isRadarVisible: boolean;
  onToggleRadarVisible: () => void;
}

export const RadarControls: React.FC<RadarControlsProps> = ({
  radarData,
  currentFrameIndex,
  isPlaying,
  onTogglePlay,
  onSelectFrame,
  opacity,
  onChangeOpacity,
  isRadarVisible,
  onToggleRadarVisible
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (!radarData || !radarData.past || radarData.past.length === 0) {
    return null;
  }

  const allFrames = [...radarData.past, ...(radarData.nowcast || [])];
  const currentFrame = allFrames[currentFrameIndex];
  
  // Format frame timestamp to Thai time HH:mm
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  };

  const isForecast = currentFrameIndex >= radarData.past.length;

  return (
    <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100vw-1.5rem)] sm:w-[92%] max-w-xl glass-panel rounded-2xl p-2.5 sm:p-4 text-slate-100 shadow-2xl border border-slate-700/60 backdrop-blur-xl transition-all">
      
      {/* Header bar: Status + Visibility Toggle + Minimize/Maximize */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="p-1 sm:p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
            <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                เรดาร์กลุ่มฝนสด
              </span>
              <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                isForecast 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {isForecast ? 'พยากรณ์' : 'สดจริง'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              ตรวจวัด: <strong className="text-cyan-300">{formatTime(currentFrame?.time)}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Toggle on/off radar layer */}
          <button
            onClick={onToggleRadarVisible}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all ${
              isRadarVisible
                ? 'bg-cyan-600/80 border-cyan-400/50 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">{isRadarVisible ? 'เปิดเรดาร์' : 'ปิดเรดาร์'}</span>
          </button>

          {/* Minimize / Maximize Dock */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 px-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-[10px] sm:text-xs font-bold transition-colors"
            title={isMinimized ? 'ขยายแถบควบคุมเรดาร์' : 'ย่อแถบควบคุม'}
          >
            {isMinimized ? '▴ ขยาย' : '▾ ย่อ'}
          </button>
        </div>
      </div>

      {!isMinimized && isRadarVisible && (
        <>
          {/* Timeline Scrub Slider */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onTogglePlay}
              className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/30 shrink-0"
              title={isPlaying ? 'หยุดชั่วคราว' : 'เล่นภาพเคลื่อนไหวเรดาร์'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={allFrames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => onSelectFrame(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                <span>{formatTime(allFrames[0]?.time)}</span>
                <span className="text-cyan-300 font-medium">ปัจจุบัน</span>
                <span>{formatTime(allFrames[allFrames.length - 1]?.time)}</span>
              </div>
            </div>
          </div>

          {/* Color Legend & Opacity Slider */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            {/* Color scale */}
            <div className="flex items-center gap-1.5">
              <span>ความแรงฝน:</span>
              <div className="flex items-center rounded overflow-hidden h-2.5 shadow-inner">
                <span className="w-5 h-full bg-[#00ecec]" title="ปรอยๆ"></span>
                <span className="w-5 h-full bg-[#01a0f6]" title="เล็กน้อย"></span>
                <span className="w-5 h-full bg-[#0000f6]" title="ปานกลาง"></span>
                <span className="w-5 h-full bg-[#00eb00]" title="ค่อนข้างหนัก"></span>
                <span className="w-5 h-full bg-[#e7c000]" title="หนัก"></span>
                <span className="w-5 h-full bg-[#ff9000]" title="หนักมาก"></span>
                <span className="w-5 h-full bg-[#ff0000]" title="รุนแรง/พายุ"></span>
                <span className="w-5 h-full bg-[#d000d0]" title="ลูกเห็บ"></span>
              </div>
              <span className="text-[9px] text-slate-500">เบา → พายุจัด</span>
            </div>

            {/* Opacity slider */}
            <div className="flex items-center gap-2">
              <span>ความโปร่งใส:</span>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={opacity}
                onChange={(e) => onChangeOpacity(Number(e.target.value))}
                className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </>
      )}

    </div>
  );
};
