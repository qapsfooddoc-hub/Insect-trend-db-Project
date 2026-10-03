'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Users, Menu, X, ChevronDown, Layers, Bug, Check, HardDrive } from 'lucide-react';
import { PEST_FORMS } from '@/components/FormNav';
import BackupModal from '@/components/BackupModal';

export default function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formsMenuOpen, setFormsMenuOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('currentSimulatedUser');
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    };
    syncUser();
    window.addEventListener('currentSimulatedUserChanged', syncUser);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setFormsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('currentSimulatedUserChanged', syncUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper to determine active link styles
  const getLinkClass = (path, activeColorClass) => {
    const baseClass = "px-3 py-2 lg:py-1.5 text-xs font-black rounded-xl border transition-all whitespace-nowrap w-full lg:w-auto text-center block";
    const isActive = pathname === path;
    
    if (isActive) {
      return `${baseClass} ${activeColorClass}`;
    }
    return `${baseClass} bg-white hover:bg-slate-50 border-slate-200 text-slate-550 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400`;
  };

  const isFormActive = ['/lizards', '/cockroaches', '/line-walk', '/rodents'].includes(pathname);

  if (pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row items-center justify-between gap-4 lg:flex-wrap">
        
        {/* Brand / Logo */}
        <div className="flex items-center justify-between w-full lg:w-auto">
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="PS Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                ระบบตรวจติดตามสัตว์รบกวน & แมลง
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
              </p>
            </div>
          </Link>
          
          {/* Mobile hamburger menu toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl lg:hidden transition-all focus:outline-none cursor-pointer"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation links & user controls */}
        <div className={`${isOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row items-center gap-2.5 w-full lg:w-auto justify-end mt-2 lg:mt-0 transition-all duration-300 lg:flex-wrap`}>
          <div className="flex flex-col lg:flex-row lg:flex-wrap items-center gap-1.5 w-full lg:w-auto">
            
            <Link 
              href="/"
              onClick={() => setIsOpen(false)}
              className={getLinkClass("/", "bg-blue-50/80 border-blue-200 text-blue-750 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-450 shadow-sm")}
            >
              📊 แดชบอร์ด & AI
            </Link>

            {/* Forms Dropdown Menu */}
            <div className="relative w-full lg:w-auto" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setFormsMenuOpen(!formsMenuOpen)}
                className={`flex items-center justify-between lg:justify-center gap-1.5 px-3 py-2 lg:py-1.5 text-xs font-black rounded-xl border transition-all whitespace-nowrap w-full lg:w-auto cursor-pointer ${
                  isFormActive
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>แบบฟอร์มตรวจติดตาม</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${formsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Popover */}
              {formsMenuOpen && (
                <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[10px] font-extrabold text-slate-400 px-3 py-1 uppercase tracking-wider">
                    เลือกแบบฟอร์มตรวจสอบ (GMP / HACCP)
                  </p>
                  
                  {PEST_FORMS.map((form) => {
                    const isSelected = pathname === form.href || (form.id === 'insects' && pathname === '/');
                    return (
                      <Link
                        key={form.id}
                        href={form.href}
                        onClick={() => {
                          setFormsMenuOpen(false);
                          setIsOpen(false);
                        }}
                        className={`flex items-start gap-2.5 p-2 rounded-xl transition-all ${
                          isSelected 
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{form.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black truncate">{form.name}</span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                              {form.code}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{form.subtitle}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link 
              href="/inspection"
              onClick={() => setIsOpen(false)}
              className={getLinkClass("/inspection", "bg-amber-50/80 border-amber-200 text-amber-750 dark:bg-amber-955/20 dark:border-amber-900/50 dark:text-amber-400 shadow-sm")}
            >
              📝 บันทึกผลตรวจรายสัปดาห์
            </Link>
            
            <Link 
              href="/supervisor"
              onClick={() => setIsOpen(false)}
              className={getLinkClass("/supervisor", "bg-emerald-50/80 border-emerald-200 text-emerald-750 dark:bg-emerald-955/20 dark:border-emerald-900/50 dark:text-emerald-400 shadow-sm")}
            >
              📋 รับทราบรายงาน
            </Link>

            <Link 
              href="/admin"
              onClick={() => setIsOpen(false)}
              className={getLinkClass("/admin", "bg-purple-50/80 border-purple-200 text-purple-750 dark:bg-purple-955/20 dark:border-purple-900/50 dark:text-purple-400 shadow-sm")}
            >
              ⚙️ แอดมิน & ระบบ
            </Link>

            {/* Quick Full Backup Button */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsBackupOpen(true);
              }}
              className="px-3 py-2 lg:py-1.5 text-xs font-black rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition-all whitespace-nowrap w-full lg:w-auto text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="สำรองข้อมูลทั้งหมดลงไดร์ฟ/เครื่อง"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>💾 สำรองข้อมูล</span>
            </button>

            <Link 
              href="/manual"
              onClick={() => setIsOpen(false)}
              className={getLinkClass("/manual", "bg-teal-50/80 border-teal-200 text-teal-750 dark:bg-teal-955/20 dark:border-teal-900/50 dark:text-teal-400 shadow-sm")}
            >
              📖 คู่มือ
            </Link>
          </div>

          {/* User Profile & Logout / Login */}
          <div className="w-full lg:w-auto flex flex-col lg:flex-row items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
            {currentUser ? (
              <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto">
                <div className="flex items-center gap-2 border border-indigo-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-2xl w-full justify-center lg:justify-start">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                    คุณ {currentUser.full_name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    localStorage.removeItem('currentSimulatedUser');
                    window.location.href = '/login';
                  }}
                  className="px-2.5 py-1.5 text-xs font-black text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer w-full lg:w-auto text-center"
                >
                  ออก
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer w-full lg:w-auto text-center block"
              >
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>

      </div>

      {/* Global Backup & Restore Modal */}
      <BackupModal 
        isOpen={isBackupOpen} 
        onClose={() => setIsBackupOpen(false)} 
      />
    </header>
  );
}
