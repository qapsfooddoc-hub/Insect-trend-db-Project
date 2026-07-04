'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Pencil, Trash2, RefreshCw, Plus, Sparkles, 
  Calendar, Save, Trash, AlertCircle, PlusCircle, Check
} from 'lucide-react';

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

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'inspections', or 'approvals'

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
    if (activeTab === 'inspections') {
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
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
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
