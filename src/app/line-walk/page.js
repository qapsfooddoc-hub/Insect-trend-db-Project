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
  Activity, ArrowRight, Clock
} from 'lucide-react';
import FormNav from '@/components/FormNav';
import MonthYearPicker from '@/components/MonthYearPicker';
import { 
  LINE_WALK_AREAS, 
  LINE_WALK_MONTHLY_DATA_2569 
} from '@/lib/data/lineWalkData';

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const PEST_COLS = [
  { key: 'ยุง', name: 'ยุง', color: '#4f81bd' },
  { key: 'แมลงวัน', name: 'แมลงวัน', color: '#c0504d' },
  { key: 'แมลงสาบ', name: 'แมลงสาบ', color: '#9bbb59' },
  { key: 'มด', name: 'มด', color: '#8064a2' },
  { key: 'หนู', name: 'หนู', color: '#4bacc6' },
  { key: 'กรงดักหนู', name: 'กรงดักหนู', color: '#f79646' },
  { key: 'อื่นๆ', name: 'อื่นๆ', color: '#366092' }
];

export const PHASE_5_AREAS = [
  'โรงฆ่า', 'ผ่าซาก', 'ห้องเครื่องในขาว', 'ห้องเครื่องในแดง', 'ห้องแพ็คเครื่องใน', 
  'เผาขา', 'ตัดแต่ง', 'โหลดสินค้า', 'รอบโรงฆ่า/ตัดแต่ง/ชั้นใต้ดิน', 
  'ชั้นใต้ดิน เฟส 5', 'ชั้นใต้ดิน เฟส 5.1', 'เฟส 5.1'
];

export const WAREHOUSE_3_AREAS = [
  'คลังสินค้า 3', 'รอบคลังสินค้า 3', 'Slice ชั้น 1 (ทางเข้าไลน์)', 
  'Slice เลื่อย/Slice เตรียม', 'Slice 4.1/Pack Slice/MDC', 'Slice ชั้น 2', 
  'Slice ชั้น 3', 'รอบอาคารคลังสินค้า 4', 'อาคาร A', 'อาคาร C'
];

export const ALL_LINE_WALK_PRINT_PHASES = [
  { id: 'all', name: 'ภาพรวมทุกอาคาร' },
  { id: 'phase5', name: 'อาคารเฟส 5' },
  { id: 'warehouse3', name: 'อาคารคลังสินค้า 3' }
];

export default function LineWalkPage() {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'entry', 'print'
  const [selectedMonth, setSelectedMonth] = useState('สิงหาคม');
  const [selectedYear, setSelectedYear] = useState('2569');
  const [selectedPhase, setSelectedPhase] = useState('all'); // 'all', 'phase5', 'warehouse3'
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [mounted, setMounted] = useState(false);
  const [printJob, setPrintJob] = useState('none'); // 'none', 'single', 'all'
  const [selectedPrintPhase, setSelectedPrintPhase] = useState('all');

  const handlePrint = (job) => {
    setPrintJob(job);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const displayedAreas = useMemo(() => {
    if (selectedPhase === 'phase5') return LINE_WALK_AREAS.filter(a => PHASE_5_AREAS.includes(a));
    if (selectedPhase === 'warehouse3') return LINE_WALK_AREAS.filter(a => WAREHOUSE_3_AREAS.includes(a));
    return LINE_WALK_AREAS;
  }, [selectedPhase]);

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
        const key1 = `linewalk_${selectedYear}_${m}`;
        const key2 = `linewalk_records_${m}_${selectedYear}`;
        if (localStorage.getItem(key1) || localStorage.getItem(key2)) {
          list.push(m);
        }
      });
    }
    return list;
  }, [selectedYear, savedSuccess]);

  // All 12 months are accessible
  const availableMonths = MONTH_NAMES;

  // Table rows for the selected month: area -> { ยุง, แมลงวัน, แมลงสาบ, มด, หนู, กรงดักหนู, อื่นๆ }
  const [tableData, setTableData] = useState(() => {
    const monthRows = LINE_WALK_MONTHLY_DATA_2569['สิงหาคม'] || [];
    const map = {};
    LINE_WALK_AREAS.forEach(area => {
      const existing = monthRows.find(r => r['แผนก/พื้นที่'] === area);
      map[area] = {
        'ยุง': existing?.['ยุง'] ?? '',
        'แมลงวัน': existing?.['แมลงวัน'] ?? '',
        'แมลงสาบ': existing?.['แมลงสาบ'] ?? '',
        'มด': existing?.['มด'] ?? '',
        'หนู': existing?.['หนู'] ?? '',
        'กรงดักหนู': existing?.['กรงดักหนู'] ?? '',
        'อื่นๆ': existing?.['อื่นๆ'] ?? ''
      };
    });
    return map;
  });

  // Load when month changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = `linewalk_${selectedYear}_${selectedMonth}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setTableData(parsed.records || {});
          setInspectorName(parsed.inspector || '');
          setReviewerName(parsed.reviewer || '');
          return;
        } catch (e) {}
      }

      // If selectedYear is 2569 and no recorded data, load sample baseline
      const monthRows = selectedYear === '2569' ? (LINE_WALK_MONTHLY_DATA_2569[selectedMonth] || []) : [];
      const map = {};
      LINE_WALK_AREAS.forEach(area => {
        const existing = monthRows.find(r => r['แผนก/พื้นที่'] === area);
        map[area] = {
          'ยุง': existing?.['ยุง'] ?? '',
          'แมลงวัน': existing?.['แมลงวัน'] ?? '',
          'แมลงสาบ': existing?.['แมลงสาบ'] ?? '',
          'มด': existing?.['มด'] ?? '',
          'หนู': existing?.['หนู'] ?? '',
          'กรงดักหนู': existing?.['กรงดักหนู'] ?? '',
          'อื่นๆ': existing?.['อื่นๆ'] ?? ''
        };
      });
      setTableData(map);
    }
  }, [selectedMonth, selectedYear]);

  // Handle cell edit
  const handleCellChange = (area, pestKey, val) => {
    const clean = String(val).replace(/[^0-9]/g, '');
    const num = clean === '' ? '' : Math.max(0, parseInt(clean, 10) || 0);
    setTableData(prev => ({
      ...prev,
      [area]: {
        ...prev[area],
        [pestKey]: num
      }
    }));
  };

  // Excel-like keyboard navigation for the areas x pests table
  const handleTableKeyDown = (e, aIdx, pIdx) => {
    const focusCell = (targetAreaIdx, targetPestIdx) => {
      if (targetAreaIdx < 0 || targetAreaIdx >= displayedAreas.length) return false;
      if (targetPestIdx < 0 || targetPestIdx >= PEST_COLS.length) return false;
      const el = document.getElementById(`cell-linewalk-${targetAreaIdx}-${targetPestIdx}`);
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
        // Shift + Enter: Move UP (previous area)
        focusCell(aIdx - 1, pIdx);
      } else {
        // Enter: Move DOWN (next area)
        focusCell(aIdx + 1, pIdx);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusCell(aIdx + 1, pIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusCell(aIdx - 1, pIdx);
    } else if (e.key === 'ArrowRight') {
      let atEnd = true;
      try {
        atEnd = (e.target.selectionStart === e.target.value.length) || 
                (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length);
      } catch (_) {}
      if (atEnd) {
        e.preventDefault();
        focusCell(aIdx, pIdx + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      let atStart = true;
      try {
        atStart = (e.target.selectionStart === 0) || 
                  (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length);
      } catch (_) {}
      if (atStart) {
        e.preventDefault();
        focusCell(aIdx, pIdx - 1);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        if (pIdx > 0) {
          focusCell(aIdx, pIdx - 1);
        } else if (aIdx > 0) {
          focusCell(aIdx - 1, PEST_COLS.length - 1);
        }
      } else {
        if (pIdx < PEST_COLS.length - 1) {
          focusCell(aIdx, pIdx + 1);
        } else if (aIdx < displayedAreas.length - 1) {
          focusCell(aIdx + 1, 0);
        }
      }
    }
  };

  // Calculate sum for single area
  const getAreaTotal = (area) => {
    const row = tableData[area] || {};
    let sum = 0;
    PEST_COLS.forEach(p => {
      const v = Number(row[p.key]);
      if (!isNaN(v) && v > 0) sum += v;
    });
    return sum;
  };

  // Grand total for current month
  const monthlyTotal = useMemo(() => {
    let sum = 0;
    LINE_WALK_AREAS.forEach(a => {
      sum += getAreaTotal(a);
    });
    return sum;
  }, [tableData]);

  // Totals by pest type for current month
  const pestTotals = useMemo(() => {
    const totals = {};
    PEST_COLS.forEach(p => { totals[p.key] = 0; });
    Object.values(tableData).forEach(row => {
      PEST_COLS.forEach(p => {
        const v = Number(row[p.key]);
        if (!isNaN(v) && v > 0) totals[p.key] += v;
      });
    });
    return PEST_COLS.map(p => ({
      name: p.name,
      count: totals[p.key],
      color: p.color
    }));
  }, [tableData]);

  // Top areas with insects this month
  const topAreasData = useMemo(() => {
    return LINE_WALK_AREAS.map(a => ({
      area: a,
      total: getAreaTotal(a)
    }))
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);
  }, [tableData]);

  // Helper to calculate total insects for a specific month in selectedYear
  const getMonthTotal = (m) => {
    if (m === selectedMonth) {
      return monthlyTotal;
    }
    if (typeof window !== 'undefined') {
      const key = `linewalk_${selectedYear}_${m}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const recs = parsed.records || {};
          let sum = 0;
          Object.values(recs).forEach(row => {
            PEST_COLS.forEach(p => {
              const v = Number(row[p.key]);
              if (!isNaN(v) && v > 0) sum += v;
            });
          });
          return sum;
        } catch (e) {}
      }
    }
    // Only for 2569 if no recorded months exist across whole year, fallback to sample
    if (selectedYear === '2569' && recordedMonths.length === 0) {
      const excelTotals = {
        'มกราคม': 6, 'กุมภาพันธ์': 0, 'มีนาคม': 14, 'เมษายน': 9,
        'พฤษภาคม': 0, 'มิถุนายน': 6, 'กรกฎาคม': 1, 'สิงหาคม': 17,
        'กันยายน': 11, 'ตุลาคม': 7, 'พฤศจิกายน': 7, 'ธันวาคม': 25
      };
      return excelTotals[m] || 0;
    }
    return 0;
  };

  // Yearly trend for line walk (12 months)
  const yearlyTrendData = useMemo(() => {
    return MONTH_NAMES.map(m => ({
      month: m.substring(0, 4),
      fullMonth: m,
      total: getMonthTotal(m)
    }));
  }, [selectedYear, selectedMonth, monthlyTotal, recordedMonths]);

  const yearlyGrandTotal = useMemo(() => {
    return yearlyTrendData.reduce((sum, r) => sum + r.total, 0);
  }, [yearlyTrendData]);

  // Analytical summary text for QC/QA report
  const lineWalkAnalysisText = useMemo(() => {
    if (monthlyTotal === 0) {
      return `จากการตรวจเดินไลน์ผลิตและคลังสินค้า (FM-QC-08/01) ประจำเดือน ${selectedMonth} ${selectedYear} ไม่พบสัตว์พาหะนำเชื้อโรคในทุกจุดตรวจ สภาพแวดล้อมและมาตรการป้องกันทางกายภาพของโรงงานมีประสิทธิภาพดีเยี่ยมตามเกณฑ์มาตรฐาน GMP/HACCP`;
    }
    const topPest = [...pestTotals].sort((a, b) => b.count - a.count)[0];
    const topArea = topAreasData.length > 0 ? topAreasData[0] : null;
    let text = `จากการตรวจเดินไลน์ผลิตและคลังสินค้า (FM-QC-08/01) ประจำเดือน ${selectedMonth} ${selectedYear} ตรวจพบสัตว์พาหะรวมทั้งสิ้น ${monthlyTotal} ตัว `;
    if (topPest && topPest.count > 0) {
      text += `โดยชนิดที่พบมากที่สุดคือ "${topPest.name}" จำนวน ${topPest.count} ตัว (${Math.round((topPest.count / monthlyTotal) * 100)}%) `;
    }
    if (topArea && topArea.total > 0) {
      text += `และจุดที่พบความชุกชุมสูงสุดคือ "${topArea.area}" ตรวจพบ ${topArea.total} ตัว `;
    }
    text += `ฝ่ายประกันคุณภาพ (QA) ขอแนะนำให้เพิ่มความเข้มงวดในการปิดประตูทางเข้า-ออกตลอดเวลา ตรวจสอบม่านพลาสติก/ม่านลม และประสานงานทีม Pest Control เข้าทำการฉีดพ่นและเสริมจุดดักเพิ่มเติมในจุดที่มีการพบตัวเพื่อควบคุมไม่ให้เกิดการปนเปื้อนในไลน์ผลิต`;
    return text;
  }, [monthlyTotal, pestTotals, topAreasData, selectedMonth, selectedYear]);

  // Save handler
  const handleSave = () => {
    if (typeof window !== 'undefined') {
      const key = `linewalk_${selectedYear}_${selectedMonth}`;
      const payload = {
        records: tableData,
        inspector: inspectorName,
        reviewer: reviewerName,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(payload));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const getLineWalkChartData = (phaseId) => {
    let areas = LINE_WALK_AREAS;
    if (phaseId === 'phase5') areas = LINE_WALK_AREAS.filter(a => PHASE_5_AREAS.includes(a));
    else if (phaseId === 'warehouse3') areas = LINE_WALK_AREAS.filter(a => WAREHOUSE_3_AREAS.includes(a));

    return areas.map(area => {
      const row = tableData[area] || {};
      const item = { name: area };
      PEST_COLS.forEach(p => {
        item[p.key] = Number(row[p.key]) || 0;
      });
      item.total = getAreaTotal(area);
      return item;
    });
  };

  const getLineWalkPhaseReportText = (phaseId) => {
    let areas = LINE_WALK_AREAS;
    if (phaseId === 'phase5') areas = LINE_WALK_AREAS.filter(a => PHASE_5_AREAS.includes(a));
    else if (phaseId === 'warehouse3') areas = LINE_WALK_AREAS.filter(a => WAREHOUSE_3_AREAS.includes(a));

    let phaseSum = 0;
    const pestCountMap = {};
    PEST_COLS.forEach(p => { pestCountMap[p.key] = 0; });

    let maxArea = areas[0];
    let maxAreaCount = -1;

    areas.forEach(a => {
      const areaTotal = getAreaTotal(a);
      phaseSum += areaTotal;
      if (areaTotal > maxAreaCount) {
        maxAreaCount = areaTotal;
        maxArea = a;
      }
      PEST_COLS.forEach(p => {
        const v = Number(tableData[a]?.[p.key]);
        if (!isNaN(v) && v > 0) pestCountMap[p.key] += v;
      });
    });

    if (phaseSum === 0) {
      return `จากการตรวจสอบการควบคุมสัตว์พาหะนำเชื้อโรคในพื้นที่ประจำเดือน ${selectedMonth} ${selectedYear} ไม่พบสัตว์พาหะนำเชื้อโรคเลยในพื้นที่การผลิตดังนั้นควรที่จะเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การปิดประตู การทำความสะอาดพื้นที่ผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ ตรวจสอบบริเวณโคมไฟไม่ให้เป็นแหล่งที่อยู่ของแมลง เพื่อรักษาจำนวนสัตว์พาหะนำเชื้อโรคให้เป็น 0 ต่อไป`;
    }

    const sortedPests = PEST_COLS
      .map(p => ({ name: p.name, count: pestCountMap[p.key] }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);
    const topPestDesc = sortedPests.map(p => `${p.name} ${p.count} ตัว`).join(', ');

    return `จากการตรวจสอบการควบคุมสัตว์พาหะนำเชื้อโรคในพื้นที่ประจำเดือน ${selectedMonth} ${selectedYear} ตรวจพบสัตว์พาหะนำเชื้อโรคในพื้นที่การผลิตรวม ${phaseSum} ตัว (พบ${topPestDesc}) โดยจุดที่พบมากที่สุดคือ "${maxArea}" (พบ ${maxAreaCount} ตัว) ดังนั้นควรที่จะเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การปิดประตู การทำความสะอาดพื้นที่ผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ ตรวจสอบบริเวณโคมไฟไม่ให้เป็นแหล่งที่อยู่ของแมลง เพื่อลดและควบคุมจำนวนสัตว์พาหะนำเชื้อโรคในพื้นที่การผลิต`;
  };

  const renderLineWalkPrintPage = (phaseId) => {
    const phaseObj = ALL_LINE_WALK_PRINT_PHASES.find(p => p.id === phaseId) || ALL_LINE_WALK_PRINT_PHASES[0];
    const chartData = getLineWalkChartData(phaseId);
    const reportText = getLineWalkPhaseReportText(phaseId);

    // Calculate maximum Y-axis domain
    const maxVal = Math.max(2, ...chartData.map(d => d.total || 0));
    const yDomain = [0, maxVal <= 2 ? 2 : Math.ceil(maxVal * 1.2)];
    const yTicks = maxVal <= 2 ? [0, 1, 2] : undefined;

    return (
      <div 
        key={phaseId}
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          width: '297mm',
          height: '210mm',
          maxHeight: '210mm',
          display: 'flex',
          flexDirection: 'column',
          padding: '8mm 12mm 8mm 12mm',
          boxSizing: 'border-box',
          backgroundColor: 'white',
          color: 'black'
        }}
      >
        <div>
          {/* Header */}
          <div style={{ fontSize: '12px', color: '#111', marginBottom: '10px' }}>
            บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
          </div>

          {/* Chart Outer Box */}
          <div style={{ border: '1px solid #777', padding: '20px 14px 8px 14px', marginBottom: '10px', backgroundColor: '#fff' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111', letterSpacing: '0.2px' }}>
                กราฟแสดงจำนวนแมลงจากการตรวจสอบการควบคุมสัตว์พาหะนำเชื้อโรค ประจำเดือน {selectedMonth} {selectedYear}
              </h1>
            </div>

            {/* Stacked Bar Chart - Expanded Height */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <BarChart
                width={940}
                height={395}
                data={chartData}
                margin={{ top: 35, right: 15, left: 0, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#333"
                  fontSize={9.5}
                  tickLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={65}
                />
                <YAxis
                  stroke="#333"
                  fontSize={11}
                  tickLine={false}
                  allowDecimals={false}
                  domain={yDomain}
                  ticks={yTicks}
                  label={{ value: 'จำนวน (ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
                />
                <Legend
                  wrapperStyle={{ bottom: -2, left: 0, width: '100%', fontSize: '11px', textAlign: 'center' }}
                  iconSize={12}
                />
                {PEST_COLS.map((pest) => (
                  <Bar
                    key={pest.key}
                    dataKey={pest.key}
                    name={pest.name}
                    stackId="a"
                    fill={pest.color}
                    barSize={14}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </div>
          </div>

          {/* Summary Text Box */}
          <div style={{ border: '1px solid #777', padding: '10px 14px', fontSize: '12px', lineHeight: '1.65', color: '#111', marginBottom: '8px' }}>
            {reportText}
          </div>
        </div>

        {/* 2-Column Balanced Signatures (Shortened Line & Centered Date) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '26px', width: '100%' }}>
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
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#F4F7FC] text-slate-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="screen-content max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Switcher between all 5 pest forms */}
        <FormNav activeFormId="line-walk" />

        {/* Header Hero */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-purple-100">
                <span>🚶 FM-QC-08/01 Rev. 11</span>
                <span>•</span>
                <span>รายงานการตรวจสอบการควบคุมสัตว์พาหะนำเชื้อโรค</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                รายงานการตรวจสอบการควบคุมสัตว์พาหะนำเชื้อโรค
              </h1>
              <p className="text-xs sm:text-sm text-purple-100 max-w-2xl font-medium">
                บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด — อาคารเฟส 5 (โรงฆ่า, โรงชำแหละ, อาคารแปรรูป) และ อาคารคลังสินค้า 3 (เฟส 3-4)
              </p>
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start md:self-center">
              <button
                onClick={() => setActiveTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'chart'
                    ? 'bg-white text-purple-900 shadow-sm'
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
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>บันทึกผลเดินไลน์</span>
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-white text-purple-900 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์เอกสาร FM</span>
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
              accentColor="purple"
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 text-xs font-extrabold border border-purple-200 dark:border-purple-900">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ยอดพบเดือน {selectedMonth} {selectedYear}: {monthlyTotal} ตัว
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
                <h3 className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {yearlyGrandTotal} <span className="text-xs font-normal text-slate-400">ตัว</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">จาก 22 จุดเดินไลน์</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">จุดที่พบมากที่สุด ({selectedMonth})</p>
                <h3 className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400 mt-1 truncate">
                  {topAreasData[0]?.area || 'ไม่พบแมลง'}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  {topAreasData[0] ? `พบ ${topAreasData[0].total} ตัว` : 'พื้นที่สะอาดเรียบร้อย'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">ชนิดที่พบมากสุด ({selectedMonth})</p>
                <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {pestTotals.slice().sort((a,b) => b.count - a.count)[0]?.name}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">
                  {pestTotals.slice().sort((a,b) => b.count - a.count)[0]?.count} ตัว
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">การควบคุมหนูและกรงดัก</p>
                <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>0 ตัว (ปลอดภัย)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">ไม่พบหนูในไลน์ผลิต</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: By Pest Type */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      สถิติแยกตามชนิดแมลงที่ตรวจพบจากการเดินไลน์
                    </h3>
                    <p className="text-xs text-slate-400">ประจำเดือน {selectedMonth} {selectedYear}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700">
                    รวม {monthlyTotal} ตัว
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pestTotals}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} domain={[0, 'dataMax + 2']} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val) => [`${val} ตัว`, 'จำนวนที่พบ']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="count" name="จำนวนที่พบ" radius={[6, 6, 0, 0]}>
                          {pestTotals.map((entry, index) => (
                            <Cell key={`pest-cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Top Areas */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      พื้นที่ที่พบแมลงสะสมสูงสุดในเดือนนี้
                    </h3>
                    <p className="text-xs text-slate-400">เรียงตามปริมาณที่พบ (เดินไลน์ 22 จุด)</p>
                  </div>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  {topAreasData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      ไม่พบแมลงในจุดเดินไลน์ใดๆ ประจำเดือนนี้ (สะอาดเรียบร้อย)
                    </div>
                  ) : mounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topAreasData.slice(0, 6)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="area" width={110} tick={{ fontSize: 10 }} />
                        <Tooltip 
                          formatter={(val) => [`${val} ตัว`, 'ยอดที่พบ']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="total" name="จำนวนแมลง" fill="#8b5cf6" radius={[0, 8, 8, 0]}>
                          {topAreasData.slice(0, 6).map((entry, index) => (
                            <Cell key={`area-cell-${index}`} fill={index === 0 ? '#dc2626' : '#8b5cf6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : null}
                </div>
              </div>

              {/* Chart 3: 12 Months Trend */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      แนวโน้มการพบแมลงจากการเดินไลน์ 12 เดือน (ปี {selectedYear})
                    </h3>
                    <p className="text-xs text-slate-400">ยอดสะสมทั้งปี {yearlyGrandTotal} ตัว</p>
                  </div>
                </div>
                <div className="h-72 sm:h-80 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="fullMonth" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} domain={[0, 30]} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val) => [`${val} ตัว`, 'ยอดตรวจพบจากการเดินไลน์']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          name="ยอดแมลงเดินไลน์รวม" 
                          stroke="#8b5cf6" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#8b5cf6' }} 
                          activeDot={{ r: 7 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 2: DATA ENTRY TABLE (22 AREAS x 7 PESTS) ─── */}
        {activeTab === 'entry' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                  บันทึกผลการเดินไลน์ (Line Walk Inspection Entry)
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ตารางสำรวจตรวจตราแมลงตามไลน์ผลิตประจำเดือน {selectedMonth} {selectedYear}
                </h3>
                <p className="text-xs text-slate-400">
                  กรอกจำนวนแมลงและสัตว์รบกวนที่พบในแต่ละพื้นที่ (22 จุด)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>บันทึกข้อมูลการตรวจสอบแมลงจากการเดินไลน์เรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* Building / Phase filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">เลือกพื้นที่ตรวจ:</span>
              <button
                onClick={() => setSelectedPhase('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPhase === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                ทั้งหมด (22 พื้นที่)
              </button>
              <button
                onClick={() => setSelectedPhase('phase5')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPhase === 'phase5'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                อาคารเฟส 5 (12 จุด)
              </button>
              <button
                onClick={() => setSelectedPhase('warehouse3')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPhase === 'warehouse3'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                อาคารคลังสินค้า 3 / เฟส 3-4 (10 จุด)
              </button>
            </div>

            {/* Table */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1 px-1">
              <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 shadow-2xs">
                ⌨️ ใช้ปุ่มลูกศร (↑ ↓ ← →) และ Enter เลื่อนตารางได้เหมือน Excel
              </span>
              <span className="text-[10px] text-slate-400">
                สำรวจแมลง 6 ชนิดตามแผนก
              </span>
            </div>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[600px]">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold shadow-sm">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-left w-52">
                      แผนก / พื้นที่เดินไลน์
                    </th>
                    {PEST_COLS.map(p => (
                      <th key={p.key} className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 w-20">
                        {p.name}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 border-l border-slate-200 dark:border-slate-700 w-20 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
                      รวม (ตัว)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {displayedAreas.map((area, idx) => {
                    const rowSum = getAreaTotal(area);
                    return (
                      <tr 
                        key={area}
                        className={`hover:bg-purple-50/30 dark:hover:bg-purple-950/10 transition-colors ${
                          idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/30'
                        }`}
                      >
                        <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 text-left font-bold text-[11px] text-slate-800 dark:text-slate-200">
                          {area}
                        </td>
                        {PEST_COLS.map((p, pIdx) => {
                          const val = tableData[area]?.[p.key] ?? '';
                          return (
                            <td key={p.key} className="p-0 border-r border-slate-200 dark:border-slate-800 relative">
                              <input
                                id={`cell-linewalk-${idx}-${pIdx}`}
                                type="text"
                                inputMode="numeric"
                                value={val}
                                onChange={(e) => handleCellChange(area, p.key, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                onKeyDown={(e) => handleTableKeyDown(e, idx, pIdx)}
                                className={`w-full py-1.5 text-center font-mono text-xs bg-transparent focus:bg-purple-100/80 dark:focus:bg-purple-900/50 focus:outline-none focus:ring-2 focus:ring-purple-500 relative focus:z-10 transition-all ${
                                  Number(val) > 0 ? 'text-purple-700 dark:text-purple-300 font-black' : 'text-slate-400'
                                }`}
                                placeholder="0"
                              />
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 border-l border-slate-200 dark:border-slate-800 font-mono font-bold text-xs text-purple-800 dark:text-purple-300 bg-purple-50/40 dark:bg-purple-950/20">
                          {rowSum}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 font-black border-t-2 border-purple-500 text-xs">
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 text-right">
                      ยอดรวม ({displayedAreas.length} จุด)
                    </td>
                    {PEST_COLS.map(p => {
                      let colSum = 0;
                      displayedAreas.forEach(a => {
                        const v = Number(tableData[a]?.[p.key]);
                        if (!isNaN(v) && v > 0) colSum += v;
                      });
                      return (
                        <td key={p.key} className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 font-mono text-xs">
                          {colSum}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 border-l border-slate-200 dark:border-slate-700 font-mono text-sm text-purple-700 dark:text-purple-300">
                      {displayedAreas.reduce((sum, a) => sum + getAreaTotal(a), 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Inspector and Reviewer Signatures */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  ผู้เดินตรวจไลน์ผลิต (Inspector / ผู้รายงาน):
                </label>
                <input
                  type="text"
                  placeholder="ลงชื่อผู้ตรวจเดินไลน์..."
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 font-bold"
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
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 font-bold"
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
                  🖨️ สั่งพิมพ์รายงานประจำเดือน:
                </span>
                <select
                  value={selectedPrintPhase}
                  onChange={(e) => setSelectedPrintPhase(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 text-slate-800 dark:text-slate-200"
                >
                  {ALL_LINE_WALK_PRINT_PHASES.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePrint('single')}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  🖨️ พิมพ์รายงานประจำเดือน (A4 แนวนอน)
                </button>
                <button
                  onClick={() => handlePrint('all')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  🖨️ พิมพ์รายงานประจำเดือนของทุกอาคาร (1 คลิก)
                </button>
              </div>
            </div>

            {/* Screen Preview Card (matches Image 2) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm no-print space-y-6">
              <div className="text-center">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-white">
                  กราฟแสดงจำนวนแมลงจากการตรวจสอบการควบคุมสัตว์พาหะนำเชื้อโรค ({ALL_LINE_WALK_PRINT_PHASES.find(p => p.id === selectedPrintPhase)?.name}) ประจำเดือน {selectedMonth} {selectedYear}
                </h2>
              </div>

              <div className="h-[380px] w-full">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getLineWalkChartData(selectedPrintPhase)} margin={{ top: 25, right: 10, left: -10, bottom: 55 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" className="hidden dark:block" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip formatter={(val, name) => [`${val} ตัว`, name]} />
                      <Legend wrapperStyle={{ bottom: 0, left: 0, width: '100%', textAlign: 'center', fontSize: 11 }} />
                      {PEST_COLS.map((pest) => (
                        <Bar
                          key={pest.key}
                          dataKey={pest.key}
                          name={pest.name}
                          stackId="a"
                          fill={pest.color}
                          barSize={14}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Analytical Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700 dark:text-purple-400 mb-1">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>สรุปรายงานการตรวจสอบการควบคุมสัตว์พาหะนำเชื้อโรค:</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {getLineWalkPhaseReportText(selectedPrintPhase)}
                </p>
              </div>

              {/* 2 Signatures Preview */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-start">
                  <span className="font-bold text-slate-600 dark:text-slate-400 mr-2 mt-0.5">จัดทำโดย:</span>
                  <div className="flex flex-col items-center w-40">
                    <span className="inline-block border-b border-slate-400 w-full">&nbsp;</span>
                    <p className="text-[11px] text-slate-400 mt-3">วันที่......./......./.......</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="font-bold text-slate-600 dark:text-slate-400 mr-2 mt-0.5">รับทราบโดย:</span>
                  <div className="flex flex-col items-center w-40">
                    <span className="inline-block border-b border-slate-400 w-full">&nbsp;</span>
                    <p className="text-[11px] text-slate-400 mt-3">วันที่......./......./.......</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Printable reports layout (Landscape A4 per phase/building - matches Image 1) */}
      {printJob !== 'none' && (
        <div className="print-layout">
          {printJob === 'single' && renderLineWalkPrintPage(selectedPrintPhase)}
          {printJob === 'all' && ALL_LINE_WALK_PRINT_PHASES.map(p => renderLineWalkPrintPage(p.id))}
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
