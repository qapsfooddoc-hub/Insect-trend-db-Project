import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const hasGeminiKey = apiKey && apiKey !== 'your-gemini-api-key';
const genAI = hasGeminiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper to extract department and location details
function parseArea(areaString) {
  if (!areaString) return { dept: 'อื่นๆ', location: '-' };
  
  let deptResult = 'อื่นๆ';
  let locationResult = areaString;

  if (areaString.includes(': ')) {
    const parts = areaString.split(': ');
    deptResult = parts[0];
    locationResult = parts[1];
  } else {
    // Fallback check if it starts with department keywords
    const depts = [
      'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'โหลด', 'เฟส 6', 
      'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
    ];
    for (const d of depts) {
      if (areaString.startsWith(d)) {
        deptResult = d;
        locationResult = areaString.replace(d, '').replace(/^\s*[:\-]\s*/, '').trim();
        break;
      }
    }
  }

  // Normalize "โหลด" to "โหลด เฟส 5"
  if (deptResult === 'โหลด') {
    deptResult = 'โหลด เฟส 5';
  }

  return { dept: deptResult, location: locationResult };
}

export async function POST(request) {
  try {
    let rawData = [];
    let isDemoMode = false;
    let deptName = 'ALL';
    let month = 'ALL';
    let quarter = 'ALL';
    let year = '2026';
    let clientRecords = null;
    let clientOthersBreakdown = null;

    try {
      const body = await request.json();
      if (body.deptName) deptName = body.deptName;
      if (body.month) month = body.month;
      if (body.quarter) quarter = body.quarter;
      if (body.year) year = String(body.year);
      if (body.records) clientRecords = body.records;
      if (body.othersBreakdown) clientOthersBreakdown = body.othersBreakdown;
      if (body.isDemo !== undefined) isDemoMode = body.isDemo;
    } catch (e) {
      // Ignore body parse error
    }

    // 1. Get raw data either from clientRecords, Supabase or generate mock data
    if (clientRecords && Array.isArray(clientRecords)) {
      rawData = clientRecords;
    } else if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('insect_inspections')
        .select('*')
        .order('inspected_at', { ascending: true });

      if (error) {
        console.error('Supabase query error in analysis:', error);
        rawData = generateMockDataForAnalysis();
        isDemoMode = true;
      } else {
        rawData = data || [];
      }
    } else {
      rawData = generateMockDataForAnalysis();
      isDemoMode = true;
    }

    if (rawData.length === 0) {
      return NextResponse.json({
        report: 'ไม่พบข้อมูลแมลงที่ตรวจสอบในระบบเพื่อนำมาวิเคราะห์ กรุณากรอกข้อมูลบันทึกผลก่อนประมวลผลรายงาน',
        isDemo: isDemoMode,
        isAiGenerated: false
      });
    }

    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Filter by Year
    let filteredData = rawData.filter(record => {
      if (!record.inspected_at) return false;
      const dateStr = typeof record.inspected_at === 'string' ? record.inspected_at : new Date(record.inspected_at).toISOString();
      const itemYear = dateStr.split('-')[0];
      return itemYear === year;
    });

    // Filter by Month or Quarter
    if (month !== 'ALL') {
      filteredData = filteredData.filter(record => {
        if (!record.inspected_at) return false;
        const dateStr = typeof record.inspected_at === 'string' ? record.inspected_at : new Date(record.inspected_at).toISOString();
        const monthPart = dateStr.split('-')[1];
        if (!monthPart) return false;
        const monthIdx = parseInt(monthPart, 10) - 1;
        const itemMonthName = thaiMonths[monthIdx];
        return itemMonthName === month;
      });
    } else if (quarter !== 'ALL') {
      const qMonths = {
        'Q1': ['มกราคม', 'กุมภาพันธ์', 'มีนาคม'],
        'Q2': ['เมษายน', 'พฤษภาคม', 'มิถุนายน'],
        'Q3': ['กรกฎาคม', 'สิงหาคม', 'กันยายน'],
        'Q4': ['ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
      };
      const allowed = qMonths[quarter] || [];
      filteredData = filteredData.filter(record => {
        if (!record.inspected_at) return false;
        const dateStr = typeof record.inspected_at === 'string' ? record.inspected_at : new Date(record.inspected_at).toISOString();
        const monthPart = dateStr.split('-')[1];
        if (!monthPart) return false;
        const monthIdx = parseInt(monthPart, 10) - 1;
        const itemMonthName = thaiMonths[monthIdx];
        return allowed.includes(itemMonthName);
      });
    }

    // Filter by Department
    if (deptName !== 'ALL') {
      filteredData = filteredData.filter(record => {
        const { dept } = parseArea(record.area);
        return dept === deptName;
      });
    }

    // 3. Aggregate data for the AI Prompt
    const summaryByDept = {};
    const summaryByType = {
      'Flies (แมลงวัน)': 0,
      'Mosquitoes (ยุง)': 0,
      'Ants (มด)': 0,
      'Others (แมลงอื่นๆ)': 0
    };
    const summaryByTrap = {};
    const othersBreakdown = {};

    // Collect othersBreakdown
    filteredData.forEach(record => {
      const { dept } = parseArea(record.area);
      
      // By Dept
      summaryByDept[dept] = (summaryByDept[dept] || 0) + record.count;

      // By Insect Type
      const type = record.insect_type;
      if (summaryByType[type] !== undefined) {
        summaryByType[type] += record.count;
      } else {
        // Fallback matching
        if (type.includes('Flies')) summaryByType['Flies (แมลงวัน)'] += record.count;
        else if (type.includes('Mosquitoes')) summaryByType['Mosquitoes (ยุง)'] += record.count;
        else if (type.includes('Ants')) summaryByType['Ants (มด)'] += record.count;
        else summaryByType['Others (แมลงอื่นๆ)'] += record.count;
      }

      // Collect specific insect details under "Others"
      if (type.includes('Others') && record.details) {
        let detailsList = [];
        try {
          detailsList = typeof record.details === 'string' ? JSON.parse(record.details) : record.details;
        } catch (e) {
          console.error('Failed to parse details:', e);
        }
        if (Array.isArray(detailsList)) {
          detailsList.forEach(det => {
            if (det && det.name) {
              const name = det.name.trim();
              const countVal = Number(det.count) || 0;
              if (countVal > 0) {
                othersBreakdown[name] = (othersBreakdown[name] || 0) + countVal;
              }
            }
          });
        }
      }

      // By Trap (if department specific)
      if (deptName !== 'ALL') {
        const trapMatch = record.area.match(/\((\d+)\)/);
        const trapNo = trapMatch ? trapMatch[1] : record.area.replace(/.*:\s*/, '');
        if (!summaryByTrap[trapNo]) {
          summaryByTrap[trapNo] = { flies: 0, mosquitoes: 0, ants: 0, others: 0, total: 0 };
        }
        if (type.includes('Flies')) summaryByTrap[trapNo].flies += record.count;
        else if (type.includes('Mosquitoes')) summaryByTrap[trapNo].mosquitoes += record.count;
        else if (type.includes('Ants')) summaryByTrap[trapNo].ants += record.count;
        else summaryByTrap[trapNo].others += record.count;
        
        summaryByTrap[trapNo].total += record.count;
      }
    });

    // Merge client-passed othersBreakdown if any and ours is empty
    if (clientOthersBreakdown && Object.keys(othersBreakdown).length === 0) {
      Object.assign(othersBreakdown, clientOthersBreakdown);
    }

    // 4. Construct Prompt
    let periodText = '';
    if (month !== 'ALL') periodText = `เดือน ${month} ปี ${year}`;
    else if (quarter !== 'ALL') periodText = `ไตรมาส ${quarter} ปี ${year}`;
    else periodText = `ปี ${year}`;

    let dataDescription = '';
    let systemPrompt = '';

    // Department Specific Context Mapping from user PDF/OCR
    const DEPT_SPECIAL_CONTEXTS = {
      'หน้าร้านใหม่': 'มีประตูเปิด-ปิดบ่อยรับสินค้าจากภายนอก— เสี่ยงแมลงจากภายนอก ตรวจม่าน ปิดม่านพลาสติกทุกครั้ง',
      'โรงฆ่า': 'อื่น ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้',
      'ตัดแต่ง': 'ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน',
      'โหลด': 'ติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ',
      'โหลด เฟส 5': 'ติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ',
      'เฟส 6': 'ติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ'
    };

    if (deptName === 'ALL') {
      dataDescription = `
ช่วงเวลาการตรวจ: ${periodText}
สถิติการตรวจพบแมลงแยกตามแผนกปฏิบัติการ (ยอดสะสมรวม):
${Object.entries(summaryByDept).map(([d, count]) => `- แผนก ${d}: พบสะสมรวม ${count} ตัว`).join('\n')}

แยกตามประเภทของแมลงที่พบสะสม:
- แมลงวัน: ${summaryByType['Flies (แมลงวัน)'] || 0} ตัว
- ยุง: ${summaryByType['Mosquitoes (ยุง)'] || 0} ตัว
- มด: ${summaryByType['Ants (มด)'] || 0} ตัว
- แมลงอื่นๆ: ${summaryByType['Others (แมลงอื่นๆ)'] || 0} ตัว
${Object.keys(othersBreakdown).length > 0 ? `รายละเอียดแมลงอื่นๆ: ${Object.entries(othersBreakdown).map(([name, val]) => `${name} ${val} ตัว`).join(', ')}` : ''}
      `;

      systemPrompt = `คุณคือผู้เชี่ยวชาญด้านสุขาภิบาลและความปลอดภัยในโรงงานอุตสาหกรรมผลิตอาหาร (HACCP/GMP Specialist) 
ช่วยวิเคราะห์ข้อมูลแมลงที่พบในโรงงานตามสถิติด้านบนนี้:
1. วิเคราะห์แนวโน้มแผนกปฏิบัติการที่วิกฤตที่สุด โดยเฉพาะแผนก "หน้าร้านใหม่" ที่ต้องแยกวิเคราะห์ต่างหากไม่รวมกับ "โรงฆ่า"
2. ประเมินความเสี่ยงและสาเหตุของแมลงแต่ละประเภท (มด, แมลงวัน, ยุง, แมลงอื่นๆ) และแหล่งกำเนิด
3. เสนอมาตรการแก้ไขเร่งด่วนและการป้องกันในอนาคต ตามข้อกำหนดสุขลักษณะโรงงาน GMP/HACCP เป็นข้อๆ อย่างกระชับและปฏิบัติได้จริง

กฎสำคัญด้านการจัดรูปแบบข้อความ:
- อย่าใช้ตัวหนามากเกินไป (ห้ามทำตัวหนาทั้งประโยค) ให้ใช้ตัวหนาเฉพาะชื่อแผนก (เช่น **แผนกหน้าร้านใหม่**) และชนิดแมลง (เช่น **แมลงวัน**, **ยุง**, **มด**, **แมลงอื่นๆ**) เท่านั้น
- เขียนสรุปเป็นภาษาไทยในรูปแบบ Markdown ที่สวยงาม อ่านง่าย และเป็นมืออาชีพ

คีย์เวิร์ดหลักสำคัญที่ควรเน้นย้ำในคำแนะนำ:
"ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้"`;
    } else {
      // Department Specific Report
      const trapCount = Object.keys(summaryByTrap).length;
      dataDescription = `
แผนก: ${deptName}
จำนวนเครื่องดักแมลงทั้งหมดในแผนกนี้: ${trapCount} เครื่อง
ช่วงเวลาการตรวจ: ${periodText}

สถิติจำนวนแมลงในแต่ละเครื่องดักของแผนก ${deptName}:
${Object.entries(summaryByTrap).map(([trapNo, counts]) => `- เครื่องดักหมายเลข ${trapNo}: แมลงวัน ${counts.flies} ตัว, ยุง ${counts.mosquitoes} ตัว, มด ${counts.ants} ตัว, แมลงอื่นๆ ${counts.others} ตัว (รวมสะสม ${counts.total} ตัว)`).join('\n')}

ยอดรวมในแผนก ${deptName}:
- แมลงวัน: ${summaryByType['Flies (แมลงวัน)'] || 0} ตัว
- ยุง: ${summaryByType['Mosquitoes (ยุง)'] || 0} ตัว
- มด: ${summaryByType['Ants (มด)'] || 0} ตัว
- แมลงอื่นๆ: ${summaryByType['Others (แมลงอื่นๆ)'] || 0} ตัว
${Object.keys(othersBreakdown).length > 0 ? `รายละเอียดแมลงอื่นๆ ที่พบ: ${Object.entries(othersBreakdown).map(([name, val]) => `${name} ${val} ตัว`).join(', ')}` : ''}
      `;

      systemPrompt = `คุณคือผู้เชี่ยวชาญด้านควบคุมคุณภาพ (QA Compliance Specialist) ของโรงงานผลิตอาหารมาตรฐาน GMP และ HACCP
ช่วยวิเคราะห์ข้อมูลสถิติของแผนก ${deptName} ตามแนวทางที่กำหนดด้านล่างนี้:

โปรดเขียนรายงานสรุปวิเคราะห์แยกตามแผนกให้ได้ตามโครงสร้างแพทเทิร์นนี้:
"จากการตรวจนับจำนวนแมลง ของทีม **[ชื่อแผนก]** ประจำเดือน [ระบุเดือน] [ระบุปี พ.ศ.] พบว่า [สรุปการตรวจจับแมลง] [สาเหตุหลักของปัญหา] ดังนั้น [คำแนะนำแนวทางป้องกัน]"

กฎเกณฑ์สำคัญในการวิเคราะห์และจัดรูปแบบ (ฝ่าฝืนไม่ได้):
1. **สำหรับแผนกที่มีเครื่องดักจับเพียงเครื่องเดียว** (เช่น หน้าร้านใหม่ หรือ ล้างตะกร้า): ห้ามสรุปแค่ชนิดแมลงที่พบมากที่สุดอย่างเดียว แต่ต้องรายงานจำนวนดักจับได้ของแมลงทุกชนิด (**แมลงวัน**, **ยุง**, **มด**, และ **แมลงอื่นๆ**) ให้ครบถ้วนจากเครื่องดักจับเครื่องนั้น
2. **สำหรับแผนกที่มีเครื่องดักจับหลายเครื่อง**: สรุปว่าเครื่องดักหมายเลขใดพบแมลงชนิดใดติดมากที่สุด (ไล่เรียงตามลำดับความหนาแน่น: แมลงวัน -> ยุง -> มด -> แมลงอื่นๆ)
3. **การจัดรูปแบบตัวหนา (Bold)**: ห้ามใส่ตัวหนาทั้งหมดหรือทั้งประโยค และห้ามทำตัวหนาที่หมายเลขเครื่องดักหรือตัวเลขปริมาณแมลง ให้เน้นตัวหนาเฉพาะชื่อของแผนก (เช่น **แผนกโรงฆ่า**) และชื่อชนิดของแมลง (เช่น **แมลงวัน**, **ยุง**, **มด**, **แมลงอื่นๆ**) เท่านั้น!
4. **หลีกเลี่ยงวงเล็บซ้อนวงเล็บ**: ห้ามใส่วงเล็บซ้อนวงเล็บหรือวงเล็บหลายชั้นที่ทำให้อ่านยาก ให้ใช้ข้อความปกติระบุปริมาณ เช่น "จำนวน X ตัว" แทนการเขียน "(X ตัว)" ต่อท้ายตำแหน่งที่มีวงเล็บอยู่แล้ว
5. **จุดส่งท้ายของมาตรการป้องกัน**:
    - หากแมลงชนิดนั้นมียอดรวมตรวจพบเป็น 0 ตัว ให้เขียนคีย์เวิร์ดสรุปท้ายสุด: "เพื่อรักษาและคงจำนวนสถิติของ [ระบุชนิดแมลงที่เป็น 0] ให้เป็น 0 ตัวต่อไป"
    - หากตรวจพบแมลงชนิดนั้นๆ (ยอดสะสม > 0) ให้ใช้คีย์เวิร์ด: "เพื่อลดจำนวนของ [ระบุชนิดแมลงที่พบ] ในพื้นที่ปฏิบัติงาน"
    (ตัวอย่าง: "ทั้งนี้ เพื่อรักษาและคงจำนวนสถิติของ **ยุง** ให้เป็น 0 ตัวต่อไป และเพื่อลดจำนวนของ **แมลงวัน** ในพื้นที่ปฏิบัติงานอย่างมีประสิทธิภาพสูงสุด")

6. **บริบทและแนวทางป้องกันเพิ่มเติมตามแผนก (ต้องใช้ข้อความเหล่านี้ให้สอดคล้องกัน):**
${Object.entries(DEPT_SPECIAL_CONTEXTS).map(([d, ctx]) => `- แผนก **${d}**: ${ctx}`).join('\n')}

7. **สาเหตุของปัญหาแยกตามหมายเลขเครื่องดักจับ (หากหมายเลขเหล่านี้อยู่ในสถิติด้านบน ให้ดึงคำอธิบายเหล่านี้มาวิเคราะห์สาเหตุ):**
- เครื่องดักหมายเลข **10**: ติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิดปิด ประตูเป็นประจำ
- เครื่องดักหมายเลข **12**: เชื่อมต่อกับคอกพักสุกร
- เครื่องดักหมายเลข **17**, **20**, **21**: อาจเนื่องจากเป็นทางเข้า-ออกของพนักงาน เชื่อมต่อกับนอกพื้นที่การผลิตเป็นโถงทางเดิน และห้องแต่งตัว ซึ่งอาจทำให้มีแมลงบินเข้าพื้นที่ได้
- เครื่องดักหมายเลข **28**: อาจเนื่องจากบริเวณดังกล่าวเชื่อมต่อกับนอกพื้นที่การผลิต ใกล้กับประตูทางเข้า-ออก พื้นที่การผลิต อาจทำให้แมลงบินเข้าสู่พื้นที่การผลิตได้
- เครื่องดักหมายเลข **1**: ติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ

8. **มาตรการแก้ไขและป้องกันเพิ่มเติมตามประเภทแมลงที่พบ (ต้องระบุสิ่งเหล่านี้ลงในข้อแนะนำเมื่อตรวจพบแมลงชนิดนั้นๆ):**
- เมื่อพบ **แมลงวัน**: ทำความสะอาดพื้นที่ลดการสะสมของแหล่งอาหาร
- เมื่อพบ **ยุง**: รีดน้ำขังออกจากพื้นที่แจ้งบริษัทกำจัดแมลงเข้าบริการ
- เมื่อพบ **มด**: ตรวจสอบหาสาเหตุที่แท้จริงลดการสะสมของแหล่งอาหาร
- เมื่อพบ **แมลงอื่นๆ**: ปิดม่าน ปิดประตูทุกครั้ง
- เมื่อพบ **แมลงหวี่**: รีดน้ำขังออกจากพื้นที่ปิดม่านประตูทุกครั้ง
- เมื่อพบ **ผีเสื้อ**: ปิดม่าน ปิดประตูทุกครั้ง

9. **ข้อความหลัก คีย์เวิร์ดหลักสำคัญที่ต้องปรากฏในส่วนแนวทางการป้องกัน:**
"ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้"

10. **หลีกเลี่ยงคำแนะนำที่ซ้ำซ้อนและจำกัดความยาว (ความยาวดั้งเดิมดีที่สุด)**: 
- หากคำแนะนำหลักรายแผนกหรือคีย์เวิร์ดหลักมีการสั่งให้ "ปิดม่าน", "ตรวจม่าน", หรือ "ปิดประตู" แล้ว **ห้ามเขียนประโยคแนะนำปิดม่านหรือปิดประตูซ้ำซ้อนเข้ามาอีก**
- ห้ามเขียนคำแนะนำเรียงต่อกันยาวๆ หรือมีวงเล็บลิสต์รายการยาวๆ ให้เลือกเฉพาะคำแนะนำเสริมของแมลงตัวที่สำคัญที่สุดเพียง 1 ข้อที่สอดคล้องกับสถิติแมลงสะสม เช่น "และควรทำความสะอาดพื้นที่ลดการสะสมของแหล่งอาหาร" หรือ "และควรรีดน้ำขังออกจากพื้นที่" มาเชื่อมต่อกันในประโยคหลักเดียวอย่างสละสลวยเป็นธรรมชาติ

กรุณาเขียนรายงานสรุปนี้เป็นภาษาไทยที่กระชับ สละสลวย และป้อนข้อความที่เป็นมิตรกับหน้างาน`;
    }

    const fullPrompt = `${systemPrompt}\n\n${dataDescription}`;

    let reportText = '';
    let isAiGenerated = false;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(fullPrompt);
        reportText = result.response.text();
        isAiGenerated = true;
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to local summary:', geminiError);
        reportText = generateLocalSummary(deptName, month, year, summaryByType, summaryByTrap, othersBreakdown);
      }
    } else {
      reportText = generateLocalSummary(deptName, month, year, summaryByType, summaryByTrap, othersBreakdown);
    }

    return NextResponse.json({
      report: reportText,
      isDemo: isDemoMode,
      isAiGenerated: isAiGenerated
    });

  } catch (error) {
    console.error('API Error in analyze route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during AI analysis' },
      { status: 500 }
    );
  }
}

// Generate matching local report if API is offline
function generateLocalSummary(deptName, month, year, summaryByType, summaryByTrap, othersBreakdown = {}) {
  const beYear = parseInt(year, 10) + 543;
  const yearText = `${beYear}`;
  
  if (deptName === 'ALL') {
    return `### 📊 รายงานวิเคราะห์แนวโน้มแมลงในภาพรวมโรงงาน (ระบบประมวลผลภายใน)

จากการประมวลผลข้อมูลรอบเวลา ${month !== 'ALL' ? `เดือน ${month}` : 'ประจำปี'} ${yearText} พบข้อสังเกตและแนวทางแก้ไขด้านสุขาภิบาลดังนี้:

*   **วิเคราะห์แนวโน้มภาพรวม:** ชนิดแมลงที่ตรวจพบสะสมสูงที่สุดคือ **แมลงวัน** และจุดที่มีระดับตรวจจับสะสมนำโดดเด่นคือโซนด้านนอกอาคารลานโหลดสินค้า
*   **แผนกเฝ้าระวัง:** แผนก **หน้าร้านใหม่** มีประตูเปิด-ปิดบ่อยรับสินค้าจากภายนอก— เสี่ยงแมลงจากภายนอก แนะนำให้ตรวจม่าน ปิดม่านพลาสติกทุกครั้ง
*   **มาตรการแนะนำ:** ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้`;
  }
  
  const cleanTrap = (name) => {
    if (!name) return '-';
    return name.replace(/.*:\s*/, '');
  };

  const trapCount = Object.keys(summaryByTrap).length;
  let insectSummary = '';

  if (trapCount === 1) {
    // Single trap department
    const trapNo = Object.keys(summaryByTrap)[0];
    const counts = summaryByTrap[trapNo];
    insectSummary = `เครื่องดักแมลงหมายเลข ${trapNo} ตรวจพบ **แมลงวัน** จำนวน ${counts.flies} ตัว, **ยุง** จำนวน ${counts.mosquitoes} ตัว, **มด** จำนวน ${counts.ants} ตัว และ **แมลงอื่นๆ** จำนวน ${counts.others} ตัว`;
  } else {
    // Multiple traps department
    let maxFliesVal = -1, maxFliesTrap = '-';
    let maxMosquitoesVal = -1, maxMosquitoesTrap = '-';
    let maxAntsVal = -1, maxAntsTrap = '-';
    let maxOthersVal = -1, maxOthersTrap = '-';
    
    Object.entries(summaryByTrap).forEach(([trapNo, counts]) => {
      if (counts.flies > maxFliesVal) { maxFliesVal = counts.flies; maxFliesTrap = trapNo; }
      if (counts.mosquitoes > maxMosquitoesVal) { maxMosquitoesVal = counts.mosquitoes; maxMosquitoesTrap = trapNo; }
      if (counts.ants > maxAntsVal) { maxAntsVal = counts.ants; maxAntsTrap = trapNo; }
      if (counts.others > maxOthersVal) { maxOthersVal = counts.others; maxOthersTrap = trapNo; }
    });
    
    if (maxFliesVal > 0) {
      insectSummary += `เครื่องดักแมลงหมายเลข ${maxFliesTrap} พบ **แมลงวัน** ติดมากที่สุด จำนวน ${maxFliesVal} ตัว `;
    } else {
      insectSummary += `ไม่พบ **แมลงวัน** ในเครื่องดักแมลงใดๆ ในแผนกนี้ `;
    }
    
    if (maxMosquitoesVal > 0) {
      insectSummary += `เครื่องดักแมลงหมายเลข ${maxMosquitoesTrap} พบ **ยุง** ติดมากที่สุด จำนวน ${maxMosquitoesVal} ตัว `;
    } else {
      insectSummary += `ไม่พบ **ยุง** ในเครื่องดักแมลงใดๆ ในแผนกนี้ `;
    }
    
    if (maxAntsVal > 0 || maxOthersVal > 0) {
      const parts = [];
      if (maxAntsVal > 0) parts.push(`**มด** ในเครื่องดักหมายเลข ${maxAntsTrap} จำนวน ${maxAntsVal} ตัว`);
      if (maxOthersVal > 0) parts.push(`**แมลงอื่นๆ** ในเครื่องดักหมายเลข ${maxOthersTrap} จำนวน ${maxOthersVal} ตัว`);
      insectSummary += `และตรวจพบ ${parts.join(' และ')} ติดสะสมนำโดดเด่นตามลำดับ`;
    } else {
      insectSummary += `และไม่พบ **มด** หรือ **แมลงอื่นๆ** ติดสะสม`;
    }
  }
  
  // 1. Root Cause based on Trap numbers and department
  let rootCause = '';
  const trapNumbers = Object.keys(summaryByTrap);
  const trapCauses = [];
  
  trapNumbers.forEach(trap => {
    const numStr = trap.replace(/^\D+/g, '');
    if (numStr === '10') trapCauses.push('เนื่องจากติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิดปิด ประตูเป็นประจำ');
    else if (numStr === '12') trapCauses.push('เนื่องจากเชื่อมต่อกับคอกพักสุกร');
    else if (['17', '20', '21'].includes(numStr)) {
      if (!trapCauses.some(c => c.includes('ทางเข้า-ออกของพนักงาน'))) {
        trapCauses.push('อาจเนื่องจากเป็นทางเข้า-ออกของพนักงาน เชื่อมต่อกับนอกพื้นที่การผลิตเป็นโถงทางเดิน และห้องแต่งตัว ซึ่งอาจทำให้มีแมลงบินเข้าพื้นที่ได้');
      }
    }
    else if (numStr === '28') trapCauses.push('อาจเนื่องจากบริเวณดังกล่าวเชื่อมต่อกับนอกพื้นที่การผลิต ใกล้กับประตูทางเข้า-ออก พื้นที่การผลิต อาจทำให้แมลงบินเข้าสู่พื้นที่การผลิตได้');
    else if (numStr === '1') trapCauses.push('เนื่องจากติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ');
  });

  if (trapCauses.length > 0) {
    rootCause = trapCauses.join(' ');
  } else {
    // Fallback to department default root cause
    if (deptName === 'โรงฆ่า') {
      rootCause = `เนื่องจากบริเวณผลิตโรงฆ่าเป็นทางผ่านและปฏิบัติงานสัญจรบ่อยครั้ง ทำให้เสี่ยงต่อการเปิดประตูทิ้งไว้`;
    } else if (deptName === 'หน้าร้านใหม่') {
      rootCause = `เนื่องจากมีประตูเปิด-ปิดบ่อยรับสินค้าจากภายนอก— เสี่ยงแมลงจากภายนอก`;
    } else if (deptName === 'ตัดแต่ง') {
      rootCause = `เนื่องจากการสัญจรผ่านประตูเข้าออกของพนักงานอย่างต่อเนื่อง`;
    } else if (deptName === 'โหลด' || deptName === 'เฟส 6' || deptName === 'โหลด เฟส 5') {
      rootCause = `เนื่องจากติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ`;
    } else {
      rootCause = `เนื่องจากการสัญจรผ่านประตูเข้าออกของพนักงานและวัตถุดิบเป็นระยะ`;
    }
  }
  
  // 2. Insect recommendations (Select only the most relevant, non-redundant recommendation to avoid duplication and keep original length)
  let rec = '';
  if (summaryByType['Flies (แมลงวัน)'] > 0) {
    rec = 'ทำความสะอาดพื้นที่ลดการสะสมของแหล่งอาหาร';
  } else if (summaryByType['Mosquitoes (ยุง)'] > 0) {
    rec = 'รีดน้ำขังออกจากพื้นที่แจ้งบริษัทกำจัดแมลงเข้าทำบริการ';
  } else if (summaryByType['Ants (มด)'] > 0) {
    rec = 'ตรวจสอบหาสาเหตุที่แท้จริงลดการสะสมของแหล่งอาหาร';
  } else if (summaryByType['Others (แมลงอื่นๆ)'] > 0) {
    let hasMidge = false;
    if (othersBreakdown) {
      Object.keys(othersBreakdown).forEach(k => {
        if (k.includes('แมลงหวี่')) hasMidge = true;
      });
    }
    if (hasMidge) {
      rec = 'รีดน้ำขังออกจากพื้นที่';
    }
  }

  // 3. Goal Phrase closing logic
  const zeroInsects = [];
  const positiveInsects = [];
  
  if ((summaryByType['Flies (แมลงวัน)'] || 0) === 0) zeroInsects.push('**แมลงวัน**'); else positiveInsects.push('**แมลงวัน**');
  if ((summaryByType['Mosquitoes (ยุง)'] || 0) === 0) zeroInsects.push('**ยุง**'); else positiveInsects.push('**ยุง**');
  if ((summaryByType['Ants (มด)'] || 0) === 0) zeroInsects.push('**มด**'); else positiveInsects.push('**มด**');
  if ((summaryByType['Others (แมลงอื่นๆ)'] || 0) === 0) zeroInsects.push('**แมลงอื่นๆ**'); else positiveInsects.push('**แมลงอื่นๆ**');
  
  let goalPhrase = '';
  if (zeroInsects.length > 0 && positiveInsects.length > 0) {
    goalPhrase = `เพื่อรักษาและคงจำนวนสถิติของ ${zeroInsects.join(', ')} ให้เป็น 0 ตัวต่อไป และเพื่อลดจำนวนของ ${positiveInsects.join(', ')} ในพื้นที่ปฏิบัติงาน`;
  } else if (zeroInsects.length > 0) {
    goalPhrase = `เพื่อรักษาและคงจำนวนสถิติของ ${zeroInsects.join(', ')} ให้เป็น 0 ตัวต่อไป`;
  } else if (positiveInsects.length > 0) {
    goalPhrase = `เพื่อลดจำนวนของ ${positiveInsects.join(', ')} ในพื้นที่ปฏิบัติงาน`;
  }

  // Combine recommendations
  let recsText = '';
  let keyKeyword = 'ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน เพื่อป้องกันไม่ให้แมลงบินต่างๆ บินเข้าสู่พื้นที่การผลิตได้';
  
  if (deptName === 'หน้าร้านใหม่') {
    keyKeyword = 'ดังนั้นเนื่องจากมีประตูเปิด-ปิดบ่อยรับสินค้าจากภายนอก— เสี่ยงแมลงจากภายนอก จึงควรตรวจม่าน ปิดม่านพลาสติกทุกครั้ง';
  } else if (deptName === 'ตัดแต่ง') {
    keyKeyword = 'ดังนั้นควรเน้นทำความสะอาดพื้นที่การผลิตให้สะอาดอยู่เสมอ ปิดม่านประตูทุกครั้ง ภายหลังจากใช้งาน';
  } else if (deptName === 'โหลด' || deptName === 'เฟส 6' || deptName === 'โหลด เฟส 5') {
    keyKeyword = 'ดังนั้นเนื่องจากติดตั้งอยู่ในจุดที่ใกล้กับลานโหลดสินค้า ซึ่งมีการเปิด-ปิด ประตูเป็นประจำ จึงควรระมัดระวังปิดม่านและประตูทุกครั้ง';
  }

  if (rec) {
    recsText = `${keyKeyword} และควร${rec} ทั้งนี้ ${goalPhrase}อย่างมีประสิทธิภาพสูงสุด`;
  } else {
    recsText = `${keyKeyword} ทั้งนี้ ${goalPhrase}อย่างมีประสิทธิภาพสูงสุด`;
  }

  return `จากการตรวจนับจำนวนแมลง ของทีม **${deptName}** ประจำเดือน ${month} ${yearText} พบว่า ${insectSummary} ${rootCause} ${recsText}`;
}

// Fallback mock dataset
function generateMockDataForAnalysis() {
  const data = [];
  const depts = [
    'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'เฟส 6', 
    'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
  ];
  const insects = ['Flies (แมลงวัน)', 'Mosquitoes (ยุง)', 'Ants (มด)', 'Others (แมลงอื่นๆ)'];
  const today = new Date();
  
  for (let m = 3; m >= 0; m--) {
    const date = new Date(today.getFullYear(), today.getMonth() - m, 15);
    const dateString = date.toISOString().split('T')[0];
    
    depts.forEach((dept) => {
      insects.forEach((insect) => {
        let base = 2;
        if (dept === 'โรงฆ่า' && insect.includes('Flies')) base = 10;
        else if (dept === 'หน้าร้านใหม่' && insect.includes('Flies')) base = 8;
        else if (dept === 'หมูบด' && insect.includes('Ants')) base = 14;
        else if (dept === 'Slice ผลิต' && insect.includes('Mosquitoes')) base = 7;
        
        const count = Math.max(0, base + Math.floor(Math.random() * 6) - 2);
        
        data.push({
          inspected_at: dateString,
          area: `${dept}: (00) ตำแหน่งจำลอง`,
          insect_type: insect,
          count: count
        });
      });
    });
  }
  return data;
}
