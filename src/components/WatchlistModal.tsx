import React, { useState } from 'react';
import { X, Bookmark, Plus, Trash2, MapPin, Navigation, Bell } from 'lucide-react';
import { WatchedArea } from '../types/flood';
import { THAILAND_PROVINCES } from '../data/mockStations';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchedAreas: WatchedArea[];
  onAddArea: (area: WatchedArea) => void;
  onRemoveArea: (id: string) => void;
  onSelectArea: (area: WatchedArea) => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  watchedAreas,
  onAddArea,
  onRemoveArea,
  onSelectArea
}) => {
  const [selectedProvinceName, setSelectedProvinceName] = useState(THAILAND_PROVINCES[0].name);
  const [customLabel, setCustomLabel] = useState('');

  if (!isOpen) return null;

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const provObj = THAILAND_PROVINCES.find(p => p.name === selectedProvinceName);
    if (!provObj) return;

    const newArea: WatchedArea = {
      id: Date.now().toString(),
      label: customLabel.trim() || `พื้นที่ จ.${provObj.name}`,
      province: provObj.name,
      lat: provObj.lat,
      lng: provObj.lng,
      alertThreshold: 'warning'
    };

    onAddArea(newArea);
    setCustomLabel('');
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
                บันทึกบ้าน, ที่ทำงาน หรือพื้นที่ของคุณเพื่อรับการแจ้งเตือนทันท่วงที
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
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              เพิ่มพื้นที่เฝ้าระวังใหม่
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ชื่อเรียก (เช่น บ้าน, คอนโด, สวน)</label>
                <input
                  type="text"
                  placeholder="เช่น บ้านแม่, ที่ทำงาน..."
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
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกลงในรายการเฝ้าระวัง</span>
            </button>
          </form>

          {/* List of Saved Areas */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-slate-400 block">
              รายการที่บันทึกไว้ ({watchedAreas.length})
            </span>

            {watchedAreas.length > 0 ? (
              watchedAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl border border-slate-700/60 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {area.label}
                      </h4>
                      <p className="text-xs text-slate-400">
                        จ.{area.province} ({area.lat.toFixed(2)}, {area.lng.toFixed(2)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectArea(area);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
                      title="ซูมและตรวจสอบสภาพอากาศพื้นที่นี้"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>ตรวจสอบ</span>
                    </button>

                    <button
                      onClick={() => onRemoveArea(area.id)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="ลบออกจากรายการ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                ยังไม่มีรายการพื้นที่เฝ้าระวังที่คุณบันทึกไว้
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
