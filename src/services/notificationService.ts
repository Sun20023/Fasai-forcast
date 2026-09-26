import { FloodAlert, WatchedArea } from '../types/flood';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a crisp modern warning chime
  playAlert(severity: 'critical' | 'warning' | 'info' = 'warning') {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (severity === 'critical') {
        // High pitch urgent two-tone alert
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now); // A5
        osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6
        osc1.frequency.setValueAtTime(880, now + 0.3);
        osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.45);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

        osc1.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.6);
      } else {
        // Pleasant modern notification chime (C5 -> G5)
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        osc2.frequency.setValueAtTime(1046.5, now + 0.12); // C6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.1);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
      }
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  }
}

export const soundManager = new SoundSynthesizer();

const WATCHED_KEY = 'thaiflood_watched_areas_v1';
const SOUND_ENABLED_KEY = 'thaiflood_sound_enabled';

export function getSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(SOUND_ENABLED_KEY);
  return val !== null ? val === 'true' : true;
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function sendBrowserNotification(alert: FloodAlert) {
  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    const icon = alert.severity === 'critical' ? '🔴' : '⚠️';
    try {
      new Notification(`${icon} ${alert.title}`, {
        body: `${alert.message}\nพื้นที่: ${alert.province}`,
        tag: alert.id,
        badge: 'https://cdn-icons-png.flaticon.com/512/3236/3236858.png',
        icon: 'https://cdn-icons-png.flaticon.com/512/3236/3236858.png'
      });
    } catch {
      // Ignore if browser restricts
    }
  }

  if (getSoundEnabled()) {
    soundManager.playAlert(alert.severity === 'critical' ? 'critical' : 'warning');
  }
}

export function getWatchedAreas(): WatchedArea[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(WATCHED_KEY);
  if (!stored) {
    const defaults: WatchedArea[] = [
      { id: '1', label: 'กรุงเทพมหานคร', province: 'กรุงเทพมหานคร', lat: 13.7563, lng: 100.5018, alertThreshold: 'warning' },
      { id: '2', label: 'พระนครศรีอยุธยา', province: 'พระนครศรีอยุธยา', lat: 14.3532, lng: 100.5684, alertThreshold: 'all' }
    ];
    localStorage.setItem(WATCHED_KEY, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveWatchedAreas(areas: WatchedArea[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WATCHED_KEY, JSON.stringify(areas));
}
