import React from 'react';
import { 
  X, 
  Droplets, 
  Wind, 
  Thermometer, 
  CloudRain, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BookmarkPlus, 
  Bell, 
  ShieldAlert,
  Compass,
  ArrowRight,
  Waves
} from 'lucide-react';
import { WaterStation, DamInfo, WeatherCondition, RiverDischargeForecast } from '../types/flood';
import { calculateLocationThreat } from '../services/weatherApi';

interface DetailSidebarProps {
  selectedStation: WaterStation | null;
  selectedDam: DamInfo | null;
  customLocation: {
    lat: number;
    lng: number;
    name?: string;
  } | null;
  weather: WeatherCondition | null;
  riverDischarge: RiverDischargeForecast | null;
  isLoadingWeather: boolean;
  onClose: () => void;
  onAddToWatchlist: (item: { label: string; province: string; lat: number; lng: number }) => void;
  onTriggerTestAlert: (title: string, message: string, severity: 'critical' | 'warning' | 'info') => void;
}

export const DetailSidebar: React.FC<DetailSidebarProps> = ({
  selectedStation,
  selectedDam,
  customLocation,
  weather,
  riverDischarge,
  isLoadingWeather,
  onClose,
  onAddToWatchlist,
  onTriggerTestAlert
}) => {
  if (!selectedStation && !selectedDam && !customLocation) {
    return null;
  }

  // Determine Title, Province, and Basin
  let title = 'พิกัดที่เลือกบนแผนที่';
  let province = '';
  let subInfo = '';
  let lat = 0;
  let lng = 0;

  if (selectedStation) {
    title = `${selectedStation.stationCode} - ${selectedStation.name}`;
    province = selectedStation.province;
    subInfo = `${selectedStation.river} • ${selectedStation.basin}`;
    lat = selectedStation.lat;
    lng = selectedStation.lng;
  } else if (selectedDam) {
    title = selectedDam.name;
    province = selectedDam.province;
    subInfo = `${selectedDam.river} (ความจุปกติ ${selectedDam.capacityMax.toLocaleString()} ล้าน ลบ.ม.)`;
    lat = selectedDam.lat;
    lng = selectedDam.lng;
  } else if (customLocation) {
    title = customLocation.name || `พิกัด ${customLocation.lat.toFixed(4)}, ${customLocation.lng.toFixed(4)}`;
    province = 'ตรวจวัดจากพิกัด GPS';
    subInfo = 'ข้อมูลพยากรณ์สดจากดาวเทียม & แบบจำลองชลศาสตร์ Open-Meteo';
    lat = customLocation.lat;
    lng = customLocation.lng;
  }

  // Calculate Threat
  const threatResult = weather ? calculateLocationThreat(weather, riverDischarge) : null;
  
  // Calculate difference to bank
  let overflowDiff = 0;
  let isOverflowing = false;
  if (selectedStation) {
    overflowDiff = selectedStation.waterLevel - selectedStation.bankLevel;
    isOverflowing = overflowDiff > 0;
  }

  // ESC key listener to close sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[1040] sm:hidden animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 z-[1050] w-full sm:w-[460px] glass-panel bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 text-slate-100 shadow-2xl flex flex-col transition-transform duration-300">
      
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {selectedStation ? 'สถานีวัดน้ำ' : selectedDam ? 'เขื่อน/อ่างเก็บน้ำ' : 'พิกัดสำรวจสด'}
            </span>
            {province && <span className="text-xs text-slate-400">จ.{province}</span>}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{subInfo}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 sm:space-y-4 pb-28 sm:pb-8">
        
        {/* Threat Level Assessment Card */}
        {threatResult && (
          <div className={`rounded-2xl p-4 border transition-all ${
            threatResult.threatLevel === 'critical' || (selectedStation?.status === 'critical')
              ? 'bg-red-950/60 border-red-500/50 shadow-lg shadow-red-950/50'
              : threatResult.threatLevel === 'warning' || (selectedStation?.status === 'warning')
              ? 'bg-amber-950/50 border-amber-500/50'
              : threatResult.threatLevel === 'watch' || (selectedStation?.status === 'watch')
              ? 'bg-yellow-950/40 border-yellow-500/40'
              : 'bg-emerald-950/40 border-emerald-500/40'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {threatResult.threatLevel === 'critical' || selectedStation?.status === 'critical' ? (
                  <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
                ) : threatResult.threatLevel === 'warning' || selectedStation?.status === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <span className="font-bold text-sm">
                  การประเมินความเสี่ยงน้ำท่วม & สภาพอากาศ
                </span>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                threatResult.threatLevel === 'critical' || selectedStation?.status === 'critical'
                  ? 'bg-red-500 text-white animate-pulse'
                  : threatResult.threatLevel === 'warning' || selectedStation?.status === 'warning'
                  ? 'bg-amber-500 text-slate-950'
                  : threatResult.threatLevel === 'watch' || selectedStation?.status === 'watch'
                  ? 'bg-yellow-400 text-slate-950'
                  : 'bg-emerald-500 text-slate-950'
              }`}>
                {threatResult.threatLevel === 'critical' || selectedStation?.status === 'critical' ? 'วิกฤตล้นตลิ่ง' :
                 threatResult.threatLevel === 'warning' || selectedStation?.status === 'warning' ? 'ระดับเตือนภัย' :
                 threatResult.threatLevel === 'watch' || selectedStation?.status === 'watch' ? 'เฝ้าระวัง' : 'ปกติ'}
              </span>
            </div>

            <ul className="text-xs space-y-1.5 text-slate-300 mt-2 pl-1">
              {threatResult.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
              {selectedStation && (
                <li className="flex items-start gap-2 text-slate-200">
                  <span className="text-cyan-400 mt-0.5">•</span>
                  <span>
                    {isOverflowing 
                      ? `⚠️ ปัจจุบันน้ำล้นตลิ่งแล้ว +${(overflowDiff * 100).toFixed(0)} เซนติเมตร`
                      : `ระดับน้ำต่ำกว่าตลิ่ง ${Math.abs(overflowDiff).toFixed(2)} เมตร`}
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Water Level Gauge (If Station) */}
        {selectedStation && (
          <div className="glass-card rounded-2xl p-4 border border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-cyan-400" />
                มาตรวัดระดับน้ำเทียบตลิ่ง
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                แนวโน้ม: 
                {selectedStation.trend === 'rising' ? (
                  <span className="text-red-400 flex items-center gap-0.5 font-semibold"><TrendingUp className="w-3.5 h-3.5" /> เพิ่มขึ้น</span>
                ) : selectedStation.trend === 'falling' ? (
                  <span className="text-emerald-400 flex items-center gap-0.5 font-semibold"><TrendingDown className="w-3.5 h-3.5" /> ลดลง</span>
                ) : (
                  <span className="text-slate-300 flex items-center gap-0.5 font-semibold"><Minus className="w-3.5 h-3.5" /> ทรงตัว</span>
                )}
              </span>
            </div>

            {/* Visual Level Bar */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">ระดับน้ำปัจจุบัน</span>
                <span className={`text-base font-bold ${isOverflowing ? 'text-red-400' : 'text-cyan-300'}`}>
                  {selectedStation.waterLevel.toFixed(2)} ม.
                </span>
              </div>

              {/* Progress track */}
              <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    selectedStation.capacityPercent >= 100 
                      ? 'bg-gradient-to-r from-amber-500 to-red-500' 
                      : selectedStation.capacityPercent >= 80 
                      ? 'bg-gradient-to-r from-cyan-500 to-amber-500' 
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                  }`}
                  style={{ width: `${Math.min(selectedStation.capacityPercent, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0 ม.</span>
                <span>เตือนภัย: {selectedStation.warningLevel.toFixed(2)} ม.</span>
                <span>ตลิ่ง: {selectedStation.bankLevel.toFixed(2)} ม.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">ปริมาณน้ำไหลผ่าน</span>
                <strong className="text-slate-100 text-sm">
                  {selectedStation.dischargeRate.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-400 ml-1">ลบ.ม./วินาที</span>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 block text-[10px]">ความจุของลำน้ำ</span>
                <strong className={`text-sm font-bold ${selectedStation.capacityPercent >= 100 ? 'text-red-400' : 'text-slate-100'}`}>
                  {selectedStation.capacityPercent}%
                </strong>
                <span className="text-[10px] text-slate-400 ml-1">ของความจุสูงสุด</span>
              </div>
            </div>

            {selectedStation.notes && (
              <p className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-xl mt-2.5 border border-slate-700/40">
                💬 <strong>หมายเหตุ:</strong> {selectedStation.notes}
              </p>
            )}
          </div>
        )}

        {/* Live Weather Forecast Card (Open-Meteo) */}
        <div className="glass-card rounded-2xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              สภาพอากาศ & พยากรณ์ฝนพายุ (Open-Meteo)
            </span>
            {isLoadingWeather && (
              <span className="text-[10px] text-cyan-400 animate-pulse">กำลังโหลดสด...</span>
            )}
          </div>

          {weather ? (
            <div className="space-y-3">
              {/* Weather Main Info */}
              <div className="flex items-center justify-between bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{weather.weatherCode >= 80 ? '⛈️' : weather.weatherCode >= 50 ? '🌧️' : '⛅'}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{weather.weatherDesc}</h4>
                    <p className="text-xs text-slate-400">
                      {weather.isStorm ? '⚠️ เฝ้าระวังพายุและฟ้าคะนอง' : 'สภาพบรรยากาศทั่วไป'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-bold text-white">{weather.temp.toFixed(1)}°C</span>
                  <span className="block text-[10px] text-slate-400">ความชื้น {weather.humidity}%</span>
                </div>
              </div>

              {/* Rain & Wind Metric Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 flex items-center gap-1 text-[10px] mb-1">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    ปริมาณฝนชั่วโมงนี้
                  </span>
                  <strong className={`text-sm ${weather.rainCurrent > 10 ? 'text-red-400 font-bold' : 'text-slate-100'}`}>
                    {weather.rainCurrent.toFixed(1)} มม./ชม.
                  </strong>
                </div>

                <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 flex items-center gap-1 text-[10px] mb-1">
                    <Wind className="w-3 h-3 text-amber-400" />
                    ลมกระโชกสูงสุด
                  </span>
                  <strong className={`text-sm ${weather.windGust >= 45 ? 'text-amber-400 font-bold' : 'text-slate-100'}`}>
                    {weather.windGust.toFixed(0)} กม./ชม.
                  </strong>
                </div>
              </div>

              {/* 24-Hour Rainfall Timeline Chart */}
              <div>
                <p className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                  <span>พยากรณ์ปริมาณฝน 12 ชั่วโมงข้างหน้า (มม.)</span>
                  <span className="text-[10px] text-slate-400">ช่วงเวลา</span>
                </p>

                <div className="grid grid-cols-6 gap-1 bg-slate-800/40 p-2 rounded-xl border border-slate-700/40">
                  {weather.hourly.times.slice(0, 6).map((timeStr, idx) => {
                    const hour = new Date(timeStr).getHours();
                    const rain = weather.hourly.rain[idx] || 0;
                    const pop = weather.hourly.pop[idx] || 0;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-400">{hour}:00</span>
                        <div className="w-full bg-slate-800 rounded-md h-12 flex items-end justify-center p-0.5">
                          <div 
                            className={`w-full rounded-sm transition-all ${
                              rain > 15 ? 'bg-red-500' : rain > 5 ? 'bg-amber-400' : 'bg-cyan-500'
                            }`}
                            style={{ height: `${Math.min(Math.max(rain * 4, 4), 44)}px` }}
                            title={`${rain.toFixed(1)} มม. (โอกาสฝน ${pop}%)`}
                          />
                        </div>
                        <span className="text-[9px] font-semibold text-cyan-300">{rain.toFixed(1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : isLoadingWeather ? (
            <div className="space-y-2.5 animate-pulse p-1">
              <div className="h-14 bg-slate-800/70 rounded-xl"></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-12 bg-slate-800/70 rounded-xl"></div>
                <div className="h-12 bg-slate-800/70 rounded-xl"></div>
              </div>
              <div className="h-16 bg-slate-800/70 rounded-xl"></div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              คลิกบนแผนที่เพื่อดึงข้อมูลพยากรณ์อากาศและน้ำหลากสด
            </div>
          )}
        </div>

        {/* 7-Day River Discharge (Open-Meteo Flood API) */}
        {riverDischarge && riverDischarge.discharge.length > 0 && (
          <div className="glass-card rounded-2xl p-4 border border-slate-700/60">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              คาดการณ์อัตราการไหลของแม่น้ำ 7 วันล่วงหน้า (River Discharge)
            </span>
            <p className="text-[11px] text-slate-400 mb-3">
              คำนวณจากแบบจำลองชลศาสตร์ระดับโลก (ลบ.ม./วินาที)
            </p>

            <div className="grid grid-cols-7 gap-1 bg-slate-800/40 p-2 rounded-xl border border-slate-700/40 text-center">
              {riverDischarge.dates.slice(0, 7).map((dStr, idx) => {
                const dateObj = new Date(dStr);
                const dayName = dateObj.toLocaleDateString('th-TH', { weekday: 'narrow' });
                const dis = riverDischarge.discharge[idx] || 0;
                const mean = riverDischarge.dischargeMean[idx] || 1;
                const isSurge = dis > mean * 1.5;

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">{dayName}</span>
                    <div className="w-full bg-slate-800 rounded-md h-12 flex items-end justify-center p-0.5">
                      <div 
                        className={`w-full rounded-sm ${isSurge ? 'bg-red-500' : 'bg-cyan-500'}`}
                        style={{ height: `${Math.min(Math.max((dis / (mean || 1)) * 16, 6), 44)}px` }}
                        title={`อัตราไหล: ${dis.toFixed(1)} ลบ.ม./วินาที`}
                      />
                    </div>
                    <span className="text-[8px] text-slate-300 font-medium">{dis.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Safety & Evacuation Guidelines */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-2">
          <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            คำแนะนำสำหรับประชาชนในพื้นที่นี้
          </span>
          <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
            <li>ยกเครื่องใช้ไฟฟ้าและทรัพย์สินขึ้นที่สูงกว่าระดับน้ำท่วมสูงสุดในอดีตอย่างน้อย 50 ซม.</li>
            <li>ตัดวงจรไฟฟ้าในชั้นล่างของอาคารเพื่อป้องกันไฟฟ้ารั่ว</li>
            <li>เตรียมกระเป๋าฉุกเฉิน (ยาประจำตัว, น้ำดื่มสะอาด, ไฟฉาย, แบตสำรอง)</li>
            <li>กรณีระดับน้ำสูงฉับพลัน ติดต่อขอความช่วยเหลือ ปภ. สายด่วน 1784</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => onAddToWatchlist({
              label: title,
              province: province || 'พื้นที่สำรวจ',
              lat,
              lng
            })}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>ปักหมุดเป็นพื้นที่เฝ้าระวังของฉัน</span>
          </button>

          <button
            onClick={() => onTriggerTestAlert(
              `การแจ้งเตือนจากบริเวณ: ${title}`,
              `สภาพอากาศ: ${weather?.weatherDesc || 'ฝนตกหนัก'} ปริมาณฝน ${weather?.rainCurrent || 0} มม./ชม. ความเสี่ยง: ${threatResult?.threatLevel || 'เฝ้าระวัง'}`,
              threatResult?.threatLevel === 'critical' ? 'critical' : 'warning'
            )}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            <span>ทดสอบยิงแจ้งเตือน (Notification & Sound)</span>
          </button>
        </div>

      </div>

    </div>
    </>
  );
};
