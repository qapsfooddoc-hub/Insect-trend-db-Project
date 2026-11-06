'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';

export default function CockroachesError({ error, reset }) {
  useEffect(() => {
    console.error('Cockroaches route error boundary caught:', error);
  }, [error]);

  const handleResetCache = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cockroach_zone_statuses');
        localStorage.removeItem('cockroach_custom_narratives');
        window.location.reload();
      }
    } catch (_) {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">
            เกิดข้อผิดพลาดในการแสดงผล
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            ระบบพบข้อขัดข้องชั่วคราวในการเรนเดอร์หน้าจอหรือหน้าพิมพ์รายงาน (ข้อมูลการบันทึกทั้งหมดถูกจัดเก็บอย่างปลอดภัย)
          </p>
          {error?.message && (
            <p className="mt-3 text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900 font-mono text-left break-all">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
          <button
            onClick={handleResetCache}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="ล้างแคชสถานะและโหลดหน้าจอใหม่"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ล้างแคชและโหลดใหม่</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
