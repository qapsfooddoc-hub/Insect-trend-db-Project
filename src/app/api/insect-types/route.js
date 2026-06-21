import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'src', 'lib', 'insect_types.json');

// Helper to read local JSON cache
function readLocalCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local cache:', err);
  }
  return [];
}

// Helper to write local JSON cache
function writeLocalCache(types) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(types, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local cache:', err);
  }
}

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      const cache = readLocalCache();
      return NextResponse.json({ data: cache.map(name => ({ name })), isDemo: true });
    }

    const { data, error } = await supabase
      .from('insect_types')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase insect_types query failed, falling back to local cache:', error.message);
      const cache = readLocalCache();
      return NextResponse.json({ data: cache.map(name => ({ name })), isDemo: true, error: error.message });
    }

    return NextResponse.json({ data, isDemo: false });
  } catch (error) {
    console.error('API Error in GET insect-types:', error);
    const cache = readLocalCache();
    return NextResponse.json({ data: cache.map(name => ({ name })), isDemo: true, error: error.message });
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const cleanName = name.trim();

    if (!isSupabaseConfigured()) {
      const cache = readLocalCache();
      if (!cache.includes(cleanName)) {
        cache.push(cleanName);
        writeLocalCache(cache);
      }
      return NextResponse.json({ success: true, name: cleanName, isDemo: true });
    }

    // Try to insert in Supabase
    // To handle unique constraint we check existence first
    const { data: existing } = await supabase
      .from('insect_types')
      .select('name')
      .eq('name', cleanName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, name: cleanName, isDemo: false, message: 'Already exists' });
    }

    const { error } = await supabase.from('insect_types').insert([{ name: cleanName }]);
    if (error) {
      console.warn('Supabase insert failed, saving to local cache:', error.message);
      const cache = readLocalCache();
      if (!cache.includes(cleanName)) {
        cache.push(cleanName);
        writeLocalCache(cache);
      }
      return NextResponse.json({ success: true, name: cleanName, isDemo: true, warning: error.message });
    }

    return NextResponse.json({ success: true, name: cleanName, isDemo: false });
  } catch (error) {
    console.error('API Error in POST insect-types:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
