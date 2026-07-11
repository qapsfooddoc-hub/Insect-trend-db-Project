'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, Trash2, Save, RotateCcw, AlertTriangle, Sparkles, 
  CheckCircle, Database, ShieldAlert, ListPlus, X
} from 'lucide-react';

// 33 Pre-defined default rows based on FM-QC - 08/03 Rev.07 grouped by Departments
const INITIAL_AREAS = [
  // หน้าร้านใหม่ (สีเหลือง)
  { dept: 'หน้าร้านใหม่', area: '(07) ลานโหลดสินค้าหน้าร้าน', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // โรงฆ่า (สีส้มอ่อน)
  { dept: 'โรงฆ่า', area: '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'โรงฆ่า', area: '(09) ทางเข้าผ่าซาก/เครื่องในแดง/เครื่องในขาว', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'โรงฆ่า', area: '(10) ลานโหลดสินค้าห้องเลือด', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'โรงฆ่า', area: '(11) ห้องเลือด', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'โรงฆ่า', area: '(12) ห้องช็อต/แทงคอ/ลวกซาก', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'โรงฆ่า', area: '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // ตัดแต่ง (สีเขียวตองอ่อน)
  { dept: 'ตัดแต่ง', area: '(03) ห้องตัดแต่ง บริเวณทางหนีไฟ', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'ตัดแต่ง', area: '(04) ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'ตัดแต่ง', area: '(05) ห้องตัดแต่ง บริเวณเลนมันและหนัง', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'ตัดแต่ง', area: '(31) ห้องล้างมัน/คัดแยกเศษ', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // โหลด เฟส 5 (สีเหลืองทองสว่าง)
  { dept: 'โหลด เฟส 5', area: '(01) ลานโหลดของตัดแต่งและ Makro', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'โหลด เฟส 5', area: '(02) ทางขนย้ายสินค้าเข้า - ออกตัดแต่ง', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'โหลด เฟส 5', area: '(06) ลานโหลดของตัดแต่งและ Makro', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // เฟส 6 (สีส้มสว่าง)
  { dept: 'เฟส 6', area: '(13) ห้อง Pack A บริเวณหน้าประตูทางเชื่อมอาคาร', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'เฟส 6', area: '(14) ห้อง Pack A บริเวณหน้าห้องเก็บบรรจุภัณฑ์', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'เฟส 6', area: '(15) ห้อง Pack C', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // คลัง3 (สีฟ้าพาสเทล)
  { dept: 'คลัง3', area: '(16) ห้อง Pack สินค้า Frozen คลัง3', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // หมูบด (สีเขียวกลาง)
  { dept: 'หมูบด', area: '(17) ห้องหมูบด บริเวณทางเข้า-ออก ติดตู้ F5', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'หมูบด', area: '(18) ห้องหมูบด บริเวณเครื่องบดหมู ติดตู้ F1', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'หมูบด', area: '(19) ห้องหมูบด บริเวณผนังติดห้องเครื่อง', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'หมูบด', area: '(20) ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'หมูบด', area: '(21) ห้องหมูบด ทางเข้า-ออกไลน์ผลิต ฝั่งตู้ S,T', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // Slice ผลิต (สีม่วงพาสเทล)
  { dept: 'Slice ผลิต', area: '(22) ห้อง Slice เครื่องใน ทางเข้า-ออก ฝั่ง Chill 3', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'Slice ผลิต', area: '(23) ห้อง Slice เครื่องใน ทางเข้า-ออกไลน์ผลิต', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'Slice ผลิต', area: '(26) Slice ชั้น 3 ทางเข้า-ออกไลน์ผลิต', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'Slice ผลิต', area: '(27) Slice ชั้น 3 พื้นที่การผลิต', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'Slice ผลิต', area: '(28) ทางเดินไปห้องยุง Slice ชั้น 3', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'Slice ผลิต', area: '(29) ห้อง Slice เฟส 4.1', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // อนามัย (สีเหลืองอ่อนนวล)
  { dept: 'อนามัย', area: '(24) ห้องซักผ้า คลัง 4', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'อนามัย', area: '(25) ทางเข้า Slice ถาด', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  { dept: 'อนามัย', area: '(33) บันไดทางขึ้นชั้น 2', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] },
  
  // ล้างตะกร้า (สีเทาอ่อน)
  { dept: 'ล้างตะกร้า', area: '(32) ทางลำเลียงตะกร้าเข้าไลน์ผลิต', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] }
];

// Department styling configurations
const DEPT_CONFIGS = {
  'หน้าร้านใหม่': {
    bg: 'bg-yellow-50/50 dark:bg-yellow-950/10 hover:bg-yellow-100/30 dark:hover:bg-yellow-950/20',
    border: 'border-l-4 border-l-yellow-400',
    borderStrip: 'border-l-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-850'
  },
  'โรงฆ่า': {
    bg: 'bg-orange-50/30 dark:bg-orange-950/5 hover:bg-orange-100/20 dark:hover:bg-orange-950/10',
    border: 'border-l-4 border-l-orange-400/80',
    borderStrip: 'border-l-orange-400',
    badge: 'bg-orange-100 text-orange-850 dark:bg-orange-900/35 dark:text-orange-350 border border-orange-200/50 dark:border-orange-900/60'
  },
  'ตัดแต่ง': {
    bg: 'bg-lime-50/30 dark:bg-lime-950/5 hover:bg-lime-100/20 dark:hover:bg-lime-950/10',
    border: 'border-l-4 border-l-lime-400',
    borderStrip: 'border-l-lime-400',
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300 border border-lime-200 dark:border-lime-900'
  },
  'โหลด เฟส 5': {
    bg: 'bg-amber-50/30 dark:bg-amber-950/5 hover:bg-amber-100/20 dark:hover:bg-amber-950/10',
    border: 'border-l-4 border-l-amber-450',
    borderStrip: 'border-l-amber-450',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-350 border border-amber-200 dark:border-amber-900'
  },
  'เฟส 6': {
    bg: 'bg-orange-50/40 dark:bg-orange-950/10 hover:bg-orange-100/30 dark:hover:bg-orange-950/15',
    border: 'border-l-4 border-l-orange-500',
    borderStrip: 'border-l-orange-500',
    badge: 'bg-orange-100/80 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300 border border-orange-300/40'
  },
  'คลัง3': {
    bg: 'bg-sky-50/40 dark:bg-sky-950/5 hover:bg-sky-100/30 dark:hover:bg-sky-950/10',
    border: 'border-l-4 border-l-sky-400',
    borderStrip: 'border-l-sky-400',
    badge: 'bg-sky-100 text-sky-850 dark:bg-sky-900/45 dark:text-sky-300 border border-sky-200 dark:border-sky-900'
  },
  'หมูบด': {
    bg: 'bg-emerald-50/45 dark:bg-emerald-950/5 hover:bg-emerald-100/30 dark:hover:bg-emerald-950/10',
    border: 'border-l-4 border-l-emerald-500',
    borderStrip: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-850 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
  },
  'Slice ผลิต': {
    bg: 'bg-purple-50/40 dark:bg-purple-950/5 hover:bg-purple-100/30 dark:hover:bg-purple-950/10',
    border: 'border-l-4 border-l-purple-400',
    borderStrip: 'border-l-purple-400',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/35 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
  },
  'อนามัย': {
    bg: 'bg-amber-50/20 dark:bg-amber-950/5 hover:bg-amber-100/15 dark:hover:bg-amber-950/10',
    border: 'border-l-4 border-l-yellow-350',
    borderStrip: 'border-l-yellow-350',
    badge: 'bg-amber-50 text-amber-800 dark:bg-amber-900/25 dark:text-amber-350 border border-amber-100/60 dark:border-amber-900/50'
  },
  'ล้างตะกร้า': {
    bg: 'bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/40 dark:hover:bg-slate-800/10',
    border: 'border-l-4 border-l-slate-400',
    borderStrip: 'border-l-slate-400',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-850 dark:text-slate-300 border border-slate-300 dark:border-slate-800'
  }
};

const DEPTS_LIST = Object.keys(DEPT_CONFIGS);

const DEFAULT_INSECT_TYPES = ['ผีเสื้อ', 'แมลงหวี่', 'แมลงสาบ'];

export default function InspectionPage() {
  const [weekDate, setWeekDate] = useState('');
  const [rows, setRows] = useState([]);
  const [role, setRole] = useState('operator'); // 'operator' or 'admin'
  const [currentUser, setCurrentUser] = useState(null);

  // ─── Custom Dialog Dialog State ───
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'info', // 'success', 'warning', 'confirm'
    title: '',
    message: '',
    onConfirm: null
  });

  const showSuccessDialog = (title, message, onConfirm = null) => {
    setDialog({ isOpen: true, type: 'success', title, message, onConfirm });
  };

  const showWarningDialog = (title, message) => {
    setDialog({ isOpen: true, type: 'warning', title, message, onConfirm: null });
  };

  const showConfirmDialog = (title, message, onConfirm) => {
    setDialog({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const syncCurrentUser = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentSimulatedUser');
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {}
      } else {
        setCurrentUser(null);
      }
    }
  };
  
  // Modal states for 'Others' details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [modalItems, setModalItems] = useState([]);
  const [newOtherName, setNewOtherName] = useState('ผีเสื้อ');
  const [customInsectTypes, setCustomInsectTypes] = useState([]);
  const [newOtherCustomName, setNewOtherCustomName] = useState('');
  const [newOtherCount, setNewOtherCount] = useState('');

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // New Completeness Check States
  const [allInspections, setAllInspections] = useState([]);
  const [monthStatus, setMonthStatus] = useState('Draft');
  const [completeness, setCompleteness] = useState({ submittedWeeks: [], requiredWeeks: 4, isComplete: false });

  const normalizeDateToCE = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      let year = parseInt(parts[0], 10);
      if (year > 2400) {
        year -= 543;
        return `${year}-${parts[1]}-${parts[2]}`;
      }
    }
    return dateStr;
  };

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

  const getThaiMonthName = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[date.getMonth()];
  };

  const fetchInspections = async () => {
    try {
      const res = await fetch('/api/inspection');
      const result = await res.json();
      if (res.ok && result.data) {
        setAllInspections(result.data);
      }
    } catch (err) {
      console.error('Error fetching inspections:', err);
    }
  };

  // Set default initial rows on load
  useEffect(() => {
    setMounted(true);
    setRows(INITIAL_AREAS.map(item => ({ ...item, othersDetails: [] })));
    fetchCustomInsectTypes();
    fetchInspections();

    syncCurrentUser();
    window.addEventListener('currentSimulatedUserChanged', syncCurrentUser);
    return () => {
      window.removeEventListener('currentSimulatedUserChanged', syncCurrentUser);
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const uRole = currentUser.role?.toLowerCase();
      if (uRole === 'admin') {
        setRole('admin');
      } else {
        setRole('operator');
      }
    }
  }, [currentUser]);

  const fetchCustomInsectTypes = async () => {
    try {
      const res = await fetch('/api/insect-types');
      const result = await res.json();
      if (res.ok && result.data) {
        const excluded = ['flies', 'mosquitoes', 'ants', 'others', 'other', 'แมลงวัน', 'ยุง', 'มด', 'แมลงอื่นๆ'];
        const filtered = result.data
          .map(item => item.name)
          .filter(name => {
            const lowerName = name.toLowerCase();
            return !excluded.some(ex => lowerName.includes(ex));
          });
        setCustomInsectTypes(filtered);
      }
    } catch (error) {
      console.error('Error fetching custom insect types:', error);
    }
  };


  useEffect(() => {
    if (typeof window !== 'undefined' && weekDate) {
      const date = new Date(weekDate);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-indexed
      const monthName = getThaiMonthName(weekDate);
      
      const isPastData = isAutoApprovedDate(weekDate);
      const statusKey = `monthStatus_${monthName}_${year}`;
      let currentStatus = localStorage.getItem(statusKey);
      
      if (isPastData) {
        currentStatus = 'Approved';
        localStorage.setItem(statusKey, 'Approved');
      } else if (!currentStatus) {
        currentStatus = 'Draft';
        localStorage.setItem(statusKey, 'Draft');
      }
      
      setMonthStatus(currentStatus);
      
      const required = getRequiredWeeksCount(year, month);
      
      const uniqueDates = new Set();
      allInspections.forEach(item => {
        const itemDate = new Date(item.inspected_at);
        if (itemDate.getFullYear() === year && itemDate.getMonth() === month) {
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
      
      setCompleteness({
        submittedWeeks: submittedWeeksList,
        requiredWeeks: required,
        isComplete: submittedWeeksList.length >= required
      });
    }
  }, [weekDate, allInspections]);

  const handleSendReport = () => {
    if (typeof window !== 'undefined') {
      const date = new Date(weekDate);
      const year = date.getFullYear();
      const monthName = getThaiMonthName(weekDate);
      const statusKey = `monthStatus_${monthName}_${year}`;
      
      localStorage.setItem(statusKey, 'Pending');
      setMonthStatus('Pending');
      alert(`ส่งรายงานประจำเดือน ${monthName} ${year + 543} ให้หัวหน้าอนุมัติเรียบร้อยแล้ว!`);
    }
  };

  // Handle cell inputs
  const handleCellChange = (rowIndex, field, value) => {
    const updatedRows = [...rows];
    if (field === 'area' || field === 'dept') {
      updatedRows[rowIndex][field] = value;
    } else {
      if (value === '') {
        updatedRows[rowIndex][field] = '';
      } else {
        const parsedValue = parseInt(value, 10);
        updatedRows[rowIndex][field] = isNaN(parsedValue) ? '' : Math.max(0, parsedValue);
      }
    }
    setRows(updatedRows);
  };

  // Keyboard navigation mapping for desktop/mobile views
  const handleKeyDown = (e, rowIndex, colName) => {
    const colOrder = ['flies', 'mosquitoes', 'ants', 'others'];
    
    // Find layout prefix (desktop/mobile)
    const prefix = e.target.id.split('-')[1]; // e.g. "desktop" or "mobile"
    
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`input-${prefix}-${rowIndex + 1}-${colName}`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`input-${prefix}-${rowIndex - 1}-${colName}`);
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    } else if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
      const colIndex = colOrder.indexOf(colName);
      const nextCol = colOrder[colIndex + 1];
      if (nextCol) {
        const nextInput = document.getElementById(`input-${prefix}-${rowIndex}-${nextCol}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
      const colIndex = colOrder.indexOf(colName);
      const prevCol = colOrder[colIndex - 1];
      if (prevCol) {
        const prevInput = document.getElementById(`input-${prefix}-${rowIndex}-${prevCol}`);
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    }
  };

  // Modal handlers
  const openOthersModal = (rowIndex) => {
    setActiveRowIndex(rowIndex);
    const items = rows[rowIndex].othersDetails || [];
    setModalItems(items.map(item => ({ name: item.name, count: String(item.count) })));
    setNewOtherCount('');
    setNewOtherCustomName('');
    setNewOtherName('ผีเสื้อ');
    setIsModalOpen(true);
  };

  const addOtherItem = async () => {
    let name = newOtherName;
    const isCustom = newOtherName === 'อื่น ๆ (พิมพ์ระบุเอง)';
    if (isCustom) {
      name = newOtherCustomName.trim();
    }
    const count = parseInt(newOtherCount, 10);

    if (!name) {
      showWarningDialog('ไม่สามารถบันทึกได้', 'กรุณาระบุประเภทแมลง');
      return;
    }
    if (isNaN(count) || count <= 0) {
      showWarningDialog('ไม่สามารถบันทึกได้', 'กรุณาระบุจำนวนตรวจนับตัวเลขที่มากกว่า 0');
      return;
    }

    if (isCustom) {
      try {
        const response = await fetch('/api/insect-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        });
        
        if (response.ok) {
          if (!customInsectTypes.includes(name) && !DEFAULT_INSECT_TYPES.includes(name)) {
            setCustomInsectTypes(prev => [...prev, name]);
          }
          setNewOtherName(name);
          setNewOtherCustomName('');
        } else {
          const errData = await response.json();
          console.error('Failed to save insect type:', errData.error);
        }
      } catch (err) {
        console.error('Network error saving insect type:', err);
      }
    }

    const existingIndex = modalItems.findIndex(item => item.name === name);
    let updatedItems = [...modalItems];
    if (existingIndex > -1) {
      const current = parseInt(updatedItems[existingIndex].count, 10) || 0;
      updatedItems[existingIndex].count = String(current + count);
    } else {
      updatedItems.push({ name, count: String(count) });
    }

    setModalItems(updatedItems);
    setNewOtherCount('');
  };

  const removeOtherItem = (index) => {
    setModalItems(modalItems.filter((_, i) => i !== index));
  };

  const saveOthersDetails = () => {
    if (activeRowIndex === null) return;
    const totalCount = modalItems.reduce((sum, item) => sum + (parseInt(item.count, 10) || 0), 0);
    
    const updatedRows = [...rows];
    updatedRows[activeRowIndex].others = totalCount > 0 ? totalCount : '';
    updatedRows[activeRowIndex].othersDetails = modalItems.map(item => ({
      name: item.name,
      count: parseInt(item.count, 10) || 0
    }));

    setRows(updatedRows);
    setIsModalOpen(false);
    setActiveRowIndex(null);
  };

  // Admin row controls
  const addRow = () => {
    if (role !== 'admin') return;
    setRows([...rows, { dept: 'หน้าร้านใหม่', area: '', flies: '', mosquitoes: '', ants: '', others: '', othersDetails: [] }]);
  };

  const removeRow = (index) => {
    if (role !== 'admin') return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const resetTable = () => {
    showConfirmDialog(
      'ยืนยันการรีเซ็ตตาราง',
      'คุณต้องการรีเซ็ตตารางและจัดกลุ่มแผนกตามมาตรฐานเอกสาร FM-QC - 08/03 ใช่หรือไม่?',
      () => {
        setRows(INITIAL_AREAS.map(item => ({ ...item, othersDetails: [] })));
        setNotification(null);
      }
    );
  };

  // Reset/Clear only insect count states across all 33 rows
  const clearAllData = () => {
    showConfirmDialog(
      'ยืนยันการล้างข้อมูล',
      'คุณต้องการล้างตัวเลขสถิติผลตรวจนับทุกช่องในตารางใช่หรือไม่? (ตำแหน่งเครื่องดักและแผนกจะยังอยู่คงเดิม)',
      () => {
        const cleared = rows.map(r => ({
          ...r,
          flies: '',
          mosquitoes: '',
          ants: '',
          others: '',
          othersDetails: []
        }));
        setRows(cleared);
        setNotification(null);
      }
    );
  };

  // Save weekly checklist
  const handleSubmit = async () => {
    if (!weekDate) {
      showNotification('error', 'กรุณาเลือกวันที่ตรวจนับก่อนทำการบันทึกข้อมูล');
      showWarningDialog('กรุณาเลือกวันที่', 'กรุณาระบุวันที่ทำการตรวจนับก่อนบันทึกข้อมูล');
      return;
    }
    const emptyAreas = rows.some(r => !r.area.trim());
    if (emptyAreas) {
      showNotification('error', 'กรุณาระบุชื่อตำแหน่งเครื่องดักแมลงให้ครบถ้วนก่อนบันทึก');
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const formattedRows = rows.map(r => ({
      area: `${r.dept}: ${r.area}`,
      flies: r.flies === '' ? 0 : r.flies,
      mosquitoes: r.mosquitoes === '' ? 0 : r.mosquitoes,
      ants: r.ants === '' ? 0 : r.ants,
      others: r.others === '' ? 0 : r.others,
      othersDetails: r.othersDetails || []
    }));

    try {
      const response = await fetch('/api/inspection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weekDate, rows: formattedRows })
      });

      const result = await response.json();

      if (response.ok) {
        // Auto-approve logic if past data
        if (typeof window !== 'undefined') {
          const date = new Date(weekDate);
          const year = date.getFullYear();
          const monthName = getThaiMonthName(weekDate);
          const statusKey = `monthStatus_${monthName}_${year}`;
          
          if (isAutoApprovedDate(weekDate)) {
            localStorage.setItem(statusKey, 'Approved');
            // Auto approve supervisor stamps for all depts
            const deptsList = [
              'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'เฟส 6', 
              'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
            ];
            const timestampStr = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
            deptsList.forEach(dept => {
              const approvalKey = `approval_${dept}_${monthName}_${year}`;
              localStorage.setItem(approvalKey, JSON.stringify({
                deptApproved: true,
                deptApproverName: 'Auto-Approved (ข้อมูลย้อนหลัง)',
                deptApprovedAt: timestampStr,
                deptComment: 'อนุมัติอัตโนมัติข้อมูลย้อนหลัง',
                qaApproved: true,
                qaApproverName: 'Auto-Approved (ข้อมูลย้อนหลัง)',
                qaApprovedAt: timestampStr,
                qaComment: 'อนุมัติอัตโนมัติข้อมูลย้อนหลัง'
              }));
            });
          } else {
            // When operator enters new data, set status to Draft
            localStorage.setItem(statusKey, 'Draft');
          }
        }
        
        await fetchInspections();

        showNotification(
          'success', 
          `บันทึกผลการตรวจสอบสำเร็จ! ${result.message} (อัปเดตทั้งหมด ${result.insertedCount} เครื่องดัก)`,
          result.isDemo
        );
        
        showSuccessDialog(
          'บันทึกข้อมูลสำเร็จ',
          `ระบบได้ทำการบันทึกข้อมูลการนับแมลงเรียบร้อยแล้ว (อัปเดตทั้งหมด ${result.insertedCount} เครื่องดัก)`,
          () => {
            // Reset table numbers to empty after success
            const cleared = rows.map(item => ({
              ...item,
              flies: '',
              mosquitoes: '',
              ants: '',
              others: '',
              othersDetails: []
            }));
            setRows(cleared);
            setWeekDate('');
          }
        );
      } else {
        showNotification('error', result.error || 'เกิดข้อผิดพลาดจากทางเซิร์ฟเวอร์');
      }
    } catch (err) {
      console.error(err);
      showNotification('error', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ฐานข้อมูลได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (type, message, isDemo = false) => {
    setNotification({ type, message, isDemo });
    if (type === 'success') {
      setTimeout(() => {
        setNotification(prev => prev && prev.type === 'success' ? null : prev);
      }, 5000);
    }
  };

  const userRoleLower = currentUser?.role?.toLowerCase() || '';
  const isAllowed = userRoleLower === 'admin' || userRoleLower === 'operator' || userRoleLower === 'qa manager';

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-955 flex items-center justify-center font-sans">
        <div className="text-slate-400 font-extrabold text-sm animate-pulse">กำลังโหลด...</div>
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
              หน้าบันทึกผลตรวจรายสัปดาห์อนุญาตให้เข้าถึงเฉพาะบทบาท แอดมิน (Admin), พนักงานผู้บันทึก (Operator) หรือ ฝ่ายประกันคุณภาพ (QA Manager) เท่านั้น กรุณาเข้าสู่ระบบเพื่อใช้งาน
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors duration-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {!isAllowed ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-10 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
              🚫
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-red-650 dark:text-red-400 mb-2">
              ปฏิเสธการเข้าถึง - เฉพาะผู้บันทึก ผู้รับผิดชอบ หรือฝ่ายประกันคุณภาพเท่านั้น
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-md mx-auto mb-6 leading-relaxed font-sans">
              บัญชีปัจจุบันของคุณคือ <strong>{currentUser?.full_name || 'ไม่ระบุ'}</strong> (บทบาท: {currentUser?.role || 'พนักงานทั่วไป'}) ซึ่งไม่มีสิทธิ์เข้าใช้หน้าบันทึกผลตรวจรายสัปดาห์ หน้านี้อนุญาตให้เข้าถึงเฉพาะบทบาท แอดมิน (Admin), พนักงานผู้บันทึก (Operator) หรือ ฝ่ายประกันคุณภาพ (QA Manager) เท่านั้น
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
            {/* Navigation & Header */}
            <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  รายงานการตรวจนับจำนวนแมลง
                </h1>
              </div>

              <div className="flex flex-wrap gap-3">
                {/* User Role Selector (Only for Admin) */}
                {userRoleLower === 'admin' && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 px-4 shadow-sm flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 whitespace-nowrap">สิทธิ์เข้าถึง:</span>
                    <select 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-850 dark:text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="operator">Operator (ผู้บันทึกข้อมูล)</option>
                      <option value="admin">🔧 Admin / Controller (ผู้แก้ไขโครงสร้าง)</option>
                    </select>
                  </div>
                )}

            {/* Date Selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 px-4 shadow-sm flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">วันที่ตรวจนับ:</span>
              <input 
                type="date"
                value={weekDate}
                onChange={(e) => setWeekDate(normalizeDateToCE(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-850 dark:text-slate-100 focus:outline-none"
                required
              />
              {weekDate && (
                <span className="text-xs font-extrabold text-indigo-650 dark:text-indigo-400 ml-2 whitespace-nowrap">
                  ({weekDate.split('-').reverse().join('/')})
                </span>
              )}
            </div>
          </div>
        </div>



        {/* Banners */}
        {notification && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 shadow-sm transition-all duration-300 ${
            notification.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-300'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
          }`}>
            {notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-semibold">
              <p>{notification.message}</p>
              {notification.isDemo && (
                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md border border-amber-500/20 font-medium">
                  ⚠️ ระบบทำงานใน Demo Mode (บันทึกข้อมูลตรวจนับจำลอง)
                </span>
              )}
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-xs font-medium hover:underline opacity-80"
            >
              ปิด
            </button>
          </div>
        )}



        {/* Auto-approved historical message banner */}
        {mounted && weekDate && isAutoApprovedDate(weekDate) && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-3xl flex items-center gap-2 text-xs font-bold shadow-sm">
            <span>✅</span>
            <p>ข้อมูลนี้เป็นข้อมูลย้อนหลัง (Auto-Approved) ข้อมูลถูกอนุมัติและปล่อยไปพล็อตบนหน้าแดชบอร์ดหลักแล้วเรียบร้อย</p>
          </div>
        )}


        {/* ======================================================== */}
        {/* DESKTOP VIEW: SpreadSheet Table (Hidden on Mobile screens) */}
        {/* ======================================================== */}
        <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-350">
                  <th className="py-4 px-5 w-24">
                    แผนก
                  </th>
                  <th className="py-4 px-4 w-[40%] min-w-[280px]">
                    NO.เครื่องดักแมลง / ตำแหน่งติดตั้ง
                  </th>
                  <th className="py-4 px-2 text-center w-24 sm:w-28">
                    แมลงวัน (Flies)
                  </th>
                  <th className="py-4 px-2 text-center w-24 sm:w-28">
                    ยุง (Mosquitoes)
                  </th>
                  <th className="py-4 px-2 text-center w-24 sm:w-28">
                    มด (Ants)
                  </th>
                  <th className="py-4 px-3 text-center w-32 sm:w-36">
                    แมลงอื่นๆ (Others)
                  </th>
                  {role === 'admin' && (
                    <th className="py-4 px-6 text-center w-20">
                      จัดการ
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'admin' ? 7 : 6} className="py-12 text-center text-slate-400 text-sm">
                      ไม่มีรายการข้อมูล กรุณาเปิดสิทธิ์ Admin แล้วกดรีเซ็ตแผนกข้อมูลด้านล่าง
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const style = DEPT_CONFIGS[row.dept] || DEPT_CONFIGS['ล้างตะกร้า'];
                    
                    return (
                      <tr 
                        key={index}
                        className={`transition-colors ${style.bg} ${style.border}`}
                      >
                        {/* Department Badge / Selector */}
                        <td className="py-2.5 px-5">
                          {role === 'admin' ? (
                            <select
                              value={row.dept}
                              onChange={(e) => handleCellChange(index, 'dept', e.target.value)}
                              className="w-full px-2 py-1 text-xs font-bold rounded-lg focus:outline-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                            >
                              {DEPTS_LIST.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded ${style.badge} whitespace-nowrap`}>
                              {row.dept}
                            </span>
                          )}
                        </td>

                        {/* Location Details */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={row.area}
                            disabled={role !== 'admin'}
                            onChange={(e) => handleCellChange(index, 'area', e.target.value)}
                            placeholder="ระบุตำแหน่งติดตั้งเครื่องดักแมลง"
                            className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white/70 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-85 font-semibold text-slate-800 dark:text-slate-200"
                          />
                        </td>

                        {/* Flies */}
                        <td className="py-2.5 px-2">
                          <input
                            id={`input-desktop-${index}-flies`}
                            type="number"
                            min="0"
                            value={row.flies}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleKeyDown(e, index, 'flies')}
                            onChange={(e) => handleCellChange(index, 'flies', e.target.value)}
                            className="w-full text-center px-1 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono placeholder-slate-350 dark:placeholder-slate-600 font-semibold text-slate-900 dark:text-slate-100"
                          />
                        </td>

                        {/* Mosquitoes */}
                        <td className="py-2.5 px-2">
                          <input
                            id={`input-desktop-${index}-mosquitoes`}
                            type="number"
                            min="0"
                            value={row.mosquitoes}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleKeyDown(e, index, 'mosquitoes')}
                            onChange={(e) => handleCellChange(index, 'mosquitoes', e.target.value)}
                            className="w-full text-center px-1 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono placeholder-slate-350 dark:placeholder-slate-600 font-semibold text-slate-900 dark:text-slate-100"
                          />
                        </td>

                        {/* Ants */}
                        <td className="py-2.5 px-2">
                          <input
                            id={`input-desktop-${index}-ants`}
                            type="number"
                            min="0"
                            value={row.ants}
                            placeholder="0"
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleKeyDown(e, index, 'ants')}
                            onChange={(e) => handleCellChange(index, 'ants', e.target.value)}
                            className="w-full text-center px-1 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono placeholder-slate-350 dark:placeholder-slate-600 font-semibold text-slate-900 dark:text-slate-100"
                          />
                        </td>

                        {/* Others */}
                        <td className="py-2.5 px-3">
                          <div className="flex gap-1.5 items-center">
                            <input
                              id={`input-desktop-${index}-others`}
                              type="number"
                              min="0"
                              value={row.others}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => handleKeyDown(e, index, 'others')}
                              onChange={(e) => handleCellChange(index, 'others', e.target.value)}
                              className="w-full text-center px-1 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono placeholder-slate-350 dark:placeholder-slate-600 font-semibold text-slate-900 dark:text-slate-100"
                            />
                            <button
                              onClick={() => openOthersModal(index)}
                              className="flex-shrink-0 p-2 text-indigo-650 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-xl transition-all relative"
                              title="ระบุสถิติประเภทอื่นย่อย"
                            >
                              <ListPlus className="w-4 h-4" />
                              {row.othersDetails && row.othersDetails.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-550 border border-white dark:border-slate-900 rounded-full animate-pulse" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Admin Delete Row */}
                        {role === 'admin' && (
                          <td className="py-2.5 px-6 text-center">
                            <button
                              onClick={() => removeRow(index)}
                              className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all"
                              title="ลบแถวนี้"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MOBILE VIEW: Card Stack Layout (Hidden on Desktop screens) */}
        {/* ======================================================== */}
        <div className="block md:hidden space-y-4 mb-6">
          {rows.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center rounded-3xl text-slate-400 text-sm">
              ไม่มีเครื่องดักแมลงในระบบ
            </div>
          ) : (
            rows.map((row, index) => {
              const style = DEPT_CONFIGS[row.dept] || DEPT_CONFIGS['ล้างตะกร้า'];
              
              return (
                <div 
                  key={index} 
                  className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm relative overflow-hidden ${style.bg} ${style.border}`}
                >
                  {/* Card Header (Dept & Trap info) */}
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg ${style.badge}`}>
                      {row.dept}
                    </span>
                    
                    {role === 'admin' && (
                      <button
                        onClick={() => removeRow(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 bg-red-500/5 rounded-xl transition-all"
                        title="ลบแถวนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Trap Title Area (Editable if admin) */}
                  <div className="mb-4">
                    {role === 'admin' ? (
                      <div className="space-y-2">
                        <select
                          value={row.dept}
                          onChange={(e) => handleCellChange(index, 'dept', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                        >
                          {DEPTS_LIST.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={row.area}
                          onChange={(e) => handleCellChange(index, 'area', e.target.value)}
                          placeholder="ตำแหน่งติดตั้งเครื่องดัก"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                        />
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0" />
                        <span>{row.area}</span>
                      </p>
                    )}
                  </div>

                  {/* Grid Inputs 2x2 */}
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    {/* Flies */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150/40 dark:border-slate-850 p-2 rounded-2xl">
                      <label htmlFor={`input-mobile-${index}-flies`} className="block text-[9px] font-bold text-slate-450 uppercase mb-1">แมลงวัน (Flies)</label>
                      <input
                        id={`input-mobile-${index}-flies`}
                        type="number"
                        min="0"
                        value={row.flies}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => handleKeyDown(e, index, 'flies')}
                        onChange={(e) => handleCellChange(index, 'flies', e.target.value)}
                        className="w-full text-center px-1 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 font-mono font-bold"
                      />
                    </div>

                    {/* Mosquitoes */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150/40 dark:border-slate-850 p-2 rounded-2xl">
                      <label htmlFor={`input-mobile-${index}-mosquitoes`} className="block text-[9px] font-bold text-slate-450 uppercase mb-1">ยุง (Mosquitoes)</label>
                      <input
                        id={`input-mobile-${index}-mosquitoes`}
                        type="number"
                        min="0"
                        value={row.mosquitoes}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => handleKeyDown(e, index, 'mosquitoes')}
                        onChange={(e) => handleCellChange(index, 'mosquitoes', e.target.value)}
                        className="w-full text-center px-1 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 font-mono font-bold"
                      />
                    </div>

                    {/* Ants */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150/40 dark:border-slate-850 p-2 rounded-2xl">
                      <label htmlFor={`input-mobile-${index}-ants`} className="block text-[9px] font-bold text-slate-450 uppercase mb-1">มด (Ants)</label>
                      <input
                        id={`input-mobile-${index}-ants`}
                        type="number"
                        min="0"
                        value={row.ants}
                        placeholder="0"
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => handleKeyDown(e, index, 'ants')}
                        onChange={(e) => handleCellChange(index, 'ants', e.target.value)}
                        className="w-full text-center px-1 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 font-mono font-bold"
                      />
                    </div>

                    {/* Others */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150/40 dark:border-slate-850 p-2 rounded-2xl">
                      <label htmlFor={`input-mobile-${index}-others`} className="block text-[9px] font-bold text-slate-450 uppercase mb-1">แมลงอื่นๆ (Others)</label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          id={`input-mobile-${index}-others`}
                          type="number"
                          min="0"
                          value={row.others}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onKeyDown={(e) => handleKeyDown(e, index, 'others')}
                          onChange={(e) => handleCellChange(index, 'others', e.target.value)}
                          className="w-full text-center px-1 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 font-mono font-bold"
                        />
                        <button
                          onClick={() => openOthersModal(index)}
                          className="p-2 text-indigo-650 bg-indigo-500/5 border border-indigo-500/10 rounded-xl transition-all relative"
                          title="ระบุสถิติประเภทอื่นย่อย"
                        >
                          <ListPlus className="w-4 h-4" />
                          {row.othersDetails && row.othersDetails.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-550 border border-white dark:border-slate-900 rounded-full" />
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Utility control buttons (Add and Reset) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-850 rounded-3xl mb-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            {role === 'admin' ? (
              <button
                onClick={addRow}
                className="inline-flex items-center gap-1.5 py-2.5 px-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-extrabold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>เพิ่มเครื่องดักใหม่ (+ Add Row)</span>
              </button>
            ) : (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>การลบหรือจัดโครงสร้างตารางถูกจำกัดไว้สำหรับสิทธิ์ผู้ควบคุม (Admin) เท่านั้น</span>
              </p>
            )}
          </div>

          <button
            onClick={resetTable}
            className="inline-flex items-center gap-1.5 py-2 px-4 text-slate-550 hover:text-slate-850 dark:text-slate-400 dark:hover:text-white text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตจัดกลุ่มตามเอกสาร (33 แถวดั้งเดิม)</span>
          </button>
        </div>

        {/* Submit Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4 font-sans">
          <Link 
            href="/dashboard"
            className="px-6 py-3.5 rounded-2xl bg-white border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-bold hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all text-center shadow-sm"
          >
            เปิดหน้าสรุปผลกราฟแดชบอร์ด
          </Link>

          <button
            type="button"
            onClick={clearAllData}
            className="px-6 py-3.5 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs sm:text-sm font-bold rounded-2xl transition-all text-center shadow-sm bg-white dark:bg-slate-900"
          >
            ล้างตัวเลขตรวจนับทั้งหมด
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-w-[200px] ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>กำลังส่งบันทึกข้อมูล...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกผลตรวจสอบลงระบบ</span>
              </>
            )}
          </button>
        </div>
          </>
        )}
      </div>

      {/* --- OTHERS DETAILS MODAL --- */}
      {isModalOpen && activeRowIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-sans">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-white">
                  ระบุรายละเอียดสถิติ: แมลงอื่นๆ
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate max-w-[280px]" title={rows[activeRowIndex]?.area}>
                  แผนก: {rows[activeRowIndex]?.dept} | ตำแหน่ง: {rows[activeRowIndex]?.area || 'ไม่ระบุ'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-6">
              
              {/* Form Input Item */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <p className="text-xs font-extrabold text-slate-500 mb-3">บันทึกแมลงอื่นๆ</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">เลือกประเภท</label>
                    <select
                      value={newOtherName}
                      onChange={(e) => setNewOtherName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-750 dark:text-slate-350"
                    >
                      {DEFAULT_INSECT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      {customInsectTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="อื่น ๆ (พิมพ์ระบุเอง)">อื่น ๆ (พิมพ์ระบุเอง)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">จำนวน (ตัว)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="เช่น 1, 2"
                      value={newOtherCount}
                      onChange={(e) => setNewOtherCount(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                    />
                  </div>
                </div>

                {newOtherName === 'อื่น ๆ (พิมพ์ระบุเอง)' && (
                  <div className="mb-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ระบุชื่อสายพันธุ์แมลง</label>
                    <input
                      type="text"
                      placeholder="เช่น ด้วงก้นกระดก, แมลงปอ"
                      value={newOtherCustomName}
                      onChange={(e) => setNewOtherCustomName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={addOtherItem}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  เพิ่มข้อมูลลงรายการย่อย
                </button>
              </div>

              {/* Items List */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">รายการแมลงอื่นๆ ที่เพิ่มแล้ว:</p>
                <div className="max-h-[160px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                  {modalItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-450 font-semibold">
                      ยังไม่มีรายการย่อยบันทึกตรวจพบ
                    </div>
                  ) : (
                    modalItems.map((item, idx) => (
                      <div key={idx} className="p-3 px-4 flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-250">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900 dark:text-white font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                            {item.count} ตัว
                          </span>
                          <button
                            onClick={() => removeOtherItem(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-all"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-350"
              >
                ยกเลิก
              </button>
              
              <button
                type="button"
                onClick={saveOthersDetails}
                className="px-5 py-2 bg-slate-950 text-white dark:bg-white dark:text-slate-950 text-xs font-extrabold rounded-xl hover:bg-indigo-650 dark:hover:bg-indigo-400 hover:text-white dark:hover:text-slate-950 transition-all shadow-sm"
              >
                คำนวณและปิดยอดรวม ({modalItems.reduce((s, i) => s + (parseInt(i.count, 10) || 0), 0)} ตัว)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── Custom Dialog Popup ─── */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeDialog} />
          
          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 transform scale-100 transition-all font-sans">
            
            {/* Header Icon & Title */}
            <div className="p-6 pb-4 text-center">
              {dialog.type === 'success' && (
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 text-3xl animate-bounce">
                  ✓
                </div>
              )}
              {dialog.type === 'warning' && (
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 text-3xl animate-pulse">
                  ⚠️
                </div>
              )}
              {dialog.type === 'confirm' && (
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 text-3xl">
                  ❓
                </div>
              )}

              <h3 className="text-base font-extrabold text-slate-850 dark:text-white mb-2">
                {dialog.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed px-2">
                {dialog.message}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-3">
              {dialog.type === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={closeDialog}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-350 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (dialog.onConfirm) dialog.onConfirm();
                      closeDialog();
                    }}
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    ยืนยัน
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (dialog.onConfirm) dialog.onConfirm();
                    closeDialog();
                  }}
                  className="px-6 py-2 bg-slate-950 hover:bg-slate-850 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  ตกลง
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
