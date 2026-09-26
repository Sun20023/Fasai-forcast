import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { FloodMap } from './components/FloodMap';
import { RadarControls } from './components/RadarControls';
import { DetailSidebar } from './components/DetailSidebar';
import { AlertsModal } from './components/AlertsModal';
import { WatchlistModal } from './components/WatchlistModal';
import { EmergencyModal } from './components/EmergencyModal';

import { ZoneLegend } from './components/ZoneLegend';
import { 
  WaterStation, 
  DamInfo, 
  FloodAlert, 
  RadarData, 
  WeatherCondition, 
  RiverDischargeForecast, 
  WatchedArea,
  FloodZone
} from './types/flood';
import { 
  INITIAL_STATIONS, 
  INITIAL_DAMS, 
  INITIAL_ALERTS, 
  THAILAND_PROVINCES 
} from './data/mockStations';
import { FLOOD_COLOR_ZONES } from './data/floodZones';
import { FLOODED_ROADS_DATA } from './data/floodedRoads';
import { 
  fetchLiveWeather, 
  fetchRiverDischarge, 
  fetchRainViewerRadar, 
  calculateLocationThreat 
} from './services/weatherApi';
import { 
  getSoundEnabled, 
  setSoundEnabled, 
  requestNotificationPermission, 
  sendBrowserNotification, 
  getWatchedAreas, 
  saveWatchedAreas, 
  soundManager 
} from './services/notificationService';

export const App: React.FC = () => {
  // Main Data States
  const [stations, setStations] = useState<WaterStation[]>(INITIAL_STATIONS);
  const [dams, setDams] = useState<DamInfo[]>(INITIAL_DAMS);
  const [alerts, setAlerts] = useState<FloodAlert[]>(INITIAL_ALERTS);

  // Radar States
  const [radarData, setRadarData] = useState<RadarData | null>(null);
  const [currentRadarFrameIndex, setCurrentRadarFrameIndex] = useState(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState(false);
  const [isRadarVisible, setIsRadarVisible] = useState(true);
  const [radarOpacity, setRadarOpacity] = useState(0.75);
  const [activeZoneFilter, setActiveZoneFilter] = useState<'all' | 'red' | 'orange' | 'yellow' | 'green'>('all');

  // Selection & Deep Dive States
  const [selectedStation, setSelectedStation] = useState<WaterStation | null>(null);
  const [selectedDam, setSelectedDam] = useState<DamInfo | null>(null);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<WeatherCondition | null>(null);
  const [selectedDischarge, setSelectedDischarge] = useState<RiverDischargeForecast | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Map Navigation States
  const [centerCoords, setCenterCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [tempPinCoords, setTempPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Modals
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // System & Settings
  const [soundEnabled, setSoundState] = useState<boolean>(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [watchedAreas, setWatchedAreas] = useState<WatchedArea[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<{
    id: number;
    title: string;
    body: string;
    severity: 'critical' | 'warning' | 'info';
  } | null>(null);

  // Load Settings & Initial Radar
  useEffect(() => {
    setSoundState(getSoundEnabled());
    setWatchedAreas(getWatchedAreas());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Load Live RainViewer Radar
    loadRadar();
  }, []);

  const loadRadar = async () => {
    const data = await fetchRainViewerRadar();
    if (data && data.past && data.past.length > 0) {
      setRadarData(data);
      // Default to latest past frame
      setCurrentRadarFrameIndex(data.past.length - 1);
    }
  };

  // Radar Animation Loop
  useEffect(() => {
    if (!isRadarPlaying || !radarData) return;
    const allFrames = [...radarData.past, ...(radarData.nowcast || [])];
    if (allFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentRadarFrameIndex(prev => (prev + 1) % allFrames.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isRadarPlaying, radarData]);

  // Fetch Live Weather & Discharge for a Coordinate
  const fetchDeepTelemetry = useCallback(async (lat: number, lng: number) => {
    setIsLoadingWeather(true);
    try {
      const [weather, discharge] = await Promise.all([
        fetchLiveWeather(lat, lng),
        fetchRiverDischarge(lat, lng)
      ]);
      setSelectedWeather(weather);
      setSelectedDischarge(discharge);

      // Check if location has critical weather/storm threat and notify
      const threat = calculateLocationThreat(weather, discharge);
      if (threat.threatLevel === 'critical') {
        const alertTitle = `🔴 เตือนภัยสภาพอากาศวิกฤต (พิกัด ${lat.toFixed(2)}, ${lng.toFixed(2)})`;
        showToast(alertTitle, threat.reasons.join(', '), 'critical');
        if (soundEnabled) {
          soundManager.playAlert('critical');
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry', err);
    } finally {
      setIsLoadingWeather(false);
    }
  }, [soundEnabled]);

  // Handle Station Selection
  const handleSelectStation = useCallback((st: WaterStation) => {
    setSelectedStation(st);
    setSelectedDam(null);
    setCustomLocation(null);
    setCenterCoords({ lat: st.lat, lng: st.lng, zoom: 12 });
    setTempPinCoords({ lat: st.lat, lng: st.lng });
    fetchDeepTelemetry(st.lat, st.lng);
  }, [fetchDeepTelemetry]);

  // Handle Dam Selection
  const handleSelectDam = useCallback((dam: DamInfo) => {
    setSelectedDam(dam);
    setSelectedStation(null);
    setCustomLocation(null);
    setCenterCoords({ lat: dam.lat, lng: dam.lng, zoom: 12 });
    setTempPinCoords({ lat: dam.lat, lng: dam.lng });
    fetchDeepTelemetry(dam.lat, dam.lng);
  }, [fetchDeepTelemetry]);

  // Handle Map Click Anywhere
  const handleMapClick = useCallback((coords: { lat: number; lng: number }) => {
    setSelectedStation(null);
    setSelectedDam(null);
    setCustomLocation({
      lat: coords.lat,
      lng: coords.lng,
      name: `พิกัดตรวจวัดสด (${coords.lat.toFixed(3)}, ${coords.lng.toFixed(3)})`
    });
    setTempPinCoords(coords);
    fetchDeepTelemetry(coords.lat, coords.lng);
  }, [fetchDeepTelemetry]);

  // Handle Flood Zone Selection
  const handleSelectZone = useCallback((zone: FloodZone) => {
    setCenterCoords({ lat: zone.center[0], lng: zone.center[1], zoom: 11 });
    setTempPinCoords({ lat: zone.center[0], lng: zone.center[1] });
    setCustomLocation({
      lat: zone.center[0],
      lng: zone.center[1],
      name: `${zone.warningHeadline} (${zone.name})`
    });
    setSelectedStation(null);
    setSelectedDam(null);
    fetchDeepTelemetry(zone.center[0], zone.center[1]);
  }, [fetchDeepTelemetry]);

  // Select Location from Search (Subdistrict, District, Province, Station, Dam, etc.)
  const handleSelectLocation = (loc: { title: string; lat: number; lng: number; zoom?: number }) => {
    setCenterCoords({ lat: loc.lat, lng: loc.lng, zoom: loc.zoom || 12 });
    setTempPinCoords({ lat: loc.lat, lng: loc.lng });

    // Check if station exists at this exact coordinate
    const station = stations.find(s => Math.abs(s.lat - loc.lat) < 0.005 && Math.abs(s.lng - loc.lng) < 0.005);
    if (station) {
      handleSelectStation(station);
    } else {
      setSelectedStation(null);
      setSelectedDam(null);
      setCustomLocation({
        lat: loc.lat,
        lng: loc.lng,
        name: loc.title
      });
      fetchDeepTelemetry(loc.lat, loc.lng);
    }
  };

  // GPS Auto Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการระบุพิกัด GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenterCoords({ lat: latitude, lng: longitude, zoom: 13 });
        handleMapClick({ lat: latitude, lng: longitude });
        showToast('📍 ระบุตำแหน่งปัจจุบันแล้ว', `กำลังวิเคราะห์ระดับน้ำและพยากรณ์อากาศที่พิกัดของคุณ...`, 'info');
      },
      (err) => {
        alert(`ไม่สามารถดึงตำแหน่ง GPS ได้: ${err.message}`);
      }
    );
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundState(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      soundManager.playAlert('info');
    }
  };

  // Request Notification Permission
  const handleRequestNotification = async () => {
    const res = await requestNotificationPermission();
    setNotificationPermission(res);
    if (res === 'granted') {
      showToast('🔔 เปิดการแจ้งเตือนสำเร็จ', 'ระบบจะแจ้งเตือนเมื่อมีฝนตกหนัก น้ำล้นตลิ่ง หรือพายุเข้าในพื้นที่เฝ้าระวัง', 'info');
      soundManager.playAlert('info');
    } else {
      alert('คุณปฏิเสธการแจ้งเตือน สามารถเปิดได้ที่การตั้งค่าเบราว์เซอร์');
    }
  };

  // Watchlist Actions
  const handleAddWatchArea = (area: { label: string; province: string; lat: number; lng: number }) => {
    const newArea: WatchedArea = {
      id: Date.now().toString(),
      label: area.label,
      province: area.province,
      lat: area.lat,
      lng: area.lng,
      alertThreshold: 'warning'
    };
    const updated = [newArea, ...watchedAreas];
    setWatchedAreas(updated);
    saveWatchedAreas(updated);
    showToast('📌 บันทึกพื้นที่เฝ้าระวังแล้ว', `เพิ่ม ${area.label} ลงในรายการเฝ้าระวังของคุณเรียบร้อย`, 'info');
  };

  const handleRemoveWatchArea = (id: string) => {
    const updated = watchedAreas.filter(a => a.id !== id);
    setWatchedAreas(updated);
    saveWatchedAreas(updated);
  };

  const handleSelectWatchArea = (area: WatchedArea) => {
    setCenterCoords({ lat: area.lat, lng: area.lng, zoom: 11 });
    handleMapClick({ lat: area.lat, lng: area.lng });
  };

  // Refresh All Data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadRadar(),
      selectedStation ? fetchDeepTelemetry(selectedStation.lat, selectedStation.lng) : null,
      selectedDam ? fetchDeepTelemetry(selectedDam.lat, selectedDam.lng) : null,
      customLocation ? fetchDeepTelemetry(customLocation.lat, customLocation.lng) : null
    ]);
    setIsRefreshing(false);
    showToast('🔄 อัปเดตข้อมูลล่าสุดเรียบร้อย', 'ดึงข้อมูลสภาพอากาศ เรดาร์ และระดับน้ำล่าสุดสำเร็จ', 'info');
  };

  // Trigger Test Alert
  const handleTriggerTestAlert = (title: string, message: string, severity: 'critical' | 'warning' | 'info') => {
    const testAlert: FloodAlert = {
      id: Date.now().toString(),
      title,
      province: selectedStation?.province || selectedDam?.province || 'พื้นที่ทดสอบ',
      severity,
      type: 'flood',
      message,
      timestamp: 'เมื่อสักครู่',
      recommendedAction: 'ตรวจเช็คอุปกรณ์ป้องกันน้ำท่วมและติดตามข่าวสารอย่างใกล้ชิด',
      source: 'ระบบเตือนภัย fasaiforcast.com (ฟ้าใสพยากรณ์)'
    };

    sendBrowserNotification(testAlert);
    showToast(title, message, severity);
  };

  // Show Toast
  const showToast = (title: string, body: string, severity: 'critical' | 'warning' | 'info') => {
    const id = Date.now();
    setToastMessage({ id, title, body, severity });
    setTimeout(() => {
      setToastMessage(prev => prev?.id === id ? null : prev);
    }, 6000);
  };

  const criticalAlertCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="flex flex-col h-screen w-full max-w-[100vw] overflow-hidden overflow-x-hidden bg-slate-950 font-sans select-none">
      
      {/* 1. Header Navigation */}
      <Navbar
        onSelectLocation={handleSelectLocation}
        onLocateMe={handleLocateMe}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onOpenWatchlist={() => setIsWatchlistModalOpen(true)}
        onOpenEmergency={() => setIsEmergencyModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        notificationPermission={notificationPermission}
        onRequestNotification={handleRequestNotification}
        criticalAlertCount={criticalAlertCount}
        totalAlertCount={alerts.length}
        watchedAreas={watchedAreas}
        isRefreshing={isRefreshing}
        onRefreshData={handleRefresh}
      />

      {/* 2. Top Emergency Ticker */}
      <AlertBanner
        alerts={alerts}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onSelectAlert={(alt) => {
          const provObj = THAILAND_PROVINCES.find(p => p.name.includes(alt.province) || alt.province.includes(p.name));
          if (provObj) {
            handleSelectLocation({ title: provObj.name, lat: provObj.lat, lng: provObj.lng, zoom: 10 });
          }
        }}
      />

      {/* 3. Main Map Viewport */}
      <main className="relative flex-1 w-full min-h-0 overflow-hidden">
        
        {/* Leaflet Map */}
        <FloodMap
          stations={stations}
          dams={dams}
          alerts={alerts}
          floodZones={FLOOD_COLOR_ZONES}
          floodedRoads={FLOODED_ROADS_DATA}
          activeZoneFilter={activeZoneFilter}
          onSelectZone={handleSelectZone}
          radarData={radarData}
          currentRadarFrameIndex={currentRadarFrameIndex}
          isRadarVisible={isRadarVisible}
          radarOpacity={radarOpacity}
          selectedStation={selectedStation}
          onSelectStation={handleSelectStation}
          onSelectDam={handleSelectDam}
          onMapClickCoordinates={handleMapClick}
          centerCoords={centerCoords}
          tempPinCoords={tempPinCoords}
        />

        {/* Floating Color Risk Zone Legend & Filter */}
        <ZoneLegend
          zones={FLOOD_COLOR_ZONES}
          onSelectZone={handleSelectZone}
          activeFilter={activeZoneFilter}
          onChangeFilter={setActiveZoneFilter}
        />

        {/* Floating RainViewer Radar Dock */}
        <RadarControls
          radarData={radarData}
          currentFrameIndex={currentRadarFrameIndex}
          isPlaying={isRadarPlaying}
          onTogglePlay={() => setIsRadarPlaying(!isRadarPlaying)}
          onSelectFrame={(idx) => setCurrentRadarFrameIndex(idx)}
          opacity={radarOpacity}
          onChangeOpacity={(val) => setRadarOpacity(val)}
          isRadarVisible={isRadarVisible}
          onToggleRadarVisible={() => setIsRadarVisible(!isRadarVisible)}
        />

        {/* Deep Dive Sidebar */}
        <DetailSidebar
          selectedStation={selectedStation}
          selectedDam={selectedDam}
          customLocation={customLocation}
          weather={selectedWeather}
          riverDischarge={selectedDischarge}
          isLoadingWeather={isLoadingWeather}
          onClose={() => {
            setSelectedStation(null);
            setSelectedDam(null);
            setCustomLocation(null);
            setTempPinCoords(null);
          }}
          onAddToWatchlist={handleAddWatchArea}
          onTriggerTestAlert={handleTriggerTestAlert}
        />

      </main>

      {/* 4. In-App Notification Toast */}
      {toastMessage && (
        <div className={`fixed bottom-24 right-4 z-[1200] max-w-sm glass-dropdown rounded-2xl p-4 shadow-2xl border transition-all animate-bounce ${
          toastMessage.severity === 'critical'
            ? 'border-red-500/80 bg-red-950/90 text-red-100'
            : toastMessage.severity === 'warning'
            ? 'border-amber-500/80 bg-amber-950/90 text-amber-100'
            : 'border-cyan-500/80 bg-slate-900/90 text-cyan-100'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              {toastMessage.title}
            </h4>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {toastMessage.body}
          </p>
        </div>
      )}

      {/* 5. Modals */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={alerts}
        onSelectAlert={(alt) => {
          const provObj = THAILAND_PROVINCES.find(p => p.name.includes(alt.province) || alt.province.includes(p.name));
          if (provObj) {
            handleSelectLocation({ title: provObj.name, lat: provObj.lat, lng: provObj.lng, zoom: 10 });
          }
        }}
        onTestNotification={(alt) => sendBrowserNotification(alt)}
      />

      <WatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        watchedAreas={watchedAreas}
        onAddArea={(area) => {
          const updated = [area, ...watchedAreas];
          setWatchedAreas(updated);
          saveWatchedAreas(updated);
        }}
        onRemoveArea={handleRemoveWatchArea}
        onSelectArea={handleSelectWatchArea}
      />

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />

    </div>
  );
};

export default App;
