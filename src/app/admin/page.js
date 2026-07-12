'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Pencil, Trash2, RefreshCw, Plus, Sparkles, 
  Calendar, Save, Trash, AlertCircle, PlusCircle, Check,
  Download, Copy, ShieldAlert, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, CartesianGrid, 
  XAxis, YAxis, Tooltip, Legend, LabelList 
} from 'recharts';

const DEPTS_LIST = [
  'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'เฟส 6', 
  'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
];

const DEPT_TRAPS_MAPPING = {
  'หน้าร้านใหม่': ['(07) ลานโหลดสินค้าหน้าร้าน'],
  'โรงฆ่า': [
    '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน',
    '(09) ทางเข้าผ่าซาก/เครื่องในแดง/เครื่องในขาว',
    '(10) ลานโหลดสินค้าห้องเลือด',
    '(11) ห้องเลือด',
    '(12) ห้องช็อต/แทงคอ/ลวกซาก',
    '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน'
  ],
  'ตัดแต่ง': [
    '(03) ห้องตัดแต่ง บริเวณทางหนีไฟ',
    '(04) ห้องตัดแต่ง บริเวณเสากลาง',
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
  flies: '#0f5b84',      // Deep Teal/Blue
  mosquitoes: '#e452cd', // Bright Orchid Pink
  ants: '#fcc214',       // Golden Yellow
  others: '#78c843'      // Pastel Green
};

const mapZeroToTinyDecimal = (data) => {
  if (!data) return [];
  return data.map(item => ({
    ...item,
    flies: item.flies === 0 ? 0.0001 : item.flies,
    mosquitoes: item.mosquitoes === 0 ? 0.0001 : item.mosquitoes,
    ants: item.ants === 0 ? 0.0001 : item.ants,
    others: item.others === 0 ? 0.0001 : item.others,
  }));
};

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

function RenderCustomLegend(props) {
  const { payload, hideTitle } = props;
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
      {!hideTitle && (
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
      )}
      
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

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg border border-slate-800 text-[10px] font-bold">
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span>{p.name}: {p.value === 0.0001 ? 0 : Math.round(p.value)} ตัว</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const renderCustomLabelWithThreshold = (threshold) => (props) => {
  const { x, y, width, value } = props;
  if (value === undefined || value < 0.1) return null;
  const isOver = Math.round(value) > threshold;
  const roundedValue = Math.round(value);
  
  const textLen = String(roundedValue).length;
  const offsetOffset = textLen === 1 ? 12 : textLen === 2 ? 16 : 20;
  
  return (
    <g>
      <text
        x={x + width / 2}
        y={y - 8}
        fill="#475569"
        textAnchor="middle"
        fontSize={10}
        fontWeight="bold"
      >
        {roundedValue}
      </text>
      {isOver && (
        <g transform={`translate(${x + width / 2 + offsetOffset}, ${y - 12})`}>
          <circle cx={0} cy={0} r={7.5} fill="#ef4444" />
          <circle cx={0} cy={0} r={6.5} fill="#ffffff" />
          <text
            x={0}
            y={2.5}
            fill="#ef4444"
            fontSize={8}
            fontWeight="black"
            textAnchor="middle"
            fontStyle="italic"
          >
            F-
          </text>
        </g>
      )}
    </g>
  );
};


const getAvailableYearsForPresentation = (allInspections, isDemoMode) => {
  if (isDemoMode || !allInspections || allInspections.length === 0) {
    return ['2026', '2025'];
  }
  
  const yearsSet = new Set();
  allInspections.forEach(item => {
    if (item.inspected_at) {
      const year = item.inspected_at.split('-')[0];
      const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
      const hasApprovedMonth = months.some(m => {
        if (typeof window === 'undefined') return false;
        const status = localStorage.getItem(`monthStatus_${m}_${year}`) || 'Draft';
        return status === 'Approved' || status === 'Pending';
      });
      
      const isHistorical = parseInt(year, 10) < 2026;
      
      if (hasApprovedMonth || isHistorical) {
        yearsSet.add(year);
      }
    }
  });
  
  const arr = Array.from(yearsSet).sort().reverse();
  return arr.length > 0 ? arr : ['2026'];
};

const getAvailableMonthsForPresentation = (year, allInspections, isDemoMode) => {
  const allMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  if (isDemoMode || !allInspections || allInspections.length === 0) {
    return allMonths;
  }
  
  return allMonths.filter(m => {
    const isHistorical = parseInt(year, 10) < 2026 || (parseInt(year, 10) === 2026 && allMonths.indexOf(m) < 5);
    if (isHistorical) return true;
    
    if (typeof window === 'undefined') return false;
    const status = localStorage.getItem(`monthStatus_${m}_${year}`) || 'Draft';
    return status === 'Approved' || status === 'Pending';
  });
};

const cleanTrapName = (fullName) => {
  if (!fullName) return { number: '-', area: '-' };
  let name = fullName.replace(/^[^:]+:\s*/, '');
  const match = name.match(/^\((\d+)\)\s*(.*)$/);
  if (match) {
    return {
      number: match[1],
      area: match[2].trim()
    };
  }
  return {
    number: '-',
    area: name
  };
};

const generatePresentationSummary = (chartData) => {
  const summaries = chartData
    .map(item => {
      const { name, flies, mosquitoes, ants, others } = item;
      const { number, area } = cleanTrapName(name);
      
      const exceededList = [];
      if (flies > 30) exceededList.push(`แมลงวัน ${flies} ตัว`);
      if (mosquitoes > 50) exceededList.push(`ยุง ${mosquitoes} ตัว`);
      if (ants > 10) exceededList.push(`มด ${ants} ตัว`);
      if (others > 100) exceededList.push(`แมลงอื่นๆ ${others} ตัว`);
      
      if (exceededList.length === 0) return null;
      
      let insectText = '';
      if (exceededList.length === 1) {
        insectText = exceededList[0];
      } else if (exceededList.length === 2) {
        insectText = `${exceededList[0]} และ ${exceededList[1]}`;
      } else {
        const initial = exceededList.slice(0, -1).join(', ');
        const last = exceededList[exceededList.length - 1];
        insectText = `${initial} และ ${last}`;
      }
      
      return `เครื่องดักแมลงหมายเลข ${number} (${area}) พบ ${insectText}`;
    })
    .filter(Boolean);
    
  if (summaries.length === 0) {
    return 'ไม่มีเครื่องดักแมลงที่ตรวจพบจำนวนแมลงเกินเกณฑ์ที่กำหนดในเดือนนี้';
  }
  
  return summaries.join('\n');
};

const getDeptDetailedDataForPresentation = (deptName, month, year, allInspections, isDemoMode) => {
  const traps = DEPT_TRAPS_MAPPING[deptName] || [];
  
  const hasDataForFilter = allInspections.some(item => {
    if (!item.inspected_at) return false;
    const date = new Date(item.inspected_at);
    const itemYear = String(date.getFullYear());
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const itemMonthName = months[date.getMonth()];
    return itemYear === year && itemMonthName === month;
  });

  if (isDemoMode || !hasDataForFilter || allInspections.length === 0) {
    // General mock data generator
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
        others
      };
    });
  }

  // Real data aggregation from allInspections
  return traps.map(trap => {
    const label = trap;
    const totals = { flies: 0, mosquitoes: 0, ants: 0, others: 0 };
    
    allInspections.forEach(item => {
      if (!item.inspected_at) return;
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

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'inspections', 'approvals', or 'presentation'
  


  // --- USER MANAGEMENT STATES ---
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Operator');
  const [department, setDepartment] = useState('โรงฆ่า');
  const [customDept, setCustomDept] = useState('');
  const [showCustomDeptInput, setShowCustomDeptInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- INSPECTION MANAGEMENT STATES ---
  const [allInspections, setAllInspections] = useState([]);
  const [selectedInspectionDept, setSelectedInspectionDept] = useState('โรงฆ่า');
  const [selectedInspectionDate, setSelectedInspectionDate] = useState('');
  const [inspectionRows, setInspectionRows] = useState([]);

  // --- MONTHLY APPROVAL STATES ---
  const [selectedApprovalYear, setSelectedApprovalYear] = useState('2026');
  const [selectedApprovalMonth, setSelectedApprovalMonth] = useState('มกราคม');
  const [approvalStatus, setApprovalStatus] = useState('Draft');
  const [approvalCompleteness, setApprovalCompleteness] = useState({ submittedWeeks: [], requiredWeeks: 4, isComplete: false });
  
  // Others Breakdown Modal
  const [isOthersModalOpen, setIsOthersModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [modalItems, setModalItems] = useState([]);

  // Common UI states
  const [adminMessage, setAdminMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- PRESENTATION REPORT STATES ---
  const [selectedPresYear, setSelectedPresYear] = useState('2026');
  const [selectedPresMonth, setSelectedPresMonth] = useState('มกราคม');
  const [selectedPresDept, setSelectedPresDept] = useState('ตัดแต่ง');

  // Auto select latest approved/available month when tab or year changes
  useEffect(() => {
    if (activeTab === 'presentation') {
      const years = getAvailableYearsForPresentation(allInspections, isDemoMode);
      let yearToSet = selectedPresYear;
      if (years.length > 0 && !years.includes(selectedPresYear)) {
        yearToSet = years[0];
        setSelectedPresYear(yearToSet);
      }
      
      const months = getAvailableMonthsForPresentation(yearToSet, allInspections, isDemoMode);
      if (months.length > 0) {
        const latestMonth = months[months.length - 1];
        setSelectedPresMonth(latestMonth);
      }
    }
  }, [activeTab, selectedPresYear, allInspections, isDemoMode]);

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      setIsDemoMode(result.isDemo || false);
      if (result.isDemo) {
        const local = localStorage.getItem('users_profile_mock');
        if (local && JSON.parse(local).length >= 10) {
          setUsers(JSON.parse(local));
        } else {
          setUsers(result.data);
          localStorage.setItem('users_profile_mock', JSON.stringify(result.data));
        }
      } else {
        setUsers(result.data || []);
      }
    } catch (err) {
      console.error(err);
      const local = localStorage.getItem('users_profile_mock');
      if (local) setUsers(JSON.parse(local));
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Inspections
  const fetchInspections = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inspection');
      const result = await res.json();
      if (res.ok && result.data) {
        setAllInspections(result.data);
      }
    } catch (err) {
      console.error('Error fetching inspections:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownloadChart = async (containerId, fileName) => {
    if (typeof window === 'undefined') return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById(containerId);
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export chart image:', err);
    }
  };

  const handleCopySummary = (text) => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(text);
    setAdminMessage({ text: 'คัดลอกข้อความสรุปวิเคราะห์ลงคลิปบอร์ดแล้ว!', type: 'success' });
    setTimeout(() => setAdminMessage({ text: '', type: '' }), 3000);
  };

  const syncCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentSimulatedUser');
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {}
      } else {
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchUsers();
    fetchInspections();

    syncCurrentUser();
    window.addEventListener('currentSimulatedUserChanged', syncCurrentUser);
    return () => {
      window.removeEventListener('currentSimulatedUserChanged', syncCurrentUser);
    };
  }, []);

  // Auto-refresh when tab changes
  useEffect(() => {
    if (activeTab === 'inspections' || activeTab === 'presentation') {
      fetchInspections();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  // --- MONTHLY COMPLETENESS & APPROVAL LOGIC ---
  const getRequiredWeeksCount = (year, month) => {
    return 4; // Always 4 weeks per month to align with YoY dashboard chart
  };

  const getWeekOfMonth = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4; // Group everything day > 21 into week 4
  };

  const isAutoApprovedDate = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return d < new Date('2026-06-01');
  };

  useEffect(() => {
    if (mounted && selectedApprovalYear && selectedApprovalMonth) {
      const year = parseInt(selectedApprovalYear, 10);
      const months = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      const monthIdx = months.indexOf(selectedApprovalMonth);
      const statusKey = `monthStatus_${selectedApprovalMonth}_${year}`;
      let currentStatus = localStorage.getItem(statusKey);
      
      // Auto-approved if before June 1, 2026 (BE 2569 / 2026 AD)
      const isPastData = new Date(year, monthIdx, 15) < new Date('2026-06-01');
      if (isPastData) {
        currentStatus = 'Approved';
        localStorage.setItem(statusKey, 'Approved');
      } else if (!currentStatus) {
        currentStatus = 'Draft';
        localStorage.setItem(statusKey, 'Draft');
      }
      
      setApprovalStatus(currentStatus);
      
      const required = getRequiredWeeksCount(year, monthIdx);
      const uniqueDates = new Set();
      allInspections.forEach(item => {
        const itemDate = new Date(item.inspected_at);
        if (itemDate.getFullYear() === year && itemDate.getMonth() === monthIdx) {
          uniqueDates.add(item.inspected_at);
        }
      });
      
      const weeksMap = { 1: false, 2: false, 3: false, 4: false, 5: false };
      uniqueDates.forEach(dStr => {
        const wNum = getWeekOfMonth(dStr);
        weeksMap[wNum] = true;
      });
      
      const submittedWeeksList = [];
      for (let w = 1; w <= required; w++) {
        if (weeksMap[w]) {
          submittedWeeksList.push(w);
        }
      }
      
      setApprovalCompleteness({
        submittedWeeks: submittedWeeksList,
        requiredWeeks: required,
        isComplete: submittedWeeksList.length >= required
      });
    }
  }, [selectedApprovalYear, selectedApprovalMonth, allInspections, mounted]);

  const handleSendApprovalReport = () => {
    if (typeof window !== 'undefined') {
      const year = parseInt(selectedApprovalYear, 10);
      const statusKey = `monthStatus_${selectedApprovalMonth}_${year}`;
      
      localStorage.setItem(statusKey, 'Pending');
      setApprovalStatus('Pending');
      setAdminMessage({ text: `ส่งรายงานประจำเดือน ${selectedApprovalMonth} ${year + 543} ให้หัวหน้าอนุมัติเรียบร้อยแล้ว!`, type: 'success' });
      
      // Clear message after 4s
      setTimeout(() => {
        setAdminMessage({ text: '', type: '' });
      }, 4000);
    }
  };

  // Clear admin message after 4 seconds
  useEffect(() => {
    if (adminMessage.text) {
      const timer = setTimeout(() => {
        setAdminMessage({ text: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [adminMessage.text]);

  // Load inspection rows for selected department and date
  const handleLoadInspectionData = () => {
    if (!selectedInspectionDept || !selectedInspectionDate) {
      setInspectionRows([]);
      return;
    }

    const areas = DEPT_TRAPS_MAPPING[selectedInspectionDept] || [];
    const targetDate = selectedInspectionDate;

    // Filter matching date & department
    const matchingRecords = allInspections.filter(item => {
      if (item.inspected_at !== targetDate) return false;
      const parts = item.area.split(': ');
      return parts[0] === selectedInspectionDept;
    });

    const rows = areas.map(areaName => {
      const areaFull = `${selectedInspectionDept}: ${areaName}`;
      const recordsForArea = matchingRecords.filter(r => r.area === areaFull);

      const row = {
        area: areaName,
        flies: '',
        mosquitoes: '',
        ants: '',
        others: '',
        othersDetails: []
      };

      recordsForArea.forEach(r => {
        const type = r.insect_type.toLowerCase();
        const count = r.count;
        if (type.includes('flies') || type.includes('แมลงวัน')) row.flies = count;
        else if (type.includes('mosquitoes') || type.includes('ยุง')) row.mosquitoes = count;
        else if (type.includes('ants') || type.includes('มด')) row.ants = count;
        else if (type.includes('others') || type.includes('แมลงอื่นๆ')) {
          row.others = count;
          let detailsList = [];
          if (r.details) {
            try {
              detailsList = typeof r.details === 'string' ? JSON.parse(r.details) : r.details;
            } catch (e) {
              console.error('Failed to parse details:', e);
            }
          }
          row.othersDetails = detailsList || [];
        }
      });

      return row;
    });

    setInspectionRows(rows);
  };

  useEffect(() => {
    handleLoadInspectionData();
  }, [selectedInspectionDept, selectedInspectionDate, allInspections]);

  // Get unique dates available in database
  const getUniqueDates = () => {
    const dates = new Set();
    allInspections.forEach(item => {
      if (item.inspected_at) {
        dates.add(item.inspected_at);
      }
    });
    return [...dates].sort((a, b) => new Date(b) - new Date(a));
  };

  // --- USER FORM HANDLERS ---
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!fullName || !username || !password) {
      setAdminMessage({ text: 'กรุณากรอกข้อมูลให้ครบถ้วน', type: 'error' });
      return;
    }
    
    const targetDept = showCustomDeptInput ? customDept.trim() : department;
    if (!targetDept) {
      setAdminMessage({ text: 'กรุณาระบุแผนก', type: 'error' });
      return;
    }

    const payload = {
      action: isEditing ? 'update' : 'create',
      id: userId || undefined,
      full_name: fullName,
      username: username,
      password: password,
      role: role,
      department: targetDept
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      
      if (res.ok) {
        if (result.isDemo) {
          let updatedUsers = [...users];
          if (isEditing) {
            updatedUsers = updatedUsers.map(u => u.id === userId ? { ...u, full_name: fullName, username, password, role, department: targetDept } : u);
          } else {
            const newUser = {
              id: 'mock-' + Date.now(),
              full_name: fullName,
              username,
              password,
              role,
              department: targetDept,
              created_at: new Date().toISOString()
            };
            updatedUsers.unshift(newUser);
          }
          setUsers(updatedUsers);
          localStorage.setItem('users_profile_mock', JSON.stringify(updatedUsers));
        } else {
          await fetchUsers();
        }
        
        setUserId('');
        setFullName('');
        setUsername('');
        setPassword('');
        setRole('Operator');
        setDepartment('โรงฆ่า');
        setCustomDept('');
        setShowCustomDeptInput(false);
        setIsEditing(false);
        setAdminMessage({ text: isEditing ? 'แก้ไขข้อมูลผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ', type: 'success' });
      } else {
        setAdminMessage({ text: result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAdminMessage({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', type: 'error' });
    }
  };

  const handleEditUser = (user) => {
    setUserId(user.id);
    setFullName(user.full_name);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    
    if (DEPTS_LIST.includes(user.department)) {
      setDepartment(user.department);
      setShowCustomDeptInput(false);
    } else {
      setDepartment('CUSTOM');
      setCustomDept(user.department);
      setShowCustomDeptInput(true);
    }
    
    setIsEditing(true);
    setAdminMessage({ text: 'กำลังแก้ไขข้อมูลผู้ใช้งาน: ' + user.full_name, type: 'info' });
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานนี้?')) return;
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });
      const result = await res.json();
      
      if (res.ok) {
        if (result.isDemo) {
          const updatedUsers = users.filter(u => u.id !== id);
          setUsers(updatedUsers);
          localStorage.setItem('users_profile_mock', JSON.stringify(updatedUsers));
        } else {
          await fetchUsers();
        }
        setAdminMessage({ text: 'ลบผู้ใช้งานสำเร็จ', type: 'success' });
      } else {
        setAdminMessage({ text: result.error || 'เกิดข้อผิดพลาดในการลบข้อมูล', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAdminMessage({ text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', type: 'error' });
    }
  };

  // --- INSPECTION EDIT HANDLERS ---
  const handleCellChange = (rowIndex, field, value) => {
    const updated = [...inspectionRows];
    if (value === '') {
      updated[rowIndex][field] = '';
    } else {
      const val = parseInt(value, 10);
      updated[rowIndex][field] = isNaN(val) ? '' : Math.max(0, val);
    }
    setInspectionRows(updated);
  };

  const handleOpenOthersModal = (rowIndex) => {
    setActiveRowIndex(rowIndex);
    setModalItems([...(inspectionRows[rowIndex].othersDetails || [])]);
    setIsOthersModalOpen(true);
  };

  const handleAddModalItem = () => {
    setModalItems([...modalItems, { name: '', count: 1 }]);
  };

  const handleModalItemChange = (idx, field, value) => {
    const updated = [...modalItems];
    if (field === 'count') {
      const val = parseInt(value, 10);
      updated[idx][field] = isNaN(val) ? 0 : Math.max(0, val);
    } else {
      updated[idx][field] = value;
    }
    setModalItems(updated);
  };

  const handleRemoveModalItem = (idx) => {
    setModalItems(modalItems.filter((_, itemIdx) => itemIdx !== idx));
  };

  const handleApplyModalItems = () => {
    if (activeRowIndex === null) return;
    const filtered = modalItems.filter(item => item.name.trim() !== '');
    const totalCount = filtered.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

    const updated = [...inspectionRows];
    updated[activeRowIndex].othersDetails = filtered;
    
    // Auto-update total "others" count if breakdown exists
    if (totalCount > 0) {
      updated[activeRowIndex].others = totalCount;
    }

    setInspectionRows(updated);
    setIsOthersModalOpen(false);
    setActiveRowIndex(null);
  };

  const handleSaveInspectionEdits = async () => {
    if (!selectedInspectionDept || !selectedInspectionDate) {
      setAdminMessage({ text: 'กรุณาระบุแผนกและวันที่ตรวจนับ', type: 'error' });
      return;
    }

    setIsLoading(true);

    const formattedRows = inspectionRows.map(r => ({
      area: `${selectedInspectionDept}: ${r.area}`,
      flies: r.flies === '' ? 0 : r.flies,
      mosquitoes: r.mosquitoes === '' ? 0 : r.mosquitoes,
      ants: r.ants === '' ? 0 : r.ants,
      others: r.others === '' ? 0 : r.others,
      othersDetails: r.othersDetails || []
    }));

    try {
      const res = await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          weekDate: selectedInspectionDate,
          rows: formattedRows
        })
      });
      const result = await res.json();
      
      if (res.ok) {
        setAdminMessage({ text: 'อัปเดตสถิติผลการตรวจนับสำเร็จเรียบร้อย!', type: 'success' });
        await fetchInspections();
      } else {
        setAdminMessage({ text: result.error || 'เกิดข้อผิดพลาดในการบันทึกสถิติ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAdminMessage({ text: 'เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInspectionEdits = async () => {
    if (!selectedInspectionDept || !selectedInspectionDate) return;
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบข้อมูลผลตรวจนับของแผนก "${selectedInspectionDept}" ในวันที่ "${selectedInspectionDate}" ทั้งหมด?\nการดำเนินการนี้จะลบข้อมูลออกถาวร!`)) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          weekDate: selectedInspectionDate,
          department: selectedInspectionDept
        })
      });
      const result = await res.json();
      
      if (res.ok) {
        setAdminMessage({ text: 'ลบข้อมูลผลการตรวจนับรอบนี้เรียบร้อยแล้ว!', type: 'success' });
        setInspectionRows([]);
        await fetchInspections();
      } else {
        setAdminMessage({ text: result.error || 'เกิดข้อผิดพลาดในการลบสถิติ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAdminMessage({ text: 'เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllDeptsInspectionEdits = async () => {
    if (!selectedInspectionDate) {
      setAdminMessage({ text: 'กรุณาระบุวันที่ที่ต้องการลบข้อมูล', type: 'error' });
      return;
    }
    if (!confirm(`⚠️ คำเตือน: คุณแน่ใจหรือไม่ที่จะลบข้อมูลผลตรวจนับของ "ทุกแผนก" ในวันที่ "${selectedInspectionDate}" ทั้งหมด?\nการดำเนินการนี้จะลบข้อมูลสถิติของทุกแผนกในรอบสัปดาห์นี้ออกถาวร!`)) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          weekDate: selectedInspectionDate,
          department: 'ALL'
        })
      });
      const result = await res.json();
      
      if (res.ok) {
        setAdminMessage({ text: `ลบข้อมูลผลตรวจนับของทุกแผนกในวันที่ ${selectedInspectionDate.split('-').reverse().join('/')} เรียบร้อยแล้ว!`, type: 'success' });
        setInspectionRows([]);
        await fetchInspections();
      } else {
        setAdminMessage({ text: result.error || 'เกิดข้อผิดพลาดในการลบสถิติ', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setAdminMessage({ text: 'เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์', type: 'error' });
    } finally {
      setIsLoading(false);
    }
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
              หน้านี้สำหรับผู้ดูแลระบบ (Admin) ในการจัดการบัญชีผู้ใช้งานระบบหลังบ้าน กรุณาเข้าสู่ระบบเพื่อเข้าถึงข้อมูลและดำเนินการ
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

  const userRoleLower = currentUser?.role?.toLowerCase() || '';
  const isAdmin = userRoleLower === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {!isAdmin ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl p-10 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
              🚫
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-red-655 dark:text-red-400 mb-2">
              ปฏิเสธการเข้าถึง - เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto mb-6 leading-relaxed">
              บัญชีปัจจุบันของคุณคือ <strong>{currentUser?.full_name || 'ไม่ระบุ'}</strong> (บทบาท: {currentUser?.role || 'พนักงานทั่วไป'}) ซึ่งไม่มีสิทธิ์เข้าใช้งานระบบจัดการผู้ใช้ระบบหลังบ้าน กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบเพื่อดำเนินการ
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
        ) : (
          <>
            {/* Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  ผู้จัดการระบบหลังบ้าน (Admin Portal)
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className={`px-4 py-2 border rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm bg-white dark:bg-slate-900 ${
                  isDemoMode 
                    ? 'border-amber-500/20 text-amber-600 dark:text-amber-400' 
                    : 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span>{isDemoMode ? 'เดโมโหมด (พรีเซนต์)' : 'ระบบจริงเชื่อมต่อแล้ว'}</span>
                </div>

                <button
                  onClick={activeTab === 'users' ? fetchUsers : fetchInspections}
                  disabled={isLoading}
                  className="p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 overflow-x-auto no-scrollbar pb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-indigo-650 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                👥 จัดการบัญชีผู้ใช้ระบบ ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('inspections')}
                className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeTab === 'inspections'
                    ? 'border-indigo-650 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                📝 แก้ไขปรับปรุงข้อมูลผลตรวจนับ
              </button>
              <button
                onClick={() => setActiveTab('approvals')}
                className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeTab === 'approvals'
                    ? 'border-indigo-650 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                🚀 ส่งอนุมัติรายงานประจำเดือน
              </button>
              <button
                onClick={() => setActiveTab('presentation')}
                className={`pb-2.5 px-4 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeTab === 'presentation'
                    ? 'border-indigo-650 text-indigo-650 dark:border-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                📊 ดึงข้อมูลทำรายงานนำเสนอ
              </button>
            </div>

            {/* Admin Alerts Panel */}
            {adminMessage.text && (
              <div className={`p-4 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 mb-6 ${
                adminMessage.type === 'success' 
                  ? 'bg-emerald-50/70 border-emerald-250 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' 
                  : adminMessage.type === 'error' 
                    ? 'bg-red-50/80 border-red-250 text-red-750 dark:bg-red-955/20 dark:border-red-900/50 dark:text-red-400' 
                    : 'bg-blue-50/80 border-blue-250 text-blue-750 dark:bg-blue-955/20 dark:border-blue-900/50 dark:text-blue-450'
              }`}>
                <span className="text-sm">
                  {adminMessage.type === 'success' ? '✅' : adminMessage.type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <p>{adminMessage.text}</p>
              </div>
            )}

            {activeTab === 'users' && (
              /* --- TAB 1: USERS MANAGEMENT --- */
              <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                {/* Form Side - Left Column (4 cols) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-4 h-fit">
                  <div>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                        {isEditing ? '✏️' : '👤'}
                      </div>
                      <h3 className="text-sm font-bold text-slate-850 dark:text-white">
                        {isEditing ? 'แก้ไขข้อมูลผู้ใช้ระบบ' : 'เพิ่มผู้ใช้งานระบบใหม่'}
                      </h3>
                    </div>

                    <form onSubmit={handleSaveUser} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">ชื่อ-นามสกุล พนักงาน</label>
                        <input
                          type="text"
                          placeholder="เช่น นายสมชาย รักดี"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Username / รหัสพนักงาน</label>
                        <input
                          type="text"
                          placeholder="สำหรับใช้ล็อกอินเข้าระบบ"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">Password</label>
                        <input
                          type="password"
                          placeholder="รหัสผ่านสำหรับล็อกอิน"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">ระดับสิทธิ์การเข้าใช้งาน</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-850 dark:text-slate-200"
                        >
                          <option value="Operator">Operator (ผู้กรอกข้อมูล)</option>
                          <option value="Department Supervisor">Department Supervisor (หัวหน้าแผนก)</option>
                          <option value="QA Manager">QA Manager (ผู้จัดการ QA)</option>
                          <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">แผนกที่สังกัด</label>
                        <select
                          value={showCustomDeptInput ? 'CUSTOM' : department}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'CUSTOM') {
                              setShowCustomDeptInput(true);
                              setDepartment('CUSTOM');
                            } else {
                              setShowCustomDeptInput(false);
                              setDepartment(val);
                            }
                          }}
                          className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-855 dark:text-slate-200 mb-2"
                        >
                          <option value="">-- เลือกแผนก --</option>
                          {DEPTS_LIST.map((d) => (
                            <option key={d} value={d}>แผนก {d}</option>
                          ))}
                          <option value="CUSTOM">อื่น ๆ (พิมพ์ระบุเอง)</option>
                        </select>

                        {showCustomDeptInput && (
                          <input
                            type="text"
                            placeholder="กรอกระบุแผนกใหม่ที่นี่..."
                            value={customDept}
                            onChange={(e) => setCustomDept(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200 animate-in slide-in-from-top-1 duration-200"
                            required
                          />
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-855">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2.5 bg-slate-950 text-white hover:bg-indigo-650 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer text-center"
                        >
                          {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกสร้างผู้ใช้งาน'}
                        </button>

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserId('');
                              setFullName('');
                              setUsername('');
                              setPassword('');
                              setRole('Operator');
                              setDepartment('โรงฆ่า');
                              setCustomDept('');
                              setShowCustomDeptInput(false);
                              setIsEditing(false);
                              setAdminMessage({ text: 'ยกเลิกการแก้ไขข้อมูล', type: 'info' });
                            }}
                            className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-2xl transition-all cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>

                {/* List Side - Right Column (8 cols) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-855 dark:text-white">
                            รายชื่อผู้ใช้งานระบบ ({users.length})
                          </h3>
                          <p className="text-[10px] text-slate-450 mt-0.5">
                            แสดงรายชื่อพนักงานทั้งหมดที่มีสิทธิ์เข้าใช้งานระบบตามระดับสิทธิ์ที่ระบุ
                          </p>
                        </div>
                      </div>

                      <div className="relative max-w-xs w-full">
                        <input
                          type="text"
                          placeholder="🔍 ค้นหาตามชื่อ, username, แฝก..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto min-h-[350px]">
                      <table className="min-w-full text-xs text-left text-slate-600 dark:text-slate-400">
                        <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3 font-bold">ชื่อ-นามสกุล พนักงาน</th>
                            <th className="py-2.5 px-2 font-bold">Username</th>
                            <th className="py-2.5 px-2 font-bold text-center">ระดับสิทธิ์</th>
                            <th className="py-2.5 px-2 font-bold text-center">แผนกที่สังกัด</th>
                            <th className="py-2.5 px-3 font-bold text-right">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {users.filter(u => {
                            const q = userSearchQuery.trim().toLowerCase();
                            if (!q) return true;
                            return (
                              u.full_name?.toLowerCase().includes(q) ||
                              u.username?.toLowerCase().includes(q) ||
                              u.role?.toLowerCase().includes(q) ||
                              u.department?.toLowerCase().includes(q)
                            );
                          }).map((u) => {
                            let roleStyle = 'bg-slate-100 text-slate-855 dark:bg-slate-800 dark:text-slate-350';
                            if (u.role === 'Admin') roleStyle = 'bg-red-50 text-red-655 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400';
                            else if (u.role === 'QA Manager') roleStyle = 'bg-blue-50 text-blue-655 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400';
                            else if (u.role === 'Department Supervisor') roleStyle = 'bg-emerald-50 text-emerald-655 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-450';
                            
                            return (
                              <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                                  {u.full_name}
                                </td>
                                <td className="py-3 px-2 font-semibold font-mono text-slate-550 dark:text-slate-400">
                                  {u.username}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${roleStyle}`}>
                                    {u.role === 'Admin' ? 'Admin' : u.role === 'QA Manager' ? 'QA' : u.role === 'Department Supervisor' ? 'Supervisor' : 'Operator'}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-slate-655 dark:text-slate-355">
                                    แผนก {u.department}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => handleEditUser(u)}
                                      className="p-1.5 text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                      title="แก้ไขข้อมูล"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                      title="ลบผู้ใช้งาน"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inspections' && (
              /* --- TAB 2: INSPECTION DATA EDITING --- */
              <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                {/* Control Panel - Left Column (4 cols) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-4 h-fit">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-purple-550/10 text-purple-650 dark:text-purple-400 flex items-center justify-center font-bold text-base">
                      ⚙️
                    </div>
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">
                      เลือกชุดข้อมูลที่ต้องการแก้ไข
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Department Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">เลือกแผนก</label>
                      <select
                        value={selectedInspectionDept}
                        onChange={(e) => setSelectedInspectionDept(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-855 dark:text-slate-200"
                      >
                        <option value="">-- เลือกแผนก --</option>
                        {DEPTS_LIST.map((d) => (
                          <option key={d} value={d}>แผนก {d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Selector */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">เลือกวันที่มีบันทึกแล้วในระบบ</label>
                      <select
                        value={selectedInspectionDate}
                        onChange={(e) => setSelectedInspectionDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-855 dark:text-slate-200 mb-2"
                      >
                        <option value="">-- เลือกวันที่ --</option>
                        {getUniqueDates().map((d) => (
                          <option key={d} value={d}>
                            {d.split('-').reverse().join('/')} (ค.ศ. {d.split('-')[0]})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 py-1">
                      <div className="border-t border-slate-200 dark:border-slate-800 flex-grow" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">หรือระบุวันที่เอง</span>
                      <div className="border-t border-slate-200 dark:border-slate-800 flex-grow" />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase mb-1">ระบุวันที่ตรวจนับ (ปฏิทิน)</label>
                      <input
                        type="date"
                        value={selectedInspectionDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          // If selected BE calendar year, normalize to CE
                          const parts = val.split('-');
                          if (parts.length === 3) {
                            let y = parseInt(parts[0], 10);
                            if (y > 2400) {
                              y -= 543;
                              setSelectedInspectionDate(`${y}-${parts[1]}-${parts[2]}`);
                              return;
                            }
                          }
                          setSelectedInspectionDate(val);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-855">
                      <button
                        onClick={handleSaveInspectionEdits}
                        disabled={inspectionRows.length === 0 || isLoading}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-950 text-white hover:bg-indigo-650 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกการปรับปรุงข้อมูล</span>
                      </button>

                      <button
                        onClick={handleDeleteInspectionEdits}
                        disabled={inspectionRows.length === 0 || isLoading}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>ลบแผนกนี้ในสัปดาห์นี้</span>
                      </button>

                      <button
                        onClick={handleDeleteAllDeptsInspectionEdits}
                        disabled={!selectedInspectionDate || isLoading}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>ลบของทุกแผนกในสัปดาห์นี้</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Side - Right Column (8 cols) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-855 dark:text-white">
                          ตารางแก้ไขยอดสถิติจำนวนแมลงรายจุด
                        </h3>
                        <p className="text-[10px] text-slate-450 mt-0.5">
                          {selectedInspectionDept && selectedInspectionDate 
                            ? `แสดงรายการเครื่องดักของแผนก "${selectedInspectionDept}" ณ วันที่ ${selectedInspectionDate.split('-').reverse().join('/')}`
                            : 'กรุณาเลือกแผนกและระบุวันที่ตรวจนับที่แผงควบคุมซ้ายมือ เพื่อเรียกดูตารางข้อมูล'}
                        </p>
                      </div>
                    </div>

                    {inspectionRows.length === 0 ? (
                      <div className="py-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2.5 animate-pulse" />
                        <h4 className="text-xs font-extrabold text-slate-600 dark:text-slate-400 mb-1">
                          ไม่มีข้อมูลแสดงผลในรอบนี้
                        </h4>
                        <p className="text-[10px] text-slate-450 max-w-sm mx-auto">
                          แผนกนี้ยังไม่มีข้อมูลบันทึกในวันที่ระบุ หรือไม่ได้มีการเลือกวันที่/แผนก กรุณาระบุข้อมูลเพื่อทำการแก้ไขหรือเริ่มบันทึกใหม่
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left text-slate-600 dark:text-slate-400">
                          <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3 font-bold">ตำแหน่งเครื่องดักแมลง (Trap Area)</th>
                              <th className="py-2.5 px-2 font-bold text-center">แมลงวัน</th>
                              <th className="py-2.5 px-2 font-bold text-center">ยุง</th>
                              <th className="py-2.5 px-2 font-bold text-center">มด</th>
                              <th className="py-2.5 px-2 font-bold text-center">แมลงอื่นๆ</th>
                              <th className="py-2.5 px-3 font-bold text-center">รายละเอียดแมลงอื่น</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                            {inspectionRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200 max-w-[240px] truncate">
                                  {row.area}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={row.flies}
                                    onChange={(e) => handleCellChange(idx, 'flies', e.target.value)}
                                    className="w-16 px-2 py-1 text-center font-extrabold text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                  />
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={row.mosquitoes}
                                    onChange={(e) => handleCellChange(idx, 'mosquitoes', e.target.value)}
                                    className="w-16 px-2 py-1 text-center font-extrabold text-xs rounded-lg bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                  />
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={row.ants}
                                    onChange={(e) => handleCellChange(idx, 'ants', e.target.value)}
                                    className="w-16 px-2 py-1 text-center font-extrabold text-xs rounded-lg bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                  />
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={row.others}
                                    onChange={(e) => handleCellChange(idx, 'others', e.target.value)}
                                    className="w-16 px-2 py-1 text-center font-extrabold text-xs rounded-lg bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                                  />
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenOthersModal(idx)}
                                    className="mx-auto inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-350 transition-all cursor-pointer"
                                  >
                                    <span>💬 ({row.othersDetails?.length || 0} รายการ)</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'presentation' && (
              /* --- TAB 4: PRESENTATION EXPORTS --- */
              <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                {/* Control Panel - Left Column (4 cols) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-4 h-fit">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                      📊
                    </div>
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">
                      เลือกเดือนที่ต้องการส่งออก
                    </h3>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">ปีประมวลผล</label>
                      <select
                        value={selectedPresYear}
                        onChange={(e) => setSelectedPresYear(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-880 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        {getAvailableYearsForPresentation(allInspections, isDemoMode).map(y => (
                          <option key={y} value={y}>{parseInt(y, 10) + 543}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">เดือน</label>
                      <select
                        value={selectedPresMonth}
                        onChange={(e) => setSelectedPresMonth(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-880 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        {getAvailableMonthsForPresentation(selectedPresYear, allInspections, isDemoMode).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-855">
                    <div className="p-4 bg-slate-50 dark:bg-slate-950/65 rounded-2xl border border-slate-100 dark:border-slate-850">
                      <h5 className="text-[11px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                        เกณฑ์วัดระดับแมลงระบาด
                      </h5>
                      <ul className="space-y-1.5 text-xs font-black text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-1.5">🪰 แมลงวัน &gt; 30 ตัว</li>
                        <li className="flex items-center gap-1.5">🦟 ยุง &gt; 50 ตัว</li>
                        <li className="flex items-center gap-1.5">🐜 มด &gt; 10 ตัว</li>
                        <li className="flex items-center gap-1.5">🪲 อื่นๆ &gt; 100 ตัว</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Main Content Area - Right Column (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Department selectors */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl p-6 shadow-sm">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                      เลือกแผนกแสดงข้อมูล
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {DEPTS_LIST.map((d) => (
                        <button
                          key={d}
                          onClick={() => setSelectedPresDept(d)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                            selectedPresDept === d
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white font-extrabold'
                              : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-955 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-855'
                          }`}
                        >
                          แผนก {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chart Container wrapper */}
                  {(() => {
                    const chartData = getDeptDetailedDataForPresentation(selectedPresDept, selectedPresMonth, selectedPresYear, allInspections, isDemoMode);
                    const formattedData = mapZeroToTinyDecimal(chartData);
                    
                    const isAllGreen = chartData.every(item => 
                      item.flies <= 30 && 
                      item.mosquitoes <= 50 && 
                      item.ants <= 10 && 
                      item.others <= 100
                    );

                    const summaryText = generatePresentationSummary(chartData);

                    const deptIndex = DEPTS_LIST.indexOf(selectedPresDept);
                    const containerId = `pres-chart-dept-${deptIndex}`;
                    const chartTitle = `กราฟแสดงรายงานการตรวจนับจำนวนแมลง ของทีม${selectedPresDept} ประจำเดือน ${selectedPresMonth} ${parseInt(selectedPresYear) + 543}`;

                    return (
                      <>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm flex flex-col gap-6 relative">
                          {/* Inner container to capture via html2canvas */}
                          <div id={containerId} className="bg-white dark:bg-slate-900 p-6 rounded-2xl relative w-full overflow-hidden">
                            {/* Chart Title */}
                            <h4 className="text-center font-bold text-[14px] text-slate-855 dark:text-slate-100 mb-6 px-12">
                              {chartTitle}
                            </h4>
                            
                            {/* A+ Badge Overlay */}
                            {isAllGreen && (
                              <div className="absolute top-10 right-10 z-10 flex items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 rounded-full border-[4px] border-emerald-600 bg-white flex items-center justify-center shadow-md">
                                  <span className="text-emerald-655 text-3xl font-black italic tracking-tighter text-emerald-600">A+</span>
                                </div>
                              </div>
                            )}

                            {/* Recharts chart */}
                            <div className="h-[360px] w-full text-xs font-bold pb-2 relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                  data={formattedData} 
                                  margin={{ top: 30, right: 10, left: -10, bottom: 40 }}
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
                                    tickCount={5}
                                    label={{ 
                                      value: 'จำนวน (ตัว)', 
                                      angle: -90, 
                                      position: 'insideLeft', 
                                      offset: 0, 
                                      style: { fontSize: 11, fontStyle: 'normal', fontWeight: 'bold', fill: '#475569', fontFamily: 'inherit' } 
                                    }}
                                  />
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend content={<RenderCustomLegend hideTitle={true} />} wrapperStyle={{ bottom: -20, left: 0, width: '100%' }} />
                                  
                                  <Bar dataKey="flies" name="แมลงวัน" fill={INSECT_CHART_COLORS.flies} isAnimationActive={false}>
                                    <LabelList dataKey="flies" content={renderCustomLabelWithThreshold(30)} />
                                  </Bar>
                                  <Bar dataKey="mosquitoes" name="ยุง" fill={INSECT_CHART_COLORS.mosquitoes} isAnimationActive={false}>
                                    <LabelList dataKey="mosquitoes" content={renderCustomLabelWithThreshold(50)} />
                                  </Bar>
                                  <Bar dataKey="ants" name="มด" fill={INSECT_CHART_COLORS.ants} isAnimationActive={false}>
                                    <LabelList dataKey="ants" content={renderCustomLabelWithThreshold(10)} />
                                  </Bar>
                                  <Bar dataKey="others" name="อื่นๆ" fill={INSECT_CHART_COLORS.others} isAnimationActive={false}>
                                    <LabelList dataKey="others" content={renderCustomLabelWithThreshold(100)} />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Export Actions & Summary display */}
                          <div className="flex flex-col gap-4 border-t border-slate-100 dark:border-slate-850 pt-6">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-amber-500" />
                                <span>สรุปการวิเคราะห์และแมลงที่เกินเกณฑ์</span>
                              </h5>
                              
                              <button
                                onClick={() => handleDownloadChart(containerId, `chart_${selectedPresDept}_${selectedPresMonth}_${selectedPresYear}`)}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer text-slate-700 dark:text-slate-350"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>บันทึกรูปภาพกราฟ (PNG)</span>
                              </button>
                            </div>

                            {/* Summary Textbox */}
                            <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex flex-col gap-3">
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line select-text">
                                {summaryText}
                              </div>
                              
                              {summaryText !== 'ไม่มีเครื่องดักแมลงที่ตรวจพบจำนวนแมลงเกินเกณฑ์ที่กำหนดในเดือนนี้' && (
                                <button
                                  onClick={() => handleCopySummary(summaryText)}
                                  className="w-fit px-3 py-1.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer self-end"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>คัดลอกข้อความสรุป</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            {activeTab === 'approvals' && (
              /* --- TAB 3: MONTHLY REPORT APPROVALS --- */
              <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
                {/* Control Panel - Left Column (4 cols) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-6 shadow-sm lg:col-span-4 h-fit">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-650 dark:text-blue-400 flex items-center justify-center font-bold text-base">
                      🚀
                    </div>
                    <h3 className="text-sm font-bold text-slate-855 dark:text-white">
                      เลือกเดือนที่ต้องการส่งอนุมัติ
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">ปีประมวลผล</label>
                      <select
                        value={selectedApprovalYear}
                        onChange={(e) => setSelectedApprovalYear(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                      >
                        <option value="2026">2569</option>
                        <option value="2025">2568</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase">เดือน</label>
                      <select
                        value={selectedApprovalMonth}
                        onChange={(e) => setSelectedApprovalMonth(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer text-slate-800 dark:text-slate-200"
                      >
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

                {/* Status & Action Panel - Right Column (8 cols) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-3xl p-6 shadow-sm lg:col-span-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Sparkles className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="text-sm font-bold text-slate-855 dark:text-white">
                          สถานะการกรอกข้อมูลและส่งอนุมัติ
                        </h3>
                        <p className="text-[10px] text-slate-450 mt-0.5">
                          ตรวจสอบความครบถ้วนรายสัปดาห์ของเดือน {selectedApprovalMonth} ปี {parseInt(selectedApprovalYear) + 543}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            สถานะปัจจุบันของเดือนนี้:
                          </p>
                          <span className={`inline-block mt-1 font-black px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-wider ${
                            approvalStatus === 'Draft' 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' 
                              : approvalStatus === 'Pending'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/20 dark:text-blue-400'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                          }`}>
                            {approvalStatus === 'Draft' ? 'Draft (ร่าง)' : approvalStatus === 'Pending' ? 'Pending (รออนุมัติ)' : 'Approved (อนุมัติแล้ว)'}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            ความครบถ้วนรายสัปดาห์:
                          </p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                            {approvalCompleteness.submittedWeeks.length} / {approvalCompleteness.requiredWeeks} สัปดาห์
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-850">
                        {Array.from({ length: approvalCompleteness.requiredWeeks }).map((_, idx) => {
                          const wNum = idx + 1;
                          const isDone = approvalCompleteness.submittedWeeks.includes(wNum);
                          return (
                            <div key={wNum} className={`flex items-center gap-1.5 text-[11px] font-black ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                              <span>{isDone ? '✅' : '⚪'}</span>
                              <span>สัปดาห์ที่ {wNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {isAutoApprovedDate(`${selectedApprovalYear}-${selectedApprovalMonth === 'มกราคม' ? '01' : selectedApprovalMonth === 'กุมภาพันธ์' ? '02' : selectedApprovalMonth === 'มีนาคม' ? '03' : selectedApprovalMonth === 'เมษายน' ? '04' : selectedApprovalMonth === 'พฤษภาคม' ? '05' : selectedApprovalMonth === 'มิถุนายน' ? '06' : selectedApprovalMonth === 'กรกฎาคม' ? '07' : selectedApprovalMonth === 'สิงหาคม' ? '08' : selectedApprovalMonth === 'กันยายน' ? '09' : selectedApprovalMonth === 'ตุลาคม' ? '10' : selectedApprovalMonth === 'พฤศจิกายน' ? '11' : '12'}-15`) ? (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-2 text-[11px] font-bold">
                        <span>✅</span>
                        <p>ข้อมูลของเดือนนี้เป็นข้อมูลย้อนหลัง (Auto-Approved) ข้อมูลถูกอนุมัติโดยระบบและแสดงผลบนแดชบอร์ดเรียบร้อยแล้ว</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          disabled={!approvalCompleteness.isComplete || approvalStatus !== 'Draft'}
                          onClick={handleSendApprovalReport}
                          className={`w-full py-3 text-xs font-extrabold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                            approvalCompleteness.isComplete && approvalStatus === 'Draft'
                              ? 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01] hover:shadow-md'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800/40 dark:text-slate-650 cursor-not-allowed'
                          }`}
                        >
                          🚀 ตรวจสอบครบถ้วน ส่งรายงานประจำเดือนให้หัวหน้าอนุมัติ
                        </button>
                        
                        {!approvalCompleteness.isComplete && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold text-center">
                            * ต้องบันทึกข้อมูลสถิติให้ครบถ้วนทุกสัปดาห์ก่อนจึงจะส่งรายงานให้หัวหน้าอนุมัติได้
                          </p>
                        )}
                        {approvalStatus !== 'Draft' && approvalCompleteness.isComplete && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold text-center">
                            * ส่งรายงานประจำเดือนเรียบร้อยแล้ว อยู่ในสถานะ {approvalStatus === 'Pending' ? 'รอหัวหน้างานอนุมัติ' : 'อนุมัติเรียบร้อยแล้ว'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- OTHERS BREAKDOWN MODAL --- */}
      {isOthersModalOpen && activeRowIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between animate-in zoom-in-95 duration-150">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
                  🦋
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    รายละเอียดแมลงอื่นๆ (Others Breakdown)
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-0.5 max-w-[320px] truncate">
                    {inspectionRows[activeRowIndex]?.area}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3 my-4 max-h-[220px] overflow-y-auto pr-1">
                {modalItems.length === 0 ? (
                  <p className="text-center py-8 text-[11px] text-slate-450 font-bold">
                    ยังไม่มีข้อมูลแมลงชนิดอื่น กรุณากดปุ่มเพื่อเพิ่มข้อมูล
                  </p>
                ) : (
                  modalItems.map((item, mIdx) => (
                    <div key={mIdx} className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-150">
                      <input
                        type="text"
                        placeholder="เช่น ผีเสื้อ, แมลงหวี่..."
                        value={item.name}
                        onChange={(e) => handleModalItemChange(mIdx, 'name', e.target.value)}
                        className="flex-grow px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none font-semibold text-slate-800 dark:text-slate-200"
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="จำนวน"
                        value={item.count}
                        onChange={(e) => handleModalItemChange(mIdx, 'count', e.target.value)}
                        className="w-16 px-2 py-1.5 text-center font-extrabold text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveModalItem(mIdx)}
                        className="p-2 border border-slate-100 dark:border-slate-800 hover:bg-red-500/10 hover:text-red-500 text-slate-400 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Item Button */}
              <button
                type="button"
                onClick={handleAddModalItem}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>เพิ่มชนิดแมลงและจำนวน</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleApplyModalItems}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-950 text-white hover:bg-indigo-650 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-500 dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all cursor-pointer text-center"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ตกลง (Apply)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOthersModalOpen(false);
                  setActiveRowIndex(null);
                }}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-2xl transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
