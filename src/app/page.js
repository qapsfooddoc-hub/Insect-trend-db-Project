'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, BarChart3, LineChart as LineIcon, Sparkles, 
  RefreshCw, Building2, Layers, Crosshair, HelpCircle as HelpIcon, 
  ShieldCheck as CheckIcon, Info, TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, LabelList
} from 'recharts';

// Helper to extract department and location details
function parseArea(areaString) {
  if (!areaString) return { dept: 'อื่นๆ', location: '-' };
  
  let deptResult = 'อื่นๆ';
  let locationResult = areaString;

  if (areaString.includes(': ')) {
    const parts = areaString.split(': ');
    deptResult = parts[0];
    locationResult = parts[1];
  } else {
    // Fallback check if it starts with department keywords
    const depts = [
      'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'โหลด', 'เฟส 6', 
      'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
    ];
    for (const d of depts) {
      if (areaString.startsWith(d)) {
        deptResult = d;
        locationResult = areaString.replace(d, '').replace(/^\s*[:\-]\s*/, '').trim();
        break;
      }
    }
  }

  // Normalize "โหลด" to "โหลด เฟส 5"
  if (deptResult === 'โหลด') {
    deptResult = 'โหลด เฟส 5';
  }

  return { dept: deptResult, location: locationResult };
}

// Custom Label List Renderer to force display of 0 values
const renderCustomLabel = (fillColor = '#475569', fontSize = 9) => (props) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === null) return null;
  return (
    <text
      x={x + (width || 0) / 2}
      y={y - 6}
      fill={fillColor}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={fontSize}
      fontWeight="bold"
      style={{ fontFamily: 'inherit' }}
    >
      {value}
    </text>
  );
};

const mapZeroToTinyDecimal = (dataArray) => {
  if (!dataArray) return [];
  return dataArray.map(item => ({
    ...item,
    flies: item.flies === 0 ? 0.0001 : item.flies,
    mosquitoes: item.mosquitoes === 0 ? 0.0001 : item.mosquitoes,
    ants: item.ants === 0 ? 0.0001 : item.ants,
    others: item.others === 0 ? 0.0001 : item.others,
  }));
};

const DEPTS_LIST = [
  'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'เฟส 6', 
  'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
];

// Department Pastel Colors for general visualization
const DEPT_COLORS = {
  'หน้าร้านใหม่': '#60a5fa',  // สีฟ้าพาสเทล
  'โรงฆ่า': '#fb923c',      // สีส้มพาสเทล
  'ตัดแต่ง': '#4ade80',      // สีเขียวพาสเทล
  'โหลด เฟส 5': '#f472b6',   // สีชมพูพาสเทล
  'เฟส 6': '#c084fc',      // สีม่วงพาสเทล
  'คลัง3': '#fbbf24',      // สีเหลืองครีมพาสเทล
  'หมูบด': '#f87171',      // สีแดงพาสเทล
  'Slice ผลิต': '#2dd4bf',  // สีเขียวมินต์พาสเทล
  'อนามัย': '#818cf8',      // สีครามพาสเทล
  'ล้างตะกร้า': '#94a3b8'   // สีเทาสว่าง
};

// Department Dark Tones for YoY 2026 Line Charts
const DEPT_DARK_COLORS = {
  'หน้าร้านใหม่': '#2563eb',  // Deep Blue
  'โรงฆ่า': '#ea580c',      // Deep Orange
  'ตัดแต่ง': '#16a34a',      // Deep Green
  'โหลด เฟส 5': '#db2777',   // Deep Pink
  'เฟส 6': '#9333ea',      // Deep Purple
  'คลัง3': '#d97706',      // Deep Amber/Brown
  'หมูบด': '#dc2626',      // Deep Red
  'Slice ผลิต': '#0d9488',  // Deep Teal
  'อนามัย': '#4f46e5',      // Deep Indigo
  'ล้างตะกร้า': '#475569'   // Deep Slate
};

// 10 Pastel Groups for Department Selector buttons
const DEPT_CONFIGS = {
  'หน้าร้านใหม่': {
    border: 'border-blue-200 dark:border-blue-900/50',
    bg: 'bg-blue-50/20 dark:bg-blue-950/10',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    colors: ['#60a5fa', '#93c5fd', '#3b82f6', '#1d4ed8']
  },
  'โรงฆ่า': {
    border: 'border-orange-200 dark:border-orange-900/50',
    bg: 'bg-orange-50/20 dark:bg-orange-950/10',
    badge: 'bg-orange-100 text-orange-855 dark:bg-orange-900/40 dark:text-orange-300',
    colors: ['#fb923c', '#fdba74', '#f97316', '#c2410c']
  },
  'ตัดแต่ง': {
    border: 'border-emerald-200 dark:border-emerald-900/50',
    bg: 'bg-emerald-50/20 dark:bg-emerald-950/10',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    colors: ['#34d399', '#6ee7b7', '#10b981', '#047857']
  },
  'โหลด เฟส 5': {
    border: 'border-pink-200 dark:border-pink-900/50',
    bg: 'bg-pink-50/20 dark:bg-pink-950/10',
    badge: 'bg-pink-100 text-pink-855 dark:bg-pink-900/40 dark:text-pink-300',
    colors: ['#f472b6', '#f9a8d4', '#ec4899', '#be185d']
  },
  'เฟส 6': {
    border: 'border-purple-200 dark:border-purple-900/50',
    bg: 'bg-purple-50/20 dark:bg-purple-950/10',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    colors: ['#c084fc', '#d8b4fe', '#a855f7', '#7e22ce']
  },
  'คลัง3': {
    border: 'border-amber-200 dark:border-amber-900/50',
    bg: 'bg-amber-50/20 dark:bg-amber-950/10',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    colors: ['#fbbf24', '#fcd34d', '#f59e0b', '#b45309']
  },
  'หมูบด': {
    border: 'border-red-200 dark:border-red-900/50',
    bg: 'bg-red-50/20 dark:bg-red-950/10',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
    colors: ['#f87171', '#fca5a5', '#ef4444', '#b91c1c']
  },
  'Slice ผลิต': {
    border: 'border-teal-200 dark:border-teal-900/50',
    bg: 'bg-teal-50/20 dark:bg-teal-950/10',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    colors: ['#2dd4bf', '#5eead4', '#14b8a6', '#0f766e']
  },
  'อนามัย': {
    border: 'border-indigo-200 dark:border-indigo-900/50',
    bg: 'bg-indigo-50/20 dark:bg-indigo-950/10',
    badge: 'bg-indigo-100 text-indigo-855 dark:bg-indigo-900/40 dark:text-indigo-300',
    colors: ['#818cf8', '#a5b4fc', '#6366f1', '#4338ca']
  },
  'ล้างตะกร้า': {
    border: 'border-slate-350 dark:border-slate-800',
    bg: 'bg-slate-50/20 dark:bg-slate-900/10',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    colors: ['#94a3b8', '#cbd5e1', '#64748b', '#334155']
  }
};

const TRAP_LOCATIONS = [
  '(07) ลานโหลดสินค้าหน้าร้าน',
  '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน',
  '(09) ทางเข้าฝ่ายซาก/เครื่องในแดง/เครื่องในขาว',
  '(10) ลานโหลดสินค้าห้องเลือด',
  '(11) ห้องเลือด',
  '(12) ห้องช็อต/แทงคอ/ลวกซาก',
  '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน',
  '(03) ห้องตัดแต่ง บริเวณทางหนีไฟ',
  '(04) ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น',
  '(05) ห้องตัดแต่ง บริเวณเลนมันและหนัง',
  '(31) ห้องล้างมัน/คัดแยกเศษ',
  '(01) ลานโหลดของตัดแต่งและ Makro',
  '(02) ทางขนย้ายสินค้าเข้า - ออกตัดแต่ง',
  '(06) ลานโหลดของตัดแต่งและ Makro',
  '(13) ห้อง Pack A บริเวณหน้าประตูทางเชื่อมอาคาร',
  '(14) ห้อง Pack A บริเวณหน้าห้องเก็บบรรจุภัณฑ์',
  '(15) ห้อง Pack C',
  '(16) ห้อง Pack สินค้า Frozen คลัง3',
  '(17) ห้องหมูบด บริเวณทางเข้า-ออก ติดตู้ F5',
  '(18) ห้องหมูบด บริเวณเครื่องบดหมู ติดตู้ F1',
  '(19) ห้องหมูบด บริเวณผนังติดห้องเครื่อง',
  '(20) ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ',
  '(21) ห้องหมูบด ทางเข้า-ออกไลน์ผลิต ฝั่งตู้ S,T',
  '(22) ห้อง Slice เครื่องใน ทางเข้า-ออก ฝั่ง Chill 3',
  '(23) ห้อง Slice เครื่องใน ทางเข้า-ออกไลน์ผลิต',
  '(26) Slice ชั้น 3 ทางเข้า-ออกไลน์ผลิต',
  '(27) Slice ชั้น 3 พื้นที่การผลิต',
  '(28) ทางเดินไปห้องยุง Slice ชั้น 3',
  '(29) ห้อง Slice เฟส 4.1',
  '(24) ห้องซักผ้า คลัง 4',
  '(25) ทางเข้า Slice ถาด',
  '(33) บันไดทางขึ้นชั้น 2',
  '(32) ทางลำเลียงตะกร้าเข้าไลน์ผลิต'
];

// Department to Traps mapping
const DEPT_TRAPS_MAPPING = {
  'หน้าร้านใหม่': ['(07) ลานโหลดสินค้าหน้าร้าน'],
  'โรงฆ่า': [
    '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน',
    '(09) ทางเข้าฝ่ายซาก/เครื่องในแดง/เครื่องในขาว',
    '(10) ลานโหลดสินค้าห้องเลือด',
    '(11) ห้องเลือด',
    '(12) ห้องช็อต/แทงคอ/ลวกซาก',
    '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน'
  ],
  'ตัดแต่ง': [
    '(03) ห้องตัดแต่ง บริเวณทางหนีไฟ',
    '(04) ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น',
    '(05) ห้องตัดแต่ง บริเวณเลนมันและหนัง',
    '(31) ห้องล้างมัน/คัดแยกเศษ'
  ],
  'โหลด เฟส 5': [
    '(01) ลานโหลดของตัดแต่งและ Makro',
    '(02) ทางขนย้ายสินค้าเข้า - ออกตัดแต่ง',
    '(06) ลานโหลดของตัดแต่งและ Makro'
  ],
  'เฟส 6': [
    '(13) ห้อง Pack A บริเวณหน้าประตูทางเชื่อมอาคาร',
    '(14) ห้อง Pack A บริเวณหน้าห้องเก็บบรรจุภัณฑ์',
    '(15) ห้อง Pack C'
  ],
  'คลัง3': [
    '(16) ห้อง Pack สินค้า Frozen คลัง3'
  ],
  'หมูบด': [
    '(17) ห้องหมูบด บริเวณทางเข้า-ออก ติดตู้ F5',
    '(18) ห้องหมูบด บริเวณเครื่องบดหมู ติดตู้ F1',
    '(19) ห้องหมูบด บริเวณผนังติดห้องเครื่อง',
    '(20) ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ',
    '(21) ห้องหมูบด ทางเข้า-ออกไลน์ผลิต ฝั่งตู้ S,T'
  ],
  'Slice ผลิต': [
    '(22) ห้อง Slice เครื่องใน ทางเข้า-ออก ฝั่ง Chill 3',
    '(23) ห้อง Slice เครื่องใน ทางเข้า-ออกไลน์ผลิต',
    '(26) Slice ชั้น 3 ทางเข้า-ออกไลน์ผลิต',
    '(27) Slice ชั้น 3 พื้นที่การผลิต',
    '(28) ทางเดินไปห้องยุง Slice ชั้น 3',
    '(29) ห้อง Slice เฟส 4.1'
  ],
  'อนามัย': [
    '(24) ห้องซักผ้า คลัง 4',
    '(25) ทางเข้า Slice ถาด',
    '(33) บันไดทางขึ้นชั้น 2'
  ],
  'ล้างตะกร้า': [
    '(32) ทางลำเลียงตะกร้าเข้าไลน์ผลิต'
  ]
};

// Exact Colors matching image_cbb746.png
const INSECT_CHART_COLORS = {
  flies: '#0f5b84',      // Deep Teal/Blue
  mosquitoes: '#e452cd', // Bright Orchid Pink
  ants: '#fcc214',       // Golden Yellow
  others: '#78c843'      // Pastel Green
};

// Sort trap locations numerically (01, 02, ..., 33)
const SORTED_TRAP_LOCATIONS = [...TRAP_LOCATIONS].sort((a, b) => {
  const matchA = a.match(/\((\d+)\)/);
  const matchB = b.match(/\((\d+)\)/);
  const numA = matchA ? parseInt(matchA[1], 10) : 0;
  const numB = matchB ? parseInt(matchB[1], 10) : 0;
  return numA - numB;
});

// --- Custom XAxis Tick for wrapping text into 2 lines ---
function CustomTick({ x, y, payload }) {
  const value = payload?.value || '';
  let line1 = value;
  let line2 = '';
  
  if (value.length > 12) {
    let splitIdx = -1;
    const sepRegex = /[\s\/\-]/g;
    let match;
    const candidates = [];
    while ((match = sepRegex.exec(value)) !== null) {
      candidates.push(match.index);
    }
    
    if (candidates.length > 0) {
      candidates.sort((a, b) => Math.abs(a - 12) - Math.abs(b - 12));
      splitIdx = candidates[0];
    } else {
      splitIdx = Math.ceil(value.length / 2);
    }
    
    line1 = value.slice(0, splitIdx + 1).trim();
    line2 = value.slice(splitIdx + 1).trim();
  }
  
  return (
    <g transform={`translate(${x},${y + 12})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        className="fill-slate-500 dark:fill-slate-400 font-extrabold text-[9px]"
        style={{ fontFamily: 'inherit' }}
      >
        <tspan x={0} dy="0">{line1}</tspan>
        {line2 && <tspan x={0} dy="12">{line2}</tspan>}
      </text>
    </g>
  );
}
// --- Custom Legend Content to enforce centered alignment and exact order: แมลงวัน -> ยุง -> มด -> อื่นๆ ---
function RenderCustomLegend(props) {
  const { payload } = props;
  if (!payload) return null;
  
  const orderMap = {
    'flies': 0, 'แมลงวัน': 0,
    'mosquitoes': 1, 'ยุง': 1,
    'ants': 2, 'มด': 2,
    'others': 3, 'แมลงอื่นๆ': 3, 'อื่นๆ': 3
  };

  const getRank = (item) => {
    if (item.dataKey && orderMap[item.dataKey] !== undefined) return orderMap[item.dataKey];
    if (item.value && orderMap[item.value] !== undefined) return orderMap[item.value];
    if (item.payload && item.payload.dataKey && orderMap[item.payload.dataKey] !== undefined) return orderMap[item.payload.dataKey];
    return 99;
  };

  const orderedItems = [...payload].sort((a, b) => getRank(a) - getRank(b));
  
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '8px',
        gap: '8px',
        width: '100%'
      }}
    >
      {/* Centered label: หมายเลขเครื่องดักแมลง */}
      <div 
        className="text-slate-500 dark:text-slate-400 font-extrabold"
        style={{
          fontSize: '11px',
          fontFamily: 'inherit',
          lineHeight: '1.2'
        }}
      >
        หมายเลขเครื่องดักแมลง
      </div>
      
      {/* Centered Legend items */}
      <div 
        className="text-slate-500 dark:text-slate-400 font-extrabold"
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          fontSize: '11.5px',
          fontFamily: 'inherit'
        }}
      >
        {orderedItems.map((entry, index) => (
          <div 
            key={`item-${index}`} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}
          >
            <span 
              className="rounded-full inline-block shrink-0 shadow-sm" 
              style={{ 
                width: '10px', 
                height: '10px', 
                backgroundColor: entry.color 
              }} 
            />
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
// Custom Tooltip component to show details of other insects (Option 1)
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 text-slate-100 p-4 rounded-2xl shadow-xl text-xs font-sans max-w-[280px]">
        <p className="font-extrabold text-slate-400 mb-2 border-b border-slate-850 pb-1">{label}</p>
        <div className="space-y-1.5 font-semibold">
          {payload.map((entry) => {
            const isOthers = entry.dataKey === 'others';
            const breakdown = data.othersBreakdown;
            const hasBreakdown = isOthers && breakdown && Object.keys(breakdown).length > 0;
            return (
              <div key={entry.dataKey} className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center gap-6">
                  <span className="flex items-center gap-1.5 font-bold animate-in fade-in" style={{ color: entry.color }}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    {entry.name}:
                  </span>
                  <span className="font-extrabold font-mono text-slate-200">{entry.value < 0.1 ? 0 : entry.value} ตัว</span>
                </div>
                {hasBreakdown && (
                  <div className="pl-4 text-[10px] text-slate-400 border-l border-slate-700 space-y-0.5 mt-0.5 font-bold">
                    {Object.entries(breakdown).map(([name, count]) => (
                      <div key={name} className="flex justify-between gap-4">
                        <span>• {name}:</span>
                        <span className="font-mono text-slate-300">{count} ตัว</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'department', 'device', 'yoy'

  // Global Filters (Shared)
  const [selectedYear, setSelectedYear] = useState('2026'); // stored as AD
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Tab 2 Specific Filters
  const [selectedDept, setSelectedDept] = useState('โรงฆ่า');

  // Tab 3 Specific Filters
  const [selectedTrap, setSelectedTrap] = useState('(07) ลานโหลดสินค้าหน้าร้าน');

  // Tab 4 Specific Filters (Department Line Chart)
  const [selectedYoyDept, setSelectedYoyDept] = useState('โรงฆ่า');

  // AI Insights State
  const [aiReport, setAiReport] = useState('');
  const [aiReportLoading, setAiReportLoading] = useState(false);
  const [deptReportText, setDeptReportText] = useState('');
  const [deptReportLoading, setDeptReportLoading] = useState(false);

  // --- PRINT JOB STATE ---
  const [printJob, setPrintJob] = useState('none'); // 'none', 'monthly', 'monthly-all', 'quarterly', 'quarterly-all'

  // --- CURRENT USER SIMULATION STATE ---
  const [currentUser, setCurrentUser] = useState(null);

  const syncCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentSimulatedUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.department === 'โหลด') {
            parsed.department = 'โหลด เฟส 5';
          }
          setCurrentUser(parsed);
        } catch (e) {}
      } else {
        setCurrentUser(null);
      }
    }
  };

  useEffect(() => {
    syncCurrentUser();
    window.addEventListener('currentSimulatedUserChanged', syncCurrentUser);
    return () => {
      window.removeEventListener('currentSimulatedUserChanged', syncCurrentUser);
    };
  }, []);

  // --- MONTHLY APPROVAL DATA STATE ---
  const [approvalData, setApprovalData] = useState({
    deptApproved: false,
    deptApproverName: '',
    deptApprovedAt: '',
    deptComment: '',
    qaApproved: false,
    qaApproverName: '',
    qaApprovedAt: '',
    qaComment: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const beYear = parseInt(selectedYear, 10) + 543;
      const key = `approval_${selectedDept}_${selectedMonth}_${beYear}`;
      
      // Initialize demo pre-approval for 'โรงฆ่า' and 'มกราคม' BE 2569
      if (isDemo && selectedDept === 'โรงฆ่า' && selectedMonth === 'มกราคม' && beYear === 2569) {
        const existing = localStorage.getItem(key);
        if (!existing) {
          const defaultApproval = {
            deptApproved: true,
            deptApproverName: 'แอดมิน สูงสุด — Admin',
            deptApprovedAt: '21 มกราคม 2569 10:30',
            deptComment: 'รับทราบรายงานผลการตรวจแมลงรอบเดือนมกราคมแล้ว ทุกจุดควบคุมเป็นปกติ',
            qaApproved: true,
            qaApproverName: 'แอดมิน สูงสุด — Admin',
            qaApprovedAt: '22 มกราคม 2569 14:15',
            qaComment: 'รับทราบรายงานผลการวิเคราะห์สถิติและการทวนสอบข้อมูลความปลอดภัยทางชีวภาพของฝ่าย QA แล้ว'
          };
          localStorage.setItem(key, JSON.stringify(defaultApproval));
        }
      }

      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setApprovalData(JSON.parse(saved));
        } catch {
          setApprovalData({
            deptApproved: false, deptApproverName: '', deptApprovedAt: '', deptComment: '',
            qaApproved: false, qaApproverName: '', qaApprovedAt: '', qaComment: ''
          });
        }
      } else {
        setApprovalData({
          deptApproved: false, deptApproverName: '', deptApprovedAt: '', deptComment: '',
          qaApproved: false, qaApproverName: '', qaApprovedAt: '', qaComment: ''
        });
      }
    }
  }, [selectedDept, selectedMonth, selectedYear, isDemo]);

  // --- QUARTERLY APPROVAL STATE ---
  const [quarterlyApproval, setQuarterlyApproval] = useState({
    approved: false,
    approverName: '',
    approvedAt: '',
    comment: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const beYear = parseInt(selectedYear, 10) + 543;
      const key = `quarterly_approval_${selectedDept}_${selectedQuarter}_${beYear}`;
      
      // Initialize demo pre-approval for 'โรงฆ่า' and 'Q1' BE 2569
      if (isDemo && selectedDept === 'โรงฆ่า' && selectedQuarter === 'Q1' && beYear === 2569) {
        const existing = localStorage.getItem(key);
        if (!existing) {
          const defaultQuarterly = {
            approved: true,
            approverName: 'แอดมิน สูงสุด — Admin',
            approvedAt: '22 มีนาคม 2569 14:30',
            comment: 'ผลการดักตรวจแมลงประจำไตรมาสที่ 1 อยู่ในเกณฑ์ควบคุมได้ดีมาก ดำเนินการล้างเครื่องตามแผนเรียบร้อย'
          };
          localStorage.setItem(key, JSON.stringify(defaultQuarterly));
        }
      }

      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setQuarterlyApproval(JSON.parse(saved));
        } catch {
          setQuarterlyApproval({ approved: false, approverName: '', approvedAt: '', comment: '' });
        }
      } else {
        setQuarterlyApproval({ approved: false, approverName: '', approvedAt: '', comment: '' });
      }
    }
  }, [selectedDept, selectedQuarter, selectedYear, isDemo]);

  // --- MONTH STATUS & APPROVED DATA HELPERS ---
  const getMonthStatus = (monthName, year) => {
    if (typeof window === 'undefined') return 'Draft';
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const mIdx = months.indexOf(monthName);
    if (mIdx === -1) return 'Approved';
    const date = new Date(parseInt(year), mIdx, 15);
    
    // Auto-approved if before June 1, 2026 (BE 2569 / 2026 AD)
    if (date < new Date('2026-06-01')) {
      return 'Approved';
    }
    
    return localStorage.getItem(`monthStatus_${monthName}_${year}`) || 'Draft';
  };

  const getApprovedRawData = (dataList) => {
    if (isDemo || typeof window === 'undefined') return dataList;
    return dataList.filter(item => {
      const date = new Date(item.inspected_at);
      if (date < new Date('2026-06-01')) {
        return true;
      }
      const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      const status = localStorage.getItem(`monthStatus_${monthName}_${year}`) || 'Draft';
      return status === 'Approved' || status === 'Pending';
    });
  };

  const approvedRawData = getApprovedRawData(rawData);

  // --- QUARTERLY APPROVAL HANDLERS ---
  const handleQuarterlyApprove = (approverName, commentText) => {
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `quarterly_approval_${selectedDept}_${selectedQuarter}_${beYear}`;
    const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const newData = {
      approved: true,
      approverName: approverName,
      approvedAt: timestamp,
      comment: commentText || '-'
    };
    setQuarterlyApproval(newData);
    localStorage.setItem(key, JSON.stringify(newData));
  };

  const handleQuarterlyReset = () => {
    if (!confirm('ยืนยันการยกเลิกการลงนามรับทราบไตรมาส?')) return;
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `quarterly_approval_${selectedDept}_${selectedQuarter}_${beYear}`;
    const newData = {
      approved: false,
      approverName: '',
      approvedAt: '',
      comment: ''
    };
    setQuarterlyApproval(newData);
    localStorage.setItem(key, JSON.stringify(newData));
  };

  const handlePrint = (jobType) => {
    if (!currentUser) {
      alert('กรุณาเข้าสู่ระบบก่อนพิมพ์รายงาน');
      window.location.href = '/login';
      return;
    }
    setPrintJob(jobType);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintJob('none');
      }, 500);
    }, 150);
  };

  const getTrapTrendData = (trapName, quarter, year) => {
    const q = quarter === 'ALL' ? 'Q1' : quarter;
    let monthsInfo = [];
    
    const monthsThaiMap = [
      { name: 'ม.ค.', index: 0 },
      { name: 'ก.พ.', index: 1 },
      { name: 'มี.ค.', index: 2 },
      { name: 'เม.ย.', index: 3 },
      { name: 'พ.ค.', index: 4 },
      { name: 'มิ.ย.', index: 5 },
      { name: 'ก.ค.', index: 6 },
      { name: 'ส.ค.', index: 7 },
      { name: 'ก.ย.', index: 8 },
      { name: 'ต.ค.', index: 9 },
      { name: 'พ.ย.', index: 10 },
      { name: 'ธ.ค.', index: 11 }
    ];

    if (q === 'Q1') {
      monthsInfo = monthsThaiMap.slice(0, 3);
    } else if (q === 'Q2') {
      monthsInfo = monthsThaiMap.slice(3, 6);
    } else if (q === 'Q3') {
      monthsInfo = monthsThaiMap.slice(6, 9);
    } else if (q === 'Q4') {
      monthsInfo = monthsThaiMap.slice(9, 12);
    } else {
      monthsInfo = monthsThaiMap;
    }

    if (isDemo || approvedRawData.length === 0) {
      const match = trapName.match(/\((\d+)\)/);
      const trapNo = parseInt(match ? match[1] : '7', 10);
      
      return monthsInfo.map((m, idx) => {
        const baseFlies = (trapNo === 7 ? 14 : trapNo % 3 === 0 ? 5 : 2) + (idx * 3);
        const baseMosquitoes = (trapNo === 22 ? 9 : trapNo % 4 === 0 ? 4 : 1) + (idx * 1.5);
        const baseAnts = (trapNo === 17 ? 18 : trapNo % 5 === 0 ? 8 : 2) - (idx * 2);
        const baseOthers = (trapNo % 2 === 0 ? 2 : 1) + (idx * 0.5);
        
        const r1 = Math.floor(Math.sin(idx + trapNo) * 2);
        const r2 = Math.floor(Math.cos(idx * 2 + trapNo) * 2);

        return {
          name: m.name,
          flies: Math.max(0, Math.round(baseFlies + r1)),
          mosquitoes: Math.max(0, Math.round(baseMosquitoes + r2)),
          ants: Math.max(0, Math.round(baseAnts - r1)),
          others: Math.max(0, Math.round(baseOthers)),
          othersBreakdown: baseOthers > 0 ? { 'ผีเสื้อ': Math.max(1, Math.floor(baseOthers / 2)), 'แมลงสาบ': Math.max(0, Math.ceil(baseOthers / 2)) } : {}
        };
      });
    }

    const filteredRecords = approvedRawData.filter(item => {
      if (!item.inspected_at) return false;
      const d = new Date(item.inspected_at);
      const y = String(d.getFullYear());
      if (y !== year && String(d.getFullYear() + 543) !== year) return false;
      
      const m = d.getMonth();
      if (q === 'Q1' && m >= 0 && m <= 2) return true;
      if (q === 'Q2' && m >= 3 && m <= 5) return true;
      if (q === 'Q3' && m >= 6 && m <= 8) return true;
      if (q === 'Q4' && m >= 9 && m <= 11) return true;
      return false;
    });

    const trapRecords = filteredRecords.filter(item => item.area && item.area.includes(trapName));

    return monthsInfo.map((m) => {
      const totals = { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
      const othersBreakdown = {};
      
      trapRecords.forEach(item => {
        const date = new Date(item.inspected_at);
        if (date.getMonth() === m.index) {
          const type = item.insect_type;
          const count = Number(item.count) || 0;
          if (type.includes('Flies')) totals.flies += count;
          else if (type.includes('Mosquitoes')) totals.mosquitoes += count;
          else if (type.includes('Ants')) totals.ants += count;
          else {
            totals.others += count;
            let detailsList = [];
            if (item.details) {
              try {
                detailsList = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
              } catch (e) {
                console.error('Failed to parse details:', e);
              }
            }
            if (Array.isArray(detailsList)) {
              detailsList.forEach(det => {
                const name = det.name || 'ไม่ระบุ';
                const countVal = Number(det.count) || 0;
                if (!othersBreakdown[name]) {
                  othersBreakdown[name] = 0;
                }
                othersBreakdown[name] += countVal;
              });
            }
          }
        }
      });

      return {
        name: m.name,
        flies: totals.flies,
        mosquitoes: totals.mosquitoes,
        ants: totals.ants,
        others: totals.others,
        othersBreakdown
      };
    });
  };

  const renderMonthlyPrintPage = (dept) => {
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `approval_${dept}_${selectedMonth}_${beYear}`;
    let deptApproved = false;
    let deptApproverName = '';
    let deptApprovedAt = '';
    let deptComment = '';
    let qaApproved = false;
    let qaApproverName = '';
    let qaApprovedAt = '';
    let qaComment = '';

    if (typeof window !== 'undefined') {
      // Demo pre-approval for 'โรงฆ่า' and 'มกราคม' BE 2569
      if (isDemo && dept === 'โรงฆ่า' && selectedMonth === 'มกราคม' && beYear === 2569) {
        deptApproved = true;
        deptApproverName = 'แอดมิน สูงสุด — Admin';
        deptApprovedAt = '21 มกราคม 2569 10:30';
        deptComment = 'รับทราบรายงานผลการตรวจแมลงรอบเดือนมกราคมแล้ว ทุกจุดควบคุมเป็นปกติ';
        qaApproved = true;
        qaApproverName = 'แอดมิน สูงสุด — Admin';
        qaApprovedAt = '22 มกราคม 2569 14:15';
        qaComment = 'รับทราบรายงานผลการวิเคราะห์สถิติและการทวนสอบข้อมูลความปลอดภัยทางชีวภาพของฝ่าย QA แล้ว';
      } else {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            deptApproved = parsed.deptApproved || false;
            deptApproverName = parsed.deptApproverName || '';
            deptApprovedAt = parsed.deptApprovedAt || '';
            deptComment = parsed.deptComment || '';
            qaApproved = parsed.qaApproved || false;
            qaApproverName = parsed.qaApproverName || '';
            qaApprovedAt = parsed.qaApprovedAt || '';
            qaComment = parsed.qaComment || '';
          } catch {}
        }
      }
    }

    const chartData = getDepartmentDetailedData(dept, selectedMonth, selectedYear);
    const reportText = getDeptAnalysisReport(dept, selectedMonth, getDisplayYear(selectedYear));

    return (
      <div 
        key={dept} 
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10mm 15mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontSize: '10px', color: '#64748b' }}>
          <span style={{ fontWeight: 'bold' }}>บริษัท พี.เอส.ฟู้ดโปรดักส์ จำกัด</span>
          <span>เอกสารควบคุมภายใน</span>
        </div>

        <div style={{ textAlign: 'center', margin: '10px 0' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>รายงานสถิติตรวจนับจำนวนแมลงประจำเดือน</h1>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginTop: '2px' }}>
            แผนก {dept} · ประจำเดือน {selectedMonth} {getDisplayYear(selectedYear)}
          </h2>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px', maxHeight: '380px' }}>
          <BarChart width={1009} height={350} data={mapZeroToTinyDecimal(chartData)} margin={{ top: 30, right: 10, left: -10, bottom: 75 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} interval={0} height={40} tick={<CustomTick />} />
            <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickCount={5} allowDecimals={false} domain={[0, (max) => Math.max(10, max)]} />
            <Tooltip formatter={(value) => (value < 0.1 ? 0 : value)} />
            <Legend content={<RenderCustomLegend />} wrapperStyle={{ bottom: 0, left: 0, width: '100%' }} />
            <Bar dataKey="flies" name="แมลงวัน" fill={INSECT_CHART_COLORS.flies} isAnimationActive={false}>
              <LabelList dataKey="flies" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 8, fontWeight: 'bold', fontFamily: 'inherit' }} />
            </Bar>
            <Bar dataKey="mosquitoes" name="ยุง" fill={INSECT_CHART_COLORS.mosquitoes} isAnimationActive={false}>
              <LabelList dataKey="mosquitoes" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 8, fontWeight: 'bold', fontFamily: 'inherit' }} />
            </Bar>
            <Bar dataKey="ants" name="มด" fill={INSECT_CHART_COLORS.ants} isAnimationActive={false}>
              <LabelList dataKey="ants" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 8, fontWeight: 'bold', fontFamily: 'inherit' }} />
            </Bar>
            <Bar dataKey="others" name="อื่นๆ" fill={INSECT_CHART_COLORS.others} isAnimationActive={false}>
              <LabelList dataKey="others" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 8, fontWeight: 'bold', fontFamily: 'inherit' }} />
            </Bar>
          </BarChart>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ margin: '0' }}>
            <div style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: '#f8fafc', color: '#334155' }}>
              <p style={{ lineHeight: '1.4', margin: 0, fontSize: '15px' }}>{parseInlineStylesPrint(reportText)}</p>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#475569' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>ผู้จัดทำ (QA Staff)</p>
              <p style={{ marginBottom: '4px' }}>ลงชื่อ..................................................</p>
              <p style={{ marginBottom: '4px' }}>(..................................................)</p>
              <p>วันที่......./......./.......</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#475569' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>หัวหน้าแผนก (Department Head)</p>
              {deptApproved ? (
                <>
                  <p style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '2px' }}>✓ {deptApproverName ? deptApproverName.split(' — ')[0].split(' - ')[0].trim() : ''}</p>
                  <p style={{ color: '#64748b', fontSize: '8px', marginBottom: '2px' }}>(ระบบบันทึกรับทราบข้อมูลแล้ว)</p>
                  <p>วันที่ {deptApprovedAt}</p>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: '4px' }}>ลงชื่อ..................................................</p>
                  <p style={{ marginBottom: '4px' }}>(..................................................)</p>
                  <p>วันที่......./......./.......</p>
                </>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#475569' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>หัวหน้าฝ่ายประกันคุณภาพ (QA Head)</p>
              {qaApproved ? (
                <>
                  <p style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '2px' }}>✓ {qaApproverName ? qaApproverName.split(' — ')[0].split(' - ')[0].trim() : ''}</p>
                  <p style={{ color: '#64748b', fontSize: '8px', marginBottom: '2px' }}>(ระบบบันทึกรับทราบข้อมูลแล้ว)</p>
                  <p>วันที่ {qaApprovedAt}</p>
                </>
              ) : (
                <>
                  <p style={{ marginBottom: '4px' }}>ลงชื่อ..................................................</p>
                  <p style={{ marginBottom: '4px' }}>(..................................................)</p>
                  <p>วันที่......./......./.......</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuarterlyPrintPages = (dept) => {
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `quarterly_approval_${dept}_${selectedQuarter}_${beYear}`;
    let isApproved = false;
    let approverName = '';
    let approvedAt = '';

    if (typeof window !== 'undefined') {
      if (isDemo && dept === 'โรงฆ่า' && selectedQuarter === 'Q1' && beYear === 2569) {
        isApproved = true;
        approverName = 'แอดมิน สูงสุด — Admin';
        approvedAt = '22 มีนาคม 2569 14:30';
      } else {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            isApproved = parsed.approved || false;
            approverName = parsed.approverName || '';
            approvedAt = parsed.approvedAt || '';
          } catch {}
        }
      }
    }

    const deptTraps = DEPT_TRAPS_MAPPING[dept] || [];
    const chunkedTraps = [];
    for (let i = 0; i < deptTraps.length; i += 2) {
      chunkedTraps.push(deptTraps.slice(i, i + 2));
    }

    const quarterMonthsText = {
      'Q1': 'มกราคม - มีนาคม',
      'Q2': 'เมษายน - มิถุนายน',
      'Q3': 'กรกฎาคม - กันยายน',
      'Q4': 'ตุลาคม - ธันวาคม',
      'ALL': 'มกราคม - ธันวาคม'
    }[selectedQuarter] || '';

    return chunkedTraps.map((chunk, pageIdx) => (
      <div 
        key={`${dept}_page_${pageIdx}`} 
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '8mm 15mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontSize: '10px', color: '#64748b' }}>
          <span style={{ fontWeight: 'bold' }}>บริษัท พี.เอส.ฟู้ดโปรดักส์ จำกัด</span>
          <span>เอกสารควบคุมภายใน</span>
        </div>

        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <h1 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>รายงานสถิติวิเคราะห์แนวโน้มแมลง จากเครื่องดักแมลงประจำไตรมาส</h1>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginTop: '2px' }}>
            แผนก {dept} · ประจำไตรมาสที่ {selectedQuarter === 'ALL' ? '1' : selectedQuarter.replace('Q','')} ({quarterMonthsText}) ปี {getDisplayYear(selectedYear)} · หน้าที่ {pageIdx + 1}/{chunkedTraps.length}
          </h2>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', minHeight: '440px', maxHeight: '480px' }}>
          {chunk.map((trap) => {
            const trapData = getTrapTrendData(trap, selectedQuarter, selectedYear);
            const trapAnalysis = getTrapAnalysis(trap, selectedQuarter === 'ALL' ? 'Q1' : selectedQuarter, selectedYear);
            
            return (
              <div 
                key={trap} 
                style={{ 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '16px', 
                  padding: '10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px', textAlign: 'center' }}>
                    เครื่องดักแมลงหมายเลข {trap.replace(/^\((\d+)\)\s*/, '$1 ')}
                  </h3>
                </div>
                
                <div style={{ height: '270px', width: '100%', fontSize: '8px' }}>
                  <LineChart width={477} height={250} data={trapData} margin={{ top: 18, right: 5, left: 25, bottom: 0 }} style={{ overflow: 'visible' }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={8} tickLine={false} tickCount={5} allowDecimals={false} domain={[0, 'auto']}
                      label={{ value: 'จำนวนแมลง (ตัว)', angle: -90, position: 'insideLeft', dx: -22, style: { fontSize: 10.5, fontWeight: 'bold', fill: '#000000', textAnchor: 'middle' } }}
                    />
                    <Legend content={<RenderCustomLegend />} wrapperStyle={{ bottom: 0, left: 0, width: '100%' }} />
                    <Line type="monotone" dataKey="flies" name="แมลงวัน" stroke={INSECT_CHART_COLORS.flies} strokeWidth={1.5} dot={{ r: 3, fill: INSECT_CHART_COLORS.flies }} isAnimationActive={false}>
                      <LabelList dataKey="flies" position="top" formatter={(v) => (v === 0 ? '0' : v)} style={{ fill: INSECT_CHART_COLORS.flies, fontSize: 7, fontWeight: 'bold', fontFamily: 'inherit' }} />
                    </Line>
                    <Line type="monotone" dataKey="mosquitoes" name="ยุง" stroke={INSECT_CHART_COLORS.mosquitoes} strokeWidth={1.5} dot={{ r: 3, fill: INSECT_CHART_COLORS.mosquitoes }} isAnimationActive={false}>
                      <LabelList dataKey="mosquitoes" position="top" formatter={(v) => (v === 0 ? '0' : v)} style={{ fill: INSECT_CHART_COLORS.mosquitoes, fontSize: 7, fontWeight: 'bold', fontFamily: 'inherit' }} />
                    </Line>
                    <Line type="monotone" dataKey="ants" name="มด" stroke={INSECT_CHART_COLORS.ants} strokeWidth={1.5} dot={{ r: 3, fill: INSECT_CHART_COLORS.ants }} isAnimationActive={false}>
                      <LabelList dataKey="ants" position="top" formatter={(v) => (v === 0 ? '0' : v)} style={{ fill: INSECT_CHART_COLORS.ants, fontSize: 7, fontWeight: 'bold', fontFamily: 'inherit' }} />
                    </Line>
                    <Line type="monotone" dataKey="others" name="แมลงอื่นๆ" stroke={INSECT_CHART_COLORS.others} strokeWidth={1.5} dot={{ r: 3, fill: INSECT_CHART_COLORS.others }} isAnimationActive={false}>
                      <LabelList dataKey="others" position="top" formatter={(v) => (v === 0 ? '0' : v)} style={{ fill: INSECT_CHART_COLORS.others, fontSize: 7, fontWeight: 'bold', fontFamily: 'inherit' }} />
                    </Line>
                  </LineChart>
                </div>
                
                <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', color: '#475569', lineHeight: '1.4', overflow: 'hidden' }}>
                  <strong>วิเคราะห์ความเสี่ยง:</strong> {trapAnalysis.replace(/###.*\n/g, '').replace(/\*/g, '').trim()}
                </div>
              </div>
            );
          })}
          
          {chunk.length === 1 && (
            <div></div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#475569' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>จัดทำโดย</p>
            <p style={{ marginBottom: '4px' }}>ลงชื่อ..................................................</p>
            <p style={{ marginBottom: '4px' }}>(..................................................)</p>
            <p>วันที่......./......./.......</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', color: '#475569' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>รับทราบโดย</p>
            {isApproved ? (
              <>
                <p style={{ fontWeight: 'bold', color: '#10b981', marginBottom: '2px' }}>✓ {approverName ? approverName.split(' — ')[0].split(' - ')[0].trim() : ''}</p>
                <p style={{ color: '#64748b', fontSize: '8px', marginBottom: '2px' }}>(ระบบบันทึกอนุมัติรับทราบแล้ว)</p>
                <p>วันที่ {approvedAt}</p>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '4px' }}>ลงชื่อ..................................................</p>
                <p style={{ marginBottom: '4px' }}>(..................................................)</p>
                <p>วันที่......./......./.......</p>
              </>
            )}
          </div>
        </div>
      </div>
    ));
  };


  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  // Sync Month Filter when switching tabs
  useEffect(() => {
    if (activeTab === 'department' && selectedMonth === 'ALL') {
      setSelectedMonth('มกราคม');
    }
  }, [activeTab, selectedMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inspection');
      const result = await response.json();
      if (response.ok) {
        setRawData(result.data || []);
        setIsDemo(result.isDemo || false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableYears = () => {
    if (isDemo || rawData.length === 0) {
      return ['2026', '2025'];
    }
    const yearsSet = new Set();
    rawData.forEach(r => {
      if (r.inspected_at) {
        const y = new Date(r.inspected_at).getFullYear();
        if (!isNaN(y)) {
          yearsSet.add(String(y));
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  };

  const getAvailableMonths = (year) => {
    const monthsOrder = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    if (isDemo || rawData.length === 0) {
      return monthsOrder;
    }
    const monthsSet = new Set();
    rawData.forEach(r => {
      const d = new Date(r.inspected_at);
      if (r.inspected_at && d.getFullYear() === parseInt(year, 10)) {
        const monthName = monthsOrder[d.getMonth()];
        if (monthName) {
          monthsSet.add(monthName);
        }
      }
    });
    return monthsOrder.filter(m => monthsSet.has(m));
  };

  useEffect(() => {
    if (rawData.length > 0 && !isDemo) {
      const years = getAvailableYears();
      let yearToSet = selectedYear;
      if (years.length > 0 && !years.includes(selectedYear)) {
        yearToSet = years[0];
        setSelectedYear(yearToSet);
      }
      
      const months = getAvailableMonths(yearToSet);
      if (months.length > 0) {
        if (selectedMonth !== 'ALL' && !months.includes(selectedMonth)) {
          setSelectedMonth(months[0]);
        }
      }
    }
  }, [rawData, isDemo]);

  useEffect(() => {
    if (rawData.length > 0 && !isDemo) {
      const months = getAvailableMonths(selectedYear);
      if (months.length > 0) {
        if (selectedMonth !== 'ALL' && !months.includes(selectedMonth)) {
          setSelectedMonth(months[0]);
        }
      }
    }
  }, [selectedYear]);

  const getThaiMonthName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return months[date.getMonth()];
  };

  const getDisplayYear = (yearAd) => {
    return String(parseInt(yearAd, 10) + 543);
  };

  // --- DEMO DATA GENERATOR ---
  const generateMockDataFiltered = (year, quarter, month) => {
    const data = [];
    const insects = ['Flies (แมลงวัน)', 'Mosquitoes (ยุง)', 'Ants (มด)', 'Others (แมลงอื่นๆ)'];
    
    let monthsToGenerate = Array.from({ length: 12 }, (_, i) => i); // 0 to 11
    
    if (month !== 'ALL') {
      const monthMap = { 
        'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3, 
        'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7, 
        'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11 
      };
      monthsToGenerate = [monthMap[month] !== undefined ? monthMap[month] : 5];
    } else if (quarter !== 'ALL') {
      if (quarter === 'Q1') monthsToGenerate = [0, 1, 2];
      if (quarter === 'Q2') monthsToGenerate = [3, 4, 5];
      if (quarter === 'Q3') monthsToGenerate = [6, 7, 8];
      if (quarter === 'Q4') monthsToGenerate = [9, 10, 11];
    }
    
    const yearNum = parseInt(year, 10);
    
    monthsToGenerate.forEach((mIdx) => {
      const dateString = `${yearNum}-${String(mIdx + 1).padStart(2, '0')}-15`;
      
      DEPTS_LIST.forEach((dept) => {
        insects.forEach((insect) => {
          let base = 3;
          
          if (mIdx === 5 && dept === 'หน้าร้านใหม่' && insect.includes('Flies')) {
            base = 35; // June flies spike at หน้าร้านใหม่
          } else if (dept === 'โรงฆ่า' && insect.includes('Flies')) {
            base = 9;
          } else if (dept === 'หมูบด' && insect.includes('Ants')) {
            base = 12;
          } else if (dept === 'Slice ผลิต' && insect.includes('Mosquitoes')) {
            base = 7;
          }
          
          const seed = mIdx + dept.length + insect.length + yearNum;
          const randomFactor = (seed % 5) - 2;
          const count = Math.max(0, base + randomFactor);
          
          data.push({
            inspected_at: dateString,
            area: `${dept}: (00) ตำแหน่งจุดดัก`,
            insect_type: insect,
            count: count
          });
        });
      });
    });
    
    return data;
  };

  // --- FILTERED ACTIVE DATASET ---
  const getFilteredData = () => {
    if (isDemo || approvedRawData.length === 0) {
      return generateMockDataFiltered(selectedYear, selectedQuarter, selectedMonth);
    }
    
    return approvedRawData.filter(item => {
      const date = new Date(item.inspected_at);
      const itemYear = String(date.getFullYear());
      
      if (itemYear !== selectedYear) return false;
      
      if (selectedMonth !== 'ALL') {
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const itemMonthName = months[date.getMonth()];
        if (itemMonthName !== selectedMonth) return false;
      }
      
      if (selectedQuarter !== 'ALL') {
        const monthIdx = date.getMonth();
        let itemQuarter = '';
        if (monthIdx >= 0 && monthIdx <= 2) itemQuarter = 'Q1';
        else if (monthIdx >= 3 && monthIdx <= 5) itemQuarter = 'Q2';
        else if (monthIdx >= 6 && monthIdx <= 8) itemQuarter = 'Q3';
        else itemQuarter = 'Q4';
        
        if (itemQuarter !== selectedQuarter) return false;
      }
      
      return true;
    });
  };

  const activeData = getFilteredData();

  // --- TAB 1: FACTORY OVERVIEW DATA PROCESSING ---
  const processFactoryOverviewData = () => {
    const monthlyGroups = {};
    const insectKeyMap = {
      'Flies (แมลงวัน)': 'flies',
      'Mosquitoes (ยุง)': 'mosquitoes',
      'Ants (มด)': 'ants',
      'Others (แมลงอื่นๆ)': 'others'
    };

    activeData.forEach((item) => {
      const date = new Date(item.inspected_at);
      const yearMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${getThaiMonthName(item.inspected_at)} ${String(date.getFullYear()).substring(2)}`;

      if (!monthlyGroups[yearMonthKey]) {
        monthlyGroups[yearMonthKey] = {
          key: yearMonthKey,
          name: monthLabel,
          flies: 0,
          mosquitoes: 0,
          ants: 0,
          others: 0,
          othersBreakdown: {},
          total: 0
        };
      }

      const dbKey = item.insect_type;
      const dataKey = insectKeyMap[dbKey] || 'others';
      const count = Number(item.count) || 0;
      
      monthlyGroups[yearMonthKey][dataKey] += count;
      monthlyGroups[yearMonthKey].total += count;

      if (dataKey === 'others') {
        let detailsList = [];
        if (item.details) {
          try {
            detailsList = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
          } catch (e) {
            console.error('Failed to parse details:', e);
          }
        }
        if (Array.isArray(detailsList)) {
          detailsList.forEach(det => {
            const name = det.name || 'ไม่ระบุ';
            const countVal = Number(det.count) || 0;
            if (!monthlyGroups[yearMonthKey].othersBreakdown[name]) {
              monthlyGroups[yearMonthKey].othersBreakdown[name] = 0;
            }
            monthlyGroups[yearMonthKey].othersBreakdown[name] += countVal;
          });
        }
      }
    });

    return Object.values(monthlyGroups).sort((a, b) => a.key.localeCompare(b.key));
  };

  const factoryOverviewData = processFactoryOverviewData();

  // --- DYNAMIC KPI COMPUTATIONS ---
  const totalInsects = activeData.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

  const getCriticalDept = () => {
    const deptMap = {};
    DEPTS_LIST.forEach(d => { deptMap[d] = 0; });
    activeData.forEach(item => {
      const { dept } = parseArea(item.area);
      if (deptMap[dept] !== undefined) {
        deptMap[dept] += Number(item.count) || 0;
      }
    });
    let maxDept = 'ล้างตะกร้า';
    let maxCount = -1;
    Object.entries(deptMap).forEach(([d, c]) => {
      if (c > maxCount) {
        maxCount = c;
        maxDept = d;
      }
    });
    return { name: maxDept, count: maxCount };
  };
  const criticalDept = getCriticalDept();

  const getMostCommonInsect = () => {
    const typeMap = {
      'Flies (แมลงวัน)': 0,
      'Mosquitoes (ยุง)': 0,
      'Ants (มด)': 0,
      'Others (แมลงอื่นๆ)': 0
    };
    activeData.forEach(item => {
      if (typeMap[item.insect_type] !== undefined) {
        typeMap[item.insect_type] += Number(item.count) || 0;
      }
    });
    let maxType = 'Flies (แมลงวัน)';
    let maxCount = -1;
    Object.entries(typeMap).forEach(([t, c]) => {
      if (c > maxCount) {
        maxCount = c;
        maxType = t;
      }
    });
    
    const insectThaiNames = {
      'Flies (แมลงวัน)': 'แมลงวัน',
      'Mosquitoes (ยุง)': 'ยุง',
      'Ants (มด)': 'มด',
      'Others (แมลงอื่นๆ)': 'แมลงอื่นๆ'
    };
    return { name: insectThaiNames[maxType] || 'แมลงวัน', count: maxCount };
  };
  const mostCommonInsect = getMostCommonInsect();

  // --- TAB 2: DETAILED DEPARTMENT COMPARISON DATA ---
  const getDepartmentDetailedData = (deptName, month, year) => {
    if (isDemo || rawData.length === 0) {
      const traps = DEPT_TRAPS_MAPPING[deptName] || [];
      
      // Exact mock values from image_cbb746.png for "โรงฆ่า" in "มกราคม" BE 2569
      if (deptName === 'โรงฆ่า' && month === 'มกราคม') {
        const exactValues = {
          '(07) ลานโหลดสินค้าหน้าร้าน': { flies: 57, mosquitoes: 9, ants: 12, others: 0 },
          '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน': { flies: 3, mosquitoes: 6, ants: 0, others: 17 },
          '(09) ทางเข้าฝ่ายซาก/เครื่องในแดง/เครื่องในขาว': { flies: 2, mosquitoes: 3, ants: 12, others: 46 },
          '(10) ลานโหลดสินค้าห้องเลือด': { flies: 30, mosquitoes: 735, ants: 8, others: 67 },
          '(11) ห้องเลือด': { flies: 27, mosquitoes: 129, ants: 0, others: 81 },
          '(12) ห้องช็อต/แทงคอ/ลวกซาก': { flies: 22, mosquitoes: 43, ants: 37, others: 198 },
          '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน': { flies: 3, mosquitoes: 5, ants: 0, others: 14 }
        };

        return traps.map(trap => {
          const label = trap;
          const vals = exactValues[trap] || { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
          return {
            name: label,
            flies: vals.flies,
            mosquitoes: vals.mosquitoes,
            ants: vals.ants,
            others: vals.others,
            othersBreakdown: vals.others > 0 ? { 'ผีเสื้อ': Math.max(1, Math.floor(vals.others / 2)), 'แมลงสาบ': Math.max(0, Math.ceil(vals.others / 2)) } : {}
          };
        });
      }

      // General mock data generator for other selections
      return traps.map((trap, idx) => {
        const label = trap;
        
        const seed = idx + deptName.length + month.length + parseInt(year, 10);
        const flies = Math.max(0, (seed % 5 === 0 ? 35 : 3) + (seed % 3) * 3);
        const mosquitoes = Math.max(0, (seed % 7 === 0 ? 60 : 4) + (seed % 4) * 4);
        const ants = Math.max(0, (seed % 6 === 0 ? 15 : 1) + (seed % 2) * 2);
        const others = Math.max(0, (seed % 8 === 0 ? 40 : 2) + (seed % 5) * 5);

        return {
          name: label,
          flies,
          mosquitoes,
          ants,
          others,
          othersBreakdown: others > 0 ? { 'ผีเสื้อ': Math.max(1, Math.floor(others / 2)), 'แมลงสาบ': Math.max(0, Math.ceil(others / 2)) } : {}
        };
      });
    }

    // Real database data aggregation
    const traps = DEPT_TRAPS_MAPPING[deptName] || [];
    return traps.map(trap => {
      const label = trap;

      const totals = { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
      const othersBreakdown = {};
      
      rawData.forEach(item => {
        const date = new Date(item.inspected_at);
        const itemYear = String(date.getFullYear());
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const itemMonthName = months[date.getMonth()];
        
        if (itemYear === year && itemMonthName === month && item.area && item.area.includes(trap)) {
          const type = item.insect_type;
          const count = Number(item.count) || 0;
          if (type.includes('Flies')) totals.flies += count;
          else if (type.includes('Mosquitoes')) totals.mosquitoes += count;
          else if (type.includes('Ants')) totals.ants += count;
          else {
            totals.others += count;
            let detailsList = [];
            if (item.details) {
              try {
                detailsList = typeof item.details === 'string' ? JSON.parse(item.details) : item.details;
              } catch (e) {
                console.error('Failed to parse details:', e);
              }
            }
            if (Array.isArray(detailsList)) {
              detailsList.forEach(det => {
                const name = det.name || 'ไม่ระบุ';
                const countVal = Number(det.count) || 0;
                if (!othersBreakdown[name]) {
                  othersBreakdown[name] = 0;
                }
                othersBreakdown[name] += countVal;
              });
            }
          }
        }
      });

      return {
        name: label,
        flies: totals.flies,
        mosquitoes: totals.mosquitoes,
        ants: totals.ants,
        others: totals.others,
        othersBreakdown
      };
    });
  };

  const getDeptAnalysisReport = (deptName, month, yearBe) => {
    const yearText = `${yearBe}`;
    const chartData = getDepartmentDetailedData(deptName, month, selectedYear);
    if (!chartData || chartData.length === 0) {
      return `จากการตรวจนับจำนวนแมลง ของทีม **${deptName}** ประจำเดือน ${month} ${yearText} ไม่พบข้อมูลสถิติในระบบ`;
    }
    
    let totalFlies = 0, totalMosquitoes = 0, totalAnts = 0, totalOthers = 0;
    const othersBreakdown = {};
    chartData.forEach(item => {
      totalFlies += Number(item.flies) || 0;
      totalMosquitoes += Number(item.mosquitoes) || 0;
      totalAnts += Number(item.ants) || 0;
      totalOthers += Number(item.others) || 0;
      if (item.othersBreakdown) {
        Object.entries(item.othersBreakdown).forEach(([k, v]) => {
          othersBreakdown[k] = (othersBreakdown[k] || 0) + v;
        });
      }
    });

    const cleanTrap = (name) => {
      if (!name) return '-';
      return name.replace(/.*:\s*/, '');
    };

    let insectSummary = '';

    if (chartData.length === 1) {
      // Single trap department
      const singleItem = chartData[0];
      const trapName = cleanTrap(singleItem.name);
      const fCount = Number(singleItem.flies) || 0;
      const mCount = Number(singleItem.mosquitoes) || 0;
      const aCount = Number(singleItem.ants) || 0;
      const oCount = Number(singleItem.others) || 0;
      
      insectSummary = `เครื่องดักแมลงหมายเลข ${trapName} ตรวจพบ **แมลงวัน** จำนวน ${fCount} ตัว, **ยุง** จำนวน ${mCount} ตัว, **มด** จำนวน ${aCount} ตัว และ **แมลงอื่นๆ** จำนวน ${oCount} ตัว`;
    } else {
      // Multiple traps department
      let maxFliesVal = -1, maxFliesTrap = '';
      let maxMosquitoesVal = -1, maxMosquitoesTrap = '';
      let maxAntsVal = -1, maxAntsTrap = '';
      let maxOthersVal = -1, maxOthersTrap = '';

      chartData.forEach(item => {
        const flies = Number(item.flies) || 0;
        const mosquitoes = Number(item.mosquitoes) || 0;
        const ants = Number(item.ants) || 0;
        const others = Number(item.others) || 0;

        if (flies > maxFliesVal) { maxFliesVal = flies; maxFliesTrap = item.name; }
        if (mosquitoes > maxMosquitoesVal) { maxMosquitoesVal = mosquitoes; maxMosquitoesTrap = item.name; }
        if (ants > maxAntsVal) { maxAntsVal = ants; maxAntsTrap = item.name; }
        if (others > maxOthersVal) { maxOthersVal = others; maxOthersTrap = item.name; }
      });

      const trapF = cleanTrap(maxFliesTrap);
      const trapM = cleanTrap(maxMosquitoesTrap);
      const trapA = cleanTrap(maxAntsTrap);
      const trapO = cleanTrap(maxOthersTrap);

      if (maxFliesVal > 0) {
        insectSummary += `เครื่องดักแมลงหมายเลข ${trapF} พบ **แมลงวัน** ติดมากที่สุด จำนวน ${maxFliesVal} ตัว `;
      } else {
        insectSummary += `ไม่พบ **แมลงวัน** ในเครื่องดักแมลงใดๆ ในแผนกนี้ `;
      }

      if (maxMosquitoesVal > 0) {
        insectSummary += `เครื่องดักแมลงหมายเลข ${trapM} พบ **ยุง** ติดมากที่สุด จำนวน ${maxMosquitoesVal} ตัว `;
      } else {
        insectSummary += `ไม่พบ **ยุง** ในเครื่องดักแมลงใดๆ ในแผนกนี้ `;
      }

      if (maxAntsVal > 0 || maxOthersVal > 0) {
        const parts = [];
        if (maxAntsVal > 0) parts.push(`**มด** ในเครื่องดักหมายเลข ${trapA} จำนวน ${maxAntsVal} ตัว`);
        if (maxOthersVal > 0) parts.push(`**แมลงอื่นๆ** ในเครื่องดักหมายเลข ${trapO} จำนวน ${maxOthersVal} ตัว`);
        insectSummary += `และตรวจพบ ${parts.join(' และ')} ติดสะสมนำโดดเด่นตามลำดับ`;
      } else {
        insectSummary += `และไม่พบ **มด** หรือ **แมลงอื่นๆ** ติดสะสม`;
      }
    }
    
    // 1. Root Cause based on Trap numbers and department
    let rootCause = '';
    const trapCauses = [];
    chartData.forEach(item => {
      const match = item.name.match(/\d+/);
      const numStr = match ? parseInt(match[0], 10).toString() : '';
      if (numStr === '10') trapCauses.push('เนื่องจากติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิดปิด ประตูเป็นประจำ');
      else if (numStr === '12') trapCauses.push('เนื่องจากเชื่อมต่อกับคอกพักสุกร');
      else if (['17', '20', '21'].includes(numStr)) {
        if (!trapCauses.some(c => c.includes('ทางเข้า-ออกของพนักงาน'))) {
          trapCauses.push('อาจเนื่องจากเป็นทางเข้า-ออกของพนักงาน เชื่อมต่อกับนอกพื้นที่การผลิตเป็นโถงทางเดิน และห้องแต่งตัว ซึ่งอาจทำให้มีแมลงบินเข้าพื้นที่ได้');
        }
      }
      else if (numStr === '28') trapCauses.push('อาจเนื่องจากบริเวณดังกล่าวเชื่อมต่อกับนอกพื้นที่การผลิต ใกล้กับประตูทางเข้า-ออก พื้นที่การผลิต อาจทำให้แมลงบินเข้าสู่พื้นที่การผลิตได้');
      else if (numStr === '1') trapCauses.push('เนื่องจากติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ');
    });

    if (trapCauses.length > 0) {
      rootCause = trapCauses.join(' ');
    } else {
      // Fallback to department default root cause
      if (deptName === 'โรงฆ่า') {
        rootCause = `เนื่องจากบริเวณผลิตโรงฆ่าเป็นทางผ่านและปฏิบัติงานสัญจรบ่อยครั้ง ทำให้เสี่ยงต่อการเปิดประตูทิ้งไว้`;
      } else if (deptName === 'หน้าร้านใหม่') {
        rootCause = `เนื่องจากมีประตูเปิด-ปิดบ่อยรับสินค้าจากภายนอก— เสี่ยงแมลงจากภายนอก`;
      } else if (deptName === 'ตัดแต่ง') {
        rootCause = `เนื่องจากการสัญจรผ่านประตูเข้าออกของพนักงานอย่างต่อเนื่อง`;
      } else if (deptName === 'โหลด' || deptName === 'เฟส 6' || deptName === 'โหลด เฟส 5') {
        rootCause = `เนื่องจากติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ`;
      } else {
        rootCause = `เนื่องจากการสัญจรผ่านประตูเข้าออกของพนักงานและวัตถุดิบเป็นระยะ`;
      }
    }
    
    // 2. Insect recommendations (Select only the most relevant, non-redundant recommendation to avoid duplication and keep original length)
    let rec = '';
    if (totalFlies > 0) {
      rec = 'ทำความสะอาดพื้นที่ลดการสะสมของแหล่งอาหาร';
    } else if (totalMosquitoes > 0) {
      rec = 'รีดน้ำขังออกจากพื้นที่แจ้งบริษัทกำจัดแมลงเข้าทำบริการ';
    } else if (totalAnts > 0) {
      rec = 'ตรวจสอบหาสาเหตุที่แท้จริงลดการสะสมของแหล่งอาหาร';
    } else if (totalOthers > 0) {
      let hasMidge = false;
      Object.keys(othersBreakdown).forEach(k => {
        if (k.includes('แมลงหวี่')) hasMidge = true;
      });
      if (hasMidge) {
        rec = 'รีดน้ำขังออกจากพื้นที่';
      }
    }

    // 3. Goal Phrase closing logic
    const zeroInsects = [];
    const positiveInsects = [];
    
    if (totalFlies === 0) zeroInsects.push('**แมลงวัน**'); else positiveInsects.push('**แมลงวัน**');
    if (totalMosquitoes === 0) zeroInsects.push('**ยุง**'); else positiveInsects.push('**ยุง**');
    if (totalAnts === 0) zeroInsects.push('**มด**'); else positiveInsects.push('**มด**');
    if (totalOthers === 0) zeroInsects.push('**แมลงอื่นๆ**'); else positiveInsects.push('**แมลงอื่นๆ**');
    
    let goalPhrase = '';
    if (zeroInsects.length > 0 && positiveInsects.length > 0) {
      goalPhrase = `เพื่อรักษาและคงจำนวนสถิติของ ${zeroInsects.join(', ')} ให้เป็น 0 ตัวต่อไป และเพื่อลดจำนวนของ ${positiveInsects.join(', ')} ในพื้นที่ปฏิบัติงาน`;
    } else if (zeroInsects.length > 0) {
      goalPhrase = `เพื่อรักษาและคงจำนวนสถิติของ ${zeroInsects.join(', ')} ให้เป็น 0 ตัวต่อไป`;
    } else if (positiveInsects.length > 0) {
      goalPhrase = `เพื่อลดจำนวนของ ${positiveInsects.join(', ')} ในพื้นที่ปฏิบัติงาน`;
    }

    // Combine recommendations
    let recsText = '';
    let keyKeyword = 'ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้';
    
    if (deptName === 'หน้าร้านใหม่') {
      keyKeyword = 'ดังนั้นจึงควรตรวจม่าน ปิดม่านพลาสติกทุกครั้ง';
    } else if (deptName === 'ตัดแต่ง') {
      keyKeyword = 'ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน';
    } else if (deptName === 'โหลด' || deptName === 'เฟส 6' || deptName === 'โหลด เฟส 5') {
      keyKeyword = 'ดังนั้นจึงควรระมัดระวังปิดม่านและประตูทุกครั้ง';
    }
    
    if (rec) {
      recsText = `${keyKeyword} และควร${rec} ทั้งนี้ ${goalPhrase}อย่างมีประสิทธิภาพสูงสุด`;
    } else {
      recsText = `${keyKeyword} ทั้งนี้ ${goalPhrase}อย่างมีประสิทธิภาพสูงสุด`;
    }
    
    return `จากการตรวจนับจำนวนแมลง ของทีม **${deptName}** ประจำเดือน ${month} ${yearText} พบว่า ${insectSummary} ${rootCause} ${recsText}`;
  };


  // --- TAB 3: TRAP TREND LINE CHART (ignores Tab 1 Month Selector) ---
  const getDeviceFilteredData = () => {
    if (isDemo || approvedRawData.length === 0) {
      return generateMockDataFiltered(selectedYear, selectedQuarter, 'ALL');
    }
    
    return approvedRawData.filter(item => {
      const date = new Date(item.inspected_at);
      const itemYear = String(date.getFullYear());
      
      if (itemYear !== selectedYear) return false;
      
      if (selectedQuarter !== 'ALL') {
        const monthIdx = date.getMonth();
        let itemQuarter = '';
        if (monthIdx >= 0 && monthIdx <= 2) itemQuarter = 'Q1';
        else if (monthIdx >= 3 && monthIdx <= 5) itemQuarter = 'Q2';
        else if (monthIdx >= 6 && monthIdx <= 8) itemQuarter = 'Q3';
        else itemQuarter = 'Q4';
        
        if (itemQuarter !== selectedQuarter) return false;
      }
      
      return true;
    });
  };

  const processTrapTrendData = () => {
    const q = selectedQuarter;
    let monthsInfo = [];
    
    const monthsThaiMap = [
      { name: 'ม.ค.', index: 0 },
      { name: 'ก.พ.', index: 1 },
      { name: 'มี.ค.', index: 2 },
      { name: 'เม.ย.', index: 3 },
      { name: 'พ.ค.', index: 4 },
      { name: 'มิ.ย.', index: 5 },
      { name: 'ก.ค.', index: 6 },
      { name: 'ส.ค.', index: 7 },
      { name: 'ก.ย.', index: 8 },
      { name: 'ต.ค.', index: 9 },
      { name: 'พ.ย.', index: 10 },
      { name: 'ธ.ค.', index: 11 }
    ];

    if (q === 'Q1') {
      monthsInfo = monthsThaiMap.slice(0, 3);
    } else if (q === 'Q2') {
      monthsInfo = monthsThaiMap.slice(3, 6);
    } else if (q === 'Q3') {
      monthsInfo = monthsThaiMap.slice(6, 9);
    } else if (q === 'Q4') {
      monthsInfo = monthsThaiMap.slice(9, 12);
    } else {
      monthsInfo = monthsThaiMap;
    }

    if (isDemo || rawData.length === 0) {
      const match = selectedTrap.match(/\((\d+)\)/);
      const trapNo = parseInt(match ? match[1] : '7', 10);
      
      return monthsInfo.map((m, idx) => {
        const baseFlies = (trapNo === 7 ? 14 : trapNo % 3 === 0 ? 5 : 2) + (idx * 3);
        const baseMosquitoes = (trapNo === 22 ? 9 : trapNo % 4 === 0 ? 4 : 1) + (idx * 1.5);
        const baseAnts = (trapNo === 17 ? 18 : trapNo % 5 === 0 ? 8 : 2) - (idx * 2);
        const baseOthers = (trapNo % 2 === 0 ? 2 : 1) + (idx * 0.5);
        
        const r1 = Math.floor(Math.sin(idx + trapNo) * 2);
        const r2 = Math.floor(Math.cos(idx * 2 + trapNo) * 2);

        return {
          name: m.name,
          flies: Math.max(0, Math.round(baseFlies + r1)),
          mosquitoes: Math.max(0, Math.round(baseMosquitoes + r2)),
          ants: Math.max(0, Math.round(baseAnts - r1)),
          others: Math.max(0, Math.round(baseOthers))
        };
      });
    }

    const deviceData = getDeviceFilteredData();
    const trapRecords = deviceData.filter(item => item.area && item.area.includes(selectedTrap));

    return monthsInfo.map((m) => {
      const totals = { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
      
      trapRecords.forEach(item => {
        const date = new Date(item.inspected_at);
        if (date.getMonth() === m.index) {
          const type = item.insect_type;
          const count = Number(item.count) || 0;
          if (type.includes('Flies')) totals.flies += count;
          else if (type.includes('Mosquitoes')) totals.mosquitoes += count;
          else if (type.includes('Ants')) totals.ants += count;
          else totals.others += count;
        }
      });

      return {
        name: m.name,
        flies: totals.flies,
        mosquitoes: totals.mosquitoes,
        ants: totals.ants,
        others: totals.others
      };
    });
  };

  const trapTrendData = processTrapTrendData();

  // --- INTERACTIVE MOCK RISK ANALYSIS (TAB 3) ---
  const getTrapAnalysis = (trapName, quarter, year) => {
    if (!trapName) return '';
    const q = quarter === 'ALL' ? 'Q1' : quarter;
    const match = trapName.match(/\((\d+)\)/);
    const trapNo = match ? match[1] : '';
    const locationName = trapName.replace(/^\(\d+\)\s*/, '').trim();

    const quarterMonthsText = {
      'Q1': 'มกราคม - มีนาคม',
      'Q2': 'เมษายน - มิถุนายน',
      'Q3': 'กรกฎาคม - กันยายน',
      'Q4': 'ตุลาคม - ธันวาคม',
      'ALL': 'มกราคม - ธันวาคม'
    }[q] || 'มกราคม - มีนาคม';

    const qNum = q === 'ALL' ? '1' : q.replace('Q', '');
    const beYear = parseInt(year, 10) + 543;
    const intro = `จากกราฟแสดงแนวโน้มจำนวนแมลงของเครื่องดักแมลง หมายเลข ${trapNo} (${locationName}) ประจำเดือน ${quarterMonthsText} ${beYear} (ไตรมาส ${qNum}/${beYear})`;

    if (trapNo === '07') {
      return `${intro} จำนวนแมลงวันที่พบมีแนวโน้มจำนวนเพิ่มสูงขึ้นในเดือนกุมภาพันธ์ และลดลงในเดือนมีนาคม ยุงที่พบมีจำนวนลดลงในเดือนกุมภาพันธ์ และเพิ่มขึ้นเล็กน้อยในเดือนมีนาคม และพบแมลงอื่นๆ มีแนวโน้มที่เพิ่มสูงขึ้นอย่างต่อเนื่อง ส่วนมด ไม่พบในเดือนกุมภาพันธ์และมีนาคม เนื่องจากบริเวณดังกล่าวเป็นลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูลานโหลดเป็นประจำ ดังนั้นควรทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอเพื่อลดการสะสมของ ของเสีย และเน้นปิดม่านและประตูทุกครั้งภายหลังจากการใช้งานเพื่อป้องกันไม่ให้แมลงบินต่างๆ เข้าสู่พื้นที่การผลิตได้`;
    }

    if (trapNo === '08') {
      return `${intro} จำนวนแมลงวันที่พบมีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่องตลอดไตรมาส โดยเฉพาะในเดือนสุดท้ายของไตรมาส แมลงอื่นๆ พบในระดับสูงและมีแนวโน้มเพิ่มขึ้น ขณะที่ยุงพบในระดับต่ำ ส่วนมดไม่พบในช่วงเวลาดังกล่าว สาเหตุเกิดจากเส้นทางลำเลียงสินค้าระหว่างโรงฆ่าและหน้าร้านมีการเปิดปิดประตูบ่อยครั้ง ทำให้แมลงบินเข้าได้ง่าย ควรตรวจสอบและปรับปรุงความแน่นของม่านกั้นบริเวณทางเชื่อม และทำความสะอาดคราบสิ่งสกปรกบนพื้นเส้นทางลำเลียงสม่ำเสมอ`;
    }

    if (trapNo === '09') {
      return `${intro} จำนวนแมลงอื่นๆ ที่พบมีสัดส่วนสูงสุดและมีแนวโน้มเพิ่มขึ้นตลอดไตรมาส แมลงวันพบในระดับต่ำแต่ทรงตัว ยุงพบเล็กน้อยในเดือนแรกแล้วหายไป ส่วนมดพบในบางเดือน บริเวณทางเข้าฝ่ายซากและเครื่องในมีความเสี่ยงจากการขนถ่ายซากสัตว์ ซึ่งอาจดึงดูดแมลงหลากชนิด ควรเพิ่มความถี่การล้างทำความสะอาดบริเวณทางเข้า-ออก และตรวจสอบระบบระบายน้ำเสียให้ไม่มีการขังตกค้าง`;
    }

    if (trapNo === '10') {
      return `${intro} จำนวนยุงที่พบมีสัดส่วนสูงมากและมีแนวโน้มเพิ่มขึ้นอย่างต่อเนื่อง แมลงอื่นๆ ก็พบในระดับสูงเช่นกัน ขณะที่แมลงวันพบในระดับปานกลาง ส่วนมดพบน้อย เนื่องจากลานโหลดสินค้าห้องเลือดมีของเหลวและความชื้นสูง จึงเป็นแหล่งเพาะพันธุ์ยุงที่เหมาะสม ควรเพิ่มความถี่การทำความสะอาดพื้นและระบบระบายน้ำ พร้อมปิดฝาท่อระบายน้ำให้แน่นหนา และตรวจสอบให้ไม่มีน้ำขังบริเวณลานโหลด`;
    }

    if (trapNo === '11') {
      return `${intro} จำนวนยุงที่พบอยู่ในระดับสูงและมีแนวโน้มผันผวนตลอดไตรมาส แมลงอื่นๆ พบในระดับสูงเช่นกัน แมลงวันพบบ้างในบางเดือน ส่วนมดไม่พบในช่วงเวลาดังกล่าว ห้องเลือดมีความชื้นและของเหลวสูง ซึ่งเป็นสภาพแวดล้อมที่เหมาะสมสำหรับยุงและแมลงที่ชอบความชื้น ควรตรวจสอบระบบระบายอากาศและระบายน้ำในห้อง พร้อมทำความสะอาดพื้นผิวและฆ่าเชื้อสม่ำเสมอ`;
    }

    if (trapNo === '12') {
      return `${intro} จำนวนแมลงอื่นๆ ที่พบมีสัดส่วนสูงสุดและมีแนวโน้มเพิ่มสูงขึ้นอย่างต่อเนื่อง มดพบในระดับที่น่าสังเกตและมีแนวโน้มเพิ่มขึ้น แมลงวันและยุงพบในระดับปานกลาง บริเวณห้องช็อตและแทงคอมีร่องน้ำเลือดสัตว์ที่เป็นแหล่งดึงดูดแมลงและมด ควรทำความสะอาดร่องระบายน้ำอย่างสม่ำเสมอ และตรวจสอบซอกมุมของอุปกรณ์การผลิตที่อาจมีเศษอาหารสะสม`;
    }

    if (trapNo === '30') {
      return `${intro} จำนวนแมลงอื่นๆ ที่พบมีแนวโน้มผันผวนในช่วงไตรมาส แมลงวันและยุงพบในระดับต่ำ ส่วนมดแทบไม่พบในช่วงเวลาดังกล่าว บริเวณห้องแพ็คเครื่องในและล้างเครื่องในมีการใช้น้ำปริมาณมาก ควรตรวจสอบให้มั่นใจว่าไม่มีน้ำขังค้างและมีการระบายน้ำที่ดี พร้อมทำความสะอาดอุปกรณ์และพื้นที่ทำงานอย่างสม่ำเสมอ`;
    }

    if (trapNo === '01') {
      return `${intro} จำนวนแมลงวันที่พบทรงตัวในระดับต่ำตลอดไตรมาส แมลงอื่นๆ พบบ้างเล็กน้อย ยุงและมดแทบไม่พบ บริเวณลานโหลดของตัดแต่งและ Makro มีการเปิดปิดประตูระหว่างขนถ่ายสินค้า แนะนำให้ตรวจสอบและรักษาสภาพม่านกั้นทางเข้า-ออก และทำความสะอาดพื้นลานโหลดเป็นประจำเพื่อลดแหล่งดึงดูดแมลง`;
    }

    if (trapNo === '02') {
      return `${intro} จำนวนแมลงวันที่พบมีแนวโน้มทรงตัวในระดับต่ำถึงปานกลาง แมลงอื่นๆ พบเป็นระยะ ยุงและมดพบน้อยมาก ทางขนย้ายสินค้าเข้า-ออกตัดแต่งเป็นจุดสำคัญที่ต้องควบคุม ควรกำชับให้ปิดประตูทุกครั้งหลังใช้งาน และทำความสะอาดพื้นที่บริเวณทางเดินสม่ำเสมอ`;
    }

    if (trapNo === '06') {
      return `${intro} จำนวนแมลงวันที่พบทรงตัวในระดับต่ำ แมลงอื่นๆ และยุงพบเล็กน้อย มดแทบไม่พบ บริเวณลานโหลดของตัดแต่งและ Makro ฝั่งนี้มีการจัดการที่ดี ควรรักษาความสะอาดให้ต่อเนื่องและตรวจสอบสภาพของม่านกั้นเป็นประจำ`;
    }

    if (trapNo === '03') {
      return `${intro} จำนวนแมลงวันและมดที่พบอยู่ในระดับต่ำและทรงตัว แมลงอื่นๆ พบเล็กน้อย ยุงแทบไม่พบ บริเวณห้องตัดแต่งทางหนีไฟมีการควบคุมที่ดี ควรรักษาความสะอาดต่อเนื่องและตรวจสอบซอกมุมที่อาจสะสมสิ่งสกปรก รวมถึงตรวจสอบสภาพประตูทางหนีไฟให้ปิดสนิทเมื่อไม่ใช้งาน`;
    }

    if (trapNo === '04') {
      return `${intro} จำนวนมดที่พบมีแนวโน้มทรงตัวในระดับต่ำ แมลงวันและแมลงอื่นๆ พบเล็กน้อย ยุงแทบไม่พบ บริเวณใกล้ห้องควบคุมระบบแช่เย็นมีความเย็นที่ช่วยลดปริมาณแมลง แนะนำให้ตรวจสอบว่าไม่มีน้ำหยดหรือความชื้นสะสมบริเวณท่อแช่เย็น ซึ่งอาจดึงดูดแมลงบางชนิดได้`;
    }

    if (trapNo === '05') {
      return `${intro} จำนวนแมลงวันที่พบทรงตัวในระดับต่ำ มดพบเล็กน้อยในบางเดือน แมลงอื่นๆ พบน้อย ยุงแทบไม่พบ บริเวณเลนมันและหนังในห้องตัดแต่งมีไขมันสัตว์ซึ่งอาจดึงดูดแมลง ควรเพิ่มความถี่การล้างพื้นเลนด้วยน้ำร้อนและสารทำความสะอาด เพื่อป้องกันไขมันสะสมที่เป็นแหล่งอาหารของแมลง`;
    }

    if (trapNo === '31') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำตลอดไตรมาส มดพบเป็นระยะในระดับต่ำ แมลงวันและแมลงอื่นๆ พบน้อย ยุงแทบไม่พบ ห้องล้างมันและคัดแยกเศษมีการใช้น้ำมาก ควรดูแลระบบระบายน้ำให้ไม่มีน้ำขัง และทำความสะอาดพื้นที่สม่ำเสมอเพื่อป้องกันการสะสมของไขมันและเศษสัตว์`;
    }

    if (trapNo === '13') {
      return `${intro} จำนวนแมลงอื่นๆ ที่พบมีสัดส่วนสูงสุดและมีแนวโน้มผันผวน แมลงวันพบในระดับปานกลาง ยุงและมดพบน้อย บริเวณหน้าประตูทางเชื่อมอาคารห้อง Pack A มีการสัญจรบ่อยครั้ง ควรตรวจสอบสภาพม่านกั้นและซีลประตู และทำความสะอาดบริเวณรอบประตูสม่ำเสมอ`;
    }

    if (trapNo === '14') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำ แมลงอื่นๆ พบเป็นระยะ แมลงวัน ยุง และมดพบน้อยมาก บริเวณหน้าห้องเก็บบรรจุภัณฑ์ใน Pack A มีการควบคุมที่ดี ควรรักษาความสะอาดต่อเนื่องและตรวจสอบว่าบรรจุภัณฑ์เก่าไม่มีการสะสมเป็นระยะเวลานานซึ่งอาจเป็นที่หลบซ่อนของแมลง`;
    }

    if (trapNo === '15') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำถึงปานกลาง แมลงอื่นๆ และแมลงวันพบเป็นระยะ ยุงและมดพบน้อย ห้อง Pack C มีการควบคุมอุณหภูมิที่ช่วยลดปริมาณแมลง ควรตรวจสอบช่องเปิดหรือรอยรั่วที่อาจทำให้แมลงเข้ามา และรักษาความสะอาดอุปกรณ์บรรจุภัณฑ์อย่างสม่ำเสมอ`;
    }

    if (trapNo === '16') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำ ห้อง Pack สินค้า Frozen คลัง3 มีอุณหภูมิต่ำซึ่งช่วยควบคุมปริมาณแมลงได้ดี แมลงวันและแมลงอื่นๆ พบน้อยมาก ยุงและมดแทบไม่พบ ควรตรวจสอบให้แน่ใจว่าประตูห้องเย็นปิดสนิทเสมอ เพื่อรักษาอุณหภูมิและป้องกันแมลงจากภายนอก`;
    }

    if (trapNo === '17') {
      return `${intro} จำนวนมดที่พบมีสัดส่วนสูงสุดและมีแนวโน้มเพิ่มขึ้นในช่วงกลางไตรมาส แมลงอื่นๆ พบในระดับปานกลาง แมลงวันพบน้อย ยุงแทบไม่พบ เนื่องจากบริเวณห้องหมูบดมีเศษเนื้อและไขมันที่ดึงดูดมดได้ง่าย ควรเพิ่มความถี่การทำความสะอาดฐานเครื่องจักรด้วยน้ำร้อน และตรวจสอบซอกมุมที่อาจมีเศษอาหารสะสม`;
    }

    if (trapNo === '18') {
      return `${intro} จำนวนมดที่พบมีแนวโน้มผันผวนตลอดไตรมาส แมลงอื่นๆ พบในระดับต่ำถึงปานกลาง แมลงวันและยุงพบน้อย บริเวณเครื่องบดหมูมีเศษเนื้อที่อาจตกค้าง ควรทำความสะอาดเครื่องบดและบริเวณโดยรอบอย่างละเอียดหลังเลิกงาน และตรวจสอบว่าไม่มีเศษเนื้อสะสมใต้เครื่องจักร`;
    }

    if (trapNo === '19') {
      return `${intro} จำนวนมดที่พบทรงตัวในระดับต่ำถึงปานกลาง แมลงอื่นๆ พบเล็กน้อย แมลงวันและยุงพบน้อย บริเวณผนังติดห้องเครื่องอาจมีรอยแตกหรือช่องทางที่มดใช้เดิน ควรตรวจสอบและอุดรอยแตกของผนัง รวมถึงทำความสะอาดรอยต่อระหว่างผนังและพื้นสม่ำเสมอ`;
    }

    if (trapNo === '20') {
      return `${intro} จำนวนมดที่พบมีแนวโน้มเพิ่มขึ้นในช่วงกลางไตรมาสแล้วลดลง แมลงอื่นๆ และแมลงวันพบน้อย ยุงแทบไม่พบ ทางเข้า-ออกไลน์ผลิตติดออฟฟิศเป็นจุดที่มดมักใช้เดิน ควรตรวจสอบว่าไม่มีอาหารหรือขนมหวานวางไว้ในออฟฟิศที่อยู่ใกล้เคียง และทำความสะอาดรอยต่อระหว่างพื้นและผนังในบริเวณนี้`;
    }

    if (trapNo === '21') {
      return `${intro} จำนวนมดที่พบทรงตัวในระดับต่ำ แมลงอื่นๆ พบเล็กน้อย แมลงวันและยุงแทบไม่พบ ทางเข้า-ออกไลน์ผลิตฝั่งตู้ S,T มีการควบคุมที่ดี ควรรักษาความสะอาดต่อเนื่องและตรวจสอบสภาพของตู้ควบคุมว่าไม่มีน้ำหยดหรือความชื้นสะสม`;
    }

    if (trapNo === '22') {
      return `${intro} จำนวนยุงที่พบมีสัดส่วนสูงสุดและมีแนวโน้มเพิ่มขึ้นอย่างเห็นได้ชัด แมลงอื่นๆ พบในระดับปานกลาง แมลงวันพบน้อย มดแทบไม่พบ บริเวณทางเข้า-ออกฝั่ง Chill 3 มีความชื้นจากระบบทำความเย็นที่อาจดึงดูดยุง ควรตรวจสอบและซ่อมแซมม่านริ้วพลาสติก และตรวจสอบว่าไม่มีน้ำขังบริเวณทางเข้า`;
    }

    if (trapNo === '23') {
      return `${intro} จำนวนยุงที่พบทรงตัวในระดับปานกลาง แมลงอื่นๆ พบในระดับต่ำ แมลงวันและมดพบน้อย ทางเข้า-ออกไลน์ผลิต Slice เครื่องในมีความเสี่ยงจากยุงที่อาจเข้ามาพร้อมกับการเปิดปิดประตู ควรตรวจสอบสภาพม่านกั้นและพิจารณาติดตะแกรงกันยุงเพิ่มเติม`;
    }

    if (trapNo === '24') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำ ห้องซักผ้าคลัง 4 มีความชื้นจากการซักล้าง แมลงวันและแมลงอื่นๆ พบเล็กน้อย ยุงและมดพบน้อยมาก ควรดูแลระบบระบายน้ำให้ดีและตรวจสอบว่าไม่มีน้ำขังในบริเวณซักล้าง เพื่อป้องกันไม่ให้เป็นแหล่งเพาะพันธุ์แมลง`;
    }

    if (trapNo === '25') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำ ทางเข้า Slice ถาดมีการสัญจรของพนักงานและอุปกรณ์บ่อยครั้ง แมลงวันพบบ้างในบางเดือน แมลงอื่นๆ ยุง และมดพบน้อย ควรกำชับให้ปิดม่านกั้นทุกครั้งหลังผ่านเข้า-ออก และทำความสะอาดบริเวณทางเข้าสม่ำเสมอ`;
    }

    if (trapNo === '26') {
      return `${intro} จำนวนยุงที่พบมีแนวโน้มผันผวนและสูงกว่าเกณฑ์ในบางเดือน แมลงอื่นๆ พบในระดับปานกลาง แมลงวันพบน้อย มดแทบไม่พบ บริเวณ Slice ชั้น 3 ทางเข้า-ออกไลน์ผลิตมีการระบายอากาศที่ต้องตรวจสอบ ควรซ่อมแซมม่านริ้วพลาสติกที่ชำรุดและพิจารณาติดตะแกรงป้องกันยุงที่ช่องระบายอากาศ`;
    }

    if (trapNo === '27') {
      return `${intro} จำนวนยุงที่พบมีสัดส่วนสูงในช่วงต้นไตรมาสและลดลงในเดือนถัดมา แมลงอื่นๆ พบในระดับปานกลาง แมลงวันพบน้อย มดแทบไม่พบ พื้นที่การผลิต Slice ชั้น 3 ควรตรวจสอบจุดที่มีน้ำขังและซ่อมรอยรั่วของหลังคาหรือผนังที่อาจเป็นแหล่งความชื้น`;
    }

    if (trapNo === '28') {
      return `${intro} จำนวนยุงที่พบทรงตัวในระดับต่ำถึงปานกลาง แมลงอื่นๆ พบเล็กน้อย แมลงวันและมดพบน้อยมาก ทางเดินไปห้องยุง Slice ชั้น 3 ตามชื่อบ่งบอกว่าบริเวณนี้มีประวัติพบยุง ควรตรวจสอบและปิดกั้นแหล่งความชื้นในบริเวณนี้ พร้อมพิจารณาติดตะแกรงกันยุงเพิ่มเติม`;
    }

    if (trapNo === '29') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำถึงปานกลาง ยุงและแมลงอื่นๆ พบในระดับต่ำ แมลงวันและมดพบน้อย ห้อง Slice เฟส 4.1 มีการควบคุมที่ดี ควรรักษาความสะอาดต่อเนื่องและตรวจสอบซีลและม่านกั้นของห้องให้อยู่ในสภาพดี`;
    }

    if (trapNo === '32') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำ แมลงอื่นๆ และแมลงวันพบเล็กน้อย ยุงและมดแทบไม่พบ ทางลำเลียงตะกร้าเข้าไลน์ผลิตมีการเคลื่อนที่ของตะกร้าบ่อยครั้ง ควรทำความสะอาดตะกร้าและรางลำเลียงสม่ำเสมอ เพื่อป้องกันเศษสิ่งสกปรกที่อาจดึงดูดแมลง`;
    }

    if (trapNo === '33') {
      return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับต่ำ แมลงวันและแมลงอื่นๆ พบน้อย ยุงและมดแทบไม่พบ บันไดทางขึ้นชั้น 2 เป็นทางสัญจรที่แมลงอาจเข้ามาตามพนักงาน ควรตรวจสอบให้ประตูบันไดปิดสนิท และทำความสะอาดพื้นที่บริเวณบันไดสม่ำเสมอ`;
    }

    // Default for any unlisted trap
    return `${intro} จำนวนแมลงที่พบโดยรวมอยู่ในระดับที่สามารถควบคุมได้ แมลงวัน ยุง มด และแมลงอื่นๆ พบในระดับต่ำถึงปานกลาง ควรรักษาความสะอาดบริเวณเครื่องดักแมลงสม่ำเสมอ ตรวจสอบสภาพม่านกั้นและช่องเปิดต่างๆ พร้อมทำความสะอาดพื้นที่โดยรอบตามตารางที่กำหนด`;
  };

  // --- TAB 4: YOY OVERVIEW TREND DATA ---
  const getYoyTrendData = (quarter, month) => {
    if (isDemo || approvedRawData.length === 0) {
      if (month !== 'ALL') {
        // Monthly view -> 4 weeks
        return [
          { name: 'สัปดาห์ที่ 1', y2025: 110, y2026: 95 },
          { name: 'สัปดาห์ที่ 2', y2025: 135, y2026: 110 },
          { name: 'สัปดาห์ที่ 3', y2025: 125, y2026: 105 },
          { name: 'สัปดาห์ที่ 4', y2025: 115, y2026: 90 }
        ];
      } else if (quarter !== 'ALL') {
        // Quarterly view -> 3 months of that quarter
        let months = [];
        if (quarter === 'Q1') months = ['ม.ค.', 'ก.พ.', 'มี.ค.'];
        else if (quarter === 'Q2') months = ['เม.ย.', 'พ.ค.', 'มิ.ย.'];
        else if (quarter === 'Q3') months = ['ก.ค.', 'ส.ค.', 'ก.ย.'];
        else months = ['ต.ค.', 'พ.ย.', 'ธ.ค.'];

        const seedOffset = quarter === 'Q1' ? 100 : quarter === 'Q2' ? 250 : quarter === 'Q3' ? 180 : 80;
        return months.map((m, idx) => ({
          name: m,
          y2025: Math.round(seedOffset + Math.sin(idx) * 40 + 80),
          y2026: Math.round(seedOffset * 0.88 + Math.cos(idx) * 30 + 60)
        }));
      } else {
        // Yearly view -> 4 quarters
        return [
          { name: 'Q1', y2025: 1450, y2026: 1280 },
          { name: 'Q2', y2025: 2200, y2026: 2450 },
          { name: 'Q3', y2025: 1850, y2026: 1560 },
          { name: 'Q4', y2025: 1100, y2026: 980 }
        ];
      }
    }

    // Real database YoY aggregation
    const filterByPeriod = (item, yearStr, qStr, mStr) => {
      const date = new Date(item.inspected_at);
      if (String(date.getFullYear()) !== yearStr) return false;
      
      if (mStr !== 'ALL') {
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        if (months[date.getMonth()] !== mStr) return false;
      } else if (qStr !== 'ALL') {
        const monthIdx = date.getMonth();
        let itemQuarter = '';
        if (monthIdx >= 0 && monthIdx <= 2) itemQuarter = 'Q1';
        else if (monthIdx >= 3 && monthIdx <= 5) itemQuarter = 'Q2';
        else if (monthIdx >= 6 && monthIdx <= 8) itemQuarter = 'Q3';
        else itemQuarter = 'Q4';
        if (itemQuarter !== qStr) return false;
      }
      return true;
    };

    if (month !== 'ALL') {
      const weeks = ['สัปดาห์ที่ 1', 'สัปดาห์ที่ 2', 'สัปดาห์ที่ 3', 'สัปดาห์ที่ 4'];
      return weeks.map((w, idx) => {
        let sum2025 = 0;
        let sum2026 = 0;
        
        approvedRawData.forEach(item => {
          const date = new Date(item.inspected_at);
          const day = date.getDate();
          let isTargetWeek = false;
          if (idx === 0 && day <= 7) isTargetWeek = true;
          else if (idx === 1 && day > 7 && day <= 14) isTargetWeek = true;
          else if (idx === 2 && day > 14 && day <= 21) isTargetWeek = true;
          else if (idx === 3 && day > 21) isTargetWeek = true;

          if (isTargetWeek) {
            if (filterByPeriod(item, '2025', 'ALL', month)) sum2025 += Number(item.count) || 0;
            if (filterByPeriod(item, '2026', 'ALL', month)) sum2026 += Number(item.count) || 0;
          }
        });

        return { name: w, y2025: sum2025, y2026: sum2026 };
      });
    } else if (quarter !== 'ALL') {
      let months = [];
      if (quarter === 'Q1') months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม'];
      else if (quarter === 'Q2') months = ['เมษายน', 'พฤษภาคม', 'มิถุนายน'];
      else if (quarter === 'Q3') months = ['กรกฎาคม', 'สิงหาคม', 'กันยายน'];
      else months = ['ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

      const monthsThaiShort = {
        'มกราคม': 'ม.ค.', 'กุมภาพันธ์': 'ก.พ.', 'มีนาคม': 'มี.ค.',
        'เมษายน': 'เม.ย.', 'พฤษภาคม': 'พ.ค.', 'มิถุนายน': 'มิ.ย.',
        'กรกฎาคม': 'ก.ค.', 'สิงหาคม': 'ส.ค.', 'กันยายน': 'ก.ย.',
        'ตุลาคม': 'ต.ค.', 'พฤศจิกายน': 'พ.ย.', 'ธันวาคม': 'ธ.ค.'
      };

      return months.map(m => {
        let sum2025 = 0;
        let sum2026 = 0;

        approvedRawData.forEach(item => {
          if (filterByPeriod(item, '2025', 'ALL', m)) sum2025 += Number(item.count) || 0;
          if (filterByPeriod(item, '2026', 'ALL', m)) sum2026 += Number(item.count) || 0;
        });

        return { name: monthsThaiShort[m] || m, y2025: sum2025, y2026: sum2026 };
      });
    } else {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      return quarters.map(q => {
        let sum2025 = 0;
        let sum2026 = 0;

        approvedRawData.forEach(item => {
          if (filterByPeriod(item, '2025', q, 'ALL')) sum2025 += Number(item.count) || 0;
          if (filterByPeriod(item, '2026', q, 'ALL')) sum2026 += Number(item.count) || 0;
        });

        return { name: q, y2025: sum2025, y2026: sum2026 };
      });
    }
  };

  // --- TAB 4: YOY DEPARTMENT KPI DATA ---
  const getYoyDeptKpiData = (quarter, month) => {
    const result = [];

    DEPTS_LIST.forEach((dept, index) => {
      let y2025 = 0;
      let y2026 = 0;

      if (isDemo || approvedRawData.length === 0) {
        const seed = index + dept.length + (month !== 'ALL' ? month.length : 12) + (quarter !== 'ALL' ? quarter.length : 4);
        const base = 150 + (seed % 5) * 45;
        
        let changeFactor = 1.0;
        if (dept === 'หน้าร้านใหม่') changeFactor = 1.24; // +24%
        else if (dept === 'โรงฆ่า') changeFactor = 1.15; // +15%
        else if (dept === 'หมูบด') changeFactor = 0.82;  // -18%
        else if (dept === 'ล้างตะกร้า') changeFactor = 0.76; // -24%
        else if (index % 3 === 0) changeFactor = 0.88; // -12%
        else if (index % 3 === 1) changeFactor = 1.05; // +5%
        else changeFactor = 0.90; // -10%

        y2025 = Math.round(base);
        y2026 = Math.round(base * changeFactor);
      } else {
        const filterByPeriodAndDept = (item, yearStr, qStr, mStr, deptName) => {
          const date = new Date(item.inspected_at);
          if (String(date.getFullYear()) !== yearStr) return false;
          const { dept: itemDept } = parseArea(item.area);
          if (itemDept !== deptName) return false;

          if (mStr !== 'ALL') {
            const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
            if (months[date.getMonth()] !== mStr) return false;
          } else if (qStr !== 'ALL') {
            const monthIdx = date.getMonth();
            let itemQuarter = '';
            if (monthIdx >= 0 && monthIdx <= 2) itemQuarter = 'Q1';
            else if (monthIdx >= 3 && monthIdx <= 5) itemQuarter = 'Q2';
            else if (monthIdx >= 6 && monthIdx <= 8) itemQuarter = 'Q3';
            else itemQuarter = 'Q4';
            if (itemQuarter !== qStr) return false;
          }
          return true;
        };

        approvedRawData.forEach(item => {
          if (filterByPeriodAndDept(item, '2025', quarter, month, dept)) {
            y2025 += Number(item.count) || 0;
          }
          if (filterByPeriodAndDept(item, '2026', quarter, month, dept)) {
            y2026 += Number(item.count) || 0;
          }
        });
      }

      let pctChange = 0;
      if (y2025 > 0) {
        pctChange = Math.round(((y2026 - y2025) / y2025) * 100);
      } else if (y2026 > 0) {
        pctChange = 100;
      }

      result.push({
        name: dept,
        y2025,
        y2026,
        pctChange
      });
    });

    return result;
  };

  // --- TAB 4: YOY DYNAMIC DEPT TREND DATA (ม.ค. - มิ.ย.) ---
  const getYoyDeptTrendData = (deptName) => {
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];
    const monthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน'];
    
    if (isDemo || approvedRawData.length === 0) {
      // Mock spikes matching image expectations
      if (deptName === 'โรงฆ่า') {
        return [
          { name: 'ม.ค.', y2025: 180, y2026: 172 },
          { name: 'ก.พ.', y2025: 195, y2026: 185 },
          { name: 'มี.ค.', y2025: 210, y2026: 220 },
          { name: 'เม.ย.', y2025: 225, y2026: 395 }, // Spike April 2026
          { name: 'พ.ค.', y2025: 240, y2026: 410 }, // Spike May 2026
          { name: 'มิ.ย.', y2025: 220, y2026: 190 }  // Down in June
        ];
      }

      if (deptName === 'หน้าร้านใหม่') {
        return [
          { name: 'ม.ค.', y2025: 65, y2026: 78 },
          { name: 'ก.พ.', y2025: 70, y2026: 85 },
          { name: 'มี.ค.', y2025: 85, y2026: 135 }, // Spike March
          { name: 'เม.ย.', y2025: 90, y2026: 145 }, // Spike April
          { name: 'พ.ค.', y2025: 80, y2026: 72 },
          { name: 'มิ.ย.', y2025: 75, y2026: 68 }
        ];
      }

      return months.map((m, idx) => {
        const seed = idx + deptName.length;
        const val2025 = 120 + (seed % 4) * 35;
        const val2026 = val2025 * (seed % 3 === 0 ? 0.85 : 1.08);
        return {
          name: m,
          y2025: Math.round(val2025),
          y2026: Math.round(val2026)
        };
      });
    }

    // Real data YoY aggregation for 6 months (Jan-Jun)
    const traps = DEPT_TRAPS_MAPPING[deptName] || [];
    return monthsFull.map((m, idx) => {
      let sum2025 = 0;
      let sum2026 = 0;

      approvedRawData.forEach(item => {
        const date = new Date(item.inspected_at);
        const itemYear = String(date.getFullYear());
        const itemMonthName = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][date.getMonth()];
        const isTargetTrap = item.area && traps.some(t => item.area.includes(t));

        if (isTargetTrap && itemMonthName === m) {
          if (itemYear === '2025') sum2025 += Number(item.count) || 0;
          if (itemYear === '2026') sum2026 += Number(item.count) || 0;
        }
      });

      return {
        name: months[idx],
        y2025: sum2025,
        y2026: sum2026
      };
    });
  };

  // --- TAB 4: YOY DYNAMIC DEPT COMPLIANCE NARRATIVE ---
  const getYoyDeptSummaryText = (deptName) => {
    if (deptName === 'หน้าร้านใหม่') {
      return 'แนวโน้มแผนกหน้าร้านใหม่ในเดือน มี.ค. และ เม.ย. ปี 2569 สูงกว่าปี 2568 เนื่องจากการปรับปรุงพื้นที่รอบนอกล่าช้า แต่เริ่มลดลงในเดือน พ.ค. หลังติดตั้งม่านริ้วพลาสติกเพิ่ม';
    }
    if (deptName === 'โรงฆ่า') {
      return 'ยอดรวมแมลงสะสมในโรงฆ่าในเดือน เม.ย. และ พ.ค. ปี 2569 สูงขึ้นกว่าปี 2568 อย่างมีนัยสำคัญ สัมพันธ์กับการลวกซากสะสมและการระบายน้ำทิ้งขัดข้อง และเริ่มลดลงในเดือน มิ.ย. หลังการพ่นสารเคมีและ Deep Cleaning';
    }
    if (deptName === 'หมูบด') {
      return 'ยอดสะสมของแผนกหมูบดในปี 2569 ต่ำกว่าปี 2568 ตลอดทั้ง 6 เดือน สะท้อนถึงการบังคับใช้สุขอนามัยรอบข้างและการขัดซอกสายพานเครื่องบดได้อย่างสม่ำเสมอ';
    }
    if (deptName === 'Slice ผลิต') {
      return 'แผนก Slice ผลิต มียอดสถิติดีกว่าปีที่แล้วอย่างเห็นได้ชัด โดยเฉพาะในช่วงฤดูฝน (พ.ค. - มิ.ย.) เนื่องจากมีการปรับเปลี่ยนแผ่นม่านริ้วพลาสติกบานประตูติดออฟฟิศได้ทันที';
    }
    return `แนวโน้มดัชนีของแผนก${deptName}ควบคุมอยู่ในเกณฑ์มาตรฐานความปลอดภัย (Safe Zone) โดยสถิติปี 2569 ลดลงต่ำกว่าปี 2568 เฉลี่ย 10% สะท้อนความเข้มงวดในการกวาดเก็บกักเศษวัตถุดิบกายภาพ`;
  };

  // --- TAB 4: YOY GENERAL SUMMARY REPORT ---
  const getYoySummaryReport = (quarter, month) => {
    let periodText = '';
    if (month !== 'ALL') periodText = `เดือน ${month}`;
    else if (quarter !== 'ALL') periodText = `ไตรมาส ${quarter}`;
    else periodText = 'ภาพรวมทั้งปี';

    const trendData = getYoyTrendData(quarter, month);
    const total2025 = trendData.reduce((sum, item) => sum + item.y2025, 0);
    const total2026 = trendData.reduce((sum, item) => sum + item.y2026, 0);
    let pctDiff = 0;
    if (total2025 > 0) {
      pctDiff = Math.round(((total2025 - total2026) / total2025) * 100);
    }

    const directionText = pctDiff >= 0 ? `ลดลง (ดีขึ้น) ${pctDiff}%` : `เพิ่มขึ้น (เสี่ยง) ${Math.abs(pctDiff)}%`;

    return `สรุปภาพรวมปี 2569 เมื่อเทียบกับปี 2568 สำหรับช่วงเวลา [**${periodText}**] พบว่าภาพรวมทั้งโรงงานมีแนวโน้มควบคุมแมลงได้ดีขึ้นโดยรวมสถิติจำนวนสะสม${directionText} โดยแผนกหมูบดและล้างตะกร้ามีอัตราการพบแมลงลดลงอย่างมีนัยสำคัญ จากการเพิ่มสุขอนามัยรอบข้างและการประสานงานกำจัดด่านประตูแมลงภายนอก อย่างไรก็ตาม แผนกหน้าร้านใหม่ยังมีดัชนีชี้วัดสะสมที่สูงขึ้น คาดว่าเกิดจากปัจจัยสภาพอากาศหน้างานและการหมุนประตูเทียบโหลดขนส่งสินค้าบ่อยครั้ง ซึ่งฝ่าย QA แนะนำให้กวดขันม่านลมกั้นบริเวณทางเข้าเพิ่มเติม`;
  };

  // --- TAB 1: AI SUMMARY BOX AUTO GENERATION ---
  // Only re-fetch when the user changes a filter (year/quarter/month), not on every rawData update
  useEffect(() => {
    if (!mounted) return;
    const fetchAiReport = async () => {
      setAiReportLoading(true);
      setAiReport('');
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deptName: 'ALL',
            month: selectedMonth,
            quarter: selectedQuarter,
            year: selectedYear,
            records: activeData,
            isDemo: isDemo
          })
        });
        if (res.ok) {
          const result = await res.json();
          if (result.report) {
            setAiReport(result.report);
            setAiReportLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching AI report:', err);
      }
      
      // Fallback: local aggregation summary if API is offline
      if (activeData.length === 0) {
        setAiReport('ไม่พบข้อมูลการตรวจจับแมลงสะสมในขอบข่ายตัวกรองช่วงเวลาที่ระบุ');
        setAiReportLoading(false);
        return;
      }
      const deptMap = {};
      const typeMap = {};
      activeData.forEach(item => {
        const { dept } = parseArea(item.area);
        deptMap[dept] = (deptMap[dept] || 0) + item.count;
        typeMap[item.insect_type] = (typeMap[item.insect_type] || 0) + item.count;
      });
      let maxDept = '-';
      let maxDeptCount = 0;
      Object.entries(deptMap).forEach(([d, c]) => {
        if (c > maxDeptCount) { maxDeptCount = c; maxDept = d; }
      });
      let maxType = '-';
      let maxTypeCount = 0;
      Object.entries(typeMap).forEach(([t, c]) => {
        if (c > maxTypeCount) { maxTypeCount = c; maxType = t; }
      });
      let periodText = '';
      if (selectedMonth !== 'ALL') periodText = `เดือน ${selectedMonth} ปี ${selectedYear}`;
      else if (selectedQuarter !== 'ALL') periodText = `ไตรมาส ${selectedQuarter} ปี ${selectedYear}`;
      else periodText = `ปี ${selectedYear} (ภาพรวมสถิติสะสม)`;

      const reportText = `**รายงานการประเมินความเสี่ยงและมาตรการป้องกันความปลอดภัยอาหารประจำงวดการตรวจ ${periodText}** (ระบบประมวลผลสำรอง)\n\nจากข้อมูลพบว่า แผนกที่มียอดสะสมสูงสุดคือแผนก **${maxDept}** (สะสมรวม **${maxDeptCount} ตัว**) และชนิดแมลงที่ตรวจพบหนาแน่นที่สุดคือ **${maxType.replace(/\s*\(.*\)/, '')}** (พบสะสมรวม **${maxTypeCount} ตัว**) ทางฝ่าย QA ขอเสนอแนะให้เร่งทำความสะอาดครั้งใหญ่ และประสานงาน Pest Control ทันที`;
      setAiReport(reportText);
      setAiReportLoading(false);
    };

    fetchAiReport();
  }, [selectedYear, selectedQuarter, selectedMonth, mounted]);

  // --- TAB 2: DEPARTMENT AI SUMMARY AUTO GENERATION ---
  // Only re-fetch when user changes dept/month/year filter, not on every data reload
  useEffect(() => {
    if (!mounted) return;
    const fetchDeptReport = async () => {
      setDeptReportLoading(true);
      setDeptReportText('');
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deptName: selectedDept,
            month: selectedMonth,
            year: selectedYear,
            records: activeData,
            isDemo: isDemo
          })
        });
        if (res.ok) {
          const result = await res.json();
          if (result.report) {
            setDeptReportText(result.report);
            setDeptReportLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching department AI report:', err);
      }
      
      // Fallback: local dynamic summarizer
      const localReport = getDeptAnalysisReport(selectedDept, selectedMonth, getDisplayYear(selectedYear));
      setDeptReportText(localReport);
      setDeptReportLoading(false);
    };

    fetchDeptReport();
  }, [selectedDept, selectedMonth, selectedYear, mounted]);

  // --- CUSTOM MARKDOWN RENDERER ---
  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <h3 key={idx} className="text-base font-bold text-slate-850 dark:text-white mt-4 mb-2">{trimmed.replace('###', '').trim()}</h3>;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const content = trimmed.substring(1).trim();
        return <li key={idx} className="ml-4 list-disc text-xs text-slate-655 dark:text-slate-350 my-1">{parseInlineStyles(content)}</li>;
      }
      return <p key={idx} className="text-xs text-slate-650 dark:text-slate-355 leading-relaxed my-1">{parseInlineStyles(trimmed)}</p>;
    });
  };

  const parseInlineStyles = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1 rounded">{part}</strong>;
      }
      return part;
    });
  };

  const parseInlineStylesPrint = (text) => {
    if (!text) return null;
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} style={{ fontWeight: 'bold' }}>{part}</strong>;
      }
      return part;
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (mounted && isLoading && rawData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-10 text-center shadow-md">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
            <h3 className="text-base font-extrabold text-slate-850 dark:text-white mb-2">
              กำลังโหลดข้อมูลการตรวจนับแมลง...
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 font-bold max-w-sm mx-auto mb-6 leading-relaxed">
              ระบบกำลังดึงข้อมูลจากฐานข้อมูล Supabase และจัดเตรียมข้อมูลการตรวจนับ กรุณารอสักครู่...
            </p>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-2/3 rounded-full animate-[pulse_1.5s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mounted && !isLoading && !isDemo && rawData.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-12 text-center shadow-sm max-w-3xl mx-auto my-12">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce">
              📊
            </div>
            <h3 className="text-lg font-black text-slate-850 dark:text-white mb-3">
              ไม่พบข้อมูลการตรวจนับแมลงในระบบ
            </h3>
            <p className="text-xs text-slate-505 dark:text-slate-400 font-semibold max-w-md mx-auto mb-8 leading-relaxed">
              ยินดีต้อนรับเข้าสู่ระบบจัดการแมลง ขณะนี้ระบบเชื่อมต่อกับฐานข้อมูล Supabase สำเร็จแล้ว แต่ยังไม่มีบันทึกข้อมูลผลการตรวจนับแมลงใดๆ ในระบบ
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {currentUser?.role?.toLowerCase() !== 'department supervisor' && (
                <Link 
                  href="/inspection"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-black rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  📝 ไปหน้าบันทึกผลตรวจสัปดาห์แรก
                </Link>
              )}
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>รีเฟรชข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      <div className="screen-content max-w-7xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Header Section */}
        <div className="mb-2 flex flex-col lg:flex-row lg:items-center justify-end gap-4">
          {/* Top Status & Sync Action */}
          <div className="flex flex-wrap items-center gap-3">
            <div className={`px-4 py-2 border rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm bg-white dark:bg-slate-900 ${
              isDemo 
                ? 'border-amber-500/20 text-amber-600 dark:text-amber-400' 
                : 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${isDemo ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{isDemo ? 'เดโมโหมด (พรีเซนต์)' : 'ระบบจริงเชื่อมต่อแล้ว'}</span>
            </div>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-yellow-500 animate-pulse" />
              <span>กำหนดตัวเลือกข้อมูลนำเสนอโรงงาน</span>
            </p>
            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">สลับเพื่อทดสอบการเปลี่ยนรูปทรงกราฟและคำแนะนำ AI</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Year Selector - Hidden in YoY Tab */}
            {activeTab !== 'yoy' && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[8px] font-bold text-slate-400 uppercase">ปีประมวลผล</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  {getAvailableYears().map(y => (
                    <option key={y} value={y}>{parseInt(y, 10) + 543}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quarter Selector - Hidden in department tab */}
            {activeTab !== 'department' && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[8px] font-bold text-slate-400 uppercase">ไตรมาส</label>
                <select
                  value={selectedQuarter}
                  onChange={(e) => {
                    setSelectedQuarter(e.target.value);
                    setSelectedMonth('ALL');
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">รวมทั้งปี</option>
                  <option value="Q1">Q1 (ม.ค.-มี.ค.)</option>
                  <option value="Q2">Q2 (เม.ย.-มิ.ย.)</option>
                  <option value="Q3">Q3 (ก.ค.-ก.ย.)</option>
                  <option value="Q4">Q4 (ต.ค.-ธ.ค.)</option>
                </select>
              </div>
            )}

            {/* Month Selector */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[8px] font-bold text-slate-400 uppercase">เดือน</label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (activeTab !== 'department') {
                    const m = e.target.value;
                    if (m === 'ALL') {
                      // Maintain
                    } else if (['มกราคม', 'กุมภาพันธ์', 'มีนาคม'].includes(m)) {
                      setSelectedQuarter('Q1');
                    } else if (['เมษายน', 'พฤษภาคม', 'มิถุนายน'].includes(m)) {
                      setSelectedQuarter('Q2');
                    } else if (['กรกฎาคม', 'สิงหาคม', 'กันยายน'].includes(m)) {
                      setSelectedQuarter('Q3');
                    } else {
                      setSelectedQuarter('Q4');
                    }
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
              >
                {activeTab !== 'department' && <option value="ALL">รวมทุกเดือน</option>}
                {getAvailableMonths(selectedYear).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR BAR */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-8 flex gap-1.5 overflow-x-auto no-scrollbar pb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ภาพรวมโรงงาน & AI วิเคราะห์</span>
          </button>
          
          <button
            onClick={() => setActiveTab('department')}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'department'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>วิเคราะห์แยกรายแผนก</span>
          </button>

          <button
            onClick={() => setActiveTab('device')}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'device'
                ? 'border-indigo-650 text-indigo-650 dark:border-indigo-500 dark:text-indigo-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>แนวโน้มไตรมาสแยกรายเครื่องดัก</span>
          </button>

          <button
            onClick={() => setActiveTab('yoy')}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'yoy'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>เปรียบเทียบสถิติข้ามปี (YoY Analysis)</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: FACTORY OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Overview KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">ยอดรวมแมลงสะสม</p>
                <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">{totalInsects} ตัว</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">แผนกพบนัยสำคัญสูงสุด</p>
                <p className="text-lg font-bold text-red-500 truncate">แผนก {criticalDept.name}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">ประเภทสถิติแมลงหลัก</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{mostCommonInsect.name}</p>
              </div>
            </div>

            {/* Split layout: Factory overview and AI Analysis */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Main Factory Bar Chart (8 Cols) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-8">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-6">
                  <BarChart3 className="w-4.5 h-4.5 text-blue-500" />
                  สถิติจำนวนแมลงแยกตามประเภท (ภาพรวมโรงงาน)
                </h3>
                
                <div className="h-[320px] w-full overflow-x-auto no-scrollbar text-xs pb-2">
                  {mounted ? (
                    <div className="h-full min-w-[550px] md:min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mapZeroToTinyDecimal(factoryOverviewData)} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} domain={[0, (max) => Math.max(10, max)]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<RenderCustomLegend />} wrapperStyle={{ bottom: 0, left: 0, width: '100%' }} />
                        <Bar dataKey="flies" name="แมลงวัน" fill={INSECT_CHART_COLORS.flies} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                          <LabelList dataKey="flies" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                        <Bar dataKey="mosquitoes" name="ยุง" fill={INSECT_CHART_COLORS.mosquitoes} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                          <LabelList dataKey="mosquitoes" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                        <Bar dataKey="ants" name="มด" fill={INSECT_CHART_COLORS.ants} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                          <LabelList dataKey="ants" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                        <Bar dataKey="others" name="แมลงอื่นๆ" fill={INSECT_CHART_COLORS.others} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                          <LabelList dataKey="others" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* AI Analysis narrative box (4 Cols) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        รายงานสรุปภาพรวมโรงงาน
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-[10px] font-bold text-yellow-700 dark:text-yellow-400">✨ Gemini AI</span>
                    </div>
                    <button
                      onClick={() => {
                        setAiReport('');
                        setAiReportLoading(true);
                        fetch('/api/analyze', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            deptName: 'ALL', 
                            month: selectedMonth, 
                            quarter: selectedQuarter, 
                            year: selectedYear,
                            records: activeData,
                            isDemo: isDemo
                          })
                        }).then(r => r.ok ? r.json() : null)
                          .then(result => {
                            setAiReport(result?.report || 'ไม่สามารถดึงข้อมูล AI ได้ในขณะนี้');
                            setAiReportLoading(false);
                          })
                          .catch(() => {
                            setAiReport('ไม่สามารถเชื่อมต่อ AI ได้ในขณะนี้');
                            setAiReportLoading(false);
                          });
                      }}
                      title="วิเคราะห์ใหม่"
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${aiReportLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-5 overflow-auto">
                    <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-500/20 font-bold">
                      <CheckIcon className="w-3 h-3" />
                      <span>GMP / HACCP Verified Feedback Report</span>
                    </div>
                    <div className="space-y-2 mt-2 font-medium">
                      {aiReportLoading ? (
                        <div className="flex items-center gap-2 text-slate-450 dark:text-slate-400 text-xs py-4">
                          <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping flex-shrink-0" />
                          กำลังวิเคราะห์ภาพรวมโรงงานด้วย AI...
                        </div>
                      ) : (
                        renderMarkdown(aiReport)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DETAILED DEPARTMENT ANALYSIS */}
        {/* ======================================================== */}
        {mounted && activeTab === 'department' && (() => {
          const status = getMonthStatus(selectedMonth, selectedYear);
          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Department Selector Buttons */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {DEPTS_LIST.map((d) => {
                  const style = DEPT_CONFIGS[d] || DEPT_CONFIGS['ล้างตะกร้า'];
                  const isSelected = selectedDept === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDept(d)}
                      className={`px-4 py-2 text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? `${style.badge} shadow-sm scale-105`
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                      }`}
                    >
                      แผนก {d}
                    </button>
                  );
                })}
              </div>

              {/* Print Buttons for Tab 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 no-print shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">🖨️ สั่งพิมพ์รายงานประจำเดือน แผนก {selectedDept}:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handlePrint('monthly')}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-955 dark:hover:bg-slate-100 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    🖨️ พิมพ์รายงานประจำเดือน (A4 แนวนอน)
                  </button>
                  {(currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'qa manager') && (
                    <button
                      onClick={() => handlePrint('monthly-all')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      🖨️ พิมพ์รายงานประจำเดือนของทุกแผนก (1 คลิก)
                    </button>
                  )}
                </div>
              </div>

              {status === 'Draft' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-10 text-center shadow-sm max-w-2xl mx-auto my-6">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-850 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
                    📝
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white mb-2">
                    รายงานของเดือน {selectedMonth} {getDisplayYear(selectedYear)} ยังไม่ได้บันทึกเสร็จสิ้น
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-semibold max-w-md mx-auto mb-5 leading-relaxed">
                    ข้อมูลยังอยู่ในสถานะ Draft (ร่าง) กรุณาตรวจสอบให้แน่ใจว่าบันทึกข้อมูลเครื่องดักครบถ้วนทุกสัปดาห์ และกดส่งรายงานอนุมัติจากหน้าจอหลักก่อนหัวหน้างานจะเซ็นรับทราบ
                  </p>
                  <Link 
                    href="/inspection"
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-slate-950 hover:bg-blue-600 text-white dark:bg-white dark:text-slate-955 dark:hover:bg-blue-500 dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer"
                  >
                    <span>ไปหน้าบันทึกข้อมูลรายสัปดาห์</span>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Large Single Chart Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
                    <div className="text-center mb-6">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                        กราฟแสดงรายงานการตรวจนับจำนวนแมลง ของทีม{selectedDept} ประจำเดือน {selectedMonth} {getDisplayYear(selectedYear)}
                      </h2>
                    </div>

                    <div className="h-[450px] w-full overflow-x-auto no-scrollbar text-xs font-bold pb-2">
                      {mounted ? (
                        <div className="h-full min-w-[750px] md:min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                            data={mapZeroToTinyDecimal(getDepartmentDetailedData(selectedDept, selectedMonth, selectedYear))} 
                            margin={{ top: 30, right: 10, left: -10, bottom: 75 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                            <XAxis 
                              dataKey="name" 
                              stroke="#94a3b8" 
                              fontSize={9} 
                              tickLine={false} 
                              style={{ fontFamily: 'inherit' }}
                              interval={0}
                              height={40}
                              tick={<CustomTick />}
                            />
                            <YAxis 
                              stroke="#94a3b8" 
                              fontSize={10} 
                              tickLine={false} 
                              style={{ fontFamily: 'inherit' }}
                              domain={[0, (max) => Math.max(10, max)]}
                              label={{ 
                                value: 'จำนวน (ตัว)', 
                                angle: -90, 
                                position: 'insideLeft', 
                                offset: 0, 
                                style: { fontSize: 11, fontWeight: 'bold', fill: '#475569', fontFamily: 'inherit' } 
                              }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend content={<RenderCustomLegend />} wrapperStyle={{ bottom: 0, left: 0, width: '100%' }} />
                            
                            <Bar dataKey="flies" name="แมลงวัน" fill={INSECT_CHART_COLORS.flies} isAnimationActive={false}>
                              <LabelList dataKey="flies" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                            </Bar>
                            <Bar dataKey="mosquitoes" name="ยุง" fill={INSECT_CHART_COLORS.mosquitoes} isAnimationActive={false}>
                              <LabelList dataKey="mosquitoes" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                            </Bar>
                            <Bar dataKey="ants" name="มด" fill={INSECT_CHART_COLORS.ants} isAnimationActive={false}>
                              <LabelList dataKey="ants" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                            </Bar>
                            <Bar dataKey="others" name="แมลงอื่นๆ" fill={INSECT_CHART_COLORS.others} isAnimationActive={false}>
                              <LabelList dataKey="others" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* QA Narrative Report Box */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">วิเคราะห์รายแผนกด้วย AI</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-[10px] font-bold text-yellow-700 dark:text-yellow-400">✨ Gemini AI</span>
                      </div>
                      <button
                        onClick={() => {
                          setDeptReportText('');
                          setDeptReportLoading(true);
                          fetch('/api/analyze', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              deptName: selectedDept, 
                              month: selectedMonth, 
                              year: selectedYear,
                              records: activeData,
                              isDemo: isDemo
                            })
                          }).then(r => r.ok ? r.json() : null)
                            .then(result => {
                              if (result?.report) { setDeptReportText(result.report); }
                              else { setDeptReportText(getDeptAnalysisReport(selectedDept, selectedMonth, getDisplayYear(selectedYear))); }
                              setDeptReportLoading(false);
                            })
                            .catch(() => {
                              setDeptReportText(getDeptAnalysisReport(selectedDept, selectedMonth, getDisplayYear(selectedYear)));
                              setDeptReportLoading(false);
                            });
                        }}
                        title="วิเคราะห์ใหม่"
                        className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${deptReportLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    {/* Content */}
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-4">
                      <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {deptReportLoading ? (
                          <div className="flex items-center gap-2 text-slate-400 py-2">
                            <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-ping flex-shrink-0" />
                            กำลังวิเคราะห์ข้อมูลรายแผนกด้วย AI...
                          </div>
                        ) : (
                          renderMarkdown(deptReportText)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stamp Display slots */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Stamp 1: Department Supervisor */}
                    <div className={`border-2 border-dashed rounded-3xl p-5 flex flex-col items-center text-center justify-between min-h-[180px] transition-colors ${
                      approvalData.deptApproved 
                        ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10' 
                        : 'border-slate-300 bg-slate-50/30 dark:border-slate-800'
                    }`}>
                      <div className="w-full">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                          [ตราประทับอนุมัติประจำแผนก]
                        </span>
                        {approvalData.deptApproved ? (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 font-black text-xl">
                              ✅
                            </div>
                            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">อนุมัติแล้ว</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">ผู้อนุมัติ: {approvalData.deptApproverName ? approvalData.deptApproverName.split(' — ')[0].split(' - ')[0].trim() : ''}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{approvalData.deptApprovedAt}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2 font-black text-lg">
                              ⏳
                            </div>
                            <p className="text-sm font-bold text-slate-400">ยังไม่ได้อนุมัติ</p>
                          </div>
                        )}
                      </div>
                      {approvalData.deptApproved && approvalData.deptComment && approvalData.deptComment !== '-' && (
                        <p className="text-[11px] text-slate-550 dark:text-slate-400 italic mt-3 bg-white dark:bg-slate-900/60 w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          &ldquo;{approvalData.deptComment}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Stamp 2: QA Manager */}
                    <div className={`border-2 border-dashed rounded-3xl p-5 flex flex-col items-center text-center justify-between min-h-[180px] transition-colors ${
                      approvalData.qaApproved 
                        ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-955/10' 
                        : 'border-slate-300 bg-slate-50/30 dark:border-slate-800'
                    }`}>
                      <div className="w-full">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                          [ตราประทับอนุมัติฝ่ายประกันคุณภาพ]
                        </span>
                        {approvalData.qaApproved ? (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 font-black text-xl">
                              🛡️
                            </div>
                            <p className="text-sm font-extrabold text-blue-600 dark:text-blue-400">อนุมัติแล้ว</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">ผู้อนุมัติ: {approvalData.qaApproverName ? approvalData.qaApproverName.split(' — ')[0].split(' - ')[0].trim() : ''}</p>
                            <p className="text-[10px] text-slate-450 mt-0.5">{approvalData.qaApprovedAt}</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2 font-black text-lg">
                              ⏳
                            </div>
                            <p className="text-sm font-bold text-slate-400">ยังไม่ได้อนุมัติ</p>
                          </div>
                        )}
                      </div>
                      {approvalData.qaApproved && approvalData.qaComment && approvalData.qaComment !== '-' && (
                        <p className="text-[11px] text-slate-550 dark:text-slate-400 italic mt-3 bg-white dark:bg-slate-900/60 w-full p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          &ldquo;{approvalData.qaComment}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>
          );
        })()}

        {/* ======================================================== */}
        {/* TAB 3: QUARTERLY DEVICE TREND */}
        {/* ======================================================== */}
        {activeTab === 'device' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Trap Selector Dropdown */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">เลือกตำแหน่งเครื่องดักตรวจวิเคราะห์</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-400">กรองเพื่อแสดงสถิติกราฟเส้นพล็อตรายเดือนแยกย่อยในไตรมาสที่ต้องการ</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap">เครื่องดักแมลง:</span>
                <select
                  value={selectedTrap}
                  onChange={(e) => setSelectedTrap(e.target.value)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-md"
                >
                  {SORTED_TRAP_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Print Buttons & Lock Status for Tab 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print shadow-sm mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">🖨️ สั่งพิมพ์รายงานไตรมาส ({selectedQuarter === 'ALL' ? 'Q1' : selectedQuarter}) แผนก {selectedDept}:</span>
                {!quarterlyApproval.approved ? (
                  <span className="px-2.5 py-1 text-[10px] font-black bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-1">
                    🔒 รอหัวหน้างานอนุมัติรับทราบไตรมาสก่อนสั่งพิมพ์
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-1">
                    🔓 อนุมัติแล้ว สั่งพิมพ์ได้
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={!quarterlyApproval.approved}
                  onClick={() => handlePrint('quarterly')}
                  className={`px-4 py-2 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 ${
                    quarterlyApproval.approved
                      ? 'bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-955 dark:hover:bg-slate-100 cursor-pointer shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {quarterlyApproval.approved ? '🖨️' : '🔒'} พิมพ์รายงานไตรมาสประจำแผนก (A4 แนวนอน)
                </button>
                {(currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'qa manager') && (
                  <button
                    onClick={() => handlePrint('quarterly-all')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    🖨️ พิมพ์รายงานไตรมาสทุกแผนก (1 คลิก)
                  </button>
                )}
              </div>
            </div>

            {/* Split layout: Line Chart and Local analysis */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Line Chart (8 Cols) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-8">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <LineIcon className="w-4.5 h-4.5 text-indigo-655" />
                    กราฟเส้นพล็อตแนวโน้มรายเดือนประจำไตรมาส ({selectedQuarter === 'ALL' ? 'รวมทั้งปี' : selectedQuarter})
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    แสดงสถิติความลาดเอียงขึ้นลงของ แมลงวัน, ยุง, มด, และแมลงอื่นๆ ของเครื่องดักตามเดือนจริง
                  </p>
                </div>

                <div className="h-[300px] w-full overflow-x-auto no-scrollbar text-xs pb-2">
                  {mounted ? (
                    <div className="h-full min-w-[500px] md:min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trapTrendData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={<RenderCustomLegend />} wrapperStyle={{ bottom: 0, left: 0, width: '100%' }} />
                        <Line type="monotone" dataKey="flies" name="แมลงวัน" stroke={INSECT_CHART_COLORS.flies} strokeWidth={2.5} activeDot={{ r: 5 }} isAnimationActive={false}>
                          <LabelList dataKey="flies" content={renderCustomLabel(INSECT_CHART_COLORS.flies, 9)} />
                        </Line>
                        <Line type="monotone" dataKey="mosquitoes" name="ยุง" stroke={INSECT_CHART_COLORS.mosquitoes} strokeWidth={2.5} activeDot={{ r: 5 }} isAnimationActive={false}>
                          <LabelList dataKey="mosquitoes" content={renderCustomLabel(INSECT_CHART_COLORS.mosquitoes, 9)} />
                        </Line>
                        <Line type="monotone" dataKey="ants" name="มด" stroke={INSECT_CHART_COLORS.ants} strokeWidth={2.5} activeDot={{ r: 5 }} isAnimationActive={false}>
                          <LabelList dataKey="ants" content={renderCustomLabel(INSECT_CHART_COLORS.ants, 9)} />
                        </Line>
                        <Line type="monotone" dataKey="others" name="แมลงอื่นๆ" stroke={INSECT_CHART_COLORS.others} strokeWidth={2.5} activeDot={{ r: 5 }} isAnimationActive={false}>
                          <LabelList dataKey="others" content={renderCustomLabel(INSECT_CHART_COLORS.others, 9)} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Local environment analysis box (4 Cols) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-3 text-slate-700 dark:text-slate-200">
                    <HelpIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">วิเคราะห์สภาพแวดล้อมหน้างาน</h4>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
                    ข้อมูลวิเคราะห์สาเหตุความเสี่ยงและมาตรการแก้ไขปัญหาเฉพาะจุดของเครื่องดักแมลงนั้นๆ
                  </p>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex-1 overflow-y-auto min-h-[220px]">
                  <div className="space-y-1">
                    {renderMarkdown(getTrapAnalysis(selectedTrap, selectedQuarter === 'ALL' ? 'Q1' : selectedQuarter, selectedYear))}
                  </div>
                </div>
              </div>

            </div>

            {/* Quarterly Approval Sign-off Panel (Tab 3) */}
            {selectedQuarter !== 'ALL' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 shadow-sm mt-6 no-print rounded-3xl">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>✍️ ลงนามรับทราบรายงานวิเคราะห์รายไตรมาส แผนก {selectedDept}</span>
                </h4>
                
                {quarterlyApproval.approved ? (
                  <div className="flex flex-col items-center gap-3 p-6 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-455">
                        อนุมัติลงนามรับทราบรายงานไตรมาสแล้ว
                      </p>
                      <p className="text-[10px] text-slate-450 mt-1">
                        โดย {quarterlyApproval.approverName ? quarterlyApproval.approverName.split(' — ')[0].split(' - ')[0].trim() : ''} เมื่อ {quarterlyApproval.approvedAt}
                      </p>
                    </div>
                    {quarterlyApproval.comment && quarterlyApproval.comment !== '-' && (
                      <p className="text-xs italic text-slate-650 dark:text-slate-300 max-w-xl bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-150 dark:border-slate-800">
                        &ldquo;{quarterlyApproval.comment}&rdquo;
                      </p>
                    )}
                    
                    {(currentUser?.role?.toLowerCase() === 'admin' || 
                      currentUser?.role?.toLowerCase() === 'qa manager' || 
                      (currentUser?.role?.toLowerCase() === 'department supervisor' && currentUser?.department === selectedDept)) && (
                      <button
                        onClick={handleQuarterlyReset}
                        className="mt-2 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-extrabold rounded-2xl transition-all bg-white dark:bg-slate-900 cursor-pointer"
                      >
                        ยกเลิกการลงนามรับทราบไตรมาส
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(currentUser?.role?.toLowerCase() === 'admin' || 
                      currentUser?.role?.toLowerCase() === 'qa manager' || 
                      (currentUser?.role?.toLowerCase() === 'department supervisor' && currentUser?.department === selectedDept)) ? (
                      <div className="space-y-3">
                        <div className="max-w-md">
                          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">ผู้ลงนามอนุมัติ</label>
                          <div className="px-3.5 py-2.5 text-xs font-black rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            {currentUser?.full_name || '—'} — {currentUser?.role || 'Department Supervisor'} (แผนก {selectedDept})
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-455 uppercase mb-1">ความคิดเห็น / คำแนะนำไตรมาส</label>
                          <textarea
                            id="quarterly-comment-input"
                            placeholder="พิมพ์ข้อคิดเห็นที่นี่"
                            rows={2}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all text-slate-800 dark:text-slate-200 font-semibold"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const cmt = document.getElementById('quarterly-comment-input')?.value;
                            handleQuarterlyApprove(currentUser?.full_name || 'Supervisor', cmt);
                          }}
                          className="w-full px-4 py-2.5 bg-slate-950 text-white dark:bg-white dark:text-slate-955 dark:hover:bg-slate-900 dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer max-w-xs"
                        >
                          💾 บันทึกการอนุมัติรับทราบไตรมาส
                        </button>
                      </div>
                    ) : !currentUser ? (
                      <div className="flex flex-col gap-2 p-4 bg-indigo-50/20 dark:bg-slate-900/50 border border-indigo-100/50 dark:border-slate-800 rounded-2xl max-w-md">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <p className="text-[11px] font-extrabold text-slate-600 dark:text-slate-450">
                            กรุณาเข้าสู่ระบบเพื่อลงนามอนุมัติรายงานไตรมาส
                          </p>
                        </div>
                        <Link
                          href="/login"
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm max-w-xs cursor-pointer"
                        >
                          เข้าสู่ระบบ (Login)
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-805 rounded-2xl">
                        <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <p className="text-[11px] font-semibold text-slate-500">
                          สิทธิ์การอนุมัติรายงานไตรมาสนี้ สำหรับหัวหน้างานแผนก {selectedDept} หรือ QA/Admin เท่านั้น
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: YOY ANALYSIS */}
        {/* ======================================================== */}
        {activeTab === 'yoy' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Top YoY general summary analysis box (Executive Summary Top-placement) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  กล่องข้อความสรุปประเมิน KPI ประจำปีข้ามปี
                </h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-5">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                  {getYoySummaryReport(selectedQuarter, selectedMonth)}
                </p>
              </div>
            </div>

            {/* Split layout: Line Chart and YoY Table */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* YoY Line Chart (7 Cols) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-7">
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-slate-855 dark:text-white flex items-center gap-2">
                    <LineIcon className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                    กราฟเส้นเปรียบเทียบเทรนภาพรวมข้ามปี (YoY Trend Line Chart)
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    เปรียบเทียบสถิติรวมของปีที่แล้ว (2568 / 2025) และปีปัจจุบัน (2569 / 2026) รายช่วงเวลาที่กำหนด
                  </p>
                </div>

                <div className="h-[320px] w-full text-xs font-bold">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getYoyTrendData(selectedQuarter, selectedMonth)} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#1e293b',
                            borderRadius: '16px',
                            color: '#f8fafc',
                            fontFamily: 'inherit'
                          }} 
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontFamily: 'inherit' }} />
                        <Line type="monotone" dataKey="y2025" name="ปี 2568 (ปีที่แล้ว)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" activeDot={{ r: 4 }}>
                          <LabelList dataKey="y2025" position="top" style={{ fill: '#64748b', fontSize: 9, fontWeight: 'medium', fontFamily: 'inherit' }} />
                        </Line>
                        <Line type="monotone" dataKey="y2026" name="ปี 2569 (ปีปัจจุบัน)" stroke="#0f5b84" strokeWidth={3.5} activeDot={{ r: 6 }}>
                          <LabelList dataKey="y2026" position="top" style={{ fill: '#0f5b84', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

              {/* YoY Department KPI Table (5 Cols) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-slate-700 dark:text-slate-200">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    <h4 className="text-sm font-extrabold uppercase tracking-wider">ตารางเปรียบเทียบสถิติแยกตามแผนก</h4>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed mb-4">
                    ดัชนีชี้วัดเปรียบเทียบความแตกต่างเปอร์เซ็นต์สะสมข้ามปีของ 10 แผนกปฏิบัติงานหลัก (คลิกเลือกแถวของแผนกเพื่อดูแนวโน้ม)
                  </p>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="min-w-full text-xs text-left text-slate-600 dark:text-slate-400">
                    <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-855">
                      <tr>
                        <th className="py-2.5 px-2.5 font-bold">ชื่อแผนก</th>
                        <th className="py-2.5 font-bold text-center">ปี 2568</th>
                        <th className="py-2.5 font-bold text-center">ปี 2569</th>
                        <th className="py-2.5 font-bold text-right pr-2">สถานะแนวโน้ม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {getYoyDeptKpiData(selectedQuarter, selectedMonth).map((row) => {
                        const isGood = row.pctChange < 0;
                        const isNoChange = row.pctChange === 0;
                        const isSelected = selectedYoyDept === row.name;
                        
                        return (
                          <tr 
                            key={row.name} 
                            onClick={() => setSelectedYoyDept(row.name)}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-50/70 dark:bg-blue-950/40' 
                                : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/50'
                            }`}
                          >
                            <td className={`py-2 px-2.5 font-bold border-l-4 transition-all ${
                              isSelected 
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                : 'border-transparent text-slate-800 dark:text-slate-200'
                            }`}>
                              {row.name}
                            </td>
                            <td className="py-2 text-center font-mono font-medium">{row.y2025}</td>
                            <td className="py-2 text-center font-mono font-bold text-slate-850 dark:text-slate-150">{row.y2026}</td>
                            <td className="py-2 text-right font-bold pr-2">
                              {isNoChange ? (
                                <span className="text-slate-400 font-mono">0%</span>
                              ) : isGood ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono inline-flex items-center gap-0.5">
                                  ⬇️ {row.pctChange}%
                                </span>
                              ) : (
                                <span className="text-red-500 dark:text-red-400 font-mono inline-flex items-center gap-0.5">
                                  ⬆️ +{row.pctChange}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* NEW SECTION: YoY Department Line Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-855 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4.5 h-4.5 text-indigo-655" />
                    เจาะลึกเปรียบเทียบแนวโน้มรายแผนกย้อนหลัง: แผนก{selectedYoyDept}
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    เปรียบเทียบความเคลื่อนไหวรายเดือนข้ามปี (ม.ค. - มิ.ย.) ตามแผนกที่เลือกจากตารางด้านบน
                  </p>
                </div>
              </div>

              {/* YoY Department Multi-Line Chart */}
              <div className="h-[320px] w-full text-xs font-bold mb-6">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getYoyDeptTrendData(selectedYoyDept)} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} style={{ fontFamily: 'inherit' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#1e293b',
                          borderRadius: '16px',
                          color: '#f8fafc',
                          fontFamily: 'inherit'
                        }} 
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontFamily: 'inherit' }} />
                      <Line type="monotone" dataKey="y2025" name="ปี 2568 (ปีที่แล้ว)" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" activeDot={{ r: 4 }}>
                        <LabelList dataKey="y2025" position="top" style={{ fill: '#64748b', fontSize: 9, fontWeight: 'medium', fontFamily: 'inherit' }} />
                      </Line>
                      <Line 
                        type="monotone" 
                        dataKey="y2026" 
                        name="ปี 2569 (ปีปัจจุบัน)" 
                        stroke={DEPT_DARK_COLORS[selectedYoyDept] || '#0f5b84'} 
                        strokeWidth={3.5} 
                        activeDot={{ r: 6 }}
                      >
                        <LabelList dataKey="y2026" position="top" style={{ fill: DEPT_DARK_COLORS[selectedYoyDept] || '#0f5b84', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Line>
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </div>

              {/* Department YoY Summary Box */}
              <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 mt-4">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                  🔍 **ผลวิเคราะห์รายแผนก:** {getYoyDeptSummaryText(selectedYoyDept)}
                </p>
              </div>
            </div>

          </div>
        )}

      </div> {/* closes screen-content max-w-7xl */}

      {/* Printable reports layout */}
      {printJob !== 'none' && (
        <div className="print-layout">
          {(printJob === 'monthly') && renderMonthlyPrintPage(selectedDept)}
          {(printJob === 'monthly-all') && DEPTS_LIST.map(dept => renderMonthlyPrintPage(dept))}
          {(printJob === 'quarterly') && renderQuarterlyPrintPages(selectedDept)}
          {(printJob === 'quarterly-all') && DEPTS_LIST.map(dept => renderQuarterlyPrintPages(dept))}
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
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
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
        @media screen {
          .print-layout {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}