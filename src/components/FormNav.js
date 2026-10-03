'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Layers, ShieldCheck, Bug, Rat, CheckCircle2 } from 'lucide-react';

export const PEST_FORMS = [
  {
    id: 'insects',
    code: 'FM-QC-08/03',
    rev: 'Rev.07',
    name: 'ตรวจนับแมลงบิน',
    subtitle: '33 จุดตรวจ (หลอดไฟดักแมลง)',
    href: '/',
    dashHref: '/',
    entryHref: '/inspection',
    icon: '🪰',
    color: 'blue',
    activeBg: 'bg-blue-600 text-white shadow-blue-500/20 shadow-lg',
    activeBorder: 'border-blue-600',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
  },
  {
    id: 'lizards',
    code: 'FM-QC-08/04',
    rev: 'Rev.02',
    name: 'ตรวจนับจิ้งจก',
    subtitle: '6 สถานีจิ้งจก (ตรวจรายวัน)',
    href: '/lizards',
    dashHref: '/lizards',
    icon: '🦎',
    color: 'emerald',
    activeBg: 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg',
    activeBorder: 'border-emerald-600',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
  },
  {
    id: 'cockroaches',
    code: 'FM-QC-08/05',
    rev: 'Rev.02',
    name: 'บ้านแมลงสาบ',
    subtitle: '23 จุดวาง (ตรวจรายวัน/เปลี่ยนสัปดาห์)',
    href: '/cockroaches',
    dashHref: '/cockroaches',
    icon: '🪳',
    color: 'amber',
    activeBg: 'bg-amber-600 text-white shadow-amber-500/20 shadow-lg',
    activeBorder: 'border-amber-600',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
  },
  {
    id: 'line-walk',
    code: 'FM-QC-08/01',
    rev: 'Rev.11',
    name: 'ตรวจเดินไลน์ (พาหะนำโรค)',
    subtitle: 'อาคารเฟส 5 & คลังสินค้า 3',
    href: '/line-walk',
    dashHref: '/line-walk',
    icon: '🚶',
    color: 'purple',
    activeBg: 'bg-purple-600 text-white shadow-purple-500/20 shadow-lg',
    activeBorder: 'border-purple-600',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
  },
  {
    id: 'rodents',
    code: 'กับดักหนูสโตร์',
    rev: 'Rev.01',
    name: 'กับดักหนูที่สโตร์',
    subtitle: '10 สถานี (จุด 57-65)',
    href: '/rodents',
    dashHref: '/rodents',
    icon: '🪤',
    color: 'rose',
    activeBg: 'bg-rose-600 text-white shadow-rose-500/20 shadow-lg',
    activeBorder: 'border-rose-600',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
  }
];

export default function FormNav({ activeFormId, title = "เลือกแบบฟอร์มตรวจสอบและควบคุมสัตว์รบกวน" }) {
  const pathname = usePathname();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
          ครอบคลุม 5 ระบบติดตามตามมาตรฐาน GMP/HACCP
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {PEST_FORMS.map((form) => {
          const isActive = activeFormId 
            ? activeFormId === form.id 
            : (pathname === form.href || (form.id === 'insects' && (pathname === '/' || pathname === '/inspection')));

          return (
            <Link
              key={form.id}
              href={form.href}
              className={`group relative p-2.5 sm:p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                isActive
                  ? `${form.activeBg} border-transparent scale-[1.02]`
                  : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950/60 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">
                  {form.icon}
                </span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : form.badge
                }`}>
                  {form.code}
                </span>
              </div>

              <div>
                <p className={`text-xs sm:text-sm font-black truncate ${
                  isActive ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}>
                  {form.name}
                </p>
                <p className={`text-[10px] font-medium truncate mt-0.5 ${
                  isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {form.subtitle}
                </p>
              </div>

              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
