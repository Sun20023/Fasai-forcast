import React, { useState } from 'react';
import { 
  X, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  CloudRain, 
  Wind, 
  Waves, 
  BellRing,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { FloodAlert, AlertSeverity } from '../types/flood';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: FloodAlert[];
  onSelectAlert: (alert: FloodAlert) => void;
  onTestNotification: (alert: FloodAlert) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectAlert,
  onTestNotification
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    if (filterType !== 'all' && a.type !== filterType) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-3xl glass-panel bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                ศูนย์รวมประกาศเตือนภัยน้ำท่วม & สภาพอากาศ
              </h2>
              <p className="text-xs text-slate-400">
                ข้อมูลบูรณาการจาก สทนช., กรมชลประทาน, กรมอุตุนิยมวิทยา, และ ปภ.
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

        {/* Filter Pills */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Severity Filters */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] mr-1">ระดับ:</span>
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'critical', label: '🔴 วิกฤต' },
              { id: 'warning', label: '🟠 เตือนภัย' },
              { id: 'watch', label: '🟡 เฝ้าระวัง' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterSeverity(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterSeverity === tab.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400 text-[11px] mr-1">ประเภท:</span>
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'flood', label: '🌊 น้ำท่วม' },
              { id: 'storm', label: '⚡ พายุ' },
              { id: 'dam', label: '🏔️ น้ำเขื่อน' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterType === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* List of Alerts */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => {
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    isCrit 
                      ? 'bg-red-950/40 border-red-500/50 hover:border-red-400' 
                      : isWarn 
                      ? 'bg-amber-950/40 border-amber-500/50 hover:border-amber-400' 
                      : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCrit ? 'bg-red-500 text-white' :
                        isWarn ? 'bg-amber-500 text-slate-950' :
                        'bg-yellow-400 text-slate-950'
                      }`}>
                        {isCrit ? 'วิกฤตล้นตลิ่ง' : isWarn ? 'เตือนภัย' : 'เฝ้าระวัง'}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        📍 จ.{alert.province} {alert.district ? `(${alert.district})` : ''}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">{alert.timestamp}</span>
                  </div>

                  <h3 className="font-bold text-sm text-white mb-1.5 leading-snug">
                    {alert.title}
                  </h3>

                  <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                    {alert.message}
                  </p>

                  {alert.recommendedAction && (
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs text-amber-200/90 mb-3">
                      <strong>💡 สิ่งที่ควรทำ:</strong> {alert.recommendedAction}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>ที่มา: {alert.source}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onTestNotification(alert)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium transition-colors"
                        title="ทดสอบส่งเสียงและการแจ้งเตือนระบบสำหรับรายการนี้"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>ทดสอบแจ้งเตือน</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectAlert(alert);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>นำทางบนแผนที่</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              ไม่พบประกาศเตือนภัยในหมวดหมู่ที่เลือก
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
