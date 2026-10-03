// Unified Points & Traps Management Manager for Admin & Entry Forms
// Supports: Light Traps (เครื่องดักแมลง), Cockroach Traps (บ้านแมลงสาบ), Rodent Stations (กับดักหนู)

export const DEFAULT_LIGHT_TRAPS = [
  { id: 'lt-01', category: 'light_traps', no: '(01)', department: 'โหลด เฟส 5', location: 'ลานโหลดของตัดแต่งและ Makro', name: '(01) ลานโหลดของตัดแต่งและ Makro', status: 'active', notes: '' },
  { id: 'lt-02', category: 'light_traps', no: '(02)', department: 'โหลด เฟส 5', location: 'ทางขนย้ายสินค้าเข้า - ออกตัดแต่ง', name: '(02) ทางขนย้ายสินค้าเข้า - ออกตัดแต่ง', status: 'active', notes: '' },
  { id: 'lt-03', category: 'light_traps', no: '(03)', department: 'ตัดแต่ง', location: 'ห้องตัดแต่ง บริเวณทางหนีไฟ', name: '(03) ห้องตัดแต่ง บริเวณทางหนีไฟ', status: 'active', notes: '' },
  { id: 'lt-04', category: 'light_traps', no: '(04)', department: 'ตัดแต่ง', location: 'ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น', name: '(04) ห้องตัดแต่ง บริเวณห้องควบคุมระบบแช่เย็น', status: 'active', notes: '' },
  { id: 'lt-05', category: 'light_traps', no: '(05)', department: 'ตัดแต่ง', location: 'ห้องตัดแต่ง บริเวณเลนมันและหนัง', name: '(05) ห้องตัดแต่ง บริเวณเลนมันและหนัง', status: 'active', notes: '' },
  { id: 'lt-06', category: 'light_traps', no: '(06)', department: 'โหลด เฟส 5', location: 'ลานโหลดของตัดแต่งและ Makro', name: '(06) ลานโหลดของตัดแต่งและ Makro', status: 'active', notes: '' },
  { id: 'lt-07', category: 'light_traps', no: '(07)', department: 'หน้าร้านใหม่', location: 'ลานโหลดสินค้าหน้าร้าน', name: '(07) ลานโหลดสินค้าหน้าร้าน', status: 'active', notes: '' },
  { id: 'lt-08', category: 'light_traps', no: '(08)', department: 'โรงฆ่า', location: 'ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน', name: '(08) ทางลำเลียงสินค้า โรงฆ่า-หน้าร้าน', status: 'active', notes: '' },
  { id: 'lt-09', category: 'light_traps', no: '(09)', department: 'โรงฆ่า', location: 'ทางเข้าผ่าซาก/เครื่องในแดง/เครื่องในขาว', name: '(09) ทางเข้าผ่าซาก/เครื่องในแดง/เครื่องในขาว', status: 'active', notes: '' },
  { id: 'lt-10', category: 'light_traps', no: '(10)', department: 'โรงฆ่า', location: 'ลานโหลดสินค้าห้องเลือด', name: '(10) ลานโหลดสินค้าห้องเลือด', status: 'active', notes: '' },
  { id: 'lt-11', category: 'light_traps', no: '(11)', department: 'โรงฆ่า', location: 'ห้องเลือด', name: '(11) ห้องเลือด', status: 'active', notes: '' },
  { id: 'lt-12', category: 'light_traps', no: '(12)', department: 'โรงฆ่า', location: 'ห้องช็อต/แทงคอ/ลวกซาก', name: '(12) ห้องช็อต/แทงคอ/ลวกซาก', status: 'active', notes: '' },
  { id: 'lt-13', category: 'light_traps', no: '(13)', department: 'เฟส 6', location: 'ห้อง Pack A บริเวณหน้าประตูทางเชื่อมอาคาร', name: '(13) ห้อง Pack A บริเวณหน้าประตูทางเชื่อมอาคาร', status: 'active', notes: '' },
  { id: 'lt-14', category: 'light_traps', no: '(14)', department: 'เฟส 6', location: 'ห้อง Pack A บริเวณหน้าห้องเก็บบรรจุภัณฑ์', name: '(14) ห้อง Pack A บริเวณหน้าห้องเก็บบรรจุภัณฑ์', status: 'active', notes: '' },
  { id: 'lt-15', category: 'light_traps', no: '(15)', department: 'เฟส 6', location: 'ห้อง Pack C', name: '(15) ห้อง Pack C', status: 'active', notes: '' },
  { id: 'lt-16', category: 'light_traps', no: '(16)', department: 'คลัง3', location: 'ห้อง Pack สินค้า Frozen คลัง3', name: '(16) ห้อง Pack สินค้า Frozen คลัง3', status: 'active', notes: '' },
  { id: 'lt-17', category: 'light_traps', no: '(17)', department: 'หมูบด', location: 'ห้องหมูบด บริเวณทางเข้า-ออก ติดตู้ F5', name: '(17) ห้องหมูบด บริเวณทางเข้า-ออก ติดตู้ F5', status: 'active', notes: '' },
  { id: 'lt-18', category: 'light_traps', no: '(18)', department: 'หมูบด', location: 'ห้องหมูบด บริเวณเครื่องบดหมู ติดตู้ F1', name: '(18) ห้องหมูบด บริเวณเครื่องบดหมู ติดตู้ F1', status: 'active', notes: '' },
  { id: 'lt-19', category: 'light_traps', no: '(19)', department: 'หมูบด', location: 'ห้องหมูบด บริเวณผนังติดห้องเครื่อง', name: '(19) ห้องหมูบด บริเวณผนังติดห้องเครื่อง', status: 'active', notes: '' },
  { id: 'lt-20', category: 'light_traps', no: '(20)', department: 'หมูบด', location: 'ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ', name: '(20) ห้องหมูบด ทางเข้า-ออกไลน์ผลิตติดออฟฟิศ', status: 'active', notes: '' },
  { id: 'lt-21', category: 'light_traps', no: '(21)', department: 'หมูบด', location: 'ห้องหมูบด ทางเข้า-ออกไลน์ผลิต ฝั่งตู้ S,T', name: '(21) ห้องหมูบด ทางเข้า-ออกไลน์ผลิต ฝั่งตู้ S,T', status: 'active', notes: '' },
  { id: 'lt-22', category: 'light_traps', no: '(22)', department: 'Slice ผลิต', location: 'ห้อง Slice เครื่องใน ทางเข้า-ออก ฝั่ง Chill 3', name: '(22) ห้อง Slice เครื่องใน ทางเข้า-ออก ฝั่ง Chill 3', status: 'active', notes: '' },
  { id: 'lt-23', category: 'light_traps', no: '(23)', department: 'Slice ผลิต', location: 'ห้อง Slice เครื่องใน ทางเข้า-ออกไลน์ผลิต', name: '(23) ห้อง Slice เครื่องใน ทางเข้า-ออกไลน์ผลิต', status: 'active', notes: '' },
  { id: 'lt-24', category: 'light_traps', no: '(24)', department: 'อนามัย', location: 'ห้องซักผ้า คลัง 4', name: '(24) ห้องซักผ้า คลัง 4', status: 'active', notes: '' },
  { id: 'lt-25', category: 'light_traps', no: '(25)', department: 'อนามัย', location: 'ทางเข้า Slice ถาด', name: '(25) ทางเข้า Slice ถาด', status: 'active', notes: '' },
  { id: 'lt-26', category: 'light_traps', no: '(26)', department: 'Slice ผลิต', location: 'Slice ชั้น 3 ทางเข้า-ออกไลน์ผลิต', name: '(26) Slice ชั้น 3 ทางเข้า-ออกไลน์ผลิต', status: 'active', notes: '' },
  { id: 'lt-27', category: 'light_traps', no: '(27)', department: 'Slice ผลิต', location: 'Slice ชั้น 3 พื้นที่การผลิต', name: '(27) Slice ชั้น 3 พื้นที่การผลิต', status: 'active', notes: '' },
  { id: 'lt-28', category: 'light_traps', no: '(28)', department: 'Slice ผลิต', location: 'ทางเดินไปห้องยุง Slice ชั้น 3', name: '(28) ทางเดินไปห้องยุง Slice ชั้น 3', status: 'active', notes: '' },
  { id: 'lt-29', category: 'light_traps', no: '(29)', department: 'Slice ผลิต', location: 'ห้อง Slice เฟส 4.1', name: '(29) ห้อง Slice เฟส 4.1', status: 'active', notes: '' },
  { id: 'lt-30', category: 'light_traps', no: '(30)', department: 'โรงฆ่า', location: 'ห้องแพ็คเครื่องใน/ล้างเครื่องใน', name: '(30) ห้องแพ็คเครื่องใน/ล้างเครื่องใน', status: 'active', notes: '' },
  { id: 'lt-31', category: 'light_traps', no: '(31)', department: 'ตัดแต่ง', location: 'ห้องล้างมัน/คัดแยกเศษ', name: '(31) ห้องล้างมัน/คัดแยกเศษ', status: 'active', notes: '' },
  { id: 'lt-32', category: 'light_traps', no: '(32)', department: 'ล้างตะกร้า', location: 'ทางลำเลียงตะกร้าเข้าไลน์ผลิต', name: '(32) ทางลำเลียงตะกร้าเข้าไลน์ผลิต', status: 'active', notes: '' },
  { id: 'lt-33', category: 'light_traps', no: '(33)', department: 'อนามัย', location: 'บันไดทางขึ้นชั้น 2', name: '(33) บันไดทางขึ้นชั้น 2', status: 'active', notes: '' }
];

export const DEFAULT_COCKROACH_POINTS = [
  { id: 1, category: 'cockroaches', no: '01', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '01 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 2, category: 'cockroaches', no: '02', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '02 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 3, category: 'cockroaches', no: '03', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '03 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 4, category: 'cockroaches', no: '04', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '04 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 5, category: 'cockroaches', no: '05', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '05 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 6, category: 'cockroaches', no: '06', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '06 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 7, category: 'cockroaches', no: '07', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '07 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 8, category: 'cockroaches', no: '08', zone: 'โรงอาหารตัดแต่งห้องที่ 1', location: 'โรงอาหารตัดแต่งห้องที่ 1', name: '08 (โรงอาหารตัดแต่งห้องที่ 1)', status: 'active', notes: '' },
  { id: 9, category: 'cockroaches', no: '09', zone: 'โรงอาหารตัดแต่งห้องที่ 2', location: 'โรงอาหารตัดแต่งห้องที่ 2', name: '09 (โรงอาหารตัดแต่งห้องที่ 2)', status: 'active', notes: '' },
  { id: 10, category: 'cockroaches', no: '10', zone: 'โรงอาหารตัดแต่งห้องที่ 2', location: 'โรงอาหารตัดแต่งห้องที่ 2', name: '10 (โรงอาหารตัดแต่งห้องที่ 2)', status: 'active', notes: '' },
  { id: 11, category: 'cockroaches', no: '11', zone: 'โรงอาหารตัดแต่งห้องที่ 2', location: 'โรงอาหารตัดแต่งห้องที่ 2', name: '11 (โรงอาหารตัดแต่งห้องที่ 2)', status: 'active', notes: '' },
  { id: 12, category: 'cockroaches', no: '12', zone: 'โรงอาหารตัดแต่งห้องที่ 2', location: 'โรงอาหารตัดแต่งห้องที่ 2', name: '12 (โรงอาหารตัดแต่งห้องที่ 2)', status: 'active', notes: '' },
  { id: 13, category: 'cockroaches', no: '13', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', location: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '13 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)', status: 'active', notes: '' },
  { id: 14, category: 'cockroaches', no: '14', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', location: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '14 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)', status: 'active', notes: '' },
  { id: 15, category: 'cockroaches', no: '15', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', location: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '15 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)', status: 'active', notes: '' },
  { id: 16, category: 'cockroaches', no: '16', zone: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', location: 'ใต้ตู้ล็อกเกอร์ ตัดแต่ง', name: '16 (ใต้ตู้ล็อกเกอร์ ตัดแต่ง)', status: 'active', notes: '' },
  { id: 17, category: 'cockroaches', no: '17', zone: 'ห้องน้ำหญิง ตัดแต่ง', location: 'ห้องน้ำหญิง ตัดแต่ง', name: '17 (ห้องน้ำหญิง ตัดแต่ง)', status: 'active', notes: '' },
  { id: 18, category: 'cockroaches', no: '18', zone: 'ห้องน้ำหญิง ตัดแต่ง', location: 'ห้องน้ำหญิง ตัดแต่ง', name: '18 (ห้องน้ำหญิง ตัดแต่ง)', status: 'active', notes: '' },
  { id: 19, category: 'cockroaches', no: '19', zone: 'ห้องน้ำหญิง ตัดแต่ง', location: 'ห้องน้ำหญิง ตัดแต่ง', name: '19 (ห้องน้ำหญิง ตัดแต่ง)', status: 'active', notes: '' },
  { id: 20, category: 'cockroaches', no: '20', zone: 'ห้องน้ำชาย ตัดแต่ง', location: 'ห้องน้ำชาย ตัดแต่ง', name: '20 (ห้องน้ำชาย ตัดแต่ง)', status: 'active', notes: '' },
  { id: 21, category: 'cockroaches', no: '21', zone: 'ห้องน้ำชาย ตัดแต่ง', location: 'ห้องน้ำชาย ตัดแต่ง', name: '21 (ห้องน้ำชาย ตัดแต่ง)', status: 'active', notes: '' },
  { id: 22, category: 'cockroaches', no: '22', zone: 'ห้องน้ำชาย ตัดแต่ง', location: 'ห้องน้ำชาย ตัดแต่ง', name: '22 (ห้องน้ำชาย ตัดแต่ง)', status: 'active', notes: '' },
  { id: 23, category: 'cockroaches', no: '23', zone: 'ห้องน้ำหัวหน้า ตัดแต่ง', location: 'ห้องน้ำหัวหน้า ตัดแต่ง', name: '23 (ห้องน้ำหัวหน้า ตัดแต่ง)', status: 'active', notes: '' }
];

export const DEFAULT_RODENT_STATIONS = [
  { id: 1, category: 'rodents', no: 'สถานี 1', code: '57', zone: 'สโตร์', location: 'บริเวณหน้าสโตร์ทางเข้า', name: 'สถานี 1 (57) สโตร์', status: 'active', notes: '' },
  { id: 2, category: 'rodents', no: 'สถานี 2', code: '58', zone: 'สโตร์', location: 'แนวกำแพงสโตร์ฝั่งซ้าย', name: 'สถานี 2 (58) สโตร์', status: 'active', notes: '' },
  { id: 3, category: 'rodents', no: 'สถานี 3', code: '59', zone: 'สโตร์', location: 'แนววางพาเลทสโตร์', name: 'สถานี 3 (59) สโตร์', status: 'active', notes: '' },
  { id: 4, category: 'rodents', no: 'สถานี 4', code: '60', zone: 'สโตร์', location: 'บริเวณประตูทางออกฉุกเฉินสโตร์', name: 'สถานี 4 (60) สโตร์', status: 'active', notes: '' },
  { id: 5, category: 'rodents', no: 'สถานี 5', code: '61', zone: 'สโตร์', location: 'บริเวณชั้นวางอุปกรณ์', name: 'สถานี 5 (61) สโตร์', status: 'active', notes: '' },
  { id: 6, category: 'rodents', no: 'สถานี 6', code: '62', zone: 'สโตร์', location: 'บริเวณมุมห้องเก็บสารเคมี', name: 'สถานี 6 (62) สโตร์', status: 'active', notes: '' },
  { id: 7, category: 'rodents', no: 'สถานี 7', code: '63', zone: 'สโตร์', location: 'แนวท่อระบายน้ำสโตร์', name: 'สถานี 7 (63) สโตร์', status: 'active', notes: '' },
  { id: 8, category: 'rodents', no: 'สถานี 8', code: '64', zone: 'สโตร์', location: 'บริเวณจุดจอดโฟล์คลิฟท์', name: 'สถานี 8 (64) สโตร์', status: 'active', notes: '' },
  { id: 9, category: 'rodents', no: 'สถานี 9', code: '66', zone: 'สโตร์', location: 'แนวกำแพงสโตร์ฝั่งขวา', name: 'สถานี 9 (66) สโตร์', status: 'active', notes: '' },
  { id: 10, category: 'rodents', no: 'สถานี 10', code: '65', zone: 'สโตร์', location: 'บริเวณลานรับของสโตร์', name: 'สถานี 10 (65) สโตร์', status: 'active', notes: '' }
];

export const DEFAULT_LIZARD_STATIONS = [
  { id: 1, category: 'lizards', no: 'สถานีที่ 1', zone: 'พื้นที่การผลิต / สโตร์', location: 'จุดตรวจดักจับจิ้งจก สถานีที่ 1', name: 'จุดตรวจดักจับจิ้งจก สถานีที่ 1', status: 'active', notes: '' },
  { id: 2, category: 'lizards', no: 'สถานีที่ 2', zone: 'พื้นที่การผลิต / สโตร์', location: 'จุดตรวจดักจับจิ้งจก สถานีที่ 2', name: 'จุดตรวจดักจับจิ้งจก สถานีที่ 2', status: 'active', notes: '' },
  { id: 3, category: 'lizards', no: 'สถานีที่ 3', zone: 'พื้นที่การผลิต / สโตร์', location: 'จุดตรวจดักจับจิ้งจก สถานีที่ 3', name: 'จุดตรวจดักจับจิ้งจก สถานีที่ 3', status: 'active', notes: '' },
  { id: 4, category: 'lizards', no: 'สถานีที่ 4', zone: 'พื้นที่การผลิต / สโตร์', location: 'จุดตรวจดักจับจิ้งจก สถานีที่ 4', name: 'จุดตรวจดักจับจิ้งจก สถานีที่ 4', status: 'active', notes: '' },
  { id: 5, category: 'lizards', no: 'สถานีที่ 5', zone: 'พื้นที่การผลิต / สโตร์', location: 'จุดตรวจดักจับจิ้งจก สถานีที่ 5', name: 'จุดตรวจดักจับจิ้งจก สถานีที่ 5', status: 'active', notes: '' },
  { id: 6, category: 'lizards', no: 'สถานีที่ 6', zone: 'พื้นที่การผลิต / สโตร์', location: 'จุดตรวจดักจับจิ้งจก สถานีที่ 6', name: 'จุดตรวจดักจับจิ้งจก สถานีที่ 6', status: 'active', notes: '' }
];

export const STORAGE_KEYS = {
  light_traps: 'custom_light_traps_v1',
  cockroaches: 'custom_cockroach_points_v1',
  rodents: 'custom_rodent_stations_v1',
  lizards: 'custom_lizard_stations_v1'
};

/**
 * Get stored points for a category from localStorage, fallback to defaults
 */
export const getStoredPoints = (category = 'light_traps') => {
  if (typeof window === 'undefined') {
    if (category === 'light_traps') return DEFAULT_LIGHT_TRAPS;
    if (category === 'cockroaches') return DEFAULT_COCKROACH_POINTS;
    if (category === 'rodents') return DEFAULT_RODENT_STATIONS;
    return [];
  }

  const key = STORAGE_KEYS[category] || `custom_${category}_v1`;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error(`Error parsing ${key}:`, e);
    }
  }

  if (category === 'light_traps') return DEFAULT_LIGHT_TRAPS;
  if (category === 'cockroaches') return DEFAULT_COCKROACH_POINTS;
  if (category === 'rodents') return DEFAULT_RODENT_STATIONS;
  if (category === 'lizards') return DEFAULT_LIZARD_STATIONS;
  return [];
};

/**
 * Save points to localStorage and emit sync event
 */
export const saveStoredPoints = (category, points) => {
  if (typeof window === 'undefined') return;
  const key = STORAGE_KEYS[category] || `custom_${category}_v1`;
  localStorage.setItem(key, JSON.stringify(points));
  // Dispatch custom event for cross-component sync
  try {
    window.dispatchEvent(new CustomEvent('points-updated', { detail: { category, points } }));
  } catch (e) {}
};

/**
 * Reset points to factory defaults
 */
export const resetStoredPoints = (category) => {
  let defaults = [];
  if (category === 'light_traps') defaults = DEFAULT_LIGHT_TRAPS;
  if (category === 'cockroaches') defaults = DEFAULT_COCKROACH_POINTS;
  if (category === 'rodents') defaults = DEFAULT_RODENT_STATIONS;
  if (category === 'lizards') defaults = DEFAULT_LIZARD_STATIONS;

  saveStoredPoints(category, defaults);
  return defaults;
};

/**
 * Add a new point to category
 */
export const addPoint = (category, pointData) => {
  const current = getStoredPoints(category);
  const now = new Date().toISOString();
  
  let newId;
  if (category === 'cockroaches') {
    const maxNumId = current.reduce((max, p) => {
      const nid = typeof p.id === 'number' ? p.id : parseInt(p.id, 10);
      return !isNaN(nid) && nid > max ? nid : max;
    }, 0);
    newId = maxNumId + 1;
  } else if (category === 'rodents' || category === 'lizards') {
    newId = current.length + 1;
  } else {
    newId = `lt-${Date.now()}`;
  }

  const formattedName = category === 'light_traps'
    ? `${pointData.no.startsWith('(') ? pointData.no : `(${pointData.no})`} ${pointData.location}`
    : category === 'cockroaches'
      ? `${pointData.no} (${pointData.zone})`
      : category === 'rodents'
        ? `${pointData.no} (${pointData.code || ''}) ${pointData.zone}`
        : (pointData.location ? pointData.location : `จุดตรวจดักจับจิ้งจก ${pointData.no}`);

  const newPoint = {
    id: newId,
    category,
    no: pointData.no.trim(),
    department: pointData.department || '',
    zone: pointData.zone || pointData.department || '',
    location: pointData.location ? pointData.location.trim() : (pointData.zone || ''),
    code: pointData.code || '',
    name: formattedName.trim(),
    status: pointData.status || 'active',
    notes: pointData.notes || '',
    createdAt: now,
    updatedAt: now
  };

  const updated = [...current, newPoint];
  saveStoredPoints(category, updated);
  return updated;
};

/**
 * Update an existing point
 */
export const updatePoint = (category, pointId, updatedFields) => {
  const current = getStoredPoints(category);
  const now = new Date().toISOString();

  const updated = current.map(p => {
    if (String(p.id) === String(pointId)) {
      const merged = { ...p, ...updatedFields, updatedAt: now };
      // Recalculate formatted name
      if (category === 'light_traps') {
        const noVal = merged.no.startsWith('(') ? merged.no : `(${merged.no})`;
        merged.name = `${noVal} ${merged.location}`.trim();
      } else if (category === 'cockroaches') {
        merged.name = `${merged.no} (${merged.zone})`.trim();
      } else if (category === 'rodents') {
        merged.name = `${merged.no} (${merged.code || ''}) ${merged.zone}`.trim();
      } else if (category === 'lizards') {
        merged.name = (merged.location || `จุดตรวจดักจับจิ้งจก ${merged.no}`).trim();
      }
      return merged;
    }
    return p;
  });

  saveStoredPoints(category, updated);
  return updated;
};

/**
 * Delete a point
 */
export const deletePoint = (category, pointId) => {
  const current = getStoredPoints(category);
  const updated = current.filter(p => String(p.id) !== String(pointId));
  saveStoredPoints(category, updated);
  return updated;
};

/**
 * Toggle point active / inactive status
 */
export const togglePointStatus = (category, pointId) => {
  const current = getStoredPoints(category);
  const updated = current.map(p => {
    if (String(p.id) === String(pointId)) {
      return {
        ...p,
        status: p.status === 'active' ? 'inactive' : 'active',
        updatedAt: new Date().toISOString()
      };
    }
    return p;
  });
  saveStoredPoints(category, updated);
  return updated;
};

/**
 * Derive DEPT_TRAPS_MAPPING from active light traps
 */
export const deriveDeptTrapsMapping = (pointsList = null) => {
  const points = pointsList || getStoredPoints('light_traps');
  const mapping = {};
  points.forEach(pt => {
    if (pt.status !== 'inactive') {
      const dept = pt.department || 'ไม่ระบุแผนก';
      if (!mapping[dept]) mapping[dept] = [];
      mapping[dept].push(pt.name);
    }
  });
  return mapping;
};

/**
 * Derive standard COCKROACH_POINTS format array
 */
export const deriveCockroachPoints = (pointsList = null, includeInactive = false) => {
  const points = pointsList || getStoredPoints('cockroaches');
  return points
    .filter(pt => includeInactive || pt.status !== 'inactive')
    .map(pt => ({
      id: typeof pt.id === 'number' ? pt.id : parseInt(pt.id, 10) || pt.id,
      no: String(pt.no).padStart(2, '0'),
      zone: pt.zone,
      name: pt.name || `${pt.no} (${pt.zone})`,
      status: pt.status || 'active',
      notes: pt.notes || ''
    }));
};

/**
 * Derive unique zones from cockroach points
 */
export const deriveCockroachZones = (pointsList = null) => {
  const points = pointsList || getStoredPoints('cockroaches');
  const zones = [];
  points.forEach(pt => {
    if (pt.zone && !zones.includes(pt.zone)) {
      zones.push(pt.zone);
    }
  });
  return zones.length > 0 ? zones : [
    'โรงอาหารตัดแต่งห้องที่ 1',
    'โรงอาหารตัดแต่งห้องที่ 2',
    'ใต้ตู้ล็อกเกอร์ ตัดแต่ง',
    'ห้องน้ำหญิง ตัดแต่ง',
    'ห้องน้ำชาย ตัดแต่ง',
    'ห้องน้ำหัวหน้า ตัดแต่ง'
  ];
};

/**
 * Derive unique departments from light traps
 */
export const deriveDepartmentsList = (pointsList = null) => {
  const points = pointsList || getStoredPoints('light_traps');
  const depts = [];
  points.forEach(pt => {
    if (pt.department && !depts.includes(pt.department)) {
      depts.push(pt.department);
    }
  });
  return depts.length > 0 ? depts : [
    'หน้าร้านใหม่', 'โรงฆ่า', 'ตัดแต่ง', 'โหลด เฟส 5', 'เฟส 6', 
    'คลัง3', 'หมูบด', 'Slice ผลิต', 'อนามัย', 'ล้างตะกร้า'
  ];
};

/**
 * Derive lizard stations array
 */
export const deriveLizardStations = (pointsList = null, includeInactive = false) => {
  const points = pointsList || getStoredPoints('lizards');
  return points
    .filter(pt => includeInactive || pt.status !== 'inactive')
    .map(pt => ({
      id: typeof pt.id === 'number' ? pt.id : parseInt(pt.id, 10) || pt.id,
      name: pt.no,
      area: pt.name || pt.location,
      status: pt.status || 'active',
      notes: pt.notes || ''
    }));
};

/**
 * Derive rodent stations array
 */
export const deriveRodentStations = (pointsList = null, includeInactive = false) => {
  const points = pointsList || getStoredPoints('rodents');
  return points
    .filter(pt => includeInactive || pt.status !== 'inactive')
    .map(pt => ({
      id: typeof pt.id === 'number' ? pt.id : parseInt(pt.id, 10) || pt.id,
      name: pt.no,
      code: pt.code || '',
      area: pt.name || `${pt.no} (${pt.code || ''}) ${pt.zone}`,
      status: pt.status || 'active',
      notes: pt.notes || ''
    }));
};
