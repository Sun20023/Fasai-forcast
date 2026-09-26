# 🌊 ThaiFlood Live
> **ระบบติดตามสถานการณ์น้ำท่วม พยากรณ์อากาศพายุฝน และแจ้งเตือนภัยแบบเรียลไทม์ (Real-Time Flood & Severe Weather Early Warning Platform)**

![ThaiFlood Live](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=for-the-badge)
![React 19](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![Vite 8](https://img.shields.io/badge/Vite-8.3-purple?style=for-the-badge&logo=vite)
![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-cyan?style=for-the-badge&logo=tailwindcss)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-green?style=for-the-badge&logo=leaflet)

---

## 📌 จุดเด่นของระบบ (Key Highlights)

1. **🎨 แผนที่โซนสีเตือนภัยพิบัติระดับชาติ (National Flood Risk Color Zones):**
   * 🔴 **โซนสีแดง (วิกฤตล้นตลิ่ง/น้ำท่วมฉับพลัน):** สุโขทัย (แม่น้ำยม), อุบลราชธานี (แม่น้ำมูล), อยุธยา (คลองบางบาล-เสนา), เชียงราย (แม่สาย)
   * 🟠 **โซนสีส้ม (เตือนภัยรับมือ):** ชัยนาท-สิงห์บุรี-อ่างทอง (ท้ายเขื่อนเจ้าพระยา), ยโสธร-ร้อยเอ็ด (แม่น้ำชี), นครศรีธรรมราช (เชิงเขาหลวง), นนทบุรี-ปทุมธานี (นอกคันกั้นน้ำ)
   * 🟡 **โซนสีเหลือง (เฝ้าระวัง):** กรุงเทพมหานคร (ริมเจ้าพระยา/น้ำทะเลหนุน), นครสวรรค์ (ปากน้ำโพ), เชียงใหม่ (แม่น้ำปิง), สุราษฎร์ธานี (แม่น้ำตาปี)
   * 🟢 **โซนสีเขียว (สภาวะปกติ):** ระยอง-ชลบุรี, หาดใหญ่-สงขลา
2. **🌧️ เรดาร์ตรวจจับกลุ่มฝนและพายุสด (Live Doppler Weather Radar):**
   * เชื่อมต่อ RainViewer API แสดงภาพกระเบื้องเรดาร์แบบ Real-Time พร้อมแถบเครื่องเล่น Animation ย้อนหลังและพยากรณ์ล่วงหน้า
3. **🗺️ แผนที่อิสระ 100% ไม่ต้องใช้ API Key:**
   * สลับโหมดได้ 5 รูปแบบ: OpenStreetMap, ภูมิประเทศและลุ่มน้ำ (Esri Topo), แผนที่ถนน (Esri Street), โหมดมืด (Esri Dark Gray), และภาพถ่ายดาวเทียม (Esri Satellite)
4. **⛈️ พยากรณ์อากาศและน้ำหลากสด (Open-Meteo Weather & Flood API):**
   * ปริมาณฝนตกสด (มม./ชม.), ลมกระโชกแรง (Wind Gusts) เตือนภัยพายุ
   * กราฟพยากรณ์ฝนรายชั่วโมง 24 ชม.
   * กราฟคาดการณ์อัตราการไหลของแม่น้ำ 7 วันล่วงหน้า (River Discharge Model)
5. **🔔 ระบบแจ้งเตือนภัยรอบด้าน (Multi-Channel Alerts):**
   * Web Push Notification (แจ้งเตือนจริงบนคอมพิวเตอร์และมือถือ)
   * Web Audio Synthesizer Chime (เสียงไซเรนและเสียงเตือนภัยสังเคราะห์โดยตรง)
   * พื้นที่เฝ้าระวังส่วนตัว (My Watchlist) และรวมสายด่วนกู้ภัย 1784, 1460, 1669

---

## 🚀 วิธีการเปิดใช้งาน (How to Launch)

### วิธีที่ 1: ดับเบิลคลิกไฟล์รันด่วน (บน Windows)
ดับเบิลคลิกไฟล์:
```text
start-production.bat
```
ระบบจะทำการคอมไพล์และเปิดเซิร์ฟเวอร์ให้อัตโนมัติที่ `http://localhost:5173/`

---

### วิธีที่ 2: รันผ่าน Terminal / Command Line

#### 1. ติดตั้ง Dependencies (ถ้ายังไม่ได้ติดตั้ง):
```bash
npm install
```

#### 2. รันในโหมด Development:
```bash
npm run dev
```

#### 3. คอมไพล์และรันในโหมด Production:
```bash
npm run build
npm run start
```
เปิดเบราว์เซอร์ไปที่: **`http://localhost:5173/`**

---

## 🌐 การนำไป Deploy ขึ้น Cloud สาธารณะ

### Deploy บน Vercel
1. ติดตั้ง Vercel CLI: `npm i -g vercel`
2. พิมพ์คำสั่ง: `vercel`
3. ตั้งค่า Build Command: `npm run build` และ Output Directory: `dist`

### Deploy บน Netlify
1. เชื่อมต่อ Git Repository กับ Netlify
2. ตั้งค่า Build Command: `npm run build`
3. Publish Directory: `dist`

### Deploy ด้วย Docker
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 📄 แหล่งข้อมูลเปิด (Data Citations)
* **Open-Meteo Weather & Flood API:** https://open-meteo.com/ (CC BY 4.0)
* **RainViewer Radar API:** https://www.rainviewer.com/api.html
* **OpenStreetMap:** https://www.openstreetmap.org/ (ODbL)
* **Esri ArcGIS Online Services:** https://www.arcgis.com/
