import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Mock/Fallback users in case Supabase is not configured or query fails
const DEFAULT_MOCK_USERS = [
  {
    id: 'mock-1',
    full_name: 'สมชาย รักดี',
    username: 'emp001',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'หน้าร้านใหม่',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-2',
    full_name: 'สมศักดิ์ มั่นคง',
    username: 'emp002',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'โรงฆ่า',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-3',
    full_name: 'สมพร ขยันยิ่ง',
    username: 'emp003',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'ตัดแต่ง',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-4',
    full_name: 'สมควร ทำงานดี',
    username: 'emp004',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'โหลด เฟส 5',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-5',
    full_name: 'สมยศ งดงาม',
    username: 'emp005',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'เฟส 6',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-6',
    full_name: 'สมชัย เกรียงไกร',
    username: 'emp006',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'คลัง3',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-7',
    full_name: 'สมปอง รักชาติ',
    username: 'emp007',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'หมูบด',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-8',
    full_name: 'สมเกียรติ พูลผล',
    username: 'emp008',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'Slice ผลิต',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-9',
    full_name: 'สมศักดิ์ศรี ศรีสุข',
    username: 'emp009',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'อนามัย',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-10',
    full_name: 'สมปราชญ์ รอบรู้',
    username: 'emp010',
    password: 'password123',
    role: 'Department Supervisor',
    department: 'ล้างตะกร้า',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-11',
    full_name: 'สมศรี มีสุข',
    username: 'emp011',
    password: 'password123',
    role: 'QA Manager',
    department: 'ฝ่ายประกันคุณภาพระบบ',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-12',
    full_name: 'แอดมิน สูงสุด',
    username: 'admin',
    password: 'adminpassword',
    role: 'Admin',
    department: 'ไอที',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-13',
    full_name: 'สมบัติ ใจดี',
    username: 'emp013',
    password: 'password123',
    role: 'Operator',
    department: 'โหลด เฟส 5',
    created_at: new Date().toISOString()
  }
];

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: DEFAULT_MOCK_USERS, isDemo: true });
    }

    const { data, error } = await supabase
      .from('users_profile')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase users_profile query failed, falling back to demo users:', error.message);
      return NextResponse.json({ data: DEFAULT_MOCK_USERS, isDemo: true, error: error.message });
    }

    return NextResponse.json({ data: data || [], isDemo: false });
  } catch (error) {
    console.error('API Error in GET users_profile:', error);
    return NextResponse.json({ data: DEFAULT_MOCK_USERS, isDemo: true, error: error.message });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, id, full_name, username, password, role, department } = body;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Demo Mode: Operation simulated successfully.', isDemo: true });
    }

    // Insert Action
    if (action === 'create') {
      const { data, error } = await supabase
        .from('users_profile')
        .insert([{ full_name, username, password, role, department }])
        .select();

      if (error) {
        throw error;
      }
      return NextResponse.json({ success: true, data, isDemo: false });
    }

    // Update Action
    if (action === 'update') {
      if (!id) {
        return NextResponse.json({ error: 'User ID is required for update' }, { status: 400 });
      }
      const { data, error } = await supabase
        .from('users_profile')
        .update({ full_name, username, password, role, department })
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }
      return NextResponse.json({ success: true, data, isDemo: false });
    }

    // Delete Action
    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'User ID is required for delete' }, { status: 400 });
      }
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
      return NextResponse.json({ success: true, isDemo: false });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });

  } catch (error) {
    console.error('API Error in POST users_profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
