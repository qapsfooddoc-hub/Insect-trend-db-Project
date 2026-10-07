const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { LINE_WALK_ALL_DATA } = require('../src/lib/data/lineWalkData');
const { RODENT_STATIONS } = require('../src/lib/data/rodentData');

// Load environment credentials from .env.local
const envPath = path.join(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PHASE_5_AREAS = [
  'โรงฆ่า', 'ผ่าซาก', 'ห้องเครื่องในขาว', 'ห้องเครื่องในแดง', 'ห้องแพ็คเครื่องใน', 
  'เผาขา', 'ตัดแต่ง', 'โหลดสินค้า', 'รอบโรงฆ่า/ตัดแต่ง/ชั้นใต้ดิน', 
  'ชั้นใต้ดิน เฟส 5', 'ชั้นใต้ดิน เฟส 5.1', 'เฟส 5.1'
];

const WAREHOUSE_3_AREAS = [
  'คลังสินค้า 3', 'รอบคลังสินค้า 3', 'Slice ชั้น 1 (ทางเข้าไลน์)', 
  'Slice เลื่อย/Slice เตรียม', 'Slice 4.1/Pack Slice/MDC', 'Slice ชั้น 2', 
  'Slice ชั้น 3', 'รอบอาคารคลังสินค้า 4', 'อาคาร A', 'อาคาร C'
];

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

async function seedLineWalk() {
  console.log('Seeding fm_line_walk_monthly_summary...');
  const years = ['2567', '2568', '2569'];
  const records = [];

  for (const year of years) {
    const yearData = LINE_WALK_ALL_DATA[year];
    if (!yearData) continue;

    for (const month of MONTH_NAMES) {
      const rows = yearData[month] || [];
      const isApproved = year === '2567' || year === '2568' || (year === '2569' && ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน'].includes(month));

      // Separate rows into Phase 5 and Warehouse 3
      const calcPhase = (phaseName, targetAreas) => {
        const pRows = rows.filter(r => targetAreas.includes(r['แผนก/พื้นที่']));
        let mos = 0, fli = 0, cock = 0, ant = 0, rat = 0, rTrap = 0, oth = 0;
        pRows.forEach(r => {
          mos += Number(r['ยุง']) || 0;
          fli += Number(r['แมลงวัน']) || 0;
          cock += Number(r['แมลงสาบ']) || 0;
          ant += Number(r['มด']) || 0;
          rat += Number(r['หนู']) || 0;
          rTrap += Number(r['กรงดักหนู']) || 0;
          oth += Number(r['อื่นๆ']) || 0;
        });
        const grand = mos + fli + cock + ant + rat + rTrap + oth;
        return {
          record_year: year,
          record_month: month,
          building_phase: phaseName,
          mosquitoes_total: mos,
          flies_total: fli,
          cockroaches_total: cock,
          ants_total: ant,
          rats_total: rat,
          rat_traps_total: rTrap,
          others_total: oth,
          grand_total: grand,
          area_records: pRows,
          inspector_name: 'สายันห์ ทองม้วน',
          reviewer_name: 'พัชรินทร์ สงวนพงษ์',
          status: isApproved ? 'Approved' : 'Draft'
        };
      };

      records.push(calcPhase('อาคารเฟส 5', PHASE_5_AREAS));
      records.push(calcPhase('อาคารคลังสินค้า 3', WAREHOUSE_3_AREAS));
    }
  }

  console.log(`Inserting ${records.length} Line Walk records...`);
  const { data, error } = await supabase
    .from('fm_line_walk_monthly_summary')
    .upsert(records, { onConflict: 'record_year, record_month, building_phase' })
    .select();

  if (error) {
    console.error('Error seeding line walk:', error);
  } else {
    console.log(`Successfully upserted ${data?.length || records.length} line walk records!`);
  }
}

async function seedRodents() {
  console.log('Seeding fm_rodent_monthly_summary for 2567, 2568, and 2569...');
  const years = ['2567', '2568', '2569'];
  const records = [];

  const defaultStations = {};
  RODENT_STATIONS.forEach(st => {
    defaultStations[st.id] = { count: 0, bait: 'ปกติ', status: 'พร้อมใช้งาน' };
  });

  for (const year of years) {
    for (const month of MONTH_NAMES) {
      // ม.ค. 2567 - ส.ค. 2569: Approved (พบ 0 ตัว)
      let isApproved = true;
      if (year === '2569' && ['กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].includes(month)) {
        isApproved = false;
      }

      records.push({
        record_year: year,
        record_month: month,
        total_stations: 10,
        total_rats_found: 0,
        stations_with_activity: 0,
        station_totals: defaultStations,
        bait_replaced_count: 0,
        glue_replaced_count: 0,
        inspector_name: 'สายันห์ ทองม้วน',
        reviewer_name: 'พัชรินทร์ สงวนพงษ์',
        status: isApproved ? 'Approved' : 'Draft'
      });
    }
  }

  console.log(`Inserting ${records.length} Rodent records...`);
  const { data, error } = await supabase
    .from('fm_rodent_monthly_summary')
    .upsert(records, { onConflict: 'record_year, record_month' })
    .select();

  if (error) {
    console.error('Error seeding rodents:', error);
  } else {
    console.log(`Successfully upserted ${data?.length || records.length} rodent records!`);
  }
}

async function run() {
  await seedLineWalk();
  await seedRodents();
  console.log('All historical seedings complete!');
}

run().catch(console.error);
