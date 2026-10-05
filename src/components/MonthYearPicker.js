'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

/**
 * Generates an array of Buddhist Era years from 10 years in the past to 5 years in the future.
 * e.g., 2558 - 2575 (CE 2015 - 2032)
 */
export function getAvailableYearsRange(currentBEYear = new Date().getFullYear() + 543) {
  const start = currentBEYear - 10;
  const end = currentBEYear + 5;
  const years = [];
  for (let y = end; y >= start; y--) {
    years.push(String(y));
  }
  return years;
}

/**
 * MonthYearPicker: An interactive calendar-style picker for Year & Month
 * Allows selecting any year (past 10+ years or future) and any of the 12 months.
 */
export default function MonthYearPicker({
  selectedMonth,
  onChangeMonth,
  selectedYear,
  onChangeYear,
  recordedMonths = [],
  accentColor = 'emerald', // 'emerald', 'amber', 'purple', 'rose', 'blue'
  activeTab = 'chart',
  onSwitchToEntry,
  label = 'เลือกช่วงเวลา'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const currentCalendar = useMemo(() => {
    const now = new Date();
    const ce = now.getFullYear();
    const be = ce + 543;
    const mIdx = now.getMonth();
    return {
      ceYear: ce,
      beYear: be,
      monthName: THAI_MONTH_NAMES[mIdx] || 'มกราคม',
      monthIndex: mIdx
    };
  }, []);

  const availableYears = useMemo(() => {
    const list = getAvailableYearsRange(currentCalendar.beYear);
    // ensure selectedYear is in list
    if (selectedYear && !list.includes(String(selectedYear))) {
      list.push(String(selectedYear));
      list.sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    }
    return list;
  }, [currentCalendar.beYear, selectedYear]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Accent theme styling mappings
  const theme = useMemo(() => {
    const themes = {
      emerald: {
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-600 text-white',
        border: 'border-emerald-500',
        lightBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
        badge: 'bg-emerald-500 text-white',
        ring: 'focus:ring-emerald-500',
        activeBtn: 'bg-emerald-600 text-white shadow-emerald-500/25',
        dot: 'bg-emerald-500'
      },
      amber: {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-600 text-white',
        border: 'border-amber-500',
        lightBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
        badge: 'bg-amber-500 text-white',
        ring: 'focus:ring-amber-500',
        activeBtn: 'bg-amber-600 text-white shadow-amber-500/25',
        dot: 'bg-amber-500'
      },
      purple: {
        text: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-600 text-white',
        border: 'border-purple-500',
        lightBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
        badge: 'bg-purple-500 text-white',
        ring: 'focus:ring-purple-500',
        activeBtn: 'bg-purple-600 text-white shadow-purple-500/25',
        dot: 'bg-purple-500'
      },
      rose: {
        text: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-600 text-white',
        border: 'border-rose-500',
        lightBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
        badge: 'bg-rose-500 text-white',
        ring: 'focus:ring-rose-500',
        activeBtn: 'bg-rose-600 text-white shadow-rose-500/25',
        dot: 'bg-rose-500'
      },
      blue: {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-600 text-white',
        border: 'border-blue-500',
        lightBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-500 text-white',
        ring: 'focus:ring-blue-500',
        activeBtn: 'bg-blue-600 text-white shadow-blue-500/25',
        dot: 'bg-blue-500'
      }
    };
    return themes[accentColor] || themes.emerald;
  }, [accentColor]);

  const selYearNum = parseInt(selectedYear, 10) || currentCalendar.beYear;
  const selYearCE = selYearNum - 543;

  const handlePrevYear = () => {
    onChangeYear(String(selYearNum - 1));
  };

  const handleNextYear = () => {
    onChangeYear(String(selYearNum + 1));
  };

  const handleSelectMonth = (month) => {
    onChangeMonth(month);
    setIsOpen(false);
  };

  const hasRecordedCurrent = recordedMonths.includes(selectedMonth);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border transition-all text-xs font-bold cursor-pointer shadow-xs ${
          isOpen
            ? `${theme.border} ring-2 ring-opacity-20 ${theme.ring}`
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
        title="คลิกเพื่อเปิดปฏิทินเลือกเดือนและปี"
      >
        <Calendar className={`w-4 h-4 ${theme.text}`} />
        <div className="flex items-center gap-1.5 text-left">
          <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] hidden sm:inline">
            {label}:
          </span>
          <span className="font-extrabold text-slate-800 dark:text-slate-100">
            {selectedMonth} {selectedYear}
          </span>
          <span className="text-[10px] text-slate-400 font-normal">
            ({selYearCE})
          </span>
        </div>

        {hasRecordedCurrent && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800" title="เดือนนี้มีข้อมูลบันทึกจริงในระบบแล้ว">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden md:inline">มีบันทึก</span>
          </span>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Calendar Dropdown Card */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-80 sm:w-88 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
          
          {/* Header: Year Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="ปีก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(e.target.value)}
                className="px-2.5 py-1 text-xs font-black bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => {
                  const yCE = parseInt(y, 10) - 543;
                  return (
                    <option key={y} value={y}>
                      ปี พ.ศ. {y} (ค.ศ. {yCE})
                    </option>
                  );
                })}
              </select>

              {selectedYear !== String(currentCalendar.beYear) && (
                <button
                  type="button"
                  onClick={() => onChangeYear(String(currentCalendar.beYear))}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="กลับมายังปีปัจจุบัน"
                >
                  ปีปัจจุบัน
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextYear}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="ปีถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 12-Month Calendar Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400">
                เลือกเดือน (ประจำปี {selectedYear}):
              </span>
              <span className="text-[10px] text-slate-400">
                {recordedMonths.length > 0 ? `บันทึกแล้ว ${recordedMonths.length}/12 เดือน` : 'ยังไม่มีบันทึกในปีนี้'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {THAI_MONTH_NAMES.map((m, idx) => {
                const isSelected = m === selectedMonth;
                const isRecorded = recordedMonths.includes(m);
                const isCurrentMonth = m === currentCalendar.monthName && selectedYear === String(currentCalendar.beYear);

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMonth(m)}
                    className={`relative py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer border ${
                      isSelected
                        ? `${theme.activeBtn} border-transparent shadow-sm scale-102`
                        : isRecorded
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-200 border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100/70'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-black">{m}</span>
                    <span className={`text-[9px] font-normal ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      {THAI_MONTH_SHORT[idx]}
                    </span>

                    {/* Recorded Indicator */}
                    {isRecorded && !isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" title="มีบันทึกข้อมูลแล้ว"></span>
                    )}

                    {/* Current Month Tag */}
                    {isCurrentMonth && (
                      <span className={`text-[8px] px-1 rounded-sm mt-0.5 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold'}`}>
                        ปัจจุบัน
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Info & Quick Entry Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>จุดเขียว = มีข้อมูลบันทึกจริง</span>
            </div>

            {onSwitchToEntry && activeTab !== 'entry' && (
              <button
                type="button"
                onClick={() => {
                  onSwitchToEntry(selectedMonth, selectedYear);
                  setIsOpen(false);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-xl ${theme.lightBg} hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer`}
              >
                <span>➕ บันทึกเดือนนี้</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
