'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const result = await res.json();
        // Handle mock users logic in demo mode
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
        console.error('Navbar failed to fetch users:', err);
        const local = localStorage.getItem('users_profile_mock');
        if (local) setUsers(JSON.parse(local));
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      const saved = localStorage.getItem('currentSimulatedUser');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const found = users.find(u => String(u.id) === String(parsed.id));
          if (found) {
            setCurrentUser(found);
            return;
          }
        } catch (e) {}
      }
      // Default to Admin, then Supervisor, then QA Manager, then first user
      const adminUser = users.find(u => u.role?.toLowerCase() === 'admin');
      const supervisorUser = users.find(u => u.role?.toLowerCase() === 'department supervisor');
      const qaUser = users.find(u => u.role?.toLowerCase() === 'qa manager');
      const defaultUser = adminUser || supervisorUser || qaUser || users[0];
      setCurrentUser(defaultUser);
      localStorage.setItem('currentSimulatedUser', JSON.stringify(defaultUser));
    }
  }, [users]);

  const handleUserChange = (userId) => {
    const user = users.find(u => String(u.id) === String(userId));
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentSimulatedUser', JSON.stringify(user));
      // Dispatch a custom event to notify other components reactively
      window.dispatchEvent(new Event('currentSimulatedUserChanged'));
    }
  };

  // Helper to determine active link styles
  const getLinkClass = (path, activeColorClass) => {
    const baseClass = "px-3 py-1.5 text-xs font-black rounded-xl border transition-all whitespace-nowrap";
    const isActive = pathname === path;
    
    if (isActive) {
      return `${baseClass} ${activeColorClass}`;
    }
    return `${baseClass} bg-white hover:bg-slate-50 border-slate-200 text-slate-550 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400`;
  };

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 flex items-center justify-center font-black text-lg">
            🐜
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">รายงานการตรวจนับจำนวนแมลง</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
              บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
            </p>
          </div>
        </div>

        {/* Navigation Tabs and User Simulation selector */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <Link 
              href="/"
              className={getLinkClass("/", "bg-blue-50/80 border-blue-200 text-blue-750 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-450 shadow-sm")}
            >
              📊 แดชบอร์ด & AI วิเคราะห์
            </Link>
            
            <Link 
              href="/supervisor"
              className={getLinkClass("/supervisor", "bg-emerald-50/80 border-emerald-200 text-emerald-750 dark:bg-emerald-955/20 dark:border-emerald-900/50 dark:text-emerald-400 shadow-sm")}
            >
              📋 บันทึกการรับทราบรายงาน
            </Link>

            <Link 
              href="/inspection"
              className={getLinkClass("/inspection", "bg-amber-50/80 border-amber-200 text-amber-750 dark:bg-amber-955/20 dark:border-amber-900/50 dark:text-amber-400 shadow-sm")}
            >
              📝 บันทึกผลตรวจรายสัปดาห์
            </Link>
            
            <Link 
              href="/admin"
              className={getLinkClass("/admin", "bg-purple-50/80 border-purple-200 text-purple-750 dark:bg-purple-955/20 dark:border-purple-900/50 dark:text-purple-400 shadow-sm")}
            >
              👥 จัดการผู้ใช้งาน
            </Link>
          </div>

          {/* User Profile & Logout */}
          {currentUser && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-indigo-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-900/50 px-2.5 py-1 rounded-2xl w-full sm:w-auto">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                  คุณ {currentUser.full_name} ({currentUser.role})
                </span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('currentSimulatedUser');
                  window.location.href = '/login';
                }}
                className="px-3 py-1.5 text-xs font-black text-white bg-red-500 hover:bg-red-650 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
              >
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
