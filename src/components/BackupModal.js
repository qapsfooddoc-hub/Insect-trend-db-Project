'use client';

import { useState } from 'react';
import { 
  Database, Download, Upload, CheckCircle2, AlertTriangle, 
  X, HardDrive, RefreshCw, ShieldCheck, FileJson, FolderDown 
} from 'lucide-react';

export default function BackupModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [backupStats, setBackupStats] = useState(null);
  const [restoreProgress, setRestoreProgress] = useState(null);

  if (!isOpen) return null;

  // Gather complete backup payload from both Supabase API and LocalStorage
  const gatherFullBackupData = async () => {
    // 1. Fetch from server-side Supabase API
    let serverData = { tables: {} };
    try {
      const res = await fetch('/api/backup', { cache: 'no-store' });
      if (res.ok) {
        serverData = await res.json();
      }
    } catch (e) {
      console.warn('Server backup fetch error:', e);
    }

    // 2. Dump all relevant local storage data
    const localData = {};
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('lizard_') ||
           key.startsWith('cockroach_') ||
           key.startsWith('rodent_') ||
           key.startsWith('linewalk_') ||
           key.startsWith('insect_') ||
           key.startsWith('custom_') ||
           key.includes('records') ||
           key === 'currentSimulatedUser')
        ) {
          try {
            localData[key] = JSON.parse(localStorage.getItem(key));
          } catch {
            localData[key] = localStorage.getItem(key);
          }
        }
      }
    }

    const now = new Date();
    const timestampStr = now.toISOString();

    const fullPayload = {
      system_name: 'P.S. Food Products - Smart Pest Monitoring System',
      backup_timestamp: timestampStr,
      created_by: 'QC/QA Automated System',
      version: '2.0.0',
      database: serverData.tables || {},
      local_storage: localData,
      summary: {
        insect_inspections_count: serverData.tables?.insect_inspections?.length || 0,
        users_count: serverData.tables?.users_profile?.length || 0,
        lizards_records_count: serverData.tables?.lizards_summary?.length || 0,
        cockroaches_records_count: serverData.tables?.cockroaches_summary?.length || 0,
        rodents_records_count: serverData.tables?.rodents_summary?.length || 0,
        line_walk_records_count: serverData.tables?.line_walk_summary?.length || 0,
        local_cache_items_count: Object.keys(localData).length
      }
    };

    return fullPayload;
  };

  // Handler: Save to local drive or browser download
  const handleSaveToDrive = async (usePicker = true) => {
    setLoading(true);
    setStatusMessage({ text: 'กำลังรวบรวมข้อมูลทุกระบบเพื่อสำรองไฟล์...', type: 'info' });

    try {
      const backupData = await gatherFullBackupData();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const datePart = new Date().toISOString().slice(0, 10);
      const timePart = new Date().toTimeString().slice(0, 5).replace(':', '');
      const defaultFileName = `PS_Food_PestBackup_${datePart}_${timePart}.json`;

      let savedDirectly = false;

      // Try modern File System Access API (showSaveFilePicker) so user can choose Drive D:, Google Drive, USB, etc.
      if (usePicker && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: defaultFileName,
            types: [{
              description: 'JSON Backup File (*.json)',
              accept: { 'application/json': ['.json'] }
            }]
          });
          const writableStream = await fileHandle.createWritable();
          await writableStream.write(jsonStr);
          await writableStream.close();
          savedDirectly = true;
          setStatusMessage({ text: 'บันทึกไฟล์สำรองข้อมูลลงไดร์ฟที่คุณเลือกเรียบร้อยแล้ว!', type: 'success' });
        } catch (pickerErr) {
          if (pickerErr.name === 'AbortError') {
            setLoading(false);
            setStatusMessage({ text: 'ยกเลิกการเลือกโฟลเดอร์', type: 'info' });
            return;
          }
          console.warn('showSaveFilePicker not usable, falling back to download:', pickerErr);
        }
      }

      // Standard fallback download via blob link
      if (!savedDirectly) {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setStatusMessage({ text: `ดาวน์โหลดไฟล์สำรองข้อมูล (${defaultFileName}) ลงเครื่องเรียบร้อยแล้ว!`, type: 'success' });
      }

      setBackupStats(backupData.summary);

    } catch (err) {
      console.error('Backup failed:', err);
      setStatusMessage({ text: 'เกิดข้อผิดพลาดในการสำรองข้อมูล: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handler: Restore from JSON backup file
  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage({ text: 'กำลังตรวจสอบและกู้คืนข้อมูล...', type: 'info' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        if (!parsed.backup_timestamp && !parsed.version) {
          throw new Error('รูปแบบไฟล์ไม่ถูกต้อง หรือไม่ใช่ไฟล์สำรองของระบบ');
        }

        let restoredCount = 0;

        // 1. Restore local_storage items
        if (parsed.local_storage && typeof window !== 'undefined') {
          Object.entries(parsed.local_storage).forEach(([key, val]) => {
            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            localStorage.setItem(key, strVal);
            restoredCount++;
          });
        }

        // 2. Report success
        setRestoreProgress({
          timestamp: parsed.backup_timestamp,
          restoredItems: restoredCount,
          summary: parsed.summary || {}
        });

        setStatusMessage({
          text: `กู้คืนข้อมูลสำเร็จเรียบร้อย (${restoredCount} รายการ)! กำลังรีเฟรชหน้าจอ...`,
          type: 'success'
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        console.error('Restore error:', err);
        setStatusMessage({ text: 'กู้คืนข้อมูลล้มเหลว: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                ศูนย์สำรองและกู้คืนข้อมูล (Backup & Restore)
              </h3>
              <p className="text-[11px] text-slate-400 font-bold">
                บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด · ป้องกันข้อมูลสูญหาย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage.text && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 text-blue-600 animate-spin" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Details: What gets backed up */}
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
            ระบบจะทำการรวบรวมข้อมูลทุกส่วน ทั้งบนคลาวด์ <b>Supabase</b> และแคชใน <b>เบราว์เซอร์ (Local Cache)</b> รวมเป็นไฟล์ <code>.json</code> ชุดเดียว เพื่อให้สามารถนำไปเก็บไว้ใน <b>ฮาร์ดดิสก์, Drive D:, Flash Drive หรือ Google Drive</b> ได้อย่างปลอดภัย 100%:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span>🪰 ตรวจนับแมลง 33 จุด</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span>🦎 ตรวจนับจิ้งจก 6 สถานี</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span>🪳 บ้านแมลงสาบ 23 จุด</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span>🐀 กับดักหนู 10 สถานี</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span>🚶 เดินไลน์ 22 จุดตรวจ</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span>👥 สิทธิ์และผู้ใช้ระบบ</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          
          {/* Primary Button: Save to Selected Drive / Folder */}
          <button
            onClick={() => handleSaveToDrive(true)}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <HardDrive className="w-4 h-4" />
            <span>💾 เลือกไดร์ฟ / โฟลเดอร์เพื่อบันทึกสำรองข้อมูล</span>
          </button>

          {/* Secondary Quick Download Button */}
          <button
            onClick={() => handleSaveToDrive(false)}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <FolderDown className="w-4 h-4 text-slate-500" />
            <span>📥 ดาวน์โหลดด่วนลงเครื่อง (.json)</span>
          </button>

          {/* Restore Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold cursor-pointer flex items-center justify-center gap-2 transition-all">
              <Upload className="w-4 h-4 text-indigo-600" />
              <span>🔄 กู้คืนข้อมูลจากไฟล์สำรอง (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-center text-slate-400 font-medium">
          🔒 แนะนำให้สำรองข้อมูลสัปดาห์ละ 1 ครั้ง หรือทุกสิ้นเดือนเพื่อความปลอดภัยสูงสุด
        </p>

      </div>
    </div>
  );
}
