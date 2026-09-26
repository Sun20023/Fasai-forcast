import React, { useState, useEffect } from 'react';
import { AlertOctagon, ChevronRight, Wind, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { FloodAlert } from '../types/flood';

interface AlertBannerProps {
  alerts: FloodAlert[];
  onOpenAlerts: () => void;
  onSelectAlert: (alert: FloodAlert) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  alerts,
  onOpenAlerts,
  onSelectAlert
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const criticalAndWarnings = alerts.filter(
    a => a.severity === 'critical' || a.severity === 'warning'
  );

  // Auto-rotate ticker every 5 seconds
  useEffect(() => {
    if (criticalAndWarnings.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % criticalAndWarnings.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [criticalAndWarnings.length]);

  if (criticalAndWarnings.length === 0) {
    return (
      <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>สภาวะน้ำและพยากรณ์อากาศทั่วประเทศอยู่ในเกณฑ์ปกติ ไม่มีรายงานวิกฤติน้ำล้นตลิ่งเร่งด่วน</span>
        </div>
      </div>
    );
  }

  const currentAlert = criticalAndWarnings[currentIndex];
  const isCritical = currentAlert.severity === 'critical';

  return (
    <aside 
      aria-label="ประกาศเตือนภัยด่วน"
      className={`border-b transition-colors duration-500 ${
        isCritical 
          ? 'bg-gradient-to-r from-red-950/90 via-red-900/80 to-slate-900 border-red-800/60 text-red-100' 
          : 'bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-slate-900 border-amber-800/60 text-amber-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
        
        {/* Alert Content */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-[11px] uppercase tracking-wider shrink-0 ${
            isCritical
              ? 'bg-red-500 text-white shadow-md shadow-red-500/30 animate-pulse'
              : 'bg-amber-500 text-slate-950'
          }`}>
            {isCritical ? <AlertOctagon className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            <span>{isCritical ? 'วิกฤต' : 'เตือนภัย'}</span>
          </span>

          <span className="font-semibold text-slate-200 hidden sm:inline shrink-0 text-xs">
            [{currentAlert.province}]
          </span>

          <p className="truncate text-slate-100 text-xs sm:text-sm font-medium">
            <span className="text-white font-bold">{currentAlert.province}: </span>
            {currentAlert.title}
          </p>
        </div>

        {/* Action Button & Alert Carousel Indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          {criticalAndWarnings.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 text-[11px] text-slate-300">
              <span>{currentIndex + 1}</span>
              <span>/</span>
              <span>{criticalAndWarnings.length}</span>
            </div>
          )}

          <button
            onClick={() => onSelectAlert(currentAlert)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs font-semibold text-white transition-all backdrop-blur-sm shrink-0"
          >
            <span>ซูมดู</span>
            <span className="hidden sm:inline">พื้นที่นี้</span>
            <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>

          <button
            onClick={onOpenAlerts}
            className="hidden xs:flex items-center gap-0.5 text-[11px] sm:text-xs text-slate-300 hover:text-white underline decoration-slate-500 transition-colors shrink-0"
          >
            <span>ทั้งหมด</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </aside>
  );
};
