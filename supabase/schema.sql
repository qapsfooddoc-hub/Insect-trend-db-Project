-- ==============================================================================
-- บริษัท พี.เอส.ฟู้ด โปรดักส์ จำกัด (P.S. FOOD PRODUCTS CO., LTD.)
-- SUPABASE DATABASE SCHEMA: SMART PEST MONITORING SYSTEM
-- รูปแบบโครงสร้างฐานข้อมูลสำหรับการบันทึกสัตว์รบกวน (เน้นบันทึกเฉพาะผลรวมเพื่อประหยัดพื้นที่)
-- มาตรฐาน: GMP / HACCP Documentation Standards
-- ==============================================================================

-- เปิดใช้งาน UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- [ส่วนที่ 1] ตารางระบบเดิมที่มีอยู่แล้วบน SUPABASE (ห้ามแก้ไข / ห้ามแตะต้อง)
-- 1. users_profile (ข้อมูลผู้ใช้งานและสิทธิ์ระบบ)
-- 2. insect_inspections (ข้อมูลตรวจนับแมลง 33 จุดตรวจ FM-QC-08/03 - ห้ามเปลี่ยนเด็ดขาด)
-- 3. monthly_reports (รายงานสรุปผู้บริหารและการอนุมัติรายเดือน)
-- ==============================================================================

-- ==============================================================================
-- [ส่วนที่ 2] ตารางใหม่: จิ้งจก (FM-QC-08/04) — แบบบันทึกเฉพาะผลรวม (Compact Summary)
-- ประหยัดพื้นที่: จากเดิม 186 แถว/เดือน เหลือเพียง 1 แถว/เดือน (12 แถว/ปี)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fm_lizard_monthly_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_year VARCHAR(10) NOT NULL,              -- ปี พ.ศ. เช่น '2569'
    record_month VARCHAR(30) NOT NULL,             -- ชื่อเดือน เช่น 'มกราคม', 'สิงหาคม'
    
    -- ผลรวมตรวจพบรายสถานี 1 ถึง 6 (ตัว)
    station_1_total INT DEFAULT 0 CHECK (station_1_total >= 0),
    station_2_total INT DEFAULT 0 CHECK (station_2_total >= 0),
    station_3_total INT DEFAULT 0 CHECK (station_3_total >= 0),
    station_4_total INT DEFAULT 0 CHECK (station_4_total >= 0),
    station_5_total INT DEFAULT 0 CHECK (station_5_total >= 0),
    station_6_total INT DEFAULT 0 CHECK (station_6_total >= 0),
    
    -- ยอดรวมทุกสถานี (คำนวณอัตโนมัติ)
    grand_total INT GENERATED ALWAYS AS (
        station_1_total + station_2_total + station_3_total + 
        station_4_total + station_5_total + station_6_total
    ) STORED,
    
    -- รายละเอียดรายวัน 31 วัน (บันทึกเป็น JSON ก้อนเดียวในแถวเดิม ไม่เปลืองแถวฐานข้อมูล)
    daily_records JSONB DEFAULT '{}'::jsonb,
    
    -- ข้อมูลการลงชื่อและสถานะ
    reporter_name VARCHAR(150),                    -- ผู้รายงานตรวจนับ
    reviewer_name VARCHAR(150),                    -- ผู้ทวนสอบ (QA Supervisor)
    notes TEXT,                                    -- ข้อสังเกต / หมายเหตุ
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_lizard_summary UNIQUE (record_year, record_month)
);

-- ==============================================================================
-- [ส่วนที่ 3] ตารางใหม่: บ้านแมลงสาบ (FM-QC-08/05) — แบบบันทึกเฉพาะผลรวม (Compact Summary)
-- ประหยัดพื้นที่: จากเดิม 713 แถว/เดือน เหลือเพียง 1 แถว/เดือน (12 แถว/ปี)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fm_cockroach_monthly_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_year VARCHAR(10) NOT NULL,              -- ปี พ.ศ. เช่น '2569'
    record_month VARCHAR(30) NOT NULL,             -- ชื่อเดือน เช่น 'มกราคม', 'สิงหาคม'
    
    grand_total INT DEFAULT 0 CHECK (grand_total >= 0), -- ยอดรวมทั้ง 23 จุดตรวจ
    
    -- ผลรวมตรวจพบแยกตาม 6 โซนหลัก
    zone_1_total INT DEFAULT 0 CHECK (zone_1_total >= 0), -- โซน 1: โรงอาหารตัดแต่งห้องที่ 1 (จุด 1-8)
    zone_2_total INT DEFAULT 0 CHECK (zone_2_total >= 0), -- โซน 2: โรงอาหารตัดแต่งห้องที่ 2 (จุด 9-12)
    zone_3_total INT DEFAULT 0 CHECK (zone_3_total >= 0), -- โซน 3: ใต้ตู้ล็อกเกอร์ ตัดแต่ง (จุด 13-16)
    zone_4_total INT DEFAULT 0 CHECK (zone_4_total >= 0), -- โซน 4: ห้องน้ำหญิง ตัดแต่ง (จุด 17-19)
    zone_5_total INT DEFAULT 0 CHECK (zone_5_total >= 0), -- โซน 5: ห้องน้ำชาย ตัดแต่ง (จุด 20-22)
    zone_6_total INT DEFAULT 0 CHECK (zone_6_total >= 0), -- โซน 6: ห้องน้ำหัวหน้า ตัดแต่ง (จุด 23)
    
    -- ผลรวมสะสมรายจุด 23 จุด (JSON รูปแบบ: {"1": 0, "2": 5, ... "23": 0})
    point_totals JSONB DEFAULT '{}'::jsonb,
    
    -- ข้อมูลรายวัน 31 วัน (ถ้าต้องการเก็บรายละเอียดเพิ่มเติมในก้อนเดียว)
    daily_records JSONB DEFAULT '{}'::jsonb,
    
    reporter_name VARCHAR(150),
    reviewer_name VARCHAR(150),
    notes TEXT,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_cockroach_summary UNIQUE (record_year, record_month)
);

-- ==============================================================================
-- [ส่วนที่ 4] ตารางใหม่: หนูและสัตว์พาหะ สโตร์คลังสินค้า (Compact Summary)
-- ประหยัดพื้นที่: จากเดิม 310 แถว/เดือน เหลือเพียง 1 แถว/เดือน (12 แถว/ปี)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fm_rodent_monthly_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_year VARCHAR(10) NOT NULL,              -- ปี พ.ศ. เช่น '2569'
    record_month VARCHAR(30) NOT NULL,             -- ชื่อเดือน เช่น 'มกราคม', 'สิงหาคม'
    
    total_stations INT DEFAULT 10,                 -- จำนวนจุดตรวจ (10 จุด: ST-01 ถึง ST-10)
    total_rats_found INT DEFAULT 0 CHECK (total_rats_found >= 0), -- จำนวนหนูที่พบ (ตัว)
    stations_with_activity INT DEFAULT 0,         -- จำนวนจุดที่พบร่องรอยหนู
    
    -- สรุปผลรายสถานี 10 จุด (JSON รูปแบบ: {"1": {"count": 0, "status": "ปกติ"}, ...})
    station_totals JSONB DEFAULT '{}'::jsonb,
    
    bait_replaced_count INT DEFAULT 0,            -- จำนวนจุดที่เปลี่ยนเหยื่อพิษ
    glue_replaced_count INT DEFAULT 0,            -- จำนวนจุดที่เปลี่ยนถาดกาว
    
    inspector_name VARCHAR(150),
    reviewer_name VARCHAR(150),
    notes TEXT,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_rodent_summary UNIQUE (record_year, record_month)
);

-- ==============================================================================
-- [ส่วนที่ 5] ตารางใหม่: เดินไลน์ตรวจอาคาร (FM-QC-08/01) — แบบบันทึกเฉพาะผลรวม
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fm_line_walk_monthly_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_year VARCHAR(10) NOT NULL,
    record_month VARCHAR(30) NOT NULL,
    building_phase VARCHAR(50) NOT NULL,           -- 'อาคารเฟส 5' หรือ 'อาคารคลังสินค้า 3'
    
    mosquitoes_total INT DEFAULT 0,
    flies_total INT DEFAULT 0,
    cockroaches_total INT DEFAULT 0,
    ants_total INT DEFAULT 0,
    rats_total INT DEFAULT 0,
    rat_traps_total INT DEFAULT 0,
    others_total INT DEFAULT 0,
    grand_total INT DEFAULT 0,
    
    area_records JSONB DEFAULT '[]'::jsonb,        -- รายละเอียด 22 จุดตรวจ
    
    inspector_name VARCHAR(150),
    reviewer_name VARCHAR(150),
    notes TEXT,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT uq_linewalk_summary UNIQUE (record_year, record_month, building_phase)
);

-- ==============================================================================
-- [ส่วนที่ 6] INDEXES สำหรับการดึงข้อมูลสร้างกราฟที่รวดเร็วสูง
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_lizard_summary_lookup ON fm_lizard_monthly_summary (record_year, record_month);
CREATE INDEX IF NOT EXISTS idx_cockroach_summary_lookup ON fm_cockroach_monthly_summary (record_year, record_month);
CREATE INDEX IF NOT EXISTS idx_rodent_summary_lookup ON fm_rodent_monthly_summary (record_year, record_month);
CREATE INDEX IF NOT EXISTS idx_linewalk_summary_lookup ON fm_line_walk_monthly_summary (record_year, record_month, building_phase);

-- ==============================================================================
-- [ส่วนที่ 7] ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE fm_lizard_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_cockroach_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_rodent_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_line_walk_monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write Lizard Summary" ON fm_lizard_monthly_summary FOR ALL USING (true);
CREATE POLICY "Public Read/Write Cockroach Summary" ON fm_cockroach_monthly_summary FOR ALL USING (true);
CREATE POLICY "Public Read/Write Rodent Summary" ON fm_rodent_monthly_summary FOR ALL USING (true);
CREATE POLICY "Public Read/Write LineWalk Summary" ON fm_line_walk_monthly_summary FOR ALL USING (true);

-- ==============================================================================
-- [ส่วนที่ 8] ข้อมูลเปล่าเตรียมพร้อม (BLANK TEMPLATES) & SEED DATA ปี 2569
-- บันทึกข้อมูลประวัติจริง ม.ค. - ส.ค. 2569 + เตรียมข้อมูลเปล่า (ค่า 0) ก.ย. - ธ.ค. 2569
-- ==============================================================================

-- 8.1 จิ้งจก (FM-QC-08/04): 12 เดือน ปี 2569
INSERT INTO fm_lizard_monthly_summary (record_year, record_month, station_1_total, station_2_total, station_3_total, station_4_total, station_5_total, station_6_total, status)
VALUES
    ('2569', 'มกราคม',    0, 0, 0, 1, 0, 0, 'Approved'),
    ('2569', 'กุมภาพันธ์', 0, 0, 0, 1, 0, 0, 'Approved'),
    ('2569', 'มีนาคม',    0, 0, 0, 4, 0, 0, 'Approved'),
    ('2569', 'เมษายน',    0, 0, 0, 0, 0, 0, 'Approved'),
    ('2569', 'พฤษภาคม',   0, 0, 1, 1, 0, 0, 'Approved'),
    ('2569', 'มิถุนายน',   0, 0, 0, 1, 0, 0, 'Approved'),
    ('2569', 'กรกฎาคม',   0, 1, 0, 0, 1, 0, 'Approved'),
    ('2569', 'สิงหาคม',    0, 0, 0, 0, 0, 0, 'Approved'),
    -- ข้อมูลเปล่าเตรียมพร้อมไว้สำหรับอนาคต (Blank Template: ค่า 0 พร้อมบันทึก)
    ('2569', 'กันยายน',    0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'ตุลาคม',     0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'พฤศจิกายน', 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'ธันวาคม',    0, 0, 0, 0, 0, 0, 'Draft')
ON CONFLICT (record_year, record_month) DO NOTHING;

-- 8.2 บ้านแมลงสาบ (FM-QC-08/05): 12 เดือน ปี 2569
INSERT INTO fm_cockroach_monthly_summary (record_year, record_month, grand_total, zone_1_total, zone_2_total, zone_3_total, zone_4_total, zone_5_total, zone_6_total, status)
VALUES
    ('2569', 'มกราคม',    71,  28, 14, 18, 5,  4, 2, 'Approved'),
    ('2569', 'กุมภาพันธ์', 77,  30, 16, 20, 4,  5, 2, 'Approved'),
    ('2569', 'มีนาคม',    125, 45, 25, 35, 8,  8, 4, 'Approved'),
    ('2569', 'เมษายน',    113, 40, 22, 32, 7,  8, 4, 'Approved'),
    ('2569', 'พฤษภาคม',   137, 50, 28, 38, 9,  8, 4, 'Approved'),
    ('2569', 'มิถุนายน',   135, 48, 27, 39, 9,  8, 4, 'Approved'),
    ('2569', 'กรกฎาคม',   144, 52, 29, 41, 10, 8, 4, 'Approved'),
    ('2569', 'สิงหาคม',    62,  24, 12, 16, 4,  4, 2, 'Approved'),
    -- ข้อมูลเปล่าเตรียมพร้อมไว้สำหรับอนาคต (Blank Template: ค่า 0 พร้อมบันทึก)
    ('2569', 'กันยายน',    0,   0,  0,  0,  0,  0, 0, 'Draft'),
    ('2569', 'ตุลาคม',     0,   0,  0,  0,  0,  0, 0, 'Draft'),
    ('2569', 'พฤศจิกายน', 0,   0,  0,  0,  0,  0, 0, 'Draft'),
    ('2569', 'ธันวาคม',    0,   0,  0,  0,  0,  0, 0, 'Draft')
ON CONFLICT (record_year, record_month) DO NOTHING;

-- 8.3 หนูและสัตว์พาหะ สโตร์คลังสินค้า: 12 เดือน ปี 2569
INSERT INTO fm_rodent_monthly_summary (record_year, record_month, total_stations, total_rats_found, stations_with_activity, status)
VALUES
    ('2569', 'มกราคม',    10, 0, 0, 'Approved'),
    ('2569', 'กุมภาพันธ์', 10, 0, 0, 'Approved'),
    ('2569', 'มีนาคม',    10, 0, 0, 'Approved'),
    ('2569', 'เมษายน',    10, 0, 0, 'Approved'),
    ('2569', 'พฤษภาคม',   10, 0, 0, 'Approved'),
    ('2569', 'มิถุนายน',   10, 0, 0, 'Approved'),
    ('2569', 'กรกฎาคม',   10, 0, 0, 'Approved'),
    ('2569', 'สิงหาคม',    10, 0, 0, 'Approved'),
    -- ข้อมูลเปล่าเตรียมพร้อมไว้สำหรับอนาคต (Blank Template: ค่า 0 พร้อมบันทึก)
    ('2569', 'กันยายน',    10, 0, 0, 'Draft'),
    ('2569', 'ตุลาคม',     10, 0, 0, 'Draft'),
    ('2569', 'พฤศจิกายน', 10, 0, 0, 'Draft'),
    ('2569', 'ธันวาคม',    10, 0, 0, 'Draft')
ON CONFLICT (record_year, record_month) DO NOTHING;
