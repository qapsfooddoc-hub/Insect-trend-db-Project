import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isConfigured = isSupabaseConfigured();
    const backupPayload = {
      backup_timestamp: new Date().toISOString(),
      system_name: 'P.S. Food Products - Smart Pest Monitoring System',
      version: '2.0.0',
      database_source: isConfigured ? 'supabase' : 'local_fallback',
      tables: {}
    };

    if (!isConfigured) {
      return NextResponse.json({
        ...backupPayload,
        message: 'Supabase not configured; returning baseline structure'
      });
    }

    // 1. users_profile
    try {
      const { data: users, error } = await supabase.from('users_profile').select('*');
      backupPayload.tables.users_profile = error ? [] : (users || []);
    } catch (e) {
      backupPayload.tables.users_profile = [];
    }

    // 2. insect_inspections (Fetch all with pagination if needed)
    try {
      const { count } = await supabase
        .from('insect_inspections')
        .select('*', { count: 'exact', head: true });

      let allInspections = [];
      const pageSize = 1000;
      const total = count || 0;

      for (let start = 0; start < total; start += pageSize) {
        const { data } = await supabase
          .from('insect_inspections')
          .select('*')
          .order('inspected_at', { ascending: true })
          .range(start, start + pageSize - 1);
        if (data) allInspections = allInspections.concat(data);
      }
      backupPayload.tables.insect_inspections = allInspections;
    } catch (e) {
      backupPayload.tables.insect_inspections = [];
    }

    // 3. monthly_reports
    try {
      const { data: monthlyReports, error } = await supabase.from('monthly_reports').select('*');
      backupPayload.tables.monthly_reports = error ? [] : (monthlyReports || []);
    } catch (e) {
      backupPayload.tables.monthly_reports = [];
    }

    // 4. fm_lizard_monthly_summary
    try {
      const { data: lizards, error } = await supabase.from('fm_lizard_monthly_summary').select('*');
      backupPayload.tables.lizards_summary = error ? [] : (lizards || []);
    } catch (e) {
      backupPayload.tables.lizards_summary = [];
    }

    // 5. fm_cockroach_monthly_summary
    try {
      const { data: cockroaches, error } = await supabase.from('fm_cockroach_monthly_summary').select('*');
      backupPayload.tables.cockroaches_summary = error ? [] : (cockroaches || []);
    } catch (e) {
      backupPayload.tables.cockroaches_summary = [];
    }

    // 6. fm_rodent_monthly_summary
    try {
      const { data: rodents, error } = await supabase.from('fm_rodent_monthly_summary').select('*');
      backupPayload.tables.rodents_summary = error ? [] : (rodents || []);
    } catch (e) {
      backupPayload.tables.rodents_summary = [];
    }

    // 7. fm_line_walk_monthly_summary
    try {
      const { data: lineWalk, error } = await supabase.from('fm_line_walk_monthly_summary').select('*');
      backupPayload.tables.line_walk_summary = error ? [] : (lineWalk || []);
    } catch (e) {
      backupPayload.tables.line_walk_summary = [];
    }

    return NextResponse.json(backupPayload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (err) {
    console.error('API Error in /api/backup:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
