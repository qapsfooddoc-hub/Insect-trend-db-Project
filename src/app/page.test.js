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
  
  if (areaString.includes(': ')) {
    const parts = areaString.split(': ');
    return { dept: parts[0], location: parts[1] };
  }
  
  const depts = [
    'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด', 'เฟส 6', 
    'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
  ];
  for (const d of depts) {
    if (areaString.startsWith(d)) {
      return { 
        dept: d, 
        location: areaString.replace(d, '').replace(/^\s*[:\-]\s*/, '').trim() 
      };
    }
  }
  
  return { dept: 'อื่นๆ', location: areaString };
}

const DEPTS_LIST = [
  'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด', 'เฟส 6', 
  'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
];

// Department Pastel Colors for general visualization
const DEPT_COLORS = {
  'หน้าร้านใหม่': '#60a5fa',  // สีฟ้าพาสเทล
  'โรงฆ่า': '#fb923c',      // สีส้มพาสเทล
  'ตัดแต่ง': '#4ade80',      // สีเขียวพาสเทล
  'โหลด': '#f472b6',       // สีชมพูพาสเทล
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
  'โหลด': '#db2777',       // Deep Pink
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
  'โหลด': {
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
  'โหลด': [
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

export default function DashboardPage() {
  const [rawData, setRawData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'department', 'device', 'yoy'
  const [printJob, setPrintJob] = useState('none'); // 'none', 'monthly', 'monthly-all', 'quarterly', 'quarterly-all'

  // Quarterly Approval State
  const [quarterlyApproval, setQuarterlyApproval] = useState({
    approved: false,
    approverName: '',
    approvedAt: '',
    comment: ''
  });

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
          
          const randomFactor = Math.floor(Math.random() * 5) - 2;
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
    if (isDemo || rawData.length === 0) {
      return generateMockDataFiltered(selectedYear, selectedQuarter, selectedMonth);
    }
    
    return rawData.filter(item => {
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
          total: 0
        };
      }

      const dbKey = item.insect_type;
      const dataKey = insectKeyMap[dbKey] || 'others';
      const count = Number(item.count) || 0;
      
      monthlyGroups[yearMonthKey][dataKey] += count;
      monthlyGroups[yearMonthKey].total += count;
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
          const match = trap.match(/\((\d+)\)/);
          const trapNoStr = match ? match[1] : '00';
          const label = `${trapNoStr} (${parseArea(trap).location})`;
          
          const vals = exactValues[trap] || { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
          return {
            name: label,
            flies: vals.flies,
            mosquitoes: vals.mosquitoes,
            ants: vals.ants,
            others: vals.others
          };
        });
      }

      // General mock data generator for other selections
      return traps.map((trap, idx) => {
        const match = trap.match(/\((\d+)\)/);
        const trapNoStr = match ? match[1] : '00';
        const label = `${trapNoStr} (${parseArea(trap).location})`;
        
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
          others
        };
      });
    }

    // Real database data aggregation
    const traps = DEPT_TRAPS_MAPPING[deptName] || [];
    return traps.map(trap => {
      const match = trap.match(/\((\d+)\)/);
      const trapNoStr = match ? match[1] : '00';
      const label = `${trapNoStr} (${parseArea(trap).location})`;

      const totals = { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
      
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
          else totals.others += count;
        }
      });

      return {
        name: label,
        flies: totals.flies,
        mosquitoes: totals.mosquitoes,
        ants: totals.ants,
        others: totals.others
      };
    });
  };

  // --- TAB 2: DETAILED QA COMPLIANCE NARRATIVE REPORT ---
  const getDeptAnalysisReport = (deptName, month, yearBe) => {
    const yearText = `${yearBe}`;
    
    if (deptName === 'โรงฆ่า') {
      return `จากการตรวจนับจำนวนแมลง ของทีมโรงฆ่า ประจำเดือน ${month} ${yearText} พบว่า เครื่องดักแมลงหมายเลข 07 (ลานโหลดสินค้าหน้าร้าน) พบแมลงวันติดมากที่สุด เครื่องดักแมลง 10 (ลานโหลดสินค้าห้องเลือด) พบยุงติดมากที่สุด เครื่องดักแมลงหมายเลข 12 (ห้องช็อต/แทงคอ/ลวกซาก) พบมดและแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากเครื่องหมายเลข 10 ติดตั้งอยู่ในจุดที่ใกล้ลานโหลดสินค้า ซึ่งมีการเปิดปิดประตูเป็นประจำ จึงทำให้พบแมลงวันและแมลงอื่น ๆ มากกว่าบริเวณอื่น ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกัน`;
    }
    
    if (deptName === 'หน้าร้านใหม่') {
      return `จากการตรวจนับจำนวนแมลง ของทีมหน้าร้านใหม่ ประจำเดือน ${month} ${yearText} พบว่า เครื่องดักแมลงหมายเลข 07 (ลานโหลดสินค้าหน้าร้าน) พบสถิติจำนวนแมลงวันสะสมเฉลี่ยในเกณฑ์เฝ้าระวัง เนื่องจากตั้งอยู่ในทำเลเชื่อมต่อโดยตรงกับภายนอกอาคารโรงงาน สำหรับแมลงปีกแข็งอื่น ๆ มีแนวโน้มทรงตัวเมื่อเทียบกับเดือนก่อนหน้า ข้อเสนอแนะเบื้องต้น: กำชับให้พนักงานขนส่งรูดปิดม่านริ้วพลาสติกทุกครั้งที่รถเทียบเสร็จสิ้น และทำความสะอาดคราบน้ำหวานบริเวณพื้นลานโหลดสินค้า`;
    }

    if (deptName === 'หมูบด') {
      return `จากการตรวจนับจำนวนแมลง ของทีมหมูบด ประจำเดือน ${month} ${yearText} พบว่า เครื่องดักแมลงหมายเลข 17 และ 18 (บริเวณทางเข้า-ออก และเครื่องบดหมู) มีดัชนีสะสมของมดสูงขึ้นผิดปกติ คาดว่าเกิดจากเศษผลิตภัณฑ์บดละเอียดสะสมใต้โครงแท่นเครื่องจักรและกล่องควบคุมระบบไฟ แนะนำให้ประสานงานล้างทำความสะอาดครั้งใหญ่ (Deep Clean) โดยใช้น้ำร้อนพ่นขจัดคราบไขมัน และสุ่มตรวจความสะอาดซอกอับทุกสัปดาห์`;
    }
    
    if (deptName === 'Slice ผลิต') {
      return `จากการตรวจนับจำนวนแมลง ของทีม Slice ผลิต ประจำเดือน ${month} ${yearText} พบสถิติดัชนีตรวจจับยุงปะปนบริเวณเครื่องดักหมายเลข 22 และ 23 (ทางเข้า-ออก ฝั่ง Chill 3) สูงกว่าเกณฑ์เฝ้าระวังเล็กน้อย คาดว่าเกิดจากการเสื่อมสภาพของม่านริ้วพลาสติกที่เริ่มบิดเบี้ยว ทำให้ยุงจากโถงทางเดินเล็ดลอดเข้ามา แนะนำให้ซ่อมบำรุงเปลี่ยนม่านริ้วพลาสติกที่บิดงอ และทำความสะอาดคราบน้ำขังในท่อระบายน้ำทิ้ง`;
    }

    return `จากการตรวจนับจำนวนแมลง ของทีม${deptName} ประจำเดือน ${month} ${yearText} พบว่า ดัชนีภาพรวมของแมลงวัน ยุง มด และแมลงอื่น ๆ อยู่ในเกณฑ์มาตรฐานปลอดภัย (Safe Zone) ไม่พบจุดสะสมวิกฤตที่มีนัยสำคัญ อย่างไรก็ดี แนะนำให้รักษามาตรฐานการทำความสะอาดตามเกณฑ์ GMP/HACCP โดยเน้นตรวจสอบระบบปิดประตูอัตโนมัติ และสลับสีกระดาษกาวดักจับตามวงรอบที่ระบุในแผนงานหลัก`;
  };

  // --- TAB 3: TRAP TREND LINE CHART (ignores Tab 1 Month Selector) ---
  const getDeviceFilteredData = () => {
    if (isDemo || rawData.length === 0) {
      return generateMockDataFiltered(selectedYear, selectedQuarter, 'ALL');
    }
    
    return rawData.filter(item => {
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
    
    let riskText = '';
    let causeText = '';
    let suggestionText = '';
    
    if (trapNo === '07' || trapNo === '08' || trapNo === '10') {
      riskText = 'ตรวจพบอัตราการบินผ่านเข้า-ออกของแมลงวันในระดับวิกฤต สูงกว่าระดับเฝ้าระวัง 15%';
      causeText = 'เกิดจากการเปิดปิดประตูเข้าออกของพนักงานและรถเข็นโหลดสินค้าหน้าร้านใหม่ค้างไว้ระหว่างรอบเทียบโหลด และกำลังลมม่านอากาศตกลงต่ำกว่า 6.0 m/s';
      suggestionText = 'แจ้งซ่อมบำรุงตั้งระดับความเร็วของม่านอากาศบริเวณลานโหลดหน้าร้านใหม่ให้ได้ 8.0 m/s และกำชับห้ามพนักงานหนุนม่านริ้วพลาสติกเปิดทิ้งไว้';
    } else if (trapNo === '17' || trapNo === '18' || trapNo === '19' || trapNo === '20' || trapNo === '21') {
      riskText = 'ตรวจพบทางเดินของมดงานตามขอบรอยเชื่อมระหว่างแท่นผนังห้องบดหมู';
      causeText = 'การทำความสะอาดคราบเศษชิ้นเนื้อหวานบดละเอียดตามฐานเครื่องบดหลังเครื่องทำงานเสร็จสิ้นยังมีคราบตกค้างสะสม รวมถึงท่อระบายน้ำมีเศษตะกอนสะสม';
      suggestionText = 'พ่นน้ำร้อนอุณหภูมิสูงล้างคราบไขมัน (Hot Water Deep Wash) ตามซอกฐานเครื่อง และหมั่นสุ่มตรวจคราบสกปรกสะสมใต้กล่องสายไฟควบคุมเครื่องบด';
    } else if (trapNo === '22' || trapNo === '23' || trapNo === '26' || trapNo === '27' || trapNo === '28' || trapNo === '29') {
      riskText = 'มีดัชนีตรวจจับยุงปะปนสูงขึ้นเฉพาะสัปดาห์กลางฤดูฝน';
      causeText = 'พบม่านริ้วพลาสติกตรงประตูเชื่อมระหว่างห้อง Slice กับออฟฟิศชำรุดเสียหาย มีลมย้อนพัดฝุ่นผงและยุงจากโถงบันไดเข้ามา';
      suggestionText = 'เปลี่ยนแผ่นม่านริ้วพลาสติกที่บิดงอ และวางตะแกรงกันยุงบริเวณช่องเปิดพัดลมดูดอากาศชั้น 3';
    } else if (trapNo === '03' || trapNo === '04' || trapNo === '05' || trapNo === '31') {
      riskText = 'พบสถิติมดและเศษแมลงขนาดเล็กเกาะกาวในระดับต่ำ (Normal Zone)';
      causeText = 'ระบบควบคุมการกวาดกักเศษบรรจุภัณฑ์กระดาษห้องเตรียมวัตถุดิบ (De-boxing) ทำงานได้ดีและเป็นไปตามมาตรการป้องกันความสะอาดทางกายภาพ';
      suggestionText = 'รักษาความถี่ของการสุ่มตรวจความชื้นประจำวัน และพ่นสเปรย์ไล่แมลงรอบกำแพงด้านนอกออฟฟิศตามตารางปกติ';
    } else {
      riskText = 'ดัชนีภาพรวมตรวจพบต่ำกว่าค่ามาตรฐานเฝ้าระวัง (Safe Zone)';
      causeText = 'สุขอนามัยรอบบริเวณไม่มีแหล่งน้ำขังหรือเศษอาหารค้างดึงดูด และตัวกรองช่องระบายน้ำทำงานได้มีประสิทธิภาพ';
      suggestionText = 'บันทึกประวัติการเปลี่ยนกระดาษกาวเครื่องล่อดักตามความถี่ และรักษามาตรฐานการกวาดเก็บความสะอาดรอบจุดสม่ำเสมอ';
    }
    
    return `### 🔍 สรุปการวิเคราะห์สถิติจุดตรวจนับเครื่องดักแมลง (${q} / ปี ${year})

*   **เครื่องดักแมลง:** ${trapName}
*   **สถานะเฝ้าระวัง:** ${trapNo === '07' || trapNo === '17' ? '⚠️ ระดับเฝ้าระวังสูงสุด (Critical Alert)' : '✅ ปกติ (Safe Zone)'}
*   **รายละเอียดความเสี่ยง:** ${riskText}
*   **สาเหตุหลักหน้างาน:** ${causeText}
*   **คำแนะนำในการแก้ไข:** ${suggestionText}`;
  };

  // --- TAB 4: YOY OVERVIEW TREND DATA ---
  const getYoyTrendData = (quarter, month) => {
    if (isDemo || rawData.length === 0) {
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
        
        rawData.forEach(item => {
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

        rawData.forEach(item => {
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

        rawData.forEach(item => {
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

      if (isDemo || rawData.length === 0) {
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

        rawData.forEach(item => {
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
    
    if (isDemo || rawData.length === 0) {
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

      rawData.forEach(item => {
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
  useEffect(() => {
    if (activeData.length === 0) {
      setAiReport('ไม่พบข้อมูลการตรวจจับแมลงสะสมในขอบข่ายตัวกรองช่วงเวลาที่ระบุ');
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

    let specialAnalysis = '';
    if (selectedMonth === 'มิถุนายน') {
      specialAnalysis = `
*   **⚠️ วิกฤตประจำช่วงเวลา (June Flies Spike):** มีการพุ่งทะยาน of ยอดแมลงวันสะสมอย่างเด่นชัดภายในแผนก **หน้าร้านใหม่** (ยอดสะสมแตะระดับสูงสุด 35+ ตัว) ชี้ว่าการป้องกันสภาพแวดล้อมใกล้จุดโหลดมีความบกพร่องสูงและต้องการมาตรการลมกั้นกายภาพทันที`;
    } else if (selectedQuarter === 'Q2') {
      specialAnalysis = `
*   **⚠️ แนวโน้มไตรมาส Q2:** พบยอดสะสมรวมของแมลงวันเร่งความเร็วพุ่งสูงในแผนก **หน้าร้านใหม่** และแผนก **โหลด** สัมพันธ์กับการเริ่มต้นของ 2026/2569 มรสุมช่วงพฤษภาคม-มิถุนายน`;
    } else if (selectedQuarter === 'Q1') {
      specialAnalysis = `
*   **🔍 สรุปข้อมูลไตรมาส Q1:** ในช่วงต้นปีพบดัชนีสะสมของ **มด** บริเวณแผนก **หมูบด** สูงสุดเฉลี่ยต่อสัปดาห์ คาดว่าเกิดจากเศษอาหารวัตถุดิบหวานอุดตันตามฐานเครื่องบด`;
    }

    const reportText = `**รายงานการประเมินความเสี่ยงและมาตรการป้องกันความปลอดภัยอาหารประจำงวดการตรวจ ${periodText}** 

จากการดึงประวัติการพบแมลงสะสมทั่วอาคารผลิต พบว่าแผนกปฏิบัติงานที่มียอดความเสี่ยงสะสมสูงสุดคือแผนก **${maxDept}** (สะสมรวม **${maxDeptCount} ตัว**) และชนิดแมลงที่ตรวจพบหนาแน่นมากที่สุดคือ **${maxType.replace(/\s*\(.*\)/, '')}** (พบสะสมรวม **${maxTypeCount} ตัว**) ซึ่งสะท้อนประเด็นด้านการกวาดเช็ดล้างและการล่อนอกพื้นที่ปฏิบัติงานเป็นหลัก ${specialAnalysis} ทางฝ่ายควบคุมคุณภาพ (QC) ขอเสนอแนะให้แผนกที่เกี่ยวข้องเร่งตรวจสอบประตูด่านกั้นกายภาพม่านริ้วพลาสติก ทำความสะอาดซอกอับสายพานสายการบด และประสานงานทีม Pest Control เข้าทำการ Deep Cleaning และสลับเคมีไล่มด/แมลงรอบตัวอาคารสัปดาห์ละ 2 ครั้งเพื่อควบคุมความเสียหายตามเกณฑ์มาตรฐาน GMP และ HACCP โรงงานอุตสาหกรรม`;

    setAiReport(reportText);
  }, [selectedYear, selectedQuarter, selectedMonth, rawData, isDemo]);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 dark:border-slate-855 pb-5">
          <div>
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-905 dark:text-slate-400 dark:hover:text-white transition-colors mb-2 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับไปหน้าแรก</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              รายงานการตรวจนับจำนวนแมลง
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
              (FM-QC - 08/03 Rev.07)
            </p>
          </div>

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
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="2026">2569</option>
                  <option value="2025">2568</option>
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
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
              >
                {activeTab !== 'department' && <option value="ALL">รวมทุกเดือน</option>}
                <option value="มกราคม">มกราคม</option>
                <option value="กุมภาพันธ์">กุมภาพันธ์</option>
                <option value="มีนาคม">มีนาคม</option>
                <option value="เมษายน">เมษายน</option>
                <option value="พฤษภาคม">พฤษภาคม</option>
                <option value="มิถุนายน">มิถุนายน</option>
                <option value="กรกฎาคม">กรกฎาคม</option>
                <option value="สิงหาคม">สิงหาคม</option>
                <option value="กันยายน">กันยายน</option>
                <option value="ตุลาคม">ตุลาคม</option>
                <option value="พฤศจิกายน">พฤศจิกายน</option>
                <option value="ธันวาคม">ธันวาคม</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR BAR */}
        <div className="border-b border-slate-200 dark:border-slate-800 mb-8 flex gap-1.5 overflow-x-auto pb-px">
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
                
                <div className="h-[320px] w-full text-xs">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={factoryOverviewData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
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
                        <Bar dataKey="flies" name="แมลงวัน" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="flies" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                        <Bar dataKey="mosquitoes" name="ยุง" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="mosquitoes" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                        <Bar dataKey="ants" name="มด" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="ants" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                        <Bar dataKey="others" name="แมลงอื่นๆ" fill="#a1a1aa" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="others" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

              {/* AI Analysis narrative box (4 Cols) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      รายงานสรุปวิเคราะห์จาก AI
                    </h3>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl p-5 relative overflow-hidden h-full">
                    <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-500/20 font-bold">
                      <CheckIcon className="w-3 h-3" />
                      <span>GMP / HACCP Verified Feedback Report</span>
                    </div>
                    <div className="space-y-2 mt-2 font-medium">
                      {renderMarkdown(aiReport)}
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
        {activeTab === 'department' && (
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
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">🖨️ สั่งพิมพ์รายงานประจำเดือน แผนก ${selectedDept}:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePrint('monthly')}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  🖨️ พิมพ์รายงานประจำเดือน (A4 แนวนอน)
                </button>
                {(currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'qa manager') && (
                  <button
                    onClick={() => handlePrint('monthly-all')}
                    className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    🖨️ พิมพ์รายงานประจำเดือนของทุกแผนก (1 คลิก)
                  </button>
                )}
              </div>
            </div>

                        {/* Large Single Chart Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                  กราฟแสดงรายงานการตรวจนับจำนวนแมลง ของทีม{selectedDept} ประจำเดือน {selectedMonth} {getDisplayYear(selectedYear)}
                </h2>
              </div>

              <div className="h-[450px] w-full text-xs font-bold">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={getDepartmentDetailedData(selectedDept, selectedMonth, selectedYear)} 
                      margin={{ top: 30, right: 10, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        tickLine={false} 
                        style={{ fontFamily: 'inherit' }}
                        label={{ 
                          value: 'หมายเลขเครื่องดักแมลง', 
                          position: 'insideBottom', 
                          offset: -10, 
                          style: { fontSize: 11, fontWeight: 'bold', fill: '#475569', fontFamily: 'inherit' } 
                        }} 
                        height={55}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        style={{ fontFamily: 'inherit' }}
                        label={{ 
                          value: 'จำนวน (ตัว)', 
                          angle: -90, 
                          position: 'insideLeft', 
                          offset: 0, 
                          style: { fontSize: 11, fontWeight: 'bold', fill: '#475569', fontFamily: 'inherit' } 
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#1e293b',
                          borderRadius: '16px',
                          color: '#f8fafc',
                          fontFamily: 'inherit'
                        }} 
                      />
                      <Legend 
                        align="center" 
                        verticalAlign="bottom" 
                        iconType="square" 
                        iconSize={10} 
                        wrapperStyle={{ paddingTop: '15px', fontSize: 11, fontWeight: 'bold', fontFamily: 'inherit' }} 
                      />
                      
                      <Bar dataKey="flies" name="แมลงวัน" fill={INSECT_CHART_COLORS.flies}>
                        <LabelList dataKey="flies" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="mosquitoes" name="ยุง" fill={INSECT_CHART_COLORS.mosquitoes}>
                        <LabelList dataKey="mosquitoes" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="ants" name="มด" fill={INSECT_CHART_COLORS.ants}>
                        <LabelList dataKey="ants" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="others" name="อื่นๆ" fill={INSECT_CHART_COLORS.others}>
                        <LabelList dataKey="others" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* QA Narrative Report Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
              <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                {getDeptAnalysisReport(selectedDept, selectedMonth, getDisplayYear(selectedYear))}
              </p>
            </div>

          </div>
        )}

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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">🖨️ สั่งพิมพ์รายงานไตรมาส (${selectedQuarter === 'ALL' ? 'Q1' : selectedQuarter}) แผนก ${selectedDept}:</span>
                {!quarterlyApproval.approved ? (
                  <span className="px-2.5 py-1 text-[10px] font-black bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-455 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center gap-1">
                    🔒 รอหัวหน้างานอนุมัติรับทราบไตรมาสก่อนสั่งพิมพ์
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-1">
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
                      ? 'bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-955 dark:hover:bg-slate-100 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700 cursor-not-allowed'
                  }`}
                >
                  {quarterlyApproval.approved ? '🖨️' : '🔒'} พิมพ์รายงานไตรมาสประจำแผนก (A4 แนวนอน)
                </button>
                {(currentUser?.role?.toLowerCase() === 'admin' || currentUser?.role?.toLowerCase() === 'qa manager') && (
                  <button
                    onClick={() => handlePrint('quarterly-all')}
                    className="px-4 py-2 bg-blue-650 hover:bg-blue-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
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

                <div className="h-[300px] w-full text-xs">
                  {mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trapTrendData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
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
                        <Line type="monotone" dataKey="flies" name="แมลงวัน" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 5 }}>
                          <LabelList dataKey="flies" position="top" style={{ fill: '#3b82f6', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Line>
                        <Line type="monotone" dataKey="mosquitoes" name="ยุง" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 5 }}>
                          <LabelList dataKey="mosquitoes" position="top" style={{ fill: '#06b6d4', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Line>
                        <Line type="monotone" dataKey="ants" name="มด" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 5 }}>
                          <LabelList dataKey="ants" position="top" style={{ fill: '#f59e0b', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Line>
                        <Line type="monotone" dataKey="others" name="แมลงอื่นๆ" stroke="#a1a1aa" strokeWidth={2.5} activeDot={{ r: 5 }}>
                          <LabelList dataKey="others" position="top" style={{ fill: '#71717a', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
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

          </div>
        )}


            {/* Quarterly Approval Sign-off Panel (Tab 3) */}
            {selectedQuarter !== 'ALL' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 shadow-sm mt-6 no-print">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>✍️ ลงนามรับทราบรายงานวิเคราะห์รายไตรมาส แผนก 	h{selectedDept}</span>
                </h4>
                
                {quarterlyApproval.approved ? (
                  <div className="flex flex-col items-center gap-3 p-6 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-3xl text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl animate-bounce">
                      ✓
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-450">
                        อนุมัติลงนามรับทราบรายงานไตรมาสแล้ว
                      </p>
                      <p className="text-[10px] text-slate-450 mt-1">
                        โดย {quarterlyApproval.approverName} เมื่อ {quarterlyApproval.approvedAt}
                      </p>
                    </div>
                    {quarterlyApproval.comment && quarterlyApproval.comment !== '-' && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-300 max-w-xl bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-150 dark:border-slate-800">
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
                        <div>
                          <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">ผู้ลงนามอนุมัติ</label>
                          <div className="px-3.5 py-2.5 text-xs font-black rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                            {currentUser?.full_name || '—'} — {currentUser?.role || 'Department Supervisor'} (แผนก {selectedDept})
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-455 uppercase mb-1">ความคิดเห็น / คำสั่งการสั่งงานไตรมาส</label>
                          <textarea
                            id="quarterly-comment-input"
                            placeholder="พิมพ์ข้อคิดเห็นที่นี่"
                            rows={2}
                            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-950 dark:focus:ring-white transition-all text-slate-800 dark:text-slate-200 font-semibold"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const cmt = document.getElementById('quarterly-comment-input')?.value;
                            handleQuarterlyApprove(currentUser?.full_name || 'Supervisor', cmt);
                          }}
                          className="w-full px-4 py-2.5 bg-slate-950 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-900 dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer"
                        >
                          💾 บันทึกการอนุมัติรับทราบไตรมาส
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
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
          body {
            background-color: white !important;
            color: black !important;
            font-family: 'Niramit', sans-serif !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .screen-content, header, nav, footer, .no-print {
            display: none !important;
          }
          .print-layout {
            display: block !important;
            width: 100% !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            position: relative;
            width: 297mm;
            height: 210mm;
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: white !important;
            color: black !important;
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