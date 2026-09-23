import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [], isDemo: true });
    }

    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .order('report_month', { ascending: false });

    if (error) {
      console.warn('Supabase monthly_reports query failed:', error.message);
      return NextResponse.json({ data: [], isDemo: true, error: error.message });
    }

    return NextResponse.json(
      { data: data || [], isDemo: false },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('API Error in GET monthly_reports:', error);
    return NextResponse.json({ data: [], isDemo: true, error: error.message });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      report_month, 
      department = 'ALL', 
      dept_head_signed, 
      dept_head_date, 
      qa_manager_signed, 
      qa_manager_date,
      ai_analysis_text 
    } = body;

    if (!report_month) {
      return NextResponse.json({ success: false, error: 'Missing report_month' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, isDemo: true });
    }

    // Find if report already exists for this month and department
    const { data: existing } = await supabase
      .from('monthly_reports')
      .select('id, dept_head_signed, qa_manager_signed')
      .eq('report_month', report_month)
      .eq('department', department)
      .maybeSingle();

    const payload = {
      report_month,
      department,
      ...(dept_head_signed !== undefined && { dept_head_signed }),
      ...(dept_head_date !== undefined && { dept_head_date }),
      ...(qa_manager_signed !== undefined && { qa_manager_signed }),
      ...(qa_manager_date !== undefined && { qa_manager_date }),
      ...(ai_analysis_text !== undefined && { ai_analysis_text })
    };

    let result;
    if (existing) {
      result = await supabase
        .from('monthly_reports')
        .update(payload)
        .eq('id', existing.id)
        .select();
    } else {
      result = await supabase
        .from('monthly_reports')
        .insert([payload])
        .select();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('API Error in POST monthly_reports:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
