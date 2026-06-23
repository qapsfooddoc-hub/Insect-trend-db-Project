import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { weekDate, rows } = body;

    // Validate inputs
    if (!weekDate || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide weekDate and rows array.' },
        { status: 400 }
      )
    }

    const records = [];
    const insectTypes = ['flies', 'mosquitoes', 'ants', 'others'];
    const insectDisplayNames = {
      flies: 'Flies (แมลงวัน)',
      mosquitoes: 'Mosquitoes (ยุง)',
      ants: 'Ants (มด)',
      others: 'Others (แมลงอื่นๆ)'
    };

    for (const row of rows) {
      const areaName = row.area?.trim();
      if (!areaName) continue;

      for (const type of insectTypes) {
        // Parse value, if empty or invalid default to 0
        const countValue = parseInt(row[type], 10);
        const count = isNaN(countValue) ? 0 : Math.max(0, countValue);
        
        records.push({
          inspected_at: weekDate,
          area: areaName,
          insect_type: insectDisplayNames[type] || type,
          count: count,
          details: type === 'others' ? (row.othersDetails || []) : null
        });
      }
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: 'No valid insect records found in payload.' },
        { status: 400 }
      );
    }

    // Fallback: If Supabase is not configured, run in Demo Mode
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured. Simulating bulk insert for: ', records);
      return NextResponse.json({
        success: true,
        message: 'Demo Mode: Data parsed and processed successfully (Simulated Insert).',
        insertedCount: records.length,
        isDemo: true,
        data: records
      });
    }

    // Database Bulk Insert
    const { error } = await supabase.from('insect_inspections').insert(records);

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: error.message || 'Database insertion failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully inserted raw weekly inspection records.',
      insertedCount: records.length,
      isDemo: false
    });

  } catch (error) {
    console.error('API Error in bulk insert:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // If Supabase not configured, return mock historical data
    if (!isSupabaseConfigured()) {
      const mockData = generateMockData();
      return NextResponse.json({ data: mockData, isDemo: true });
    }

    const { data, error } = await supabase
      .from('insect_inspections')
      .select('*')
      .order('inspected_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ data, isDemo: false });
  } catch (error) {
    console.error('API Error in fetching data:', error);
    return NextResponse.json({ data: generateMockData(), isDemo: true, error: error.message });
  }
}

// Generate rich mock data for presentation if DB is not set up yet
function generateMockData() {
  const data = [];
  
  // Use a subset of the 33 departments for cleaner charts, or use all 33
  const areas = [
    'โรงฆ่า: (07) ลานโหลดสินค้าหน้าร้าน',
    'ตัดแต่ง: (03) ห้องตัดแต่ง บริเวณทางหนีไฟ',
    'โหลด เฟส 5: (01) ลานโหลดของตัดแต่งและ Makro',
    'หมูบด: (17) ห้องหมูบด บริเวณทางเข้า-ออก ติดตู้ F5',
    'Slice ผลิต: (22) ห้อง Slice เครื่องใน ทางเข้า-ออก ฝั่ง Chill 3'
  ];
  
  const insects = ['Flies (แมลงวัน)', 'Mosquitoes (ยุง)', 'Ants (มด)', 'Others (แมลงอื่นๆ)'];
  
  const today = new Date();
  for (let m = 5; m >= 0; m--) {
    const date = new Date(today.getFullYear(), today.getMonth() - m, 15);
    const dateString = date.toISOString().split('T')[0];
    
    areas.forEach((area) => {
      insects.forEach((insect) => {
        // Generate values
        let base = 0;
        if (insect.includes('Flies')) base = 4;
        else if (insect.includes('Mosquitoes')) base = 6;
        else if (insect.includes('Ants')) base = 8;
        else base = 2; // Others
        
        const randomFactor = Math.floor(Math.random() * 6) - 2;
        const count = Math.max(0, base + randomFactor);
        
        data.push({
          id: `${m}-${area.substring(0, 10)}-${insect.substring(0, 3)}`,
          inspected_at: dateString,
          area,
          insect_type: insect,
          count,
          details: insect.includes('Others') ? [
            { name: 'ผีเสื้อ', count: Math.max(1, Math.floor(count / 2)) },
            { name: 'แมลงสาบ', count: Math.max(0, Math.ceil(count / 2)) }
          ] : null,
          created_at: new Date().toISOString()
        });
      });
    });
  }
  return data;
}
