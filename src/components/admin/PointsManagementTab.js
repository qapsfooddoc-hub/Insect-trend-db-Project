'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  MapPin, Plus, Pencil, Trash2, RefreshCw, Search, 
  Filter, Check, AlertTriangle, X, ShieldAlert, Sparkles,
  ToggleLeft, ToggleRight, Info, Eye, EyeOff, Layers, CheckCircle2
} from 'lucide-react';
import {
  DEFAULT_LIGHT_TRAPS,
  DEFAULT_COCKROACH_POINTS,
  DEFAULT_RODENT_STATIONS,
  getStoredPoints,
  saveStoredPoints,
  resetStoredPoints,
  addPoint,
  updatePoint,
  deletePoint,
  togglePointStatus,
  deriveDepartmentsList,
  deriveCockroachZones
} from '@/lib/data/pointsManager';

const CATEGORIES = [
  { id: 'light_traps', label: 'เครื่องดักแมลง (Light Traps)', icon: '🪰', shortLabel: 'เครื่องดักแมลง', unit: 'เครื่อง', addLabel: '+ เพิ่มเครื่องดักแมลง' },
  { id: 'cockroaches', label: 'บ้านแมลงสาบ (Cockroach Traps)', icon: '🪳', shortLabel: 'บ้านแมลงสาบ', unit: 'จุด', addLabel: '+ เพิ่มจุดวางบ้านแมลงสาบ' },
  { id: 'rodents', label: 'กับดักหนู (Rodent Stations)', icon: '🐀', shortLabel: 'กับดักหนู', unit: 'สถานี', addLabel: '+ เพิ่มสถานีกับดักหนู' },
  { id: 'lizards', label: 'กับดักจิ้งจก (Lizard Stations)', icon: '🦎', shortLabel: 'กับดักจิ้งจก', unit: 'สถานี', addLabel: '+ เพิ่มสถานีกับดักจิ้งจก' },
];

export default function PointsManagementTab({ onNotify, initialCategory = 'light_traps' }) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [pointsList, setPointsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null); // null = Add mode, object = Edit mode
  const [formData, setFormData] = useState({
    no: '',
    departmentOrZone: '',
    location: '',
    code: '',
    status: 'active',
    notes: '',
    isCustomDept: false
  });
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal
  const [deletingPoint, setDeletingPoint] = useState(null);

  // Reset Confirmation Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Load points whenever activeCategory changes
  useEffect(() => {
    const loaded = getStoredPoints(activeCategory);
    setPointsList(loaded);
    setFilterDept('all');
    setSearchQuery('');
  }, [activeCategory]);

  // Listen for points updates from other tabs/windows
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail?.category === activeCategory) {
        setPointsList(e.detail.points);
      }
    };
    window.addEventListener('points-updated', handleSync);
    return () => window.removeEventListener('points-updated', handleSync);
  }, [activeCategory]);

  // Current category metadata
  const currentCategoryMeta = useMemo(() => {
    return CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  }, [activeCategory]);

  // Unique departments/zones in the active category
  const availableDeptsOrZones = useMemo(() => {
    const set = new Set();
    pointsList.forEach(pt => {
      const val = pt.department || pt.zone;
      if (val) set.add(val);
    });
    return Array.from(set);
  }, [pointsList]);

  // Filtered points
  const filteredPoints = useMemo(() => {
    return pointsList.filter(pt => {
      // Dept/Zone filter
      const deptVal = pt.department || pt.zone;
      if (filterDept !== 'all' && deptVal !== filterDept) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all' && pt.status !== filterStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNo = pt.no?.toLowerCase().includes(q);
        const matchDept = deptVal?.toLowerCase().includes(q);
        const matchLoc = pt.location?.toLowerCase().includes(q);
        const matchName = pt.name?.toLowerCase().includes(q);
        const matchNotes = pt.notes?.toLowerCase().includes(q);
        if (!matchNo && !matchDept && !matchLoc && !matchName && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [pointsList, filterDept, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = pointsList.length;
    const active = pointsList.filter(p => p.status !== 'inactive').length;
    const inactive = total - active;
    const deptsCount = availableDeptsOrZones.length;
    return { total, active, inactive, deptsCount };
  }, [pointsList, availableDeptsOrZones]);

  // Calculate next recommended point number for Add Mode
  const getNextRecommendedNumber = () => {
    if (activeCategory === 'light_traps') {
      let maxNum = 0;
      pointsList.forEach(p => {
        const match = p.no?.match(/\d+/);
        if (match) {
          const n = parseInt(match[0], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      const next = maxNum + 1;
      return `(${String(next).padStart(2, '0')})`;
    } else if (activeCategory === 'cockroaches') {
      let maxNum = 0;
      pointsList.forEach(p => {
        const n = parseInt(p.no, 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      });
      return String(maxNum + 1).padStart(2, '0');
    } else if (activeCategory === 'lizards') {
      let maxNum = 0;
      pointsList.forEach(p => {
        const match = p.no?.match(/\d+/) || p.name?.match(/\d+/);
        if (match) {
          const n = parseInt(match[0], 10);
          if (n > maxNum) maxNum = n;
        }
      });
      return `สถานีที่ ${maxNum + 1}`;
    } else {
      return `สถานี ${pointsList.length + 1}`;
    }
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPoint(null);
    const recNo = getNextRecommendedNumber();
    const defaultDept = availableDeptsOrZones[0] || (activeCategory === 'lizards' ? 'โรงงาน' : '');
    setFormData({
      no: recNo,
      departmentOrZone: defaultDept,
      location: activeCategory === 'lizards' ? `จุดตรวจดักจับจิ้งจก ${recNo}` : '',
      code: '',
      status: 'active',
      notes: '',
      isCustomDept: false
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pt) => {
    setEditingPoint(pt);
    const dept = pt.department || pt.zone || (activeCategory === 'lizards' ? 'โรงงาน' : '');
    setFormData({
      no: pt.no,
      departmentOrZone: dept,
      location: pt.location || '',
      code: pt.code || '',
      status: pt.status || 'active',
      notes: pt.notes || '',
      isCustomDept: !availableDeptsOrZones.includes(dept) && dept !== ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  // Handle Save (Add or Update)
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.no.trim()) {
      setFormError('กรุณาระบุหมายเลขจุด/รหัส');
      return;
    }
    if (!formData.departmentOrZone.trim() && activeCategory !== 'lizards') {
      setFormError(activeCategory === 'cockroaches' ? 'กรุณาระบุโซนพื้นที่' : 'กรุณาระบุแผนกที่ติดตั้ง');
      return;
    }
    if (!formData.location.trim() && activeCategory === 'light_traps') {
      setFormError('กรุณาระบุตำแหน่งติดตั้งโดยละเอียด');
      return;
    }

    try {
      const payload = {
        no: formData.no.trim(),
        department: (activeCategory !== 'cockroaches' && activeCategory !== 'lizards') ? formData.departmentOrZone.trim() : (activeCategory === 'lizards' ? (formData.departmentOrZone.trim() || 'โรงงาน') : ''),
        zone: activeCategory === 'cockroaches' ? formData.departmentOrZone.trim() : '',
        location: formData.location.trim() || formData.departmentOrZone.trim() || `จุดตรวจดักจับจิ้งจก ${formData.no.trim()}`,
        code: formData.code.trim(),
        status: formData.status,
        notes: formData.notes.trim()
      };

      let updated;
      if (editingPoint) {
        updated = updatePoint(activeCategory, editingPoint.id, payload);
        if (onNotify) onNotify({ text: `บันทึกการแก้ไขจุด ${payload.no} เรียบร้อยแล้ว`, type: 'success' });
      } else {
        updated = addPoint(activeCategory, payload);
        if (onNotify) onNotify({ text: `เพิ่มจุดติดตั้ง ${payload.no} เรียบร้อยแล้ว`, type: 'success' });
      }
      setPointsList(updated);
      setIsFormModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deletingPoint) return;
    try {
      const updated = deletePoint(activeCategory, deletingPoint.id);
      setPointsList(updated);
      if (onNotify) onNotify({ text: `ลบจุดติดตั้ง ${deletingPoint.no} (${deletingPoint.name}) เรียบร้อยแล้ว`, type: 'success' });
      setDeletingPoint(null);
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify({ text: 'เกิดข้อผิดพลาดในการลบจุด', type: 'error' });
    }
  };

  // Handle Toggle Status
  const handleToggleStatus = (pt) => {
    try {
      const updated = togglePointStatus(activeCategory, pt.id);
      setPointsList(updated);
      const newStatus = pt.status === 'active' ? 'พักใช้งาน' : 'ใช้งานปกติ';
      if (onNotify) onNotify({ text: `ปรับสถานะจุด ${pt.no} เป็น "${newStatus}" แล้ว`, type: 'info' });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Reset to Defaults
  const handleConfirmReset = () => {
    try {
      const defaults = resetStoredPoints(activeCategory);
      setPointsList(defaults);
      setIsResetModalOpen(false);
      if (onNotify) onNotify({ text: `คืนค่าเริ่มต้นรายการจุดตรวจ ${currentCategoryMeta.shortLabel} เรียบร้อยแล้ว`, type: 'success' });
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify({ text: 'เกิดข้อผิดพลาดในการคืนค่าเริ่มต้น', type: 'error' });
    }
  };

  // Live preview text for modal
  const livePreviewName = useMemo(() => {
    const no = formData.no.trim() || 'No.XX';
    const dept = formData.departmentOrZone.trim() || 'แผนก/โซน';
    const loc = formData.location.trim() || 'ตำแหน่งติดตั้ง';

    if (activeCategory === 'light_traps') {
      const formattedNo = no.startsWith('(') ? no : `(${no})`;
      return `${formattedNo} ${loc}`;
    } else if (activeCategory === 'cockroaches') {
      return `${no} (${dept})`;
    } else if (activeCategory === 'rodents') {
      return `${no} (${formData.code || 'Code'}) ${dept}`;
    } else {
      return loc ? `${no} (${loc})` : `จุดตรวจดักจับจิ้งจก ${no}`;
    }
  }, [formData, activeCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ─── Top Category Switcher Tabs ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Admin Points Configuration System
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                ซิงค์เรียลไทม์กับแบบฟอร์ม
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
              <span>📍 จัดการจุดตรวจและเครื่องดัก (Points & Traps Management)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              เพิ่ม ลบ แก้ไขหมายเลขจุด แผนก/โซน และตำแหน่งติดตั้งของเครื่องดักแมลง บ้านแมลงสาบ กับดักหนู และกับดักจิ้งจก ข้อมูลจะเชื่อมโยงไปที่แบบบันทึกและรายงานทันที
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer ring-2 ring-indigo-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{currentCategoryMeta.addLabel || '+ เพิ่มสถานีใหม่'}</span>
            </button>
          </div>
        </div>

        {/* Category Pills Switcher */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => {
            const isSelected = activeCategory === cat.id;
            const count = getStoredPoints(cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h4 className={`text-xs font-black ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                      {cat.shortLabel}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      {cat.unit}ที่ลงทะเบียนในระบบ
                    </p>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-xl font-mono text-xs font-black ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {count} {cat.unit}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Summary KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-450 mb-1">
            <span className="text-[10px] font-bold uppercase">จุดตรวจทั้งหมด</span>
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {stats.total} <span className="text-xs font-normal text-slate-450">{currentCategoryMeta.unit}</span>
          </div>
          <p className="text-[10px] text-slate-450 mt-1">
            ครอบคลุม {stats.deptsCount} แผนก/โซน
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-450 mb-1">
            <span className="text-[10px] font-bold uppercase">กำลังใช้งานปกติ</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.active} <span className="text-xs font-normal text-slate-450">{currentCategoryMeta.unit}</span>
          </div>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            แสดงผลในแบบฟอร์มตรวจนับ
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-450 mb-1">
            <span className="text-[10px] font-bold uppercase">พักใช้งานชั่วคราว</span>
            <EyeOff className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {stats.inactive} <span className="text-xs font-normal text-slate-450">{currentCategoryMeta.unit}</span>
          </div>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            ซ่อนจากการตรวจนับชั่วคราว
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-450 mb-1">
            <span className="text-[10px] font-bold uppercase">{activeCategory === 'cockroaches' ? 'โซนตรวจวัด' : 'แผนกที่ดูแล'}</span>
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400">
            {stats.deptsCount} <span className="text-xs font-normal text-slate-450">พื้นที่</span>
          </div>
          <p className="text-[10px] text-slate-450 mt-1">
            พร้อมวิเคราะห์แยกกลุ่มรายงาน
          </p>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`ค้นหาหมายเลขจุด, แผนก/โซน หรือตำแหน่งติดตั้ง...`}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800 dark:text-slate-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dept/Zone Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-transparent font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">ทุกแผนก / ทุกโซน ({stats.deptsCount})</option>
                {availableDeptsOrZones.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-white dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ทั้งหมด ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('active')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'active'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ใช้งาน ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('inactive')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'inactive'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                พัก ({stats.inactive})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Points Data Table ─── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-base">{currentCategoryMeta.icon}</span>
            <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">
              รายการ{currentCategoryMeta.shortLabel} ({filteredPoints.length} จาก {stats.total} {currentCategoryMeta.unit})
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-450 hidden sm:inline">
              คลิกสถานะเพื่อเปิด/ปิด หรือคลิกดินสอเพื่อแก้ไข
            </span>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{currentCategoryMeta.addLabel || '+ เพิ่มสถานีใหม่'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 font-extrabold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 w-20 text-center">รหัส/จุด</th>
                <th className="py-3 px-4 w-40">{activeCategory === 'cockroaches' ? 'โซนพื้นที่' : (activeCategory === 'lizards' ? 'พื้นที่ติดตั้ง' : 'แผนกที่รับผิดชอบ')}</th>
                <th className="py-3 px-4">ตำแหน่งติดตั้งโดยละเอียด</th>
                <th className="py-3 px-4 w-52">ชื่อแสดงในรายงาน</th>
                <th className="py-3 px-4 w-28 text-center">สถานะ</th>
                <th className="py-3 px-4 w-28 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredPoints.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-450">
                    <p className="font-bold text-xs">ไม่พบจุดติดตั้งตามเงื่อนไขที่ค้นหา</p>
                    <p className="text-[11px] mt-1 mb-3">ลองเปลี่ยนคำค้นหา หรือกดปุ่มเพิ่มด้านล่างนี้</p>
                    <button
                      type="button"
                      onClick={handleOpenAdd}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{currentCategoryMeta.addLabel || '+ เพิ่มสถานีใหม่'}</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPoints.map((pt, idx) => {
                  const isInactive = pt.status === 'inactive';
                  const deptVal = pt.department || pt.zone || (activeCategory === 'lizards' ? 'โรงงาน' : '-');

                  return (
                    <tr 
                      key={pt.id || idx}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isInactive ? 'opacity-60 bg-slate-50/40 dark:bg-slate-950/20' : ''
                      }`}
                    >
                      {/* Point No Badge */}
                      <td className="py-3 px-4 text-center font-mono font-black text-slate-900 dark:text-white">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs ${
                          activeCategory === 'cockroaches'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : activeCategory === 'light_traps'
                              ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                              : activeCategory === 'lizards'
                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {pt.no}
                        </span>
                      </td>

                      {/* Dept / Zone */}
                      <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {deptVal}
                        </span>
                      </td>

                      {/* Location Description */}
                      <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                        <div>
                          <span>{pt.location || '-'}</span>
                          {pt.notes && (
                            <span className="block text-[10px] text-slate-450 italic mt-0.5">
                              หมายเหตุ: {pt.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Full Name Preview */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={pt.name}>
                        {pt.name}
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(pt)}
                          title={`คลิกเพื่อ ${isInactive ? 'เปิดใช้งาน' : 'พักการใช้งานชั่วคราว'}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                            isInactive
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isInactive ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span>{isInactive ? 'พักใช้งาน' : 'ใช้งาน'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(pt)}
                            title="แก้ไขข้อมูลจุดนี้"
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 dark:hover:bg-indigo-950/50 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPoint(pt)}
                            title="ลบจุดนี้ออกจากระบบ"
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-950/50 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Add shortcut */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 px-6">
          <span className="text-[11px] text-slate-450">
            แสดง {filteredPoints.length} จากทั้งหมด {stats.total} {currentCategoryMeta.unit} ({stats.active} ใช้งาน, {stats.inactive} พัก)
          </span>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{currentCategoryMeta.addLabel || '+ เพิ่มสถานีใหม่'}</span>
          </button>
        </div>
      </div>

      {/* ─── ADD / EDIT POINT MODAL ─── */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
                  {editingPoint ? '✏️' : '➕'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {editingPoint ? `แก้ไขข้อมูลจุดติดตั้ง (${formData.no})` : `เพิ่มจุดติดตั้งใหม่ (${currentCategoryMeta.shortLabel})`}
                  </h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">
                    หมวดหมู่: {currentCategoryMeta.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error notice */}
            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveForm} className="space-y-4 mt-5">
              
              {/* Row 1: Point Number & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    หมายเลขจุด / รหัส <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.no}
                    onChange={(e) => setFormData(prev => ({ ...prev, no: e.target.value }))}
                    placeholder={activeCategory === 'light_traps' ? 'เช่น (34)' : activeCategory === 'cockroaches' ? 'เช่น 24' : 'เช่น สถานี 11'}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                  <span className="block text-[9px] text-slate-450 mt-0.5">
                    {activeCategory === 'light_traps' ? 'ใส่ในวงเล็บ เช่น (01), (34)' : 'ใส่ตัวเลข 2 หลัก เช่น 01, 24'}
                  </span>
                </div>

                {activeCategory === 'rodents' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                      รหัสสถานี (Station Code)
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="เช่น 67"
                      className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                    สถานะการใช้งาน
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="active">🟢 เปิดใช้งานปกติ (Active)</option>
                    <option value="inactive">🟡 พักการใช้งานชั่วคราว (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Department or Zone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                    {activeCategory === 'cockroaches' ? 'โซนพื้นที่' : 'แผนกที่ติดตั้ง'} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isCustomDept: !prev.isCustomDept }))}
                    className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {formData.isCustomDept ? '← เลือกจากรายการที่มีอยู่' : '+ พิมพ์แผนก/โซนใหม่'}
                  </button>
                </div>

                {formData.isCustomDept ? (
                  <input
                    type="text"
                    required
                    value={formData.departmentOrZone}
                    onChange={(e) => setFormData(prev => ({ ...prev, departmentOrZone: e.target.value }))}
                    placeholder="พิมพ์ชื่อแผนกหรือโซนใหม่ที่ต้องการสร้าง..."
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                  />
                ) : (
                  <select
                    value={formData.departmentOrZone}
                    onChange={(e) => setFormData(prev => ({ ...prev, departmentOrZone: e.target.value }))}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="">-- กรุณาเลือกแผนก/โซน --</option>
                    {availableDeptsOrZones.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row 3: Location Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  ตำแหน่งติดตั้งโดยละเอียด {activeCategory === 'light_traps' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={activeCategory === 'light_traps'}
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={
                    activeCategory === 'light_traps' 
                      ? 'เช่น ห้องตัดแต่ง บริเวณทางหนีไฟ' 
                      : activeCategory === 'cockroaches'
                        ? 'เช่น ใต้ตู้ล็อกเกอร์ แถวที่ 2'
                        : 'เช่น บริเวณแนวกำแพงทางเข้าสโตร์'
                  }
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Row 4: Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="เช่น ติดตั้งเพิ่มตามข้อเสนอแนะ Audit Q3/2569"
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1">
                <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase">
                  ตัวอย่างการแสดงผลในรายงานและตาราง:
                </span>
                <p className="font-mono text-xs font-bold text-indigo-900 dark:text-indigo-200 break-all">
                  {livePreviewName}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingPoint ? 'บันทึกการแก้ไข' : 'บันทึกเพิ่มจุด'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingPoint && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  ยืนยันการลบจุดติดตั้ง?
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  การกระทำนี้จะนำจุดนี้ออกจากแบบฟอร์มบันทึกในอนาคต
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl space-y-1 my-4">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                หมายเลข: <span className="font-mono text-red-600 dark:text-red-400 font-black">{deletingPoint.no}</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                พื้นที่: <span className="font-semibold">{deletingPoint.department || deletingPoint.zone}</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                ตำแหน่ง: <span className="font-semibold">{deletingPoint.location || deletingPoint.name}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed mb-5">
              💡 ข้อมูลสถิติย้อนหลังในรายงานที่เคยบันทึกไว้จะไม่สูญหาย แต่จุดนี้จะไม่ปรากฏในการกรอกข้อมูลรอบใหม่
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingPoint(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ยืนยันลบจุดนี้</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESET CONFIRMATION MODAL ─── */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg shrink-0">
                🔄
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  คืนค่าเริ่มต้น {currentCategoryMeta.shortLabel}?
                </h3>
                <p className="text-[11px] text-slate-450 mt-0.5">
                  รีเซ็ตรายการจุดตรวจทั้งหมดในหมวดนี้กลับเป็นค่าตั้งต้นตามเอกสาร FM-QC
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 my-4 leading-relaxed">
              การคืนค่าเริ่มต้นจะนำจุดที่ท่านได้เพิ่มหรือแก้ไขทั้งหมดกลับเป็นค่ามาตรฐานจากโรงงาน ({activeCategory === 'light_traps' ? '33 เครื่อง' : activeCategory === 'cockroaches' ? '23 จุด' : '10 สถานี'})
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ยืนยันคืนค่าเริ่มต้น</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
