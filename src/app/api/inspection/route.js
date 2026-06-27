import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Helper to normalize Buddhist Era (BE) dates to Christian Era (CE)
const normalizeDate = (dStr) => {
  if (!dStr || typeof dStr !== 'string') return dStr;
  const parts = dStr.split('-');
  if (parts.length === 3) {
    let year = parseInt(parts[0], 10);
    if (year > 2400) {
      year -= 543;
      return `${year}-${parts[1]}-${parts[2]}`;
    }
  }
  return dStr;
};

// Generate rich mock data for presentation if DB is not set up yet
function generateMockData() {
  const data = [];
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
        let base = 0;
        if (insect.includes('Flies')) base = 4;
        else if (insect.includes('Mosquitoes')) base = 6;
        else if (insect.includes('Ants')) base = 8;
        else base = 2;
        
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

// In-memory global store for Demo Mode persistence
if (!global.mockInspections) {
  global.mockInspections = generateMockData();
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: global.mockInspections, isDemo: true });
    }

    const { data, error } = await supabase
      .from('insect_inspections')
      .select('*')
      .order('inspected_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Normalize dates of returned records just in case
    const normalizedData = (data || []).map(r => ({
      ...r,
      inspected_at: normalizeDate(r.inspected_at)
    }));

    return NextResponse.json({ data: normalizedData, isDemo: false });
  } catch (error) {
    console.error('API Error in fetching data:', error);
    // If Supabase fails, fall back to global mock inspections
    return NextResponse.json({ data: global.mockInspections, isDemo: true, error: error.message });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, weekDate, rows, department } = body;

    const normalizedWeekDate = normalizeDate(weekDate);

    // 1. DELETE ACTION
    if (action === 'delete') {
      if (!normalizedWeekDate || !department) {
        return NextResponse.json(
          { error: 'Missing required fields for deletion (weekDate, department).' },
          { status: 400 }
        );
      }

      if (!isSupabaseConfigured()) {
        // Delete from in-memory global store
        if (department === 'ALL') {
          global.mockInspections = global.mockInspections.filter(r => 
            r.inspected_at !== normalizedWeekDate
          );
        } else {
          global.mockInspections = global.mockInspections.filter(r => 
            !(r.inspected_at === normalizedWeekDate && r.area.startsWith(`${department}: `))
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Demo Mode: Inspection records deleted successfully in-memory.',
          isDemo: true
        });
      }

      let deleteQuery = supabase
        .from('insect_inspections')
        .delete()
        .eq('inspected_at', normalizedWeekDate);

      if (department !== 'ALL') {
        deleteQuery = deleteQuery.like('area', `${department}: %`);
      }

      const { error } = await deleteQuery;

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully deleted inspection records.',
        isDemo: false
      });
    }

    // 2. UPDATE ACTION
    if (action === 'update') {
      if (!normalizedWeekDate || !rows || !Array.isArray(rows)) {
        return NextResponse.json(
          { error: 'Missing required fields for update (weekDate, rows).' },
          { status: 400 }
        );
      }

      const insectTypes = ['flies', 'mosquitoes', 'ants', 'others'];
      const insectDisplayNames = {
        flies: 'Flies (แมลงวัน)',
        mosquitoes: 'Mosquitoes (ยุง)',
        ants: 'Ants (มด)',
        others: 'Others (แมลงอื่นๆ)'
      };

      if (!isSupabaseConfigured()) {
        // Update in-memory global store
        for (const row of rows) {
          const areaName = row.area?.trim();
          if (!areaName) continue;

          for (const type of insectTypes) {
            const countValue = parseInt(row[type], 10);
            const count = isNaN(countValue) ? 0 : Math.max(0, countValue);
            const insectType = insectDisplayNames[type] || type;
            const details = type === 'others' ? (row.othersDetails || []) : null;

            const existingIdx = global.mockInspections.findIndex(r => 
              r.inspected_at === normalizedWeekDate &&
              r.area === areaName &&
              r.insect_type === insectType
            );

            if (existingIdx !== -1) {
              global.mockInspections[existingIdx].count = count;
              global.mockInspections[existingIdx].details = details;
            } else {
              global.mockInspections.push({
                id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                inspected_at: normalizedWeekDate,
                area: areaName,
                insect_type: insectType,
                count: count,
                details: details,
                created_at: new Date().toISOString()
              });
            }
          }
        }

        return NextResponse.json({
          success: true,
          message: 'Demo Mode: Inspection records updated successfully in-memory.',
          isDemo: true
        });
      }

      // Supabase Update
      for (const row of rows) {
        const areaName = row.area?.trim();
        if (!areaName) continue;

        for (const type of insectTypes) {
          const countValue = parseInt(row[type], 10);
          const count = isNaN(countValue) ? 0 : Math.max(0, countValue);
          const insectType = insectDisplayNames[type] || type;
          const details = type === 'others' ? (row.othersDetails || []) : null;

          // Check if record exists
          const { data: existing, error: selectError } = await supabase
            .from('insect_inspections')
            .select('id')
            .eq('inspected_at', normalizedWeekDate)
            .eq('area', areaName)
            .eq('insect_type', insectType)
            .maybeSingle();

          if (selectError) throw selectError;

          if (existing) {
            // Update
            const { error: updateError } = await supabase
              .from('insect_inspections')
              .update({ count, details })
              .eq('id', existing.id);
            if (updateError) throw updateError;
          } else {
            // Insert
            const { error: insertError } = await supabase
              .from('insect_inspections')
              .insert({
                inspected_at: normalizedWeekDate,
                area: areaName,
                insect_type: insectType,
                count,
                details
              });
            if (insertError) throw insertError;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully updated inspection records.',
        isDemo: false
      });
    }

    // 3. DEFAULT: CREATE ACTION
    if (!weekDate || !rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Invalid input. Please provide weekDate and rows array.' },
        { status: 400 }
      );
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
        const countValue = parseInt(row[type], 10);
        const count = isNaN(countValue) ? 0 : Math.max(0, countValue);
        
        records.push({
          inspected_at: normalizedWeekDate,
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

    if (!isSupabaseConfigured()) {
      // Push to in-memory global store
      records.forEach(rec => {
        global.mockInspections.push({
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          ...rec,
          created_at: new Date().toISOString()
        });
      });

      return NextResponse.json({
        success: true,
        message: 'Demo Mode: Data parsed and processed successfully (Simulated Insert).',
        insertedCount: records.length,
        isDemo: true,
        data: records
      });
    }

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
    console.error('API Error in inspection route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
