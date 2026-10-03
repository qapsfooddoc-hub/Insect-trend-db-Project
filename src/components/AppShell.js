'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Bug, Rat, Activity, FileText, 
  CheckCircle2, Settings, ShieldCheck, Layers, Search, 
  Calendar, Bell, ChevronRight, Menu, X, LogOut, 
  User, Maximize2, Sparkles, Check, ChevronDown
} from 'lucide-react';

const NAV_GROUPS = [
  {
    group: 'ภาพรวมระบบ',
    items: [
      {
        name: 'แดชบอร์ด & ภาพรวม',
        href: '/',
        icon: LayoutDashboard,
        color: 'text-blue-400'
      }
    ]
  },
  {
    group: 'แบบฟอร์มตรวจติดตาม (FM)',
    items: [
      {
        name: 'ตรวจเดินไลน์ (พาหะนำโรค)',
        code: 'FM-QC-08/01',
        href: '/line-walk',
        icon: Activity,
        color: 'text-purple-400',
        badge: '22 จุด'
      },
      {
        name: 'ตรวจนับแมลงบิน (33 จุด)',
        code: 'FM-QC-08/03',
        href: '/inspection',
        icon: Bug,
        color: 'text-sky-400',
        badge: '33 จุด'
      },
      {
        name: 'ตรวจนับจำนวนจิ้งจก',
        code: 'FM-QC-08/04',
        href: '/lizards',
        icon: ShieldCheck,
        color: 'text-emerald-400',
        badge: '6 สถานี'
      },
      {
        name: 'ตรวจสอบบ้านแมลงสาบ',
        code: 'FM-QC-08/05',
        href: '/cockroaches',
        icon: Layers,
        color: 'text-amber-400',
        badge: '23 จุด'
      },
      {
        name: 'กับดักหนูที่สโตร์',
        code: 'Store Rodents',
        href: '/rodents',
        icon: Rat,
        color: 'text-rose-400',
        badge: '10 จุด'
      }
    ]
  },
  {
    group: 'การจัดการ & รายงาน',
    items: [
      {
        name: 'รับทราบรายงาน QC',
        href: '/supervisor',
        icon: CheckCircle2,
        color: 'text-emerald-400'
      },
      {
        name: 'แอดมิน & ตั้งค่าระบบ',
        href: '/admin',
        icon: Settings,
        color: 'text-slate-400'
      },
      {
        name: 'คู่มือการใช้งาน',
        href: '/manual',
        icon: FileText,
        color: 'text-teal-400'
      }
    ]
  }
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    setMounted(true);
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

    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('currentSimulatedUserChanged', syncUser);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // If login page, render plain without shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentSimulatedUser');
      router.push('/login');
    }
  };

  // Get current date formatted in Thai
  const todayFormatted = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="min-h-screen flex bg-[#F4F7FC] text-slate-800 antialiased font-sans">
      
      {/* ─── DESKTOP SIDEBAR (Dark Navy #0B132B) ─── */}
      <aside 
        className={`hidden lg:flex flex-col bg-[#0B132B] text-slate-300 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-50 select-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-3 border-b border-slate-800/80 bg-[#091024]">
          {sidebarCollapsed ? (
            <div className="w-full flex items-center justify-center">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-all flex items-center justify-center group cursor-pointer"
                title="ขยายเมนู (คลิกเพื่อเปิดแท็บ)"
              >
                <img 
                  src="/logo.png" 
                  alt="PS Logo" 
                  className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" 
                />
              </button>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5 min-w-0">
                <img 
                  src="/logo.png" 
                  alt="PS Logo" 
                  className="w-9 h-9 object-contain shrink-0" 
                />
                <div className="min-w-0">
                  <h1 className="text-xs font-black text-white tracking-wide truncate">
                    P.S. Food Products
                  </h1>
                  <p className="text-[10px] text-pink-400 font-bold truncate">
                    Smart Pest Monitoring
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer shrink-0"
                title="ย่อเมนู (ซ่อนแท็บ)"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 mb-2">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                      {!sidebarCollapsed && (
                        <div className="truncate">
                          <span className="block truncate">{item.name}</span>
                          {item.code && (
                            <span className={`text-[9px] font-mono block ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                              {item.code}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                          isActive ? 'text-white translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                        }`} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Widget (Like "Live Gold Rate" in screenshot) */}
        {!sidebarCollapsed && (
          <div className="p-3 m-3 rounded-2xl bg-[#070c1c] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 text-xs">🛡️</span>
                <span className="text-[11px] font-black text-white">มาตรฐาน GMP / HACCP</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-400">
              สถานะ: ระบบทำงานปกติ (เชื่อมต่อฐานข้อมูล 2569)
            </p>
          </div>
        )}

        {/* Logout / Switch User */}
        <div className="p-3 border-t border-slate-800/80 bg-[#091024]">
          {currentUser ? (
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/20 rounded-xl transition-all cursor-pointer ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title="ออกจากระบบ"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>ออกจากระบบ</span>}
            </button>
          ) : (
            <Link
              href="/login"
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-blue-400 hover:text-white hover:bg-blue-600/20 rounded-xl transition-all cursor-pointer ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title="เข้าสู่ระบบ"
            >
              <User className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>เข้าสู่ระบบ</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ─── MOBILE DRAWER (For Phone/Tablet) ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0B132B] text-slate-300 p-4 flex flex-col z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/logo.png" 
                  alt="PS Logo" 
                  className="w-8 h-8 object-contain shrink-0" 
                />
                <div>
                  <h2 className="text-xs font-black text-white">P.S. Food Products</h2>
                  <p className="text-[10px] text-pink-400 font-bold">Pest Monitoring System</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
              {NAV_GROUPS.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 mb-1">
                    {group.group}
                  </p>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComponent className="w-4 h-4" />
                          <span>{item.name}</span>
                        </div>
                        {item.code && (
                          <span className="text-[9px] font-mono text-slate-400">{item.code}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800">
              {currentUser ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ ({currentUser.full_name})</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  <User className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT AREA (Header + Children) ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Header Bar (Clean White like the screenshot) */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          
          {/* Left: Mobile Toggle + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-extrabold text-slate-900">ระบบตรวจติดตามและควบคุมสัตว์รบกวน</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด</span>
            </div>
          </div>

          {/* Center: Search Box (Matching Screenshot style) */}
          <div className="hidden md:flex items-center relative w-64 lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาจุดตรวจ / รหัส FM / ชนิดสัตว์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Right: Date, Notifications, Settings, Profile Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Current Date Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{todayFormatted}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                title="การแจ้งเตือน"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                  3
                </span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-800">การแจ้งเตือนสัตว์รบกวน</span>
                    <span className="text-[10px] font-bold text-blue-600">วันนี้</span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
                      <p className="font-bold text-[11px]">⚠️ จุดที่ 16 โหลด เฟส 5</p>
                      <p className="text-[10px] text-amber-700">พบแมลงวันเกินเกณฑ์ Action Limit (15 ตัว)</p>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-900">
                      <p className="font-bold text-[11px]">🚶 บันทึกเดินไลน์ FM-QC-08/01</p>
                      <p className="text-[10px] text-purple-700">รอทวนสอบประจำสัปดาห์</p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900">
                      <p className="font-bold text-[11px]">🦎 สถานีจิ้งจก 6 จุด</p>
                      <p className="text-[10px] text-emerald-700">สถานะปกติ ตรวจนับครบ 31 วัน</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {currentUser?.full_name ? currentUser.full_name[0] : 'QC'}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-extrabold text-slate-900 truncate max-w-[120px]">
                  {currentUser?.full_name ? `คุณ ${currentUser.full_name}` : 'Admin QC'}
                </p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-slate-400 font-bold">PS Food Main Plant</span>
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 bg-[#F4F7FC]">
          {children}
        </main>
      </div>

    </div>
  );
}
