export type AlertSeverity = 'info' | 'watch' | 'warning' | 'critical';

export interface WaterStation {
  id: string;
  name: string;
  stationCode: string;
  river: string;
  basin: string;
  subdistrict?: string;
  district: string;
  province: string;
  lat: number;
  lng: number;
  waterLevel: number; // เมตร (รทก. หรือ จากท้องน้ำ)
  bankLevel: number; // ระดับตลิ่ง (เมตร)
  warningLevel: number; // ระดับเตือนภัย (เมตร)
  dischargeRate: number; // ปริมาณน้ำไหลผ่าน (ลบ.ม./วินาที)
  capacityPercent: number; // % เทียบความจุลำน้ำ
  status: 'normal' | 'watch' | 'warning' | 'critical';
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: string;
  notes?: string;
}

export interface DamInfo {
  id: string;
  name: string;
  province: string;
  river: string;
  lat: number;
  lng: number;
  capacityMax: number; // ล้าน ลบ.ม.
  currentStorage: number; // ล้าน ลบ.ม.
  storagePercent: number; // %
  inflowRate: number; // ล้าน ลบ.ม./วัน
  dischargeRate: number; // ล้าน ลบ.ม./วัน
  status: 'normal' | 'watch' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface WeatherCondition {
  temp: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  rainCurrent: number; // mm/h
  weatherCode: number;
  weatherDesc: string;
  isStorm: boolean;
  time: string;
  hourly: {
    times: string[];
    rain: number[];
    pop: number[];
    temperatures: number[];
  };
  daily: {
    dates: string[];
    weatherCodes: number[];
    rainSum: number[];
    rainProbMax: number[];
    tempMax: number[];
    tempMin: number[];
  };
}

export interface RiverDischargeForecast {
  dates: string[];
  discharge: number[];
  dischargeMean: number[];
  dischargeMax: number[];
}

export interface FloodAlert {
  id: string;
  title: string;
  province: string;
  district?: string;
  severity: AlertSeverity;
  type: 'flood' | 'storm' | 'rain' | 'dam' | 'tide';
  message: string;
  timestamp: string;
  waterLevelChange?: string;
  recommendedAction: string;
  source: string;
}

export interface RadarData {
  host: string;
  past: { time: number; path: string }[];
  nowcast: { time: number; path: string }[];
}

export interface WatchedArea {
  id: string;
  label: string; // e.g. "บ้าน", "คอนโด", "ที่ทำงาน"
  province: string;
  lat: number;
  lng: number;
  alertThreshold: 'all' | 'warning' | 'critical';
}

export interface FloodZone {
  id: string;
  name: string;
  basin: string;
  province: string;
  districts: string[];
  level: 'red' | 'orange' | 'yellow' | 'green';
  riskType: 'น้ำล้นตลิ่ง' | 'น้ำท่วมฉับพลัน/น้ำป่า' | 'น้ำรอระบาย' | 'น้ำทะเลหนุนสูง' | 'ปกติ';
  statusDescription: string;
  waterDepth?: string;
  affectedCount?: string;
  warningHeadline: string;
  recommendedAction: string;
  coordinates: [number, number][];
  center: [number, number];
}

export interface FloodedRoad {
  id: string;
  name: string;
  routeNumber?: string;
  province: string;
  district: string;
  subdistrict?: string;
  status: 'critical' | 'warning' | 'passable'; // critical = แดง (น้ำขังสูง/ห้ามผ่าน), warning = ส้ม (รถเล็กห้ามผ่าน), passable = เขียว (ผ่านได้)
  waterDepth: string; // เช่น "น้ำท่วมขัง 35-50 ซม."
  waterDepthCm: number; // ความลึกเซนติเมตร
  passability: 'impassable' | 'small_vehicle_prohibited' | 'passable_with_caution';
  passabilityText: string; // เช่น "ปิดการจราจร / รถทุกชนิดห้ามผ่าน" หรือ "รถเล็กไม่ควรผ่าน"
  reportedTime: string;
  lastUpdatedMinutesAgo?: number;
  cause: string;
  detourAdvice: string;
  coordinates: [number, number][]; // พิกัดเส้นทางถนน
  center: [number, number]; // จุดศูนย์กลางสำหรับปักหมุด/ซูม
  sensorSource?: string; // e.g. "สำนักการระบายน้ำ กทม. (BMA DDS)"
  pumpStatus?: string; // e.g. "สถานีสูบน้ำเดินเครื่องเต็มกำลัง"
  drainageTrend?: 'rising' | 'receding' | 'stable';
  trafficSpeed?: string; // e.g. "รถชะลอตัว 5-10 กม./ชม."
  liveRainRate?: number; // mm/h
}

export interface AiFloodForecast {
  roadId: string;
  roadName: string;
  province: string;
  currentDepthCm: number;
  predictedDepth1h: number;
  predictedDepth3h: number;
  predictedDepth6h: number;
  waterVolumeInflowM3PerHr: number; // ปริมาณน้ำหลากไหลเข้า (ลบ.ม./ชม.)
  drainageRateM3PerHr: number; // อัตราสูบระบายของเครื่องสูบน้ำ (ลบ.ม./ชม.)
  netAccumulationRateCmPerHr: number; // อัตราน้ำขังสุทธิ (ซม./ชม.)
  riskEscalationLevel: 'critical' | 'high' | 'moderate' | 'low';
  aiAnalysisSummary: string;
}

export interface AiSafeRouteOption {
  id: string;
  title: string;
  routeType: 'safe_recommended' | 'alternative_tollway' | 'risky_shortest';
  isSafe: boolean;
  floodedPointsAvoided: number;
  distanceKm: number;
  estimatedTimeMin: number;
  safetyScorePercent: number; // 0 - 100
  vehicleRecommendation: 'all_vehicles' | 'high_clearance_only' | 'prohibited';
  summaryDescription: string;
  keyWaypointsDescription: string[];
  coordinates: [number, number][]; // polyline สำหรับวาดบนแผนที่
  googleMapsUrl: string;
  appleMapsUrl: string;
}

export interface AiRoutePlanResult {
  originName: string;
  originCoords: [number, number];
  destinationName: string;
  destinationCoords: [number, number];
  timestamp: string;
  routes: AiSafeRouteOption[];
  floodedRoadsInVicinity: FloodedRoad[];
  aiHydrologyInsight: {
    bkkOverallRainVolumeMm: number;
    peakInflowWindow: string;
    safestTravelAdvice: string;
  };
}
