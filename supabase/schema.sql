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
-- [ส่วนที่ 3.1] ตารางแยกผลรวมตามหมายเลขจุดวาง / เดือน (Cockroach Point Monthly Breakdown)
-- บันทึกผลรวมตรวจพบแยกรายหมายเลขจุดวาง (01 - 23) ของแต่ละเดือนและปี
-- ==============================================================================
CREATE TABLE IF NOT EXISTS fm_cockroach_points_monthly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_year VARCHAR(10) NOT NULL,              -- ปี พ.ศ. เช่น '2569'
    record_month VARCHAR(30) NOT NULL,             -- ชื่อเดือน เช่น 'มกราคม', 'สิงหาคม'
    point_no VARCHAR(10) NOT NULL,                 -- หมายเลขจุดวาง เช่น '01', '02', ..., '23'
    point_name VARCHAR(200),                       -- ชื่อจุดวาง เช่น '01 (โรงอาหารตัดแต่งห้องที่ 1)'
    zone VARCHAR(100),                             -- โซน เช่น 'โรงอาหารตัดแต่งห้องที่ 1'
    total_count INT DEFAULT 0 CHECK (total_count >= 0), -- ผลรวมตรวจพบสะสมประจำเดือนของจุดนี้
    status VARCHAR(30) DEFAULT 'Approved',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cockroach_point_monthly UNIQUE (record_year, record_month, point_no)
);

-- SQL View สรุปผลรวมตามหมายเลขจุดวาง / เดือน โดยดึงจากตารางหลัก (View Query)
CREATE OR REPLACE VIEW v_cockroach_points_monthly AS
SELECT 
    s.id AS summary_id,
    s.record_year,
    s.record_month,
    CASE s.record_month
        WHEN 'มกราคม' THEN 1
        WHEN 'กุมภาพันธ์' THEN 2
        WHEN 'มีนาคม' THEN 3
        WHEN 'เมษายน' THEN 4
        WHEN 'พฤษภาคม' THEN 5
        WHEN 'มิถุนายน' THEN 6
        WHEN 'กรกฎาคม' THEN 7
        WHEN 'สิงหาคม' THEN 8
        WHEN 'กันยายน' THEN 9
        WHEN 'ตุลาคม' THEN 10
        WHEN 'พฤศจิกายน' THEN 11
        WHEN 'ธันวาคม' THEN 12
        ELSE 99
    END AS month_no,
    pt.key AS point_no,
    CASE pt.key
        WHEN '01' THEN '01 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '02' THEN '02 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '03' THEN '03 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '04' THEN '04 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '05' THEN '05 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '06' THEN '06 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '07' THEN '07 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '08' THEN '08 (โรงอาหารตัดแต่งห้องที่ 1)'
        WHEN '09' THEN '09 (โรงอาหารตัดแต่งห้องที่ 2)'
        WHEN '10' THEN '10 (โรงอาหารตัดแต่งห้องที่ 2)'
        WHEN '11' THEN '11 (โรงอาหารตัดแต่งห้องที่ 2)'
        WHEN '12' THEN '12 (โรงอาหารตัดแต่งห้องที่ 2)'
        WHEN '13' THEN '13 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)'
        WHEN '14' THEN '14 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)'
        WHEN '15' THEN '15 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)'
        WHEN '16' THEN '16 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)'
        WHEN '17' THEN '17 (ห้องน้ำหญิง ตัดแต่ง)'
        WHEN '18' THEN '18 (ห้องน้ำหญิง ตัดแต่ง)'
        WHEN '19' THEN '19 (ห้องน้ำหญิง ตัดแต่ง)'
        WHEN '20' THEN '20 (ห้องน้ำชาย ตัดแต่ง)'
        WHEN '21' THEN '21 (ห้องน้ำชาย ตัดแต่ง)'
        WHEN '22' THEN '22 (ห้องน้ำชาย ตัดแต่ง)'
        WHEN '23' THEN '23 (ห้องน้ำหัวหน้า ตัดแต่ง)'
        ELSE 'จุดที่ ' || pt.key
    END AS point_name,
    CASE 
        WHEN pt.key::int BETWEEN 1 AND 8 THEN 'โรงอาหารตัดแต่งห้องที่ 1'
        WHEN pt.key::int BETWEEN 9 AND 12 THEN 'โรงอาหารตัดแต่งห้องที่ 2'
        WHEN pt.key::int BETWEEN 13 AND 16 THEN 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง'
        WHEN pt.key::int BETWEEN 17 AND 19 THEN 'ห้องน้ำหญิง ตัดแต่ง'
        WHEN pt.key::int BETWEEN 20 AND 22 THEN 'ห้องน้ำชาย ตัดแต่ง'
        WHEN pt.key::int = 23 THEN 'ห้องน้ำหัวหน้า ตัดแต่ง'
        ELSE 'โซนตรวจวัด'
    END AS zone,
    (pt.value)::int AS total_count,
    s.grand_total,
    s.status,
    s.created_at,
    s.updated_at
FROM fm_cockroach_monthly_summary s,
LATERAL jsonb_each_text(s.point_totals) AS pt(key, value)
WHERE pt.key ~ '^[0-9]{2}$'
ORDER BY s.record_year, month_no, pt.key;

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
CREATE INDEX IF NOT EXISTS idx_cockroach_point_lookup ON fm_cockroach_points_monthly (record_year, record_month, point_no);
CREATE INDEX IF NOT EXISTS idx_rodent_summary_lookup ON fm_rodent_monthly_summary (record_year, record_month);
CREATE INDEX IF NOT EXISTS idx_linewalk_summary_lookup ON fm_line_walk_monthly_summary (record_year, record_month, building_phase);

-- ==============================================================================
-- [ส่วนที่ 7] ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE fm_lizard_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_cockroach_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_cockroach_points_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_rodent_monthly_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE fm_line_walk_monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read/Write Lizard Summary" ON fm_lizard_monthly_summary FOR ALL USING (true);
CREATE POLICY "Public Read/Write Cockroach Summary" ON fm_cockroach_monthly_summary FOR ALL USING (true);
CREATE POLICY "Public Read/Write Cockroach Points Monthly" ON fm_cockroach_points_monthly FOR ALL USING (true);
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

-- 8.3.1 ข้อมูลย้อนหลังกับดักหนูสโตร์ (FM-QC-08/02) ปี 2567 (12 เดือน พบ 0 ตัว)
INSERT INTO fm_rodent_monthly_summary (record_year, record_month, total_stations, total_rats_found, stations_with_activity, status)
VALUES
    ('2567', 'มกราคม',    10, 0, 0, 'Approved'),
    ('2567', 'กุมภาพันธ์', 10, 0, 0, 'Approved'),
    ('2567', 'มีนาคม',    10, 0, 0, 'Approved'),
    ('2567', 'เมษายน',    10, 0, 0, 'Approved'),
    ('2567', 'พฤษภาคม',   10, 0, 0, 'Approved'),
    ('2567', 'มิถุนายน',   10, 0, 0, 'Approved'),
    ('2567', 'กรกฎาคม',   10, 0, 0, 'Approved'),
    ('2567', 'สิงหาคม',    10, 0, 0, 'Approved'),
    ('2567', 'กันยายน',    10, 0, 0, 'Approved'),
    ('2567', 'ตุลาคม',     10, 0, 0, 'Approved'),
    ('2567', 'พฤศจิกายน', 10, 0, 0, 'Approved'),
    ('2567', 'ธันวาคม',    10, 0, 0, 'Approved')
ON CONFLICT (record_year, record_month) DO NOTHING;

-- 8.3.2 ข้อมูลย้อนหลังกับดักหนูสโตร์ (FM-QC-08/02) ปี 2568 (12 เดือน พบ 0 ตัว)
INSERT INTO fm_rodent_monthly_summary (record_year, record_month, total_stations, total_rats_found, stations_with_activity, status)
VALUES
    ('2568', 'มกราคม',    10, 0, 0, 'Approved'),
    ('2568', 'กุมภาพันธ์', 10, 0, 0, 'Approved'),
    ('2568', 'มีนาคม',    10, 0, 0, 'Approved'),
    ('2568', 'เมษายน',    10, 0, 0, 'Approved'),
    ('2568', 'พฤษภาคม',   10, 0, 0, 'Approved'),
    ('2568', 'มิถุนายน',   10, 0, 0, 'Approved'),
    ('2568', 'กรกฎาคม',   10, 0, 0, 'Approved'),
    ('2568', 'สิงหาคม',    10, 0, 0, 'Approved'),
    ('2568', 'กันยายน',    10, 0, 0, 'Approved'),
    ('2568', 'ตุลาคม',     10, 0, 0, 'Approved'),
    ('2568', 'พฤศจิกายน', 10, 0, 0, 'Approved'),
    ('2568', 'ธันวาคม',    10, 0, 0, 'Approved')
ON CONFLICT (record_year, record_month) DO NOTHING;

-- 8.4.1 เดินไลน์ตรวจอาคาร (FM-QC-08/01) ปี 2567
INSERT INTO fm_line_walk_monthly_summary (record_year, record_month, building_phase, mosquitoes_total, flies_total, cockroaches_total, ants_total, rats_total, rat_traps_total, others_total, grand_total, status)
VALUES
    ('2567', 'มกราคม', 'อาคารเฟส 5', 8, 1, 3, 0, 0, 0, 0, 12, 'Approved'),
    ('2567', 'มกราคม', 'อาคารคลังสินค้า 3', 0, 1, 0, 0, 0, 0, 0, 1, 'Approved'),
    ('2567', 'กุมภาพันธ์', 'อาคารเฟส 5', 3, 0, 1, 0, 0, 0, 1, 5, 'Approved'),
    ('2567', 'กุมภาพันธ์', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'มีนาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'มีนาคม', 'อาคารคลังสินค้า 3', 1, 0, 1, 0, 0, 0, 0, 2, 'Approved'),
    ('2567', 'เมษายน', 'อาคารเฟส 5', 5, 6, 10, 1, 0, 0, 0, 22, 'Approved'),
    ('2567', 'เมษายน', 'อาคารคลังสินค้า 3', 5, 4, 3, 0, 0, 0, 0, 12, 'Approved'),
    ('2567', 'พฤษภาคม', 'อาคารเฟส 5', 5, 4, 2, 0, 0, 0, 1, 12, 'Approved'),
    ('2567', 'พฤษภาคม', 'อาคารคลังสินค้า 3', 3, 4, 0, 3, 0, 0, 0, 10, 'Approved'),
    ('2567', 'มิถุนายน', 'อาคารเฟส 5', 2, 0, 1, 0, 0, 0, 3, 6, 'Approved'),
    ('2567', 'มิถุนายน', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'กรกฎาคม', 'อาคารเฟส 5', 0, 0, 6, 0, 0, 0, 4, 10, 'Approved'),
    ('2567', 'กรกฎาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'สิงหาคม', 'อาคารเฟส 5', 1, 0, 1, 0, 0, 0, 2, 4, 'Approved'),
    ('2567', 'สิงหาคม', 'อาคารคลังสินค้า 3', 0, 0, 1, 0, 0, 0, 1, 2, 'Approved'),
    ('2567', 'กันยายน', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'กันยายน', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'ตุลาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'ตุลาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'พฤศจิกายน', 'อาคารเฟส 5', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2567', 'พฤศจิกายน', 'อาคารคลังสินค้า 3', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2567', 'ธันวาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2567', 'ธันวาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved')
ON CONFLICT (record_year, record_month, building_phase) DO NOTHING;

-- 8.4.2 เดินไลน์ตรวจอาคาร (FM-QC-08/01) ปี 2568
INSERT INTO fm_line_walk_monthly_summary (record_year, record_month, building_phase, mosquitoes_total, flies_total, cockroaches_total, ants_total, rats_total, rat_traps_total, others_total, grand_total, status)
VALUES
    ('2568', 'มกราคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2568', 'มกราคม', 'อาคารคลังสินค้า 3', 0, 0, 4, 0, 0, 0, 0, 4, 'Approved'),
    ('2568', 'กุมภาพันธ์', 'อาคารเฟส 5', 0, 1, 0, 0, 0, 0, 10, 11, 'Approved'),
    ('2568', 'กุมภาพันธ์', 'อาคารคลังสินค้า 3', 0, 2, 0, 0, 0, 0, 0, 2, 'Approved'),
    ('2568', 'มีนาคม', 'อาคารเฟส 5', 1, 0, 0, 0, 0, 0, 1, 2, 'Approved'),
    ('2568', 'มีนาคม', 'อาคารคลังสินค้า 3', 2, 0, 2, 0, 0, 0, 0, 4, 'Approved'),
    ('2568', 'เมษายน', 'อาคารเฟส 5', 4, 0, 1, 0, 0, 0, 2, 7, 'Approved'),
    ('2568', 'เมษายน', 'อาคารคลังสินค้า 3', 1, 3, 9, 0, 0, 0, 1, 14, 'Approved'),
    ('2568', 'พฤษภาคม', 'อาคารเฟส 5', 1, 0, 1, 0, 0, 0, 0, 2, 'Approved'),
    ('2568', 'พฤษภาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2568', 'มิถุนายน', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2568', 'มิถุนายน', 'อาคารคลังสินค้า 3', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2568', 'กรกฎาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2568', 'กรกฎาคม', 'อาคารคลังสินค้า 3', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2568', 'สิงหาคม', 'อาคารเฟส 5', 1, 1, 0, 0, 0, 0, 12, 14, 'Approved'),
    ('2568', 'สิงหาคม', 'อาคารคลังสินค้า 3', 0, 0, 3, 0, 0, 0, 0, 3, 'Approved'),
    ('2568', 'กันยายน', 'อาคารเฟส 5', 0, 1, 1, 0, 0, 0, 3, 5, 'Approved'),
    ('2568', 'กันยายน', 'อาคารคลังสินค้า 3', 0, 3, 3, 0, 0, 0, 0, 6, 'Approved'),
    ('2568', 'ตุลาคม', 'อาคารเฟส 5', 1, 0, 4, 0, 0, 0, 1, 6, 'Approved'),
    ('2568', 'ตุลาคม', 'อาคารคลังสินค้า 3', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2568', 'พฤศจิกายน', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 6, 6, 'Approved'),
    ('2568', 'พฤศจิกายน', 'อาคารคลังสินค้า 3', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2568', 'ธันวาคม', 'อาคารเฟส 5', 13, 0, 0, 0, 0, 0, 12, 25, 'Approved'),
    ('2568', 'ธันวาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved')
ON CONFLICT (record_year, record_month, building_phase) DO NOTHING;

-- 8.4.3 เดินไลน์ตรวจอาคาร (FM-QC-08/01) ปี 2569
INSERT INTO fm_line_walk_monthly_summary (record_year, record_month, building_phase, mosquitoes_total, flies_total, cockroaches_total, ants_total, rats_total, rat_traps_total, others_total, grand_total, status)
VALUES
    ('2569', 'มกราคม', 'อาคารเฟส 5', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2569', 'มกราคม', 'อาคารคลังสินค้า 3', 0, 0, 5, 0, 0, 0, 0, 5, 'Approved'),
    ('2569', 'กุมภาพันธ์', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2569', 'กุมภาพันธ์', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2569', 'มีนาคม', 'อาคารเฟส 5', 8, 0, 0, 0, 0, 0, 5, 13, 'Approved'),
    ('2569', 'มีนาคม', 'อาคารคลังสินค้า 3', 0, 0, 1, 0, 0, 0, 0, 1, 'Approved'),
    ('2569', 'เมษายน', 'อาคารเฟส 5', 3, 0, 3, 0, 0, 0, 3, 9, 'Approved'),
    ('2569', 'เมษายน', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2569', 'พฤษภาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2569', 'พฤษภาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2569', 'มิถุนายน', 'อาคารเฟส 5', 3, 0, 0, 0, 0, 0, 3, 6, 'Approved'),
    ('2569', 'มิถุนายน', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Approved'),
    ('2569', 'กรกฎาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'กรกฎาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'สิงหาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'สิงหาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'กันยายน', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'กันยายน', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'ตุลาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'ตุลาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'พฤศจิกายน', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'พฤศจิกายน', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'ธันวาคม', 'อาคารเฟส 5', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft'),
    ('2569', 'ธันวาคม', 'อาคารคลังสินค้า 3', 0, 0, 0, 0, 0, 0, 0, 0, 'Draft')
ON CONFLICT (record_year, record_month, building_phase) DO NOTHING;

