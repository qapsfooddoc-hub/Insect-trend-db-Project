import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const TABLE_MAP = {
  lizards: 'fm_lizard_monthly_summary',
  cockroaches: 'fm_cockroach_monthly_summary',
  rodents: 'fm_rodent_monthly_summary',
  'line-walk': 'fm_line_walk_monthly_summary',
};

// GET: Retrieve monthly summary records
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'lizards';
    const year = searchParams.get('year') || '2569';
    const month = searchParams.get('month');

    const tableName = TABLE_MAP[type];
    if (!tableName) {
      return NextResponse.json({ error: `Invalid pest type: ${type}` }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [], isDemo: true, message: 'Supabase credentials not configured' });
    }

    let query = supabase
      .from(tableName)
      .select('*')
      .eq('record_year', year);

    if (month) {
      query = query.eq('record_month', month);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      // Table may not have been created yet in Supabase
      return NextResponse.json({
        data: [],
        isDemo: true,
        tablePending: true,
        message: `Table ${tableName} not ready yet in Supabase: ${error.message}`
      });
    }

    return NextResponse.json(
      { data: data || [], isDemo: false, count: data?.length || 0 },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err) {
    console.error('API Error in GET /api/pest-records:', err);
    return NextResponse.json({ data: [], error: err.message, isDemo: true });
  }
}

// POST: Save or update monthly summary record (Compact / Totals-Only Mode)
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, year, month, ...payload } = body;

    const tableName = TABLE_MAP[type];
    if (!tableName) {
      return NextResponse.json({ error: `Invalid pest type: ${type}` }, { status: 400 });
    }

    if (!year || !month) {
      return NextResponse.json({ error: 'Missing required fields: year and month' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        isDemo: true,
        message: 'Demo mode: saved in memory / localStorage only (Supabase not connected).'
      });
    }

    // Build upsert payload based on pest type
    let dbRecord = {
      record_year: String(year),
      record_month: String(month),
      updated_at: new Date().toISOString()
    };

    if (type === 'lizards') {
      const totals = payload.totals || {};
      dbRecord = {
        ...dbRecord,
        station_1_total: Number(totals[1] || totals['1'] || 0),
        station_2_total: Number(totals[2] || totals['2'] || 0),
        station_3_total: Number(totals[3] || totals['3'] || 0),
        station_4_total: Number(totals[4] || totals['4'] || 0),
        station_5_total: Number(totals[5] || totals['5'] || 0),
        station_6_total: Number(totals[6] || totals['6'] || 0),
        daily_records: payload.daily_records || {},
        reporter_name: payload.reporter_name || payload.reporter || '',
        reviewer_name: payload.reviewer_name || payload.reviewer || '',
        notes: payload.notes || '',
        status: payload.status || 'Draft'
      };
    } else if (type === 'cockroaches') {
      dbRecord = {
        ...dbRecord,
        grand_total: Number(payload.grand_total || payload.total || 0),
        zone_1_total: Number(payload.zone_1_total || 0),
        zone_2_total: Number(payload.zone_2_total || 0),
        zone_3_total: Number(payload.zone_3_total || 0),
        zone_4_total: Number(payload.zone_4_total || 0),
        zone_5_total: Number(payload.zone_5_total || 0),
        zone_6_total: Number(payload.zone_6_total || 0),
        point_totals: payload.point_totals || {},
        daily_records: payload.daily_records || {},
        reporter_name: payload.reporter_name || payload.reporter || '',
        reviewer_name: payload.reviewer_name || payload.reviewer || '',
        notes: payload.notes || '',
        status: payload.status || 'Draft'
      };
    } else if (type === 'rodents') {
      dbRecord = {
        ...dbRecord,
        total_stations: Number(payload.total_stations || 10),
        total_rats_found: Number(payload.total_rats_found || payload.count || 0),
        stations_with_activity: Number(payload.stations_with_activity || 0),
        station_totals: payload.station_totals || payload.records || {},
        bait_replaced_count: Number(payload.bait_replaced_count || 0),
        glue_replaced_count: Number(payload.glue_replaced_count || 0),
        inspector_name: payload.inspector_name || payload.inspector || '',
        reviewer_name: payload.reviewer_name || payload.reviewer || '',
        notes: payload.notes || '',
        status: payload.status || 'Draft'
      };
    } else if (type === 'line-walk') {
      dbRecord = {
        ...dbRecord,
        building_phase: payload.building_phase || 'อาคารเฟส 5',
        mosquitoes_total: Number(payload.mosquitoes_total || 0),
        flies_total: Number(payload.flies_total || 0),
        cockroaches_total: Number(payload.cockroaches_total || 0),
        ants_total: Number(payload.ants_total || 0),
        rats_total: Number(payload.rats_total || 0),
        rat_traps_total: Number(payload.rat_traps_total || 0),
        others_total: Number(payload.others_total || 0),
        grand_total: Number(payload.grand_total || 0),
        area_records: payload.area_records || [],
        inspector_name: payload.inspector_name || payload.inspector || '',
        reviewer_name: payload.reviewer_name || payload.reviewer || '',
        notes: payload.notes || '',
        status: payload.status || 'Draft'
      };
    }

    // Determine conflict target
    const onConflictColumns = type === 'line-walk'
      ? 'record_year, record_month, building_phase'
      : 'record_year, record_month';

    const { data, error } = await supabase
      .from(tableName)
      .upsert(dbRecord, { onConflict: onConflictColumns })
      .select();

    if (error) {
      console.warn(`Supabase upsert into ${tableName} warning:`, error.message);
      return NextResponse.json({
        success: false,
        error: error.message,
        tablePending: true,
        message: `Please run the migration SQL in Supabase SQL editor to create ${tableName}.`
      }, { status: 200 }); // Return 200 so UI continues smoothly with fallback
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || dbRecord,
      message: `Successfully saved ${type} summary to Supabase!`
    });
  } catch (err) {
    console.error('API Error in POST /api/pest-records:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
