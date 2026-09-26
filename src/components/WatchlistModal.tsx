import React, { useState } from 'react';
import { X, Bookmark, Plus, Trash2, MapPin, Navigation, Bell, LocateFixed, ExternalLink } from 'lucide-react';
import { WatchedArea } from '../types/flood';
import { THAILAND_PROVINCES } from '../data/mockStations';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchedAreas: WatchedArea[];
  onAddArea: (area: WatchedArea) => void;
  onRemoveArea: (id: string) => void;
  onSelectArea: (area: WatchedArea) => void;
  currentCoords?: { lat: number; lng: number; name?: string } | null;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  watchedAreas,
  onAddArea,
  onRemoveArea,
  onSelectArea,
  currentCoords
}) => {
  const [selectedProvinceName, setSelectedProvinceName] = useState(THAILAND_PROVINCES[0].name);
  const [customLabel, setCustomLabel] = useState('');
  const [customLat, setCustomLat] = useState<string>('');
  const [customLng, setCustomLng] = useState<string>('');

  if (!isOpen) return null;

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const provObj = THAILAND_PROVINCES.find(p => p.name === selectedProvinceName);
    
    const lat = customLat ? parseFloat(customLat) : (provObj ? provObj.lat : 13.7563);
    const lng = customLng ? parseFloat(customLng) : (provObj ? provObj.lng : 100.5018);

    if (isNaN(lat) || isNaN(lng)) {
      alert('กรุณากรอกพิกัดละติจูดและลองจิจูดให้ถูกต้อง');
      return;
    }

    const newArea: WatchedArea = {
      id: Date.now().toString(),
      label: customLabel.trim() || `หมุดเฝ้าระวัง [${lat.toFixed(3)}, ${lng.toFixed(3)}]`,
      province: provObj ? provObj.name : 'กรุงเทพมหานคร',
      lat,
      lng,
      alertThreshold: 'warning'
    };

    onAddArea(newArea);
    setCustomLabel('');
    setCustomLat('');
    setCustomLng('');
  };

  const handleUseCurrentCoords = () => {
    if (currentCoords) {
      setCustomLat(currentCoords.lat.toFixed(5));
      setCustomLng(currentCoords.lng.toFixed(5));
      if (currentCoords.name && !customLabel) {
        setCustomLabel(currentCoords.name);
      }
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomLat(pos.coords.latitude.toFixed(5));
        setCustomLng(pos.coords.longitude.toFixed(5));
        if (!customLabel) {
          setCustomLabel('บ้านของฉัน (GPS)');
        }
      },
      (err) => {
        alert('ไม่สามารถดึงตำแหน่ง GPS ได้: ' + err.message);
      }
    );
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl glass-panel bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                พื้นที่เฝ้าระวังส่วนตัว (My Watchlist)
              </h2>
              <p className="text-xs text-slate-400">
                ปักหมุดบ้าน, ที่ทำงาน หรือจุดเสี่ยงบนแผนที่ เพื่อแสดงหมุด 📌 และรับการแจ้งเตือนทันที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Add New Area Form */}
          <form onSubmit={handleAddNew} className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                เพิ่มพื้นที่เฝ้าระวังใหม่
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUseGps}
                  className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="ใช้พิกัดตำแหน่งปัจจุบันจาก GPS"
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>📍 GPS ปัจจุบัน</span>
                </button>
                {currentCoords && (
                  <button
                    type="button"
                    onClick={handleUseCurrentCoords}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="ใช้พิกัดที่กำลังเลือกบนแผนที่"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>🗺️ พิกัดบนแผนที่</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ชื่อเรียก (เช่น บ้านฉัน, ที่ทำงาน, คอนโด)</label>
                <input
                  type="text"
                  placeholder="เช่น บ้านแม่, ลาดพร้าว 64..."
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">เลือกจังหวัด</label>
                <select
                  value={selectedProvinceName}
                  onChange={(e) => setSelectedProvinceName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                >
                  {THAILAND_PROVINCES.map((prov) => (
                    <option key={prov.name} value={prov.name}>
                      จ.{prov.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ละติจูด (Lat) - ไม่บังคับ</label>
                <input
                  type="number"
                  step="any"
                  placeholder="เช่น 13.7563"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ลองจิจูด (Lng) - ไม่บังคับ</label>
                <input
                  type="number"
                  step="any"
                  placeholder="เช่น 100.5018"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>📌 ปักหมุดบันทึกลงในรายการเฝ้าระวัง</span>
            </button>
          </form>

          {/* List of Saved Areas */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 block">
              รายการที่ปักหมุดไว้ ({watchedAreas.length})
            </span>

            {watchedAreas.length > 0 ? (
              watchedAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl border border-slate-700/60 transition-all group gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {area.label}
                      </h4>
                      <p className="text-xs text-slate-400">
                        จ.{area.province} ({area.lat.toFixed(4)}, {area.lng.toFixed(4)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${area.lat.toFixed(5)},${area.lng.toFixed(5)}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                      title="เปิดนำทางใน Google Maps"
                    >
                      <span>🗺️ G-Maps</span>
                    </a>

                    <a
                      href={`https://maps.apple.com/?daddr=${area.lat.toFixed(5)},${area.lng.toFixed(5)}&dirflg=d`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                      title="เปิดนำทางใน Apple Maps"
                    >
                      <span>🍏 Apple</span>
                    </a>

                    <button
                      onClick={() => {
                        onSelectArea(area);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                      title="ซูมและตรวจสอบสภาพอากาศพื้นที่นี้"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>ตรวจสอบ</span>
                    </button>

                    <button
                      onClick={() => onRemoveArea(area.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="ลบหมุดนี้ออกจากรายการ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                ยังไม่มีรายการพื้นที่เฝ้าระวังที่คุณบันทึกไว้ คลิกปุ่ม "เพิ่มพื้นที่เฝ้าระวังใหม่" ด้านบนเพื่อปักหมุด
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
