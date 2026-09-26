import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  Bot, 
  Navigation, 
  MapPin, 
  ExternalLink,
  ChevronDown,
  PhoneCall,
  Key,
  ShieldAlert,
  Flame,
  Check
} from 'lucide-react';
import { 
  FahsaiMessage, 
  FAHSAI_GREETING, 
  FAHSAI_AVATAR_URL,
  generateFahsaiResponseAsync, 
  FahsaiContext,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey
} from '../services/fahsaiAiService';
import { FloodedRoad, WeatherCondition, WaterStation, DamInfo, FloodAlert } from '../types/flood';

interface FahsaiChatbotProps {
  floodedRoads: FloodedRoad[];
  currentLocation?: { lat: number; lng: number; name?: string } | null;
  weather?: WeatherCondition | null;
  stations: WaterStation[];
  dams: DamInfo[];
  alerts: FloodAlert[];
  onOpenAiRoutePlanner?: () => void;
  onZoomToLocation?: (coords: { lat: number; lng: number; zoom?: number }) => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const FahsaiChatbot: React.FC<FahsaiChatbotProps> = ({
  floodedRoads,
  currentLocation,
  weather,
  stations,
  dams,
  alerts,
  onOpenAiRoutePlanner,
  onZoomToLocation,
  isOpen: controlledIsOpen,
  onToggleOpen
}) => {
  // Local or controlled open state
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(val);
    } else {
      setInternalIsOpen(val);
    }
  };

  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<FahsaiMessage[]>([FAHSAI_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // API Key Settings Modal
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getStoredGeminiApiKey());
  const [isKeySaved, setIsKeySaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const userMsg: FahsaiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Context for Fahsai
    const context: FahsaiContext = {
      currentLocation,
      weather,
      floodedRoads,
      stations,
      dams,
      alerts
    };

    try {
      const response = await generateFahsaiResponseAsync(query, context);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.warn('Fahsai response error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: { actionType: string; payload?: any }) => {
    if (action.actionType === 'ask_prompt' && action.payload) {
      handleSendMessage(action.payload);
    } else if (action.actionType === 'open_ai_router') {
      if (onOpenAiRoutePlanner) {
        onOpenAiRoutePlanner();
      }
    } else if (action.actionType === 'call_phone' && action.payload) {
      window.open(`tel:${action.payload}`, '_self');
    } else if (action.actionType === 'navigate_google' && action.payload) {
      window.open(action.payload, '_blank');
    } else if (action.actionType === 'navigate_apple' && action.payload) {
      window.open(action.payload, '_blank');
    } else if (action.actionType === 'zoom_location' && action.payload && onZoomToLocation) {
      onZoomToLocation(action.payload);
    }
  };

  const handleResetChat = () => {
    setMessages([FAHSAI_GREETING]);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiApiKey(apiKeyInput);
    setIsKeySaved(true);
    setTimeout(() => {
      setIsKeySaved(false);
      setShowKeyModal(false);
    }, 1200);
  };

  return (
    <>
      {/* 1. Floating Trigger Button with Hina Amano Avatar (Weathering with You) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[1100] group flex items-center gap-2.5 p-1.5 pr-4 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white shadow-2xl shadow-pink-500/25 border-2 border-pink-400/60 transition-all transform hover:scale-105 active:scale-95 animate-fade-in backdrop-blur-xl"
          title="คุยกับหนูน้อยฟ้าใสพยากรณ์ (ฮินะ อามาโนะ - Weathering with You AI)"
        >
          {/* Circular Anime Avatar with Glow & Online Status */}
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 ring-2 ring-pink-500/50">
            <img 
              src={FAHSAI_AVATAR_URL} 
              alt="หนูน้อยฟ้าใสพยากรณ์ (ฮินะ อามาโนะ)"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {/* Green Online Pulsing Dot */}
            <span className="absolute bottom-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900"></span>
            </span>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-black tracking-wide text-white flex items-center gap-1">
              <span>หนูน้อยฟ้าใสพยากรณ์</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
            </span>
            <span className="text-[10px] text-pink-300 font-bold">
              AI พยากรณ์น้ำ & ช่วยชีวิต 24 ชม.
            </span>
          </div>
        </button>
      )}

      {/* 2. Floating Chat Drawer / Window */}
      {isOpen && (
        <div 
          className={`fixed z-[1250] transition-all duration-300 flex flex-col shadow-2xl overflow-hidden glass-panel border border-pink-500/40 ${
            isMinimized 
              ? 'bottom-4 right-4 w-72 h-14 rounded-2xl' 
              : 'bottom-4 right-2 sm:right-6 w-[95vw] sm:w-[440px] max-w-full h-[85vh] sm:h-[620px] max-h-[92vh] rounded-3xl'
          } backdrop-blur-2xl bg-slate-950/95`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 sm:px-4 py-3 bg-gradient-to-r from-pink-600/90 via-purple-600/90 to-indigo-700/90 text-white shrink-0 border-b border-pink-400/30 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg shrink-0 ring-2 ring-pink-300/40">
                <img 
                  src={FAHSAI_AVATAR_URL} 
                  alt="หนูน้อยฟ้าใส" 
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-slate-900"></span>
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                    หนูน้อยฟ้าใสพยากรณ์
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                    Weathering AI
                  </span>
                </div>
                <p className="text-[10px] text-pink-100 truncate">
                  ฮินะ อามาโนะ • AI ดูแลความปลอดภัยในชีวิตและทรัพย์สิน
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowKeyModal(true)}
                title="ตั้งค่า Gemini 1.5 API Key"
                className={`p-1.5 rounded-lg transition-colors ${getStoredGeminiApiKey() ? 'text-yellow-300 hover:bg-white/20' : 'text-white/60 hover:text-white hover:bg-white/20'}`}
              >
                <Key className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetChat}
                title="ล้างประวัติการคุย"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'ขยายหน้าต่าง' : 'ย่อหน้าต่าง'}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="ปิดหน้าต่างแชต"
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Gemini API Key Modal */}
          {showKeyModal && (
            <div className="p-3 bg-slate-900 border-b border-pink-500/30 animate-fade-in text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-yellow-400" />
                  <span>ตั้งค่าโมเดล Google Gemini 1.5 (Pro / Flash)</span>
                </span>
                <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <p className="text-[11px] text-slate-300">
                ระบบมีโมเดลภัยพิบัติระดับสูงติดตั้งในตัวอยู่แล้ว (ไม่ต้องใส่คีย์ก็ใช้งานได้ 100%) แต่หากมี Google Gemini API Key สามารถใส่เพื่อเปิดพลังการตอบระดับโลกได้ค่ะ:
              </p>
              <form onSubmit={handleSaveApiKey} className="flex gap-1.5">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="วาง AIzaSy... ของคุณที่นี่ (ไม่บังคับ)"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-pink-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs"
                >
                  {isKeySaved ? 'บันทึกแล้ว! ✓' : 'บันทึก'}
                </button>
              </form>
            </div>
          )}

          {/* Chat Body (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 text-xs text-slate-200">
                {messages.map((msg) => {
                  const isFahsai = msg.sender === 'fahsai';
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isFahsai ? 'items-start' : 'items-end'} animate-fade-in`}
                    >
                      <div className="flex items-end gap-1.5 max-w-[94%] sm:max-w-[88%]">
                        {isFahsai && (
                          <div className="w-7 h-7 rounded-full overflow-hidden border border-pink-400 shadow shrink-0 mb-0.5 ring-1 ring-pink-500/30">
                            <img 
                              src={FAHSAI_AVATAR_URL} 
                              alt="ฮินะ" 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <div
                          className={`p-3 sm:p-3.5 rounded-2xl shadow-md ${
                            isFahsai
                              ? 'bg-slate-900/90 text-slate-100 border border-pink-500/25 rounded-bl-sm'
                              : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-sm'
                          }`}
                        >
                          {/* Model Badge */}
                          {isFahsai && msg.modelBadge && (
                            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-pink-500/20">
                              <span className="text-[9px] font-bold text-pink-300 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                                <span>{msg.modelBadge}</span>
                              </span>
                              <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                            </div>
                          )}

                          {/* Markdown formatted text */}
                          <div className="whitespace-pre-line leading-relaxed text-xs">
                            {msg.text}
                          </div>

                          {/* Data Card (if any) */}
                          {msg.dataCard && (
                            <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-pink-500/30 shadow-inner">
                              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-800">
                                <span className="font-bold text-[11px] text-pink-300">
                                  {msg.dataCard.title}
                                </span>
                                {msg.dataCard.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-pink-500/20 text-pink-200 font-semibold border border-pink-500/40">
                                    {msg.dataCard.badge}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                {msg.dataCard.items.map((item, idx) => (
                                  <div key={idx} className="flex flex-col">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className={`font-bold ${item.color || 'text-white'}`}>
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                              {msg.actions.map((act, actIdx) => (
                                <button
                                  key={actIdx}
                                  onClick={() => handleActionClick(act)}
                                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm ${
                                    act.actionType === 'call_phone'
                                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                                      : act.actionType === 'navigate_google'
                                      ? 'bg-blue-600/90 hover:bg-blue-500 text-white'
                                      : act.actionType === 'navigate_apple'
                                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                                      : act.actionType === 'open_ai_router'
                                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white'
                                      : 'bg-slate-800/90 hover:bg-pink-600/30 text-pink-200 border border-pink-500/30 hover:border-pink-400'
                                  }`}
                                >
                                  {act.actionType === 'call_phone' && <PhoneCall className="w-3 h-3 text-white" />}
                                  <span>{act.label}</span>
                                  {act.actionType.startsWith('navigate') && (
                                    <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {!msg.modelBadge && (
                        <span className="text-[9px] text-slate-500 mt-0.5 px-1">
                          {msg.timestamp}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-pink-300 animate-pulse pl-8">
                    <span>หนูน้อยฟ้าใสกำลังวิเคราะห์ข้อมูลอุทกวิทยา & ความปลอดภัย...</span>
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.3s]"></span>
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions Pills */}
              <div className="px-3 py-1.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">ถามด่วน:</span>
                <button
                  onClick={() => handleSendMessage('ถ้าน้ำเริ่มท่วมเข้าบ้านใกล้ถึงปลั๊กไฟ มีขั้นตอนตัดไฟและป้องกันไฟดูดยังไงบ้าง?')}
                  className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] whitespace-nowrap border border-rose-500/30 transition-colors shrink-0 font-bold"
                >
                  ⚡ น้ำท่วมกับปลั๊กไฟ
                </button>
                <button
                  onClick={() => handleSendMessage('รถเก๋งซีดานและรถยนต์ไฟฟ้า EV ลุยน้ำได้ลึกกี่เซนติเมตร และมีข้อควรระวังอะไรบ้าง?')}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] whitespace-nowrap border border-amber-500/30 transition-colors shrink-0 font-bold"
                >
                  🚗 รถเก๋ง & รถ EV ลุยน้ำ
                </button>
                <button
                  onClick={() => handleSendMessage('ตอนนี้ถนนเส้นไหนใน กทม. น้ำท่วมขังวิกฤตบ้างคะ?')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors shrink-0"
                >
                  🛣️ ถนนท่วมวิกฤต
                </button>
                <button
                  onClick={() => handleSendMessage('ช่วยทำนายปริมาณน้ำและระดับน้ำในอีก 3 ชั่วโมงข้างหน้าหน่อยค่ะ')}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap border border-slate-700/60 transition-colors shrink-0"
                >
                  ⏱️ ทำนายน้ำ 3 ชม.
                </button>
                <button
                  onClick={() => handleSendMessage('ขอเบอร์สายด่วนฉุกเฉินและหน่วยงานกู้ภัยน้ำท่วมทั้งหมดค่ะ')}
                  className="px-2 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] whitespace-nowrap border border-cyan-500/30 transition-colors shrink-0 font-bold"
                >
                  📞 สายด่วนกู้ภัย
                </button>
              </div>

              {/* Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2 sm:p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="ถามฟ้าใสได้เลยค่ะ (เช่น น้ำถึงปลั๊กไฟทำไง, วิภาวดีท่วมมั้ย)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-800/90 border border-slate-700 focus:border-pink-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-pink-500/25 active:scale-95 shrink-0"
                  title="ส่งคำถาม"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
