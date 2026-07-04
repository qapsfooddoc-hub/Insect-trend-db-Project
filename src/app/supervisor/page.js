'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Layers, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList
} from 'recharts';

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

// ─── Department / Trap mapping ─────────────────────────────────────────────────
const DEPTS_LIST = [
  'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'เฟส 6',
  'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
];

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
  'คลัง3': ['(16) ห้อง Pack สินค้า Frozen คลัง3'],
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
  'ล้างตะกร้า': ['(32) ทางลำเลียงตะกร้าเข้าไลน์ผลิต']
};

const INSECT_CHART_COLORS = {
  flies: '#0f5b84',
  mosquitoes: '#e452cd',
  ants: '#fcc214',
  others: '#78c843'
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function genMockTrapData(deptName, month, year) {
  const traps = DEPT_TRAPS_MAPPING[deptName] || [];
  if (deptName === 'โรงฆ่า' && month === 'มกราคม') {
    const exactValues = {
      '(07) ลานโหลดสินค้าหน้าร้าน':               { flies: 57, mosquitoes:   9, ants: 12, others:   0 },
      '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน':    { flies:  3, mosquitoes:   6, ants:  0, others:  17 },
      '(09) ทางเข้าฝ่ายซาก/เครื่องในแดง/เครื่องในขาว': { flies:  2, mosquitoes: 3, ants: 12, others: 46 },
      '(10) ลานโหลดสินค้าห้องเลือด':               { flies: 30, mosquitoes: 735, ants:  8, others:  67 },
      '(11) ห้องเลือด':                              { flies: 27, mosquitoes: 129, ants:  0, others:  81 },
      '(12) ห้องช็อต/แทงคอ/ลวกซาก':                { flies: 22, mosquitoes:  43, ants: 37, others: 198 },
      '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน':      { flies:  3, mosquitoes:   5, ants:  0, others:  14 }
    };
    return traps.map(trap => {
      const vals = exactValues[trap] || { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
      const othersVal = vals.others || 0;
      return {
        name: trap,
        flies:      vals.flies,
        mosquitoes: vals.mosquitoes,
        ants:       vals.ants,
        others:     othersVal,
        othersBreakdown: othersVal > 0 ? { 'ผีเสื้อ': Math.max(1, Math.floor(othersVal / 2)), 'แมลงสาบ': Math.max(0, Math.ceil(othersVal / 2)) } : {}
      };
    });
  }
  return traps.map((trap, idx) => {
    const seed = idx + deptName.length + month.length + parseInt(year, 10);
    const flies = Math.max(0, (seed % 5 === 0 ? 35 : 3)  + (seed % 3) * 3);
    const mosquitoes = Math.max(0, (seed % 7 === 0 ? 60 : 4)  + (seed % 4) * 4);
    const ants = Math.max(0, (seed % 6 === 0 ? 15 : 1)  + (seed % 2) * 2);
    const othersVal = Math.max(0, (seed % 8 === 0 ? 40 : 2)  + (seed % 5) * 5);
    return {
      name: trap,
      flies,
      mosquitoes,
      ants,
      others:     othersVal,
      othersBreakdown: othersVal > 0 ? { 'ผีเสื้อ': Math.max(1, Math.floor(othersVal / 2)), 'แมลงสาบ': Math.max(0, Math.ceil(othersVal / 2)) } : {}
    };
  });
}

// ─── SignOff Card ──────────────────────────────────────────────────────────────
function SignOffCard({
  title, accentColor, stampIcon, stampLabel,
  isApproved, approvedAt, approverName, savedComment,
  canSign,
  signerName, signerRole,
  commentId, onApprove, onReset
}) {
  const accent = accentColor === 'emerald'
    ? { border: 'border-emerald-500', bg: 'bg-emerald-50/10 dark:bg-emerald-950/10', text: 'text-emerald-700 dark:text-emerald-400', ring: 'focus:ring-emerald-500', btn: 'hover:bg-emerald-600 dark:hover:bg-emerald-500' }
    : { border: 'border-blue-500',    bg: 'bg-blue-50/10 dark:bg-blue-950/10',       text: 'text-blue-700 dark:text-blue-400',       ring: 'focus:ring-blue-500',    btn: 'hover:bg-blue-600 dark:hover:bg-blue-500' };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
      {/* Title */}
      <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
        <span>{title}</span>
      </h4>

      {/* Stamp */}
      <div className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center text-center min-h-[120px] justify-center transition-colors ${
        isApproved ? `${accent.border} ${accent.bg}` : 'border-slate-300 dark:border-slate-800 bg-slate-50/30'
      }`}>
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{stampLabel}</span>
        {isApproved ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg animate-bounce">{stampIcon}</div>
            <p className={`text-xs font-bold ${accent.text} max-w-[200px]`}>
              ✓ รับทราบแล้ว โดย {approverName ? approverName.split(' — ')[0].split(' - ')[0].trim() : ''}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{approvedAt}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-lg">⏳</div>
            <p className="text-xs font-bold text-slate-400">⏳ รอการบันทึกรับทราบข้อมูล</p>
          </div>
        )}
        {isApproved && savedComment && savedComment !== '-' && (
          <p className="text-[11px] italic text-slate-500 dark:text-slate-400 mt-2 bg-white dark:bg-slate-800/60 px-2.5 py-2 rounded-xl border border-slate-100 dark:border-slate-700 w-full text-left">
            &ldquo;{savedComment}&rdquo;
          </p>
        )}
      </div>

      {/* Action form */}
      {isApproved ? (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 font-bold">บันทึกเรียบร้อยแล้ว</p>
          <button
            onClick={onReset}
            className="w-full px-4 py-2.5 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-extrabold rounded-2xl transition-all bg-white dark:bg-slate-900 cursor-pointer"
          >
            ยกเลิกการลงนามรับทราบ
          </button>
        </div>
      ) : canSign ? (
        <div className="space-y-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-450 uppercase mb-1">ผู้ลงนาม</label>
            <div className="px-3.5 py-2.5 text-xs font-black rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              {signerName} — {signerRole}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-455 uppercase mb-1">ความคิดเห็น / มาตรการเพิ่มเติม (ตัวเลือก)</label>
            <textarea
              id={commentId}
              placeholder="พิมพ์ข้อคิดเห็นที่นี่"
              rows={2}
              className={`w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 ${accent.ring} transition-all text-slate-800 dark:text-slate-250 font-semibold`}
            />
          </div>
          <button
            onClick={onApprove}
            className={`w-full px-4 py-2.5 bg-slate-950 text-white dark:bg-white dark:text-slate-950 ${accent.btn} dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer`}
          >
            💾 บันทึกการรับทราบข้อมูล
          </button>
        </div>
      ) : (
        /* Read-only view for users without permission for this side */
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-slate-350 dark:text-slate-600 flex-shrink-0" />
          <p className="text-[11px] font-semibold text-slate-450 dark:text-slate-500">
            สิทธิ์นี้สำหรับบทบาทที่เกี่ยวข้องเท่านั้น
          </p>
        </div>
      )}
    </div>
  );
}

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

// --- CUSTOM MARKDOWN RENDERER ---
const parseInlineStyles = (text) => {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1 rounded">{part}</strong>;
    }
    return part;
  });
};

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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SupervisorPortal() {
  const [rawData, setRawData]       = useState([]);
  const [isDemo, setIsDemo]         = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Chart filters
  const [selectedDept, setSelectedDept]   = useState('โรงฆ่า');
  const [selectedMonth, setSelectedMonth] = useState('มกราคม');
  const [selectedYear, setSelectedYear]   = useState('2026');
  const [deptReportText, setDeptReportText] = useState('');
  const [deptReportLoading, setDeptReportLoading] = useState(false);

  // ── Supervisor sign-off state ──
  const [supApproved, setSupApproved]       = useState(false);
  const [supApprovedAt, setSupApprovedAt]   = useState('');
  const [supApproverName, setSupApproverName] = useState('');
  const [supComment, setSupComment]         = useState('');

  // ── QA Manager sign-off state ──
  const [qaApproved, setQaApproved]         = useState(false);
  const [qaApprovedAt, setQaApprovedAt]     = useState('');
  const [qaApproverName, setQaApproverName] = useState('');
  const [qaComment, setQaComment]           = useState('');

  // ── Sync user from localStorage ──
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
        } catch {}
      } else {
        setCurrentUser(null);
      }
    }
  };

  // Auto-select latest month with data that is not approved yet
  const autoSelectLatestUnapproved = (data, dept) => {
    if (!data || data.length === 0) return;
    
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const combos = [];
    data.forEach(item => {
      const traps = DEPT_TRAPS_MAPPING[dept] || [];
      const belongs = traps.some(trap => item.area && item.area.includes(trap));
      if (!belongs) return;
      
      const date = new Date(item.inspected_at);
      if (isNaN(date.getTime())) return;
      const y = String(date.getFullYear());
      const m = thaiMonths[date.getMonth()];
      
      const exists = combos.some(c => c.year === y && c.month === m);
      if (!exists) {
        combos.push({ year: y, month: m, dateVal: date.getTime() });
      }
    });
    
    if (combos.length === 0) return;
    
    // Sort descending (latest date first)
    combos.sort((a, b) => b.dateVal - a.dateVal);
    
    let selectedCombo = null;
    for (const combo of combos) {
      const beYear = parseInt(combo.year, 10) + 543;
      const key = `approval_${dept}_${combo.month}_${beYear}`;
      const saved = localStorage.getItem(key);
      let isApproved = false;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          isApproved = parsed.deptApproved || false;
        } catch {}
      }
      
      if (!isApproved) {
        selectedCombo = combo;
        break;
      }
    }
    
    // Fallback to latest combo if all approved
    if (!selectedCombo) {
      selectedCombo = combos[0];
    }
    
    if (selectedCombo) {
      setSelectedYear(selectedCombo.year);
      setSelectedMonth(selectedCombo.month);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();

    syncCurrentUser();
    window.addEventListener('currentSimulatedUserChanged', syncCurrentUser);
    return () => window.removeEventListener('currentSimulatedUserChanged', syncCurrentUser);
  }, []);

  // Sync Sign-off Data for Selected Department, Month, and Year
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const beYear = parseInt(selectedYear, 10) + 543;
      const key = `approval_${selectedDept}_${selectedMonth}_${beYear}`;
      
      // If demo mode is active and it's 'โรงฆ่า' and 'มกราคม' 2569, initialize it as pre-approved
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
          const data = JSON.parse(saved);
          setSupApproved(data.deptApproved || false);
          setSupApprovedAt(data.deptApprovedAt || '');
          setSupApproverName(data.deptApproverName || '');
          setSupComment(data.deptComment || '');

          setQaApproved(data.qaApproved || false);
          setQaApprovedAt(data.qaApprovedAt || '');
          setQaApproverName(data.qaApproverName || '');
          setQaComment(data.qaComment || '');
        } catch {
          resetStates();
        }
      } else {
        resetStates();
      }
    }
  }, [selectedDept, selectedMonth, selectedYear, isDemo]);

  const resetStates = () => {
    setSupApproved(false);
    setSupApprovedAt('');
    setSupApproverName('');
    setSupComment('');
    setQaApproved(false);
    setQaApprovedAt('');
    setQaApproverName('');
    setQaComment('');
  };

  // Auto-lock dept for Supervisors
  useEffect(() => {
    if (currentUser?.role?.toLowerCase() === 'department supervisor' && currentUser?.department) {
      setSelectedDept(currentUser.department);
    }
  }, [currentUser]);

  // Auto-select latest month with data that is not approved yet
  useEffect(() => {
    if (rawData && rawData.length > 0 && selectedDept) {
      autoSelectLatestUnapproved(rawData, selectedDept);
    }
  }, [rawData, selectedDept]);

  // Fetch AI Analysis Report — only re-fetch when filters change, not on every data reload
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
            records: rawData,
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
        console.error('Error fetching supervisor AI report:', err);
      }
      
      const beYear = parseInt(selectedYear, 10) + 543;
      const localReport = getDeptAnalysisReport(selectedDept, selectedMonth, beYear);
      setDeptReportText(localReport);
      setDeptReportLoading(false);
    };

    fetchDeptReport();
  }, [selectedDept, selectedMonth, selectedYear, mounted]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/inspection');
      const result = await res.json();
      if (res.ok) { setRawData(result.data || []); setIsDemo(result.isDemo || false); }
    } catch {}
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
        if (!months.includes(selectedMonth)) {
          setSelectedMonth(months[0]);
        }
      }
    }
  }, [rawData, isDemo]);

  useEffect(() => {
    if (rawData.length > 0 && !isDemo) {
      const months = getAvailableMonths(selectedYear);
      if (months.length > 0) {
        if (!months.includes(selectedMonth)) {
          setSelectedMonth(months[0]);
        }
      }
    }
  }, [selectedYear]);

  // ── Chart data ──
  const getChartData = (deptName, month, year) => {
    const yearStr = String(year || selectedYear);
    if (isDemo || rawData.length === 0) return genMockTrapData(deptName, month, yearStr);
    const traps = DEPT_TRAPS_MAPPING[deptName] || [];
    const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return traps.map(trap => {
      const totals = { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
      const othersBreakdown = {};
      
      rawData.forEach(item => {
        const d = new Date(item.inspected_at);
        const itemYear = String(d.getFullYear());
        if (itemYear !== yearStr) return;
        if (months[d.getMonth()] !== month) return;
        if (item.area && item.area.includes(trap)) {
          const t = item.insect_type; const c = Number(item.count) || 0;
          if (t.includes('Flies')) totals.flies += c;
          else if (t.includes('Mosquitoes')) totals.mosquitoes += c;
          else if (t.includes('Ants')) totals.ants += c;
          else {
            totals.others += c;
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
      return { name: trap, ...totals, othersBreakdown };
    });
  };

  // --- TAB 2: DETAILED QA COMPLIANCE NARRATIVE REPORT ---
  const getDeptAnalysisReport = (deptName, month, yearBe) => {
    const yearText = `${yearBe}`;
    const normalYear = String(parseInt(yearBe, 10) - 543);
    const chartData = getChartData(deptName, month, normalYear);
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

  // ── Role flags ──
  const role = currentUser?.role?.toLowerCase() || '';
  const isSupervisor = role === 'department supervisor';
  const isQA         = role === 'qa manager';
  const isAdmin      = role === 'admin';
  const canSignSup   = isSupervisor || isAdmin;
  const canSignQA    = isQA || isAdmin;

  const availableDepts = isSupervisor && currentUser?.department
    ? DEPTS_LIST.filter(d => d === currentUser.department)
    : DEPTS_LIST;

  // ── Handlers: Supervisor ──
  const handleSupApprove = () => {
    const el = document.getElementById('sup-comment-input');
    const now = new Date().toLocaleString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const name = currentUser?.full_name || 'Supervisor';
    const cmt = el?.value || '-';
    
    setSupApproved(true); setSupApprovedAt(now); setSupApproverName(name); setSupComment(cmt);
    
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `approval_${selectedDept}_${selectedMonth}_${beYear}`;
    const saved = localStorage.getItem(key);
    let data = {};
    if (saved) {
      try { data = JSON.parse(saved); } catch {}
    }
    data.deptApproved = true;
    data.deptApprovedAt = now;
    data.deptApproverName = name;
    data.deptComment = cmt;
    localStorage.setItem(key, JSON.stringify(data));
    
    // Update global month status key
    const status = (data.deptApproved && data.qaApproved) ? 'Approved' : 'Pending';
    localStorage.setItem(`monthStatus_${selectedMonth}_${selectedYear}`, status);
    
    if (el) el.value = '';
  };

  const handleSupReset = () => {
    if (!confirm('ยืนยันการยกเลิกการลงนามรับทราบ (Supervisor)?')) return;
    setSupApproved(false); setSupApprovedAt(''); setSupApproverName(''); setSupComment('');
    
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `approval_${selectedDept}_${selectedMonth}_${beYear}`;
    const saved = localStorage.getItem(key);
    let data = {};
    if (saved) {
      try { data = JSON.parse(saved); } catch {}
    }
    data.deptApproved = false;
    data.deptApprovedAt = '';
    data.deptApproverName = '';
    data.deptComment = '';
    localStorage.setItem(key, JSON.stringify(data));
    
    // Update global month status key
    const status = (data.deptApproved && data.qaApproved) ? 'Approved' : (data.deptApproved || data.qaApproved) ? 'Pending' : 'Draft';
    localStorage.setItem(`monthStatus_${selectedMonth}_${selectedYear}`, status);
  };

  // ── Handlers: QA ──
  const handleQaApprove = () => {
    const el = document.getElementById('qa-comment-input');
    const now = new Date().toLocaleString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const name = currentUser?.full_name || 'QA Manager';
    const cmt = el?.value || '-';
    
    setQaApproved(true); setQaApprovedAt(now); setQaApproverName(name); setQaComment(cmt);
    
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `approval_${selectedDept}_${selectedMonth}_${beYear}`;
    const saved = localStorage.getItem(key);
    let data = {};
    if (saved) {
      try { data = JSON.parse(saved); } catch {}
    }
    data.qaApproved = true;
    data.qaApprovedAt = now;
    data.qaApproverName = name;
    data.qaComment = cmt;
    localStorage.setItem(key, JSON.stringify(data));
    
    // Update global month status key
    const status = (data.deptApproved && data.qaApproved) ? 'Approved' : 'Pending';
    localStorage.setItem(`monthStatus_${selectedMonth}_${selectedYear}`, status);
    
    if (el) el.value = '';
  };

  const handleQaReset = () => {
    if (!confirm('ยืนยันการยกเลิกการลงนามรับทราบ (QA)?')) return;
    setQaApproved(false); setQaApprovedAt(''); setQaApproverName(''); setQaComment('');
    
    const beYear = parseInt(selectedYear, 10) + 543;
    const key = `approval_${selectedDept}_${selectedMonth}_${beYear}`;
    const saved = localStorage.getItem(key);
    let data = {};
    if (saved) {
      try { data = JSON.parse(saved); } catch {}
    }
    data.qaApproved = false;
    data.qaApprovedAt = '';
    data.qaApproverName = '';
    data.qaComment = '';
    localStorage.setItem(key, JSON.stringify(data));
    
    // Update global month status key
    const status = (data.deptApproved && data.qaApproved) ? 'Approved' : (data.deptApproved || data.qaApproved) ? 'Pending' : 'Draft';
    localStorage.setItem(`monthStatus_${selectedMonth}_${selectedYear}`, status);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 dark:bg-slate-955">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // If not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 py-10 transition-colors duration-300 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-10 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
              🚫
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-red-650 dark:text-red-400 mb-2 font-sans">
              ปฏิเสธการเข้าถึง - กรุณาเข้าสู่ระบบก่อนใช้งาน
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto mb-6 leading-relaxed font-sans">
              หน้าบันทึกการรับทราบรายงานข้อมูลแมลงประจำเดือนสงวนสิทธิ์เฉพาะผู้รับผิดชอบแผนก (Supervisor), ฝ่ายประกันคุณภาพ (QA Manager) หรือผู้ดูแลระบบ (Admin) เท่านั้น กรุณาเข้าสู่ระบบเพื่อดำเนินการ
            </p>
            <div className="flex justify-center gap-3">
              <Link 
                href="/login"
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <span>เข้าสู่ระบบ (Login)</span>
              </Link>
              <Link 
                href="/"
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl transition-all shadow-sm cursor-pointer"
              >
                <span>กลับไปหน้าแดชบอร์ดหลัก</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAllowed = isSupervisor || isQA || isAdmin;
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 py-10 transition-colors duration-300 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-10 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
              🚫
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-red-650 dark:text-red-400 mb-2 font-sans">
              ปฏิเสธการเข้าถึง - เฉพาะผู้รับผิดชอบหรือฝ่ายประกันคุณภาพเท่านั้น
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto mb-6 leading-relaxed font-sans">
              บัญชีปัจจุบันของคุณคือ <strong>{currentUser?.full_name || 'ไม่ระบุ'}</strong> (บทบาท: {currentUser?.role || 'พนักงานทั่วไป'}) ซึ่งไม่มีสิทธิ์เข้าใช้หน้าบันทึกการรับทราบรายงาน หน้านี้อนุญาตให้เข้าถึงเฉพาะแผนกรับผิดชอบ (Supervisor), QA Manager หรือ Admin เท่านั้น
            </p>
            <div className="flex justify-center gap-3">
              <Link 
                href="/login"
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <span>เข้าสู่ระบบด้วยบัญชีอื่น</span>
              </Link>
              <Link 
                href="/"
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black rounded-2xl transition-all shadow-sm cursor-pointer"
              >
                <span>กลับไปหน้าแดชบอร์ดหลัก</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pt-16 pb-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Page Header ── */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              บันทึกการรับทราบรายงาน
            </h1>
            {isSupervisor && currentUser?.department && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                🔒 ล็อกแสดงเฉพาะแผนก: {currentUser.department}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isDemo ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs font-bold text-slate-500">{isDemo ? 'เดโมโหมด' : 'ระบบจริง'}</span>
          </div>
        </div>

        <div className="space-y-6">

          {/* ── Bar Chart Card ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" />
                กราฟแท่งแสดงผลรายเครื่องดักจับประจำเดือน
              </h3>

              <div className="flex items-center gap-2">
                {/* Dept selector */}
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  disabled={isSupervisor && availableDepts.length === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                {/* Month selector */}
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  {getAvailableMonths(selectedYear).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* Year selector */}
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                >
                  {getAvailableYears().map(y => (
                    <option key={y} value={y}>{parseInt(y, 10) + 543}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[450px] w-full text-xs font-bold overflow-x-auto scrollbar-thin pb-2">
              {mounted && (
                <div className="h-full min-w-[1300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mapZeroToTinyDecimal(getChartData(selectedDept, selectedMonth, selectedYear))} margin={{ top: 30, right: 10, left: -10, bottom: 75 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} style={{ fontFamily: 'inherit' }} interval={0} height={40}
                        tick={<CustomTick />} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} style={{ fontFamily: 'inherit' }} domain={[0, (max) => Math.max(10, max)]}
                        label={{ value: 'จำนวน (ตัว)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 11, fontWeight: 'bold', fill: '#475569', fontFamily: 'inherit' } }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<RenderCustomLegend />} wrapperStyle={{ bottom: 0, left: 0, width: '100%' }} />
                      <Bar dataKey="flies"      name="แมลงวัน" fill={INSECT_CHART_COLORS.flies} isAnimationActive={false}>
                        <LabelList dataKey="flies"      position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="mosquitoes" name="ยุง"      fill={INSECT_CHART_COLORS.mosquitoes} isAnimationActive={false}>
                        <LabelList dataKey="mosquitoes" position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="ants"       name="มด"       fill={INSECT_CHART_COLORS.ants} isAnimationActive={false}>
                        <LabelList dataKey="ants"       position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="others"     name="อื่นๆ"   fill={INSECT_CHART_COLORS.others} isAnimationActive={false}>
                        <LabelList dataKey="others"     position="top" formatter={(v) => (v < 0.1 ? '0' : v)} style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* QA Narrative Report Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider">วิเคราะห์ข้อมูลประจำเดือนด้วย AI</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-400/15 border border-yellow-400/30 text-[10px] font-bold text-yellow-700 dark:text-yellow-400">✨ Gemini AI</span>
              </div>
              <button
                onClick={() => {
                  setDeptReportText('');
                  setDeptReportLoading(true);
                  const beYear = parseInt(selectedYear, 10) + 543;
                  fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      deptName: selectedDept,
                      month: selectedMonth,
                      year: selectedYear,
                      records: rawData,
                      isDemo: isDemo
                    })
                  }).then(r => r.ok ? r.json() : null)
                    .then(result => {
                      if (result?.report) { setDeptReportText(result.report); }
                      else { setDeptReportText(getDeptAnalysisReport(selectedDept, selectedMonth, beYear)); }
                      setDeptReportLoading(false);
                    })
                    .catch(() => {
                      const beYear2 = parseInt(selectedYear, 10) + 543;
                      setDeptReportText(getDeptAnalysisReport(selectedDept, selectedMonth, beYear2));
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

          {/* ── Dual Sign-off Panel ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Form 1: Department Supervisor */}
            <SignOffCard
              title="✍️ ลงนามรับทราบข้อมูล (หัวหน้าแผนก)"
              accentColor="emerald"
              stampIcon="✅"
              stampLabel="[ตราประทับรับทราบข้อมูลประจำแผนก]"
              isApproved={supApproved}
              approvedAt={supApprovedAt}
              approverName={supApproverName}
              savedComment={supComment}
              canSign={canSignSup}
              signerName={currentUser?.full_name || '—'}
              signerRole={currentUser?.role || 'Department Supervisor'}
              commentId="sup-comment-input"
              onApprove={handleSupApprove}
              onReset={handleSupReset}
            />

            {/* Form 2: QA Manager */}
            <SignOffCard
              title="✍️ ลงนามรับทราบข้อมูล (หัวหน้าฝ่ายประกันคุณภาพ)"
              accentColor="blue"
              stampIcon="🛡️"
              stampLabel="[ตราประทับรับทราบข้อมูลฝ่ายประกันคุณภาพ]"
              isApproved={qaApproved}
              approvedAt={qaApprovedAt}
              approverName={qaApproverName}
              savedComment={qaComment}
              canSign={canSignQA}
              signerName={currentUser?.full_name || '—'}
              signerRole={currentUser?.role || 'QA Manager'}
              commentId="qa-comment-input"
              onApprove={handleQaApprove}
              onReset={handleQaReset}
            />

          </div>

          {/* ── Combined status footer ── */}
          <div className={`rounded-3xl border-2 px-5 py-4 flex items-center gap-3 ${
            supApproved && qaApproved
              ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50'
          }`}>
            <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${supApproved && qaApproved ? 'text-emerald-500' : 'text-slate-400'}`} />
            <div>
              <p className={`text-xs font-extrabold ${supApproved && qaApproved ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                {supApproved && qaApproved
                  ? '✅ รายงานได้รับการรับทราบครบทั้งสองฝ่ายแล้ว'
                  : `สถานะรายงาน: แผนก ${supApproved ? '✓' : '⏳'} · ฝ่าย QA ${qaApproved ? '✓' : '⏳'}`}
              </p>
              {(supApproved || qaApproved) && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {supApproved && !qaApproved && 'รอการรับทราบจากฝ่ายประกันคุณภาพ'}
                  {!supApproved && qaApproved && 'รอการรับทราบจากหัวหน้าแผนก'}
                  {supApproved && qaApproved && 'กระบวนการรับทราบรายงานสมบูรณ์'}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
