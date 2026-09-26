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
