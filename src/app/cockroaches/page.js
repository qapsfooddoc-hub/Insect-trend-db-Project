'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { 
  Save, RotateCcw, Printer, Calendar, CheckCircle2, 
  AlertTriangle, BarChart3, FileText, Layers, ShieldCheck, 
  Sparkles, Check, Home, Activity, CalendarDays, MousePointerClick, RefreshCw, Eraser, Clock
} from 'lucide-react';
import FormNav from '@/components/FormNav';
import MonthYearPicker, { getAvailableYearsRange } from '@/components/MonthYearPicker';
import { 
  COCKROACH_POINTS, 
  COCKROACH_ZONES, 
  COCKROACH_MONTHLY_DATA_2569 
} from '@/lib/data/cockroachData';
import { 
  getStoredPoints, 
  deriveCockroachPoints, 
  deriveCockroachZones 
} from '@/lib/data/pointsManager';

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const QUARTERS_CONFIG = {
  'Q1': {
    id: 'Q1',
    name: 'ไตรมาส 1 (ม.ค. - มี.ค.)',
    shortName: 'ไตรมาส 1',
    rangeText: 'มกราคม - มีนาคม',
    months: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม'],
    submissionDate: '14/04/2569'
  },
  'Q2': {
    id: 'Q2',
    name: 'ไตรมาส 2 (เม.ย. - มิ.ย.)',
    shortName: 'ไตรมาส 2',
    rangeText: 'เมษายน - มิถุนายน',
    months: ['เมษายน', 'พฤษภาคม', 'มิถุนายน'],
    submissionDate: '15/07/2569'
  },
  'Q3': {
    id: 'Q3',
    name: 'ไตรมาส 3 (ก.ค. - ก.ย.)',
    shortName: 'ไตรมาส 3',
    rangeText: 'กรกฎาคม - กันยายน',
    months: ['กรกฎาคม', 'สิงหาคม', 'กันยายน'],
    submissionDate: '15/10/2569'
  },
  'Q4': {
    id: 'Q4',
    name: 'ไตรมาส 4 (ต.ค. - ธ.ค.)',
    shortName: 'ไตรมาส 4',
    rangeText: 'ตุลาคม - ธันวาคม',
    months: ['ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
    submissionDate: '15/01/2570'
  }
};

const COCKROACH_QUARTERLY_PAGES = [
  {
    page: 1,
    pageLabel: 'หน้าที่ 1/3',
    title: 'โรงอาหารตัดแต่งห้อง 1 & 2 (จุด 01 - 12)',
    zones: [
      {
        id: 'canteen1',
        name: 'โรงอาหารตัดแต่งห้องที่ 1',
        chartTitle: 'กราฟแนวโน้มจำนวนแมลงสาบ',
        chartSubtitleName: 'โรงอาหารตัดแต่ง',
        pointIds: [1, 2, 3, 4, 5, 6, 7, 8],
        narrativeName: 'โรงอาหารห้อง 1'
      },
      {
        id: 'canteen2',
        name: 'โรงอาหารตัดแต่งห้องที่ 2',
        chartTitle: 'กราฟแนวโน้มจำนวนแมลงสาบ',
        chartSubtitleName: 'โรงอาหาร 2',
        pointIds: [9, 10, 11, 12],
        narrativeName: 'โรงอาหารห้อง 2'
      }
    ]
  },
  {
    page: 2,
    pageLabel: 'หน้าที่ 2/3',
    title: 'ล็อกเกอร์ & ห้องน้ำหญิงตัดแต่ง (จุด 13 - 19)',
    zones: [
      {
        id: 'locker',
        name: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง',
        chartTitle: 'กราฟแนวโน้มจำนวนแมลงสาบ',
        chartSubtitleName: 'ล็อกเกอร์ตัดแต่ง',
        pointIds: [13, 14, 15, 16],
        narrativeName: 'ล็อกเกอร์ตัดแต่ง'
      },
      {
        id: 'toiletFemale',
        name: 'ห้องน้ำหญิง ตัดแต่ง',
        chartTitle: 'กราฟแนวโน้มจำนวนแมลงสาบ',
        chartSubtitleName: 'ห้องน้ำหญิงตัดแต่ง',
        pointIds: [17, 18, 19],
        narrativeName: 'ห้องน้ำหญิงตัดแต่ง'
      }
    ]
  },
  {
    page: 3,
    pageLabel: 'หน้าที่ 3/3',
    title: 'ห้องน้ำชาย & ห้องน้ำหัวหน้าตัดแต่ง (จุด 20 - 23)',
    zones: [
      {
        id: 'toiletMale',
        name: 'ห้องน้ำชาย ตัดแต่ง',
        chartTitle: 'กราฟแนวโน้มจำนวนแมลงสาบ',
        chartSubtitleName: 'ห้องน้ำชายตัดแต่ง',
        pointIds: [20, 21, 22],
        narrativeName: 'ห้องน้ำชายตัดแต่ง'
      },
      {
        id: 'toiletHead',
        name: 'ห้องน้ำหัวหน้า ตัดแต่ง',
        chartTitle: 'กราฟแนวโน้มจำนวนแมลงสาบ',
        chartSubtitleName: 'ห้องน้ำหัวหน้าตัดแต่ง',
        pointIds: [23],
        narrativeName: 'ห้องน้ำหัวหน้าตัดแต่ง'
      }
    ]
  }
];

// Custom X-axis angled category tick for monthly 23 points chart (-52 degrees)
const AngledCategoryTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dx={-2}
        dy={8}
        textAnchor="end"
        fill="#334155"
        fontSize={8.5}
        fontWeight={500}
        transform="rotate(-52)"
      >
        {payload.value}
      </text>
    </g>
  );
};

// Boxed label on top of bar [ 18 ] with white background and dark red border (matching Image 1)
const BoxedBarLabel = (props) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === null) return null;
  const labelText = String(value);
  const boxWidth = Math.max(18, labelText.length * 7 + 8);
  const boxHeight = 15;
  const boxX = x + width / 2 - boxWidth / 2;
  const boxY = Math.max(2, y - boxHeight - 3);

  return (
    <g>
      <rect
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        fill="#ffffff"
        stroke="#8b2522"
        strokeWidth={1}
        rx={1}
      />
      <text
        x={x + width / 2}
        y={boxY + boxHeight / 2}
        fill="#8b2522"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9.5}
        fontWeight="bold"
      >
        {labelText}
      </text>
    </g>
  );
};

// Safe, crash-proof bar label for quarterly clustered bars
const QuarterlyBarLabel = (props) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === null || value === 0 || value === '0') return null;
  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Math.max(10, Number(y) - 4)}
      fill="#334155"
      textAnchor="middle"
      fontSize={8.5}
      fontWeight="bold"
    >
      {value}
    </text>
  );
};

// Exact drawing XML narratives from 6.กราฟแนวโน้ม(แมลงสาบ) 2569.xlsx (Continuous text without line breaks for active zones, 3-line format for inactive canteens)
const QUARTERLY_EXACT_NARRATIVES = {
  'Q1': {
    'canteen1': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 1\nเดือนมกราคม-มีนาคม พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'canteen2': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 2\nเดือนมกราคม-มีนาคม พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'locker': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งล็อคเกอร์ตัดแต่ง เดือนมกราคม-มีนาคม พ.ศ. {year} พบว่า ในตำแหน่ง No.13 มีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง ตำแหน่ง No.14,15,16 มีแนวโน้มลดลงในเดือนกุมภาพันธ์และเพิ่มขึ้นในเดือนมีนาคม ดังนั้นทางทีมทำความสะอาดต้องเฝ้าระวังอย่างเคร่งครัด และทำความสะอาดอย่างสม่ำเสมอ เพื่อให้แมลงสาบที่พบมีจำนวนลดลง',
    'toiletFemale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหญิงตัดแต่ง เดือนมกราคม-มีนาคม พ.ศ. {year} พบว่า ตำแหน่ง No.17-18 มีจำนวนแมลงสาบที่เพิ่มขึ้นในเดือนกุมภาพันธ์และลดลงในเดือนมีนาคม ตำแหน่ง No.19 มีแนวโน้มลดลงในเดือนกุมภาพันธ์และเพิ่มขึ้นในเดือนมีนาคม ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดในตำแหน่งห้องน้ำหญิงตัดแต่งอย่างสม่ำเสมอ พร้อมทั้งให้หน่วยงานที่เกี่ยวข้องเฝ้าระวังกิจกรรมที่จะก่อให้เกิดแมลงสาบ เพื่อให้แมลงสาบที่พบมีจำนวนลดลงจนเป็น 0',
    'toiletMale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำชายตัดแต่ง เดือนมกราคม-มีนาคม พ.ศ. {year} พบว่า ในตำแหน่งที่ No.20 และ No.21 จำนวนแมลงสาบมีแนวโน้มที่ลดลงอย่างต่อเนื่อง และ No.22 จำนวนแมลงสาบลดลงในเดือนกุมภาพันธ์แล้วเพิ่มขึ้นในเดือนมีนาคม ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำชายตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้เป็นประจำ',
    'toiletHead': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหัวหน้าตัดแต่ง เดือนมกราคม-มีนาคม พ.ศ. {year} บ้านแมลงสาบตำแหน่ง No.23 ในเดือนมกราคมพบแมลงสาบจำนวน 11 ตัว และเพิ่มขึ้นในเดือนกุมภาพันธ์เป็น 2 ตัวและเดือนมีนาคม 10 ตัว ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำหัวหน้าตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้'
  },
  'Q2': {
    'canteen1': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 1\nเดือนเมษายน-มิถุนายน พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'canteen2': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 2\nเดือนเมษายน-มิถุนายน พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'locker': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งล็อคเกอร์ตัดแต่ง เดือนเมษายน-มิถุนายน พ.ศ. {year} พบว่า ในตำแหน่ง No.13 มีแนวโน้มคงที่ตลอดไตรมาส No.14,16 มีแนวโน้มเพิ่มขึ้นในเดือนพฤษภาคมและลดลงในเดือนมิถุนายน ส่วน No.15 มีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง ดังนั้นทางทีมทำความสะอาดต้องเฝ้าระวังอย่างเคร่งครัด และทำความสะอาดอย่างสม่ำเสมอ เพื่อให้แมลงสาบที่พบมีจำนวนลดลง',
    'toiletFemale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหญิงตัดแต่ง เดือนเมษายน-มิถุนายน พ.ศ. {year} พบว่า ตำแหน่ง No.17,19 มีจำนวนแมลงสาบเพิ่มขึ้นในเดือนพฤษภาคมและลดลงในเดือนมิถุนายน ตำแหน่ง No.18 มีจำนวนแมลงสาบที่เพิ่มขึ้นอย่างต่อเนื่อง ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดในตำแหน่งห้องน้ำหญิงตัดแต่งอย่างสม่ำเสมอ พร้อมทั้งให้หน่วยงานที่เกี่ยวข้องเฝ้าระวังกิจกรรมที่จะก่อให้เกิดแมลงสาบ เพื่อให้แมลงสาบที่พบมีจำนวนลดลงจนเป็น 0',
    'toiletMale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำชายตัดแต่ง เดือนเมษายน-มิถุนายน พ.ศ. {year} พบว่า ในตำแหน่งที่ No.20 มีแนวโน้มลดลงเฉพาะในเดือนพฤษภาคม ตำแหน่ง No.21 จำนวนแมลงสาบมีแนวโน้มที่เพิ่มขึ้นอย่างต่อเนื่อง และตำแหน่ง No.22 จำนวนแมลงสาบเพิ่มขึ้นเล็กน้อยในเดือนพฤษภาคม ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำชายตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้เป็นประจำ',
    'toiletHead': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหัวหน้าตัดแต่ง เดือนเมษายน-มิถุนายน พ.ศ. {year} บ้านแมลงสาบตำแหน่ง No.23 ในเดือนเมษายนพบแมลงสาบจำนวน 6 ตัว และเพิ่มขึ้นโดยในเดือนพฤษภาคมพบ 12 ตัวและเดือนมิถุนายนลดลงพบ 7 ตัว ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำหัวหน้าตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้'
  },
  'Q3': {
    'canteen1': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 1\nเดือนกรกฎาคม-กันยายน พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'canteen2': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 2\nเดือนกรกฎาคม-กันยายน พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'locker': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งล็อคเกอร์ตัดแต่ง เดือนกรกฎาคม-กันยายน พ.ศ. {year} พบว่า ในตำแหน่ง No.13,No.15 มีแนวโน้มเพิ่มขึ้นในเดือนกันยายน ตำแหน่ง No.14 ลดลงในเดือนสิงหาคม และตำแหน่ง No.16 ลดลงเฉพาะในเดือนสิงหาคม ดังนั้นทางทีมทำความสะอาดต้องเฝ้าระวังอย่างเคร่งครัด และทำความสะอาดอย่างสม่ำเสมอ เพื่อให้แมลงสาบที่พบมีจำนวนลดลง',
    'toiletFemale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหญิงตัดแต่ง เดือนกรกฎาคม-กันยายน พ.ศ. {year} พบว่า ตำแหน่ง No.17 มีแนวโน้มเพิ่มขึ้นในเดือนสิงหาคมและคงที่ในเดือนกันยายน ตำแหน่ง No.18 มีจำนวนแมลงสาบที่เพิ่มขึ้นเฉพาะเดือนสิงหาคม ตำแหน่ง No.19 ลดลงเฉพาะในเดือนสิงหาคม ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดในตำแหน่งห้องน้ำหญิงตัดแต่งอย่างสม่ำเสมอ พร้อมทั้งให้หน่วยงานที่เกี่ยวข้องเฝ้าระวังกิจกรรมที่จะก่อให้เกิดแมลงสาบ เพื่อให้แมลงสาบที่พบมีจำนวนลดลงจนเป็น 0',
    'toiletMale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำชายตัดแต่ง เดือนกรกฎาคม-กันยายน พ.ศ. {year} พบว่า ในตำแหน่งที่ No.20 มีแนวโน้มที่ลดลงในเดือนสิงหาคมและเพิ่มขึ้นเล็กน้อยในเดือนกันยายน ตำแหน่ง No.21 จำนวนแมลงสาบมีแนวโน้มที่เพิ่มขึ้นสูงในเดือนสิงหาคม และตำแหน่ง No.22 จำนวนสูงขึ้นในเดือนกันยายน ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำชายตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้เป็นประจำ',
    'toiletHead': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหัวหน้าตัดแต่ง เดือนกรกฎาคม-กันยายน พ.ศ. {year} บ้านแมลงสาบตำแหน่ง No.23 ในเดือนกรกฎาคมพบแมลงสาบจำนวน 4 ตัว แล้วลดลงในเดือนสิงหาคมพบ 1 ตัวและเพิ่มขึ้นในเดือนกันยายนพบ 3 ตัว ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำหัวหน้าตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้'
  },
  'Q4': {
    'canteen1': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 1\nเดือนตุลาคม-ธันวาคม พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'canteen2': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งโรงอาหารห้อง 2\nเดือนตุลาคม-ธันวาคม พ.ศ. {year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่',
    'locker': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งล็อคเกอร์ตัดแต่ง เดือนตุลาคม-ธันวาคม พ.ศ. {year} พบว่า ในตำแหน่ง No.13,No.14,No.15 มีแนวโน้มเพิ่มขึ้น โดยพบมากที่สุดในเดือนธันวาคม ตำแหน่ง No.16 มีแนวโน้มที่คงที่ตลอดทั้งไตรมาส ดังนั้นทางทีมทำความสะอาดต้องเฝ้าระวังอย่างเคร่งครัด และทำความสะอาดอย่างสม่ำเสมอ เพื่อให้แมลงสาบที่พบมีจำนวนลดลง',
    'toiletFemale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหญิงตัดแต่ง เดือนตุลาคม-ธันวาคม พ.ศ. {year} พบว่า ตำแหน่ง No.17,No.19 มีจำนวนแมลงสาบที่ลดลงเฉพาะเดือนพฤศจิกายน ตำแหน่ง No.18 มีแนวโน้มที่เพิ่มขึ้น ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดในตำแหน่งห้องน้ำหญิงตัดแต่งอย่างสม่ำเสมอ พร้อมทั้งให้หน่วยงานที่เกี่ยวข้องเฝ้าระวังกิจกรรมที่จะก่อให้เกิดแมลงสาบ เพื่อให้แมลงสาบที่พบมีจำนวนลดลงจนเป็น 0',
    'toiletMale': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำชายตัดแต่ง เดือนตุลาคม-ธันวาคม พ.ศ. {year} พบว่า ในตำแหน่งที่ No.20 มีแนวโน้มที่ลดลง ตำแหน่ง No.21,No.22 มีแนวโน้มที่เพิ่มขึ้น ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำชายตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้เป็นประจำ',
    'toiletHead': 'จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่งห้องน้ำหัวหน้าตัดแต่ง เดือนตุลาคม-ธันวาคม พ.ศ. {year} บ้านแมลงสาบตำแหน่ง No.23 ในเดือนตุลาคม-พฤศจิกายน มีจำนวนคงที่ และเพิ่มขึ้นในเดือนธันวาคม ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำหัวหน้าตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้'
  }
};

export default function CockroachesPage() {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'entry', 'print'
  const [graphSubTab, setGraphSubTab] = useState('monthly'); // 'monthly', 'quarterly'
  const [selectedMonth, setSelectedMonth] = useState('สิงหาคม');
  const [selectedYear, setSelectedYear] = useState('2569');
  const [selectedQuarter, setSelectedQuarter] = useState('Q1'); // 'Q1', 'Q2', 'Q3', 'Q4'
  const [quarterlyPage, setQuarterlyPage] = useState('all'); // 'all', '1', '2', '3'
  const [selectedSheet, setSelectedSheet] = useState('all'); // 'all', '1', '2'
  const [reporterName, setReporterName] = useState('อรพิน');
  const [reviewerName, setReviewerName] = useState('พัชรินทร์');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [printJob, setPrintJob] = useState('none'); // 'none', 'monthly', 'quarterly', 'single', 'all'
  const [printPreviewTab, setPrintPreviewTab] = useState('monthly'); // 'monthly', 'quarterly', 'zone'
  const [selectedPrintZone, setSelectedPrintZone] = useState('โรงอาหารตัดแต่งห้องที่ 1');
  const [placementDays, setPlacementDays] = useState([5, 11, 19, 26]);
  const [placementInput, setPlacementInput] = useState('5, 11, 19, 26');

  // Zone status configuration (key: `${year}_${quarter}_${zoneId}` -> 'auto' | 'active' | 'inactive' | 'renovating')
  const [zoneStatuses, setZoneStatuses] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cockroach_zone_statuses');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Custom user narrative overrides (key: `${year}_${quarter}_${zoneId}` -> custom text string)
  const [customNarratives, setCustomNarratives] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('cockroach_custom_narratives');
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  // Inline editing state for narrative on screen
  const [editingNarrativeKey, setEditingNarrativeKey] = useState(null); // `${year}_${quarter}_${zoneId}`
  const [editingNarrativeText, setEditingNarrativeText] = useState('');

  const handleSetZoneStatus = (zoneId, status, year = selectedYear, quarter = selectedQuarter) => {
    const key = `${year}_${quarter}_${zoneId}`;
    setZoneStatuses(prev => {
      const next = { ...prev, [key]: status };
      if (typeof window !== 'undefined') {
        localStorage.setItem('cockroach_zone_statuses', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleBatchSetZoneStatuses = (status, year = selectedYear, quarter = selectedQuarter) => {
    const zoneIds = ['canteen1', 'canteen2', 'locker', 'toiletFemale', 'toiletMale', 'toiletHead'];
    setZoneStatuses(prev => {
      const next = { ...prev };
      zoneIds.forEach(id => {
        next[`${year}_${quarter}_${id}`] = status;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('cockroach_zone_statuses', JSON.stringify(next));
      }
      return next;
    });
  };

  const handleStartEditNarrative = (zoneId, currentText, year = selectedYear, quarter = selectedQuarter) => {
    const key = `${year}_${quarter}_${zoneId}`;
    setEditingNarrativeKey(key);
    setEditingNarrativeText(currentText);
  };

  const handleSaveEditNarrative = (zoneId, year = selectedYear, quarter = selectedQuarter) => {
    const key = `${year}_${quarter}_${zoneId}`;
    setCustomNarratives(prev => {
      const next = { ...prev, [key]: editingNarrativeText.trim() };
      if (typeof window !== 'undefined') {
        localStorage.setItem('cockroach_custom_narratives', JSON.stringify(next));
      }
      return next;
    });
    setEditingNarrativeKey(null);
  };

  const handleResetCustomNarrative = (zoneId, year = selectedYear, quarter = selectedQuarter) => {
    const key = `${year}_${quarter}_${zoneId}`;
    setCustomNarratives(prev => {
      const next = { ...prev };
      delete next[key];
      if (typeof window !== 'undefined') {
        localStorage.setItem('cockroach_custom_narratives', JSON.stringify(next));
      }
      return next;
    });
    if (editingNarrativeKey === key) {
      setEditingNarrativeKey(null);
    }
  };

  const handleCancelEditNarrative = () => {
    setEditingNarrativeKey(null);
    setEditingNarrativeText('');
  };

  // Dynamic cockroach points managed by Admin (falls back to 23 default points)
  const [customPoints, setCustomPoints] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = getStoredPoints('cockroaches');
      if (stored && stored.length > 0) {
        return deriveCockroachPoints(stored, false);
      }
    }
    return COCKROACH_POINTS;
  });

  const activeZones = useMemo(() => {
    return deriveCockroachZones(customPoints);
  }, [customPoints]);

  useEffect(() => {
    const handlePointsSync = (e) => {
      if (e.detail?.category === 'cockroaches') {
        setCustomPoints(deriveCockroachPoints(e.detail.points, false));
      }
    };
    window.addEventListener('points-updated', handlePointsSync);
    return () => window.removeEventListener('points-updated', handlePointsSync);
  }, []);

  const handlePrint = (job) => {
    setPrintJob(job);
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Window print error:', err);
      }
    }, 250);
  };

  useEffect(() => {
    setMounted(true);
    const handleAfterPrint = () => setPrintJob('none');
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Current calendar date (Thai Buddhist Era)
  const currentCalendar = useMemo(() => {
    const now = new Date();
    const ceYear = now.getFullYear();
    const beYear = ceYear + 543;
    const monthIndex = now.getMonth(); // 0 = Jan, 8 = Sep
    return {
      ceYear,
      beYear,
      monthIndex,
      monthName: MONTH_NAMES[monthIndex] || 'กันยายน',
      day: now.getDate()
    };
  }, []);

  const [savedMonthsVersion, setSavedMonthsVersion] = useState(0);

  // Months with real recorded data in selectedYear
  const recordedMonths = useMemo(() => {
    const list = [];
    if (typeof window !== 'undefined') {
      MONTH_NAMES.forEach(m => {
        const key1 = `cockroach_daily_${selectedYear}_${m}`;
        const key2 = `cockroach_records_${m}_${selectedYear}`;
        if (localStorage.getItem(key1) || localStorage.getItem(key2)) {
          list.push(m);
        }
      });
    }
    return list;
  }, [selectedYear, savedMonthsVersion]);

  // All 12 months are accessible
  const availableMonths = MONTH_NAMES;

  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1] || 'สิงหาคม');
    }
  }, [availableMonths, selectedMonth]);

  // Number of days in the currently selected month and year
  const daysInMonth = useMemo(() => {
    const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
    if (monthIndex === -1) return 31;
    const yearCE = parseInt(selectedYear, 10) - 543;
    return new Date(yearCE, monthIndex + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  // Daily records state: dynamic points x 31 days
  const [dailyRecords, setDailyRecords] = useState(() => {
    const init = {};
    for (let p = 1; p <= 50; p++) {
      init[p] = {};
      for (let d = 1; d <= 31; d++) {
        init[p][d] = '';
      }
    }
    return init;
  });

  // Dynamically ensure dailyRecords has slots for any newly added custom points
  useEffect(() => {
    setDailyRecords(prev => {
      let needsUpdate = false;
      const next = { ...prev };
      customPoints.forEach(pt => {
        if (!next[pt.id]) {
          next[pt.id] = {};
          for (let d = 1; d <= 31; d++) {
            next[pt.id][d] = '';
          }
          needsUpdate = true;
        }
      });
      return needsUpdate ? next : prev;
    });
  }, [customPoints]);

  // Pre-load sample data from August 2569 (from scanned document 20260928092056408_0001.jpg)
  const loadAugustSampleData = () => {
    const augustData = {
      13: [1, 0, 1, 0, 'วาง', '-', 1, 0, 1, 0, 'วาง', '-', 2, 1, 0, 1, 0, 2, 'วาง', '-', 0, 1, 0, 1, 1, 'วาง', '-', 1, 0, 1, '-'],
      14: [1, 2, 1, 1, 'วาง', '-', 2, 1, 1, 2, 'วาง', '-', 1, 1, 1, 1, 2, 1, 'วาง', '-', 1, 1, 1, 0, 1, 'วาง', '-', 1, 1, 0, '-'],
      15: [0, 1, 1, 1, 'วาง', '-', 1, 1, 0, 1, 'วาง', '-', 2, 0, 1, 2, 1, 0, 'วาง', '-', 1, 1, 1, 0, 1, 'วาง', '-', 1, 1, 1, '-'],
      16: [2, 0, 1, 0, 'วาง', '-', 0, 1, 0, 1, 'วาง', '-', 3, 1, 1, 2, 1, 1, 'วาง', '-', 1, 1, 0, 1, 0, 'วาง', '-', 1, 1, 0, '-'],
      17: [1, 0, 2, 1, 'วาง', '-', 1, 1, 1, 1, 'วาง', '-', 1, 1, 1, 0, 1, 0, 'วาง', '-', 1, 1, 1, 1, 1, 'วาง', '-', 2, 0, 1, '-'],
      18: [0, 1, 1, 0, 'วาง', '-', 1, 0, 1, 0, 'วาง', '-', 0, 1, 1, 0, 0, 1, 'วาง', '-', 0, 1, 1, 0, 2, 'วาง', '-', 1, 1, 2, '-'],
      19: [1, 0, 1, 0, 'วาง', '-', 0, 1, 1, 0, 'วาง', '-', 1, 0, 1, 0, 1, 2, 'วาง', '-', 0, 1, 1, 1, 1, 'วาง', '-', 1, 1, 1, '-'],
      20: [1, 1, 1, 0, 'วาง', '-', 0, 1, 0, 2, 'วาง', '-', 1, 0, 1, 1, 0, 0, 'วาง', '-', 0, 0, 1, 1, 1, 'วาง', '-', 0, 1, 0, '-'],
      21: [0, 0, 1, 1, 'วาง', '-', 1, 1, 1, 1, 'วาง', '-', 0, 0, 0, 1, 1, 1, 'วาง', '-', 0, 0, 0, 1, 0, 'วาง', '-', 1, 0, 0, '-'],
      22: [0, 1, 0, 1, 'วาง', '-', 0, 1, 0, 1, 'วาง', '-', 1, 1, 0, 0, 0, 0, 'วาง', '-', 0, 0, 0, 0, 0, 'วาง', '-', 0, 0, 1, '-'],
      23: [0, 0, 0, 0, 'วาง', '-', 0, 0, 1, 0, 'วาง', '-', 0, 1, 0, 0, 0, 0, 'วาง', '-', 0, 0, 0, 1, 0, 'วาง', '-', 1, 0, 1, '-']
    };

    const newRecords = {};
    for (let p = 1; p <= 23; p++) {
      newRecords[p] = {};
      const sampleRow = augustData[p];
      for (let d = 1; d <= 31; d++) {
        if (sampleRow && sampleRow[d - 1] !== undefined) {
          newRecords[p][d] = sampleRow[d - 1];
        } else {
          // Points 1-12 are 0
          newRecords[p][d] = [5, 11, 19, 26].includes(d) ? 'วาง' : 0;
        }
      }
    }
    setPlacementDays([5, 11, 19, 26]);
    setPlacementInput('5, 11, 19, 26');
    setDailyRecords(newRecords);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `cockroach_daily_${selectedYear}_${selectedMonth}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDailyRecords(parsed.records || {});
          if (parsed.placementDays && Array.isArray(parsed.placementDays)) {
            setPlacementDays(parsed.placementDays);
            setPlacementInput(parsed.placementDays.join(', '));
          } else {
            const detected = [];
            for (let d = 1; d <= 31; d++) {
              if (parsed.records?.[1]?.[d] === 'วาง' || parsed.records?.[13]?.[d] === 'วาง') {
                detected.push(d);
              }
            }
            const finalDays = detected.length > 0 ? detected : [5, 11, 19, 26];
            setPlacementDays(finalDays);
            setPlacementInput(finalDays.join(', '));
          }
          setReporterName(parsed.reporter || 'อรพิน');
          setReviewerName(parsed.reviewer || 'พัชรินทร์');
          return;
        } catch (e) {}
      }

      // Default August data from sample image
      if (selectedMonth === 'สิงหาคม') {
        loadAugustSampleData();
      } else {
        const defaultDays = [1, 8, 15, 22, 29];
        setPlacementDays(defaultDays);
        setPlacementInput(defaultDays.join(', '));
        const init = {};
        for (let p = 1; p <= 23; p++) {
          init[p] = {};
          for (let d = 1; d <= 31; d++) {
            init[p][d] = defaultDays.includes(d) ? 'วาง' : 0;
          }
        }
        setDailyRecords(init);
      }
    }
  }, [selectedMonth, selectedYear]);

  // Apply placement days to all 23 points
  const applyPlacementDays = (daysArray) => {
    const sorted = [...new Set(daysArray.filter(d => d >= 1 && d <= 31))].sort((a, b) => a - b);
    setPlacementDays(sorted);
    setPlacementInput(sorted.join(', '));

    setDailyRecords(prev => {
      const next = {};
      for (let p = 1; p <= 23; p++) {
        next[p] = { ...(prev[p] || {}) };
        for (let d = 1; d <= 31; d++) {
          if (sorted.includes(d)) {
            next[p][d] = 'วาง';
          } else if (next[p][d] === 'วาง') {
            next[p][d] = 0;
          }
        }
      }
      return next;
    });
  };

  const handleApplyPlacementInput = () => {
    const nums = placementInput
      .split(/[,\s]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= 31);
    applyPlacementDays(nums);
  };

  const togglePlacementDay = (dayNum) => {
    let nextDays;
    if (placementDays.includes(dayNum)) {
      nextDays = placementDays.filter(d => d !== dayNum);
    } else {
      nextDays = [...placementDays, dayNum].sort((a, b) => a - b);
    }
    applyPlacementDays(nextDays);
  };

  // Auto-mark Sundays as '-' (ignoring days already marked as 'วาง')
  const autoFillSundays = () => {
    const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
    const yearCE = parseInt(selectedYear, 10) - 543;
    const maxDays = new Date(yearCE, monthIndex + 1, 0).getDate();
    const sundays = [];
    for (let d = 1; d <= maxDays; d++) {
      const date = new Date(yearCE, monthIndex, d);
      if (date.getDay() === 0) {
        sundays.push(d);
      }
    }

    setDailyRecords(prev => {
      const next = {};
      for (let p = 1; p <= 23; p++) {
        next[p] = { ...(prev[p] || {}) };
        sundays.forEach(d => {
          if (next[p][d] !== 'วาง') {
            next[p][d] = '-';
          }
        });
      }
      return next;
    });
  };

  // Fill remaining empty cells with 0
  const fillRemainingZeros = () => {
    const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
    const yearCE = parseInt(selectedYear, 10) - 543;
    const maxDays = new Date(yearCE, monthIndex + 1, 0).getDate();

    setDailyRecords(prev => {
      const next = {};
      for (let p = 1; p <= 23; p++) {
        next[p] = { ...(prev[p] || {}) };
        for (let d = 1; d <= 31; d++) {
          if (d <= maxDays) {
            if (next[p][d] === '' || next[p][d] === undefined || next[p][d] === null) {
              next[p][d] = placementDays.includes(d) ? 'วาง' : 0;
            }
          } else {
            next[p][d] = '-';
          }
        }
      }
      return next;
    });
  };

  // Reset/Clear table for current month
  const handleClearTable = () => {
    if (typeof window !== 'undefined' && window.confirm(`คุณต้องการล้างข้อมูลในตารางประจำเดือน ${selectedMonth} ${selectedYear} ทั้งหมดหรือไม่?`)) {
      const init = {};
      for (let p = 1; p <= 23; p++) {
        init[p] = {};
        for (let d = 1; d <= 31; d++) {
          init[p][d] = placementDays.includes(d) ? 'วาง' : '';
        }
      }
      setDailyRecords(init);
    }
  };

  // Handle cell edit with keyboard auto-shortcut for 'วาง' and '-'
  const handleCellChange = (pointId, day, val) => {
    let cleanVal = val.trim();
    if (cleanVal.toLowerCase() === 'w' || cleanVal === 'ว') {
      cleanVal = 'วาง';
    }
    setDailyRecords(prev => ({
      ...prev,
      [pointId]: {
        ...prev[pointId],
        [day]: cleanVal
      }
    }));
  };

  // Excel-like keyboard navigation for the 31-day table
  const handleTableKeyDown = (e, rIdx, day) => {
    const focusCell = (targetRow, targetDay) => {
      if (targetRow < 0 || targetRow >= displayPoints.length) return false;
      if (targetDay < 1 || targetDay > daysInMonth) return false;
      const el = document.getElementById(`cell-roach-${targetRow}-${targetDay}`);
      if (el && !el.disabled) {
        el.focus();
        el.select();
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        return true;
      }
      return false;
    };

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Enter: Move UP
        focusCell(rIdx - 1, day);
      } else {
        // Enter: Move DOWN
        focusCell(rIdx + 1, day);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusCell(rIdx + 1, day);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusCell(rIdx - 1, day);
    } else if (e.key === 'ArrowRight') {
      let atEnd = true;
      try {
        atEnd = (e.target.selectionStart === e.target.value.length) || 
                (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length);
      } catch (_) {}
      if (atEnd) {
        e.preventDefault();
        focusCell(rIdx, day + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      let atStart = true;
      try {
        atStart = (e.target.selectionStart === 0) || 
                  (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length);
      } catch (_) {}
      if (atStart) {
        e.preventDefault();
        focusCell(rIdx, day - 1);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (day > 1) {
          focusCell(rIdx, day - 1);
        } else if (rIdx > 0) {
          focusCell(rIdx - 1, daysInMonth);
        }
      } else {
        if (day < daysInMonth) {
          focusCell(rIdx, day + 1);
        } else if (rIdx < displayPoints.length - 1) {
          focusCell(rIdx + 1, 1);
        }
      }
    }
  };

  // Calculate sum for a single point
  const getPointTotal = (pointId) => {
    const row = dailyRecords[pointId] || {};
    let sum = 0;
    Object.values(row).forEach(v => {
      const num = parseInt(v, 10);
      if (!isNaN(num) && num > 0) sum += num;
    });
    return sum;
  };

  // Grand total for current month
  const monthlyGrandTotal = useMemo(() => {
    let sum = 0;
    customPoints.forEach(pt => {
      sum += getPointTotal(pt.id);
    });
    return sum;
  }, [dailyRecords, customPoints]);

  // Helper to verify if a month has real recorded data (in localStorage or current session)
  const isMonthRecorded = (month, year = selectedYear) => {
    if (typeof window !== 'undefined') {
      const key1 = `cockroach_daily_${year}_${month}`;
      const key2 = `cockroach_records_${month}_${year}`;
      if (localStorage.getItem(key1) || localStorage.getItem(key2)) {
        return true;
      }
    }
    if (month === selectedMonth && String(year) === String(selectedYear)) {
      return Object.values(dailyRecords || {}).some(row =>
        Object.values(row || {}).some(v => {
          const n = parseInt(v, 10);
          return !isNaN(n) && n > 0;
        })
      );
    }
    return false;
  };

  // Zone totals for current month
  const zoneSummary = useMemo(() => {
    const summary = {};
    activeZones.forEach(z => summary[z] = 0);

    customPoints.forEach(pt => {
      summary[pt.zone] = (summary[pt.zone] || 0) + getPointTotal(pt.id);
    });

    return Object.entries(summary).map(([zone, count]) => ({
      name: zone.replace('ตัดแต่ง', '').trim(),
      fullName: zone,
      count
    }));
  }, [dailyRecords, customPoints, activeZones]);

  // Zone totals formatted for print chart and analysis
  const zoneTotals = useMemo(() => {
    return zoneSummary.map(z => ({
      zone: z.fullName,
      shortName: z.name,
      total: z.count
    }));
  }, [zoneSummary]);

  // Points bar chart data (dynamic points)
  const pointsChartData = useMemo(() => {
    return customPoints.map(pt => ({
      no: pt.no,
      name: `จุด ${pt.no}`,
      fullName: pt.name,
      zone: pt.zone,
      count: getPointTotal(pt.id)
    }));
  }, [dailyRecords, customPoints]);

  // Yearly monthly trends (12 months)
  const yearlyTrendData = useMemo(() => {
    const demoTotals = {
      'มกราคม': 71, 'กุมภาพันธ์': 77, 'มีนาคม': 125, 'เมษายน': 113,
      'พฤษภาคม': 137, 'มิถุนายน': 135, 'กรกฎาคม': 144, 'สิงหาคม': 62,
      'กันยายน': 70, 'ตุลาคม': 68, 'พฤศจิกายน': 70, 'ธันวาคม': 95
    };
    return MONTH_NAMES.map(m => {
      if (m === selectedMonth) {
        return { month: m.substring(0, 4), fullMonth: m, total: monthlyGrandTotal };
      }
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`cockroach_daily_${selectedYear}_${m}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            let sum = 0;
            Object.values(parsed.records || {}).forEach(row => {
              Object.values(row || {}).forEach(v => {
                const num = parseInt(v, 10);
                if (!isNaN(num) && num > 0) sum += num;
              });
            });
            return { month: m.substring(0, 4), fullMonth: m, total: sum };
          } catch (e) {}
        }
      }
      // If user has recorded any month this year, unrecorded months have total 0
      if (recordedMonths.length > 0) {
        return { month: m.substring(0, 4), fullMonth: m, total: 0 };
      }
      return {
        month: m.substring(0, 4),
        fullMonth: m,
        total: selectedYear === '2569' ? (demoTotals[m] || 0) : 0
      };
    });
  }, [selectedMonth, selectedYear, monthlyGrandTotal, recordedMonths]);

  const yearlySum = useMemo(() => {
    return yearlyTrendData.reduce((sum, r) => sum + r.total, 0);
  }, [yearlyTrendData]);

  // Cockroach Analysis Narrative for Official Reports
  const cockroachAnalysisText = useMemo(() => {
    let maxZone = 'โรงฆ่า';
    let maxCount = 0;
    zoneTotals.forEach(z => {
      if (z.total > maxCount) {
        maxCount = z.total;
        maxZone = z.zone;
      }
    });

    if (monthlyGrandTotal === 0) {
      return `จากผลการตรวจติดตามบ้านแมลงสาบ 23 จุดดัก (6 โซนตรวจวัด) ประจำเดือน ${selectedMonth} พ.ศ. ${selectedYear} ไม่พบแมลงสาบในทุกจุดตรวจตลอดทั้งเดือน (ยอดตรวจพบรวม 0 ตัว) แสดงว่าสุขาภิบาลโรงงานและการกำจัดเศษอินทรียวัตถุมีประสิทธิภาพสูง อยู่ในเกณฑ์มาตรฐาน GMP/HACCP ของโรงงาน`;
    }
    return `จากผลการตรวจติดตามบ้านแมลงสาบ 23 จุดดัก (6 โซนตรวจวัด) ประจำเดือน ${selectedMonth} พ.ศ. ${selectedYear} ตรวจพบแมลงสาบรวมทั้งสิ้น ${monthlyGrandTotal} ตัว โดยโซนที่ตรวจพบมากที่สุดคือ โซน${maxZone} (พบสะสม ${maxCount} ตัว) แนะนำให้ฝ่ายควบคุมคุณภาพดำเนินการตรวจสอบความสมบูรณ์ของบ้านแมลงสาบ และปฏิบัติตามมาตรฐานเปลี่ยนบ้านแมลงสาบทุก 1 สัปดาห์อย่างเคร่งครัด พร้อมทั้งฉีดล้างทำความสะอาดร่องระบายน้ำและจุดอับชื้นรอบโซนดังกล่าวทันที`;
  }, [monthlyGrandTotal, zoneTotals, selectedMonth, selectedYear]);

  // Save handler
  const handleSave = async () => {
    if (typeof window !== 'undefined') {
      const key = `cockroach_daily_${selectedYear}_${selectedMonth}`;
      const payload = {
        records: dailyRecords,
        placementDays: placementDays,
        reporter: reporterName,
        reviewer: reviewerName,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(payload));
      localStorage.setItem(`cockroach_records_${selectedMonth}_${selectedYear}`, JSON.stringify(payload));
      setSavedMonthsVersion(v => v + 1);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);

      // Async sync compact summary to Supabase
      try {
        await fetch('/api/pest-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'cockroaches',
            year: selectedYear,
            month: selectedMonth,
            grand_total: monthlyGrandTotal,
            zone_1_total: zoneTotals['โรงอาหารตัดแต่งห้องที่ 1'] || 0,
            zone_2_total: zoneTotals['โรงอาหารตัดแต่งห้องที่ 2'] || 0,
            zone_3_total: zoneTotals['ใต้ตู้ล็อกเกอร์ ตัดแต่ง'] || 0,
            zone_4_total: zoneTotals['ห้องน้ำหญิง ตัดแต่ง'] || 0,
            zone_5_total: zoneTotals['ห้องน้ำชาย ตัดแต่ง'] || 0,
            zone_6_total: zoneTotals['ห้องน้ำหัวหน้า ตัดแต่ง'] || 0,
            point_totals: pointTotals,
            daily_records: dailyRecords,
            reporter: reporterName,
            reviewer: reviewerName
          })
        });
      } catch (e) {
        console.warn('Sync cockroaches to Supabase skipped:', e);
      }
    }
  };

  // Filtered points based on Sheet 1 (01-12) or Sheet 2 (13+)
  const displayPoints = useMemo(() => {
    if (selectedSheet === '1') return customPoints.slice(0, 12);
    if (selectedSheet === '2') return customPoints.slice(12);
    return customPoints;
  }, [selectedSheet, customPoints]);

  const ALL_COCKROACH_PRINT_ZONES = [
    'ภาพรวม 6 โซน',
    'โรงอาหารตัดแต่งห้องที่ 1',
    'โรงอาหารตัดแต่งห้องที่ 2',
    'ใต้ตู้ล็อกเกอร์ ตัดแต่ง',
    'ห้องน้ำหญิง ตัดแต่ง',
    'ห้องน้ำชาย ตัดแต่ง',
    'ห้องน้ำหัวหน้า ตัดแต่ง'
  ];

  const getZoneDetailedChartData = (zone) => {
    if (zone === 'ภาพรวม 6 โซน') {
      return zoneSummary.map(z => ({
        name: z.name,
        fullName: z.fullName,
        count: z.count
      }));
    }
    return customPoints.filter(pt => pt.zone === zone).map(pt => ({
      name: `จุด ${pt.no}`,
      fullName: pt.name,
      count: getPointTotal(pt.id)
    }));
  };

  const getCockroachZoneReportText = (zone) => {
    if (zone === 'ภาพรวม 6 โซน') {
      const topZ = [...zoneSummary].sort((a, b) => b.count - a.count)[0];
      if (monthlyGrandTotal === 0) {
        return `จากการตรวจติดตามบ้านแมลงสาบครอบคลุม 6 โซนตรวจวัด (23 จุดดัก) ประจำเดือน ${selectedMonth} พ.ศ. ${selectedYear} ไม่พบแมลงสาบในทุกจุดตรวจตลอดทั้งเดือน (ยอดตรวจพบรวม 0 ตัว) แสดงว่าสุขาภิบาลโรงงานและการกำจัดเศษอินทรียวัตถุมีประสิทธิภาพสูง อยู่ในเกณฑ์มาตรฐาน GMP/HACCP ของโรงงาน`;
      }
      return `จากการตรวจติดตามบ้านแมลงสาบครอบคลุม 6 โซนตรวจวัด (23 จุดดัก) ประจำเดือน ${selectedMonth} พ.ศ. ${selectedYear} ตรวจพบแมลงสาบรวมทั้งสิ้น ${monthlyGrandTotal} ตัว โดยโซนที่ตรวจพบมากที่สุดคือ โซน${topZ?.fullName} (พบสะสม ${topZ?.count} ตัว) แนะนำให้ฝ่ายควบคุมคุณภาพดำเนินการตรวจสอบความสมบูรณ์ของบ้านแมลงสาบ และปฏิบัติตามมาตรฐานเปลี่ยนบ้านแมลงสาบทุก 1 สัปดาห์อย่างเคร่งครัด พร้อมทั้งฉีดล้างทำความสะอาดร่องระบายน้ำและจุดอับชื้นรอบโซนดังกล่าวทันที`;
    }

    const zonePts = customPoints.filter(pt => pt.zone === zone);
    const zoneCount = zonePts.reduce((sum, pt) => sum + getPointTotal(pt.id), 0);
    const topPt = [...zonePts].map(pt => ({ ...pt, total: getPointTotal(pt.id) })).sort((a, b) => b.total - a.total)[0];

    if (zoneCount === 0) {
      return `จากการตรวจนับจำนวนแมลงสาบ ของทีม ${zone} ประจำเดือน ${selectedMonth} ${selectedYear} ไม่พบแมลงสาบในทุกจุดดักตลอดทั้งเดือน (ยอดตรวจพบ 0 ตัว) มาตรการทำความสะอาดและสุขาภิบาลในพื้นที่อยู่ในเกณฑ์มาตรฐานความปลอดภัยอาหารอย่างดีเยี่ยม`;
    }

    return `จากการตรวจนับจำนวนแมลงสาบ ของทีม ${zone} ประจำเดือน ${selectedMonth} ${selectedYear} พบว่า ตรวจพบแมลงสาบสะสมรวมทั้งสิ้น ${zoneCount} ตัว โดยจุดที่พบมากที่สุดคือ "${topPt?.name}" จำนวน ${topPt?.total} ตัว เนื่องจากเป็นจุดอับชื้นและมีสิ่งของวางใกล้แนวผนัง ดังนั้นจึงควรตรวจสอบและเปลี่ยนบ้านแมลงสาบทุก 1 สัปดาห์อย่างเคร่งครัด ปิดม่านพลาสติกและทำความสะอาดพื้นลดการสะสมของคราบไขมัน ทั้งนี้ เพื่อรักษาและควบคุมจำนวนแมลงสาบในพื้นที่ให้เป็น 0 ตัวต่อไป`;
  };

  // Dynamic point count for any given month/year (prefers user entry in current session or localStorage, falls back to Excel data)
  const getPointCountForMonth = (pointId, month, year) => {
    if (month === selectedMonth && String(year) === String(selectedYear)) {
      return getPointTotal(pointId);
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`cockroach_daily_${year}_${month}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const row = parsed.records?.[pointId] || {};
          let sum = 0;
          Object.values(row).forEach(v => {
            const num = parseInt(v, 10);
            if (!isNaN(num) && num > 0) sum += num;
          });
          return sum;
        } catch (e) {}
      }
    }
    // If user has any recorded months in this year, unrecorded months MUST return 0 (never pull dummy Excel numbers)
    if (recordedMonths.length > 0) {
      return 0;
    }
    // Clean demo fallback for first-time visitors before any data is recorded
    if (String(year) === '2569' && COCKROACH_MONTHLY_DATA_2569[month]) {
      const pt = COCKROACH_MONTHLY_DATA_2569[month].find(p => p.id === pointId);
      return pt ? pt.count : 0;
    }
    return 0;
  };

  // Monthly points data for selected month/year (exact format matching Image 1)
  const monthly23PointsData = useMemo(() => {
    return customPoints.map(pt => ({
      no: pt.no,
      name: pt.name, // "01 (โรงอาหารตัดแต่งห้องที่ 1)"
      shortName: `จุด ${pt.no}`,
      zone: pt.zone,
      count: getPointCountForMonth(pt.id, selectedMonth, selectedYear)
    }));
  }, [dailyRecords, selectedMonth, selectedYear, customPoints, recordedMonths]);

  // Config for Monthly Y-Axis with strictly equal step intervals (e.g. 0, 5, 10, 15, 20, 25...)
  const monthlyYAxisConfig = useMemo(() => {
    const maxVal = Math.max(...monthly23PointsData.map(d => d.count || 0), 0);
    let step = 5;
    if (maxVal > 100) {
      step = 20;
    } else if (maxVal > 50) {
      step = 10;
    } else {
      step = 5;
    }
    const upperLimit = Math.max(25, Math.ceil(maxVal / step) * step);
    const ticks = [];
    for (let i = 0; i <= upperLimit; i += step) {
      ticks.push(i);
    }
    return {
      domain: [0, upperLimit],
      ticks
    };
  }, [monthly23PointsData]);

  // Dynamic Y-axis config for quarterly charts with equal steps
  const getQuarterlyYAxisConfig = (chartData) => {
    const allVals = chartData.flatMap(d => [d.month1 || 0, d.month2 || 0, d.month3 || 0]);
    const maxVal = Math.max(...allVals, 0);
    let step = 5;
    let upper = 25;
    if (maxVal <= 4) {
      step = 2;
      upper = 4;
    } else if (maxVal <= 10) {
      step = 2;
      upper = 10;
    } else if (maxVal <= 25) {
      step = 5;
      upper = 25;
    } else {
      step = 5;
      upper = Math.ceil(maxVal / 5) * 5;
    }
    const ticks = [];
    for (let i = 0; i <= upper; i += step) {
      ticks.push(i);
    }
    return { domain: [0, upper], ticks };
  };

  // Top cockroach point for monthly report
  const topMonthlyPoint = useMemo(() => {
    const sorted = [...monthly23PointsData].sort((a, b) => b.count - a.count);
    return sorted[0] || { no: '14', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', count: 0 };
  }, [monthly23PointsData]);

  // Monthly report narrative text following the exact company pattern from "ตัวอย่าง รายงานแมลงสาบ ประจำเดือน.txt"
  // Strictly matches the 3 core patterns: โรงอาหาร, ใต้ตู้ล็อคเกอร์, ห้องน้ำ
  const monthlyFormAnalysisText = useMemo(() => {
    const isRec = isMonthRecorded(selectedMonth, selectedYear) || (recordedMonths.length === 0 && selectedYear === '2569');
    if (!isRec) {
      return `จากการตรวจนับแมลงสาบในเดือน ${selectedMonth} ${selectedYear} ยังไม่มีการบันทึกข้อมูลผลการตรวจนับ กรุณาไปที่แท็บบันทึกข้อมูลเพื่อเริ่มลงบันทึกผลประจำวัน`;
    }

    // กรณีที่ 0: ไม่พบแมลงสาบเลยทุกจุด
    if (topMonthlyPoint.count === 0) {
      return `จากการตรวจนับแมลงสาบในเดือน ${selectedMonth} ${selectedYear} พบว่า ทุกตำแหน่งที่วางไม่พบแมลงสาบ (พบ 0 ตัว) ดังนั้นควรเน้นเรื่องการทำความสะอาดในทุกพื้นที่ให้สะอาดอยู่เสมอหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงสาบเข้ามาในพื้นที่ และรักษาให้จำนวนที่พบเป็น 0 เสมอ`;
    }

    const { no, zone } = topMonthlyPoint;
    const cleanZone = zone || '';

    // แพทเทิร์นที่ 1: โรงอาหาร (เช่น จุด 01 - 12: โรงอาหารตัดแต่งห้องที่ 1, โรงอาหารตัดแต่งห้องที่ 2)
    if (cleanZone.includes('โรงอาหาร')) {
      return `จากการตรวจนับแมลงสาบในเดือน ${selectedMonth} ${selectedYear} พบว่า ตำแหน่งที่วาง ${no} (${cleanZone}) พบแมลงสาบมากที่สุด พื้นที่ดังกล่าว เป็นพื้นที่ ที่มีการนำอาหารเข้ามา และมีความชื้น ดังนั้นควรเน้นทำความสะอาดพื้นที่ดังกล่าวภายหลังจากการใช้งาน ตรวจสอบภาชนะบรรจุอาหารที่นำเข้ามา ควรจะปิดมิดชิดเพื่อป้องกันไม่ให้แมลงสาบเข้าสู่พื้นที่การผลิตได้`;
    }

    // แพทเทิร์นที่ 2: ใต้ตู้ล็อคเกอร์ / ใต้ตู้ล็อกเกอร์ (เช่น จุด 13 - 16: ใต้ตู้ล็อกเกอร์ ตัดแต่ง)
    if (cleanZone.includes('ล็อกเกอร์') || cleanZone.includes('ล็อคเกอร์')) {
      return `จากการตรวจนับแมลงสาบในเดือน ${selectedMonth} ${selectedYear} พบว่า ตำแหน่งที่วาง ${no} (${cleanZone}) พบแมลงสาบมากที่สุด โดยบริเวณดังกล่าวเป็นบริเวณใต้ตู้ล็อกเกอร์ ตัดแต่ง ซึ่งเป็นบริเวณที่เป็นจุดอับชื้นและมืด  จึงอาจส่งผลให้พบแมลงสาบได้ ดังนั้นควรเน้นเรื่องทำความสะอาดในพื้นที่ดังกล่าวให้สะอาดอยู่เสมอหลังจากการใช้งาน  ไม่นำอาหารเข้าไปเก็บที่ตู้ล็อคเกอร์ เพื่อป้องกันแมลงสาบเข้าพื้นที่การผลิตได้`;
    }

    // แพทเทิร์นที่ 3: ห้องน้ำ (เช่น จุด 17 - 23: ห้องน้ำหญิง ตัดแต่ง, ห้องน้ำชาย ตัดแต่ง, ห้องน้ำหัวหน้า ตัดแต่ง)
    if (cleanZone.includes('ห้องน้ำ')) {
      return `จากการตรวจนับแมลงสาบในเดือน ${selectedMonth} ${selectedYear} พบว่า ตำแหน่งที่วาง ${no} พบแมลงสาบมากที่สุด โดยตำแหน่งที่วาง ${no} เป็นบริเวณ${cleanZone} ซึ่งบริเวณดังกล่าวเป็นบริเวณที่มีความชื้นสูง และมีท่อระบาย อาจส่งผลให้พบแมลงสาบได้ ดังนั้นควรเน้นทำความสะอาดพื้นที่ดังกล่าวให้สะอาดอยู่เสมอภายหลัง จากการใช้งาน เพื่อป้องกันแมลงสาบเข้าพื้นที่การผลิตได้`;
    }

    // แพทเทิร์นกรณีตำแหน่งอื่นๆ
    return `จากการตรวจนับแมลงสาบในเดือน ${selectedMonth} ${selectedYear} พบว่า ตำแหน่งที่วาง ${no} (${cleanZone}) พบแมลงสาบมากที่สุด ซึ่งเป็นบริเวณที่มีความชื้นหรือมีปัจจัยดึงดูด อาจส่งผลให้พบแมลงสาบได้ ดังนั้นควรเน้นทำความสะอาดพื้นที่ดังกล่าวให้สะอาดอยู่เสมอภายหลังจากการใช้งาน เพื่อป้องกันแมลงสาบเข้าพื้นที่การผลิตได้`;
  }, [selectedMonth, selectedYear, topMonthlyPoint]);

  // Short month abbreviations for quarterly legend
  const currentQuarterMonthsShort = useMemo(() => {
    const q = QUARTERS_CONFIG[selectedQuarter] || QUARTERS_CONFIG['Q1'];
    const shortMap = {
      'มกราคม': 'ม.ค.', 'กุมภาพันธ์': 'ก.พ.', 'มีนาคม': 'มี.ค.',
      'เมษายน': 'เม.ย.', 'พฤษภาคม': 'พ.ค.', 'มิถุนายน': 'มิ.ย.',
      'กรกฎาคม': 'ก.ค.', 'สิงหาคม': 'ส.ค.', 'กันยายน': 'ก.ย.',
      'ตุลาคม': 'ต.ค.', 'พฤศจิกายน': 'พ.ย.', 'ธันวาคม': 'ธ.ค.'
    };
    return q.months.map(m => shortMap[m] || m);
  }, [selectedQuarter]);

  // Quarterly Custom Legend to strictly ensure chronological order: Month 1 (Blue) -> Month 2 (Red) -> Month 3 (Green)
  const renderQuarterlyLegend = () => {
    const qConfig = QUARTERS_CONFIG[selectedQuarter] || QUARTERS_CONFIG['Q1'];
    const months = qConfig.months;
    const isDemo = recordedMonths.length === 0 && selectedYear === '2569';
    const m1Rec = isDemo || isMonthRecorded(months[0], selectedYear);
    const m2Rec = isDemo || isMonthRecorded(months[1], selectedYear);
    const m3Rec = isDemo || isMonthRecorded(months[2], selectedYear);

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', fontSize: '9.5px', color: '#334155', marginTop: '2px', width: '100%' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '8.5px', height: '8.5px', backgroundColor: '#4F81BD', borderRadius: '1px' }}></span>
          <span style={{ fontWeight: 600 }}>{currentQuarterMonthsShort[0]}{!m1Rec ? ' (ยังไม่บันทึก)' : ''}</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '8.5px', height: '8.5px', backgroundColor: '#C0504D', borderRadius: '1px' }}></span>
          <span style={{ fontWeight: 600 }}>{currentQuarterMonthsShort[1]}{!m2Rec ? ' (ยังไม่บันทึก)' : ''}</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '8.5px', height: '8.5px', backgroundColor: '#9BBB59', borderRadius: '1px' }}></span>
          <span style={{ fontWeight: 600 }}>{currentQuarterMonthsShort[2]}{!m3Rec ? ' (ยังไม่บันทึก)' : ''}</span>
        </div>
      </div>
    );
  };

  // Quarterly clustered bar chart data for a zone
  const getZoneQuarterlyChartData = (zone) => {
    const qConfig = QUARTERS_CONFIG[selectedQuarter] || QUARTERS_CONFIG['Q1'];
    const months = qConfig.months;

    // Prefer custom points for this zone, falling back to zone.pointIds
    const zonePoints = customPoints.filter(p => p.zone === zone.name);
    const activePoints = zonePoints.length > 0 ? zonePoints : zone.pointIds.map(id => COCKROACH_POINTS.find(p => p.id === id)).filter(Boolean);

    const isDemo = recordedMonths.length === 0 && selectedYear === '2569';
    const m1Rec = isDemo || isMonthRecorded(months[0], selectedYear);
    const m2Rec = isDemo || isMonthRecorded(months[1], selectedYear);
    const m3Rec = isDemo || isMonthRecorded(months[2], selectedYear);

    return activePoints.map(pt => {
      const ptId = pt.id;
      const m1Count = m1Rec ? getPointCountForMonth(ptId, months[0], selectedYear) : 0;
      const m2Count = m2Rec ? getPointCountForMonth(ptId, months[1], selectedYear) : 0;
      const m3Count = m3Rec ? getPointCountForMonth(ptId, months[2], selectedYear) : 0;

      return {
        no: `No.${pt ? parseInt(pt.no, 10) : ptId}`,
        pointId: ptId,
        month1: m1Count,
        month2: m2Count,
        month3: m3Count,
        month1Recorded: m1Rec,
        month2Recorded: m2Rec,
        month3Recorded: m3Rec
      };
    });
  };

  // Determine effective zone status (supports 'auto', 'active', 'inactive', 'renovating')
  const getEffectiveZoneStatus = (zoneId, chartData = [], year = selectedYear, quarter = selectedQuarter) => {
    const key = `${year}_${quarter}_${zoneId}`;
    const configured = zoneStatuses[key];
    if (configured && configured !== 'auto') {
      return configured; // 'active', 'inactive', 'renovating'
    }

    // Auto-detection logic:
    const hasData = chartData && chartData.some(d => (d.month1 || 0) > 0 || (d.month2 || 0) > 0 || (d.month3 || 0) > 0);
    if (hasData) {
      return 'active';
    }

    // Default for canteens when no data is recorded is 'inactive', for other zones 'active'
    if (zoneId === 'canteen1' || zoneId === 'canteen2') {
      return 'inactive';
    }

    return 'active';
  };

  // Dynamic grouped trend narrative generator following exact company QC style
  const generateTrendAnalysisText = (zoneId, zoneName, chartData = [], year = selectedYear, quarter = selectedQuarter) => {
    const qConfig = QUARTERS_CONFIG[quarter] || QUARTERS_CONFIG['Q1'];
    const months = qConfig.months;
    const cleanRange = (qConfig.rangeText || '').replace(/\s*-\s*/g, '-');

    const isDemo = recordedMonths.length === 0 && String(year) === '2569';
    const m1Recorded = isDemo || isMonthRecorded(months[0], year);
    const m2Recorded = isDemo || isMonthRecorded(months[1], year);
    const m3Recorded = isDemo || isMonthRecorded(months[2], year);

    const recordedCount = (m1Recorded ? 1 : 0) + (m2Recorded ? 1 : 0) + (m3Recorded ? 1 : 0);

    // If no months in this quarter have data yet
    if (recordedCount === 0) {
      return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName} เดือน${cleanRange} พ.ศ. ${year} ยังไม่มีการบันทึกข้อมูลการตรวจนับแมลงสาบในไตรมาสนี้`;
    }

    const totalQuarter = chartData.reduce((sum, d) => sum + (d.month1 || 0) + (d.month2 || 0) + (d.month3 || 0), 0);
    if (totalQuarter === 0) {
      let unrecordedNote = '';
      if (!m3Recorded && m1Recorded && m2Recorded) {
        unrecordedNote = ` (สำหรับเดือน${months[2]}ยังไม่มีการบันทึกผลการตรวจ)`;
      } else if (!m2Recorded && !m3Recorded && m1Recorded) {
        unrecordedNote = ` (สำหรับเดือน${months[1]}และ${months[2]}ยังไม่มีการบันทึกผลการตรวจ)`;
      }
      return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName} เดือน${cleanRange} พ.ศ. ${year} พบว่า ทุกตำแหน่งไม่พบแมลงสาบ (พบ 0 ตัว)${unrecordedNote} ทางทีมทำความสะอาดควรรักษามาตรฐานความสะอาดอย่างสม่ำเสมอ เพื่อควบคุมให้จำนวนแมลงสาบเป็น 0 เสมอ`;
    }

    let conclusion = 'ดังนั้นทางทีมทำความสะอาดต้องเฝ้าระวังอย่างเคร่งครัด และทำความสะอาดอย่างสม่ำเสมอ เพื่อให้แมลงสาบที่พบมีจำนวนลดลง';
    if (zoneId === 'toiletFemale') {
      conclusion = 'ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดในตำแหน่งห้องน้ำหญิงตัดแต่งอย่างสม่ำเสมอ พร้อมทั้งให้หน่วยงานที่เกี่ยวข้องเฝ้าระวังกิจกรรมที่จะก่อให้เกิดแมลงสาบ เพื่อให้แมลงสาบที่พบมีจำนวนลดลงจนเป็น 0';
    } else if (zoneId === 'toiletMale') {
      conclusion = 'ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำชายตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้เป็นประจำ';
    } else if (zoneId === 'toiletHead') {
      conclusion = 'ดังนั้นทีมทำความสะอาดจึงต้องทำความสะอาดตำแหน่งห้องน้ำหัวหน้าตัดแต่งอย่างสม่ำเสมอ และรักษาความสะอาดบริเวณนี้';
    }

    // CASE 1: All 3 months recorded
    if (m1Recorded && m2Recorded && m3Recorded) {
      const trendGroups = {};
      chartData.forEach(d => {
        const m1 = d.month1 || 0;
        const m2 = d.month2 || 0;
        const m3 = d.month3 || 0;
        const noLabel = d.no;

        let key = '';
        let desc = '';

        if (m1 === 0 && m2 === 0 && m3 === 0) {
          key = 'zero';
          desc = 'ไม่พบแมลงสาบ';
        } else if (m1 < m2 && m2 < m3) {
          key = 'increasing';
          desc = 'มีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง';
        } else if (m1 > m2 && m2 > m3) {
          key = 'decreasing';
          desc = 'มีแนวโน้มลดลงอย่างต่อเนื่อง';
        } else if (m1 < m2 && m2 > m3) {
          key = 'up_down';
          desc = `มีแนวโน้มเพิ่มขึ้นในเดือน${months[1]}และลดลงในเดือน${months[2]}`;
        } else if (m1 > m2 && m2 < m3) {
          key = 'down_up';
          desc = `มีแนวโน้มลดลงในเดือน${months[1]}และเพิ่มขึ้นในเดือน${months[2]}`;
        } else if (m1 === m2 && m2 === m3) {
          key = 'steady';
          desc = 'มีแนวโน้มคงที่ตลอดทั้งไตรมาส';
        } else if (m1 === m2 && m2 < m3) {
          key = 'steady_up';
          desc = `มีจำนวนคงที่และเพิ่มขึ้นในเดือน${months[2]}`;
        } else if (m1 === m2 && m2 > m3) {
          key = 'steady_down';
          desc = `มีจำนวนคงที่และลดลงในเดือน${months[2]}`;
        } else if (m1 < m2 && m2 === m3) {
          key = 'up_steady';
          desc = `มีแนวโน้มเพิ่มขึ้นในเดือน${months[1]}และคงที่ในเดือน${months[2]}`;
        } else if (m1 > m2 && m2 === m3) {
          key = 'down_steady';
          desc = `มีแนวโน้มลดลงในเดือน${months[1]}และคงที่ในเดือน${months[2]}`;
        } else {
          key = `custom_${m1}_${m2}_${m3}`;
          desc = `ตรวจพบ ${m1}, ${m2}, ${m3} ตัวตามลำดับ`;
        }

        if (!trendGroups[key]) {
          trendGroups[key] = { desc, points: [] };
        }
        trendGroups[key].points.push(noLabel);
      });

      const pointSummaries = Object.values(trendGroups).map(g => {
        if (g.points.length === 1) {
          return `ในตำแหน่ง ${g.points[0]} ${g.desc}`;
        }
        return `ตำแหน่ง ${g.points.join(', ')} ${g.desc}`;
      });

      return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName} เดือน${cleanRange} พ.ศ. ${year} พบว่า ${pointSummaries.join(' ')} ${conclusion}`;
    }

    // CASE 2: Month 1 & Month 2 recorded, Month 3 NOT recorded yet
    if (m1Recorded && m2Recorded && !m3Recorded) {
      const trendGroups = {};
      chartData.forEach(d => {
        const m1 = d.month1 || 0;
        const m2 = d.month2 || 0;
        const noLabel = d.no;

        let key = '';
        let desc = '';

        if (m1 === 0 && m2 === 0) {
          key = 'zero';
          desc = 'ไม่พบแมลงสาบ';
        } else if (m1 < m2) {
          key = 'increasing';
          desc = `มีแนวโน้มเพิ่มขึ้นในเดือน${months[1]}`;
        } else if (m1 > m2) {
          key = 'decreasing';
          desc = `มีแนวโน้มลดลงในเดือน${months[1]}`;
        } else {
          key = 'steady';
          desc = `มีจำนวนคงที่ในเดือน${months[0]}-${months[1]}`;
        }

        if (!trendGroups[key]) {
          trendGroups[key] = { desc, points: [] };
        }
        trendGroups[key].points.push(noLabel);
      });

      const pointSummaries = Object.values(trendGroups).map(g => {
        if (g.points.length === 1) {
          return `ในตำแหน่ง ${g.points[0]} ${g.desc}`;
        }
        return `ตำแหน่ง ${g.points.join(', ')} ${g.desc}`;
      });

      return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName} เดือน${cleanRange} พ.ศ. ${year} พบว่า ${pointSummaries.join(' ')} (สำหรับเดือน${months[2]}ยังไม่มีการบันทึกผลการตรวจ) ${conclusion}`;
    }

    // CASE 3: Only Month 1 recorded
    if (m1Recorded && !m2Recorded && !m3Recorded) {
      const topPt = [...chartData].sort((a, b) => (b.month1 || 0) - (a.month1 || 0))[0];
      const m1Total = chartData.reduce((sum, d) => sum + (d.month1 || 0), 0);
      return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName} เดือน${cleanRange} พ.ศ. ${year} พบว่า บันทึกผลในเดือน${months[0]} ตรวจพบรวม ${m1Total} ตัว (พบมากที่สุดที่ ${topPt?.no || 'จุดตรวจ'} จำนวน ${topPt?.month1 || 0} ตัว) สำหรับเดือน${months[1]}และ${months[2]}ยังไม่มีการบันทึกผลการตรวจ ${conclusion}`;
    }

    // Fallback for other combinations
    return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName} เดือน${cleanRange} พ.ศ. ${year} พบว่า ข้อมูลอยู่ระหว่างการบันทึกผลตรวจนับ (ยอดตรวจพบรวม ${totalQuarter} ตัว) ${conclusion}`;
  };

  // Quarterly narrative text for a zone
  const getQuarterlyZoneNarrative = (zoneId, zoneName, chartData = [], year = selectedYear, quarter = selectedQuarter) => {
    const key = `${year}_${quarter}_${zoneId}`;
    if (customNarratives[key]) {
      return customNarratives[key];
    }

    const qConfig = QUARTERS_CONFIG[quarter] || QUARTERS_CONFIG['Q1'];
    const cleanRange = (qConfig.rangeText || '').replace(/\s*-\s*/g, '-');
    const status = getEffectiveZoneStatus(zoneId, chartData, year, quarter);

    // ปิดใช้งาน / ไม่มีการใช้งานพื้นที่
    if (status === 'inactive') {
      return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName}\nเดือน${cleanRange} พ.ศ. ${year}\nไม่มีการใช้งานพื้นที่จึงไม่มีการวางบ้านแมลงสาบในพื้นที่`;
    }

    // ปรับปรุงพื้นที่
    if (status === 'renovating') {
      return `จากกราฟแสดงแนวโน้มจำนวนแมลงสาบ ตำแหน่ง${zoneName} เดือน${cleanRange} พ.ศ. ${year} พื้นที่อยู่ระหว่างปรับปรุงและปิดใช้งานจึงไม่มีการวางบ้านแมลงสาบในพื้นที่ ดังนั้นทีมทำความสะอาดต้องทำความสะอาดตำแหน่ง${zoneName}อย่างสม่ำเสมอ จนกว่าจะมีการเปิดใช้งานอีกครั้ง เพื่อควบคุมแนวโน้มแมลงที่มีจำนวนลดลง`;
    }

    // เปิดใช้งาน (Active)
    // Fallback to exact memo text for demo year 2569 ONLY if no records exist at all
    const isDemo = recordedMonths.length === 0 && String(year) === '2569';
    if (isDemo && QUARTERLY_EXACT_NARRATIVES[quarter]?.[zoneId] && zoneId !== 'canteen1' && zoneId !== 'canteen2') {
      return QUARTERLY_EXACT_NARRATIVES[quarter][zoneId].replace('{year}', year);
    }

    return generateTrendAnalysisText(zoneId, zoneName, chartData, year, quarter);
  };

  // Render Monthly Print Page (matches Image 1)
  const renderMonthlyPrintPage = () => {
    try {
      return (
      <div 
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '8mm 14mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        {/* Top Header */}
        <div style={{ marginBottom: '2px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
              บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
            </span>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
              กราฟแสดงรายงานการตรวจนับจำนวนแมลงสาบ ประจำเดือน {selectedMonth} {selectedYear}
            </h1>
          </div>
        </div>

        {/* 23 Points Chart */}
        <div style={{ display: 'flex', justifyContent: 'center', height: '495px', marginBottom: '-4px' }}>
          <BarChart 
            width={1020} 
            height={495} 
            data={monthly23PointsData} 
            margin={{ top: 20, right: 20, left: 40, bottom: 100 }}
            style={{ overflow: 'visible' }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={<AngledCategoryTick />} 
              interval={0} 
              stroke="#64748b" 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              domain={monthlyYAxisConfig.domain} 
              ticks={monthlyYAxisConfig.ticks} 
              allowDecimals={false} 
              label={{ value: 'จำนวน (ตัว)', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 10, fill: '#64748b' } }} 
            />
            <Bar dataKey="count" fill="#9E2A2B" barSize={26} isAnimationActive={false}>
              <LabelList dataKey="count" content={<BoxedBarLabel />} />
            </Bar>
          </BarChart>
        </div>

        {/* Bottom Narrative Box & Signatures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '2px' }}>
          <div style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#f8fafc', color: '#334155' }}>
            <p style={{ lineHeight: '1.45', margin: 0, fontSize: '11px' }}>
              {monthlyFormAnalysisText}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '16px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                จัดทำโดย
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                  วันที่......./......./.......
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                รับทราบโดย
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                  วันที่......./......./.......
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    } catch (err) {
      console.error('Error rendering monthly print page:', err);
      return null;
    }
  };

  // Render Quarterly Print Page (matches Images 2, 3, 4)
  const renderQuarterlyPrintPage = (pageConfig) => {
    try {
      const qConfig = QUARTERS_CONFIG[selectedQuarter] || QUARTERS_CONFIG['Q1'];

      return (
        <div 
          key={`q-print-page-${pageConfig.page}`}
        className="print-page font-niramit"
        style={{
          pageBreakAfter: pageConfig.page < 3 ? 'always' : 'avoid',
          breakAfter: pageConfig.page < 3 ? 'page' : 'avoid',
          width: '297mm',
          height: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '6mm 10mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '3px', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
            บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
          </span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
            {pageConfig.pageLabel}
          </span>
        </div>

        {/* 4 Main Frames (2 Rows x 2 Columns) - Fixed Equal Template */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px', minHeight: 0 }}>
          {pageConfig.zones.map(zone => {
            const chartData = getZoneQuarterlyChartData(zone);
            const status = getEffectiveZoneStatus(zone.id, chartData, selectedYear, selectedQuarter);
            const narrative = getQuarterlyZoneNarrative(zone.id, zone.narrativeName, chartData, selectedYear, selectedQuarter);
            const yAxisConfig = getQuarterlyYAxisConfig(chartData);
            const isCentered = (status === 'inactive');

            return (
              <div 
                key={zone.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  alignItems: 'stretch', 
                  justifyContent: 'space-between',
                  gap: '10px',
                  height: '326px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Left Frame: Chart Box (~56% width) */}
                <div 
                  style={{ 
                    width: '56%', 
                    height: '100%', 
                    border: '1px solid #cbd5e1', 
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    padding: '8px 12px 6px 12px'
                  }}
                >
                  <div style={{ textAlign: 'center', marginBottom: '2px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                      {zone.chartTitle}
                    </div>
                    <div style={{ fontSize: '9.5px', color: '#475569', marginTop: '1px' }}>
                      (ตรวจนับจากบ้านแมลงสาบตำแหน่ง{zone.chartSubtitleName}) {qConfig.rangeText} {selectedYear}
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <BarChart 
                      width={560} 
                      height={240} 
                      data={chartData} 
                      margin={{ top: 16, right: 15, left: -22, bottom: 15 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="no" stroke="#64748b" fontSize={9.5} tickLine={false} />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={9.5} 
                        tickLine={false} 
                        allowDecimals={false} 
                        domain={yAxisConfig.domain} 
                        ticks={yAxisConfig.ticks} 
                      />
                      <Legend 
                        content={renderQuarterlyLegend}
                        wrapperStyle={{ bottom: -6, left: 0, width: '100%', fontSize: '9.5px', textAlign: 'center' }} 
                      />
                      <Bar dataKey="month1" name={currentQuarterMonthsShort[0]} fill="#4F81BD" barSize={12} isAnimationActive={false}>
                        <LabelList dataKey="month1" content={QuarterlyBarLabel} />
                      </Bar>
                      <Bar dataKey="month2" name={currentQuarterMonthsShort[1]} fill="#C0504D" barSize={12} isAnimationActive={false}>
                        <LabelList dataKey="month2" content={QuarterlyBarLabel} />
                      </Bar>
                      <Bar dataKey="month3" name={currentQuarterMonthsShort[2]} fill="#9BBB59" barSize={12} isAnimationActive={false}>
                        <LabelList dataKey="month3" content={QuarterlyBarLabel} />
                      </Bar>
                    </BarChart>
                  </div>
                </div>

                {/* Right Frame: Narrative Box (~44% width) */}
                <div 
                  style={{ 
                    width: '43.5%', 
                    height: '100%', 
                    border: '1px solid #cbd5e1', 
                    boxSizing: 'border-box',
                    backgroundColor: '#ffffff',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: isCentered ? 'center' : 'flex-start',
                    alignItems: isCentered ? 'center' : 'flex-start',
                    padding: isCentered ? '20px 20px' : '20px 24px'
                  }}
                >
                  <div style={{ 
                    width: '100%', 
                    textAlign: isCentered ? 'center' : 'left',
                    fontSize: isCentered ? '10.5pt' : '9.5pt', 
                    lineHeight: isCentered ? '1.85' : '1.55', 
                    color: '#1e293b' 
                  }}>
                    <p style={{ margin: 0, whiteSpace: isCentered ? 'pre-line' : 'normal' }}>{narrative}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Signatures: Balanced 2-Column */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '40px', 
          borderTop: '1px solid #cbd5e1', 
          paddingTop: '6px', 
          marginTop: '6px',
          width: '100%' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', maxWidth: '340px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '8px', color: '#1e293b' }}>
                ผู้จัดทำ
              </span>
              <div style={{ flex: 1, borderBottom: '1px solid #000', height: '14px' }}></div>
            </div>
            <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center', marginTop: '3px', fontSize: '10.5px', color: '#64748b' }}>
              วันที่......./......./.......
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%', maxWidth: '340px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '8px', color: '#1e293b' }}>
                ผู้ตรวจสอบ
              </span>
              <div style={{ flex: 1, borderBottom: '1px solid #000', height: '14px' }}></div>
            </div>
            <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center', marginTop: '3px', fontSize: '10.5px', color: '#64748b' }}>
              วันที่......./......./.......
            </div>
          </div>
        </div>
      </div>
    );
    } catch (err) {
      console.error('Error rendering quarterly print page:', err);
      return null;
    }
  };

  const renderCockroachPrintPage = (zone) => {
    try {
      const chartData = getZoneDetailedChartData(zone);
      const reportText = getCockroachZoneReportText(zone);

      return (
        <div 
          key={zone}
          className="print-page font-niramit"
          style={{
            pageBreakAfter: 'always',
            breakAfter: 'page',
            width: '297mm',
            height: '210mm',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '8mm 14mm',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            color: 'black'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontSize: '10px', color: '#64748b' }}>
            <span style={{ fontWeight: 'bold' }}>บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด</span>
            <span>เอกสารควบคุมภายใน</span>
          </div>

          <div style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
            <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>รายงานสถิติตรวจนับจำนวนแมลงสาบประจำเดือน</h1>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginTop: '2px', marginBottom: 0 }}>
              {zone === 'ภาพรวม 6 โซน' ? 'สรุปภาพรวม 6 โซนตรวจวัด (23 จุดดัก)' : `โซน ${zone}`} · ประจำเดือน {selectedMonth} {selectedYear}
            </h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '380px', marginBottom: '8px' }}>
            <BarChart width={1009} height={380} data={chartData} margin={{ top: 25, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={(val) => [`${val} ตัว`, 'จำนวนแมลงสาบ']} />
              <Legend wrapperStyle={{ bottom: 0, left: 0, width: '100%', fontSize: '11px', textAlign: 'center' }} />
              <Bar dataKey="count" name="จำนวนแมลงสาบที่ตรวจพบ (ตัว)" fill="#ea580c" isAnimationActive={false}>
                <LabelList dataKey="count" position="top" style={{ fill: '#ea580c', fontSize: 10, fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#334155' }}>
              <p style={{ lineHeight: '1.45', margin: 0, fontSize: '12px' }}>{reportText}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '16px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                  จัดทำโดย
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                  <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                  <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                    วันที่......./......./.......
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                  รับทราบโดย
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                  <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                  <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                    วันที่......./......./.......
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } catch (err) {
      console.error('Error rendering cockroach zone print page:', err);
      return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F7FC] text-slate-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="screen-content max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Switcher between all 5 pest forms */}
        <FormNav activeFormId="cockroaches" />

        {/* Header Hero */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-100">
                <span>🪳 FM-QC-08/05 Rev.02</span>
                <span>•</span>
                <span>มาตรฐานตรวจสอบความปลอดภัยโรงงานอาหาร</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                รายงานการตรวจสอบบ้านแมลงสาบ
              </h1>
              <p className="text-xs sm:text-sm text-amber-100 max-w-2xl font-medium">
                บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด — ตรวจสอบบ้านดักแมลงสาบ 23 จุด รายวัน พร้อมความถี่ในการเปลี่ยนบ้านแมลงสาบ 1 ครั้ง/สัปดาห์
              </p>
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start md:self-center">
              <button
                onClick={() => setActiveTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'chart'
                    ? 'bg-white text-amber-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>กราฟแนวโน้ม</span>
              </button>
              <button
                onClick={() => setActiveTab('entry')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'entry'
                    ? 'bg-white text-amber-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>บันทึกผลตรวจ 23 จุด</span>
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-white text-amber-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์แบบฟอร์ม</span>
              </button>
            </div>
          </div>
        </div>

        {/* Month & Year Calendar Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <MonthYearPicker
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              selectedYear={selectedYear}
              onChangeYear={setSelectedYear}
              recordedMonths={recordedMonths}
              accentColor="amber"
              activeTab={activeTab}
              onSwitchToEntry={(m, y) => {
                setSelectedMonth(m);
                setSelectedYear(y);
                setActiveTab('entry');
              }}
              label={activeTab === 'entry' ? 'เลือกเดือนที่บันทึก' : 'เลือกช่วงเวลา'}
            />

            {activeTab === 'print' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-blue-500">ไตรมาส:</span>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 rounded-xl focus:outline-none focus:border-blue-500 text-blue-900 dark:text-blue-300 cursor-pointer"
                >
                  {Object.values(QUARTERS_CONFIG).map(q => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'entry' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-900">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>เปิดบันทึกได้ถึงเดือนล่าสุด: {currentCalendar.monthName} {currentCalendar.beYear}</span>
              </span>
            ) : activeTab === 'print' ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-extrabold border border-amber-200 dark:border-amber-900">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  รายเดือน: {selectedMonth}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-extrabold border border-blue-200 dark:border-blue-900">
                  <Layers className="w-3.5 h-3.5" />
                  ไตรมาส: {QUARTERS_CONFIG[selectedQuarter]?.shortName}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-extrabold border border-amber-200 dark:border-amber-900">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ยอดพบเดือน {selectedMonth}: {monthlyGrandTotal} ตัว
              </span>
            )}
          </div>
        </div>

        {/* ─── TAB 1: CHARTS & TRENDS ─── */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            
            {/* Sub-tab selection for Chart view */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setGraphSubTab('monthly')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    graphSubTab === 'monthly'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>📊 รายงานสถิติประจำเดือน (23 จุด - รูปแบบภาพที่ 1)</span>
                </button>
                <button
                  onClick={() => setGraphSubTab('quarterly')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    graphSubTab === 'quarterly'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>📈 กราฟแนวโน้มรายไตรมาส (3 หน้า / 6 โซน - รูปแบบภาพที่ 2-4)</span>
                </button>
                <button
                  onClick={() => setGraphSubTab('yearly')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    graphSubTab === 'yearly'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>📉 ภาพรวมสถิติทั้งปี & KPI</span>
                </button>
              </div>

              {/* Quick Print Button */}
              <div className="flex items-center gap-2">
                {graphSubTab === 'monthly' && (
                  <button
                    onClick={() => handlePrint('monthly')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์รายงานรายเดือน (A4 แนวนอน)</span>
                  </button>
                )}
                {graphSubTab === 'quarterly' && (
                  <button
                    onClick={() => handlePrint('quarterly')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์รายงานไตรมาส (3 หน้า A4 แนวนอน)</span>
                  </button>
                )}
              </div>
            </div>

            {/* ─── SUB-TAB 1: MONTHLY 23-POINTS REPORT CARD (MATCHES IMAGE 1) ─── */}
            {graphSubTab === 'monthly' && (
              <div className="bg-white text-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                {/* Card Header matching Image 1 */}
                <div>
                  <div className="flex justify-between items-center text-xs text-slate-500 pb-1">
                    <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
                    </span>
                  </div>
                  <div className="text-center mt-2 mb-4">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      กราฟแสดงรายงานการตรวจนับจำนวนแมลงสาบ ประจำเดือน {selectedMonth} {selectedYear}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ตรวจนับจากบ้านแมลงสาบ 23 จุดดัก (6 โซนตรวจวัด) • ยอดตรวจพบรวม {monthlyGrandTotal} ตัว
                    </p>
                  </div>
                </div>

                {/* Monthly 23 Points Bar Chart with Boxed Labels & -52° Ticks */}
                <div className="h-[460px] sm:h-[500px] w-full -mb-3 sm:-mb-4">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={monthly23PointsData} 
                        margin={{ top: 20, right: 20, left: 40, bottom: 100 }}
                        style={{ overflow: 'visible' }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="name" 
                          tick={<AngledCategoryTick />} 
                          interval={0} 
                          stroke="#64748b" 
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false} 
                          domain={monthlyYAxisConfig.domain} 
                          ticks={monthlyYAxisConfig.ticks} 
                          allowDecimals={false} 
                          label={{ value: 'จำนวน (ตัว)', angle: -90, position: 'insideLeft', offset: -5, style: { fontSize: 10, fill: '#64748b' } }} 
                        />
                        <Tooltip 
                          formatter={(val, _, props) => [`${val} ตัว`, props.payload.name]}
                          contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                        />
                        <Bar dataKey="count" name="จำนวนแมลงสาบ (ตัว)" fill="#9E2A2B" barSize={26}>
                          <LabelList dataKey="count" content={<BoxedBarLabel />} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Analytical Narrative Box matching Image 1 */}
                <div className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-400 mb-1.5">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>สรุปผลการวิเคราะห์และข้อเสนอแนะฝ่ายประกันคุณภาพ (QC/QA Report):</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {monthlyFormAnalysisText}
                  </p>
                </div>

                {/* 2-Column Signature Table matching Image 1 */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">จัดทำโดย</p>
                    <p className="text-slate-800 dark:text-slate-200 pt-2 pb-1">
                      ลงชื่อ ....................................................
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      วันที่......./......./.......
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">รับทราบโดย</p>
                    <p className="text-slate-800 dark:text-slate-200 pt-2 pb-1">
                      ลงชื่อ ....................................................
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      วันที่......./......./.......
                    </p>
                  </div>
                </div>

                {/* Bottom Print and Navigate Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400">
                    💡 สามารถกดปุ่มพิมพ์เพื่อสั่งพิมพ์รายงานขนาด A4 แนวนอน (Landscape) ได้ทันที
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('entry')}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>บันทึกผลตรวจรายวัน</span>
                    </button>
                    <button
                      onClick={() => handlePrint('monthly')}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์รายงานรายเดือนนี้ (A4 แนวนอน)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─── SUB-TAB 2: QUARTERLY 3-PAGES REPORT (MATCHES IMAGES 2, 3, 4) ─── */}
            {graphSubTab === 'quarterly' && (
              <div className="space-y-6">
                {/* Quarter & Page Switcher Controls */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">เลือกไตรมาส:</span>
                    {Object.values(QUARTERS_CONFIG).map(q => (
                      <button
                        key={q.id}
                        onClick={() => setSelectedQuarter(q.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedQuarter === q.id
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {q.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">เลือกหน้า:</span>
                    <button
                      onClick={() => setQuarterlyPage('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quarterlyPage === 'all'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      📑 ทั้งหมด (3 หน้า)
                    </button>
                    {COCKROACH_QUARTERLY_PAGES.map(p => (
                      <button
                        key={p.page}
                        onClick={() => setQuarterlyPage(String(p.page))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          quarterlyPage === String(p.page)
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {p.pageLabel}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch Status Configuration Bar */}
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">⚙️ กำหนดสถานะเปิด-ปิดพื้นที่ ({selectedQuarter} ปี {selectedYear}):</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">(เลือกล็อคสถานะด่วนทั้งไตรมาส หรือปรับแยกเฉพาะจุดที่การ์ดด้านล่างได้)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleBatchSetZoneStatuses('active')}
                      className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="เปิดใช้งานทุกจุดในไตรมาสนี้ เพื่อวิเคราะห์แนวโน้มจากข้อมูลจริง"
                    >
                      🟢 เปิดทุกพื้นที่ (Active)
                    </button>
                    <button
                      onClick={() => handleBatchSetZoneStatuses('auto')}
                      className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="ตรวจจับอัตโนมัติตามข้อมูลที่บันทึกไว้"
                    >
                      ⚙️ อัตโนมัติ (ตามข้อมูลจริง)
                    </button>
                    <button
                      onClick={() => {
                        handleSetZoneStatus('canteen1', 'inactive');
                        handleSetZoneStatus('canteen2', 'inactive');
                        handleSetZoneStatus('locker', 'active');
                        handleSetZoneStatus('toiletFemale', 'active');
                        handleSetZoneStatus('toiletMale', 'active');
                        handleSetZoneStatus('toiletHead', 'active');
                      }}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title="ปิดการใช้งานเฉพาะโรงอาหารห้อง 1 และ 2 ตามแบบฟอร์มเดิม"
                    >
                      🔴 ปิดเฉพาะโรงอาหาร
                    </button>
                  </div>
                </div>

                {/* Quarterly Page Cards (Page 1/3, 2/3, 3/3 matching Images 2, 3, 4) */}
                {COCKROACH_QUARTERLY_PAGES
                  .filter(p => quarterlyPage === 'all' || quarterlyPage === String(p.page))
                  .map(pageConfig => {
                    const qConfig = QUARTERS_CONFIG[selectedQuarter] || QUARTERS_CONFIG['Q1'];
                    return (
                      <div 
                        key={`screen-q-page-${pageConfig.page}`}
                        className="bg-white text-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
                      >
                        {/* Top Page Header */}
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-500">
                            บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด — {pageConfig.title} ({qConfig.shortName})
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                            {pageConfig.pageLabel}
                          </span>
                        </div>

                        {/* 2 Zones (Top & Bottom) */}
                        <div className="space-y-6">
                          {pageConfig.zones.map(zone => {
                            const chartData = getZoneQuarterlyChartData(zone);
                            const status = getEffectiveZoneStatus(zone.id, chartData, selectedYear, selectedQuarter);
                            const narrative = getQuarterlyZoneNarrative(zone.id, zone.narrativeName, chartData, selectedYear, selectedQuarter);
                            const yAxisConfig = getQuarterlyYAxisConfig(chartData);
                            const isCentered = (status === 'inactive');
                            const editKey = `${selectedYear}_${selectedQuarter}_${zone.id}`;
                            const isEditing = editingNarrativeKey === editKey;
                            const isCustom = Boolean(customNarratives[editKey]);
                            const configuredStatus = zoneStatuses[editKey] || 'auto';

                            return (
                              <div key={zone.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                                {/* Left: Clustered Bar Chart Frame (~58% - 7 cols) */}
                                <div className="lg:col-span-7 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                                  <div className="text-center mb-2">
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {zone.chartTitle}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                      (ตรวจนับจากบ้านแมลงสาบตำแหน่ง{zone.chartSubtitleName}) {qConfig.rangeText} {selectedYear}
                                    </p>
                                  </div>
                                  <div className="h-56 sm:h-64 w-full">
                                    {mounted && (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 20 }}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                          <XAxis dataKey="no" stroke="#64748b" fontSize={10} tickLine={false} />
                                          <YAxis 
                                            stroke="#64748b" 
                                            fontSize={10} 
                                            tickLine={false} 
                                            allowDecimals={false} 
                                            domain={yAxisConfig.domain} 
                                            ticks={yAxisConfig.ticks} 
                                          />
                                          <Tooltip formatter={(val, name) => [`${val} ตัว`, name]} />
                                          <Legend 
                                            content={renderQuarterlyLegend}
                                            wrapperStyle={{ bottom: -8, left: 0, width: '100%', fontSize: '10px', textAlign: 'center' }} 
                                          />
                                          <Bar dataKey="month1" name={currentQuarterMonthsShort[0]} fill="#4F81BD" barSize={12}>
                                            <LabelList dataKey="month1" content={QuarterlyBarLabel} />
                                          </Bar>
                                          <Bar dataKey="month2" name={currentQuarterMonthsShort[1]} fill="#C0504D" barSize={12}>
                                            <LabelList dataKey="month2" content={QuarterlyBarLabel} />
                                          </Bar>
                                          <Bar dataKey="month3" name={currentQuarterMonthsShort[2]} fill="#9BBB59" barSize={12}>
                                            <LabelList dataKey="month3" content={QuarterlyBarLabel} />
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Narrative Frame (~42% - 5 cols) */}
                                <div className="lg:col-span-5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
                                  {/* Header Controls for Status & Edit */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 w-full">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">สถานะพื้นที่:</span>
                                      <select
                                        value={configuredStatus}
                                        onChange={(e) => handleSetZoneStatus(zone.id, e.target.value)}
                                        className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                                          status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700'
                                            : status === 'inactive'
                                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700'
                                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                                        }`}
                                      >
                                        <option value="auto">⚙️ อัตโนมัติ ({status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'})</option>
                                        <option value="active">🟢 เปิดใช้งาน (Active)</option>
                                        <option value="inactive">🔴 ปิดใช้งาน (ไม่มีการวางบ้าน)</option>
                                        <option value="renovating">🟡 ปรับปรุงพื้นที่ (ปิดชั่วคราว)</option>
                                      </select>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {isCustom && (
                                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                          กำหนดเอง
                                        </span>
                                      )}
                                      {!isEditing && (
                                        <>
                                          <button
                                            onClick={() => handleStartEditNarrative(zone.id, narrative)}
                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2 py-1 rounded-md transition-all cursor-pointer"
                                            title="แก้ไขข้อความรายงานนี้"
                                          >
                                            ✏️ แก้ไข
                                          </button>
                                          {isCustom && (
                                            <button
                                              onClick={() => handleResetCustomNarrative(zone.id)}
                                              className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md transition-all cursor-pointer"
                                              title="คืนค่าข้อความอัตโนมัติ"
                                            >
                                              🔄 รีเซ็ต
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Narrative Text or Edit Box */}
                                  <div className={`flex-1 flex flex-col ${isCentered ? 'justify-center items-center' : 'justify-start items-start'} w-full`}>
                                    {isEditing ? (
                                      <div className="w-full space-y-2 mt-1">
                                        <textarea
                                          value={editingNarrativeText}
                                          onChange={(e) => setEditingNarrativeText(e.target.value)}
                                          rows={5}
                                          className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-blue-400 dark:border-blue-600 bg-blue-50/20 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
                                          placeholder="พิมพ์ข้อความรายงานที่ต้องการ..."
                                        />
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={handleCancelEditNarrative}
                                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                                          >
                                            ยกเลิก
                                          </button>
                                          <button
                                            onClick={() => handleSaveEditNarrative(zone.id)}
                                            className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                                          >
                                            บันทึกข้อความ
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className={`leading-relaxed text-xs sm:text-sm text-slate-800 dark:text-slate-200 w-full ${isCentered ? 'text-center' : 'text-left'}`}>
                                        <p className="m-0" style={{ whiteSpace: isCentered ? 'pre-line' : 'normal', lineHeight: isCentered ? 1.85 : 1.6 }}>{narrative}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer Signatures matching 7 cols (58%) and 5 cols (42%) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                          <div className="lg:col-span-7 text-center">
                            <p className="font-bold">ผู้จัดทำ .................................</p>
                            <p className="mt-1 text-slate-500 dark:text-slate-400">วันที่........../............/...........</p>
                          </div>
                          <div className="lg:col-span-5 text-center">
                            <p className="font-bold">ผู้ตรวจสอบ ............................</p>
                            <p className="mt-1 text-slate-500 dark:text-slate-400">วันที่........../............/...........</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* ─── SUB-TAB 3: YEARLY OVERVIEW & KPI ─── */}
            {graphSubTab === 'yearly' && (
              <div className="space-y-6">
                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400">ยอดพบสะสมทั้งปี {selectedYear}</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {yearlySum} <span className="text-xs font-normal text-slate-400">ตัว</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">รวมทั้ง 23 จุดดัก</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400">โซนที่พบมากที่สุด</p>
                    <h3 className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                      ล็อกเกอร์ & ห้องน้ำ
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">จุดที่ 13-22 บริเวณตัดแต่ง</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400">โรงอาหารห้อง 1 & 2</p>
                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      0 <span className="text-xs font-normal text-slate-400">ตัว</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1">จุด 01 ถึง 12 ควบคุมได้ดีเยี่ยม</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400">ความถี่เปลี่ยนบ้านแมลงสาบ</p>
                    <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs sm:text-sm">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>1 ครั้ง/สัปดาห์ (ครบถ้วน)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">เปลี่ยนทันทีเมื่อพบตัว</p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: By 23 Points */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          จำนวนแมลงสาบที่พบแยก 23 จุด
                        </h3>
                        <p className="text-xs text-slate-400">ประจำเดือน {selectedMonth} {selectedYear}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700">
                        รวม {monthlyGrandTotal} ตัว
                      </span>
                    </div>
                    <div className="h-64 sm:h-72 w-full">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pointsChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="no" tick={{ fontSize: 9 }} />
                            <YAxis allowDecimals={false} domain={[0, 'dataMax + 2']} tick={{ fontSize: 10 }} />
                            <Tooltip 
                              formatter={(val, _, props) => [`${val} ตัว (${props.payload.fullName})`, 'จำนวนแมลงสาบ']}
                              contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                            />
                            <Bar dataKey="count" name="จำนวนที่พบ" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                              {pointsChartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.count >= 7 ? '#dc2626' : entry.count > 0 ? '#f59e0b' : '#cbd5e1'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Chart 2: By Zone */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          สัดส่วนแมลงสาบแยกตามโซนพื้นที่
                        </h3>
                        <p className="text-xs text-slate-400">ประจำเดือน {selectedMonth} {selectedYear}</p>
                      </div>
                    </div>
                    <div className="h-64 sm:h-72 w-full">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={zoneSummary} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                            <Tooltip 
                              formatter={(val) => [`${val} ตัว`, 'ยอดตรวจพบ']}
                              contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                            />
                            <Bar dataKey="count" name="จำนวนที่พบ" fill="#ea580c" radius={[0, 8, 8, 0]}>
                              {zoneSummary.map((entry, index) => (
                                <Cell 
                                  key={`z-cell-${index}`} 
                                  fill={entry.count > 15 ? '#b91c1c' : entry.count > 0 ? '#f97316' : '#94a3b8'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Chart 3: 12-Month Trend Line */}
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          แนวโน้มสถิติแมลงสาบรายเดือนตลอดทั้งปี {selectedYear}
                        </h3>
                        <p className="text-xs text-slate-400">ยอดรวมบ้านแมลงสาบ 23 จุด (ม.ค. - ธ.ค. 2569 สะสม 1,068 ตัว)</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600">
                        เฉลี่ย ~89 ตัว/เดือน
                      </span>
                    </div>
                    <div className="h-72 sm:h-80 w-full">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={yearlyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="fullMonth" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} domain={[0, 160]} tick={{ fontSize: 11 }} />
                            <Tooltip 
                              formatter={(val) => [`${val} ตัว`, 'ยอดแมลงสาบสะสม']}
                              contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="total" 
                              name="ยอดแมลงสาบทั้ง 23 จุด" 
                              stroke="#ea580c" 
                              strokeWidth={3} 
                              dot={{ r: 4, fill: '#ea580c' }} 
                              activeDot={{ r: 7 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ─── TAB 2: DAILY ENTRY FORM (23 POINTS) ─── */}
        {activeTab === 'entry' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                    บันทึกข้อมูลรายวัน (Daily Entry Sheet {customPoints.length} จุด)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                    เปิดบันทึกถึง {currentCalendar.monthName} {currentCalendar.beYear}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    ตารางตรวจสอบบ้านแมลงสาบประจำเดือน
                  </h3>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-2.5 py-1 text-xs font-black bg-amber-50 dark:bg-slate-800 border-2 border-amber-500 rounded-xl text-amber-900 dark:text-amber-300 focus:outline-none cursor-pointer shadow-xs"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m}>
                        {m} {m === currentCalendar.monthName && selectedYear === String(currentCalendar.beYear) ? '(เดือนล่าสุด)' : ''}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-2.5 py-1 text-xs font-black bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {getAvailableYearsRange().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ระบุจำนวนแมลงสาบที่ตรวจพบในแต่ละวัน หรือพิมพ์ "วาง" ในวันที่เปลี่ยนบ้านแมลงสาบ (1 แผ่นบันทึกทั้งเดือน)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Sheet Selector */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setSelectedSheet('all')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${
                      selectedSheet === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm text-amber-600' : 'text-slate-500'
                    }`}
                  >
                    ทั้งหมด ({customPoints.length} จุด)
                  </button>
                  <button
                    onClick={() => setSelectedSheet('1')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${
                      selectedSheet === '1' ? 'bg-white dark:bg-slate-900 shadow-sm text-amber-600' : 'text-slate-500'
                    }`}
                  >
                    แผ่น 1 (จุด 01-12)
                  </button>
                  <button
                    onClick={() => setSelectedSheet('2')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all ${
                      selectedSheet === '2' ? 'bg-white dark:bg-slate-900 shadow-sm text-amber-600' : 'text-slate-500'
                    }`}
                  >
                    แผ่น 2 (จุด 13-{customPoints.length})
                  </button>
                </div>

                <Link
                  href="/admin?tab=points&category=cockroaches"
                  className="px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="ไปที่ระบบแอดมิน เพื่อเพิ่ม ลบ หรือแก้ไขจุดตรวจบ้านแมลงสาบ"
                >
                  <span>⚙️ จัดการจุดตรวจ ({customPoints.length} จุด)</span>
                </Link>

                <button
                  onClick={loadAugustSampleData}
                  className="px-3 py-1.5 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>โหลดตัวอย่าง ส.ค.</span>
                </button>

                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>บันทึกข้อมูลการตรวจสอบบ้านแมลงสาบเรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* ─── แผงควบคุมรอบวันวางบ้านแมลงสาบประจำเดือน (Placement Schedule & Fast Tools) ─── */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        รอบการวางบ้านแมลงสาบ ประจำเดือน{selectedMonth}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                        {placementDays.length} วันวาง: {placementDays.length > 0 ? placementDays.join(', ') : 'ยังไม่ได้ระบุ'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      กำหนดวันที่เปลี่ยนบ้านใหม่ (ระบบจะใส่คำว่า <b>"วาง"</b> ให้ครบ {customPoints.length} จุดทันที) วันที่เหลือจะเป็นการตรวจนับตัวเลข
                    </p>
                  </div>
                </div>

                {/* Fast Action Tools */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={autoFillSundays}
                    title="ใส่วันหยุด (-) ให้วันอาทิตย์ทุกสัปดาห์ในเดือนนี้"
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>⛔ วันอาทิตย์ (-)</span>
                  </button>

                  <button
                    type="button"
                    onClick={fillRemainingZeros}
                    title="ใส่เลข 0 ในช่องว่างที่ยังไม่ได้กรอก (เฉพาะวันที่ไม่ใช่วันวางและวันหยุด)"
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>0️⃣ ช่องว่างเป็น 0</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearTable}
                    title="ล้างข้อมูลในตารางของเดือนนี้ทั้งหมด"
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>ล้างตาราง</span>
                  </button>
                </div>
              </div>

              {/* Way 1: Text Input with Apply Button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  วิธีที่ 1 พิมพ์วันที่วาง (คั่นด้วยจุลภาค):
                </span>
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <input
                    type="text"
                    value={placementInput}
                    onChange={(e) => setPlacementInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPlacementInput()}
                    placeholder="เช่น 5, 11, 19, 26"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-xl font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPlacementInput}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    กำหนด "วาง" ทันที
                  </button>
                </div>
              </div>

              {/* Way 2: Interactive Day Pills (1 - 31) */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold">
                    วิธีที่ 2 หรือคลิกเลือกวันที่ (คลิกเพื่อเปิด/ปิด "วาง" ทั้ง {customPoints.length} จุด):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                      ⌨️ ใช้ปุ่มลูกศร (↑ ↓ ← →) และ Enter เลื่อนตารางได้เหมือน Excel
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">
                      💡 คลิกหัวคอลัมน์ 1-31 ได้เช่นกัน
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                    const isSelected = placementDays.includes(d);
                    const isExceed = d > daysInMonth;
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={isExceed}
                        onClick={() => togglePlacementDay(d)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                          isExceed
                            ? 'opacity-20 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                            : isSelected
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 dark:ring-blue-700 scale-105'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 border border-slate-200 dark:border-slate-700'
                        }`}
                        title={isExceed ? `เดือนนี้มี ${daysInMonth} วัน` : `วันที่ ${d}: คลิกเพื่อ ${isSelected ? 'ยกเลิกวันวาง' : 'ตั้งเป็นวันวาง'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Table Grid Dynamic Points x 31 Days */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[600px]">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold shadow-sm">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 w-10">No.</th>
                    <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 w-44 text-left">ตำแหน่งที่วาง</th>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                      const isPlacement = placementDays.includes(d);
                      const isExceed = d > daysInMonth;
                      return (
                        <th 
                          key={d} 
                          onClick={() => !isExceed && togglePlacementDay(d)}
                          title={isExceed ? `เดือนนี้มี ${daysInMonth} วัน` : `คลิกเพื่อเปิด/ปิด "วาง" วันที่ ${d} ทั้ง ${customPoints.length} จุด`}
                          className={`py-1.5 px-0.5 border-r border-slate-200 dark:border-slate-700 w-8 font-mono text-[10px] transition-colors select-none ${
                            isExceed
                              ? 'opacity-30 bg-slate-100 dark:bg-slate-800'
                              : isPlacement
                                ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-200'
                                : 'cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>{d}</div>
                          {isPlacement && (
                            <span className="block text-[8px] font-black text-blue-700 dark:text-blue-300 bg-blue-200/90 dark:bg-blue-900 rounded px-0.5 leading-tight mx-auto max-w-[24px]">
                              วาง
                            </span>
                          )}
                        </th>
                      );
                    })}
                    <th className="py-2 px-2 border-l border-slate-200 dark:border-slate-700 w-14 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                      รวม
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {displayPoints.map((pt, rIdx) => {
                    const rowSum = getPointTotal(pt.id);
                    return (
                      <tr 
                        key={pt.id}
                        className={`hover:bg-amber-50/30 dark:hover:bg-amber-950/10 transition-colors ${
                          pt.id % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/30'
                        }`}
                      >
                        <td className="py-1 px-1 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-500">
                          {pt.no}
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-800 text-left font-semibold text-[11px] truncate max-w-[180px]">
                          {pt.name}
                        </td>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                          const val = dailyRecords[pt.id]?.[d] ?? '';
                          const isPlaced = val === 'วาง';
                          const isHoliday = val === '-';
                          const num = parseInt(val, 10);
                          const isCount = !isNaN(num) && num > 0;
                          const isExceed = d > daysInMonth;
                          return (
                            <td key={d} className={`p-0 border-r border-slate-200 dark:border-slate-800 relative ${isExceed ? 'bg-slate-100/50 dark:bg-slate-800/20' : ''}`}>
                              <input
                                id={`cell-roach-${rIdx}-${d}`}
                                type="text"
                                disabled={isExceed}
                                value={isExceed ? '-' : val}
                                onChange={(e) => handleCellChange(pt.id, d, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleTableKeyDown(e, rIdx, d)}
                                className={`w-full py-1 text-center font-mono text-[11px] bg-transparent focus:bg-amber-100/80 dark:focus:bg-amber-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500 relative focus:z-10 transition-all ${
                                  isExceed
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : isPlaced 
                                      ? 'text-blue-700 dark:text-blue-300 font-black bg-blue-100/70 dark:bg-blue-950/50' 
                                      : isHoliday
                                        ? 'text-slate-400 font-bold bg-slate-50 dark:bg-slate-900/40'
                                        : isCount 
                                          ? 'text-red-600 dark:text-red-400 font-black bg-red-50 dark:bg-red-950/30' 
                                          : 'text-slate-400'
                                }`}
                                placeholder={isExceed ? '-' : '0'}
                              />
                            </td>
                          );
                        })}
                        <td className="py-1 px-2 border-l border-slate-200 dark:border-slate-800 font-mono font-bold text-xs text-slate-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20">
                          {rowSum}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-black border-t-2 border-amber-500 text-xs">
                    <td colSpan="2" className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">
                      ยอดรวมทั้งหมด ({displayPoints.length} จุด)
                    </td>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                      let colSum = 0;
                      displayPoints.forEach(pt => {
                        const v = parseInt(dailyRecords[pt.id]?.[d], 10);
                        if (!isNaN(v) && v > 0) colSum += v;
                      });
                      const isPlacement = placementDays.includes(d);
                      const isExceed = d > daysInMonth;
                      return (
                        <td key={d} className={`py-2 px-0.5 border-r border-slate-200 dark:border-slate-700 font-mono text-[10px] ${isPlacement ? 'bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 font-bold' : ''}`}>
                          {isExceed ? '-' : colSum > 0 ? colSum : isPlacement ? 'วาง' : '-'}
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 border-l border-slate-200 dark:border-slate-700 font-mono text-sm text-red-600 dark:text-red-400">
                      {monthlyGrandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Note & Signatures */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400">
                <span className="font-extrabold text-amber-700 dark:text-amber-400">**หมายเหตุ:**</span> 
                ความถี่ในการเปลี่ยนบ้านแมลงสาบ 1 ครั้ง/สัปดาห์ (ระบุคำว่า "วาง") ยกเว้นในกรณีที่พบแมลงสาบ/บ้านชำรุด ให้เปลี่ยนใหม่ทันที **ความถี่ในการตรวจเช็ค: ทุกวัน
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    ผู้บันทึกตรวจเช็ค (รายวัน):
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                    ผู้ตรวจสอบ (รายสัปดาห์):
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB 3: PRINT CENTER & OFFICIAL REPORTS (Landscape A4) ─── */}
        {activeTab === 'print' && (
          <div className="space-y-6">
            
            {/* Quick Action Print Center Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 no-print">
              {/* Option 1: Monthly 23 Points (Image 1) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
                      📊
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                      1 หน้า A4 แนวนอน
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      รายงานสถิติประจำเดือน (23 จุด)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      พิมพ์กราฟแท่ง 23 จุดดัก พร้อมบทวิเคราะห์ QC และตารางลงนาม 2 ฝ่าย (รูปแบบตรงตามภาพที่ 1)
                    </p>
                  </div>

                  {/* Inline Month & Year Selector for Monthly Report */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>เลือกเดือนที่จะพิมพ์:</span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400">
                        พบ {monthlyGrandTotal} ตัว
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                      >
                        {reportAvailableMonths.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                      >
                        <option value="2569">ปี 2569</option>
                        <option value="2568">ปี 2568</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePrint('monthly')}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์รายงานเดือน {selectedMonth} {selectedYear} (A4)</span>
                </button>
              </div>

              {/* Option 2: Quarterly Trends 3 Pages (Images 2-4) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg">
                      📈
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">
                      3 หน้า A4 แนวนอน
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      รายงานแนวโน้มรายไตรมาส
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      พิมพ์รายงานแนวโน้มเปรียบเทียบ 3 เดือน ครบ 6 โซนตรวจวัด พร้อมบทวิเคราะห์แยกโซน (รูปแบบตรงตามภาพที่ 2-4)
                    </p>
                  </div>

                  {/* Inline Quarter & Page Selector for Quarterly Report */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>เลือกไตรมาสที่จะพิมพ์:</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                        ({QUARTERS_CONFIG[selectedQuarter]?.rangeText})
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {Object.values(QUARTERS_CONFIG).map(q => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setSelectedQuarter(q.id)}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            selectedQuarter === q.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {q.id}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                      <span className="font-bold text-slate-500">เลือกหน้า:</span>
                      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5 rounded-lg text-[10px] font-bold">
                        {[
                          { id: 'all', label: 'ครบ 3 หน้า' },
                          { id: '1', label: 'หน้า 1' },
                          { id: '2', label: 'หน้า 2' },
                          { id: '3', label: 'หน้า 3' }
                        ].map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setQuarterlyPage(opt.id)}
                            className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                              quarterlyPage === opt.id
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handlePrint(quarterlyPage === 'all' ? 'quarterly' : 'quarterly-single')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>
                    พิมพ์{QUARTERS_CONFIG[selectedQuarter]?.shortName} {selectedYear} ({quarterlyPage === 'all' ? 'ครบ 3 หน้า A4' : `หน้า ${quarterlyPage}/3`})
                  </span>
                </button>
              </div>

              {/* Option 3: By Zone */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                      📑
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                      รายงานรายโซน
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      รายงานสถิติแยกตามโซนตรวจวัด
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      พิมพ์รายงานเฉพาะโซนที่ต้องการ หรือสั่งพิมพ์แยกรายโซนทั้งหมดพร้อมกัน 1 คลิก
                    </p>
                  </div>

                  {/* Inline Zone Selector */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      เลือกโซนที่ต้องการพิมพ์ (เดือน {selectedMonth}):
                    </span>
                    <select
                      value={selectedPrintZone}
                      onChange={(e) => setSelectedPrintZone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 cursor-pointer shadow-2xs"
                    >
                      {ALL_COCKROACH_PRINT_ZONES.map(z => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint('single')}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์เฉพาะโซน</span>
                  </button>
                  <button
                    onClick={() => handlePrint('all')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>พิมพ์ครบทุกโซน</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Selector and Controls Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 no-print shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  🔍 ดูตัวอย่างเอกสารก่อนพิมพ์:
                </span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setPrintPreviewTab('monthly')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      printPreviewTab === 'monthly'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>📊 รายเดือน ({selectedMonth})</span>
                  </button>
                  <button
                    onClick={() => setPrintPreviewTab('quarterly')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      printPreviewTab === 'quarterly'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>📈 ไตรมาส ({QUARTERS_CONFIG[selectedQuarter]?.shortName})</span>
                  </button>
                  <button
                    onClick={() => setPrintPreviewTab('zone')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                      printPreviewTab === 'zone'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    <span>📑 รายโซน</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {printPreviewTab === 'zone' && (
                  <select
                    value={selectedPrintZone}
                    onChange={(e) => setSelectedPrintZone(e.target.value)}
                    className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {ALL_COCKROACH_PRINT_ZONES.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => {
                    if (printPreviewTab === 'monthly') handlePrint('monthly');
                    else if (printPreviewTab === 'quarterly') handlePrint(quarterlyPage === 'all' ? 'quarterly' : 'quarterly-single');
                    else handlePrint('single');
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์หน้านี้</span>
                </button>
              </div>
            </div>

            {/* PREVIEW 1: Monthly 23 Points Report (Image 1) */}
            {printPreviewTab === 'monthly' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm no-print space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      ตัวอย่างรายงานรายเดือน (A4 แนวนอน)
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">
                      กราฟแสดงรายงานการตรวจนับจำนวนแมลงสาบ 23 จุดดัก ประจำเดือน {selectedMonth} {selectedYear}
                    </h2>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                    ยอดตรวจพบรวม: {monthlyGrandTotal} ตัว
                  </span>
                </div>

                <div className="h-[360px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthly23PointsData} margin={{ top: 25, right: 15, left: -10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" className="hidden dark:block" />
                        <XAxis dataKey="no" stroke="#64748b" fontSize={9.5} tickLine={false} tick={<AngledCategoryTick />} interval={0} />
                        <YAxis stroke="#64748b" fontSize={9.5} tickLine={false} allowDecimals={false} domain={monthlyYAxisConfig.domain} ticks={monthlyYAxisConfig.ticks} />
                        <Tooltip formatter={(val, _, props) => [`${val} ตัว`, props.payload.name]} />
                        <Bar dataKey="count" name="จำนวนแมลงสาบ (ตัว)" fill="#C0504D" isAnimationActive={false}>
                          <LabelList content={<BoxedBarLabel />} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Analytical Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-400 mb-1">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>บทวิเคราะห์และข้อเสนอแนะฝ่ายประกันคุณภาพ (QC/QA Analysis):</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {monthlyFormAnalysisText}
                  </p>
                </div>

                {/* 3 Signatures Preview */}
                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">ผู้จัดทำ:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{reporterName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">หัวหน้าแผนก:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{reviewerName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">หัวหน้าฝ่ายประกันคุณภาพ:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">........................................</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW 2: Quarterly 3-Pages Report (Images 2-4) */}
            {printPreviewTab === 'quarterly' && (
              <div className="space-y-6 no-print">
                {COCKROACH_QUARTERLY_PAGES
                  .filter(p => quarterlyPage === 'all' || quarterlyPage === String(p.page))
                  .map(pageConfig => {
                    const qConfig = QUARTERS_CONFIG[selectedQuarter] || QUARTERS_CONFIG['Q1'];
                    return (
                      <div 
                        key={`print-tab-preview-q-page-${pageConfig.page}`}
                        className="bg-white text-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
                      >
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="text-xs font-bold text-slate-500">
                            บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด — {pageConfig.title} ({qConfig.shortName})
                          </span>
                          <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
                            {pageConfig.pageLabel}
                          </span>
                        </div>

                        <div className="space-y-6">
                          {pageConfig.zones.map(zone => {
                            const chartData = getZoneQuarterlyChartData(zone);
                            const status = getEffectiveZoneStatus(zone.id, chartData, selectedYear, selectedQuarter);
                            const narrative = getQuarterlyZoneNarrative(zone.id, zone.narrativeName, chartData, selectedYear, selectedQuarter);
                            const yAxisConfig = getQuarterlyYAxisConfig(chartData);
                            const isCentered = (status === 'inactive');

                            return (
                              <div key={zone.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                                <div className="lg:col-span-7 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                                  <div className="text-center mb-2">
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {zone.chartTitle}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                      (ตรวจนับจากบ้านแมลงสาบตำแหน่ง{zone.chartSubtitleName}) {qConfig.rangeText} {selectedYear}
                                    </p>
                                  </div>

                                  <div className="h-48 w-full">
                                    {mounted && (
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 18, right: 10, left: -22, bottom: 5 }}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                          <XAxis dataKey="no" stroke="#64748b" fontSize={9} tickLine={false} />
                                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} allowDecimals={false} domain={yAxisConfig.domain} ticks={yAxisConfig.ticks} />
                                          <Tooltip formatter={(val, name) => [`${val} ตัว`, name]} />
                                          <Legend content={renderQuarterlyLegend} wrapperStyle={{ bottom: -8, left: 0, width: '100%', fontSize: '10px', textAlign: 'center' }} />
                                          <Bar dataKey="month1" name={currentQuarterMonthsShort[0]} fill="#4F81BD" barSize={12}>
                                            <LabelList dataKey="month1" content={QuarterlyBarLabel} />
                                          </Bar>
                                          <Bar dataKey="month2" name={currentQuarterMonthsShort[1]} fill="#C0504D" barSize={12}>
                                            <LabelList dataKey="month2" content={QuarterlyBarLabel} />
                                          </Bar>
                                          <Bar dataKey="month3" name={currentQuarterMonthsShort[2]} fill="#9BBB59" barSize={12}>
                                            <LabelList dataKey="month3" content={QuarterlyBarLabel} />
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    )}
                                  </div>
                                </div>

                                <div className={`lg:col-span-5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl p-6 flex flex-col shadow-2xs ${isCentered ? 'justify-center items-center' : 'justify-start items-start'}`}>
                                  <div className={`leading-relaxed text-xs sm:text-sm text-slate-800 dark:text-slate-200 ${isCentered ? 'text-center' : 'text-left'}`}>
                                    <p className="m-0" style={{ whiteSpace: isCentered ? 'pre-line' : 'normal', lineHeight: isCentered ? 1.85 : 1.6 }}>{narrative}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-slate-300 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                          <div className="lg:col-span-7 text-center">
                            <p className="font-bold">ผู้จัดทำ .................................</p>
                            <p className="mt-1 text-slate-500 dark:text-slate-400">วันที่........../............/...........</p>
                          </div>
                          <div className="lg:col-span-5 text-center">
                            <p className="font-bold">ผู้ตรวจสอบ ............................</p>
                            <p className="mt-1 text-slate-500 dark:text-slate-400">วันที่........../............/...........</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* PREVIEW 3: Zone Report */}
            {printPreviewTab === 'zone' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm no-print space-y-6">
                <div className="text-center">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                    กราฟแสดงรายงานการตรวจนับจำนวนแมลงสาบ ของทีม{selectedPrintZone} ประจำเดือน {selectedMonth} {selectedYear}
                  </h2>
                </div>

                <div className="h-[380px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getZoneDetailedChartData(selectedPrintZone)} margin={{ top: 25, right: 10, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip formatter={(val) => [`${val} ตัว`, 'จำนวนแมลงสาบ']} />
                        <Legend wrapperStyle={{ bottom: 0, left: 0, width: '100%', textAlign: 'center', fontSize: 11 }} />
                        <Bar dataKey="count" name="จำนวนแมลงสาบที่ตรวจพบ (ตัว)" fill="#ea580c">
                          <LabelList dataKey="count" position="top" style={{ fill: '#ea580c', fontSize: 11, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-700 dark:text-amber-400 mb-1">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>บทวิเคราะห์และข้อเสนอแนะฝ่ายประกันคุณภาพ (QC/QA Analysis):</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {getCockroachZoneReportText(selectedPrintZone)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">ผู้จัดทำ:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{reporterName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">หัวหน้าแผนก:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{reviewerName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">หัวหน้าฝ่ายประกันคุณภาพ:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">........................................</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div> {/* closes screen-content */}

      {/* Printable reports layout */}
      {printJob !== 'none' && (
        <div className="print-layout">
          {printJob === 'monthly' && renderMonthlyPrintPage()}
          {printJob === 'quarterly' && COCKROACH_QUARTERLY_PAGES.map(p => renderQuarterlyPrintPage(p))}
          {printJob === 'quarterly-single' && COCKROACH_QUARTERLY_PAGES.filter(p => quarterlyPage === 'all' ? true : String(p.page) === quarterlyPage).map(p => renderQuarterlyPrintPage(p))}
          {printJob === 'single' && renderCockroachPrintPage(selectedPrintZone)}
          {printJob === 'all' && ALL_COCKROACH_PRINT_ZONES.map(z => renderCockroachPrintPage(z))}
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Niramit:wght@400;500;600;700&display=swap');
        
        .font-niramit {
          font-family: 'Niramit', sans-serif !important;
        }
        
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body, html {
            background-color: white !important;
            color: black !important;
            font-family: 'Niramit', sans-serif !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .min-h-screen {
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .screen-content, header, nav, footer, .no-print, #navbar-global {
            display: none !important;
          }
          .print-layout {
            display: block !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            visibility: visible !important;
            opacity: 1 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: auto !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            position: relative;
            width: 297mm;
            height: 210mm;
            box-sizing: border-box;
            overflow: hidden;
            background: white !important;
            color: black !important;
          }
          .print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
        .recharts-surface, .recharts-wrapper {
          overflow: visible !important;
        }
        @media screen {
          .print-layout {
            position: fixed !important;
            left: -99999px !important;
            top: 0 !important;
            width: 297mm !important;
            visibility: hidden !important;
            pointer-events: none !important;
            opacity: 0 !important;
            z-index: -9999 !important;
          }
        }
      `}</style>
    </main>
  );
}
