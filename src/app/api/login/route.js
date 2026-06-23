import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' },
        { status: 400 }
      );
    }

    // Fallback if Supabase is not configured
    if (!isSupabaseConfigured()) {
      const mockUsers = [
        { id: 'mock-12', full_name: 'แอดมิน สูงสุด', username: 'admin', password: 'adminpassword', role: 'Admin', department: 'ไอที' },
        { id: 'mock-1', full_name: 'สมชาย รักดี', username: 'emp001', password: 'password123', role: 'Department Supervisor', department: 'หน้าร้านใหม่' },
        { id: 'mock-13', full_name: 'สมบัติ ใจดี', username: 'emp013', password: 'password123', role: 'Operator', department: 'โหลด เฟส 5' },
        { id: 'mock-11', full_name: 'สมศรี มีสุข', username: 'emp011', password: 'password123', role: 'QA Manager', department: 'ฝ่ายประกันคุณภาพระบบ' }
      ];
      const found = mockUsers.find(u => u.username === username && u.password === password);
      if (found) {
        return NextResponse.json({
          success: true,
          user: {
            id: found.id,
            full_name: found.full_name,
            username: found.username,
            role: found.role,
            department: found.department
          },
          isDemo: true
        });
      }
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (โหมดเดโม่)' },
        { status: 401 }
      );
    }

    // Query Supabase users_profile
    const { data: user, error } = await supabase
      .from('users_profile')
      .select('id, full_name, username, role, department')
      .eq('username', username.trim())
      .eq('password', password)
      .maybeSingle();

    if (error) {
      console.error('Supabase login query error:', error);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูลกรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      isDemo: false
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดภายในระบบ' },
      { status: 500 }
    );
  }
}
