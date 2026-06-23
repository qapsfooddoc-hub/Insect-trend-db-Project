'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Layers, ShieldCheck, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList
} from 'recharts';

// ─── Department / Trap mapping ─────────────────────────────────────────────────
const DEPTS_LIST = [
  'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด', 'เฟส 6',
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
  
  const order = ['flies', 'mosquitoes', 'ants', 'others'];
  const orderedItems = [...payload].sort((a, b) => {
    return order.indexOf(a.dataKey) - order.indexOf(b.dataKey);
  });
  
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
          fontSize: '11px',
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
              className="rounded-sm inline-block shrink-0 shadow-sm" 
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
                  <span className="font-extrabold font-mono text-slate-200">{entry.value} ตัว</span>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SupervisorPortal() {
  const [rawData, setRawData]       = useState([]);
  const [isDemo, setIsDemo]         = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Chart filters
  const [selectedDept, setSelectedDept]   = useState('โรงฆ่า');
  const [selectedMonth, setSelectedMonth] = useState('มกราคม');

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
        try { setCurrentUser(JSON.parse(saved)); } catch {}
      } else {
        setCurrentUser(null);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();

    syncCurrentUser();
    window.addEventListener('currentSimulatedUserChanged', syncCurrentUser);
    return () => window.removeEventListener('currentSimulatedUserChanged', syncCurrentUser);
  }, []);

  // Sync Sign-off Data for Selected Department and Month
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `approval_${selectedDept}_${selectedMonth}_2569`;
      
      // If demo mode is active and it's 'โรงฆ่า' and 'มกราคม', initialize it as pre-approved
      if (isDemo && selectedDept === 'โรงฆ่า' && selectedMonth === 'มกราคม') {
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
  }, [selectedDept, selectedMonth, isDemo]);

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

  const fetchData = async () => {
    try {
      const res = await fetch('/api/inspection');
      const result = await res.json();
      if (res.ok) { setRawData(result.data || []); setIsDemo(result.isDemo || false); }
    } catch {}
  };

  // ── Chart data ──
  const getChartData = (deptName, month) => {
    if (isDemo || rawData.length === 0) return genMockTrapData(deptName, month, '2026');
    const traps = DEPT_TRAPS_MAPPING[deptName] || [];
    const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return traps.map(trap => {
      const totals = { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
      const othersBreakdown = {};
      
      rawData.forEach(item => {
        const d = new Date(item.inspected_at);
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
    
    if (yearText === '2569') {
      const reportsMap = {
        'กุมภาพันธ์': {
          'โรงฆ่า': 'จากการตรวจนับจำนวนแมลง ของทีมโรงฆ่า ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลงหมายเลข 11 (ห้องเลือด) พบแมลงวันติดมากที่สุด เครื่องดักแมลง 10 (ลานโหลดสินค้าห้องเลือด) พบยุงติดมากที่สุด และเครื่องดักแมลงหมายเลข 12 (ห้องช็อต/แทงคอ/ลวกซาก) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากเครื่องหมายเลข 10 ติดตั้งอยู่ในจุดที่ใกล้ลานโหลดสินค้า ซึ่งมีการเปิดปิด ประตูเป็นประจำ จึงทำให้พบแมลงวันและแมลงอื่น ๆ มากกว่าบริเวณอื่น ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำ ไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'โหลด': 'จากการตรวจนับจำนวนแมลง ของทีมโหลดสินค้า เฟส 5 ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลง 01 (ลานโหลดของตัดแต่งและ Makro) พบแมลงวัน ยุง และแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากเครื่องหมายเลข 01 ติดตั้งอยู่ในจุดที่ใกล้ลานโหลดสินค้า ซึ่งมีการเปิด-ปิ ด ประตูเป็นประจำ ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่าง ๆ บินเข้าสู่พื้นที่การผลิตได้',
          'หมูบด': 'จากการตรวจนับจำนวนแมลง ของทีมหมูบด ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลง 20 (ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องจากเป็นทางเข้า-ออกของพนักงาน เชื่อมต่อกับนอกพื้นที่การผลิตเป็นโถงทางเดิน และห้องแต่งตัว ซึ่งอาจทำให้มีแมลงบินเข้าพื้นที่ได้ ดังนั้นควรเน้นปิดม่านประตูและหน้าต่างทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'อนามัย': 'จากการตรวจนับจำนวนแมลง ของทีมอนามัย ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลงหมายเลข 33 (บันไดทางขึ้นชั้น 2) พบแมลงวันติดที่สุด เครื่องดักแมลง 25 (ทางเข้า Slice ถาด) พบยุง มด และแมลงอื่น ๆ ติดมากที่สุด ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดหน้าต่าง ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'เฟส 6': 'จากการตรวจนับจำนวนแมลง ของทีมเฟส 6 ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลงหมายเลข 15 (ห้อง Pack C) พบยุงติดมากที่สุด และเครื่องดักแมลงหมายเลข 13 (ห้อง Pack A บริเวณหน้าประตูทางเชื่อมอาคาร) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากบริเวณห้อง Pack C อยู่ใกล้กับห้องที่เชื่อมต่อทางเข้าออก จากพื้นที่การผลิต และห้องชาร์จโฟล์คลิฟท์ ดังนั้นควรปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อลดจำนวนแมลงบินต่าง ๆ ไม่ให้เข้าสู่พื้นที่การผลิตได้',
          'ตัดแต่ง': 'จากการตรวจนับจำนวนแมลง ของทีมตัดแต่ง ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลง 05 (ห้องตัดแต่ง บริเวณเลนมันและหนัง) พบแมลงวัน ยุง และแมลงอื่น ๆ มากที่สุด ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'คลัง3': 'จากการตรวจนับจำนวนแมลง ของทีมคลังสินค้า 3 ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลง 16 (ห้อง Packing สินค้า Frozen คลัง 3) พบแมลงวัน 4 ตัว ยุงจำนวน 35 ตัว แมลงอื่น ๆ 4 ตัว และไม่พบมด ดังนั้นควรเน้นปิดม่านและประตูทุกครั้งภายหลังจากการใช้งาน ตรวจสอบสภาพม่านพลาสติกให้มีความสมบูรณ์เสมอ เน้นทำความสะอาดพื้นที่การผลิตและให้บริษัทกำจัดแมลงเข้ามาให้บริการเพื่อลดจำนวนแมลงบินต่างๆ ในพื้นที่การผลิต',
          'Slice ผลิต': 'จากการตรวจนับจำนวนแมลง ของทีม Slice ผลิต ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลง 28 (ทางเดินไปห้องถุง Slice ชั้น 3) พบแมลงวัน และแมลงอื่นๆ ติดมากที่สุด อาจเนื่องจากบริเวณดังกล่าว เชื่อมต่อกับนอกพื้นที่การผลิต ใกล้กับประตูทางเข้า-ออก พื้นที่การผลิต อาจทำให้แมลงบินเข้าสู่พื้นที่การผลิตได้ ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'ล้างตะกร้า': 'จากการตรวจนับจำนวนแมลง ของทีมล้างตะกร้า เฟส 5 ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลง 32 (ห้องสายพานลำเลียงตะกร้า) พบจำนวนแมลงวัน มีจำนวนเท่ากับ 0 ตัว จำนวนยุงที่พบมีจำนวน 0 ตัว จำนวนมดที่พบมีจำนวนเท่ากับ 0 ตัว และจำนวนแมลงอื่นๆ ที่พบมีจำนวนเท่ากับ 2 ตัว เนื่องจากพื้นที่นั้นเป็นพื้นที่ที่ตะกร้าจะเข้าพื้นที่การผลิต ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'หน้าร้านใหม่': 'จากการตรวจนับจำนวนแมลง ของทีมหน้าร้านใหม่ ประจำเดือน กุมภาพันธ์ 2569 พบว่า เครื่องดักแมลง 07 (ลานโหลดสินค้าหน้าร้าน) พบแมลงวัน 168 ตัว ยุงจำนวน 12 ตัว แมลงอื่น ๆ 43 ตัว และไม่พบมด ดังนั้นควรเน้นปิดม่านและประตูทุกครั้งภายหลังจากการใช้งาน ตรวจสอบสภาพม่านพลาสติกให้มีความสมบูรณ์เสมอ เน้นทำความสะอาดพื้นที่การผลิตและให้บริษัทกำจัดแมลงเข้ามาให้บริการเพื่อลดจำนวนแมลงบินต่างๆ ในพื้นที่การผลิต'
        },
        'มีนาคม': {
          'โรงฆ่า': 'จากการตรวจนับจำนวนแมลง ของทีมโรงฆ่า ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลงหมายเลข 11 (ห้องเลือด) พบแมลงวันติดมากที่สุด เครื่องดักแมลง 10 (ลานโหลดสินค้าห้องเลือด) พบยุงติดมากที่สุด และเครื่องดักแมลงหมายเลข 12 (ห้องช็อต/แทงคอ/ลวกซาก) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากเครื่องหมายเลข 10 ติดตั้งอยู่ในจุดที่ใกล้ลานโหลดสินค้า ซึ่งมีการเปิดปิด ประตูเป็นประจำ จึงทำให้พบแมลงวันและแมลงอื่น ๆ มากกว่าบริเวณอื่น ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'โหลด': 'จากการตรวจนับจำนวนแมลง ของทีมโหลดสินค้า เฟส 5 ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลง 01 (ลานโหลดของตัดแต่งและ Makro) พบแมลงวัน ยุง และแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากเครื่องหมายเลข 01 ติดตั้งอยู่ในจุดที่ใกล้ลานโหลดสินค้า ซึ่งมีการเปิด-ปิ ด ประตูเป็นประจำ ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่าง ๆ บินเข้าสู่พื้นที่การผลิตได้',
          'หมูบด': 'จากการตรวจนับจำนวนแมลง ของทีมหมูบด ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลง 20 (ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องจากเป็นทางเข้า-ออกของพนักงาน เชื่อมต่อกับนอกพื้นที่การผลิตเป็นโถงทางเดิน และห้องแต่งตัว ซึ่งอาจทำให้มีแมลงบินเข้าพื้นที่ได้ ดังนั้นควรเน้นปิดม่านประตูและหน้าต่างทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'อนามัย': 'จากการตรวจนับจำนวนแมลง ของทีมอนามัย ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลงหมายเลข 33 (บันไดทางขึ้นชั้น 2) พบแมลงวันติดที่สุด เครื่องดักแมลง 25 (ทางเข้า Slice ถาด) พบยุง และมด ติดมากที่สุด เครื่องดักแมลงหมายเลข 25 (ทางเข้า Slice ถาด) พบแมลงอื่น ๆ ติดมากที่สุด ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดหน้าต่าง ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'เฟส 6': 'จากการตรวจนับจำนวนแมลง ของทีมเฟส 6 ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลงหมายเลข 14 (ห้อง Pack A บริเวณหน้าห้องเก็บของบรรจุภัณฑ์) พบยุง และแมลงอื่น ๆ มีแนวโน้มลดลงจากสัปดาห์ก่อนหน้า ส่วนแมลงวัน และมด ไม่พบ ดังนั้นควรปิดม่านประตูทุกครั้งภายหลังจากการใช้งาน เพื่อลดจำนวนแมลงบินต่าง ๆ ไม่ให้เข้าสู่พื้นที่การผลิต และคงจำนวนแมลงให้เป็น 0 ต่อไป',
          'ตัดแต่ง': 'จากการตรวจนับจำนวนแมลง ของทีมตัดแต่ง ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลง 04 (ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น) พบ ยุงและแมลงอื่น ๆ มากที่สุด ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ รีดน้ำขังออกจากพื้นที่ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'คลัง3': 'จากการตรวจนับจำนวนแมลง ของทีมคลังสินค้า 3 ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลง 16 (ห้อง Packing สินค้า Frozen คลัง 3) พบแมลงวัน 2 ตัว ยุงจำนวน 9 ตัว แมลงอื่น ๆ 3 ตัว และไม่พบมด ดังนั้นควรเน้นปิดม่านและประตูทุกครั้งภายหลังจากการใช้งาน ตรวจสอบสภาพม่านพลาสติกให้มีความสมบูรณ์เสมอ เน้นทำความสะอาดพื้นที่การผลิตและให้บริษัทกำจัดแมลงเข้ามาให้บริการเพื่อลดจำนวนแมลงบินต่างๆ ในพื้นที่การผลิต',
          'Slice ผลิต': 'จากการตรวจนับจำนวนแมลง ของทีม Slice ผลิต ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลง 28 (ทางเดินไปห้องถุง Slice ชั้น 3) พบแมลงวันติดมากที่สุด เครื่องดักแมลง 27 (Slice ชั้น 3 พื้นที่การผลิต) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องจากพบจำนวนแมลงอื่นๆ ที่พบมีจำนวนเท่ากับ 31 ตัว เนื่องจากพื้นที่นั้นเป็นพื้นที่ที่ตะกร้าจะเข้าพื้นที่การผลิต ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'หน้าร้านใหม่': 'จากการตรวจนับจำนวนแมลง ของทีมหน้าร้านใหม่ ประจำเดือน มีนาคม 2569 พบว่า เครื่องดักแมลง 07 (ลานโหลดสินค้าหน้าร้าน) พบแมลงวัน 70 ตัว ยุงจำนวน 4 ตัว มดจำนวน 7 ตัว และแมลงอื่น ๆ 59 ตัว ดังนั้นควรเน้นปิดม่านและประตูทุกครั้งภายหลังจากการใช้งาน ตรวจสอบสภาพม่านพลาสติกให้มีความสมบูรณ์เสมอ เน้นทำความสะอาดพื้นที่การผลิตและให้บริษัทกำจัดแมลงเข้ามาให้บริการเพื่อลดจำนวนแมลงบินต่างๆ ในพื้นที่การผลิต'
        },
        'เมษายน': {
          'โรงฆ่า': 'จากการตรวจนับจำนวนแมลง ของทีมโรงฆ่า ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 10 (ลานโหลดสินค้าห้องเลือด) พบแมลงวันและยุงติดมากที่สุด และเครื่องดักแมลงหมายเลข 12 (ห้องช็อต/แทงคอ/ลวกซาก) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากเครื่องหมายเลข 10 ติดตั้งอยู่ในจุดที่ใกล้ลานโหลดสินค้า ซึ่งมีการเปิดปิด ประตูเป็นประจำ จึงทำให้พบแมลงวันและยุง มากกว่าบริเวณอื่น ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'โหลด': 'จากการตรวจนับจำนวนแมลง ของทีมโหลดสินค้า เฟส 5 ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 01 (ลานโหลดของตัดแต่งและ Makro) พบแมลงวัน ยุง และแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากเครื่องหมายเลข 01 ติดตั้งอยู่ในจุดที่ใกล้ลานโหลดสินค้า ซึ่งมีการเปิด-ปิ ด ประตูเป็นประจำ ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่าง ๆ บินเข้าสู่พื้นที่การผลิตได้',
          'หมูบด': 'จากการตรวจนับจำนวนแมลง ของทีมหมูบด ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 20 (ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องจากเป็นทางเข้า-ออกของพนักงาน เชื่อมต่อกับนอกพื้นที่การผลิตเป็นโถงทางเดิน และห้องแต่งตัว ซึ่งอาจทำให้มีแมลงบินเข้าพื้นที่ได้ ดังนั้นควรเน้นปิดม่านประตูและหน้าต่างทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'อนามัย': 'จากการตรวจนับจำนวนแมลง ของทีมอนามัย ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลงหมายเลข 33 (บันไดทางขึ้นชั้น 2) พบแมลงวันติดมากที่สุด เครื่องดักแมลง 24 (ห้องซักผ้า คลัง 4) พบยุง มด และแมลงอื่น ๆ ติดมากที่สุด ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดหน้าต่าง ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'เฟส 6': 'จากการตรวจนับจำนวนแมลง ของทีมเฟส 6 ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลงหมายเลข 14 (ห้อง Pack A บริเวณหน้าห้องเก็บของบรรจุภัณฑ์) พบยุงและแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องมาจากบริเวณห้อง Pack C อยู่ใกล้กับห้องที่เชื่อมต่อทางเข้าออก จากพื้นที่การผลิต และห้องชาร์จโฟล์คลิฟท์ ดังนั้นควรปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'ตัดแต่ง': 'จากการตรวจนับจำนวนแมลง ของทีมตัดแต่ง ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 04 (ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น) พบแมลงวัน ยุง และแมลงอื่น ๆ มากที่สุด ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'คลัง3': 'จากการตรวจนับจำนวนแมลง ของทีมคลังสินค้า 3 ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 16 (ห้อง Packing สินค้า Frozen คลัง 3) พบแมลงวัน 1 ตัว ยุงจำนวน 8 ตัว แมลงอื่น ๆ 30 ตัว และไม่พบมด ดังนั้นควรเน้นปิดม่านและประตูทุกครั้งภายหลังจากการใช้งาน ตรวจสอบสภาพม่านพลาสติกให้มีความสมบูรณ์เสมอ เน้นทำความสะอาดพื้นที่การผลิตและให้บริษัทกำจัดแมลงเข้ามาให้บริการเพื่อลดจำนวนแมลงบินต่างๆ ในพื้นที่การผลิต',
          'Slice ผลิต': 'จากการตรวจนับจำนวนแมลง ของทีม Slice ผลิต ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 27 (Slice ชั้น 3 พื้นที่การผลิต) พบแมลงอื่น ๆ ติดมากที่สุด อาจเนื่องจากบริเวณดังกล่าว เชื่อมต่อกับนอกพื้นที่การผลิต ใกล้กับประตูทางเข้า-ออก พื้นที่การผลิต อาจทำให้แมลงบินเข้าสู่พื้นที่การผลิตได้ ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'ล้างตะกร้า': 'จากการตรวจนับจำนวนแมลง ของทีมล้างตะกร้า เฟส 5 ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 32 (ห้องสายพานลำเลียงตะกร้า) พบจำนวนแมลงวัน มีจำนวนเท่ากับ 0 ตัว จำนวนยุงที่พบมีจำนวน 0 ตัว จำนวนมดที่พบมีจำนวนเท่ากับ 0 ตัว และจำนวนแมลงอื่นๆ ที่พบมีจำนวนเท่ากับ 51 ตัว เนื่องจากพื้นที่นั้นเป็นพื้นที่ที่ตะกร้าจะเข้าพื้นที่การผลิต ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากการใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
          'หน้าร้านใหม่': 'จากการตรวจนับจำนวนแมลง ของทีมหน้าร้านใหม่ ประจำเดือน เมษายน 2569 พบว่า เครื่องดักแมลง 07 (ลานโหลดสินค้าหน้าร้าน) พบแมลงวัน 33 ตัว ยุงจำนวน 4 ตัว มดจำนวน 7 ตัว และแมลงอื่น ๆ 93 ตัว ดังนั้นควรเน้นปิดม่านและประตูทุกครั้งภายหลังจากการใช้งาน ตรวจสอบสภาพม่านพลาสติกให้มีความสมบูรณ์เสมอ เน้นทำความสะอาดพื้นที่การผลิตและให้บริษัทกำจัดแมลงเข้ามาให้บริการเพื่อลดจำนวนแมลงบินต่างๆ ในพื้นที่การผลิต'
        }
      };

      if (reportsMap[month] && reportsMap[month][deptName]) {
        return reportsMap[month][deptName];
      }
    }

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
    
    const key = `approval_${selectedDept}_${selectedMonth}_2569`;
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
    localStorage.setItem(`monthStatus_${selectedMonth}_2026`, status);
    
    if (el) el.value = '';
  };

  const handleSupReset = () => {
    if (!confirm('ยืนยันการยกเลิกการลงนามรับทราบ (Supervisor)?')) return;
    setSupApproved(false); setSupApprovedAt(''); setSupApproverName(''); setSupComment('');
    
    const key = `approval_${selectedDept}_${selectedMonth}_2569`;
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
    localStorage.setItem(`monthStatus_${selectedMonth}_2026`, status);
  };

  // ── Handlers: QA ──
  const handleQaApprove = () => {
    const el = document.getElementById('qa-comment-input');
    const now = new Date().toLocaleString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const name = currentUser?.full_name || 'QA Manager';
    const cmt = el?.value || '-';
    
    setQaApproved(true); setQaApprovedAt(now); setQaApproverName(name); setQaComment(cmt);
    
    const key = `approval_${selectedDept}_${selectedMonth}_2569`;
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
    localStorage.setItem(`monthStatus_${selectedMonth}_2026`, status);
    
    if (el) el.value = '';
  };

  const handleQaReset = () => {
    if (!confirm('ยืนยันการยกเลิกการลงนามรับทราบ (QA)?')) return;
    setQaApproved(false); setQaApprovedAt(''); setQaApproverName(''); setQaComment('');
    
    const key = `approval_${selectedDept}_${selectedMonth}_2569`;
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
    localStorage.setItem(`monthStatus_${selectedMonth}_2026`, status);
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
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer"
                >
                  {['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[450px] w-full text-xs font-bold overflow-x-auto scrollbar-thin pb-2">
              {mounted && (
                <div className="h-full min-w-[1300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData(selectedDept, selectedMonth)} margin={{ top: 30, right: 10, left: -10, bottom: 75 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} style={{ fontFamily: 'inherit' }} interval={0} height={40}
                        tick={<CustomTick />} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} style={{ fontFamily: 'inherit' }}
                        label={{ value: 'จำนวน (ตัว)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 11, fontWeight: 'bold', fill: '#475569', fontFamily: 'inherit' } }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<RenderCustomLegend />} wrapperStyle={{ bottom: 0, left: 0, width: '100%' }} />
                      <Bar dataKey="flies"      name="แมลงวัน" fill={INSECT_CHART_COLORS.flies}>
                        <LabelList dataKey="flies"      position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="mosquitoes" name="ยุง"      fill={INSECT_CHART_COLORS.mosquitoes}>
                        <LabelList dataKey="mosquitoes" position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="ants"       name="มด"       fill={INSECT_CHART_COLORS.ants}>
                        <LabelList dataKey="ants"       position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                      <Bar dataKey="others"     name="อื่นๆ"   fill={INSECT_CHART_COLORS.others}>
                        <LabelList dataKey="others"     position="top" style={{ fill: '#475569', fontSize: 9, fontWeight: 'bold', fontFamily: 'inherit' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* QA Narrative Report Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>📝 วิเคราะห์ข้อมูลประจำเดือน</span>
            </h4>
            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
              {getDeptAnalysisReport(selectedDept, selectedMonth, 2569)}
            </p>
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
