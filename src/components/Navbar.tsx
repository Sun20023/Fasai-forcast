import React, { useState, useEffect, useRef } from 'react';
import { 
  Waves, 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Navigation, 
  Search, 
  PhoneCall, 
  Bookmark, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  MapPin,
  X,
  Sparkles
} from 'lucide-react';
import { WatchedArea } from '../types/flood';
import { searchLocations, SearchResultItem } from '../services/geocodingService';

interface NavbarProps {
  onSelectLocation: (loc: { title: string; lat: number; lng: number; zoom?: number }) => void;
  onLocateMe: () => void;
  onOpenAlerts: () => void;
  onOpenWatchlist: () => void;
  onOpenEmergency: () => void;
  onOpenAiRoutePlanner?: () => void;
  onOpenFahsaiChat?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationPermission: NotificationPermission;
  onRequestNotification: () => void;
  criticalAlertCount: number;
  totalAlertCount: number;
  watchedAreas: WatchedArea[];
  isRefreshing: boolean;
  onRefreshData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSelectLocation,
  onLocateMe,
  onOpenAlerts,
  onOpenWatchlist,
  onOpenEmergency,
  onOpenAiRoutePlanner,
  onOpenFahsaiChat,
  soundEnabled,
  onToggleSound,
  notificationPermission,
  onRequestNotification,
  criticalAlertCount,
  totalAlertCount,
  watchedAreas,
  isRefreshing,
  onRefreshData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search when user types
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(searchTerm);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectItem = (item: SearchResultItem) => {
    onSelectLocation({
      title: item.title,
      lat: item.lat,
      lng: item.lng,
      zoom: item.zoom
    });
    setSearchTerm(item.title);
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-13 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Brand & Live Status */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink min-w-0">
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md sm:shadow-lg shadow-cyan-500/25 shrink-0">
            <Waves className="w-4 h-4 sm:w-6 sm:h-6 text-white animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-red-500"></span>
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-bold text-xs sm:text-base md:text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-white bg-clip-text text-transparent truncate">
                fasaiforcast.com
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                ฟ้าใส LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block truncate">
              ฟ้าใสพยากรณ์ · ระบบเฝ้าระวังน้ำท่วม & เรดาร์พายุแบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Global Deep Search (ตำบล, อำเภอ, จังหวัด, สถานี, เขื่อน) & GPS Locator */}
        <div className="flex-1 max-w-lg hidden md:flex items-center gap-2" ref={dropdownRef}>
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>

            <input
              type="text"
              placeholder="ค้นหาทุก ตำบล / อำเภอ / จังหวัด / ลุ่มน้ำ (เช่น ต.บางบาล, วารินชำราบ, แม่สาย)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleSelectItem(searchResults[0]);
                }
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-800/90 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all shadow-inner"
            />

            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dropdown Results */}
            {isDropdownOpen && searchTerm.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 max-h-80 overflow-y-auto glass-dropdown rounded-2xl shadow-2xl z-50 p-1.5 border border-slate-700/90 divide-y divide-slate-800/60">
                {isSearching && searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>กำลังค้นหาทุกตำบลและอำเภอทั่วประเทศ...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition-all flex items-start justify-between gap-2.5 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${item.color}`}>
                        {item.categoryLabel}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">
                    ไม่พบชื่อตำบล อำเภอ หรือสถานที่ "{searchTerm}" กรุณาลองคำค้นอื่น
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Locate Me (GPS) */}
          <button
            onClick={onLocateMe}
            title="ค้นหาพิกัดตำแหน่งปัจจุบันของคุณผ่าน GPS"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors shadow-sm shrink-0"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">พิกัดฉัน</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Refresh Button (desktop/tablet) */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            title="อัปเดตข้อมูลสดเดี๋ยวนี้"
            className="hidden sm:flex p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Web Push Notification Request (desktop/tablet) */}
          <button
            onClick={onRequestNotification}
            title={notificationPermission === 'granted' ? 'เปิดแจ้งเตือนบนเบราว์เซอร์แล้ว' : 'กดเพื่อเปิดรับการแจ้งเตือนเตือนภัย'}
            className={`hidden md:flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 ${
              notificationPermission === 'granted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            {notificationPermission === 'granted' ? (
              <>
                <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">แจ้งเตือนเปิดอยู่</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">เปิดแจ้งเตือน</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'ปิดเสียงแจ้งเตือนภัย' : 'เปิดเสียงแจ้งเตือนภัย'}
            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all shrink-0 ${
              soundEnabled 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Saved Areas / Watchlist */}
          <button
            onClick={onOpenWatchlist}
            title="พื้นที่เฝ้าระวังที่คุณบันทึกไว้"
            className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="hidden md:inline ml-1">พื้นที่เฝ้าระวัง</span>
            {watchedAreas.length > 0 && (
              <span className="absolute -top-1 -right-1 sm:static sm:ml-1 px-1 sm:px-1.5 py-0.2 bg-cyan-500 text-slate-950 font-bold rounded-full text-[9px] sm:text-[10px]">
                {watchedAreas.length}
              </span>
            )}
          </button>

          {/* AI Safe Flood-Free Route Planner Trigger */}
          {onOpenAiRoutePlanner && (
            <button
              onClick={onOpenAiRoutePlanner}
              title="ระบบ AI คำนวณปริมาณน้ำ & วางแผนเส้นทางเลี่ยงน้ำท่วม (Apple Maps & Google Maps)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-[11px] sm:text-xs font-bold shadow-md sm:shadow-lg shadow-cyan-600/30 transition-all shrink-0 active:scale-95 border border-cyan-400/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>AI เลี่ยงน้ำท่วม</span>
            </button>
          )}

          {/* Fahsai AI Chatbot Trigger */}
          {onOpenFahsaiChat && (
            <button
              onClick={onOpenFahsaiChat}
              title="คุยกับหนูน้อยฟ้าใสพยากรณ์ (AI วิเคราะห์สภาพอากาศและน้ำท่วมขัง)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-[11px] sm:text-xs font-bold shadow-md sm:shadow-lg shadow-pink-600/30 transition-all shrink-0 active:scale-95 border border-pink-400/40"
            >
              <span>👧</span>
              <span className="hidden sm:inline">หนูน้อยฟ้าใส</span>
            </button>
          )}

          {/* Emergency Alert Bulletin Trigger */}
          <button
            onClick={onOpenAlerts}
            className="relative flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-[11px] sm:text-xs font-semibold shadow-md sm:shadow-lg shadow-red-600/25 transition-all transform active:scale-95 shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <span>เตือนภัย</span>
            {criticalAlertCount > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-red-600 rounded-full text-[9px] sm:text-[10px] font-bold">
                {criticalAlertCount}
              </span>
            )}
          </button>

          {/* Emergency Helpline Hotline */}
          <button
            onClick={onOpenEmergency}
            title="เบอร์โทรฉุกเฉินกู้ภัยและช่วยเหลือน้ำท่วม ปภ. 1784"
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-semibold shadow-md sm:shadow-lg shadow-emerald-600/25 transition-all shrink-0 active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>1784</span>
          </button>

        </div>
      </div>

      {/* MOBILE SEARCH BAR: Visible on mobile screens (< md) */}
      <div className="md:hidden px-2.5 pb-2.5 pt-0.5" ref={dropdownRef}>
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
            </div>

            <input
              type="text"
              placeholder="ค้นหา ตำบล / อำเภอ / จังหวัด (เช่น แม่สาย, วารินชำราบ)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  handleSelectItem(searchResults[0]);
                }
              }}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 focus:border-cyan-500 shadow-inner"
            />

            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Mobile Dropdown Results */}
            {isDropdownOpen && searchTerm.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-1 max-h-72 overflow-y-auto glass-dropdown bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl z-[1500] p-1.5 border border-slate-700 divide-y divide-slate-800">
                {isSearching && searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>กำลังค้นหาทุกตำบลและอำเภอทั่วไทย...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 active:bg-slate-700/80 transition-all flex items-start justify-between gap-2 group"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-100 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${item.color}`}>
                        {item.categoryLabel}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">
                    ไม่พบข้อมูล "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile GPS Locate Me */}
          <button
            onClick={onLocateMe}
            title="ค้นหาพิกัดตำแหน่งปัจจุบันของคุณผ่าน GPS"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-colors shadow-sm shrink-0 active:scale-95"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          {/* Mobile AI Route Planner */}
          {onOpenAiRoutePlanner && (
            <button
              onClick={onOpenAiRoutePlanner}
              title="AI วางแผนเลี่ยงน้ำท่วม (Apple & Google Maps)"
              className="flex items-center gap-1 px-2 h-8 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 text-white font-bold text-[11px] shadow-sm shrink-0 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
              <span>AI</span>
            </button>
          )}

          {/* Mobile Fahsai Chatbot */}
          {onOpenFahsaiChat && (
            <button
              onClick={onOpenFahsaiChat}
              title="คุยกับหนูน้อยฟ้าใสพยากรณ์"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 border border-pink-400/40 text-white font-bold text-xs shadow-sm shrink-0 active:scale-95"
            >
              <span>👧</span>
            </button>
          )}

          {/* Mobile Refresh */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            title="อัปเดตข้อมูลสด"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors shadow-sm shrink-0 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
