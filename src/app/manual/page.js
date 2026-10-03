'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen, Search, ShieldCheck, CheckCircle2, AlertTriangle,
  Users, BarChart3, ClipboardCheck, Sparkles, FileText,
  Printer, ArrowRight, ChevronDown, ChevronUp, Layers,
  HelpCircle, Settings, Key, AlertCircle, Download,
  ExternalLink, Check, Info, ShieldAlert, Cpu
} from 'lucide-react';
import FormNav from '@/components/FormNav';

// Department & Traps configuration for reference table
const DEPT_TRAPS_MAPPING = {
  'หน้าร้านใหม่': {
    color: 'from-amber-500 to-yellow-500',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-850',
    traps: [
      { id: '07', name: '(07) ลานโหลดสินค้าหน้าร้าน', note: 'พื้นที่เชื่อมต่อภายนอก ลานขนถ่ายสินค้า' }
    ]
  },
  'โรงฆ่า': {
    color: 'from-red-500 to-orange-500',
    badge: 'bg-orange-100 text-orange-850 dark:bg-orange-900/35 dark:text-orange-350 border-orange-200/50 dark:border-orange-900/60',
    traps: [
      { id: '08', name: '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน', note: 'ทางเดินลำเลียงซากและผลิตภัณฑ์' },
      { id: '09', name: '(09) ทางเข้าผ่าซาก/เครื่องในแดง/เครื่องในขาว', note: 'จุดเชื่อมต่อสายการผลิตเครื่องใน' },
      { id: '10', name: '(10) ลานโหลดสินค้าห้องเลือด', note: 'พื้นที่รับ-ส่งเลือดและของเสีย' },
      { id: '11', name: '(11) ห้องเลือด', note: 'พื้นที่เก็บและแปรรูปเลือด' },
      { id: '12', name: '(12) ห้องช็อต/แทงคอ/ลวกซาก', note: 'พื้นที่รับสัตว์และกระบวนการเริ่มต้น' },
      { id: '30', name: '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน', note: 'พื้นที่ทำความสะอาดและบรรจุเครื่องใน' }
    ]
  },
  'ตัดแต่ง': {
    color: 'from-lime-500 to-green-600',
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300 border-lime-200 dark:border-lime-900',
    traps: [
      { id: '03', name: '(03) ห้องตัดแต่ง บริเวณทางหนีไฟ', note: 'ทางออกฉุกเฉินและพื้นที่ด้านข้าง' },
      { id: '04', name: '(04) ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น', note: 'ใกล้ระบบชิลเลอร์และควบคุมอุณหภูมิ' },
      { id: '05', name: '(05) ห้องตัดแต่ง บริเวณเลนมันและหนัง', note: 'สายการตัดแต่งมันและแยกหนัง' },
      { id: '31', name: '(31) ห้องล้างมัน/คัดแยกเศษ', note: 'พื้นที่ล้างเศษเนื้อและคัดแยกไขมัน' }
    ]
  },
  'โหลด เฟส 5': {
    color: 'from-amber-600 to-yellow-600',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-350 border-amber-200 dark:border-amber-900',
    traps: [
      { id: '01', name: '(01) ลานโหลดของตัดแต่งและ Makro', note: 'ประตูโหลดสินค้าตัดแต่งส่งลูกค้า Makro' },
      { id: '02', name: '(02) ทางขนย้ายสินค้าเข้า - ออกตัดแต่ง', note: 'จุดผ่านการลำเลียงวัตถุดิบเข้าห้องตัดแต่ง' },
      { id: '06', name: '(06) ลานโหลดของตัดแต่งและ Makro', note: 'จุดกระจายสินค้าและเทียบรถขนส่ง' }
    ]
  },
  'เฟส 6': {
    color: 'from-orange-500 to-amber-500',
    badge: 'bg-orange-100/80 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300/40',
    traps: [
      { id: '13', name: '(13) ห้อง Pack A บริเวณหน้าประตูทางเชื่อมอาคาร', note: 'จุดเชื่อมต่อทางเดินระหว่างอาคาร' },
      { id: '14', name: '(14) ห้อง Pack A บริเวณหน้าห้องเก็บบรรจุภัณฑ์', note: 'ทางเข้าห้องเก็บถุงและกล่องบรรจุ' },
      { id: '15', name: '(15) ห้อง Pack C', note: 'ไลน์บรรจุสินค้าสำเร็จรูป' }
    ]
  },
  'คลัง3': {
    color: 'from-sky-500 to-blue-600',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/35 dark:text-sky-300 border-sky-200 dark:border-sky-900',
    traps: [
      { id: '16', name: '(16) ห้อง Pack สินค้า Frozen คลัง3', note: 'พื้นที่บรรจุสินค้าแช่เยือกแข็ง' }
    ]
  },
  'หมูบด': {
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-350 border-emerald-200 dark:border-emerald-900',
    traps: [
      { id: '17', name: '(17) ห้องหมูบด บริเวณทางเข้า-ออก ติดตู้ F5', note: 'ประตูทางเข้าออกใกล้ตู้แช่ F5' },
      { id: '18', name: '(18) ห้องหมูบด บริเวณเครื่องบดหมู ติดตู้ F1', note: 'บริเวณเครื่องจักรบดเนื้อ' },
      { id: '19', name: '(19) ห้องหมูบด บริเวณผนังติดห้องเครื่อง', note: 'ผนังติดห้องระบบทำความเย็น' },
      { id: '20', name: '(20) ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ', note: 'ทางเชื่อมระหว่างสำนักงานและไลน์ผลิต' },
      { id: '21', name: '(21) ห้องหมูบด ทางเข้า-ออกไลน์ผลิต ฝั่งตู้ S,T', note: 'ทางเข้าออกสายการผลิตฝั่งตู้ S,T' }
    ]
  },
  'Slice ผลิต': {
    color: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/35 dark:text-purple-350 border-purple-200 dark:border-purple-900',
    traps: [
      { id: '22', name: '(22) ห้อง Slice เครื่องใน ทางเข้า-ออก ฝั่ง Chill 3', note: 'ทางเชื่อมห้องชิลล์เก็บเครื่องใน' },
      { id: '23', name: '(23) ห้อง Slice เครื่องใน ทางเข้า-ออกไลน์ผลิต', note: 'จุดผ่านพนักงานเข้าไลน์สไลซ์เครื่องใน' },
      { id: '26', name: '(26) Slice ชั้น 3 ทางเข้า-ออกไลน์ผลิต', note: 'ประตูเข้าไลน์ผลิตชั้น 3' },
      { id: '27', name: '(27) Slice ชั้น 3 พื้นที่การผลิต', note: 'พื้นที่ตัดสไลซ์เนื้อสัตว์ชั้น 3' },
      { id: '28', name: '(28) ทางเดินไปห้องยุง Slice ชั้น 3', note: 'โถงทางเดินติดตั้งไฟดักยุง' },
      { id: '29', name: '(29) ห้อง Slice เฟส 4.1', note: 'พื้นที่ผลิตสไลซ์เฟส 4.1' }
    ]
  },
  'อนามัย': {
    color: 'from-amber-400 to-yellow-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-350 border-amber-200 dark:border-amber-900',
    traps: [
      { id: '24', name: '(24) ห้องซักผ้า คลัง 4', note: 'พื้นที่ทำความสะอาดชุดยูนิฟอร์ม' },
      { id: '25', name: '(25) ทางเข้า Slice ถาด', note: 'จุดลำเลียงถาดบรรจุภัณฑ์เข้าห้องสไลซ์' },
      { id: '33', name: '(33) บันไดทางขึ้นชั้น 2', note: 'จุดสัญจรขึ้นลงระหว่างชั้น' }
    ]
  },
  'ล้างตะกร้า': {
    color: 'from-slate-500 to-gray-600',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    traps: [
      { id: '32', name: '(32) ทางลำเลียงตะกร้าเข้าไลน์ผลิต', note: 'จุดส่งตะกร้าสะอาดกลับเข้าสายการผลิต' }
    ]
  }
};

// Action Limits standard definition
const ACTION_LIMITS = [
  {
    type: 'แมลงวัน (Flies)',
    limit: 30,
    unit: 'ตัว/สัปดาห์',
    desc: 'แมลงพาหะนำเชื้อโรคระดับวิกฤต เกิน 30 ตัว ต้องออก CAR ทันที',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50',
    iconColor: 'text-blue-600',
    accentColor: '#0f5b84'
  },
  {
    type: 'ยุง (Mosquitoes)',
    limit: 50,
    unit: 'ตัว/สัปดาห์',
    desc: 'ตัวชี้วัดความชื้นและแหล่งน้ำขังรอบโรงงาน เกิน 50 ตัว ต้องตรวจสอบจุดระบายน้ำ',
    color: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-900/50',
    iconColor: 'text-pink-600',
    accentColor: '#e452cd'
  },
  {
    type: 'มด (Ants)',
    limit: 10,
    unit: 'ตัว/สัปดาห์',
    desc: 'ตัวชี้วัดเศษอาหารตกค้างและรอยแตกร้าวของอาคาร เกิน 10 ตัว ต้องฉีดพ่นและอุดรอยรั่ว',
    color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50',
    iconColor: 'text-amber-600',
    accentColor: '#fcc214'
  },
  {
    type: 'แมลงอื่นๆ (Others)',
    limit: 100,
    unit: 'ตัว/สัปดาห์',
    desc: 'แมลงหวี่ ผีเสื้อข้าวสาร มอด ฯลฯ เกิน 100 ตัว ต้องแยกชนิดและหาสาเหตุเฉพาะ',
    color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50',
    iconColor: 'text-emerald-600',
    accentColor: '#78c843'
  }
];

export default function ManualPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRole, setActiveRole] = useState('all'); // 'all', 'operator', 'supervisor', 'qa', 'admin'
  const [expandedFaq, setExpandedFaq] = useState({});
  const [expandedDept, setExpandedDept] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // FAQ items data
  const faqList = [
    {
      q: 'หากบันทึกผลตรวจนับประจำสัปดาห์ผิดพลาด สามารถแก้ไขได้อย่างไร?',
      a: 'หากพนักงานตรวจนับบันทึกข้อมูลผิด สามารถเข้าไปที่หน้าบันทึกผลตรวจรายสัปดาห์ (/inspection) แล้วเลือก วัน/เดือน/ปี เดิม ระบบจะโหลดข้อมูลล่าสุดที่เคยบันทึกไว้ขึ้นมา ให้ทำการแก้ไขตัวเลขแล้วกด "บันทึกข้อมูล" ซ้ำอีกครั้ง หรือแจ้ง Admin ให้ทำการแก้ไขผ่านหน้า จัดการข้อมูลผลตรวจ (/admin) ได้'
    },
    {
      q: 'เกณฑ์ Action Limit (การเตือนสีแดง) คิดจากอะไร และเมื่อไหร่ต้องออก CAR?',
      a: 'เกณฑ์คิดจากจำนวนแมลงสะสมต่อ 1 จุดตรวจใน 1 สัปดาห์: แมลงวัน > 30 ตัว, ยุง > 50 ตัว, มด > 10 ตัว, หรือแมลงอื่นๆ > 100 ตัว หากจุดตรวจใดมีค่าเกินเกณฑ์ กราฟจะแสดงสัญลักษณ์ F- และส่งแจ้งเตือนไปยังหัวหน้าแผนกให้ทำการรับทราบและจัดทำ CAR (CAPA Action) ในหน้า /supervisor ทันที'
    },
    {
      q: 'หัวหน้าแผนก (Supervisor) มีระยะเวลาในการตอบรับ CAR ภายในกี่วัน?',
      a: 'ตามระเบียบปฏิบัติมาตรฐาน GMP/HACCP หัวหน้าแผนกต้องตรวจสอบสาเหตุ (Root Cause) ดำเนินการแก้ไขเบื้องต้น และบันทึกมาตรการป้องกันการเกิดซ้ำ (Preventive Action) พร้อมแนบรูปถ่ายหลักฐานผ่านระบบภายใน 48 ชั่วโมง (2 วันทำการ) หลังการตรวจนับ'
    },
    {
      q: 'AI วิเคราะห์แนวโน้มทำงานอย่างไร และวิเคราะห์จากข้อมูลใด?',
      a: 'ฟังก์ชัน AI ขับเคลื่อนด้วยโมเดล Google Gemini โดยระบบจะส่งชุดข้อมูลตัวเลขสถิติแมลงย้อนหลังตามช่วงเวลาและแผนกที่ผู้ใช้เลือก พร้อมบริบทมาตรฐานความปลอดภัยอาหาร GMP/HACCP เพื่อประมวลผลหาจุดวิกฤต สาเหตุที่เป็นไปได้ และข้อเสนอแนะเชิงรุก'
    },
    {
      q: 'ทำไมหน้าแดชบอร์ดหรือรายงานนำเสนอประจำเดือนยังไม่แสดงข้อมูลของเดือนปัจจุบัน?',
      a: 'การสรุปรายงานประจำเดือนสำหรับนำเสนอจะแสดงผลสมบูรณ์เมื่อมีการตรวจนับครบทั้ง 4-5 สัปดาห์ของเดือนนั้น และได้รับการอนุมัติ (Approved) จาก QA Manager หรือ Admin ผ่านหน้า /admin แท็บ "อนุมัติรายงานประจำเดือน"'
    },
    {
      q: 'กรณีไม่พบแมลงในจุดดักแมลง ต้องกรอกตัวเลขอย่างไร?',
      a: 'หากตรวจนับแล้วไม่พบแมลง ให้กรอกเลข 0 (ศูนย์) ห้ามเว้นว่างไว้ เพื่อให้ระบบบันทึกสถานะว่าจุดดังกล่าวได้รับการตรวจนับแล้วจริง ไม่ใช่การละเลยการตรวจสอบ'
    },
    {
      q: 'หากตรวจพบ "แมลงสาบ" หรือ "จิ้งจก" ต้องบันทึกในช่องไหน?',
      a: 'ตามแบบฟอร์มมาตรฐาน FM-QC - 08/03 Rev.07 คอลัมน์หลัก 4 ช่องได้แก่ แมลงวัน, ยุง, มด และ แมลงอื่นๆ ดังนั้นหากพบ "แมลงสาบ" หรือ "จิ้งจก" (รวมถึงสัตว์รบกวนอื่นๆ) ให้บันทึกในคอลัมน์ "แมลงอื่นๆ" โดยกดปุ่ม "ระบุชนิด" แล้วเลือก แมลงสาบ หรือ จิ้งจก จากรายการ พร้อมระบุจำนวน ตัวเลขจะถูกรวมเข้าสู่ยอดแมลงอื่นๆ ให้อัตโนมัติ'
    }
  ];

  // Filtering FAQ based on search
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqList;
    const q = searchQuery.toLowerCase();
    return faqList.filter(item => 
      item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
  }, [searchQuery, faqList]);

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ========================================================================= */}
        {/* HEADER & HERO SECTION */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden print:bg-none print:text-black print:p-0 print:shadow-none">
          {/* Decorative Background Circles */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-100">
                <BookOpen className="w-3.5 h-3.5" />
                <span>คู่มือการใช้งานระบบอย่างเป็นทางการ | Official User Manual</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                คู่มือการใช้งานระบบรายงานและวิเคราะห์แนวโน้มแมลง
              </h1>
              <p className="text-sm sm:text-base text-blue-100 font-medium max-w-2xl leading-relaxed">
                ระบบติดตาม ตรวจนับ วิเคราะห์แนวโน้มแมลงสะสมในพื้นที่โรงงานตามมาตรฐาน GMP/HACCP 
                บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด ครอบคลุมเครื่องดักแมลง 33 จุด ใน 10 แผนกปฏิบัติการ
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5 print:hidden shrink-0">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-2xl font-bold text-xs backdrop-blur-md border border-white/25 transition-all cursor-pointer shadow-sm"
                title="พิมพ์คู่มือนี้"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์คู่มือ (Print)</span>
              </button>

              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-900 hover:bg-blue-50 active:scale-95 rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer"
              >
                <span>เข้าสู่แดชบอร์ด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="mt-8 pt-6 border-t border-white/15 print:hidden">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาหัวข้อ คำแนะนำ รหัสเครื่อง หรือปัญหาที่พบบ่อย (เช่น CAR, แมลงวัน, 30 ตัว)..."
                className="w-full pl-11 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/60 rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 text-xs sm:text-sm font-semibold transition-all backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/70 hover:text-white bg-white/20 px-2 py-0.5 rounded-lg"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROLE SELECTOR PILLS */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
          <span className="text-xs font-bold text-slate-450 dark:text-slate-500 mr-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            เลือกดูตามบทบาท:
          </span>

          {[
            { id: 'all', label: '🌟 ทั้งหมด (All Roles)', desc: 'เนื้อหาครบถ้วนทุกส่วน' },
            { id: 'operator', label: '👷‍♂️ พนักงานตรวจนับ (Operator / QC)', desc: 'การบันทึกผลประจำสัปดาห์' },
            { id: 'supervisor', label: '📋 หัวหน้าแผนก (Supervisor)', desc: 'การรับทราบรายงาน & CAR' },
            { id: 'qa', label: '🛡️ ฝ่ายประกันคุณภาพ (QA)', desc: 'แดชบอร์ด & AI วิเคราะห์' },
            { id: 'admin', label: '⚙️ ผู้ดูแลระบบ (Admin)', desc: 'จัดการระบบ & อนุมัติ' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveRole(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                activeRole === tab.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 5 Pest Monitoring Forms Switcher */}
        <FormNav title="เลือกระบบแบบฟอร์มตรวจสอบและควบคุมสัตว์รบกวน 5 รูปแบบ" />

        {/* ========================================================================= */}
        {/* SECTION 1: SYSTEM OVERVIEW & WORKFLOW */}
        {/* ========================================================================= */}
        {(activeRole === 'all' || activeRole === 'qa' || activeRole === 'admin') && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                  1. ผังการทำงานและโครงสร้างระบบ (System Workflow)
                </h2>
                <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                  วงจรการทำงานแบบครบวงจร (Closed-loop Management) ตามมาตรฐานอาหารปลอดภัย
                </p>
              </div>
            </div>

            {/* Workflow Steps Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                    ขั้นตอนที่ 1
                  </span>
                  <ClipboardCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                  ตรวจนับ & บันทึกผล
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                  เจ้าหน้าที่ QC หรือ Operator เดินตรวจแผ่นกาวดักแมลง 33 จุด กรอกจำนวนแมลงลงในหน้า <span className="font-bold text-amber-700 dark:text-amber-400">/inspection</span> ทุกสัปดาห์
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200">
                    ขั้นตอนที่ 2
                  </span>
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                  เทียบเกณฑ์ & แจ้งเตือน
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                  ระบบเปรียบเทียบผลตรวจกับ Action Limits อัตโนมัติ หากจุดใดเกินเกณฑ์ จะติดสถานะ <span className="font-bold text-red-600">F-</span> และส่งต่อไปยังแผนกรับผิดชอบ
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                    ขั้นตอนที่ 3
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                  รับทราบ & ออก CAR/CAPA
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                  หัวหน้าแผนกเข้าหน้า <span className="font-bold text-emerald-700 dark:text-emerald-400">/supervisor</span> เพื่อระบุสาเหตุ มาตรการแก้ไข และป้องกัน พร้อมแนบรูปถ่ายยืนยัน
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200">
                    ขั้นตอนที่ 4
                  </span>
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1">
                  AI วิเคราะห์ & อนุมัติ
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                  QA และผู้บริหารวิเคราะห์แนวโน้มด้วย AI สรุปรายงานประจำเดือน และผู้ดูแลระบบทำการอนุมัติเพื่อนำเสนอในที่ประชุม
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: ACTION LIMITS & CRITERIA */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                2. เกณฑ์ควบคุมมาตรฐาน (Action Limits & Alert Thresholds)
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                เกณฑ์จำนวนแมลงสะสมสูงสุดที่ยอมรับได้ ต่อเครื่อง ต่อสัปดาห์ ตามแบบฟอร์ม FM-QC - 08/03 Rev.07
              </p>
            </div>
          </div>

          {/* Cards for each insect limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTION_LIMITS.map((item, idx) => (
              <div 
                key={idx}
                className={`p-5 rounded-2xl border ${item.color} flex flex-col justify-between transition-transform hover:-translate-y-1 shadow-xs`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-extrabold text-sm">{item.type}</span>
                    <span 
                      className="w-3.5 h-3.5 rounded-full shadow-inner" 
                      style={{ backgroundColor: item.accentColor }} 
                    />
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black">{item.limit}</span>
                    <span className="text-xs font-bold opacity-80">{item.unit}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90 font-medium">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-current/15 flex items-center justify-between text-[11px] font-bold">
                  <span>สถานะปกติ: ≤ {item.limit}</span>
                  <span className="text-red-600 dark:text-red-400 font-black">เกินเกณฑ์: &gt; {item.limit} (CAR)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
              <strong className="text-slate-800 dark:text-slate-200">สัญลักษณ์ F- บนกราฟ:</strong> หากเครื่องดักแมลงจุดใดมีจำนวนแมลงประเภทใดประเภทหนึ่งเกินเกณฑ์ Action Limit ด้านบน บนแท่งกราฟจะมีเครื่องหมายวงกลมสีแดงพร้อมตัวอักษร <strong>F-</strong> ปรากฏขึ้น เพื่อแจ้งเตือนให้ผู้ใช้งานทราบทันทีว่าจุดดังกล่าวเกิดความบกพร่อง (Fail) และต้องการมาตรการแก้ไข
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: ROLE-BASED INSTRUCTIONS */}
        {/* ========================================================================= */}

        {/* 3.1 OPERATOR GUIDE */}
        {(activeRole === 'all' || activeRole === 'operator') && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                    3.1 คู่มือสำหรับพนักงานตรวจนับ (Operator / QC)
                  </h2>
                  <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                    หน้าบันทึกผลตรวจรายสัปดาห์ (Weekly Inspection Data Entry) ที่ <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600 font-bold">/inspection</code>
                  </p>
                </div>
              </div>

              <Link
                href="/inspection"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>ไปยังหน้าบันทึกผล</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Step-by-Step Operator Guide */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    เลือกช่วงเวลาการตรวจนับ (สัปดาห์ / เดือน / ปี)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    ที่แถบด้านบน ให้ระบุสัปดาห์ที่ตรวจ (เช่น Week 1 ถึง Week 5), เดือน และปี พ.ศ. หากในสัปดาห์นั้นเคยมีการบันทึกข้อมูลไว้แล้ว ระบบจะดึงข้อมูลเดิมขึ้นมาแสดงผลโดยอัตโนมัติ เพื่อให้ตรวจสอบหรือแก้ไขได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    กรอกจำนวนแมลงแยกตามเครื่องดักแมลงทั้ง 33 จุด
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    ระบบแบ่งตารางตาม 10 แผนกอย่างชัดเจน ให้กรอกตัวเลขจำนวนแมลงในแต่ละช่อง:
                    <span className="block mt-1 space-y-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
                      • <strong>แมลงวัน:</strong> หากพบ 0 ตัว ให้พิมพ์ 0 (ห้ามเว้นว่าง)<br/>
                      • <strong>ยุง:</strong> หากพบ 0 ตัว ให้พิมพ์ 0<br/>
                      • <strong>มด:</strong> หากพบ 0 ตัว ให้พิมพ์ 0<br/>
                      • <strong>แมลงอื่นๆ:</strong> หากมีชนิดแมลงอื่น ให้กดปุ่ม <strong>"ระบุชนิด"</strong> เพื่อระบุชื่อชนิดและจำนวนย่อย (เช่น ผีเสื้อ 3 ตัว, แมลงหวี่ 5 ตัว, แมลงสาบ 1 ตัว, จิ้งจก 1 ตัว)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    ดูผังตำแหน่งเครื่องดักแมลง (Floor Layout View)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    ที่หัวตารางของแต่ละแผนก จะมีปุ่ม <strong>"ดูผังจุดติดตั้ง"</strong> พนักงานสามารถกดเปิดดูรูปแปลนผังโรงงานเพื่อตรวจสอบตำแหน่งจริงของเครื่องดักแมลงได้ ช่วยป้องกันการสับสนหมายเลขเครื่อง
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    ตรวจสอบยอดรวมและบันทึกข้อมูล
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    ระบบจะคำนวณผลรวมรายแถวและผลรวมทั้งหมดให้อัตโนมัติ เมื่อตรวจสอบความถูกต้องครบถ้วนแล้ว ให้กดปุ่ม <span className="font-bold text-amber-600">"บันทึกผลการตรวจ"</span> สีทองด้านล่างสุด ข้อมูลจะถูกจัดเก็บลงฐานข้อมูลและเชื่อมโยงไปยังแดชบอร์ดทันที
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3.2 SUPERVISOR GUIDE */}
        {(activeRole === 'all' || activeRole === 'supervisor') && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                    3.2 คู่มือสำหรับหัวหน้าแผนก (Department Supervisor)
                  </h2>
                  <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                    หน้าบันทึกการรับทราบรายงาน & จัดทำ CAR ที่ <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-emerald-600 font-bold">/supervisor</code>
                  </p>
                </div>
              </div>

              <Link
                href="/supervisor"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>ไปยังหน้ารับทราบรายงาน</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Supervisor Flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>การเข้าตรวจสอบรายงานประจำแผนก</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-450 space-y-2 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    <span>เมื่อเข้าสู่ระบบด้วยบัญชีของหัวหน้าแผนก ระบบจะคัดกรองเฉพาะข้อมูลเครื่องดักแมลงของแผนกท่านขึ้นมาให้โดยอัตโนมัติ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    <span>สังเกตกราฟสถิติ หากแท่งกราฟไม่มีสัญลักษณ์เตือนสีแดง แสดงว่าแผนกท่านอยู่ในเกณฑ์ปกติ ไม่พบข้อบกพร่อง</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    <span>หากมีป้ายสีแดงแจ้งเตือน <strong>"พบจุดตรวจเกินเกณฑ์ควบคุม (Action Limit)"</strong> หัวหน้าแผนกจำเป็นต้องดำเนินการตอบรับ CAR</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>การจัดทำมาตรการแก้ไขและป้องกัน (CAPA)</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-450 space-y-2 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">1.</span>
                    <span><strong>วิเคราะห์สาเหตุ (Root Cause):</strong> เช่น ประตูเปิดทิ้งไว้ระหว่างขนย้าย, ม่านพลาสติกฉีกขาด, แสงไฟรั่วออกภายนอก</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">2.</span>
                    <span><strong>การแก้ไขเบื้องต้น (Correction):</strong> เช่น ทำความสะอาดพื้นที่ทันที, ปิดประตูให้สนิท, เปลี่ยนแผ่นกาวดักแมลง</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">3.</span>
                    <span><strong>การป้องกันการเกิดซ้ำ (Preventive Action):</strong> เช่น ซ่อมแซมม่านพลาสติก, กำชับพนักงาน, ติดตั้งสปริงปิดประตูอัตโนมัติ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">4.</span>
                    <span><strong>แนบรูปภาพหลักฐาน:</strong> อัปโหลดรูปสภาพพื้นที่จริงและการแก้ไข แล้วกด <strong>"ลงนามรับทราบและบันทึก"</strong></span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 3.3 QA & DASHBOARD GUIDE */}
        {(activeRole === 'all' || activeRole === 'qa') && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                    3.3 คู่มือฝ่ายประกันคุณภาพและแดชบอร์ด (QA Dashboard & AI Analysis)
                  </h2>
                  <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                    หน้าวิเคราะห์แนวโน้มแมลงสะสมและ AI ช่วยวิเคราะห์ ที่ <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 font-bold">/</code>
                  </p>
                </div>
              </div>

              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>ไปยังแดชบอร์ด</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-600 dark:text-blue-400">
                    <BarChart3 className="w-4 h-4" />
                    <span>การกรองและแสดงผลกราฟ</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                    ผู้ใช้สามารถเลือกดูตามปี, เดือน หรือเฉพาะสัปดาห์ พร้อมทั้งกรองรายแผนก (10 แผนก) หรือเลือกดูเครื่องดักแมลงเฉพาะจุด เพื่อดูลักษณะแนวโน้มการขึ้นลงของแมลงแต่ละประเภท
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-4 h-4" />
                    <span>AI อัจฉริยะวิเคราะห์แนวโน้ม</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                    กดปุ่ม <strong>"วิเคราะห์แนวโน้มด้วย AI"</strong> ระบบจะรวบรวมสถิติส่งให้ Google Gemini ประเมินความเสี่ยง ชี้จุดเสี่ยงวิกฤต และให้ข้อเสนอแนะเชิงป้องกันตามหลัก HACCP ทันที
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    <Download className="w-4 h-4" />
                    <span>การส่งออกรายงาน (Export)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-medium">
                    สามารถกดดาวน์โหลดกราฟเป็นภาพ PNG ความละเอียดสูง หรือคัดลอกบทวิเคราะห์ AI ไปวางในเอกสารรายงานสรุปการประชุมประจำเดือนได้อย่างสะดวกรวดเร็ว
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3.4 ADMIN GUIDE */}
        {(activeRole === 'all' || activeRole === 'admin') && (
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                    3.4 คู่มือสำหรับผู้ดูแลระบบ (Admin & System Management)
                  </h2>
                  <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                    หน้าจัดการข้อมูล ผู้ใช้งาน และอนุมัติรายงานประจำเดือน ที่ <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-purple-600 font-bold">/admin</code>
                  </p>
                </div>
              </div>

              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>ไปยังหน้าแอดมิน</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>การจัดการผู้ใช้งาน (Users Management)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  เพิ่ม ลบ หรือแก้ไขข้อมูลพนักงาน กำหนดบทบาท (Role) ได้แก่ <code>Operator</code>, <code>Department Supervisor</code>, <code>QA Manager</code>, หรือ <code>Admin</code> และผูกบัญชีเข้ากับแผนกที่สังกัด
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>การอนุมัติรายงานประจำเดือน (Monthly Approvals)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  เมื่อตรวจนับครบทั้ง 4 หรือ 5 สัปดาห์ของเดือน ระบบจะตรวจสอบความครบถ้วน (Completeness) เมื่อข้อมูลพร้อมสมบูรณ์ ให้กดปุ่ม <strong>"อนุมัติรายงาน (Approve)"</strong> เพื่อเผยแพร่ให้ทุกฝ่ายนำไปจัดประชุมประจำเดือน
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>แก้ไขข้อมูลผลตรวจย้อนหลัง (Inspection Management)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  กรณีพบข้อผิดพลาดในการคีย์ข้อมูลของสัปดาห์ก่อนหน้า Admin สามารถเลือกวันที่ตรวจนับและแผนก เพื่อปรับปรุงตัวเลขให้ถูกต้องตรงตามเอกสารทางกายภาพได้
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>รายงานสำหรับนำเสนอ (Presentation Mode)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  โหมดแสดงผลสรุปรายเดือนแบบสไลด์ขนาดใหญ่ เหมาะสำหรับเปิดขึ้นจอโปรเจกเตอร์ในที่ประชุมฝ่ายบริหาร พร้อมบทสรุปจุดที่เกินเกณฑ์ Action Limit แยกตามแผนกอย่างชัดเจน
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: 33 TRAP DIRECTORY & LOCATIONS */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                  4. สารบบตำแหน่งเครื่องดักแมลง 33 จุด (Trap Directory)
                </h2>
                <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                  รหัสเครื่องและตำแหน่งติดตั้งจริง แยกตาม 10 แผนกปฏิบัติการ
                </p>
              </div>
            </div>
            
            <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 rounded-xl border border-teal-200 dark:border-teal-900/50 w-fit">
              รวมทั้งหมด 33 จุดตรวจ
            </span>
          </div>

          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(DEPT_TRAPS_MAPPING).map(([deptName, deptInfo]) => {
              const isExpanded = expandedDept === deptName;
              return (
                <div 
                  key={deptName}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
                >
                  <button
                    onClick={() => setExpandedDept(isExpanded ? null : deptName)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-lg ${deptInfo.badge}`}>
                        {deptName}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        ({deptInfo.traps.length} เครื่อง)
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Traps list */}
                  <div className={`px-4 pb-4 pt-1 space-y-2 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                    {deptInfo.traps.map(trap => (
                      <div 
                        key={trap.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {trap.name}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {trap.note}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px] text-slate-600 dark:text-slate-400 shrink-0">
                          #{trap.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: FAQ & TROUBLESHOOTING */}
        {/* ========================================================================= */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                5. คำถามที่พบบ่อยและการแก้ปัญหา (FAQ & Troubleshooting)
              </h2>
              <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
                คำแนะนำและแนวทางแก้ไขปัญหาทั่วไปในการใช้งานระบบ
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <p className="text-center py-8 text-xs font-bold text-slate-450">
                ไม่พบคำตอบสำหรับคำค้นหา "{searchQuery}" กรุณาลองค้นหาด้วยคำอื่น
              </p>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = expandedFaq[idx] ?? true;
                return (
                  <div 
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 transition-all"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center text-xs shrink-0 font-bold">
                          Q
                        </span>
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-450 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-850 bg-white/60 dark:bg-slate-900/60">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOOTER & SUPPORT CONTACT */}
        {/* ========================================================================= */}
        <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2 border border-slate-200 dark:border-slate-800 print:hidden">
          <p className="font-extrabold text-slate-700 dark:text-slate-300">
            ระบบสารสนเทศความปลอดภัยอาหารและการควบคุมสัตว์พาหะนำโรค (Pest Control Information System)
          </p>
          <p className="font-medium">
            หากพบปัญหาการใช้งานระบบ ข้อผิดพลาดของฐานข้อมูล หรือต้องการปรับปรุงแบบฟอร์ม 
            กรุณาติดต่อ ฝ่ายประกันคุณภาพระบบ (QA) หรือ แผนกสารสนเทศ (IT) บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด
          </p>
          <div className="pt-2 text-[11px] text-slate-450">
            อัปเดตล่าสุด: มีนาคม 2569 | มาตรฐาน FM-QC - 08/03 Rev.07
          </div>
        </div>

      </div>
    </main>
  );
}
