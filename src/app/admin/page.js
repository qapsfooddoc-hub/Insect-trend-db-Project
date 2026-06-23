'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Pencil, Trash2, RefreshCw, Plus, Sparkles 
} from 'lucide-react';

const DEPTS_LIST = [
  'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด', 'เฟส 6', 
  'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
];

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
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
  const [adminMessage, setAdminMessage] = useState({ text: '', type: '' });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

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

  const [currentUser, setCurrentUser] = useState(null);

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

    syncCurrentUser();
    window.addEventListener('currentSimulatedUserChanged', syncCurrentUser);
    return () => {
      window.removeEventListener('currentSimulatedUserChanged', syncCurrentUser);
    };
  }, []);

  // Clear admin message after 4 seconds
  useEffect(() => {
    if (adminMessage.text) {
      const timer = setTimeout(() => {
        setAdminMessage({ text: '', type: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [adminMessage.text]);

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

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const userRoleLower = currentUser?.role?.toLowerCase() || '';
  const isAdmin = userRoleLower === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {!isAdmin ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl p-10 text-center shadow-sm max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
              🚫
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-red-650 dark:text-red-400 mb-2">
              ปฏิเสธการเข้าถึง - เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold max-w-md mx-auto mb-5 leading-relaxed">
              บัญชีปัจจุบันของคุณคือ <strong>{currentUser?.full_name || 'ไม่ระบุ'}</strong> (บทบาท: {currentUser?.role || 'พนักงานทั่วไป'}) ซึ่งไม่มีสิทธิ์เข้าใช้งานระบบจัดการผู้ใช้ระบบหลังบ้าน กรุณาสลับผู้ใช้งานจำลองในแถบเมนูด้านบนเป็น แอดมิน หรือเข้าสู่หน้าอื่น
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-slate-955 hover:bg-blue-600 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-blue-500 dark:hover:text-white text-xs font-extrabold rounded-2xl transition-all shadow-sm cursor-pointer"
            >
              <span>กลับไปหน้าแดชบอร์ดหลัก</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Header Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-880 pb-5">
          <div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              จัดการผู้ใช้งานระบบ (Admin Portal)
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
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Admin Alerts Panel */}
        {adminMessage.text && (
          <div className={`p-4 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 mb-6 ${
            adminMessage.type === 'success' 
              ? 'bg-emerald-50/70 border-emerald-250 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' 
              : adminMessage.type === 'error' 
                ? 'bg-red-50/80 border-red-250 text-red-750 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400' 
                : 'bg-blue-50/80 border-blue-250 text-blue-750 dark:bg-blue-955/20 dark:border-blue-900/50 dark:text-blue-450'
          }`}>
            <span className="text-sm">
              {adminMessage.type === 'success' ? '✅' : adminMessage.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <p>{adminMessage.text}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          
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
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Username / รหัสพนักงาน</label>
                  <input
                    type="text"
                    placeholder="สำหรับใช้ล็อกอินเข้าระบบ"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="รหัสผ่านสำหรับล็อกอิน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">ระดับสิทธิ์การเข้าใช้งาน</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 focus:outline-none cursor-pointer text-slate-850 dark:text-slate-200"
                  >
                    <option value="Operator">Operator (ผู้กรอกข้อมูล)</option>
                    <option value="Department Supervisor">Department Supervisor (หัวหน้าแผนก)</option>
                    <option value="QA Manager">QA Manager (ผู้จัดการ QA)</option>
                    <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">แผนกที่สังกัด</label>
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
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 focus:outline-none cursor-pointer text-slate-855 dark:text-slate-200 mb-2"
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
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-855 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold text-slate-800 dark:text-slate-200 animate-in slide-in-from-top-1 duration-200"
                      required
                    />
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-850">
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
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855 text-xs font-bold rounded-2xl transition-all cursor-pointer"
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
                    placeholder="🔍 ค้นหาตามชื่อ, username, แผนก..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="overflow-x-auto min-h-[350px]">
                <table className="min-w-full text-xs text-left text-slate-600 dark:text-slate-400">
                  <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100 dark:border-slate-855">
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
          </>
        )}
      </div>
    </div>
  );
}
