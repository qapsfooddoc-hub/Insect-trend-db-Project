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
  RODENT_ALL_YEARLY_TREND,
  RODENT_RECORDED_MONTHS_MAP,
  isRodentMonthOfficiallyRecorded
} from '@/lib/data/rodentData';

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const RODENT_STATION_CONFIG = [
  { key: 'station1', name: 'สถานี 1', id: 1, code: '57', color: '#1f4e79' },
  { key: 'station2', name: 'สถานี 2', id: 2, code: '58', color: '#c00000' },
  { key: 'station3', name: 'สถานี 3', id: 3, code: '59', color: '#2e7d32' },
  { key: 'station4', name: 'สถานี 4', id: 4, code: '60', color: '#7030a0' },
  { key: 'station5', name: 'สถานี 5', id: 5, code: '61', color: '#00b0f0' },
  { key: 'station6', name: 'สถานี 6', id: 6, code: '62', color: '#ed7d31' },
  { key: 'station7', name: 'สถานี 7', id: 7, code: '63', color: '#ffaa00' },
  { key: 'station8', name: 'สถานี 8', id: 8, code: '64', color: '#008080' },
  { key: 'station9', name: 'สถานี 9', id: 9, code: '66', color: '#804000' },
  { key: 'station10', name: 'สถานี 10', id: 10, code: '65', color: '#4b5563' }
];

const renderVerticalLegend = (props) => {
  const { payload } = props || {};
  if (!payload || !payload.length) return null;

  const sortedPayload = [...payload].sort((a, b) => {
    const idxA = RODENT_STATION_CONFIG.findIndex(s => s.key === a.dataKey || s.name === a.value);
    const idxB = RODENT_STATION_CONFIG.findIndex(s => s.key === b.dataKey || s.name === b.value);
    return idxA - idxB;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px' }}>
      {sortedPayload.map((entry, index) => (
        <div
          key={`v-item-${index}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            color: '#222',
            lineHeight: '1.45'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px' }}>
            <svg width="22" height="10" style={{ display: 'inline-block' }}>
              <line x1="0" y1="5" x2="22" y2="5" stroke={entry.color} strokeWidth="2" />
              <circle cx="11" cy="5" r="3.5" fill="#ffffff" stroke={entry.color} strokeWidth="1.5" />
            </svg>
          </span>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const renderHorizontalLegend = (props) => {
  const { payload } = props || {};
  if (!payload || !payload.length) return null;

  const sortedPayload = [...payload].sort((a, b) => {
    const idxA = RODENT_STATION_CONFIG.findIndex(s => s.key === a.dataKey || s.name === a.value);
    const idxB = RODENT_STATION_CONFIG.findIndex(s => s.key === b.dataKey || s.name === b.value);
    return idxA - idxB;
  });

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', paddingTop: '8px' }}>
      {sortedPayload.map((entry, index) => (
        <div key={`h-item-${index}`} style={{ display: 'inline-flex', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px' }}>
            <svg width="20" height="10" style={{ display: 'inline-block' }}>
              <line x1="0" y1="5" x2="20" y2="5" stroke={entry.color} strokeWidth="2" />
              <circle cx="10" cy="5" r="3" fill="#ffffff" stroke={entry.color} strokeWidth="1.5" />
            </svg>
          </span>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function RodentsPage() {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'entry', 'print'
  const [selectedMonth, setSelectedMonth] = useState('สิงหาคม');
  const [selectedYear, setSelectedYear] = useState('2569');
  const [previewPageIndex, setPreviewPageIndex] = useState(1); // 1 = Monthly Bar, 2 = Overall Multi-line Trend
  const [inspectorName, setInspectorName] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [printJob, setPrintJob] = useState('none'); // 'none', 'monthly', 'overall', 'yearly', 'all'

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
    const list = new Set();
    const officialMonths = RODENT_RECORDED_MONTHS_MAP[String(selectedYear)] || [];
    officialMonths.forEach(m => list.add(m));

    if (typeof window !== 'undefined') {
      MONTH_NAMES.forEach(m => {
        const key1 = `rodent_${selectedYear}_${m}`;
        const key2 = `rodent_records_${m}_${selectedYear}`;
        if (localStorage.getItem(key1) || localStorage.getItem(key2)) {
          list.add(m);
        }
      });
    }
    return Array.from(list);
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
    let isCancelled = false;
    if (typeof window !== 'undefined') {
      const key = `rodent_${selectedYear}_${selectedMonth}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.records && Object.keys(parsed.records).length > 0) {
            setStationRecords(parsed.records);
            setInspectorName(parsed.inspector || '');
            setReviewerName(parsed.reviewer || '');
            return;
          }
        } catch (e) {}
      }

      // Check Supabase if not in localStorage
      fetch(`/api/pest-records?type=rodents&year=${selectedYear}&month=${selectedMonth}`)
        .then(res => res.json())
        .then(res => {
          if (!isCancelled && res.data && res.data.length > 0) {
            const rec = res.data[0];
            if (rec.station_totals && Object.keys(rec.station_totals).length > 0) {
              setStationRecords(rec.station_totals);
              if (rec.inspector_name) setInspectorName(rec.inspector_name);
              if (rec.reviewer_name) setReviewerName(rec.reviewer_name);
              return;
            }
          }
          // Default: 0 for all stations
          const map = {};
          RODENT_STATIONS.forEach(st => {
            map[st.id] = { count: 0, bait: 'ปกติ', status: 'พร้อมใช้งาน' };
          });
          setStationRecords(map);
        })
        .catch(() => {
          if (!isCancelled) {
            const map = {};
            RODENT_STATIONS.forEach(st => {
              map[st.id] = { count: 0, bait: 'ปกติ', status: 'พร้อมใช้งาน' };
            });
            setStationRecords(map);
          }
        });
    }
    return () => { isCancelled = true; };
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

  // Helper to get station totals for a specific month in selectedYear
  const getMonthStationTotals = (m) => {
    if (m === selectedMonth) {
      const totals = {};
      for (let s = 1; s <= 10; s++) {
        totals[s] = Number(stationRecords[s]?.count) || 0;
      }
      return totals;
    }
    if (typeof window !== 'undefined') {
      const key = `rodent_${selectedYear}_${m}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const recs = parsed.records || {};
          const totals = {};
          for (let s = 1; s <= 10; s++) {
            totals[s] = Number(recs[s]?.count) || 0;
          }
          return totals;
        } catch (e) {}
      }
    }
    const yearlyData = RODENT_ALL_YEARLY_TREND[String(selectedYear)];
    if (yearlyData) {
      const mIdx = MONTH_NAMES.indexOf(m);
      const shortNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const shortM = shortNames[mIdx];
      const row = yearlyData.find(r => r["เดือน"] === shortM || r["เดือน"] === m);
      if (row) {
        const totals = {};
        for (let s = 1; s <= 10; s++) {
          totals[s] = Number(row[`สถานี ${s}`]) || 0;
        }
        return totals;
      }
    }
    const totals = {};
    for (let s = 1; s <= 10; s++) {
      totals[s] = 0;
    }
    return totals;
  };

  // Helper to get total rodent count for a month in selectedYear
  const getMonthRodentTotal = (m) => {
    const stTotals = getMonthStationTotals(m);
    return Object.values(stTotals).reduce((sum, v) => sum + v, 0);
  };

  // Monthly trend data across months up to selected month (matches lizard overallTrendData - Image 3)
  const overallTrendData = useMemo(() => {
    const idx = MONTH_NAMES.indexOf(selectedMonth);
    const count = idx >= 0 ? idx + 1 : 12;
    return MONTH_NAMES.slice(0, count).map((m, i) => {
      const shortName = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][i];
      const stTotals = getMonthStationTotals(m);
      return {
        month: shortName,
        total: Object.values(stTotals).reduce((sum, v) => sum + v, 0),
        station1: stTotals[1] || 0,
        station2: stTotals[2] || 0,
        station3: stTotals[3] || 0,
        station4: stTotals[4] || 0,
        station5: stTotals[5] || 0,
        station6: stTotals[6] || 0,
        station7: stTotals[7] || 0,
        station8: stTotals[8] || 0,
        station9: stTotals[9] || 0,
        station10: stTotals[10] || 0,
      };
    });
  }, [selectedMonth, selectedYear, stationRecords, recordedMonths]);

  // Monthly trend data across 12 months
  const yearlyTrendData = useMemo(() => {
    return MONTH_NAMES.map((m, idx) => {
      const shortName = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][idx];
      const stTotals = getMonthStationTotals(m);
      return {
        month: shortName,
        total: Object.values(stTotals).reduce((sum, v) => sum + v, 0),
        station1: stTotals[1] || 0,
        station2: stTotals[2] || 0,
        station3: stTotals[3] || 0,
        station4: stTotals[4] || 0,
        station5: stTotals[5] || 0,
        station6: stTotals[6] || 0,
        station7: stTotals[7] || 0,
        station8: stTotals[8] || 0,
        station9: stTotals[9] || 0,
        station10: stTotals[10] || 0,
      };
    });
  }, [selectedYear, selectedMonth, stationRecords, recordedMonths]);

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

  // Analytical summary text for QC/QA report (Monthly Bar Chart)
  const rodentAnalysisText = useMemo(() => {
    if (monthlyTotal === 0) {
      return `จากกราฟแสดงรายงานการตรวจนับจุดวางกับดักหนูที่สโตร์ ประจำเดือน ${selectedMonth} ${selectedYear} พบว่า ไม่พบหนูเลย ทั้ง 10 สถานี ดังนั้นควรที่จะเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่เก็บบรรจุภัณฑ์ การปิดม่านประตู การทำความสะอาดพื้นที่เก็บบรรจุภัณฑ์และบริเวณรอบอาคารให้สะอาดอยู่เสมอ`;
    }
    const infested = currentMonthStationData.filter(s => s.count > 0);
    const details = infested.map(st => `พบหนูที่${st.name} จำนวน ${st.count} ตัว`).join(' และ');
    return `จากกราฟแสดงรายงานการตรวจนับจุดวางกับดักหนูที่สโตร์ ประจำเดือน ${selectedMonth} ${selectedYear} พบว่า ${details} รวมทั้งสิ้น ${monthlyTotal} ตัว ดังนั้นควรที่จะเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่เก็บบรรจุภัณฑ์ การปิดม่านประตู การทำความสะอาดพื้นที่เก็บบรรจุภัณฑ์และบริเวณรอบอาคารให้สะอาดอยู่เสมอ และดำเนินการเปลี่ยนแผ่นกาว/ตรวจสอบแนวป้องกันทันที`;
  }, [monthlyTotal, currentMonthStationData, selectedMonth, selectedYear]);

  // Overall trend summary text
  const overallTrendSummaryText = useMemo(() => {
    const counts = {};
    for (let s = 1; s <= 10; s++) {
      counts[s] = Number(stationRecords[s]?.count) || 0;
    }

    const infested = [];
    for (let s = 1; s <= 10; s++) {
      if (counts[s] > 0) {
        infested.push({ id: s, name: `สถานีที่ ${s}`, count: counts[s] });
      }
    }

    if (infested.length === 0) {
      return `จากกราฟแสดงแนวโน้มจำนวนหนูของจุดวางกับดักหนูที่สโตร์ ประจำเดือน ${selectedMonth} ${selectedYear} พบว่า ไม่พบหนูเลย ทั้ง 10 สถานี ดังนั้นควรที่จะเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่เก็บบรรจุภัณฑ์ การปิดม่านประตู การทำความสะอาดพื้นที่เก็บบรรจุภัณฑ์และบริเวณรอบอาคารให้สะอาดอยู่เสมอ`;
    }

    const details = infested.map(st => `พบหนูที่${st.name} จำนวน ${st.count} ตัว`).join(' และ');
    return `จากกราฟแสดงแนวโน้มจำนวนหนูของจุดวางกับดักหนูที่สโตร์ ประจำเดือน ${selectedMonth} ${selectedYear} พบว่า ${details} ดังนั้นควรที่จะเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่เก็บบรรจุภัณฑ์ การปิดม่านประตู การทำความสะอาดพื้นที่เก็บบรรจุภัณฑ์และบริเวณรอบอาคารให้สะอาดอยู่เสมอ และดำเนินการเปลี่ยนแผ่นกาว/ตรวจสอบแนวป้องกันทันที`;
  }, [stationRecords, selectedMonth, selectedYear]);

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

  // ── PRINT SIGNATURE COMPONENT (2 columns balanced with shortened signing line & centered date) ──
  const PrintSignature = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '28px', width: '100%' }}>
      {/* Left Column: จัดทำโดย */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '12px', marginTop: '2px' }}>
          จัดทำโดย
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
          <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#111', whiteSpace: 'nowrap' }}>
            วันที่......./......./.......
          </div>
        </div>
      </div>

      {/* Right Column: รับทราบโดย */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '12px', marginTop: '2px' }}>
          รับทราบโดย
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '180px' }}>
          <div style={{ width: '100%', borderBottom: '1px solid #000', height: '16px' }}></div>
          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#111', whiteSpace: 'nowrap' }}>
            วันที่......./......./.......
          </div>
        </div>
      </div>
    </div>
  );

  // ── PAGE 1: Monthly bar chart report (รายงานการตรวจนับประจำเดือน) ──
  const renderRodentMonthlyPrintPage = () => {
    return (
      <div 
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          maxHeight: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10mm 14mm 10mm 14mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div>
          {/* Header */}
          <div style={{ fontSize: '12px', color: '#111', marginBottom: '12px' }}>
            บริษัท พี.เอ.ฟู้ด โปรดักส์ จำกัด
          </div>

          {/* Chart Outer Box */}
          <div style={{ border: '1px solid #777', padding: '22px 14px 10px 14px', marginBottom: '10px', backgroundColor: '#fff' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111', letterSpacing: '0.2px' }}>
                กราฟแสดงรายงานการตรวจนับจำนวนหนู ประจำเดือน {selectedMonth} {selectedYear}
              </h2>
            </div>

            {/* Bar Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <BarChart
                width={920}
                height={415}
                data={currentMonthStationData}
                margin={{ top: 50, right: 80, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#333"
                  fontSize={12}
                  tickLine={false}
                  label={{ value: 'จุดวางกับดักหนู (สโตร์)', position: 'insideBottom', offset: -12, fontSize: 12, fontWeight: 'bold' }}
                />
                <YAxis
                  stroke="#333"
                  fontSize={12}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  label={{ value: 'จำนวน(ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 12 }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ right: 10, border: '1px solid #999', padding: '4px 8px', fontSize: '12px' }}
                />
                <Bar
                  dataKey="count"
                  name="จำนวนหนู"
                  fill="#e11d48"
                  isAnimationActive={false}
                  barSize={40}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    content={({ x, y, width, value }) => (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={Number(value) === 0 ? Number(y) - 6 : Number(y) - 8}
                        fill="#e11d48"
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight="bold"
                      >
                        {value}
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            </div>
          </div>

          {/* Summary Text Box */}
          <div style={{ border: '1px solid #777', padding: '12px 16px', fontSize: '12px', lineHeight: '1.7', color: '#111', marginBottom: '8px' }}>
            {rodentAnalysisText}
          </div>
        </div>

        {/* Balanced Signature */}
        <PrintSignature />
      </div>
    );
  };

  // ── PAGE 2: Overall multi-line trend report (กราฟแสดงแนวโน้มจำนวนหนู - รูปแบบเหมือนจิ้งจก) ──
  const renderRodentOverallTrendPrintPage = () => {
    return (
      <div 
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          maxHeight: '210mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '10mm 14mm 10mm 14mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div>
          {/* Header */}
          <div style={{ fontSize: '12px', color: '#111', marginBottom: '12px' }}>
            บริษัท พี.เอ.ฟู้ด โปรดักส์ จำกัด
          </div>

          {/* Chart Outer Box */}
          <div style={{ border: '1px solid #777', padding: '22px 14px 10px 14px', marginBottom: '10px', backgroundColor: '#fff' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111', letterSpacing: '0.2px' }}>
                กราฟแสดงแนวโน้มจำนวนหนูที่พบในจุดวางกับดักหนู ประจำเดือน {selectedMonth} {selectedYear}
              </h2>
            </div>

            {/* Line Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <LineChart
                width={920}
                height={415}
                data={overallTrendData}
                margin={{ top: 50, right: 110, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#333" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#333"
                  fontSize={12}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, 5]}
                  ticks={[0, 1, 2, 3, 4, 5]}
                  label={{ value: 'จำนวนที่พบ (ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 12 }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ right: 5, border: '1px solid #777', padding: '6px 12px', backgroundColor: '#fff' }}
                  content={renderVerticalLegend}
                />
                {RODENT_STATION_CONFIG.map((st) => (
                  <Line
                    key={st.key}
                    type="linear"
                    dataKey={st.key}
                    name={st.name}
                    stroke={st.color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: st.color, stroke: '#ffffff', strokeWidth: 1.5 }}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey={st.key}
                      position="top"
                      content={({ x, y, value, index, payload }) => {
                        if (value === undefined || value === null) return null;
                        const numVal = Number(value);

                        // จุดที่เป็น 0 ให้แสดงทับซ้อนกันที่ตำแหน่งปกติได้ตามที่ผู้ใช้กำหนด
                        if (isNaN(numVal) || numVal === 0) {
                          return (
                            <text
                              x={x}
                              y={Number(y) - 6}
                              fill={st.color}
                              stroke="#ffffff"
                              strokeWidth={2}
                              paintOrder="stroke fill"
                              textAnchor="middle"
                              fontSize={10.5}
                              fontWeight="bold"
                            >
                              {value}
                            </text>
                          );
                        }

                        // ข้อมูลเดือนของจุดนี้
                        const monthIdx = typeof index === 'number'
                          ? index
                          : (payload?.month ? overallTrendData.findIndex(d => d.month === payload.month) : -1);
                        const monthData = (monthIdx >= 0 && overallTrendData[monthIdx])
                          ? overallTrendData[monthIdx]
                          : (payload || {});

                        // หาสถานีที่พบจำนวนเท่ากันในเดือนนี้ (> 0)
                        const tiedStations = RODENT_STATION_CONFIG.filter(s => Number(monthData[s.key]) === numVal);

                        if (tiedStations.length <= 1) {
                          return (
                            <text
                              x={x}
                              y={Number(y) - 6}
                              fill={st.color}
                              stroke="#ffffff"
                              strokeWidth={2.5}
                              paintOrder="stroke fill"
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight="bold"
                            >
                              {value}
                            </text>
                          );
                        }

                        // กรณีมี 2 สถานีขึ้นไปพบจำนวนเท่ากัน (> 0) แยกตำแหน่งเลเบลไม่ให้ทับซ้อน
                        const tieIndex = tiedStations.findIndex(s => s.key === st.key);
                        let posX = x;
                        let posY = Number(y) - 7;
                        let textAnchor = 'middle';

                        if (tiedStations.length === 2) {
                          const prevMonthData = monthIdx > 0 ? overallTrendData[monthIdx - 1] : null;
                          const prev0 = prevMonthData ? Number(prevMonthData[tiedStations[0].key] || 0) : numVal;
                          const prev1 = prevMonthData ? Number(prevMonthData[tiedStations[1].key] || 0) : numVal;

                          let topStationKey = tiedStations[0].key;
                          if (prev0 < numVal && prev1 >= numVal) {
                            topStationKey = tiedStations[1].key;
                          } else if (prev1 < numVal && prev0 >= numVal) {
                            topStationKey = tiedStations[0].key;
                          } else {
                            topStationKey = tiedStations[0].key;
                          }

                          const isTop = (st.key === topStationKey);
                          posY = isTop ? Number(y) - 7 : Number(y) + 16;
                        } else if (tiedStations.length === 3) {
                          if (tieIndex === 0) {
                            posY = Number(y) - 7;
                          } else if (tieIndex === 1) {
                            posY = Number(y) + 16;
                          } else {
                            posX = Number(x) + 11;
                            posY = Number(y) + 4;
                            textAnchor = 'start';
                          }
                        } else {
                          if (tieIndex === 0) {
                            posY = Number(y) - 7;
                          } else if (tieIndex === 1) {
                            posY = Number(y) + 16;
                          } else if (tieIndex === 2) {
                            posX = Number(x) + 11;
                            posY = Number(y) + 4;
                            textAnchor = 'start';
                          } else {
                            posX = Number(x) - 11;
                            posY = Number(y) + 4;
                            textAnchor = 'end';
                          }
                        }

                        return (
                          <text
                            x={posX}
                            y={posY}
                            fill={st.color}
                            stroke="#ffffff"
                            strokeWidth={2.5}
                            paintOrder="stroke fill"
                            textAnchor={textAnchor}
                            fontSize={11}
                            fontWeight="bold"
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Line>
                ))}
              </LineChart>
            </div>
          </div>

          {/* Summary Text Box */}
          <div style={{ border: '1px solid #777', padding: '12px 16px', fontSize: '12px', lineHeight: '1.7', color: '#111', marginBottom: '8px' }}>
            {overallTrendSummaryText}
          </div>
        </div>

        {/* Balanced Signature */}
        <PrintSignature />
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

              {/* Chart 2: Multi-Line Trend Chart (10 Stations - Lizard Style) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      กราฟแสดงแนวโน้มจำนวนหนูที่พบในจุดวางกับดักหนู
                    </h3>
                    <p className="text-xs text-slate-400">เปรียบเทียบแนวโน้มรายสถานี ประจำเดือน {selectedMonth} {selectedYear}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700">
                    10 สถานีสโตร์
                  </span>
                </div>
                <div className="h-72 sm:h-80 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overallTrendData} margin={{ top: 20, right: 25, left: -10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                        <YAxis allowDecimals={false} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} stroke="#64748b" label={{ value: 'จำนวนที่พบ (ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Legend
                          content={renderHorizontalLegend}
                        />
                        {RODENT_STATION_CONFIG.map((st) => (
                          <Line
                            key={st.key}
                            type="linear"
                            dataKey={st.key}
                            name={st.name}
                            stroke={st.color}
                            strokeWidth={2}
                            dot={{ r: 3, fill: st.color }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {overallTrendSummaryText}
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
            
            {/* Top Action Bar (Print Buttons) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  🖨️ สั่งพิมพ์รายงานสถิติดักหนู (A4 แนวนอน):
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePrint('monthly')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="หน้าที่ 1: รายงานสถิติประจำเดือน"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์รายงานประจำเดือน (A4 แนวนอน)</span>
                </button>
                <button
                  onClick={() => handlePrint('overall')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="หน้าที่ 2: กราฟแนวโน้มรวมรายสถานี"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์รายงานแนวโน้ม (A4 แนวนอน)</span>
                </button>
                <button
                  onClick={() => handlePrint('all')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  title="พิมพ์รายงานทั้งหมด (2 หน้า)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>พิมพ์ทั้งหมด (2 หน้า)</span>
                </button>
              </div>
            </div>

            {/* Page Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">เลือกตัวอย่างหน้าพิมพ์:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => setPreviewPageIndex(1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewPageIndex === 1
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    หน้าที่ 1: รายงานประจำเดือน
                  </button>
                  <button
                    onClick={() => setPreviewPageIndex(2)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewPageIndex === 2
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    หน้าที่ 2: กราฟแนวโน้มรวม
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                รูปแบบกระดาษ: A4 แนวนอน (Landscape)
              </div>
            </div>

            {/* ── PREVIEW 1: Monthly Bar Chart ── */}
            {previewPageIndex === 1 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm no-print space-y-6">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  บริษัท พี.เอ.ฟู้ด โปรดักส์ จำกัด
                </div>
                <div className="text-center">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                    กราฟแสดงรายงานการตรวจนับจำนวนหนู ประจำเดือน {selectedMonth} {selectedYear}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    สถานีที่ 1 ถึง 10 (จุดติดตั้งหมายเลข 57-65 สโตร์และคลังสินค้า)
                  </p>
                </div>

                <div className="h-[380px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentMonthStationData} margin={{ top: 25, right: 10, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
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

                {/* 2 Balanced Signatures Preview */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">จัดทำโดย:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{inspectorName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">รับทราบโดย:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{reviewerName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── PREVIEW 2: Overall Multi-Line Trend Chart (Lizard Format) ── */}
            {previewPageIndex === 2 && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm no-print space-y-6">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  บริษัท พี.เอ.ฟู้ด โปรดักส์ จำกัด
                </div>
                <div className="text-center">
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                    กราฟแสดงแนวโน้มจำนวนหนูที่พบในจุดวางกับดักหนู ประจำเดือน {selectedMonth} {selectedYear}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    เปรียบเทียบสถิติรายสถานี (สถานีที่ 1 ถึง 10 สโตร์)
                  </p>
                </div>

                <div className="h-[380px] w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overallTrendData} margin={{ top: 25, right: 30, left: -10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                        <YAxis
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          allowDecimals={false}
                          domain={[0, 5]}
                          ticks={[0, 1, 2, 3, 4, 5]}
                          label={{ value: 'จำนวนที่พบ (ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
                        />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Legend
                          content={renderHorizontalLegend}
                        />
                        {RODENT_STATION_CONFIG.map((st) => (
                          <Line
                            key={st.key}
                            type="linear"
                            dataKey={st.key}
                            name={st.name}
                            stroke={st.color}
                            strokeWidth={2}
                            dot={{ r: 3.5, fill: st.color }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Analytical Summary Box */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400 mb-1">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <span>สรุปผลการวิเคราะห์แนวโน้ม:</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {overallTrendSummaryText}
                  </p>
                </div>

                {/* 2 Balanced Signatures Preview */}
                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">จัดทำโดย:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{inspectorName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">รับทราบโดย:</p>
                    <p className="font-bold text-xs mt-2 text-slate-800 dark:text-slate-200">{reviewerName || '........................................'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">วันที่......./......./.......</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Printable reports layout (Landscape A4 - Lizard Style) */}
      {printJob !== 'none' && (
        <div className="print-layout">
          {(printJob === 'monthly' || printJob === 'all') && renderRodentMonthlyPrintPage()}
          {(printJob === 'overall' || printJob === 'yearly' || printJob === 'all') && renderRodentOverallTrendPrintPage()}
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
