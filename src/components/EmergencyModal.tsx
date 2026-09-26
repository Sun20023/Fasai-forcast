import React from 'react';
import { X, PhoneCall, ShieldAlert, Zap, AlertTriangle, LifeBuoy, HeartPulse, CheckSquare } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hotlines = [
    { number: '1784', name: 'กรมป้องกันและบรรเทาสาธารณภัย (ปภ.)', desc: 'สายด่วนแจ้งเหตุน้ำท่วม ดินถล่ม ขอความช่วยเหลืออพยพ 24 ชม.', color: 'border-red-500/40 bg-red-950/30 text-red-400' },
    { number: '1460', name: 'ศูนย์ปฏิบัติการน้ำอัจฉริยะ (SWOC) กรมชลประทาน', desc: 'สอบถามสถานการณ์น้ำเขื่อน คลองชลประทาน และการระบายน้ำ', color: 'border-blue-500/40 bg-blue-950/30 text-blue-400' },
    { number: '1669', name: 'สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)', desc: 'เจ็บป่วยฉุกเฉิน อุบัติเหตุ กู้ชีพผู้ประสบภัยทางน้ำตลอด 24 ชม.', color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400' },
    { number: '1182', name: 'ศูนย์เตือนภัยสภาพอากาศ กรมอุตุนิยมวิทยา', desc: 'ตรวจสอบเส้นทางพายุ ปริมาณฝน และคลื่นลมทะเล', color: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-400' },
    { number: '1193', name: 'ตำรวจทางหลวง', desc: 'สอบถามเส้นทางน้ำท่วมทางหลวง และทางเลี่ยงทั่วประเทศ', color: 'border-amber-500/40 bg-amber-950/30 text-amber-400' },
    { number: '1146', name: 'กรมทางหลวงชนบท', desc: 'แจ้งถนนชนบทและสะพานขาด น้ำท่วมทางสัญจร', color: 'border-purple-500/40 bg-purple-950/30 text-purple-400' },
    { number: '1555', name: 'ศูนย์รับเรื่องร้องทุกข์ กทม.', desc: 'แจ้งน้ำท่วมขังรอการระบายในพื้นที่กรุงเทพมหานคร', color: 'border-indigo-500/40 bg-indigo-950/30 text-indigo-400' }
  ];

  const safetySteps = [
    {
      title: '1. ความปลอดภัยเรื่องกระแสไฟฟ้า (อันตรายสูงสุด)',
      points: [
        'สับคัทเอาท์ตัดกระแสไฟฟ้าชั้นล่างทันทีเมื่อระดับน้ำเริ่มเข้าใกล้ระดับปลั๊กไฟ',
        'ห้ามสัมผัสสวิตช์ไฟหรือเครื่องใช้ไฟฟ้าขณะตัวเปียกหรือยืนแช่น้ำเด็ดขาด',
        'หากพบเสาไฟหรือสายไฟขาดจมน้ำ ให้หลีกเลี่ยงระยะห่างอย่างน้อย 10 เมตร'
      ]
    },
    {
      title: '2. สัตว์มีพิษและของมีคมที่มากับน้ำ',
      points: [
        'ระวังสัตว์มีพิษ (งู ตะขาบ แมงป่อง) หนีน้ำขึ้นมาหลบซ่อนตามซอกตู้และที่สูง',
        'ใส่รองเท้าบูทหรือรองเท้าหุ้มส้นทุกครั้งเมื่อจำเป็นต้องเดินลุยน้ำ'
      ]
    },
    {
      title: '3. การเตรียมถุงยังชีพจำเป็น (Go-Bag)',
      points: [
        'น้ำดื่มสะอาดอย่างน้อย 3 ลิตร/คน/วัน พร้อมอาหารแห้งสำเร็จรูป',
        'ยาประจำตัว ยาแก้ปวด ยาใส่แผล และพลาสเตอร์ยา',
        'ไฟฉาย แบตเตอรี่สำรอง (Powerbank) และถุงซิปล็อกกันน้ำสำหรับเอกสารสำคัญ'
      ]
    }
  ];

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-panel bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                สายด่วนฉุกเฉิน & คู่มือรับมือน้ำท่วม
              </h2>
              <p className="text-xs text-slate-400">
                เบอร์โทรติดต่อหน่วยงานช่วยเหลือ 24 ชั่วโมง และข้อควรระวังเพื่อความปลอดภัย
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Hotlines */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              สายด่วนแจ้งเหตุกู้ภัย (กดเพื่อโทรออกทันที)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {hotlines.map(h => (
                <a
                  key={h.number}
                  href={`tel:${h.number}`}
                  className={`p-3 rounded-2xl border transition-all hover:scale-[1.02] flex items-start justify-between gap-2 ${h.color}`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-black tracking-tight">{h.number}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-white/10 rounded-full font-bold">24 ชม.</span>
                    </div>
                    <p className="text-xs font-bold text-slate-100">{h.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{h.desc}</p>
                  </div>
                  <PhoneCall className="w-4 h-4 shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>

          {/* Safety Checklist */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              แนวทางปฏิบัติและข้อควรระวังสำคัญ
            </h3>

            <div className="space-y-3.5 text-xs text-slate-300">
              {safetySteps.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    {step.title}
                  </h4>
                  <ul className="list-disc pl-5 space-y-0.5 text-slate-400 text-[11px]">
                    {step.points.map((pt, pIdx) => (
                      <li key={pIdx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
