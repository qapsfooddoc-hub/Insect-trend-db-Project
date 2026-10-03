const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'src', 'lib', 'data');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// 1. GECKO DATA
const wbG = XLSX.readFile(path.join(__dirname, '..', 'ไฟล์ตัวอย่าง', 'กราฟแนวโน้มจิ้งจก 2569.xlsx'));
const geckoTrend = XLSX.utils.sheet_to_json(wbG.Sheets['รวมสรุป']);

const wbGMonth = XLSX.readFile(path.join(__dirname, '..', 'ไฟล์ตัวอย่าง', 'กราฟจิ้งจกประจำเดือน 2569.xlsx'));
const geckoMonthly = {};
wbGMonth.SheetNames.forEach(s => {
  const ws = wbGMonth.Sheets[s];
  const d = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const stations = [];
  for (let i = 1; i <= 6; i++) {
    if (d[i]) stations.push({ station: i, count: Number(d[i][1]) || 0 });
  }
  geckoMonthly[s.trim()] = stations;
});

const geckoContent = `// FM-QC-08/04 Rev.02 Gecko / Lizard Inspection Data
export const GECKO_STATIONS = [
  { id: 1, name: 'สถานีที่ 1', area: 'จุดตรวจดักจับจิ้งจก สถานีที่ 1' },
  { id: 2, name: 'สถานีที่ 2', area: 'จุดตรวจดักจับจิ้งจก สถานีที่ 2' },
  { id: 3, name: 'สถานีที่ 3', area: 'จุดตรวจดักจับจิ้งจก สถานีที่ 3' },
  { id: 4, name: 'สถานีที่ 4', area: 'จุดตรวจดักจับจิ้งจก สถานีที่ 4' },
  { id: 5, name: 'สถานีที่ 5', area: 'จุดตรวจดักจับจิ้งจก สถานีที่ 5' },
  { id: 6, name: 'สถานีที่ 6', area: 'จุดตรวจดักจับจิ้งจก สถานีที่ 6' }
];

export const GECKO_YEARLY_TREND_2569 = ${JSON.stringify(geckoTrend, null, 2)};

export const GECKO_MONTHLY_DATA_2569 = ${JSON.stringify(geckoMonthly, null, 2)};
`;

fs.writeFileSync(path.join(outDir, 'geckoData.js'), geckoContent, 'utf8');

// 2. COCKROACH DATA
const wbC = XLSX.readFile(path.join(__dirname, '..', 'ไฟล์ตัวอย่าง', 'กราฟแมลงสาบรายเดือน 2569.xlsx'));
const cockroachMonthly = {};
wbC.SheetNames.forEach(s => {
  const ws = wbC.Sheets[s];
  const d = XLSX.utils.sheet_to_json(ws, { header: 1 });
  const points = [];
  for (let i = 1; i <= 23; i++) {
    if (d[i]) {
      let zone = 'โรงอาหารตัดแต่งห้องที่ 1';
      if (i >= 9 && i <= 12) zone = 'โรงอาหารตัดแต่งห้องที่ 2';
      else if (i >= 13 && i <= 16) zone = 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง';
      else if (i >= 17 && i <= 19) zone = 'ห้องน้ำหญิง ตัดแต่ง';
      else if (i >= 20 && i <= 22) zone = 'ห้องน้ำชาย ตัดแต่ง';
      else if (i === 23) zone = 'ห้องน้ำหัวหน้า ตัดแต่ง';

      points.push({
        id: i,
        no: String(i).padStart(2, '0'),
        name: d[i][0] || `No. ${i}`,
        zone,
        count: Number(d[i][1]) || 0
      });
    }
  }
  cockroachMonthly[s.trim()] = points;
});

const cockroachContent = `// FM-QC-08/05 Rev.02 Cockroach Trap House Inspection Data
export const COCKROACH_ZONES = [
  'โรงอาหารตัดแต่งห้องที่ 1',
  'โรงอาหารตัดแต่งห้องที่ 2',
  'ใต้ตู้ล็อกเกอร์ ตัดแต่ง',
  'ห้องน้ำหญิง ตัดแต่ง',
  'ห้องน้ำชาย ตัดแต่ง',
  'ห้องน้ำหัวหน้า ตัดแต่ง'
];

export const COCKROACH_POINTS = [
  { id: 1, no: '01', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '01 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 2, no: '02', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '02 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 3, no: '03', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '03 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 4, no: '04', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '04 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 5, no: '05', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '05 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 6, no: '06', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '06 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 7, no: '07', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '07 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 8, no: '08', zone: 'โรงอาหารตัดแต่งห้องที่ 1', name: '08 (โรงอาหารตัดแต่งห้องที่ 1)' },
  { id: 9, no: '09', zone: 'โรงอาหารตัดแต่งห้องที่ 2', name: '09 (โรงอาหารตัดแต่งห้องที่ 2)' },
  { id: 10, no: '10', zone: 'โรงอาหารตัดแต่งห้องที่ 2', name: '10 (โรงอาหารตัดแต่งห้องที่ 2)' },
  { id: 11, no: '11', zone: 'โรงอาหารตัดแต่งห้องที่ 2', name: '11 (โรงอาหารตัดแต่งห้องที่ 2)' },
  { id: 12, no: '12', zone: 'โรงอาหารตัดแต่งห้องที่ 2', name: '12 (โรงอาหารตัดแต่งห้องที่ 2)' },
  { id: 13, no: '13', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '13 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)' },
  { id: 14, no: '14', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '14 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)' },
  { id: 15, no: '15', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '15 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)' },
  { id: 16, no: '16', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '16 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)' },
  { id: 17, no: '17', zone: 'ห้องน้ำหญิง ตัดแต่ง', name: '17 (ห้องน้ำหญิง ตัดแต่ง)' },
  { id: 18, no: '18', zone: 'ห้องน้ำหญิง ตัดแต่ง', name: '18 (ห้องน้ำหญิง ตัดแต่ง)' },
  { id: 19, no: '19', zone: 'ห้องน้ำหญิง ตัดแต่ง', name: '19 (ห้องน้ำหญิง ตัดแต่ง)' },
  { id: 20, no: '20', zone: 'ห้องน้ำชาย ตัดแต่ง', name: '20 (ห้องน้ำชาย ตัดแต่ง)' },
  { id: 21, no: '21', zone: 'ห้องน้ำชาย ตัดแต่ง', name: '21 (ห้องน้ำชาย ตัดแต่ง)' },
  { id: 22, no: '22', zone: 'ห้องน้ำชาย ตัดแต่ง', name: '22 (ห้องน้ำชาย ตัดแต่ง)' },
  { id: 23, no: '23', zone: 'ห้องน้ำหัวหน้า ตัดแต่ง', name: '23 (ห้องน้ำหัวหน้า ตัดแต่ง)' }
];

export const COCKROACH_MONTHLY_DATA_2569 = ${JSON.stringify(cockroachMonthly, null, 2)};
`;

fs.writeFileSync(path.join(outDir, 'cockroachData.js'), cockroachContent, 'utf8');

// 3. LINE WALK DATA
const wbL = XLSX.readFile(path.join(__dirname, '..', 'ไฟล์ตัวอย่าง', 'กราฟแมลงเดินไลน์ 2569.xlsx'));
const lineWalkMonthly = {};
wbL.SheetNames.forEach(s => {
  const ws = wbL.Sheets[s];
  const d = XLSX.utils.sheet_to_json(ws);
  lineWalkMonthly[s.trim()] = d.filter(r => r['แผนก/พื้นที่']);
});

const lineWalkContent = `// Production Line Walk Inspection Data (การเดินไลน์)
export const LINE_WALK_AREAS = [
  'โรงฆ่า',
  'ผ่าซาก',
  'ห้องเครื่องในขาว',
  'ห้องเครื่องในแดง',
  'ห้องแพ็คเครื่องใน',
  'เผาขา',
  'ตัดแต่ง',
  'โหลดสินค้า',
  'รอบโรงฆ่า/ตัดแต่ง/ชั้นใต้ดิน',
  'ชั้นใต้ดิน เฟส 5',
  'ชั้นใต้ดิน เฟส 5.1',
  'เฟส 5.1',
  'คลังสินค้า 3',
  'รอบคลังสินค้า 3',
  'Slice ชั้น 1 (ทางเข้าไลน์)',
  'Slice เลื่อย/Slice เตรียม',
  'Slice 4.1/Pack Slice/MDC',
  'Slice ชั้น 2',
  'Slice ชั้น 3',
  'รอบอาคารคลังสินค้า 4',
  'อาคาร A',
  'อาคาร C'
];

export const LINE_WALK_MONTHLY_DATA_2569 = ${JSON.stringify(lineWalkMonthly, null, 2)};
`;

fs.writeFileSync(path.join(outDir, 'lineWalkData.js'), lineWalkContent, 'utf8');

// 4. RODENT DATA
const wbR = XLSX.readFile(path.join(__dirname, '..', 'ไฟล์ตัวอย่าง', 'กราฟแนวโน้มจุดวางกับดักหนูที่สโตร์ 2569.xlsx'));
const rodentTrend = XLSX.utils.sheet_to_json(wbR.Sheets['รวมสรุป']).filter(r => r['เดือน'] && r['เดือน'] !== 'เดือน');

const rodentContent = `// Store Rodent Trap Data (กับดักหนูที่สโตร์)
export const RODENT_STATIONS = [
  { id: 1, name: 'สถานี 1', code: '57', area: 'สถานี 1 (57) สโตร์' },
  { id: 2, name: 'สถานี 2', code: '58', area: 'สถานี 2 (58) สโตร์' },
  { id: 3, name: 'สถานี 3', code: '59', area: 'สถานี 3 (59) สโตร์' },
  { id: 4, name: 'สถานี 4', code: '60', area: 'สถานี 4 (60) สโตร์' },
  { id: 5, name: 'สถานี 5', code: '61', area: 'สถานี 5 (61) สโตร์' },
  { id: 6, name: 'สถานี 6', code: '62', area: 'สถานี 6 (62) สโตร์' },
  { id: 7, name: 'สถานี 7', code: '63', area: 'สถานี 7 (63) สโตร์' },
  { id: 8, name: 'สถานี 8', code: '64', area: 'สถานี 8 (64) สโตร์' },
  { id: 9, name: 'สถานี 9', code: '66', area: 'สถานี 9 (66) สโตร์' },
  { id: 10, name: 'สถานี 10', code: '65', area: 'สถานี 10 (65) สโตร์' }
];

export const RODENT_YEARLY_TREND_2569 = ${JSON.stringify(rodentTrend, null, 2)};
`;

fs.writeFileSync(path.join(outDir, 'rodentData.js'), rodentContent, 'utf8');

console.log('Built data files successfully!');
