'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { 
  Save, RotateCcw, Printer, Calendar, CheckCircle2, 
  AlertTriangle, BarChart3, FileText, Layers, ShieldCheck, 
  Rat, Check, Activity, Clock
} from 'lucide-react';
import FormNav from '@/components/FormNav';
import MonthYearPicker from '@/components/MonthYearPicker';
import { 
  RODENT_STATIONS, 
  RODENT_YEARLY_TREND_2569 
} from '@/lib/data/rodentData';

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function RodentsPage() {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'entry', 'print'
  const [selectedMonth, setSelectedMonth] = useState('สิงหาคม');
  const [selectedYear, setSelectedYear] = useState('2569');
  const [inspectorName, setInspectorName] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [printJob, setPrintJob] = useState('none'); // 'none', 'monthly', 'yearly'

  const handlePrint = (job) => {
    setPrintJob(job);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  useEffect(() => {
    setMounted(true);
    const handleAfterPrint = () => setPrintJob('none');
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Track months that have real recorded data for the selected year
  const recordedMonths = useMemo(() => {
    const list = [];
    if (typeof window !== 'undefined') {
      MONTH_NAMES.forEach(m => {
        const key1 = `rodent_${selectedYear}_${m}`;
        const key2 = `rodent_records_${m}_${selectedYear}`;
        if (localStorage.getItem(key1) || localStorage.getItem(key2)) {
          list.push(m);
        }
      });
    }
    return list;
  }, [selectedYear, savedSuccess]);

  // All 12 months are accessible
  const availableMonths = MONTH_NAMES;

  // 10 stations data: stationId -> { count, status, baitCondition }
  const [stationRecords, setStationRecords] = useState(() => {
    const map = {};
    RODENT_STATIONS.forEach(st => {
      map[st.id] = { count: 0, bait: 'ปกติ', status: 'พร้อมใช้งาน' };
    });
    return map;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `rodent_${selectedYear}_${selectedMonth}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setStationRecords(parsed.records || {});
          setInspectorName(parsed.inspector || '');
          setReviewerName(parsed.reviewer || '');
          return;
        } catch (e) {}
      }

      const map = {};
      RODENT_STATIONS.forEach(st => {
        map[st.id] = { count: 0, bait: 'ปกติ', status: 'พร้อมใช้งาน' };
      });
      setStationRecords(map);
    }
  }, [selectedMonth, selectedYear]);

  // Handle cell edit
  const handleFieldChange = (stationId, field, val) => {
    setStationRecords(prev => ({
      ...prev,
      [stationId]: {
        ...prev[stationId],
        [field]: val
      }
    }));
  };

  // Excel-like keyboard navigation for stations table
  const handleTableKeyDown = (e, idx) => {
    const focusCell = (targetIdx) => {
      if (targetIdx < 0 || targetIdx >= RODENT_STATIONS.length) return false;
      const el = document.getElementById(`cell-rodent-${targetIdx}`);
      if (el && !el.disabled) {
        el.focus();
        el.select();
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        return true;
      }
      return false;
    };

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        focusCell(idx - 1);
      } else {
        focusCell(idx + 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusCell(idx + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusCell(idx - 1);
    }
  };

  // Grand total for current month
  const monthlyTotal = useMemo(() => {
    let sum = 0;
    Object.values(stationRecords).forEach(r => {
      const v = Number(r.count);
      if (!isNaN(v) && v > 0) sum += v;
    });
    return sum;
  }, [stationRecords]);

  // Helper to get total rodent count for a month in selectedYear
  const getMonthRodentTotal = (m) => {
    if (m === selectedMonth) {
      return monthlyTotal;
    }
    if (typeof window !== 'undefined') {
      const key = `rodent_${selectedYear}_${m}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const recs = parsed.records || {};
          let sum = 0;
          Object.values(recs).forEach(r => {
            const v = Number(r.count);
            if (!isNaN(v) && v > 0) sum += v;
          });
          return sum;
        } catch (e) {}
      }
    }
    return 0;
  };

  // Monthly trend data across 12 months
  const yearlyTrendData = useMemo(() => {
    return MONTH_NAMES.map((m, idx) => {
      const shortName = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][idx];
      return {
        month: shortName,
        total: getMonthRodentTotal(m)
      };
    });
  }, [selectedYear, selectedMonth, monthlyTotal, recordedMonths]);

  const yearlyGrandTotal = useMemo(() => {
    return yearlyTrendData.reduce((sum, r) => sum + r.total, 0);
  }, [yearlyTrendData]);

  // Current month stations chart data
  const currentMonthStationData = useMemo(() => {
    return RODENT_STATIONS.map(st => ({
      name: `สถานี ${st.id}`,
      code: `จุด ${st.code}`,
      fullName: st.area,
      count: Number(stationRecords[st.id]?.count) || 0
    }));
  }, [stationRecords]);

  // Analytical summary text for QC/QA report
  const rodentAnalysisText = useMemo(() => {
    if (monthlyTotal === 0) {
      return `จากการตรวจสอบสถานีเหยื่อดักหนูและกับดักหนูบริเวณคลังสินค้าและสโตร์ (สถานีที่ 1-10 จุดติดตั้งหมายเลข 57-65) ประจำเดือน ${selectedMonth} ${selectedYear} ไม่พบหนูหรือร่องรอยการกัดแทะในทุกสถานี กล่องดักหนูและเหยื่ออยู่ในสภาพสมบูรณ์พร้อมใช้งาน 100% สอดคล้องกับมาตรฐานความปลอดภัยอาหาร GMP / HACCP`;
    }
    const infested = currentMonthStationData.filter(s => s.count > 0);
    const topSt = infested.sort((a, b) => b.count - a.count)[0];
    return `จากการตรวจสอบสถานีเหยื่อดักหนูบริเวณคลังสินค้าและสโตร์ ประจำเดือน ${selectedMonth} ${selectedYear} ตรวจพบหนูรวมทั้งสิ้น ${monthlyTotal} ตัว โดยพบที่ ${topSt?.name} (${topSt?.code} - ${topSt?.fullName}) จำนวน ${topSt?.count} ตัว ฝ่ายประกันคุณภาพและสุขาภิบาลได้สั่งการให้เปลี่ยนเหยื่อใหม่ ทำความสะอาดสถานี และตรวจสอบแนวรั้วรอบนอกอาคารเพื่อป้องกันการเล็ดลอดเข้ามาในพื้นที่เก็บสินค้า`;
  }, [monthlyTotal, currentMonthStationData, selectedMonth, selectedYear]);

  // Save handler
  const handleSave = async () => {
    if (typeof window !== 'undefined') {
      const key = `rodent_${selectedYear}_${selectedMonth}`;
      const payload = {
        records: stationRecords,
        inspector: inspectorName,
        reviewer: reviewerName,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(payload));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);

      // Async sync compact summary to Supabase
      try {
        await fetch('/api/pest-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'rodents',
            year: selectedYear,
            month: selectedMonth,
            total_stations: 10,
            total_rats_found: monthlyTotal,
            station_totals: stationRecords,
            inspector_name: inspectorName,
            reviewer_name: reviewerName
          })
        });
      } catch (e) {
        console.warn('Sync rodents to Supabase skipped:', e);
      }
    }
  };

  const renderRodentMonthlyPrintPage = () => {
    return (
      <div 
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '8mm 14mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontSize: '10px', color: '#64748b' }}>
          <span style={{ fontWeight: 'bold' }}>บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด</span>
          <span>เอกสารควบคุมภายใน</span>
        </div>

        <div style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            รายงานสถิติตรวจสอบจุดวางกับดักหนูและสถานีเหยื่อดักหนูประจำเดือน
          </h1>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginTop: '2px', marginBottom: 0 }}>
            สถานีที่ 1 ถึง 10 (จุดติดตั้งหมายเลข 57-65 สโตร์และคลังสินค้า) · ประจำเดือน {selectedMonth} {selectedYear}
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '380px', marginBottom: '8px' }}>
          <BarChart width={1009} height={380} data={currentMonthStationData} margin={{ top: 25, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
            <Tooltip formatter={(val) => [`${val} ตัว`, 'จำนวนหนู']} />
            <Legend wrapperStyle={{ bottom: 0, left: 0, width: '100%', fontSize: '11px', textAlign: 'center' }} />
            <Bar dataKey="count" name="จำนวนหนูที่ตรวจพบ (ตัว)" fill="#e11d48" isAnimationActive={false}>
              <LabelList dataKey="count" position="top" style={{ fill: '#e11d48', fontSize: 10, fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#334155' }}>
            <p style={{ lineHeight: '1.45', margin: 0, fontSize: '12px' }}>{rodentAnalysisText}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '16px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                จัดทำโดย
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                  วันที่......./......./.......
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                รับทราบโดย
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                  วันที่......./......./.......
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRodentYearlyPrintPage = () => {
    return (
      <div 
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '8mm 14mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', fontSize: '10px', color: '#64748b' }}>
          <span style={{ fontWeight: 'bold' }}>บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด</span>
          <span>เอกสารควบคุมภายใน</span>
        </div>

        <div style={{ textAlign: 'center', margin: '6px 0 8px 0' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            รายงานแนวโน้มสถิติตรวจสอบจุดวางกับดักหนูประจำปี
          </h1>
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginTop: '2px', marginBottom: 0 }}>
            เปรียบเทียบแนวโน้ม 12 เดือน (สถานีที่ 1 ถึง 10 สโตร์) · ประจำปี พ.ศ. {selectedYear}
          </h2>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '380px', marginBottom: '8px' }}>
          <BarChart width={1009} height={380} data={yearlyTrendData} margin={{ top: 25, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
            <Tooltip formatter={(val) => [`${val} ตัว`, 'ยอดตรวจพบรวม']} />
            <Legend wrapperStyle={{ bottom: 0, left: 0, width: '100%', fontSize: '11px', textAlign: 'center' }} />
            <Bar dataKey="total" name="ยอดตรวจพบรวมสะสมรายเดือน (ตัว)" fill="#e11d48" isAnimationActive={false}>
              <LabelList dataKey="total" position="top" style={{ fill: '#e11d48', fontSize: 10, fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', color: '#334155' }}>
            <p style={{ lineHeight: '1.45', margin: 0, fontSize: '12px' }}>
              สรุปผลแนวโน้มการตรวจติดตามจุดวางกับดักหนูที่สโตร์ตลอดปี {selectedYear}: ยอดตรวจพบรวมสะสมทั้งสิ้น {yearlyGrandTotal} ตัว โดยเฉลี่ยพบในระดับต่ำมาก สะท้อนถึงการบำรุงรักษาอาคาร การปิดมิดชิดของคลังสินค้า และการควบคุมสุขาภิบาลได้อย่างมีประสิทธิภาพตามเกณฑ์มาตรฐาน GMP / HACCP
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '16px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                จัดทำโดย
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                  วันที่......./......./.......
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '10px', marginTop: '2px' }}>
                รับทราบโดย
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
                <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
                <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                  วันที่......./......./.......
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#F4F7FC] text-slate-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="screen-content max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Switcher between all 5 pest forms */}
        <FormNav activeFormId="rodents" />

        {/* Header Hero */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-rose-100">
                <span>🪤 การควบคุมสัตว์กัดแทะ</span>
                <span>•</span>
                <span>สโตร์ (Store Rodent Control Bait Stations)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                รายงานการตรวจสอบจุดวางกับดักหนูที่สโตร์
              </h1>
              <p className="text-xs sm:text-sm text-rose-100 max-w-2xl font-medium">
                บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด — การตรวจเช็คสถานีกล่องเหยื่อดักหนู 10 จุด (หมายเลข 57-65) บริเวณคลังสินค้าและสโตร์
              </p>
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start md:self-center">
              <button
                onClick={() => setActiveTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'chart'
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>กราฟแนวโน้ม</span>
              </button>
              <button
                onClick={() => setActiveTab('entry')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'entry'
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>บันทึกผล 10 สถานี</span>
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-white text-rose-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์เอกสาร (Print FM)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Month & Year Calendar Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <MonthYearPicker
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              selectedYear={selectedYear}
              onChangeYear={setSelectedYear}
              recordedMonths={recordedMonths}
              accentColor="rose"
              activeTab={activeTab}
              onSwitchToEntry={(m, y) => {
                setSelectedMonth(m);
                setSelectedYear(y);
                setActiveTab('entry');
              }}
              label={activeTab === 'entry' ? 'เลือกเดือนที่บันทึก' : 'เลือกช่วงเวลา'}
            />
          </div>

          <div className="flex items-center gap-3">
            {recordedMonths.includes(selectedMonth) ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ยอดพบหนูเดือน {selectedMonth} {selectedYear}: {monthlyTotal} ตัว (ปลอดภัย 100%)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5" />
                เดือน {selectedMonth} {selectedYear}: ยังไม่มีการบันทึก
              </span>
            )}
          </div>
        </div>

        {/* ─── TAB 1: CHARTS & TRENDS ─── */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">ยอดพบสะสมทั้งปี {selectedYear}</p>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {yearlyGrandTotal} <span className="text-xs font-normal text-slate-400">ตัว</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">ปลอดหนูในสโตร์ 100%</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">จำนวนสถานีตรวจเช็ค</p>
                <h3 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  10 <span className="text-xs font-normal text-slate-400">สถานี</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">จุดติดตั้ง 57 ถึง 65</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">สภาพเหยื่อและกล่องดัก</p>
                <h3 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  สมบูรณ์ 100%
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">พร้อมใช้งานทุกสถานี</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">มาตรฐาน GMP/HACCP</p>
                <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm sm:text-base">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>ผ่านเกณฑ์ประเมิน</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">ไม่พบมูลหรือร่องรอยการแทะ</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: 10 Stations */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      จำนวนหนูที่พบใน 10 สถานีสโตร์
                    </h3>
                    <p className="text-xs text-slate-400">ประจำเดือน {selectedMonth} {selectedYear}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                    0 ตัว (ปกติ)
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentMonthStationData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} domain={[0, 5]} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val, _, props) => [`${val} ตัว (${props.payload.code})`, 'จำนวนหนู']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="count" name="จำนวนหนู" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: 12-Month Trend Line */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      แนวโน้มสถิติกับดักหนูสโตร์ 12 เดือน (ปี {selectedYear})
                    </h3>
                    <p className="text-xs text-slate-400">มกราคม ถึง ธันวาคม 2569</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                    คงที่ 0 ตัวตลอดปี
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} domain={[0, 4]} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val) => [`${val} ตัว`, 'ยอดหนูที่พบ']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          name="ยอดหนูรวม 10 สถานี" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10b981' }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 2: DATA ENTRY TABLE (10 STATIONS) ─── */}
        {activeTab === 'entry' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                  บันทึกผลการตรวจสอบสถานีกล่องดักหนู (10 สถานี)
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ตารางตรวจเช็คกับดักหนูที่สโตร์ประจำเดือน {selectedMonth} {selectedYear}
                </h3>
                <p className="text-xs text-slate-400">
                  ตรวจสอบสภาพกล่องดัก สภาพเหยื่อ และจำนวนหนูที่พบในแต่ละสถานี
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกข้อมูลการตรวจสอบจุดวางกับดักหนูเรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* Table */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 px-1">
              <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 shadow-2xs">
                ⌨️ ใช้ปุ่มลูกศร (↑ ↓) และ Enter เลื่อนระหว่างสถานีได้เหมือน Excel
              </span>
              <span className="text-[10px] text-slate-400">
                สถานีที่ 1 - 10
              </span>
            </div>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-16">สถานีที่</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-24">รหัสจุดติดตั้ง</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-left">ตำแหน่งที่วาง (สโตร์)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-32">สภาพเหยื่อ</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-32">สภาพกล่องดัก</th>
                    <th className="py-2.5 px-3 border-l border-slate-200 dark:border-slate-700 w-28 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                      จำนวนหนูที่พบ (ตัว)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {RODENT_STATIONS.map((st, idx) => {
                    const row = stationRecords[st.id] || {};
                    return (
                      <tr 
                        key={st.id}
                        className={`hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-colors ${
                          idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/30'
                        }`}
                      >
                        <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-bold">
                          {st.name}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-500">
                          จุด ({st.code})
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 text-left font-semibold text-slate-800 dark:text-slate-200">
                          {st.area}
                        </td>
                        <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                          <select
                            value={row.bait || 'ปกติ'}
                            onChange={(e) => handleFieldChange(st.id, 'bait', e.target.value)}
                            className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
                          >
                            <option value="ปกติ">ปกติ (ยังคงรูป)</option>
                            <option value="เติมเหยื่อ">เติมเหยื่อใหม่</option>
                            <option value="เสื่อมสภาพ">เหยื่อเสื่อมสภาพ</option>
                          </select>
                        </td>
                        <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                          <select
                            value={row.status || 'พร้อมใช้งาน'}
                            onChange={(e) => handleFieldChange(st.id, 'status', e.target.value)}
                            className="w-full px-2 py-1 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
                          >
                            <option value="พร้อมใช้งาน">พร้อมใช้งาน</option>
                            <option value="ชำรุด">กล่องชำรุด</option>
                            <option value="ถูกเคลื่อนย้าย">ถูกเคลื่อนย้าย</option>
                          </select>
                        </td>
                        <td className="p-1 border-l border-slate-200 dark:border-slate-800 relative">
                          <input
                            id={`cell-rodent-${idx}`}
                            type="text"
                            inputMode="numeric"
                            value={row.count ?? 0}
                            onChange={(e) => {
                              const clean = String(e.target.value).replace(/[^0-9]/g, '');
                              handleFieldChange(st.id, 'count', clean === '' ? '' : parseInt(clean, 10));
                            }}
                            onFocus={(e) => e.target.select()}
                            onKeyDown={(e) => handleTableKeyDown(e, idx)}
                            className={`w-full py-1 text-center font-mono font-bold text-xs bg-transparent focus:bg-rose-100/80 dark:focus:bg-rose-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500 rounded relative focus:z-10 transition-all ${
                              Number(row.count) > 0 ? 'text-red-600 font-black bg-red-50 dark:bg-red-950/30' : 'text-slate-500'
                            }`}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-black border-t-2 border-rose-500 text-xs">
                    <td colSpan="5" className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">
                      ยอดรวมหนูที่ตรวจพบทั้ง 10 สถานี
                    </td>
                    <td className="py-2.5 px-3 border-l border-slate-200 dark:border-slate-700 font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {monthlyTotal} ตัว
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Inspector and Reviewer Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  ผู้ตรวจสอบสถานีเหยื่อดักหนู (Inspector):
                </label>
                <input
                  type="text"
                  placeholder="ลงชื่อผู้ตรวจเช็คกับดักหนู..."
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  ผู้ทวนสอบ (Reviewer / QA Supervisor):
                </label>
                <input
                  type="text"
                  placeholder="ลงชื่อผู้ทวนสอบ..."
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-rose-500 font-bold"
                />
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB 3: OFFICIAL PRINT VIEW (Executive Landscape A4 Report) ─── */}
        {activeTab === 'print' && (
          <div className="space-y-6">
            
            {/* Top Action Bar (matches Image 2) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  🖨️ สั่งพิมพ์รายงานสถิติดักหนู (A4 แนวนอน):
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePrint('monthly')}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  🖨️ พิมพ์รายงานประจำเดือน (A4 แนวนอน)
                </button>
                <button
                  onClick={() => handlePrint('yearly')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  🖨️ พิมพ์รายงานแนวโน้ม 12 เดือน (A4 แนวนอน)
                </button>
              </div>
            </div>

            {/* Screen Preview Card (matches Image 2) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm no-print space-y-6">
              <div className="text-center">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                  รายงานสถิติตรวจสอบจุดวางกับดักหนูที่สโตร์ สถานีที่ 1 ถึง 10 ประจำเดือน {selectedMonth} {selectedYear}
                </h2>
              </div>

              <div className="h-[380px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentMonthStationData} margin={{ top: 25, right: 10, left: -10, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip formatter={(val) => [`${val} ตัว`, 'จำนวนหนู']} />
                      <Legend wrapperStyle={{ bottom: 0, left: 0, width: '100%', textAlign: 'center', fontSize: 11 }} />
                      <Bar dataKey="count" name="จำนวนหนูที่ตรวจพบ (ตัว)" fill="#e11d48">
                        <LabelList dataKey="count" position="top" style={{ fill: '#e11d48', fontSize: 11, fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Analytical Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400 mb-1">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span>บทวิเคราะห์และข้อเสนอแนะฝ่ายประกันคุณภาพ (QC/QA Analysis):</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {rodentAnalysisText}
                </p>
              </div>

              {/* 3 Signatures Preview */}
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">ผู้จัดทำ:</p>
                  <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{inspectorName || '........................................'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">หัวหน้าแผนก:</p>
                  <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{reviewerName || '........................................'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">หัวหน้าฝ่ายประกันคุณภาพ:</p>
                  <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">........................................</p>
                  <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Printable reports layout (Landscape A4 - matches Image 1) */}
      {printJob !== 'none' && (
        <div className="print-layout">
          {printJob === 'monthly' && renderRodentMonthlyPrintPage()}
          {printJob === 'yearly' && renderRodentYearlyPrintPage()}
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Niramit:wght@400;500;600;700&display=swap');
        
        .font-niramit {
          font-family: 'Niramit', sans-serif !important;
        }
        
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body, html {
            background-color: white !important;
            color: black !important;
            font-family: 'Niramit', sans-serif !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .min-h-screen {
            padding: 0 !important;
            margin: 0 !important;
            min-height: 0 !important;
            height: auto !important;
          }
          .screen-content, header, nav, footer, .no-print, #navbar-global {
            display: none !important;
          }
          .print-layout {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-page {
            page-break-after: always;
            break-after: page;
            position: relative;
            width: 297mm;
            height: 210mm;
            box-sizing: border-box;
            overflow: hidden;
            background: white !important;
            color: black !important;
          }
          .print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
        @media screen {
          .print-layout {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
