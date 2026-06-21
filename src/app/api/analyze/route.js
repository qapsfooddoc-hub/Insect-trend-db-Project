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
  
  if (areaString.includes(': ')) {
    const parts = areaString.split(': ');
    return { dept: parts[0], location: parts[1] };
  }
  
  // Fallback check if it starts with department keywords
  const depts = [
    'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด', 'เฟส 6', 
    'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
  ];
  for (const d of depts) {
    if (areaString.startsWith(d)) {
      return { 
        dept: d, 
        location: areaString.replace(d, '').replace(/^\s*[:\-]\s*/, '').trim() 
      };
    }
  }
  
  return { dept: 'อื่นๆ', location: areaString };
}

export async function POST(request) {
  try {
    let rawData = [];
    let isDemoMode = false;

    // 1. Get raw data either from Supabase or generate mock data
    if (isSupabaseConfigured()) {
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

    // 2. Aggregate data by department and type
    const summaryByDept = {};
    const summaryByType = {};

    rawData.forEach(record => {
      const { dept } = parseArea(record.area);
      
      // Aggregate by Department
      if (!summaryByDept[dept]) {
        summaryByDept[dept] = 0;
      }
      summaryByDept[dept] += record.count;

      // Aggregate by Insect Type
      if (!summaryByType[record.insect_type]) {
        summaryByType[record.insect_type] = 0;
      }
      summaryByType[record.insect_type] += record.count;
    });

    // 3. Construct prompt
    const dataDescription = `
ข้อมูลสถิติการตรวจพบแมลงในโรงงานแยกตามแผนกปฏิบัติการ (สรุปยอดสะสม):
${Object.entries(summaryByDept).map(([dept, count]) => `- แผนก ${dept}: พบแมลงสะสมรวม ${count} ตัว`).join('\n')}

แยกตามประเภทของแมลงที่พบสะสม:
${Object.entries(summaryByType).map(([type, count]) => `- ${type}: พบสะสม ${count} ตัว`).join('\n')}
    `;

    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านสุขาภิบาลและความปลอดภัยในโรงงานอุตสาหกรรมผลิตอาหาร (HACCP/GMP Specialist) 
ช่วยวิเคราะห์ข้อมูลแมลงที่พบในโรงงานตามสถิติด้านบนนี้:
1. วิเคราะห์แนวโน้มแผนกปฏิบัติการที่วิกฤตที่สุด (Critical Departments & Key Trends) โดยเฉพาะแผนก "หน้าร้านใหม่" ที่ต้องแยกวิเคราะห์ต่างหากไม่รวมกับ "โรงฆ่า"
2. ประเมินความเสี่ยงและสาเหตุของแมลงแต่ละประเภท (มด, แมลงวัน, ยุง, แมลงอื่นๆ) และแหล่งกำเนิด
3. เสนอมาตรการแก้ไขเร่งด่วนและการป้องกันในอนาคต ตามข้อกำหนดสุขลักษณะโรงงาน GMP/HACCP เป็นข้อๆ อย่างกระชับและปฏิบัติได้จริง

กรุณาเขียนรายงานเป็นภาษาไทยในรูปแบบ Markdown ที่สวยงาม อ่านง่าย และเป็นมืออาชีพ`;

    const fullPrompt = `${systemPrompt}\n\n${dataDescription}`;

    // 4. Generate Report (AI or Mock)
    let reportText = '';
    let isAiGenerated = false;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(fullPrompt);
        reportText = result.response.text();
        isAiGenerated = true;
      } catch (geminiError) {
        console.error('Gemini API call failed, falling back to mock report:', geminiError);
        reportText = generateMockAiReport(summaryByDept, summaryByType);
      }
    } else {
      reportText = generateMockAiReport(summaryByDept, summaryByType);
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

// Generate rich mock AI report for visual presentation
function generateMockAiReport(summaryByDept, summaryByType) {
  // Find highest department
  let maxDept = '';
  let maxDeptCount = -1;
  Object.entries(summaryByDept).forEach(([dept, count]) => {
    if (count > maxDeptCount) {
      maxDeptCount = count;
      maxDept = dept;
    }
  });

  let maxType = '';
  let maxTypeCount = -1;
  Object.entries(summaryByType).forEach(([type, count]) => {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      maxType = type;
    }
  });

  return `### 📊 รายงานวิเคราะห์แนวโน้มแมลงแยกตามแผนกและมาตรการควบคุมสุขาภิบาล (Simulated AI Report)

จากการประมวลผลสถิติแมลงสะสมตามแผนกปฏิบัติงานและประเภทตรวจพบ พบข้อสังเกตและแผนการแก้ไขเชิงป้องกันตามหลักเกณฑ์ **GMP / HACCP** ดังนี้:

#### 1. วิเคราะห์จุดวิกฤตรายแผนก (Critical Department Analysis)
*   **แผนกที่มีปริมาณแมลงสะสมสูงสุด:** แผนก **${maxDept}** (พบสะสมรวม **${maxDeptCount} ตัว**) ถือเป็นจุดวิกฤตที่ต้องได้รับการตรวจสอบสภาพทางกายภาพของโครงสร้างอาคารและระบบม่านริ้ว/ม่านอากาศโดยด่วน
*   **การวิเคราะห์แผนกหน้าร้านใหม่:** แผนก **หน้าร้านใหม่** ซึ่งแยกออกมาจากพื้นที่โรงฆ่า มีสถิติตรวจจับแมลงที่สำคัญ เนื่องจากใกล้กับบริเวณด้านนอกอาคาร ทำให้เสี่ยงต่อการรั่วไหลจากภายนอก จำเป็นต้องทบทวนความเร็วลมม่านอากาศประตูโหลด
*   **ชนิดแมลงที่ตรวจพบนัยสำคัญสูงสุด:** **${maxType}** (พบรวมสะสม **${maxTypeCount} ตัว**)

#### 2. สาเหตุและที่มาที่คาดการณ์แยกตามประเภท (Root Cause Analysis)
*   **แมลงวัน (Flies):** เกิดจากการชำรุดของระบบป้องกันบริเวณประตูเข้า-ออกหลัก หรือถังขยะภายนอกอาคารขาดการทำความสะอาดบ่อยครั้ง
*   **ยุง (Mosquitoes):** บ่งบอกว่ารอบข้างบริเวณโรงงานมีแหล่งน้ำขัง หรือประตูทางเดิน/ทางหนีไฟปิดไม่สนิทในช่วงเวลากลางคืน
*   **มด (Ants):** เกิดจากเศษวัตถุดิบอาหาร คราบน้ำมัน หรือเศษผลิตภัณฑ์ตกค้างตามซอกมุมสายพานที่เข้าไม่ถึง
*   **แมลงอื่นๆ (Others):** เช่น มอด หรือผีเสื้อกลางคืน มักปนเปื้อนมากับบรรจุภัณฑ์กระดาษ หรือแป้งวัตถุดิบที่รับเข้าคลังสินค้า

#### 3. มาตรการปฏิบัติการควบคุมเชิงป้องกัน (GMP/HACCP Action Plan)
1.  **สำหรับแผนก ${maxDept}:** ให้ดำเนินการทำความสะอาดครั้งใหญ่ (Deep Cleaning) ร่วมกับการฉีดพ่นสารเคมีควบคุมภายนอกระยะ 5 เมตร
2.  **สำหรับแผนกหน้าร้านใหม่:** ติดตั้งแผ่นกาวดักแมลงเพิ่มเติมบริเวณจุดโหลดสินค้า และตรวจสอบไม่ให้ประตูทางเชื่อมเปิดค้างทิ้งไว้
3.  **ควบคุมด่านกายภาพ:** ตรวจสอบรอยแตกร้าวระหว่างแผ่นผนังกับพื้นคอนกรีต ซ่อมแซมรอยรั่วรอบระบบท่อส่งลม
4.  **ประสานงาน Pest Control:** ทบทวนแผนการสลับตัวยาเคมีกำจัดมดและแมลงสาบประจำไตรมาส

---
*หมายเหตุ: นี่เป็นรายงานจำลองเนื่องจากไม่ได้ระบุคีย์สำหรับเชื่อมต่อไปยัง API ของ Gemini 1.5 Flash จริง*`;
}

// Generate simple mock data for internal fallback queries
function generateMockDataForAnalysis() {
  const data = [];
  const depts = [
    'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด', 'เฟส 6', 
    'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
  ];
  const insects = ['Flies (แมลงวัน)', 'Mosquitoes (ยุง)', 'Ants (มด)', 'Others (แมลงอื่นๆ)'];
  const today = new Date();
  
  for (let m = 3; m >= 0; m--) {
    const date = new Date(today.getFullYear(), today.getMonth() - m, 15);
    const dateString = date.toISOString().split('T')[0];
    
    depts.forEach((dept) => {
      insects.forEach((insect) => {
        // Generate mock count based on department profiles
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
