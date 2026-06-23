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

    // 2. Parse request body for filters
    let deptName = 'ALL';
    let month = 'ALL';
    let quarter = 'ALL';
    let year = '2026';

    try {
      const body = await request.json();
      if (body.deptName) deptName = body.deptName;
      if (body.month) month = body.month;
      if (body.quarter) quarter = body.quarter;
      if (body.year) year = String(body.year);
    } catch (e) {
      // Ignore body parse error (use defaults)
    }

    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    // Filter by Year
    let filteredData = rawData.filter(record => {
      if (!record.inspected_at) return false;
      const date = new Date(record.inspected_at);
      const itemYear = String(date.getFullYear());
      return itemYear === year;
    });

    // Filter by Month or Quarter
    if (month !== 'ALL') {
      filteredData = filteredData.filter(record => {
        const date = new Date(record.inspected_at);
        const itemMonthName = thaiMonths[date.getMonth()];
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
        const date = new Date(record.inspected_at);
        const itemMonthName = thaiMonths[date.getMonth()];
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

    filteredData.forEach(record => {
      const { dept } = parseArea(record.area);
      
      // By Dept
      summaryByDept[dept] = (summaryByDept[dept] || 0) + record.count;

      // By Insect Type
      const type = record.insect_type;
      summaryByType[type] = (summaryByType[type] || 0) + record.count;

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

    // 4. Construct Prompt
    let periodText = '';
    if (month !== 'ALL') periodText = `เดือน ${month} ปี ${year}`;
    else if (quarter !== 'ALL') periodText = `ไตรมาส ${quarter} ปี ${year}`;
    else periodText = `ปี ${year}`;

    let dataDescription = '';
    let systemPrompt = '';

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
      `;

      systemPrompt = `คุณคือผู้เชี่ยวชาญด้านสุขาภิบาลและความปลอดภัยในโรงงานอุตสาหกรรมผลิตอาหาร (HACCP/GMP Specialist) 
ช่วยวิเคราะห์ข้อมูลแมลงที่พบในโรงงานตามสถิติด้านบนนี้:
1. วิเคราะห์แนวโน้มแผนกปฏิบัติการที่วิกฤตที่สุด โดยเฉพาะแผนก "หน้าร้านใหม่" ที่ต้องแยกวิเคราะห์ต่างหากไม่รวมกับ "โรงฆ่า"
2. ประเมินความเสี่ยงและสาเหตุของแมลงแต่ละประเภท (มด, แมลงวัน, ยุง, แมลงอื่นๆ) และแหล่งกำเนิด
3. เสนอมาตรการแก้ไขเร่งด่วนและการป้องกันในอนาคต ตามข้อกำหนดสุขลักษณะโรงงาน GMP/HACCP เป็นข้อๆ อย่างกระชับและปฏิบัติได้จริง

กฎสำคัญด้านการจัดรูปแบบข้อความ:
- อย่าใช้ตัวหนามากเกินไป (ห้ามทำตัวหนาทั้งประโยค) ให้ใช้ตัวหนาเฉพาะชื่อแผนก (เช่น **แผนกหน้าร้านใหม่**) และชนิดแมลง (เช่น **แมลงวัน**, **ยุง**, **มด**, **แมลงอื่นๆ**) เท่านั้น
- เขียนสรุปเป็นภาษาไทยในรูปแบบ Markdown ที่สวยงาม อ่านง่าย และเป็นมืออาชีพ`;
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
        reportText = generateLocalSummary(deptName, month, year, summaryByType, summaryByTrap);
      }
    } else {
      reportText = generateLocalSummary(deptName, month, year, summaryByType, summaryByTrap);
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
function generateLocalSummary(deptName, month, year, summaryByType, summaryByTrap) {
  const beYear = parseInt(year, 10) + 543;
  const yearText = `${beYear}`;
  
  if (deptName === 'ALL') {
    return `### 📊 รายงานวิเคราะห์แนวโน้มแมลงในภาพรวมโรงงาน (ระบบประมวลผลภายใน)

จากการประมวลผลข้อมูลรอบเวลา ${month !== 'ALL' ? `เดือน ${month}` : 'ประจำปี'} ${yearText} พบข้อสังเกตและแนวทางแก้ไขด้านสุขาภิบาลดังนี้:

*   **วิเคราะห์แนวโน้มภาพรวม:** ชนิดแมลงที่ตรวจพบสะสมสูงที่สุดคือ **แมลงวัน** และจุดที่มีระดับตรวจจับสะสมนำโดดเด่นคือโซนด้านนอกอาคารลานโหลดสินค้า
*   **แผนกเฝ้าระวัง:** แผนก **หน้าร้านใหม่** มีสถิติตรวจจับรวมเพิ่มขึ้นสัมพันธ์กับการปิดระบบม่านลมบริเวณช่องเทียบรถบรรทุก แนะนำให้เจ้าหน้าที่ผู้รับผิดชอบกำชับผู้ใช้ทางตรวจสอบประสิทธิภาพของบานม่านริ้วพลาสติกให้อยู่ในตำแหน่งปิดทับซ้อนกันมิดชิด
*   **มาตรการแนะนำ:** กำหนดตารางทำความสะอาดครั้งใหญ่ Deep Clean และฉีดพ่นสเปรย์ไล่มดสัปดาห์ละ 2 ครั้งเพื่อควบคุมสภาพแวดล้อม`;
  }
  
  // Department specific summary
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
  
  let rootCause = '';
  if (deptName === 'โรงฆ่า') {
    rootCause = `เนื่องจากบริเวณดังกล่าวอยู่ใกล้ไลน์ผลิตและจุดขนถ่ายซากดิบ/เครื่องใน รวมถึงมีทางเดินเข้าออกระหว่างอาคารที่สัญจรบ่อยครั้ง ทำให้เสี่ยงต่อการเปิดประตูทิ้งไว้ดึงดูด **แมลงวัน** และ **แมลงอื่นๆ**`;
  } else if (deptName === 'หน้าร้านใหม่' || deptName === 'โหลด') {
    rootCause = `เนื่องจากพื้นที่เชื่อมต่อโดยตรงกับบริเวณลานโหลดสินค้าภายนอกอาคารโรงงาน ซึ่งมีการเปิด-ปิดประตูลานโหลดสินค้าและม่านริ้วพลาสติกเป็นประจำในจังหวะเทียบรถขนส่ง ทำให้แมลงจากภายนอกบินเข้ามาได้ง่าย`;
  } else if (deptName === 'หมูบด') {
    rootCause = `เนื่องจากเป็นพื้นที่บดและคัดเกรดเนื้อสัตว์ ซึ่งมักจะมีเศษเนื้อสัตว์และกลิ่นดึงดูด **มด** เข้ามาสะสมตามฐานโครงสร้างเครื่องจักรหรือซอกกำแพงอับสายตา`;
  } else if (deptName === 'Slice ผลิต' || deptName === 'เฟส 6') {
    rootCause = `เนื่องจากประตูทางเข้าออกไลน์ผลิตฝั่งนี้เปิดปิดบ่อย และม่านริ้วพลาสติกกั้นอุณหภูมิบางส่วนเริ่มเกิดการบิดเบี้ยวเสื่อมสภาพ ทำให้ **ยุง** และแมลงบินจากภายนอกลอดช่องลมเข้ามาเกาะติดเครื่องดัก`;
  } else {
    rootCause = `เนื่องจากการสัญจรผ่านประตูเข้าออกของพนักงานและรถขนถ่ายตะกร้า/อุปกรณ์การผลิตอย่างต่อเนื่องระหว่างวันทำงาน`;
  }
  
  // recommendations closing sentence logic:
  const zeroInsects = [];
  const positiveInsects = [];
  
  if ((summaryByType['Flies (แมลงวัน)'] || 0) === 0) zeroInsects.push('**แมลงวัน**'); else positiveInsects.push('**แมลงวัน**');
  if ((summaryByType['Mosquitoes (ยุง)'] || 0) === 0) zeroInsects.push('**ยุง**'); else positiveInsects.push('**ยุง**');
  if ((summaryByType['Ants (มด)'] || 0) === 0) zeroInsects.push('**มด**'); else positiveInsects.push('**มด**');
  if ((summaryByType['Others (แมลงอื่นๆ)'] || 0) === 0) zeroInsects.push('**แมลงอื่นๆ**'); else positiveInsects.push('**แมลงอื่นๆ**');
  
  let goalPhrase = '';
  if (zeroInsects.length > 0 && positiveInsects.length > 0) {
    goalPhrase = ` ทั้งนี้ เพื่อรักษาและคงจำนวนสถิติของ ${zeroInsects.join(', ')} ให้เป็น 0 ตัวต่อไป และเพื่อลดจำนวนของ ${positiveInsects.join(', ')} ในพื้นที่ปฏิบัติงานอย่างมีประสิทธิภาพสูงสุด`;
  } else if (zeroInsects.length > 0) {
    goalPhrase = ` ทั้งนี้ เพื่อรักษาและคงจำนวนสถิติ of ${zeroInsects.join(', ')} ให้เป็น 0 ตัวต่อไปอย่างมีประสิทธิภาพสูงสุด`;
  } else if (positiveInsects.length > 0) {
    goalPhrase = ` ทั้งนี้ เพื่อลดจำนวนของ ${positiveInsects.join(', ')} ในพื้นที่ปฏิบัติงานอย่างมีประสิทธิภาพสูงสุด`;
  }
  
  let recommendations = '';
  if (deptName === 'โรงฆ่า') {
    recommendations = `ดังนั้น ควรเน้นทำความสะอาดเศษซากเนื้อและคราบน้ำเลือดในไลน์ผลิตให้หมดจด ทำความสะอาดห้องน้ำไม่ให้มีน้ำขัง ปิดม่านประตูทุกครั้งหลังการใช้งาน และสลับสีกระดาษกาวดักจับตามวงรอบที่กำหนด${goalPhrase}`;
  } else if (deptName === 'หน้าร้านใหม่' || deptName === 'โหลด') {
    recommendations = `ดังนั้น ควรกำชับให้พนักงานรูดปิดม่านริ้วพลาสติกทุกครั้งหลังเสร็จสิ้นการเทียบรถ ทำความสะอาดพื้นลานโหลดสินค้าไม่ให้มีสิ่งสกปรกสะสม และตรวจสอบแรงลมของม่านอากาศหน้าประตูทางเข้าหลัก${goalPhrase}`;
  } else if (deptName === 'หมูบด') {
    recommendations = `ดังนั้น ควรเพิ่มความถี่การล้างทำความสะอาดครั้งใหญ่ (Deep Clean) โดยใช้แรงดันน้ำร้อนพ่นขจัดคราบไขมันตกค้างตามฐานโครงแท่นเครื่องจักร และตรวจสอบซอกอุดรอยแยกตามขอบผนังปูนอย่างสม่ำเสมอ${goalPhrase}`;
  } else if (deptName === 'Slice ผลิต' || deptName === 'เฟส 6') {
    recommendations = `ดังนั้น ควรตรวจสอบเปลี่ยนม่านริ้วพลาสติกที่บิดงอชำรุดให้อยู่ในสภาพสมบูรณ์ปิดมิดชิด ทำความสะอาดคราบน้ำขังในรางระบายน้ำเพื่อป้องกันแหล่งเพาะพันธุ์ และประสานงานทีม Pest Control เข้าฉีดพ่นจุดเสี่ยง${goalPhrase}`;
  } else {
    recommendations = `ดังนั้น ควรเน้นการทำความสะอาดอุปกรณ์และรางลำเลียง ตรวจสอบม่านริ้วพลาสติกทางเข้าออก และเน้นย้ำมาตรฐานความสะอาด GMP/HACCP แก่พนักงานทุกคน${goalPhrase}`;
  }
  
  return `จากการตรวจนับจำนวนแมลง ของทีม **${deptName}** ประจำเดือน ${month} ${yearText} พบว่า ${insectSummary} ${rootCause} ${recommendations}`;
}

// Fallback mock dataset
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
