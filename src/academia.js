// Pure data: schools (สำนักวิชา) and research-contract templates.

// demand: share added to enrollment demand • tuition: fee multiplier • reputation: target bonus
// research: bonus progress for contracts of this school • minLecturers: lecturers needed to open
export const SCHOOLS = [
  { id: 'science', name: 'วิทยาศาสตร์', color: '#e2b13c', cost: 300000, minLecturers: 6, req: {}, demand: 0.2, tuition: 1.0, reputation: 2 },
  { id: 'management', name: 'การจัดการ', color: '#3a6fb0', cost: 250000, minLecturers: 6, req: {}, demand: 0.25, tuition: 1.0, reputation: 1 },
  { id: 'arts', name: 'ศิลปศาสตร์', color: '#8c5bb5', cost: 220000, minLecturers: 5, req: {}, demand: 0.2, tuition: 0.95, reputation: 1 },
  { id: 'architecture', name: 'สถาปัตยกรรมศาสตร์และการออกแบบ', color: '#c08bd6', cost: 400000, minLecturers: 8, req: { chapter: 3 }, demand: 0.15, tuition: 1.1, reputation: 2 },
  { id: 'engineering', name: 'วิศวกรรมศาสตร์', color: '#b2452f', cost: 600000, minLecturers: 10, req: { chapter: 3, buildings: { academic: 1 } }, demand: 0.25, tuition: 1.15, reputation: 3 },
  { id: 'informatics', name: 'สารสนเทศศาสตร์', color: '#2aa3a3', cost: 500000, minLecturers: 8, req: { chapter: 3, buildings: { academic: 1 } }, demand: 0.2, tuition: 1.1, reputation: 2 },
  { id: 'nursing', name: 'พยาบาลศาสตร์', color: '#e58fb0', cost: 700000, minLecturers: 12, req: { chapter: 4 }, demand: 0.2, tuition: 1.2, reputation: 3 },
  { id: 'allied', name: 'สหเวชศาสตร์', color: '#d97a2b', cost: 700000, minLecturers: 12, req: { chapter: 4, buildings: { academic: 3 } }, demand: 0.15, tuition: 1.2, reputation: 3 },
  { id: 'medicine', name: 'แพทยศาสตร์', color: '#2f8f5b', cost: 3000000, minLecturers: 30, req: { chapter: 5, buildings: { hospital: 1, academic: 4 } }, demand: 0.2, tuition: 2.2, reputation: 8 },
  { id: 'international', name: 'สำนักวิชานานาชาติ', color: '#d5a156', cost: 1500000, minLecturers: 20, req: { chapter: 6 }, demand: 0.3, tuition: 1.5, reputation: 5 },
];
export const NO_SCHOOL = { id: 'none', name: 'ยังไม่สังกัดสำนักวิชา', color: '#9aa39c' };

// school: required opened school (null = any) • academic: academic buildings needed
// lecturers assigned • terms duration • upfront and final payment (฿) • reputation on completion
export const CONTRACT_TEMPLATES = [
  { title: 'พัฒนาพันธุ์ปาล์มน้ำมันให้ทนแล้ง', sponsor: 'กรมวิชาการเกษตร', school: 'science', academic: 1, lecturers: 3, terms: 2, upfront: 80000, payment: 420000, reputation: 2 },
  { title: 'ระบบเตือนภัยน้ำท่วมลุ่มน้ำปากพนัง', sponsor: 'จังหวัดนครศรีธรรมราช', school: 'engineering', academic: 2, lecturers: 5, terms: 3, upfront: 150000, payment: 900000, reputation: 4 },
  { title: 'เพิ่มมูลค่ากุ้งก้ามกราม', sponsor: 'สหกรณ์ประมงอ่าวไทย', school: 'science', academic: 1, lecturers: 3, terms: 2, upfront: 70000, payment: 380000, reputation: 2 },
  { title: 'ท่องเที่ยวชุมชนคีรีวง', sponsor: 'เครือข่ายท่องเที่ยวชุมชน', school: 'arts', academic: 0, lecturers: 2, terms: 2, upfront: 50000, payment: 260000, reputation: 2 },
  { title: 'แอปติดตามผู้ป่วยเบาหวานในชุมชน', sponsor: 'สำนักงานสาธารณสุขจังหวัด', school: 'informatics', academic: 2, lecturers: 4, terms: 3, upfront: 120000, payment: 700000, reputation: 3 },
  { title: 'ยางพาราสายพันธุ์ทนโรคใบร่วง', sponsor: 'การยางแห่งประเทศไทย', school: 'science', academic: 1, lecturers: 3, terms: 3, upfront: 90000, payment: 520000, reputation: 3 },
  { title: 'แผนการตลาดผ้าทอพื้นเมือง', sponsor: 'วิสาหกิจชุมชนผ้าทอ', school: 'management', academic: 0, lecturers: 2, terms: 1, upfront: 30000, payment: 160000, reputation: 1 },
  { title: 'บัญชีครัวเรือนเกษตรกรสวนยาง', sponsor: 'ธนาคารเพื่อการเกษตร', school: 'management', academic: 0, lecturers: 2, terms: 2, upfront: 40000, payment: 230000, reputation: 1 },
  { title: 'บ้านต้นแบบรับมือพายุฤดูมรสุม', sponsor: 'การเคหะแห่งชาติ', school: 'architecture', academic: 1, lecturers: 4, terms: 2, upfront: 90000, payment: 480000, reputation: 3 },
  { title: 'ภาษาไทยถิ่นใต้ในสื่อดิจิทัล', sponsor: 'กรมส่งเสริมวัฒนธรรม', school: 'arts', academic: 0, lecturers: 2, terms: 2, upfront: 40000, payment: 220000, reputation: 2 },
  { title: 'ระบบข้อมูลสุขภาพอำเภอท่าศาลา', sponsor: 'โรงพยาบาลชุมชน', school: 'nursing', academic: 2, lecturers: 4, terms: 2, upfront: 100000, payment: 560000, reputation: 3 },
  { title: 'โซลาร์เซลล์ลอยน้ำในบ่อกุ้ง', sponsor: 'การไฟฟ้าส่วนภูมิภาค', school: 'engineering', academic: 2, lecturers: 5, terms: 3, upfront: 160000, payment: 950000, reputation: 4 },
  { title: 'ยาสมุนไพรจากพืชป่าเขาหลวง', sponsor: 'บริษัทยาไทย', school: 'allied', academic: 3, lecturers: 5, terms: 3, upfront: 180000, payment: 1100000, reputation: 4 },
  { title: 'ทดลองทางคลินิกวัคซีนไข้เลือดออก', sponsor: 'สถาบันวัคซีนแห่งชาติ', school: 'medicine', academic: 4, lecturers: 8, terms: 4, upfront: 400000, payment: 3000000, reputation: 8 },
  { title: 'หลักสูตรออนไลน์ร่วมกับมหาวิทยาลัยต่างประเทศ', sponsor: 'เครือข่ายมหาวิทยาลัยอาเซียน', school: 'international', academic: 2, lecturers: 6, terms: 3, upfront: 200000, payment: 1400000, reputation: 5 },
  { title: 'สำรวจความพึงพอใจนักท่องเที่ยวขนอม', sponsor: 'การท่องเที่ยวแห่งประเทศไทย', school: null, academic: 0, lecturers: 2, terms: 1, upfront: 20000, payment: 120000, reputation: 1 },
];

// Crops for the smart farm. kind: 'annual' (replant after harvest) or 'perennial' (plant once, repeat yields).
// grow: terms to first harvest • every: terms between yields (perennial) • seed: planting cost per plot (฿)
// units/unit/price: produce per harvest per plot • labour: workers needed to harvest one plot
// keep: terms the produce stays fresh in storage (ready crops left in the field spoil after 1 term)
// processed: price multiplier and shelf life once the farm reaches level 3 (rubber sheets, palm oil)
// school: school that boosts yield • unlock: chapter / farmLevel / research keyword (any one unlocks)
export const CROPS = [
  { id: 'salad', name: 'ผักสลัดไฮโดรโปนิกส์', icon: '🥬', kind: 'annual', grow: 1, seed: 20000, units: 400, unit: 'กก.', price: 80, labour: 2, keep: 1, school: 'science', unlock: {} },
  { id: 'mushroom', name: 'เห็ดนางฟ้า', icon: '🍄', kind: 'annual', grow: 1, seed: 15000, units: 300, unit: 'กก.', price: 90, labour: 2, keep: 1, school: 'science', unlock: {} },
  { id: 'melon', name: 'เมล่อนในโรงเรือน', icon: '🍈', kind: 'annual', grow: 2, seed: 40000, units: 600, unit: 'ลูก', price: 150, labour: 3, keep: 2, school: 'science', unlock: { chapter: 3 } },
  { id: 'rice', name: 'ข้าวสังข์หยด', icon: '🌾', kind: 'annual', grow: 2, seed: 25000, units: 1500, unit: 'กก.', price: 45, labour: 3, keep: 6, school: 'management', unlock: { chapter: 3 } },
  { id: 'rubber', name: 'ยางพารา', icon: '🌳', kind: 'perennial', grow: 4, every: 1, seed: 120000, units: 800, unit: 'กก.', price: 55, labour: 3, keep: 1, processed: { price: 1.4, keep: 4, name: 'ยางแผ่นรมควัน' }, school: 'science', unlock: { farmLevel: 2, research: 'ยาง' } },
  { id: 'palm', name: 'ปาล์มน้ำมัน', icon: '🌴', kind: 'perennial', grow: 4, every: 1, seed: 120000, units: 6000, unit: 'กก.', price: 6, labour: 3, keep: 1, processed: { price: 1.5, keep: 4, name: 'น้ำมันปาล์มดิบ' }, school: 'engineering', unlock: { farmLevel: 2, research: 'ปาล์ม' } },
  { id: 'santol', name: 'กระท้อน', icon: '🍑', kind: 'perennial', grow: 4, every: 3, seed: 60000, units: 3000, unit: 'กก.', price: 30, labour: 4, keep: 1, school: 'science', unlock: { chapter: 3 } },
  { id: 'coconut', name: 'มะพร้าวน้ำหอม', icon: '🥥', kind: 'perennial', grow: 3, every: 1, seed: 80000, units: 1500, unit: 'ลูก', price: 20, labour: 2, keep: 2, school: 'management', unlock: { chapter: 4 } },
  { id: 'pomelo', name: 'ส้มโอ', icon: '🍊', kind: 'perennial', grow: 4, every: 3, seed: 70000, units: 2000, unit: 'ลูก', price: 60, labour: 4, keep: 3, school: 'science', unlock: { chapter: 4 } },
  { id: 'salak', name: 'สละ', icon: '🫐', kind: 'perennial', grow: 4, every: 3, seed: 70000, units: 2500, unit: 'กก.', price: 50, labour: 4, keep: 1, school: 'science', unlock: { chapter: 4 } },
  { id: 'coffee', name: 'กาแฟโรบัสต้า', icon: '☕', kind: 'perennial', grow: 4, every: 3, seed: 90000, units: 800, unit: 'กก.', price: 120, labour: 4, keep: 6, school: 'management', unlock: { chapter: 5 } },
  { id: 'mangosteen', name: 'มังคุด', icon: '🟣', kind: 'perennial', grow: 6, every: 3, seed: 150000, units: 2500, unit: 'กก.', price: 70, labour: 5, keep: 1, school: 'science', unlock: { chapter: 5 } },
  { id: 'durian', name: 'ทุเรียน', icon: '🍈', kind: 'perennial', grow: 7, every: 3, seed: 200000, units: 2000, unit: 'กก.', price: 150, labour: 5, keep: 1, school: 'science', unlock: { chapter: 6, farmLevel: 3 } },
];
