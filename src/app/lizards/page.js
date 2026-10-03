'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { 
  Save, RotateCcw, Printer, ArrowLeft, Calendar, 
  CheckCircle2, AlertTriangle, TrendingUp, BarChart3, 
  FileText, Download, ShieldCheck, HelpCircle, Layers, Activity 
} from 'lucide-react';
import FormNav from '@/components/FormNav';
import { 
  GECKO_STATIONS, 
  GECKO_YEARLY_TREND_2569, 
  GECKO_MONTHLY_DATA_2569 
} from '@/lib/data/geckoData';

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function LizardsPage() {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'entry', 'print'
  const [selectedMonth, setSelectedMonth] = useState('สิงหาคม');
  const [selectedYear, setSelectedYear] = useState('2569');
  const [reporterName, setReporterName] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [printJob, setPrintJob] = useState('none'); // 'none', 'monthly', 'overall', 'quarterly', 'all'

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

  // Available months with real data: for 2569 (2026), baseline real data is up to August (สิงหาคม)
  const availableMonths = useMemo(() => {
    if (selectedYear === '2569') {
      const base = MONTH_NAMES.slice(0, 8); // ม.ค. - ส.ค.
      if (typeof window !== 'undefined') {
        MONTH_NAMES.slice(8).forEach(m => {
          const key = `lizard_records_${m}_${selectedYear}`;
          if (localStorage.getItem(key)) {
            base.push(m);
          }
        });
      }
      return base;
    }
    return MONTH_NAMES;
  }, [selectedYear]);

  useEffect(() => {
    if (!availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[availableMonths.length - 1] || 'สิงหาคม');
    }
  }, [availableMonths, selectedMonth]);
  // Number of days in the currently selected month and year
  const daysInMonth = useMemo(() => {
    const monthIndex = MONTH_NAMES.indexOf(selectedMonth);
    if (monthIndex === -1) return 31;
    const yearCE = (parseInt(selectedYear, 10) || 2569) - 543;
    return new Date(yearCE, monthIndex + 1, 0).getDate();
  }, [selectedMonth, selectedYear]);

  // Current month number (1 - 12)
  const monthNumber = useMemo(() => {
    const idx = MONTH_NAMES.indexOf(selectedMonth);
    return idx >= 0 ? idx + 1 : 1;
  }, [selectedMonth]);

  // 2-digit Buddhist year (e.g. 2568 -> 68, 2569 -> 69)
  const yearShort = useMemo(() => {
    return String(selectedYear).slice(-2);
  }, [selectedYear]);

  // Daily records state: 31 days x 6 stations
  const [dailyRecords, setDailyRecords] = useState(() => {
    const initial = {};
    for (let day = 1; day <= 31; day++) {
      initial[day] = { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' };
    }
    return initial;
  });

  // Load from Supabase (with localStorage fallback) or initialize with zero/sample
  useEffect(() => {
    let isCancelled = false;

    if (typeof window !== 'undefined') {
      const key = `lizard_daily_${selectedYear}_${selectedMonth}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDailyRecords(parsed.records || {});
          setReporterName(parsed.reporter || '');
          setReviewerName(parsed.reviewer || '');
        } catch (e) {}
      } else {
        const init = {};
        for (let day = 1; day <= 31; day++) {
          init[day] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        }
        setDailyRecords(init);
      }
    }

    // Check Supabase via /api/pest-records
    fetch(`/api/pest-records?type=lizards&year=${selectedYear}&month=${selectedMonth}`)
      .then(res => res.json())
      .then(res => {
        if (!isCancelled && res.data && res.data.length > 0) {
          const rec = res.data[0];
          if (rec.daily_records && Object.keys(rec.daily_records).length > 0) {
            setDailyRecords(rec.daily_records);
          }
          if (rec.reporter_name) setReporterName(rec.reporter_name);
          if (rec.reviewer_name) setReviewerName(rec.reviewer_name);
        }
      })
      .catch(() => {});

    return () => { isCancelled = true; };
  }, [selectedMonth, selectedYear]);

  // Handle cell change
  const handleCellChange = (day, stationId, val) => {
    const parsed = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setDailyRecords(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [stationId]: parsed
      }
    }));
  };

  // Calculate station totals for current month
  const stationTotals = useMemo(() => {
    const totals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (let day = 1; day <= daysInMonth; day++) {
      const dayRow = dailyRecords[day] || {};
      for (let s = 1; s <= 6; s++) {
        totals[s] += Number(dayRow[s]) || 0;
      }
    }
    return totals;
  }, [dailyRecords, daysInMonth]);

  // Calculate day total
  const getDayTotal = (day) => {
    const row = dailyRecords[day] || {};
    let sum = 0;
    for (let s = 1; s <= 6; s++) {
      sum += Number(row[s]) || 0;
    }
    return sum;
  };

  // Monthly grand total
  const monthlyTotal = useMemo(() => {
    return Object.values(stationTotals).reduce((sum, v) => sum + v, 0);
  }, [stationTotals]);

  // Yearly data for chart
  const yearlyChartData = useMemo(() => {
    return GECKO_YEARLY_TREND_2569.map(item => {
      const sum = (Number(item['สถานี 1']) || 0) +
                  (Number(item['สถานี 2']) || 0) +
                  (Number(item['สถานี 3']) || 0) +
                  (Number(item['สถานี 4']) || 0) +
                  (Number(item['สถานี 5']) || 0) +
                  (Number(item['สถานี 6']) || 0);
      return {
        month: item['เดือน'],
        total: sum,
        station1: Number(item['สถานี 1']) || 0,
        station2: Number(item['สถานี 2']) || 0,
        station3: Number(item['สถานี 3']) || 0,
        station4: Number(item['สถานี 4']) || 0,
        station5: Number(item['สถานี 5']) || 0,
        station6: Number(item['สถานี 6']) || 0
      };
    });
  }, []);

  // Current month chart data (by station 1-6)
  const currentMonthStationData = useMemo(() => {
    return GECKO_STATIONS.map(st => {
      // Use entered data if any, or fallback to sample
      const count = stationTotals[st.id] !== undefined 
        ? stationTotals[st.id] 
        : (GECKO_MONTHLY_DATA_2569[selectedMonth]?.find(s => s.station === st.id)?.count || 0);
      return {
        name: st.name,
        count: count
      };
    });
  }, [stationTotals, selectedMonth]);

  // Quarterly comparison data
  const quarterlyData = useMemo(() => {
    const q1 = yearlyChartData.slice(0, 3).reduce((sum, r) => sum + r.total, 0);
    const q2 = yearlyChartData.slice(3, 6).reduce((sum, r) => sum + r.total, 0);
    const q3 = yearlyChartData.slice(6, 9).reduce((sum, r) => sum + r.total, 0);
    const q4 = yearlyChartData.slice(9, 12).reduce((sum, r) => sum + r.total, 0);
    return [
      { name: 'ไตรมาส 1 (ม.ค.-มี.ค.)', total: q1, color: '#3b82f6' },
      { name: 'ไตรมาส 2 (เม.ย.-มิ.ย.)', total: q2, color: '#10b981' },
      { name: 'ไตรมาส 3 (ก.ค.-ก.ย.)', total: q3, color: '#f59e0b' },
      { name: 'ไตรมาส 4 (ต.ค.-ธ.ค.)', total: q4, color: '#8b5cf6' }
    ];
  }, [yearlyChartData]);

  // Yearly grand total
  const yearlyGrandTotal = useMemo(() => {
    return yearlyChartData.reduce((sum, r) => sum + r.total, 0);
  }, [yearlyChartData]);

  // Lizard Analysis Narrative for Official Reports
  const lizardAnalysisText = useMemo(() => {
    let maxStation = '1';
    let maxCount = 0;
    Object.entries(stationTotals).forEach(([st, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        maxStation = st;
      }
    });

    if (monthlyTotal === 0) {
      return `จากผลการตรวจติดตามสถานีจิ้งจกทั้ง 6 สถานี ประจำเดือน ${selectedMonth} พ.ศ. ${selectedYear} ไม่พบจิ้งจกในทุกสถานีตรวจวัดตลอดทั้งเดือน (ยอดตรวจพบสะสม 0 ตัว) มาตรการควบคุมการป้องกันสัตว์รบกวนรอบอาคารมีประสิทธิภาพ อยู่ในเกณฑ์มาตรฐานความปลอดภัยทางชีวภาพ GMP/HACCP ของโรงงาน`;
    }
    return `จากผลการตรวจติดตามสถานีจิ้งจกทั้ง 6 สถานี ประจำเดือน ${selectedMonth} พ.ศ. ${selectedYear} ตรวจพบจิ้งจกรวมทั้งสิ้น ${monthlyTotal} ตัว โดยสถานีที่พบมากที่สุดคือ สถานีที่ ${maxStation} (พบสะสม ${maxCount} ตัว) และพบเฉลี่ยวันละ ${(monthlyTotal / daysInMonth).toFixed(1)} ตัว ฝ่ายควบคุมคุณภาพได้ประสานงานให้ตรวจสอบสุขาภิบาลรอบจุดตรวจดังกล่าว รวมถึงเร่งเปลี่ยนแผ่นกาวดักจับและตรวจเช็คการปิดซีลรอยต่อขอบประตู/หน้าต่างเพื่อป้องกันสัตว์เลื้อยคลานเข้าสู่พื้นที่การผลิต`;
  }, [monthlyTotal, stationTotals, selectedMonth, selectedYear, daysInMonth]);

  // Station detailed descriptions (verified from company QC format)
  const STATION_AREAS_DETAIL = {
    1: 'ประตูห้องเก็บรองเท้าบุรุษทางเข้า Slice เลื่อย',
    2: 'ประตูทางเข้าห้องแต่งตัวพนักงานทางเข้า Slice เลื่อย',
    3: 'ห้องแต่งตัวพนักงานทางเข้า Slice เลื่อย',
    4: 'ทางเข้าออฟฟิศคลัง 3',
    5: 'ตู้กดน้ำทางเข้าไลน์คลัง 3',
    6: 'บริเวณทางเข้าห้องหมูบด',
  };

  // Quarter selection state (1: ม.ค.-มี.ค., 2: เม.ย.-มิ.ย., 3: ก.ค.-ก.ย., 4: ต.ค.-ธ.ค.)
  const [selectedQuarter, setSelectedQuarter] = useState(3);
  const [previewPageIndex, setPreviewPageIndex] = useState(1); // 1, 2, 3

  // Sync quarter when selectedMonth changes
  useEffect(() => {
    const idx = MONTH_NAMES.indexOf(selectedMonth);
    if (idx >= 0) {
      setSelectedQuarter(Math.floor(idx / 3) + 1);
    }
  }, [selectedMonth]);

  const quarterLabels = {
    1: 'มกราคม-มีนาคม',
    2: 'เมษายน-มิถุนายน',
    3: 'กรกฎาคม-กันยายน',
    4: 'ตุลาคม-ธันวาคม'
  };
  const currentQuarterLabel = quarterLabels[selectedQuarter] || 'กรกฎาคม-กันยายน';

  // Quarter months data for the selected quarter
  const quarterMonthsData = useMemo(() => {
    const qStart = (selectedQuarter - 1) * 3;
    const qMonths = MONTH_NAMES.slice(qStart, qStart + 3);
    return qMonths.map(m => {
      const idx = MONTH_NAMES.indexOf(m);
      const shortName = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][idx];
      const item = GECKO_YEARLY_TREND_2569[idx] || {};
      return {
        month: shortName,
        fullMonth: m,
        station1: Number(item['สถานี 1']) || 0,
        station2: Number(item['สถานี 2']) || 0,
        station3: Number(item['สถานี 3']) || 0,
        station4: Number(item['สถานี 4']) || 0,
        station5: Number(item['สถานี 5']) || 0,
        station6: Number(item['สถานี 6']) || 0,
      };
    });
  }, [selectedQuarter]);

  // Months up to and including selected month (for overall trend chart - Image 2)
  const overallTrendData = useMemo(() => {
    const idx = MONTH_NAMES.indexOf(selectedMonth);
    const count = idx >= 0 ? idx + 1 : 7;
    return GECKO_YEARLY_TREND_2569.slice(0, count).map(item => ({
      month: item['เดือน'],
      station1: Number(item['สถานี 1']) || 0,
      station2: Number(item['สถานี 2']) || 0,
      station3: Number(item['สถานี 3']) || 0,
      station4: Number(item['สถานี 4']) || 0,
      station5: Number(item['สถานี 5']) || 0,
      station6: Number(item['สถานี 6']) || 0,
    }));
  }, [selectedMonth]);

  // Monthly summary text (exact pattern from Image 1)
  const monthlyReportSummaryText = useMemo(() => {
    const c1 = stationTotals[1] || 0;
    const c2 = stationTotals[2] || 0;
    const c3 = stationTotals[3] || 0;
    const c4 = stationTotals[4] || 0;
    const c5 = stationTotals[5] || 0;
    const c6 = stationTotals[6] || 0;

    const actionText = monthlyTotal > 0
      ? 'การที่พบจิ้งจกอาจเกิดจากบริเวณดังกล่าวเป็นทางเข้าไลน์ ที่มีการเข้า-ออกตลอดเวลา ดังนั้นควรเน้นการปิดประตูตลอดเวลาเพื่อป้องกันไม่ให้จิ้งจกเข้าไปในพื้นที่การผลิตได้'
      : 'ไม่พบจิ้งจกในทุกสถานีตรวจวัดตลอดทั้งเดือน มาตรการควบคุมการป้องกันสัตว์รบกวนรอบอาคารมีประสิทธิภาพ อยู่ในเกณฑ์มาตรฐานความปลอดภัยทางชีวภาพ GMP/HACCP ของโรงงาน';

    return `จากการตรวจนับจำนวนจิ้งจกในเดือน ${selectedMonth} ${selectedYear} พบว่า จำนวนจิ้งจกที่พบในสถานีที่ 1 ( ประตูห้องเก็บรองเท้าบุรุษทางเข้า Slice เลื่อย ) มีจำนวนเท่ากับ ${c1} ตัว สถานีที่ 2 (ประตูทางเข้าห้องแต่งตัวพนักงานทางเข้า Slice เลื่อย) มีจำนวนที่พบเท่ากับ ${c2} ตัว สถานีที่ 3 (ห้องแต่งตัวพนักงานทางเข้า Slice เลื่อย) มีจำนวนเท่ากับ ${c3} ตัว สถานีที่ 4 (ทางเข้าออฟฟิศคลัง 3) มีจำนวนที่พบเท่ากับ ${c4} ตัว สถานีที่ 5 (ตู้กดน้ำทางเข้าไลน์คลัง 3) มีจำนวนที่พบเท่ากับ ${c5} ตัว และสถานีที่ 6 (บริเวณทางเข้าห้องหมูบด) มีจำนวนที่พบเท่ากับ ${c6} ตัว ${actionText}`;
  }, [stationTotals, monthlyTotal, selectedMonth, selectedYear]);

  // Overall trend summary text (exact pattern from Image 2)
  const overallTrendSummaryText = useMemo(() => {
    const c1 = stationTotals[1] || 0;
    const c2 = stationTotals[2] || 0;
    const c3 = stationTotals[3] || 0;
    const c4 = stationTotals[4] || 0;
    const c5 = stationTotals[5] || 0;
    const c6 = stationTotals[6] || 0;

    return `จากกราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก ประจำเดือน ${selectedMonth} ${selectedYear} พบว่า จำนวนของจิ้งจกที่พบในสถานีที่ 1 มีจำนวนเท่ากับ ${c1} ตัว จำนวนของจิ้งจกที่พบในสถานีที่ 2 มีจำนวนเท่ากับ ${c2} ตัว ส่วนจำนวนของจิ้งจกที่พบในสถานีที่ 3 มีจำนวนเท่ากับ ${c3} ตัว จำนวนของจิ้งจกที่พบในสถานีที่ 4 มีจำนวนเท่ากับ ${c4} ตัว จำนวนของจิ้งจกที่พบในสถานีที่ 5 มีจำนวนเท่ากับ ${c5} ตัว และจำนวนของจิ้งจกที่พบในสถานีที่ 6 มีจำนวนเท่ากับ ${c6} ตัว ดังนั้นควรที่จะเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่การผลิต การปิดม่านประตู การทำความสะอาดพื้นที่การผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ`;
  }, [stationTotals, selectedMonth, selectedYear]);

  // Generate per-station quarterly text (exact pattern from Images 3, 4, 5)
  const generateStationQuarterlyText = (stId, qData) => {
    const area = STATION_AREAS_DETAIL[stId] || `สถานีที่ ${stId}`;
    const key = `station${stId}`;
    const counts = qData.map(d => d[key]);
    const total = counts.reduce((a, b) => a + b, 0);
    const stNo = String(stId).padStart(2, '0');
    const mNames = qData.map(d => d.fullMonth || d.month);

    if (total === 0) {
      if (stId === 1) {
        return `จากกราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก หมายเลข ${stNo} ( ${area} ) ประจำเดือน ${currentQuarterLabel} ${selectedYear} ไม่พบจิ้งจกเลยควรเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่การผลิต การปิดม่านประตู การทำความสะอาดพื้นที่การผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ เพื่อรักษาแนวโน้มที่ไม่พบจิ้งจกเลยเอาไว้`;
      }
      if (stId === 2) {
        return `จากกราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก หมายเลข ${stNo} (${area}) ประจำเดือน ${currentQuarterLabel} ${selectedYear} พบว่า ไม่พบจิ้งจกในสถานีจิ้งจกเลยทั้ง 3 เดือน ควรเน้นให้มีการปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่การผลิต การปิดม่านประตู การทำความสะอาดพื้นที่การผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ เพื่อรักษาแนวโน้มที่ไม่พบจิ้งจกเลยเอาไว้`;
      }
      if (stId === 3) {
        return `จากกราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก หมายเลข ${stNo} (${area}) ประจำเดือน ${currentQuarterLabel} ${selectedYear} พบว่า ไม่พบจิ้งจกในสถานีจิ้งจกเลยทั้ง 3 เดือน ดังนั้นควรให้ปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่การผลิต ปิดม่านประตู ควรทำความสะอาดพื้นที่ผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ เพื่อรักษาแนวโน้มที่ไม่พบจิ้งจกเลยเอาไว้`;
      }
      return `จากกราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก หมายเลข ${stNo} (${area}) ประจำเดือน ${currentQuarterLabel} ${selectedYear} ไม่พบจิ้งจกในสถานีจิ้งจกเลยทั้ง 3 เดือน ดังนั้นควรให้ปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่การผลิต ปิดม่านประตู การทำความสะอาดพื้นที่ผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ เพื่อลดและป้องกันแมลงต่างๆ เพื่อรักษาแนวโน้มที่ไม่พบจิ้งจกเลยเอาไว้`;
    }

    // Detected lizard counts
    let countDetail = '';
    if (counts[0] === counts[1] && counts[2] !== counts[0]) {
      countDetail = `มีจำนวนเท่ากับ ${counts[0]} ตัว ในเดือน${mNames[0]}และ${mNames[1]} และ${counts[2] > counts[1] ? 'เพิ่มเป็น' : 'ลดลงเป็น'} ${counts[2]} ตัว ในเดือน${mNames[2]}`;
    } else if (counts[1] === counts[2] && counts[0] !== counts[1]) {
      countDetail = `มีจำนวนเท่ากับ ${counts[0]} ตัว ในเดือน${mNames[0]} และ ${counts[1]} ตัว ในเดือน${mNames[1]}และ${mNames[2]}`;
    } else if (counts[0] === counts[1] && counts[1] === counts[2]) {
      countDetail = `มีจำนวนเท่ากับ ${counts[0]} ตัว สม่ำเสมอตลอดทั้ง 3 เดือน`;
    } else {
      countDetail = `มีจำนวนเท่ากับ ${counts[0]} ตัว ในเดือน${mNames[0]}, ${counts[1]} ตัว ในเดือน${mNames[1]} และ ${counts[2]} ตัว ในเดือน${mNames[2]}`;
    }

    return `จากกราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก หมายเลข ${stNo} (${area}) ประจำเดือน ${currentQuarterLabel} ${selectedYear} พบว่า จำนวนของจิ้งจกที่พบ${countDetail} ดังนั้นควรให้ปฏิบัติตามสุขลักษณะในการปฏิบัติงานอย่างต่อเนื่อง เช่น การไม่นำอาหารเข้าไปในพื้นที่การผลิต ปิดม่านประตู การทำความสะอาดพื้นที่ผลิตและบริเวณรอบอาคารให้สะอาดอยู่เสมอ เพื่อลดและป้องกันสัตว์พาหะต่างๆ ให้มีจำนวนที่ลดลงได้`;
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

  // ── PAGE 1: Monthly bar chart report (ภาพที่ 1 รายงานประจำเดือน) ──
  const renderLizardMonthlyPrintPage = () => {
    const barData = [1,2,3,4,5,6].map(s => ({
      name: String(s),
      count: stationTotals[s] || 0
    }));

    return (
      <div
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always', breakAfter: 'page',
          width: '297mm', height: '210mm', maxHeight: '210mm',
          display: 'flex', flexDirection: 'column',
          padding: '10mm 14mm 10mm 14mm',
          boxSizing: 'border-box', backgroundColor: 'white', color: 'black'
        }}
      >
        <div>
          {/* Header */}
          <div style={{ fontSize: '12px', color: '#111', marginBottom: '12px' }}>
            บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
          </div>

          {/* Chart Outer Box */}
          <div style={{ border: '1px solid #777', padding: '22px 14px 10px 14px', marginBottom: '10px', backgroundColor: '#fff' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111', letterSpacing: '0.2px' }}>
                กราฟแสดงรายงานการตรวจนับจำนวนจิ้งจก ประจำเดือน {selectedMonth} {selectedYear}
              </h2>
            </div>

            {/* Bar Chart - Expanded Height & Generous Top Spacing */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <BarChart
                width={920}
                height={415}
                data={barData}
                margin={{ top: 50, right: 80, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#333"
                  fontSize={12}
                  tickLine={false}
                  label={{ value: 'สถานีจิ้งจก', position: 'insideBottom', offset: -12, fontSize: 12, fontWeight: 'bold' }}
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
                  name="จิ้งจก"
                  fill="#2b7a94"
                  isAnimationActive={false}
                  barSize={44}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    content={({ x, y, width, value }) => (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={Number(value) === 0 ? Number(y) - 6 : Number(y) - 8}
                        fill="#2b7a94"
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
            {monthlyReportSummaryText}
          </div>
        </div>

        {/* Balanced Signature */}
        <PrintSignature />
      </div>
    );
  };

  // ── PAGE 2: Overall trend (ภาพที่ 2 แนวโน้มโดยรวมอัพเดททุกเดือน) ──
  const renderLizardOverallTrendPrintPage = () => {
    const STATION_CONFIG = [
      { key: 'station1', name: 'สถานี 1', color: '#1f4e79', dot: 'square' },
      { key: 'station2', name: 'สถานี 2', color: '#c00000', dot: 'square' },
      { key: 'station3', name: 'สถานี 3', color: '#70ad47', dot: 'triangle' },
      { key: 'station4', name: 'สถานี 4', color: '#7030a0', dot: 'cross' },
      { key: 'station5', name: 'สถานี 5', color: '#00b0f0', dot: 'cross' },
      { key: 'station6', name: 'สถานี 6', color: '#ed7d31', dot: 'circle' }
    ];

    return (
      <div
        className="print-page font-niramit"
        style={{
          pageBreakAfter: 'always', breakAfter: 'page',
          width: '297mm', height: '210mm', maxHeight: '210mm',
          display: 'flex', flexDirection: 'column',
          padding: '10mm 14mm 10mm 14mm',
          boxSizing: 'border-box', backgroundColor: 'white', color: 'black'
        }}
      >
        <div>
          {/* Header */}
          <div style={{ fontSize: '12px', color: '#111', marginBottom: '12px' }}>
            บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
          </div>

          {/* Chart Outer Box */}
          <div style={{ border: '1px solid #777', padding: '22px 14px 10px 14px', marginBottom: '10px', backgroundColor: '#fff' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#111', letterSpacing: '0.2px' }}>
                กราฟแสดงแนวโน้มจำนวนจิ้งจกที่พบในสถานีจิ้งจก ประจำเดือน {selectedMonth} {selectedYear}
              </h2>
            </div>

            {/* Line Chart - Expanded Height & Generous Top Spacing */}
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
                  wrapperStyle={{ right: 5, border: '1px solid #777', padding: '6px 12px', fontSize: '11.5px', lineHeight: '1.9' }}
                />
                {STATION_CONFIG.map((st) => (
                  <Line
                    key={st.key}
                    type="linear"
                    dataKey={st.key}
                    name={st.name}
                    stroke={st.color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: st.color }}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey={st.key}
                      position="top"
                      content={({ x, y, value }) => {
                        if (value === undefined || value === null) return null;
                        return (
                          <text
                            x={x}
                            y={Number(y) - 6}
                            fill={st.color}
                            textAnchor="middle"
                            fontSize={10.5}
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

  // ── PAGES 3-5: Quarterly per-station (ภาพที่ 3-5 แนวโน้มรายไตรมาส ภาพละ 2 สถานี แบ่ง 4 ช่องชัดเจน) ──
  const renderLizardQuarterlyPrintPages = () => {
    const stationPairs = [[1, 2], [3, 4], [5, 6]];

    return stationPairs.map(([stA, stB], pageIdx) => {
      const stKeyA = `station${stA}`;
      const stKeyB = `station${stB}`;
      const stDataA = quarterMonthsData.map(d => ({ month: d.month, count: d[stKeyA] }));
      const stDataB = quarterMonthsData.map(d => ({ month: d.month, count: d[stKeyB] }));
      const stTextA = generateStationQuarterlyText(stA, quarterMonthsData);
      const stTextB = generateStationQuarterlyText(stB, quarterMonthsData);
      const stNoA = String(stA).padStart(2, '0');
      const stNoB = String(stB).padStart(2, '0');

      return (
        <div
          key={pageIdx}
          className="print-page font-niramit"
          style={{
            pageBreakAfter: pageIdx < 2 ? 'always' : 'avoid',
            breakAfter: pageIdx < 2 ? 'page' : 'avoid',
            width: '297mm', height: '210mm', maxHeight: '210mm',
            display: 'flex', flexDirection: 'column',
            padding: '11mm 12mm 11mm 12mm',
            boxSizing: 'border-box', backgroundColor: 'white', color: 'black'
          }}
        >
          <div>
            {/* Header */}
            <div style={{ fontSize: '12px', color: '#111', marginBottom: '12px' }}>
              บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
            </div>

            {/* ── 4 ช่องชัดเจน (2x2 Grid) ── */}
            {/* Row 1: Top 2 Graph Boxes - Expanded Height */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              {/* Box 1 (Top Left): Graph for Station A */}
              <div style={{ border: '1px solid #777', padding: '18px 10px 8px 10px', backgroundColor: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: '26px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '0.2px' }}>
                    กราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', lineHeight: '1.5', marginTop: '8px', letterSpacing: '0.2px' }}>
                    หมายเลข {stNoA} เดือน {currentQuarterLabel} {selectedYear}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <LineChart
                    width={440}
                    height={300}
                    data={stDataA}
                    margin={{ top: 45, right: 75, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#333" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#333"
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      label={{ value: 'จำนวนจิ้งจก (ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ right: 2, border: '1px solid #333', padding: '2px 8px', fontSize: '11px' }}
                    />
                    <Line
                      type="linear"
                      dataKey="count"
                      name="จิ้งจก"
                      stroke="#2e75b6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#2e75b6', shape: 'square' }}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        content={({ x, y, value }) => (
                          <text
                            x={x}
                            y={Number(y) - 6}
                            fill="#333"
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight="bold"
                          >
                            {value}
                          </text>
                        )}
                      />
                    </Line>
                  </LineChart>
                </div>
              </div>

              {/* Box 2 (Top Right): Graph for Station B */}
              <div style={{ border: '1px solid #777', padding: '18px 10px 8px 10px', backgroundColor: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: '26px' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '0.2px' }}>
                    กราฟแสดงแนวโน้มจำนวนจิ้งจกของสถานีจิ้งจก
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', lineHeight: '1.5', marginTop: '8px', letterSpacing: '0.2px' }}>
                    หมายเลข {stNoB} เดือน {currentQuarterLabel} {selectedYear}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <LineChart
                    width={440}
                    height={300}
                    data={stDataB}
                    margin={{ top: 45, right: 75, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#333" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#333"
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, 5]}
                      ticks={[0, 1, 2, 3, 4, 5]}
                      label={{ value: 'จำนวนจิ้งจก (ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ right: 2, border: '1px solid #333', padding: '2px 8px', fontSize: '11px' }}
                    />
                    <Line
                      type="linear"
                      dataKey="count"
                      name="จิ้งจก"
                      stroke="#2e75b6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#2e75b6', shape: 'square' }}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        content={({ x, y, value }) => (
                          <text
                            x={x}
                            y={Number(y) - 6}
                            fill="#333"
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight="bold"
                          >
                            {value}
                          </text>
                        )}
                      />
                    </Line>
                  </LineChart>
                </div>
              </div>
            </div>

            {/* Row 2: Bottom 2 Text Summary Boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
              {/* Box 3 (Bottom Left): Summary Text for Station A */}
              <div style={{ border: '1px solid #777', padding: '11px 14px', fontSize: '11.5px', lineHeight: '1.65', minHeight: '120px', color: '#111' }}>
                {stTextA}
              </div>

              {/* Box 4 (Bottom Right): Summary Text for Station B */}
              <div style={{ border: '1px solid #777', padding: '11px 14px', fontSize: '11.5px', lineHeight: '1.65', minHeight: '120px', color: '#111' }}>
                {stTextB}
              </div>
            </div>
          </div>

          {/* Balanced Signature */}
          <PrintSignature />
        </div>
      );
    });
  };



  const handleSave = async () => {
    if (typeof window !== 'undefined') {
      const key = `lizard_daily_${selectedYear}_${selectedMonth}`;
      const payload = {
        records: dailyRecords,
        reporter: reporterName,
        reviewer: reviewerName,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(payload));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);

      // Async sync compact totals to Supabase
      try {
        await fetch('/api/pest-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'lizards',
            year: selectedYear,
            month: selectedMonth,
            totals: stationTotals,
            daily_records: dailyRecords,
            reporter: reporterName,
            reviewer: reviewerName
          })
        });
      } catch (e) {
        console.warn('Sync lizards to Supabase skipped:', e);
      }
    }
  };

  // Reset handler
  const handleReset = () => {
    if (confirm('ต้องการล้างข้อมูลและเริ่มกรอกใหม่ใช่หรือไม่?')) {
      const init = {};
      for (let day = 1; day <= 31; day++) {
        init[day] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      }
      setDailyRecords(init);
    }
  };


  return (

    <main className="min-h-screen bg-[#F4F7FC] text-slate-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="screen-content max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Switcher between all 5 pest forms */}
        <FormNav activeFormId="lizards" />

        {/* Header Hero */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-100">
                <span>🦎 FM-QC-08/04 Rev.02</span>
                <span>•</span>
                <span>มาตรฐานตรวจสอบความปลอดภัยโรงงานอาหาร</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                รายงานการตรวจนับจำนวนจิ้งจก
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl font-medium">
                บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด — ตรวจติดตามจุดดักจับจิ้งจก 6 สถานี รายวัน พร้อมรายงานแนวโน้มรายเดือนและรายไตรมาส
              </p>
            </div>

            {/* View Mode Tabs */}
            <div className="flex bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start md:self-center">
              <button
                onClick={() => setActiveTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'chart'
                    ? 'bg-white text-emerald-800 shadow-sm'
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
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>บันทึกผลตรวจรายวัน</span>
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'print'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์แบบฟอร์ม</span>
              </button>
            </div>
          </div>
        </div>

        {/* Month Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">เลือกช่วงเวลา:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
            >
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200"
            >
              <option value="2569">ปี 2569 (2026)</option>
              <option value="2568">ปี 2568 (2025)</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ยอดตรวจพบเดือน {selectedMonth}: {monthlyTotal} ตัว
            </span>
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
                <p className="text-[10px] text-slate-500 mt-1">ทั้ง 6 สถานีจิ้งจก</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">สถานีที่พบมากที่สุด</p>
                <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  สถานี 4
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">พบสะสม 8 ตัว (80% ของทั้งหมด)</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">เดือนที่พบสูงสุด</p>
                <h3 className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  มีนาคม
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">ตรวจพบ 4 ตัว ในสถานี 4</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400">สถานะการควบคุม</p>
                <div className="flex items-center gap-1.5 mt-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm sm:text-base">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>อยู่ในเกณฑ์ปกติ</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">ต่ำกว่าเกณฑ์ความเสี่ยง</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Current Month by Station */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      จำนวนจิ้งจกแยกตามสถานี 1-6
                    </h3>
                    <p className="text-xs text-slate-400">ประจำเดือน {selectedMonth} {selectedYear}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                    รวม {monthlyTotal} ตัว
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentMonthStationData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} domain={[0, 'dataMax + 2']} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val) => [`${val} ตัว`, 'จำนวนจิ้งจก']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="count" name="จำนวนที่พบ" fill="#10b981" radius={[8, 8, 0, 0]}>
                          {currentMonthStationData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.count > 0 ? '#10b981' : '#94a3b8'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Quarterly Comparison */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      เปรียบเทียบแนวโน้มรายไตรมาส
                    </h3>
                    <p className="text-xs text-slate-400">ปี {selectedYear} (Q1 - Q4)</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
                    สะสม {yearlyGrandTotal} ตัว
                  </span>
                </div>
                <div className="h-64 sm:h-72 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quarterlyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val) => [`${val} ตัว`, 'ยอดสะสมไตรมาส']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Bar dataKey="total" name="จำนวนจิ้งจก" radius={[8, 8, 0, 0]}>
                          {quarterlyData.map((entry, index) => (
                            <Cell key={`q-cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 3: Full Year Trend Line */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      แนวโน้มสถิติจิ้งจกรายเดือนตลอดทั้งปี {selectedYear}
                    </h3>
                    <p className="text-xs text-slate-400">เปรียบเทียบยอดรวมตรวจพบในแต่ละเดือน (ม.ค. - ธ.ค.)</p>
                  </div>
                </div>
                <div className="h-72 sm:h-80 w-full">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} domain={[0, 'dataMax + 2']} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(val) => [`${val} ตัว`, 'ยอดตรวจพบ']}
                          contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          name="ยอดรวมทุกสถานี" 
                          stroke="#10b981" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#10b981' }} 
                          activeDot={{ r: 6 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="station4" 
                          name="สถานีที่ 4 (จุดที่พบมากสุด)" 
                          stroke="#f59e0b" 
                          strokeWidth={2} 
                          strokeDasharray="4 4" 
                          dot={{ r: 3 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── TAB 2: DAILY ENTRY FORM (ถอดแบบจากเอกสารสแกน 20260928092056408_0002.jpg) ─── */}
        {activeTab === 'entry' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  บันทึกข้อมูลรายวัน (Daily Entry Sheet)
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ตารางตรวจนับจำนวนจิ้งจกประจำเดือน {selectedMonth} {selectedYear}
                </h3>
                <p className="text-xs text-slate-400">
                  กรอกจำนวนจิ้งจกที่พบในแต่ละวัน (วันที่ 1 ถึง {daysInMonth}) แยกตามสถานีที่ 1 ถึง 6
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ต</span>
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>บันทึกข้อมูล</span>
                </button>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>บันทึกข้อมูลผลการตรวจนับจิ้งจกเรียบร้อยแล้ว!</span>
              </div>
            )}

            {/* Official Table Grid (ถอดแบบจากเอกสารสแกน 20260928092056408_0002.jpg) */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <th rowSpan="2" className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-700 w-24">
                      วัน/เดือน/ปี<br/>ที่ตรวจนับ
                    </th>
                    <th colSpan="6" className="py-2 px-3 border-b border-slate-200 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                      สถานีจิ้งจก
                    </th>
                    <th rowSpan="2" className="py-2.5 px-3 border-l border-slate-200 dark:border-slate-700 w-20 bg-slate-50 dark:bg-slate-850">
                      รวม (ตัว)
                    </th>
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <th className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 w-16">1</th>
                    <th className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 w-16">2</th>
                    <th className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 w-16">3</th>
                    <th className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 w-16">4</th>
                    <th className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 w-16">5</th>
                    <th className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-700 w-16">6</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const rowTotal = getDayTotal(day);
                    const dayFormatted = `${day}/${monthNumber}/${yearShort}`;
                    return (
                      <tr 
                        key={day}
                        className={`hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-colors ${
                          day % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-950/30'
                        }`}
                      >
                        <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-500 font-bold">
                          {dayFormatted}
                        </td>
                        {[1, 2, 3, 4, 5, 6].map(stId => {
                          const val = dailyRecords[day]?.[stId] ?? '';
                          return (
                            <td key={stId} className="p-0.5 border-r border-slate-200 dark:border-slate-800">
                              <input
                                type="number"
                                min="0"
                                value={val}
                                onChange={(e) => handleCellChange(day, stId, e.target.value)}
                                className={`w-full py-1 text-center font-mono font-bold text-xs bg-transparent focus:bg-emerald-50 dark:focus:bg-emerald-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded ${
                                  Number(val) > 0 ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'text-slate-400'
                                }`}
                                placeholder="0"
                              />
                            </td>
                          );
                        })}
                        <td className="py-1 px-2 border-l border-slate-200 dark:border-slate-800 font-mono font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/50">
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-black border-t-2 border-emerald-500 text-xs">
                    <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-700 text-right">
                      ยอดรวมทั้งเดือน
                    </td>
                    {[1, 2, 3, 4, 5, 6].map(stId => (
                      <td key={stId} className="py-2 px-2 border-r border-slate-200 dark:border-slate-700 font-mono text-sm">
                        {stationTotals[stId]}
                      </td>
                    ))}
                    <td className="py-2 px-3 border-l border-slate-200 dark:border-slate-700 font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {monthlyTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Reporter & Reviewer Signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  ผู้รายงาน (Reporter):
                </label>
                <input
                  type="text"
                  placeholder="ลงชื่อผู้รายงานตรวจนับ..."
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  ผู้ทวนสอบ (Reviewer / QA Supervisor):
                </label>
                <input
                  type="text"
                  placeholder="ลงชื่อผู้ทวนสอบการตรวจนับ..."
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB 3: OFFICIAL PRINT VIEW (Executive Landscape A4 Report) ─── */}
        {activeTab === 'print' && (
          <div className="space-y-6">
            
            {/* Top Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm no-print">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  🖨️ รูปแบบรายงานจิ้งจก (A4 แนวนอน):
                </span>
                
                {/* Quarter selector for quarterly reports */}
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-500 font-medium">ไตรมาส:</span>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value={1}>ไตรมาส 1 (ม.ค. - มี.ค.)</option>
                    <option value={2}>ไตรมาส 2 (เม.ย. - มิ.ย.)</option>
                    <option value={3}>ไตรมาส 3 (ก.ค. - ก.ย.)</option>
                    <option value={4}>ไตรมาส 4 (ต.ค. - ธ.ค.)</option>
                  </select>
                </div>
              </div>

              {/* Print Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePrint('monthly')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="ภาพที่ 1: รายงานการตรวจนับประจำเดือน"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-400" />
                  <span>ภาพที่ 1: รายงานประจำเดือน</span>
                </button>

                <button
                  onClick={() => handlePrint('overall')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="ภาพที่ 2: แนวโน้มโดยรวมอัพเดททุกเดือน"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-200" />
                  <span>ภาพที่ 2: แนวโน้มโดยรวม</span>
                </button>

                <button
                  onClick={() => handlePrint('quarterly')}
                  className="px-3.5 py-2 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  title="ภาพที่ 3-5: แนวโน้มรายไตรมาส (3 หน้า ภาพละ 2 สถานี แบ่ง 4 ช่อง)"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-200" />
                  <span>ภาพที่ 3–5: แนวโน้มรายไตรมาส (3 หน้า)</span>
                </button>

                <button
                  onClick={() => handlePrint('all')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  title="พิมพ์รายงานทั้งชุดครบ 5 หน้า"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-200" />
                  <span>พิมพ์ทั้งหมด (5 หน้า)</span>
                </button>
              </div>
            </div>

            {/* Screen Preview Navigator */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm no-print space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <span>📑 ตัวอย่างก่อนพิมพ์</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      เดือน {selectedMonth} {selectedYear} · ไตรมาส: {currentQuarterLabel}
                    </span>
                  </h2>
                </div>

                {/* Preview Tab Buttons */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
                  <button
                    onClick={() => setPreviewPageIndex(1)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewPageIndex === 1
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    ภาพที่ 1: รายงานเดือน
                  </button>
                  <button
                    onClick={() => setPreviewPageIndex(2)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewPageIndex === 2
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    ภาพที่ 2: แนวโน้มรวม
                  </button>
                  <button
                    onClick={() => setPreviewPageIndex(3)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewPageIndex === 3
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    ภาพที่ 3–5: รายไตรมาส (4 ช่อง)
                  </button>
                </div>
              </div>

              {/* ── PREVIEW 1: Monthly Report ── */}
              {previewPageIndex === 1 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                      บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
                    </div>
                    <div className="text-center font-bold text-sm text-slate-800 dark:text-white mb-4">
                      กราฟแสดงรายงานการตรวจนับจำนวนจิ้งจก ประจำเดือน {selectedMonth} {selectedYear}
                    </div>
                    <div className="h-64 w-full">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[1,2,3,4,5,6].map(s => ({ name: String(s), count: stationTotals[s] || 0 }))} margin={{ top: 25, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" label={{ value: 'สถานีจิ้งจก', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                            <YAxis allowDecimals={false} domain={[0, 5]} ticks={[0,1,2,3,4,5]} label={{ value: 'จำนวน(ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }} />
                            <Bar dataKey="count" name="จิ้งจก" fill="#2b7a94" barSize={36}>
                              <LabelList dataKey="count" position="top" style={{ fill: '#2b7a94', fontSize: 11, fontWeight: 'bold' }} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {monthlyReportSummaryText}
                  </div>
                </div>
              )}

              {/* ── PREVIEW 2: Overall Trend ── */}
              {previewPageIndex === 2 && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                      บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
                    </div>
                    <div className="text-center font-bold text-sm text-slate-800 dark:text-white mb-4">
                      กราฟแสดงแนวโน้มจำนวนจิ้งจกที่พบในสถานีจิ้งจก ประจำเดือน {selectedMonth} {selectedYear}
                    </div>
                    <div className="h-64 w-full">
                      {mounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={overallTrendData} margin={{ top: 25, right: 30, left: -10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="month" fontSize={11} />
                            <YAxis allowDecimals={false} domain={[0, 5]} ticks={[0,1,2,3,4,5]} label={{ value: 'จำนวนที่พบ (ตัว)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                            <Line type="linear" dataKey="station1" name="สถานี 1" stroke="#1f4e79" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="linear" dataKey="station2" name="สถานี 2" stroke="#c00000" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="linear" dataKey="station3" name="สถานี 3" stroke="#70ad47" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="linear" dataKey="station4" name="สถานี 4" stroke="#7030a0" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="linear" dataKey="station5" name="สถานี 5" stroke="#00b0f0" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="linear" dataKey="station6" name="สถานี 6" stroke="#ed7d31" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {overallTrendSummaryText}
                  </div>
                </div>
              )}

              {/* ── PREVIEW 3: Quarterly 4-Box Format ── */}
              {previewPageIndex === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-2xl text-xs text-cyan-800 dark:text-cyan-300 font-bold flex items-center justify-between">
                    <span>🦎 รายงานรายไตรมาส ({currentQuarterLabel} {selectedYear}) — แบ่ง 4 ช่องชัดเจน (ภาพละ 2 สถานี รวม 3 หน้า)</span>
                    <button
                      onClick={() => handlePrint('quarterly')}
                      className="px-3 py-1 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>พิมพ์ 3 หน้านี้</span>
                    </button>
                  </div>

                  {/* 3 Pages Preview Cards */}
                  {[
                    { pair: [1, 2], page: '3 (สถานี 01 & 02)' },
                    { pair: [3, 4], page: '4 (สถานี 03 & 04)' },
                    { pair: [5, 6], page: '5 (สถานี 05 & 06)' }
                  ].map(({ pair, page }, pIdx) => {
                    const [stA, stB] = pair;
                    const stNoA = String(stA).padStart(2, '0');
                    const stNoB = String(stB).padStart(2, '0');
                    const textA = generateStationQuarterlyText(stA, quarterMonthsData);
                    const textB = generateStationQuarterlyText(stB, quarterMonthsData);
                    const dataA = quarterMonthsData.map(d => ({ month: d.month, count: d[`station${stA}`] }));
                    const dataB = quarterMonthsData.map(d => ({ month: d.month, count: d[`station${stB}`] }));

                    return (
                      <div key={pIdx} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          <span>📄 ภาพที่ {page}</span>
                          <span className="text-[11px] text-slate-400">แบ่ง 4 ช่องชัดเจน (บน 2 กราฟ · ล่าง 2 บทสรุป)</span>
                        </div>

                        {/* Row 1: 2 Graph Boxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-center">
                            <div className="text-xs font-bold text-slate-800 dark:text-white mb-3">
                              กราฟแนวโน้มสถานี {stNoA} ({currentQuarterLabel})
                            </div>
                            <div className="h-44 w-full">
                              {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={dataA} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="month" fontSize={10} />
                                    <YAxis allowDecimals={false} domain={[0, 5]} ticks={[0,1,2,3,4,5]} fontSize={10} />
                                    <Line type="linear" dataKey="count" name="จิ้งจก" stroke="#2e75b6" strokeWidth={2} dot={{ r: 3 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </div>

                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-center">
                            <div className="text-xs font-bold text-slate-800 dark:text-white mb-3">
                              กราฟแนวโน้มสถานี {stNoB} ({currentQuarterLabel})
                            </div>
                            <div className="h-44 w-full">
                              {mounted && (
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={dataB} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                    <XAxis dataKey="month" fontSize={10} />
                                    <YAxis allowDecimals={false} domain={[0, 5]} ticks={[0,1,2,3,4,5]} fontSize={10} />
                                    <Line type="linear" dataKey="count" name="จิ้งจก" stroke="#2e75b6" strokeWidth={2} dot={{ r: 3 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Row 2: 2 Summary Text Boxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                            {textA}
                          </div>
                          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-[11.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                            {textB}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Signatures Preview */}
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

      {/* Printable reports layout (Landscape A4) */}
      {printJob !== 'none' && (
        <div className="print-layout">
          {(printJob === 'monthly' || printJob === 'all') && renderLizardMonthlyPrintPage()}
          {(printJob === 'overall' || printJob === 'all') && renderLizardOverallTrendPrintPage()}
          {(printJob === 'quarterly' || printJob === 'all') && renderLizardQuarterlyPrintPages()}
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
