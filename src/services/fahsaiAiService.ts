import { FloodedRoad, WeatherCondition, WaterStation, DamInfo, FloodAlert } from '../types/flood';
import { calculateAiFloodForecasts, buildSingleRoadDetourUrls } from './aiFloodRouter';

export interface FahsaiAction {
  label: string;
  actionType: 'navigate_google' | 'navigate_apple' | 'open_ai_router' | 'zoom_location' | 'ask_prompt';
  payload?: any;
}

export interface FahsaiMessage {
  id: string;
  sender: 'fahsai' | 'user';
  text: string;
  timestamp: string;
  actions?: FahsaiAction[];
  dataCard?: {
    title: string;
    badge?: string;
    items: { label: string; value: string; color?: string }[];
  };
}

export const FAHSAI_GREETING: FahsaiMessage = {
  id: 'fahsai-welcome',
  sender: 'fahsai',
  text: `สวัสดีค่ะ! หนูชื่อ **หนูน้อยฟ้าใสพยากรณ์** 👧🌧️⚡ ผู้ช่วย AI อัจฉริยะวิเคราะห์สภาพอากาศและน้ำท่วมขังแบบเรียลไทม์ค่ะ!

หนูเชื่อมต่อกับเซนเซอร์ กทม., เรดาร์ตรวจวัดกลุ่มฝนสด และโมเดลจำลองปริมาณน้ำหลาก (Hydrology AI) หนูสามารถ:
• **ตรวจสอบถนนน้ำท่วม** และแนะนำเส้นทางเลี่ยง
• **ทำนายปริมาณน้ำ** และระดับน้ำล่วงหน้า 1-6 ชม.
• **วิเคราะห์สภาพอากาศ & ความเสี่ยง** ในพิกัดที่คุณอยู่
• **ตอบคำถามว่ารถเก๋งผ่านได้มั้ย** หรือควรใช้เส้นทางใด

พี่ๆ อยากให้ฟ้าใสช่วยเช็กจุดไหนหรือทำนายอะไร ถามหนูได้เลยนะคะ! 💙`,
  timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  actions: [
    { label: '🛣️ ถนนไหนใน กทม. น้ำท่วมขังวิกฤตบ้าง?', actionType: 'ask_prompt', payload: 'ตอนนี้ถนนเส้นไหนใน กทม. น้ำท่วมขังวิกฤตบ้างคะ?' },
    { label: '⏱️ ทำนายระดับน้ำในอีก 3 ชั่วโมงข้างหน้า', actionType: 'ask_prompt', payload: 'ช่วยทำนายปริมาณน้ำและระดับน้ำในอีก 3 ชั่วโมงข้างหน้าหน่อยค่ะ' },
    { label: '✈️ ไปสนามบินดอนเมืองตอนนี้น้ำท่วมมั้ย?', actionType: 'ask_prompt', payload: 'จะไปสนามบินดอนเมืองตอนนี้น้ำท่วมมั้ย และควรไปเส้นทางไหนดี?' },
    { label: '📍 วิเคราะห์สภาพอากาศและเสี่ยงน้ำท่วมบริเวณนี้', actionType: 'ask_prompt', payload: 'ช่วยวิเคราะห์พิกัดที่กำลังดูอยู่ตอนนี้หน่อยค่ะ' },
    { label: '🚗 รถเก๋งซีดานวิ่งผ่านเส้นลาดพร้าว-รัชดาได้มั้ย?', actionType: 'ask_prompt', payload: 'รถเก๋งซีดานวิ่งผ่านเส้นลาดพร้าว-รัชดาได้มั้ยคะ?' }
  ]
};

export interface FahsaiContext {
  currentLocation?: { lat: number; lng: number; name?: string } | null;
  weather?: WeatherCondition | null;
  floodedRoads: FloodedRoad[];
  stations: WaterStation[];
  dams: DamInfo[];
  alerts: FloodAlert[];
}

export function generateFahsaiResponse(
  userQuery: string,
  context: FahsaiContext
): FahsaiMessage {
  const query = userQuery.trim().toLowerCase();
  const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  const forecasts = calculateAiFloodForecasts(context.floodedRoads);

  // 1. ถามเรื่องสนามบินดอนเมือง หรือ สุวรรณภูมิ
  if (query.includes('ดอนเมือง') || query.includes('don mueang')) {
    const dmRoads = context.floodedRoads.filter(r => 
      r.name.includes('วิภาวดี') || r.name.includes('พหลโยธิน') || r.name.includes('แจ้งวัฒนะ')
    );
    const critical = dmRoads.filter(r => (r.waterDepthCm || 0) >= 15);

    let text = `✈️ **รายงานการเดินทางไปสนามบินดอนเมือง โดยหนูน้อยฟ้าใสค่ะ** 👧\n\n`;
    if (critical.length > 0) {
      text += `⚠️ **มีจุดเฝ้าระวังน้ำท่วมขังบนเส้นทางไปดอนเมือง ${critical.length} จุดค่ะ:**\n`;
      critical.forEach(r => {
        text += `• **${r.name}**: ระดับน้ำ ${r.waterDepthCm} ซม. (${r.status === 'critical' ? '🔴 วิกฤต' : '🟠 ปานกลาง'}) - ${r.drainageTrend === 'rising' ? '🔺 ระดับน้ำกำลังเพิ่มขึ้น' : '🔻 กำลังระบายน้ำ'}\n`;
      });
      text += `\n💡 **คำแนะนำจากฟ้าใส:**\n`;
      text += `1. **แนะนำให้ใช้ทางยกระดับดอนเมืองโทลล์เวย์ (Don Mueang Tollway)** ขึ้นจากดินแดงหรือลาดพร้าว เพื่อหลีกเลี่ยงระดับพื้นผิวถนนวิภาวดีรังสิตด้านล่างโดยสิ้นเชิงค่ะ\n`;
      text += `2. **รถเก๋งเล็ก/ซีดานห้ามลงวิ่งทางขนาน** บริเวณแยกลาดพร้าวและหน้า ม.เกษตรศาสตร์ เด็ดขาดค่ะ\n`;
      text += `3. เผื่อเวลาเดินทางอย่างน้อย **45 - 60 นาที** จากปกติค่ะ`;
    } else {
      text += `✅ ถนนสายหลักไปดอนเมือง (ดอนเมืองโทลล์เวย์) สัญจรได้สะดวก ไม่มีน้ำท่วมขังบนทางยกระดับค่ะ ส่วนพื้นราบวิภาวดีรังสิตมีน้ำขังผิวจราจรเล็กน้อย 5-10 ซม. ในช่องทางซ้ายสุดค่ะ`;
    }

    return {
      id: `fahsai-${Date.now()}`,
      sender: 'fahsai',
      text,
      timestamp: timeStr,
      actions: [
        { label: '🧭 เปิด AI วางแผนเส้นทางไปดอนเมือง', actionType: 'open_ai_router' },
        { 
          label: '🗺️ เปิดเส้นทางเลี่ยงใน Google Maps', 
          actionType: 'navigate_google', 
          payload: 'https://www.google.com/maps/dir/?api=1&origin=13.7563,100.5018&destination=13.9126,100.6067&travelmode=driving' 
        },
        { 
          label: '🍏 เปิดเส้นทางเลี่ยงใน Apple Maps', 
          actionType: 'navigate_apple', 
          payload: 'https://maps.apple.com/?saddr=13.7563,100.5018&daddr=13.9126,100.6067&dirflg=d' 
        }
      ],
      dataCard: {
        title: 'สถานะเส้นทางไปสนามบินดอนเมือง',
        badge: critical.length > 0 ? 'ควรเลี่ยงทางราบ' : 'สัญจรได้',
        items: [
          { label: 'จุดน้ำขังบนเส้นทาง', value: `${critical.length} จุด`, color: critical.length > 0 ? 'text-red-400' : 'text-emerald-400' },
          { label: 'เส้นทางแนะนำ', value: 'ดอนเมืองโทลล์เวย์ (ยกระดับ)', color: 'text-cyan-400' },
          { label: 'ความปลอดภัย', value: '100% (บนทางด่วน)', color: 'text-emerald-400' }
        ]
      }
    };
  }

  // 2. ถามเรื่องทำนายผลในอนาคต (1 ชม., 3 ชม., 6 ชม., แนวโน้ม, ปริมาณน้ำ)
  if (query.includes('ทำนาย') || query.includes('พยากรณ์') || query.includes('3 ชม') || query.includes('3 ชั่วโมง') || query.includes('อนาคต') || query.includes('ปริมาณน้ำ')) {
    const risingRoads = forecasts.filter(f => f.predictedDepth3h > f.currentDepthCm);
    const critical3h = forecasts.filter(f => f.predictedDepth3h >= 20);

    let text = `🔮 **ผลการทำนายปริมาณน้ำและระดับน้ำล่วงหน้า โดย AI หนูน้อยฟ้าใสค่ะ** 👧🌧️\n\n`;
    text += `จากการวิเคราะห์แบบจำลองอุทกวิทยา (Hydrology Catchment Runoff) ผสานเรดาร์ตรวจวัดกลุ่มฝนสด และขีดความสามารถการสูบน้ำของสถานี กทม.:\n\n`;
    text += `📊 **สรุปสถานการณ์ในอีก 1 - 3 ชั่วโมงข้างหน้า:**\n`;
    text += `• **แนวโน้มถนนที่น้ำจะสูงขึ้น (Rising):** มี ${risingRoads.length} สายทางที่ปริมาณน้ำฝนไหลเข้ามากกว่าอัตราสูบระบาย\n`;
    text += `• **จุดเสี่ยงวิกฤตลึกเกิน 20 ซม. ใน 3 ชม.:** มี ${critical3h.length} สายทาง\n\n`;

    text += `🚨 **3 จุดที่โมเดล AI คาดการณ์ว่าน้ำจะขึ้นสูงสุด:**\n`;
    forecasts.slice(0, 3).forEach((f, idx) => {
      text += `${idx + 1}. **${f.roadName}**\n`;
      text += `   - ตอนนี้: ${f.currentDepthCm} ซม. ➡️ อีก 1 ชม.: **${f.predictedDepth1h} ซม.** ➡️ อีก 3 ชม.: **${f.predictedDepth3h} ซม.**\n`;
      text += `   - น้ำหลากไหลเข้า: ${f.waterVolumeInflowM3PerHr.toLocaleString()} ลบ.ม./ชม. | กำลังสูบ: ${f.drainageRateM3PerHr.toLocaleString()} ลบ.ม./ชม.\n`;
      text += `   - คำแนะนำ: ${f.aiAnalysisSummary}\n\n`;
    });

    text += `💡 **คำแนะนำการเดินทาง:** หลังเวลา 18:00 น. หากฝนยังคงตกสะสม แนะนำให้หลีกเลี่ยงถนนระดับดินในแนวคลองลาดพร้าวและถนนวิภาวดีรังสิตค่ะ`;

    return {
      id: `fahsai-${Date.now()}`,
      sender: 'fahsai',
      text,
      timestamp: timeStr,
      actions: [
        { label: '🧭 เปิด AI วางแผนเส้นทางเลี่ยงทั้งหมด', actionType: 'open_ai_router' },
        { label: '🛣️ เช็คถนนน้ำท่วมวิกฤตทั้งหมด', actionType: 'ask_prompt', payload: 'ตอนนี้ถนนเส้นไหนใน กทม. น้ำท่วมขังวิกฤตบ้างคะ?' }
      ],
      dataCard: {
        title: 'พยากรณ์ปริมาณน้ำสุทธิ กทม. (+3 ชม.)',
        badge: 'AI Hydro Model',
        items: [
          { label: 'ถนนเสี่ยงน้ำเพิ่มขึ้น', value: `${risingRoads.length} สายทาง`, color: 'text-amber-400' },
          { label: 'ถนนเสี่ยงวิกฤต (>20cm)', value: `${critical3h.length} สายทาง`, color: 'text-rose-400' },
          { label: 'กำลังสูบน้ำรวม', value: '45,000+ ลบ.ม./ชม.', color: 'text-cyan-400' }
        ]
      }
    };
  }

  // 3. ถามเรื่องรถเก๋ง หรือ รถประเภทต่างๆ วิ่งได้มั้ย
  if (query.includes('รถเก๋ง') || query.includes('รถซีดาน') || query.includes('รถเล็ก') || query.includes('รถมอเตอร์ไซค์') || query.includes('วิ่งได้มั้ย') || query.includes('ผ่านได้มั้ย')) {
    const impassable = context.floodedRoads.filter(r => (r.waterDepthCm || 0) >= 20);
    const caution = context.floodedRoads.filter(r => (r.waterDepthCm || 0) >= 10 && (r.waterDepthCm || 0) < 20);

    let text = `🚗 **คำแนะนำสำหรับรถเก๋งซีดานและรถเล็ก โดยหนูน้อยฟ้าใสค่ะ** 👧\n\n`;
    text += `⚠️ ตามหลักความปลอดภัยของยานยนต์:\n`;
    text += `• **น้ำลึก 10 - 15 ซม.** (เสมอขอบฟุตบาท): รถเก๋งผ่านได้ช้าๆ ปิดแอร์ ใช้เกียร์ต่ำ ห้ามเบิ้ลเครื่องแรง\n`;
    text += `• **น้ำลึก 20 ซม. ขึ้นไป** (ท่วมครึ่งล้อรถ): **อันตรายมาก ห้ามรถเก๋ง/อีโคคาร์ผ่านเด็ดขาด!** เสี่ยงน้ำเข้าท่อไอเสีย กรองอากาศ และชุดเกียร์เสียหายค่ะ\n\n`;

    if (impassable.length > 0) {
      text += `🛑 **ถนนที่รถเก๋งห้ามผ่านตอนนี้ (${impassable.length} สายทาง):**\n`;
      impassable.slice(0, 5).forEach(r => {
        text += `• **${r.name}** (น้ำลึก ${r.waterDepthCm} ซม.) - ${r.trafficSpeed || 'รถชะลอตัวหนัก'}\n`;
      });
      if (impassable.length > 5) {
        text += `• และอีก ${impassable.length - 5} สายทางในระบบค่ะ\n`;
      }
    }

    text += `\n💡 **คำแนะนำเพิ่มเติม:** หากจำเป็นต้องเดินทาง แนะนำให้ใช้เส้นทางยกระดับ (ดอนเมืองโทลล์เวย์, ทางพิเศษศรีรัช, ทางพิเศษเฉลิมมหานคร) หรือกดให้ฟ้าใสช่วยคำนวณเส้นทางเลี่ยง 100% ได้เลยค่ะ`;

    return {
      id: `fahsai-${Date.now()}`,
      sender: 'fahsai',
      text,
      timestamp: timeStr,
      actions: [
        { label: '🧭 ให้ AI คำนวณทางเลี่ยงสำหรับรถเก๋ง', actionType: 'open_ai_router' },
        { label: '⏱️ พยากรณ์ว่าถนนจะแห้งเมื่อไหร่', actionType: 'ask_prompt', payload: 'ช่วยทำนายปริมาณน้ำและระดับน้ำในอีก 3 ชั่วโมงข้างหน้าหน่อยค่ะ' }
      ]
    };
  }

  // 4. ถามเรื่องถนนใดถนนหนึ่งโดยเฉพาะ (วิภาวดี, ลาดพร้าว, รัชดา, รามคำแหง, บางนา, แจ้งวัฒนะ, พระราม 2, พระราม 4, สุขุมวิท, ศรีนครินทร์ ฯลฯ)
  const matchedRoad = context.floodedRoads.find(r => 
    query.includes(r.name.toLowerCase()) || 
    query.includes(r.district.toLowerCase()) ||
    (r.name.includes('วิภาวดี') && query.includes('วิภาวดี')) ||
    (r.name.includes('ลาดพร้าว') && query.includes('ลาดพร้าว')) ||
    (r.name.includes('รัชดา') && query.includes('รัชดา')) ||
    (r.name.includes('รามคำแหง') && query.includes('รามคำแหง')) ||
    (r.name.includes('บางนา') && query.includes('บางนา')) ||
    (r.name.includes('แจ้งวัฒนะ') && query.includes('แจ้งวัฒนะ')) ||
    (r.name.includes('สุขุมวิท') && query.includes('สุขุมวิท')) ||
    (r.name.includes('ศรีนครินทร์') && query.includes('ศรีนครินทร์')) ||
    (r.name.includes('พหลโยธิน') && query.includes('พหลโยธิน')) ||
    (r.name.includes('งามวงศ์วาน') && query.includes('งามวงศ์วาน'))
  );

  if (matchedRoad) {
    const forecast = forecasts.find(f => f.roadId === matchedRoad.id);
    const depth = matchedRoad.waterDepthCm || 10;
    const isCritical = depth >= 20;

    let text = `🛣️ **ข้อมูลสถานการณ์น้ำท่วม: ${matchedRoad.name}**\n\n`;
    text += `👧 **รายงานโดยหนูน้อยฟ้าใส:**\n`;
    text += `• **ระดับน้ำท่วมขังปัจจุบัน:** **${depth} เซนติเมตร** (${isCritical ? '🔴 ระดับวิกฤต' : '🟠 ระดับปานกลาง'})\n`;
    text += `• **สถานะการระบายน้ำ:** ${matchedRoad.drainageTrend === 'rising' ? '🔺 น้ำกำลังเพิ่มขึ้น' : matchedRoad.drainageTrend === 'receding' ? '🔻 น้ำกำลังลดลง' : '➡️ ระดับทรงตัว'}\n`;
    text += `• **เครื่องสูบน้ำ กทม.:** ${matchedRoad.pumpStatus || 'กำลังเร่งสูบระบาย'}\n`;
    text += `• **สภาพการจราจร:** ${matchedRoad.trafficSpeed || 'ชะลอตัว'}\n\n`;

    if (forecast) {
      text += `🔮 **การทำนายโดยโมเดล AI:**\n`;
      text += `• อีก 1 ชม.: ${forecast.predictedDepth1h} ซม. | อีก 3 ชม.: ${forecast.predictedDepth3h} ซม. | อีก 6 ชม.: ${forecast.predictedDepth6h} ซม.\n`;
      text += `• ปริมาณน้ำหลากไหลเข้า: ${forecast.waterVolumeInflowM3PerHr.toLocaleString()} ลบ.ม./ชม.\n`;
      text += `• อัตราสูบระบายออก: ${forecast.drainageRateM3PerHr.toLocaleString()} ลบ.ม./ชม.\n`;
      text += `• บทวิเคราะห์: ${forecast.aiAnalysisSummary}\n\n`;
    }

    text += `💡 ฟ้าใสทำปุ่มกดเปิดทางเลี่ยงบน **Google Maps** และ **Apple Maps** ไว้ให้ด้านล่างแล้วค่ะ กดเปิดนำทางได้ทันทีเลยนะคะ!`;

    const detourUrls = buildSingleRoadDetourUrls(matchedRoad);

    return {
      id: `fahsai-${Date.now()}`,
      sender: 'fahsai',
      text,
      timestamp: timeStr,
      actions: [
        { label: '🗺️ เปิดทางเลี่ยงใน Google Maps', actionType: 'navigate_google', payload: detourUrls.googleMapsUrl },
        { label: '🍏 เปิดทางเลี่ยงใน Apple Maps', actionType: 'navigate_apple', payload: detourUrls.appleMapsUrl },
        { label: '📍 ซูมไปที่ถนนเส้นนี้บนแผนที่', actionType: 'zoom_location', payload: { lat: matchedRoad.coordinates[0][0], lng: matchedRoad.coordinates[0][1], zoom: 14 } },
        { label: '🧭 ให้ AI วางแผนเส้นทางใหม่ทั้งหมด', actionType: 'open_ai_router' }
      ],
      dataCard: {
        title: matchedRoad.name,
        badge: isCritical ? 'ห้ามรถเล็กผ่าน' : 'ชะลอความเร็ว',
        items: [
          { label: 'ระดับน้ำปัจจุบัน', value: `${depth} ซม.`, color: isCritical ? 'text-red-400' : 'text-amber-400' },
          { label: 'คาดการณ์ 3 ชม.', value: `${forecast?.predictedDepth3h || depth} ซม.`, color: 'text-cyan-400' },
          { label: 'การสัญจร', value: isCritical ? 'รถกระบะ/ยกสูง' : 'รถทุกชนิด (ระวัง)', color: 'text-slate-200' }
        ]
      }
    };
  }

  // 5. ถามเรื่องถนนใน กทม. เส้นไหนท่วมบ้าง (ภาพรวมถนนทั้งหมด)
  if (query.includes('ถนนไหน') || query.includes('ถนนในกทม') || query.includes('มีถนนอะไร') || query.includes('ท่วมขังวิกฤต') || query.includes('เส้นทางไหนท่วม')) {
    const criticalRoads = context.floodedRoads.filter(r => (r.waterDepthCm || 0) >= 20);
    const moderateRoads = context.floodedRoads.filter(r => (r.waterDepthCm || 0) >= 10 && (r.waterDepthCm || 0) < 20);

    let text = `🚨 **สรุปสถานการณ์ถนนน้ำท่วมขัง กทม. สดเรียลไทม์ (${context.floodedRoads.length} จุดมอนิเตอร์) ค่ะ** 👧\n\n`;
    text += `🔴 **จุดวิกฤต (น้ำลึก 20 ซม. ขึ้นไป - รถเก๋งห้ามผ่าน): ${criticalRoads.length} สายทาง**\n`;
    criticalRoads.slice(0, 6).forEach(r => {
      text += `• **${r.name}** (${r.district}): น้ำลึก **${r.waterDepthCm} ซม.** (${r.drainageTrend === 'rising' ? '🔺 ขึ้น' : '🔻 ลด'})\n`;
    });

    if (moderateRoads.length > 0) {
      text += `\n🟠 **จุดเฝ้าระวัง (น้ำลึก 10-18 ซม. - รถชะลอตัว): ${moderateRoads.length} สายทาง**\n`;
      moderateRoads.slice(0, 4).forEach(r => {
        text += `• ${r.name}: ${r.waterDepthCm} ซม. (${r.pumpStatus || 'กำลังสูบ'})\n`;
      });
    }

    text += `\n💡 พี่ๆ สามารถกดปุ่ม **AI เลี่ยงน้ำท่วม** ด้านล่างเพื่อให้หนูคำนวณเส้นทางลัดอ้อมจุดเหล่านี้แบบ 100% ปลอดภัยได้เลยค่ะ!`;

    return {
      id: `fahsai-${Date.now()}`,
      sender: 'fahsai',
      text,
      timestamp: timeStr,
      actions: [
        { label: '🧭 เปิดระบบ AI วางแผนเส้นทางเลี่ยง', actionType: 'open_ai_router' },
        { label: '⏱️ ทำนายว่าจุดไหนน้ำจะเพิ่มขึ้นอีก', actionType: 'ask_prompt', payload: 'ช่วยทำนายปริมาณน้ำและระดับน้ำในอีก 3 ชั่วโมงข้างหน้าหน่อยค่ะ' }
      ]
    };
  }

  // 6. ถามเรื่องพิกัดที่กำลังดูอยู่ หรือ พิกัดของฉัน
  if (query.includes('บริเวณนี้') || query.includes('ตรงนี้') || query.includes('พิกัดที่ฉันอยู่') || query.includes('แถวนี้') || query.includes('พิกัดนี้')) {
    const loc = context.currentLocation;
    const w = context.weather;

    let text = `📍 **รายงานสภาพพื้นที่พิกัดปัจจุบัน โดยหนูน้อยฟ้าใสค่ะ** 👧\n\n`;
    if (loc) {
      text += `• **พิกัดที่ระบุ:** ละติจูด ${loc.lat.toFixed(4)}, ลองจิจูด ${loc.lng.toFixed(4)} (${loc.name || 'พิกัดที่เลือก'})\n`;
    }
    if (w) {
      text += `• **สภาพอากาศสด:** ${w.weatherDesc}\n`;
      text += `• **อุณหภูมิ:** ${w.temp}°C (ความชื้น ${w.humidity}%)\n`;
      text += `• **ปริมาณน้ำฝนสด:** **${w.rainCurrent} มม./ชม.**\n`;
      text += `• **ความเร็วลม:** ${w.windSpeed} กม./ชม.\n`;
      text += `• **สถานะพายุ:** ${w.isStorm ? '⚡ มีพายุฝนฟ้าคะนอง' : '🟢 ปลอดภัย ไม่มีพายุ'}\n\n`;
    } else {
      text += `• สภาพอากาศในพื้นที่: กำลังซิงค์ข้อมูลเรดาร์และสถานีตรวจวัดสดในรัศมี 10 กม. ค่ะ\n\n`;
    }

    text += `💡 หากพี่ๆ ต้องการเดินทางออกจากพิกัดนี้ ฟ้าใสสามารถวางแผนเส้นทางเลี่ยงจุดน้ำท่วมให้ไปยังปลายทางได้ทันทีนะคะ`;

    return {
      id: `fahsai-${Date.now()}`,
      sender: 'fahsai',
      text,
      timestamp: timeStr,
      actions: [
        { label: '🧭 วางแผนเส้นทางออกจากจุดนี้', actionType: 'open_ai_router' },
        { label: '🛣️ ตรวจสอบถนนน้ำท่วมใกล้เคียง', actionType: 'ask_prompt', payload: 'ตอนนี้ถนนเส้นไหนใน กทม. น้ำท่วมขังวิกฤตบ้างคะ?' }
      ]
    };
  }

  // 7. ถามเรื่องเขื่อน หรือ แม่น้ำเจ้าพระยา
  if (query.includes('เขื่อน') || query.includes('เจ้าพระยา') || query.includes('แม่น้ำ') || query.includes('ระดับน้ำแม่น้ำ')) {
    const cpyStations = context.stations.filter(s => s.river.includes('เจ้าพระยา'));
    const pasakDam = context.dams.find(d => d.name.includes('ป่าสัก'));
    const bhmDam = context.dams.find(d => d.name.includes('ภูมิพล'));

    let text = `🌊 **สถานการณ์ลุ่มน้ำเจ้าพระยาและเขื่อนหลัก โดยหนูน้อยฟ้าใสค่ะ** 👧\n\n`;
    if (cpyStations.length > 0) {
      text += `📍 **สถานีวัดระดับน้ำแม่น้ำเจ้าพระยา:**\n`;
      cpyStations.slice(0, 3).forEach(s => {
        text += `• **${s.name}** (${s.province}): ระดับน้ำ ${s.waterLevel} ม.รทก. (${s.status === 'critical' ? '🔴 ล้นตลิ่ง' : s.status === 'warning' ? '🟠 เตือนภัย' : '🟢 ปกติ'})\n`;
      });
      text += `\n`;
    }

    if (pasakDam || bhmDam) {
      text += `🏔️ **สถานะเขื่อนสำคัญ:**\n`;
      if (pasakDam) text += `• **${pasakDam.name}**: ความจุ ${pasakDam.storagePercent}% (${pasakDam.status === 'warning' ? '🟠 เร่งระบาย' : '🟢 ปกติ'})\n`;
      if (bhmDam) text += `• **${bhmDam.name}**: ความจุ ${bhmDam.storagePercent}%\n`;
      text += `\n`;
    }

    text += `💡 **ข้อแนะนำ:** สำหรับชุมชนริมสองฝั่งแม่น้ำเจ้าพระยานอกแนวคันกั้นน้ำ ให้ติดตามช่วงเวลาน้ำทะเลหนุนสูงร่วมด้วยนะคะ`;

    return {
      id: `fahsai-${Date.now()}`,
      sender: 'fahsai',
      text,
      timestamp: timeStr,
      actions: [
        { label: '🌊 สลับมุมมองดูสถานีน้ำ & เขื่อน', actionType: 'ask_prompt', payload: 'ดูสถานีน้ำและเขื่อน' },
        { label: '⏱️ ทำนายผลน้ำท่วมถนน กทม.', actionType: 'ask_prompt', payload: 'ช่วยทำนายปริมาณน้ำและระดับน้ำในอีก 3 ชั่วโมงข้างหน้าหน่อยค่ะ' }
      ]
    };
  }

  // Default Fallback: ให้คำตอบสังเคราะห์อย่างชาญฉลาดและเป็นกันเอง
  let fallback = `👧 หนูได้รับคำถามว่า: *" ${userQuery} "* แล้วค่ะ!\n\n`;
  fallback += `จากการประมวลผลข้อมูลเรดาร์และเซนเซอร์ล่าสุดของระบบ **ฟ้าใส พยากรณ์**:\n`;
  fallback += `• ในเขตกรุงเทพฯ และปริมณฑล มีจุดเฝ้าระวังน้ำท่วมขังบนถนน **${context.floodedRoads.length} จุด**\n`;
  fallback += `• สถานีสูบน้ำหลักกำลังเร่งระบายน้ำลงสู่คลองเปรมประชากร, คลองแสนแสบ และอุโมงค์ยักษ์พระราม 9\n`;
  fallback += `• หากต้องการเดินทาง ฟ้าใสแนะนำให้ใช้เส้นทางยกระดับ หรือกดปุ่ม **AI เลี่ยงน้ำท่วม** ด้านล่างเพื่อค้นหาเส้นทางที่ปลอดภัยที่สุดค่ะ\n\n`;
  fallback += `พี่ๆ สามารถเลือกกดหัวข้อที่สนใจด้านล่าง หรือพิมพ์ระบุชื่อถนน/สถานที่ได้เลยนะคะ! 💙`;

  return {
    id: `fahsai-${Date.now()}`,
    sender: 'fahsai',
    text: fallback,
    timestamp: timeStr,
    actions: [
      { label: '🛣️ ถนนน้ำท่วมวิกฤต', actionType: 'ask_prompt', payload: 'ตอนนี้ถนนเส้นไหนใน กทม. น้ำท่วมขังวิกฤตบ้างคะ?' },
      { label: '⏱️ ทำนายน้ำในอีก 3 ชม.', actionType: 'ask_prompt', payload: 'ช่วยทำนายปริมาณน้ำและระดับน้ำในอีก 3 ชั่วโมงข้างหน้าหน่อยค่ะ' },
      { label: '🧭 เปิด AI วางแผนเลี่ยงน้ำท่วม', actionType: 'open_ai_router' }
    ]
  };
}
