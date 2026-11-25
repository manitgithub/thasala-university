// Story: 6 chapters (levels), each split into stages (ตอนย่อย). Pure data + checkers; no DOM.
// check(state, m) -> {current, target}; a mission is done when current >= target.
const count = (s, type) => s.buildings.filter(b => b.type === type).length;
const atLevel = (s, lvl) => s.buildings.filter(b => (b.level || 1) >= lvl).length;
const goal = (current, target) => ({ current: Math.max(0, current), target });
const TYPES_UTIL = new Set(['water', 'power']);
const has = (s, id) => (s.schools || []).includes(id) ? 1 : 0;

export const DISCLAIMER = 'เรื่องราวได้แรงบันดาลใจจากประวัติมหาวิทยาลัยจริงในท่าศาลา ชื่อ ตัวละคร และรายละเอียดบางส่วนถูกแต่งขึ้นหรือดัดแปลง';
export const RECTOR = 'อธิการบดี ดร.ประภาพร';
export const VP = 'รองอธิการฝ่ายวิจัย ดร.ธนากร';

const M = {
  admin: { id: 'admin', text: 'สร้างอาคารบริหาร', check: s => goal(count(s, 'admin'), 1) },
  roads15: { id: 'roads15', text: 'สร้างถนนเพิ่มอย่างน้อย 15 ช่อง', check: s => goal(s.roadsBuilt, 15) },
  water1: { id: 'water1', text: 'สร้างโรงผลิตน้ำประปา', check: s => goal(count(s, 'water'), 1) },
  power1: { id: 'power1', text: 'สร้างสถานีไฟฟ้าย่อย', check: s => goal(count(s, 'power'), 1) },
  allSupplied: { id: 'allSupplied', text: 'จ่ายน้ำและไฟฟ้าให้อาคารทุกหลัง', check: (s, m) => goal(s.buildings.some(b => !TYPES_UTIL.has(b.type)) && m.unsupplied === 0 ? 1 : 0, 1) },
  digital1: { id: 'digital1', text: 'สร้างศูนย์คอมพิวเตอร์', check: s => goal(count(s, 'digital'), 1) },
  wifi60: { id: 'wifi60', text: 'Wi-Fi ครอบคลุมอาคาร 60%', check: (s, m) => goal(Math.round((m.wifi || 0) * 100), 60) },
  wifi90: { id: 'wifi90', text: 'Wi-Fi ครอบคลุมอาคาร 90%', check: (s, m) => goal(Math.round((m.wifi || 0) * 100), 90) },
  services1: { id: 'services1', text: 'สร้างส่วนบริการกลาง', check: s => goal(count(s, 'services'), 1) },
  guard1: { id: 'guard1', text: 'ติดตั้งป้อมรักษาความปลอดภัย 1 จุด', check: s => goal((s.facilities || []).filter(o => o.kind === 'guard').length, 1) },
  stops3: { id: 'stops3', text: 'ติดตั้งป้ายรถไฟฟ้า 3 ป้าย', check: s => goal((s.facilities || []).filter(o => o.kind === 'stop').length, 3) },
  shuttle1: { id: 'shuttle1', text: 'เปิดบริการรถไฟฟ้ารับส่ง 1 คัน', check: s => goal(s.shuttles || 0, 1) },
  cam5: { id: 'cam5', text: 'ติดตั้งกล้องวงจรปิด 5 ตัว', check: s => goal((s.facilities || []).filter(o => o.kind === 'cam').length, 5) },
  farm1: { id: 'farm1', text: 'สร้างศูนย์สมาร์ทฟาร์ม', check: s => goal(count(s, 'farm'), 1) },
  harvest1: { id: 'harvest1', text: 'เก็บเกี่ยวผลผลิตครั้งแรก', check: s => goal(s.harvests || 0, 1) },
  fruit3: { id: 'fruit3', text: 'เก็บเกี่ยวไม้ยืนต้น 3 ครั้ง', check: s => goal(s.perennialHarvests || 0, 3) },
  lect10: { id: 'lect10', text: 'จ้างอาจารย์ 10 คน', check: s => goal(s.lecturers, 10) },
  lecture: { id: 'lecture', text: 'สร้างห้องเรียนรวม 1 หลัง', check: s => goal(count(s, 'lecture'), 1) },
  dorm: { id: 'dorm', text: 'สร้างหอพัก 1 หลัง', check: s => goal(count(s, 'dorm'), 1) },
  canteen: { id: 'canteen', text: 'สร้างโรงอาหาร 1 หลัง', check: s => goal(count(s, 'canteen'), 1) },
  school1: { id: 'school1', text: 'เปิดสำนักวิชาแห่งแรก', check: s => goal(s.schools.length, 1) },
  students300: { id: 'students300', text: 'นักศึกษา 300 คน', check: s => goal(s.students, 300) },
  beds: { id: 'beds', text: 'เตียงพอสำหรับนักศึกษาทุกคน', check: (s, m) => goal(s.students >= 1 && m.beds >= s.students ? 1 : 0, 1) },
  sat70: { id: 'sat70', text: 'ความพึงพอใจอย่างน้อย 70%', check: s => goal(s.students >= 1 ? s.satisfaction : 0, 70) },
  library: { id: 'library', text: 'สร้างห้องสมุด 1 หลัง', check: s => goal(count(s, 'library'), 1) },
  school2: { id: 'school2', text: 'เปิดสำนักวิชา 2 แห่ง', check: s => goal(s.schools.length, 2) },
  students600: { id: 'students600', text: 'นักศึกษา 600 คน', check: s => goal(s.students, 600) },
  academic2: { id: 'academic2', text: 'สร้างอาคารวิชาการ 2 หลัง', check: s => goal(count(s, 'academic'), 2) },
  coop1: { id: 'coop1', text: 'สร้างอาคารสหกิจศึกษา 1 หลัง', check: s => goal(count(s, 'coop'), 1) },
  grads300: { id: 'grads300', text: 'บัณฑิตสะสม 300 คน', check: s => goal(s.graduatesTotal, 300) },
  research1: { id: 'research1', text: 'งานวิจัยรับจ้างสำเร็จ 1 งาน', check: s => goal(s.researchDone, 1) },
  rep35: { id: 'rep35', text: 'ชื่อเสียง 35', check: s => goal(Math.floor(s.reputation), 35) },
  school5: { id: 'school5', text: 'เปิดสำนักวิชา 5 แห่ง', check: s => goal(s.schools.length, 5) },
  students3000: { id: 'students3000', text: 'นักศึกษา 3,000 คน', check: s => goal(s.students, 3000) },
  academic5: { id: 'academic5', text: 'อาคารวิชาการ 5 หลัง', check: s => goal(count(s, 'academic'), 5) },
  upgrade2: { id: 'upgrade2', text: 'อัปเกรดอาคารใดก็ได้ถึงระดับ 2', check: s => goal(atLevel(s, 2), 1) },
  research3: { id: 'research3', text: 'งานวิจัยสำเร็จหรือได้ทุนวิจัยรวม 3 ครั้ง', check: s => goal(s.researchDone + s.grants, 3) },
  rep50: { id: 'rep50', text: 'ชื่อเสียง 50', check: s => goal(Math.floor(s.reputation), 50) },
  hospital: { id: 'hospital', text: 'สร้างโรงพยาบาล 1 แห่ง', check: s => goal(count(s, 'hospital'), 1) },
  medicine: { id: 'medicine', text: 'เปิดสำนักวิชาแพทยศาสตร์', check: s => goal(has(s, 'medicine'), 1) },
  students6000: { id: 'students6000', text: 'นักศึกษา 6,000 คน', check: s => goal(s.students, 6000) },
  rep65: { id: 'rep65', text: 'ชื่อเสียง 65', check: s => goal(Math.floor(s.reputation), 65) },
  match10: { id: 'match10', text: 'อาคารที่ตรงผังจริง 10 หลัง', check: s => goal(s.buildings.filter(b => b.matched).length, 10) },
  international: { id: 'international', text: 'เปิดสำนักวิชานานาชาติ', check: s => goal(has(s, 'international'), 1) },
  school8: { id: 'school8', text: 'เปิดสำนักวิชา 8 แห่ง', check: s => goal(s.schools.length, 8) },
  level3x3: { id: 'level3x3', text: 'อาคารระดับ 3 อย่างน้อย 3 หลัง', check: s => goal(atLevel(s, 3), 3) },
  sat80: { id: 'sat80', text: 'ความพึงพอใจ 80%', check: s => goal(s.students >= 1 ? s.satisfaction : 0, 80) },
  students10000: { id: 'students10000', text: 'นักศึกษา 10,000 คน', check: s => goal(s.students, 10000) },
  rep80: { id: 'rep80', text: 'ชื่อเสียง 80', check: s => goal(Math.floor(s.reputation), 80) },
  money20m: { id: 'money20m', text: 'เงินคงเหลือ 20,000,000 ฿', check: s => goal(s.money, 20000000) },
};

export const CHAPTERS = [
  {
    id: 'land', level: 1, year: 2535, title: 'ผืนดินแห่งความหวัง', unlocks: ['admin', 'lecture', 'dorm', 'canteen', 'water', 'power'], reward: 1500000,
    intro: 'พ.ศ. 2535 หลังจากชาวนครศรีธรรมราชและภาคใต้ตอนบนรวมพลังเรียกร้องมานานหลายปี ในที่สุดกฎหมายจัดตั้ง "มหาวิทยาลัยแห่งท่าศาลา" ก็ประกาศใช้ ผืนดินเกือบหมื่นไร่ริมอ่าวไทยยังเป็นทุ่งหญ้า ป่า และลำคลอง มีเพียงถนนสายหลักไม่กี่เส้น คุณได้รับมอบหมายให้เป็นผู้วางรากฐาน สร้างมหาวิทยาลัยจากผืนดินว่างเปล่าให้พร้อมต้อนรับนักศึกษารุ่นแรก',
    outro: 'หกปีแห่งการก่อสร้างผ่านไป อาคารหลังแรกพร้อมแล้ว คณาจารย์รุ่นบุกเบิกพร้อมสอน ประตูมหาวิทยาลัยกำลังจะเปิดรับนักศึกษารุ่นแรก',
    stages: [
      { title: 'วางศิลาฤกษ์', speaker: RECTOR, scene: 'ยินดีที่ได้ร่วมงานกันค่ะ ฉันประภาพร อธิการบดีคนแรกของที่นี่ เริ่มจากอาคารบริหารริมถนนหลัก แล้วตัดถนนเข้าไปในพื้นที่ ทุกอย่างต้องมีทางเข้าถึงก่อน', missions: [M.admin, M.roads15], reward: 200000 },
      { title: 'น้ำและไฟมาถึง', speaker: VP, scene: 'อาคารที่ไม่มีน้ำไม่มีไฟก็ใช้งานไม่ได้ครับ สร้างโรงผลิตน้ำประปากับสถานีไฟฟ้าย่อย แล้วเดินท่อและสายไฟไปถึงอาคารบริหาร (ดูได้ชัดในมุมมองสาธารณูปโภค)', missions: [M.water1, M.power1, M.allSupplied], reward: 200000 },
      { title: 'คณาจารย์รุ่นบุกเบิก', speaker: VP, scene: 'ผมธนากร ดูแลงานวิจัยและงบประมาณครับ ตึกสวยแค่ไหนก็ไร้ความหมายถ้าไม่มีอาจารย์ จ้างอาจารย์รุ่นแรกสักสิบคน แต่ระวังค่าจ้างด้วยนะครับ', missions: [M.lect10], reward: 200000 },
      { title: 'พร้อมเปิดรับ', speaker: RECTOR, scene: 'นักศึกษาของเราจะเรียนและใช้ชีวิตอยู่ในมหาวิทยาลัย ต้องมีห้องเรียน หอพัก และโรงอาหาร ก่อนวันเปิดภาคเรียนแรก', missions: [M.lecture, M.dorm, M.canteen], reward: 0 },
    ],
  },
  {
    id: 'first', level: 2, year: 2541, title: 'นักศึกษารุ่นแรก', unlocks: ['library', 'sports', 'farm', 'services'], reward: 1000000,
    intro: 'พ.ศ. 2541 นักศึกษารุ่นแรกเดินทางมาถึงท่าศาลา ที่นี่เป็นมหาวิทยาลัยแบบพักในที่ตั้ง นักศึกษาทุกคนเรียนและใช้ชีวิตอยู่ในมหาวิทยาลัย และเรียนแบบไตรภาค ปีละ 3 เทอม ดูแลให้ทุกคนมีที่นอน มีอาหาร และมีความสุขกับชีวิตในรั้วมหาวิทยาลัย',
    outro: 'เสียงหัวเราะของนักศึกษาดังไปทั่วหอพัก ชื่อของมหาวิทยาลัยใหม่แห่งภาคใต้เริ่มเป็นที่รู้จัก',
    stages: [
      { title: 'ต้อนรับน้องใหม่', speaker: RECTOR, scene: 'นักศึกษาต้องมีบ้านทางวิชาการ เปิดสำนักวิชาแรกของเรา แล้วรับน้องใหม่ให้ได้สามร้อยคน', missions: [M.school1, M.students300], reward: 250000 },
      { title: 'ชีวิตในหอพัก', speaker: VP, scene: 'นักศึกษาบ่นว่าห้องไม่พอครับ ถ้าคนไม่มีที่นอนก็ไม่มีใครอยากเรียนต่อ ดูแลเรื่องหอพักกับความเป็นอยู่หน่อย แล้วตั้งส่วนบริการกลางไว้ซ่อมถนน กับป้อมยามดูแลความปลอดภัยด้วยครับ', missions: [M.beds, M.sat70, M.services1, M.guard1], reward: 250000 },
      { title: 'แหล่งเรียนรู้', speaker: RECTOR, scene: 'มหาวิทยาลัยที่ดีต้องมีห้องสมุด และต้องมีทางเลือกให้นักศึกษามากกว่าหนึ่งสาขา', missions: [M.library, M.school2, M.students600], reward: 250000 },
      { title: 'สมาร์ทฟาร์ม', speaker: VP, scene: 'ที่ดินเราเหลือเยอะ ทำไมไม่ปลูกพืชขายล่ะครับ ศูนย์สมาร์ทฟาร์มเริ่มจากผักสลัดกับเห็ดก่อน พอโตแล้วค่อยขยับไปยางพารา ปาล์ม และผลไม้ภาคใต้ อย่าลืมจ้างคนงานไว้เก็บเกี่ยว', missions: [M.farm1, M.harvest1], reward: 0 },
    ],
  },
  {
    id: 'coop', level: 3, year: 2545, title: 'เรียนคู่กับทำงาน', unlocks: ['academic', 'coop', 'digital'], reward: 2000000,
    intro: 'จุดเด่นของมหาวิทยาลัยคือสหกิจศึกษา นักศึกษาได้ออกไปทำงานจริงในสถานประกอบการก่อนจบการศึกษา บัณฑิตจึงพร้อมทำงานตั้งแต่วันแรก ถึงเวลาสร้างอาคารวิชาการและเชื่อมมหาวิทยาลัยกับโลกการทำงาน',
    outro: 'บริษัทต่างๆ เริ่มมาจองตัวบัณฑิตตั้งแต่ยังไม่จบ งานวิจัยชิ้นแรกก็ส่งมอบสำเร็จ ความเชื่อมั่นในมหาวิทยาลัยเติบโตขึ้นทุกปี',
    stages: [
      { title: 'ห้องปฏิบัติการแห่งแรก', speaker: VP, scene: 'ถ้าเราจะรับงานวิจัย เราต้องมีอาคารวิชาการและห้องแล็บ และศูนย์คอมพิวเตอร์ไว้เชื่อมต่อโลกครับ', missions: [M.academic2, M.digital1], reward: 300000 },
      { title: 'สหกิจศึกษา', speaker: RECTOR, scene: 'ให้นักศึกษาได้ลองทำงานจริงก่อนจบ บัณฑิตรุ่นแรกๆ ของเราจะเป็นหน้าตาของมหาวิทยาลัย', missions: [M.coop1, M.grads300], reward: 300000 },
      { title: 'รถไฟฟ้าในมหาวิทยาลัย', speaker: RECTOR, scene: 'วิทยาเขตเรากว้างมาก เดินจากหอไปตึกเรียนไกลเกินไป อัปเกรดส่วนบริการกลางให้เดินรถไฟฟ้ารับส่งได้ ตั้งป้ายจอดใกล้หอพัก ตึกเรียน และโรงอาหารนะคะ', missions: [M.stops3, M.shuttle1], reward: 300000 },
      { title: 'งานวิจัยชิ้นแรก', speaker: VP, scene: 'มีหน่วยงานติดต่อมาขอให้เราทำวิจัยแล้วครับ ดูที่แผงบริหาร รับงานที่อาจารย์เราทำไหว ได้ทั้งเงินและชื่อเสียง', missions: [M.research1, M.rep35], reward: 0 },
    ],
  },
  {
    id: 'research', level: 4, year: 2552, title: 'มหาวิทยาลัยแห่งการวิจัย', unlocks: [], reward: 3000000,
    intro: 'มหาวิทยาลัยเติบโตเข้าสู่ยุคแห่งการวิจัย ห้องปฏิบัติการและสายวิทยาศาสตร์สุขภาพขยายตัว นักวิจัยเริ่มได้รับทุนจากทั่วประเทศ สร้างความรู้ที่ช่วยชุมชนภาคใต้',
    outro: 'งานวิจัยจากท่าศาลาถูกตีพิมพ์และนำไปใช้จริง ถึงเวลาก้าวสู่ภารกิจที่ยิ่งใหญ่กว่าเดิม',
    stages: [
      { title: 'ขยายสำนักวิชา', speaker: RECTOR, scene: 'คนใต้อยากเรียนวิศวะ พยาบาล และอีกหลายสาขาใกล้บ้าน ถึงเวลาขยายสำนักวิชาแล้วค่ะ', missions: [M.school5, M.students3000], reward: 500000 },
      { title: 'ห้องแล็บทันสมัย', speaker: VP, scene: 'อาคารเก่าเริ่มคับแคบ อัปเกรดอาคารสักหลังให้ทันสมัย เพิ่มอาคารวิชาการ และให้ Wi-Fi ครอบคลุมทั้งมหาวิทยาลัย นักวิจัยต้องใช้เน็ตตลอดเวลาครับ', missions: [M.academic5, M.upgrade2, M.wifi60], reward: 500000 },
      { title: 'นักวิจัยมืออาชีพ', speaker: VP, scene: 'ชื่อเสียงด้านวิจัยสร้างได้จากผลงานจริงเท่านั้นครับ ส่งมอบงานให้ได้อีกหลายชิ้น ห้องแล็บมีเครื่องมือราคาแพง ติดกล้องวงจรปิดด้วยนะครับ', missions: [M.research3, M.rep50, M.cam5], reward: 0 },
    ],
  },
  {
    id: 'medical', level: 5, year: 2560, title: 'ศูนย์การแพทย์เพื่อชาวใต้', unlocks: ['hospital'], reward: 5000000,
    intro: 'มหาวิทยาลัยตัดสินใจสร้างโรงพยาบาลศูนย์การแพทย์ เพื่อดูแลสุขภาพคนในพื้นที่ และเป็นที่ฝึกของนักศึกษาแพทย์ พยาบาล และสหเวชศาสตร์ นี่คือโครงการที่ใหญ่และแพงที่สุดเท่าที่เคยมีมา',
    outro: 'โรงพยาบาลเปิดบริการ นักศึกษาแพทย์รุ่นแรกเริ่มฝึกงาน ผู้ป่วยจากทั่วภาคใต้ไม่ต้องเดินทางไกลอีกต่อไป',
    stages: [
      { title: 'โรงพยาบาลของชุมชน', speaker: RECTOR, scene: 'โรงพยาบาลนี้คือคำสัญญาที่เราให้ไว้กับคนในพื้นที่ ใช้งบมาก แต่คุ้มค่าทุกบาทค่ะ', missions: [M.hospital], reward: 800000 },
      { title: 'สำนักวิชาแพทยศาสตร์', speaker: VP, scene: 'การเปิดแพทย์ต้องมีอาจารย์จำนวนมากและอาคารวิชาการพร้อม ค่าเทอมสูงก็จริง แต่ต้องลงทุนก่อนครับ', missions: [M.medicine, M.students6000], reward: 800000 },
      { title: 'ชื่อเสียงระดับประเทศ', speaker: RECTOR, scene: 'คนเริ่มรู้จักเราในฐานะมหาวิทยาลัยชั้นนำของภาคใต้ รักษามาตรฐานและผังมหาวิทยาลัยที่สวยงามไว้ และผลไม้จากฟาร์มเราก็เริ่มขึ้นชื่อแล้วนะคะ', missions: [M.rep65, M.match10, M.fruit3], reward: 0 },
    ],
  },
  {
    id: 'global', level: 6, year: 2565, title: 'สู่ระดับสากล', unlocks: [], reward: 0,
    intro: 'จากผืนดินว่างเปล่า วันนี้มหาวิทยาลัยแห่งท่าศาลาพร้อมก้าวสู่เวทีโลก นักศึกษาต่างชาติเริ่มเดินทางมาเรียน งานวิจัยถูกอ้างอิงทั่วโลก ภารกิจสุดท้ายคือการเป็นมหาวิทยาลัยชั้นนำอย่างแท้จริง',
    outro: 'คุณได้เปลี่ยนผืนดินแห่งความหวังให้กลายเป็นมหาวิทยาลัยที่คนทั้งภาคใต้ภาคภูมิใจ ขอบคุณที่ร่วมสร้างเรื่องราวนี้',
    stages: [
      { title: 'ประตูสู่อาเซียน', speaker: RECTOR, scene: 'นักศึกษาจากมาเลเซีย อินโดนีเซีย และอีกหลายประเทศสนใจมาเรียนกับเรา เปิดสำนักวิชานานาชาติกันเถอะค่ะ', missions: [M.international, M.school8], reward: 1500000 },
      { title: 'อาคารชั้นนำ', speaker: VP, scene: 'มาตรฐานสากลต้องมีสิ่งอำนวยความสะดวกระดับสูงสุด อัปเกรดอาคารหลักให้ถึงระดับสามครับ', missions: [M.level3x3, M.sat80, M.wifi90], reward: 1500000 },
      { title: 'มหาวิทยาลัยชั้นนำ', speaker: RECTOR, scene: 'ก้าวสุดท้ายแล้วค่ะ นักศึกษาหนึ่งหมื่นคน ชื่อเสียงที่มั่นคง และฐานะการเงินที่แข็งแรงพอจะยืนได้อีกหลายสิบปี', missions: [M.students10000, M.rep80, M.money20m], reward: 0 },
    ],
  },
];

// One-off scenes triggered by milestones (see sim.js `milestones`).
export const SCENES = {
  firstLecturers: { speaker: VP, text: 'อาจารย์ชุดแรกมาถึงแล้วครับ อาจารย์หนึ่งคนดูแลนักศึกษาได้ราว 25 คน ถ้ารับนักศึกษาเกินนั้นคุณภาพจะตก' },
  firstSchool: { speaker: RECTOR, text: 'สำนักวิชาแรกเปิดแล้ว! นักศึกษาจะมีบ้านทางวิชาการ และยิ่งมีสำนักวิชามาก คนก็ยิ่งอยากมาเรียน' },
  firstResearch: { speaker: VP, text: 'รับงานวิจัยชิ้นแรกแล้ว อาจารย์ที่ทำวิจัยจะสอนไม่ได้ช่วงนั้น อย่าลืมจ้างคนเผื่อไว้นะครับ' },
  firstResearchDone: { speaker: VP, text: 'ส่งมอบงานวิจัยสำเร็จ ผู้ว่าจ้างพอใจมาก เงินก้อนนี้ช่วยงบประมาณเราได้เยอะเลยครับ' },
  firstUpgrade: { speaker: RECTOR, text: 'อาคารที่ปรับปรุงแล้วดูดีขึ้นมาก ทั้งความจุและบรรยากาศ นักศึกษาชอบแน่นอนค่ะ' },
  ratioHigh: { speaker: VP, text: 'เตือนครับ นักศึกษาต่ออาจารย์เกิน 25 คนแล้ว ห้องเรียนแน่น ชื่อเสียงจะตก จ้างอาจารย์เพิ่มเถอะครับ' },
  waterShort: { speaker: VP, text: 'น้ำประปาไม่พอหรือท่อไปไม่ถึงบางอาคารครับ อาคารที่ขาดน้ำจะใช้งานไม่ได้ สร้างโรงผลิตน้ำเพิ่มหรืออัปเกรด แล้วเดินท่อให้ครบ' },
  powerShort: { speaker: VP, text: 'ไฟฟ้าไม่พอครับ บางอาคารดับ ต้องเพิ่มสถานีไฟฟ้าย่อยหรือเดินสายไฟให้ถึง' },
  firstWifi: { speaker: RECTOR, text: 'จุดกระจาย Wi-Fi แรกเปิดใช้แล้ว นักศึกษาส่งงานออนไลน์ได้ทุกที่ที่สัญญาณไปถึงค่ะ' },
  digitalUp: { speaker: RECTOR, text: 'ศูนย์คอมพิวเตอร์ของเราก้าวขึ้นเป็นศูนย์เทคโนโลยีดิจิทัลแล้ว ติดตั้งจุดกระจายได้มากขึ้น และงานวิจัยก็เร็วขึ้นด้วยค่ะ' },
  farmBuilt: { speaker: VP, text: 'ศูนย์สมาร์ทฟาร์มพร้อมแล้ว! คลิกที่ฟาร์มเพื่อเลือกพืชลงแปลง พอสุกต้องกดเก็บเกี่ยวเอง ถ้าทิ้งไว้นานจะเสีย และต้องมีคนงานพอด้วยนะครับ' },
  firstHarvest: { speaker: RECTOR, text: 'ผลผลิตล็อตแรกจากฟาร์มของเรา! เก็บไว้รอราคาดีหรือขายเลยก็ได้ แต่อย่าเก็บนานเกินจนเน่านะคะ' },
  servicesBuilt: { speaker: VP, text: 'ส่วนบริการกลางพร้อมทำงาน ทีมช่างจะซ่อมถนนทุกเทอม ยิ่งคนเยอะถนนยิ่งพังเร็ว อัปเกรดเพื่อเพิ่มทีมซ่อม เปิดรถไฟฟ้า และศูนย์ความปลอดภัยครับ' },
  roadBad: { speaker: VP, text: 'ถนนเป็นหลุมเป็นบ่อแล้วครับ นักศึกษาขี่มอเตอร์ไซค์ลำบาก อุบัติเหตุจะเพิ่ม ต้องอัปเกรดส่วนบริการกลางให้ซ่อมได้ทัน' },
  firstIncident: { speaker: RECTOR, text: 'เกิดเหตุไม่คาดฝันในมหาวิทยาลัย ความปลอดภัยของนักศึกษาสำคัญที่สุด เพิ่มป้อมรักษาความปลอดภัยให้ครอบคลุมหอพักและตึกเรียนค่ะ' },
  firstShuttle: { speaker: RECTOR, text: 'รถไฟฟ้ารับส่งคันแรกออกวิ่งแล้ว! นักศึกษาไม่ต้องเดินตากแดดไกลๆ อีก ยิ่งป้ายจอดครอบคลุมมากยิ่งดีค่ะ' },
  firstCam: { speaker: VP, text: 'กล้องวงจรปิดเชื่อมกับศูนย์ความปลอดภัยแล้ว ต้องมีไฟฟ้าตลอดนะครับ ไม่งั้นกล้องดับ' },
  students1000: { speaker: RECTOR, text: 'นักศึกษาครบหนึ่งพันคนแล้วค่ะ จากผืนดินว่างเปล่าเมื่อไม่กี่ปีก่อน' },
  students5000: { speaker: RECTOR, text: 'ห้าพันคน! ถนนในมหาวิทยาลัยคึกคักทั้งวัน อย่าลืมดูแลเรื่องหอพักและอาหารให้ทั่วถึงนะคะ' },
};
