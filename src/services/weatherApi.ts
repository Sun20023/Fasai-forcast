import { WeatherCondition, RiverDischargeForecast, RadarData } from '../types/flood';

export function getWmoWeatherDescription(code: number): { text: string; icon: string; isStorm: boolean } {
  switch (code) {
    case 0:
      return { text: 'ท้องฟ้าแจ่มใส', icon: '☀️', isStorm: false };
    case 1:
      return { text: 'ท้องฟ้าโปร่งเกือบหมด', icon: '🌤️', isStorm: false };
    case 2:
      return { text: 'มีเมฆเป็นบางส่วน', icon: '⛅', isStorm: false };
    case 3:
      return { text: 'มีเมฆมาก/ครึ้มฟ้าครึ้มฝน', icon: '☁️', isStorm: false };
    case 45:
    case 48:
      return { text: 'มีหมอกหนา', icon: '🌫️', isStorm: false };
    case 51:
    case 53:
      return { text: 'ฝนละอองเบาบาง', icon: '🌦️', isStorm: false };
    case 55:
      return { text: 'ฝนละอองหนาแน่น', icon: '🌧️', isStorm: false };
    case 61:
      return { text: 'ฝนตกเล็กน้อย', icon: '🌧️', isStorm: false };
    case 63:
      return { text: 'ฝนตกปานกลาง', icon: '🌧️', isStorm: false };
    case 65:
      return { text: 'ฝนตกหนัก', icon: '⛈️', isStorm: false };
    case 80:
      return { text: 'ฝนตกซู่เป็นระยะ', icon: '🌦️', isStorm: false };
    case 81:
      return { text: 'ฝนตกซู่ปานกลาง', icon: '🌧️', isStorm: false };
    case 82:
      return { text: 'ฝนตกซู่รุนแรงมาก เสี่ยงน้ำท่วมฉับพลัน', icon: '⛈️', isStorm: true };
    case 95:
      return { text: 'พายุฝนฟ้าคะนอง', icon: '🌩️', isStorm: true };
    case 96:
    case 99:
      return { text: 'พายุฝนฟ้าคะนองรุนแรง ลมกระโชก/ลูกเห็บ', icon: '⚡⛈️', isStorm: true };
    default:
      return { text: 'สภาพอากาศแปรปรวน', icon: '🌦️', isStorm: false };
  }
}

export async function fetchLiveWeather(lat: number, lng: number): Promise<WeatherCondition> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m&hourly=temperature_2m,precipitation,rain,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=Asia%2FBangkok&forecast_days=7`;

  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) {
    throw new Error(`Weather fetch failed: ${res.statusText}`);
  }
  const data = await res.json();
  const current = data.current || {};
  const hourly = data.hourly || {};
  const daily = data.daily || {};

  const weatherCode = current.weather_code ?? 0;
  const wmoInfo = getWmoWeatherDescription(weatherCode);

  // Take next 24 hours
  const next24Times = (hourly.time || []).slice(0, 24);
  const next24Rain = (hourly.precipitation || []).slice(0, 24);
  const next24Pop = (hourly.precipitation_probability || []).slice(0, 24);
  const next24Temp = (hourly.temperature_2m || []).slice(0, 24);

  return {
    temp: current.temperature_2m ?? 28,
    humidity: current.relative_humidity_2m ?? 75,
    windSpeed: current.wind_speed_10m ?? 12,
    windGust: current.wind_gusts_10m ?? 25,
    rainCurrent: current.precipitation ?? 0,
    weatherCode,
    weatherDesc: wmoInfo.text,
    isStorm: wmoInfo.isStorm || (current.wind_gusts_10m > 40),
    time: current.time || new Date().toISOString(),
    hourly: {
      times: next24Times,
      rain: next24Rain,
      pop: next24Pop,
      temperatures: next24Temp
    },
    daily: {
      dates: daily.time || [],
      weatherCodes: daily.weather_code || [],
      rainSum: daily.precipitation_sum || [],
      rainProbMax: daily.precipitation_probability_max || [],
      tempMax: daily.temperature_2m_max || [],
      tempMin: daily.temperature_2m_min || []
    }
  };
}

export async function fetchRiverDischarge(lat: number, lng: number): Promise<RiverDischargeForecast | null> {
  try {
    const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge,river_discharge_mean,river_discharge_max&forecast_days=7`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.daily || !data.daily.time) return null;

    return {
      dates: data.daily.time,
      discharge: data.daily.river_discharge || [],
      dischargeMean: data.daily.river_discharge_mean || [],
      dischargeMax: data.daily.river_discharge_max || []
    };
  } catch (err) {
    console.warn('River discharge API not available for location, fallback used', err);
    return null;
  }
}

export async function fetchRainViewerRadar(): Promise<RadarData | null> {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      host: data.host || 'https://tilecache.rainviewer.com',
      past: data.radar?.past || [],
      nowcast: data.radar?.nowcast || []
    };
  } catch (err) {
    console.warn('RainViewer API failed', err);
    return null;
  }
}

/**
 * Calculates real-time flood & storm threat level for a coordinate
 */
export function calculateLocationThreat(weather: WeatherCondition, riverDischarge: RiverDischargeForecast | null) {
  let score = 0;
  const reasons: string[] = [];

  // 1. Current rain rate
  if (weather.rainCurrent >= 25) {
    score += 45;
    reasons.push(`ฝนตกหนักมากในขณะนี้ (${weather.rainCurrent.toFixed(1)} มม./ชม.)`);
  } else if (weather.rainCurrent >= 10) {
    score += 25;
    reasons.push(`ฝนตกปานกลางต่อเนื่อง (${weather.rainCurrent.toFixed(1)} มม./ชม.)`);
  } else if (weather.rainCurrent > 2) {
    score += 10;
  }

  // 2. Storm wind gusts
  if (weather.windGust >= 55) {
    score += 35;
    reasons.push(`ลมพายุพัดกระโชกแรงมาก (${weather.windGust.toFixed(0)} กม./ชม.)`);
  } else if (weather.windGust >= 40) {
    score += 20;
    reasons.push(`ลมกระโชกแรง (${weather.windGust.toFixed(0)} กม./ชม.)`);
  }

  // 3. 24h & upcoming rain sum
  const rainNext24 = weather.hourly.rain.reduce((a, b) => a + (b || 0), 0);
  if (rainNext24 >= 80) {
    score += 35;
    reasons.push(`คาดการณ์ปริมาณฝนสะสม 24 ชม. สูงวิกฤต (${rainNext24.toFixed(1)} มม.)`);
  } else if (rainNext24 >= 45) {
    score += 20;
    reasons.push(`มีแนวโน้มฝนตกสะสมต่อเนื่อง (${rainNext24.toFixed(1)} มม./วัน)`);
  }

  // 4. Storm WMO codes
  if (weather.isStorm) {
    score += 25;
    reasons.push('ระบบพยากรณ์ตรวจพบพายุฝนฟ้าคะนองในบริเวณนี้');
  }

  // 5. River discharge forecast
  if (riverDischarge && riverDischarge.discharge.length > 0) {
    const currentDischarge = riverDischarge.discharge[0];
    const meanDischarge = riverDischarge.dischargeMean[0] || 1;
    if (currentDischarge > 0 && meanDischarge > 0) {
      const ratio = currentDischarge / meanDischarge;
      if (ratio > 2.0) {
        score += 35;
        reasons.push(`อัตราการไหลของแม่น้ำสูงกว่าค่าเฉลี่ยปกติ ${((ratio - 1) * 100).toFixed(0)}%`);
      } else if (ratio > 1.4) {
        score += 18;
        reasons.push(`ระดับมวลน้ำในลำน้ำสูงขึ้น`);
      }
    }
  }

  let threatLevel: 'normal' | 'watch' | 'warning' | 'critical' = 'normal';
  if (score >= 65) {
    threatLevel = 'critical';
  } else if (score >= 40) {
    threatLevel = 'warning';
  } else if (score >= 20) {
    threatLevel = 'watch';
  }

  return {
    score,
    threatLevel,
    reasons: reasons.length > 0 ? reasons : ['สภาพอากาศและระดับน้ำอยู่ในเกณฑ์ปกติ']
  };
}
