import { MAP } from './map-data.js';
import { CHAPTERS, SCENES, VP as VP_NAME } from './story.js';
import { SCHOOLS, CONTRACT_TEMPLATES, NO_SCHOOL, CROPS } from './academia.js';
export { SCHOOLS, NO_SCHOOL, CROPS };

export const SAVE_VERSION = 3;
export const ROAD = { name: 'ถนน', cost: 6000, hintCost: 3000, upkeep: 150, color: '#b8c0b7' };
export const ECON = { tuition: 1800, perStudent: 500, startMoney: 5000000, startYear: 2535, hireFee: 30000, salary: 8000, perLecturer: 25 };
export const MAX_LEVEL = 3;

export const TYPES = Object.freeze({
  admin:    { name: 'อาคารบริหาร',      w: 3, h: 3, cost: 600000,  upkeep: 40000,  color: '#d5a156', description: 'หัวใจของมหาวิทยาลัย • สร้างได้หนึ่งแห่ง • ระดับสูงขึ้นรับงานวิจัยพร้อมกันได้มากขึ้น' },
  lecture:  { name: 'ห้องเรียนรวม',     w: 4, h: 3, cost: 500000,  upkeep: 30000,  seats: 400, color: '#e7c97e', description: 'ที่นั่งเรียน 400 ที่' },
  dorm:     { name: 'หอพัก',            w: 3, h: 3, cost: 400000,  upkeep: 25000,  beds: 300,  color: '#e59c83', description: 'เตียงพัก 300 เตียง' },
  canteen:  { name: 'โรงอาหาร',         w: 3, h: 2, cost: 250000,  upkeep: 15000,  meals: 600, color: '#a8bf73', description: 'อาหาร 600 คน / เทอม' },
  library:  { name: 'ห้องสมุด',         w: 4, h: 4, cost: 900000,  upkeep: 60000,  color: '#85bdb5', description: 'บริการ 1,800 คน • เพิ่มความพึงพอใจและชื่อเสียง' },
  sports:   { name: 'ศูนย์กีฬา',        w: 4, h: 4, cost: 700000,  upkeep: 35000,  color: '#b4cf88', description: 'บริการ 2,000 คน • เพิ่มความพึงพอใจ' },
  academic: { name: 'อาคารวิชาการ',     w: 4, h: 3, cost: 1200000, upkeep: 70000,  color: '#9eafe0', description: 'วิจัย • รองรับนักศึกษาเพิ่ม 2,000 คน • โอกาสได้ทุนวิจัย' },
  coop:     { name: 'อาคารสหกิจศึกษา',  w: 3, h: 3, cost: 500000,  upkeep: 45000,  color: '#c9a0d8', description: 'ผู้สมัครเรียนเพิ่ม 15% • ชื่อเสียงเพิ่ม' },
  hospital: { name: 'โรงพยาบาล',        w: 5, h: 5, cost: 6000000, upkeep: 250000, color: '#e3abae', description: 'ชื่อเสียงเพิ่มมาก • ค่าดูแลสูง' },
  water:    { name: 'โรงผลิตน้ำประปา',  w: 3, h: 3, cost: 450000,  upkeep: 18000,  color: '#4c9ac2', supply: 'water', description: 'ผลิตน้ำประปา 1,500 หน่วย • ต่อท่อประปาไปยังอาคาร', utility: true },
  power:    { name: 'สถานีไฟฟ้าย่อย',   w: 2, h: 2, cost: 500000,  upkeep: 22000,  color: '#d4b34f', supply: 'power', description: 'จ่ายไฟ 1,500 หน่วย • เดินสายไฟไปยังอาคาร', utility: true },
  services: { name: 'ส่วนบริการกลาง', w: 4, h: 3, cost: 700000, upkeep: 35000, color: '#9c8f7a', description: 'ซ่อมบำรุงถนน • ระดับ 2 เดินรถไฟฟ้ารับส่ง • ระดับ 3 ศูนย์ความปลอดภัยและกล้องวงจรปิด' },
  farm:     { name: 'ศูนย์สมาร์ทฟาร์ม', levelNames: ['ศูนย์สมาร์ทฟาร์ม', 'ฟาร์มอัจฉริยะ', 'ศูนย์เกษตรนวัตกรรม'], w: 5, h: 4, cost: 800000, upkeep: 30000, color: '#8fbf5a', description: 'ปลูกพืชขายหารายได้ • แปลงปลูก 2 แปลงต่อระดับ • ระดับ 3 แปรรูปและเก็บเกี่ยวอัตโนมัติ' },
  digital:  { name: 'ศูนย์คอมพิวเตอร์', levelNames: ['ศูนย์คอมพิวเตอร์', 'ศูนย์เทคโนโลยีดิจิทัล', 'ศูนย์นวัตกรรมดิจิทัล'], w: 3, h: 3, cost: 900000, upkeep: 45000, color: '#53a6b8', description: 'แกนหลักเครือข่าย Wi-Fi • ระดับสูงขึ้นติดตั้งจุดกระจายได้มากขึ้น' },
});
// Per-building utility demand (level 1); scaled by upkeepScale(level).
export const DEMAND = {
  admin: [60, 80], lecture: [80, 120], dorm: [200, 150], canteen: [150, 100], library: [40, 120], sports: [120, 60],
  academic: [100, 250], coop: [40, 80], hospital: [400, 500], digital: [30, 400], farm: [300, 100], services: [80, 120],
};
export const PLANT_SUPPLY = 1500;
export const LINES = {
  pipes: { name: 'ท่อประปา', kind: 'water', cost: 2000, upkeep: 50, color: '#3d8fd1' },
  powerLines: { name: 'เสาไฟฟ้า', kind: 'power', cost: 8000, upkeep: 150, color: '#e3b72f', span: 7, reach: 3 },
};
export const WIFI = { radius: 6, radiusByLevel: [0, 6, 8, 10], cost: 40000, upkeep: 2000, maxByLevel: [0, 8, 20, 40] };

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const logged = (state, ...messages) => [...messages, ...state.log].slice(0, 60);
const levelOf = b => b.level || 1;
export const capacityScale = lvl => 1 + 0.5 * (lvl - 1);   // seats / beds / meals
export const effectScale = lvl => 1 + 0.4 * (lvl - 1);     // library, sports, academic, coop, hospital weight
export const upkeepScale = lvl => 1 + 0.4 * (lvl - 1);

function mix(seed) { let h = seed >>> 0; h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); return (h ^ (h >>> 16)) >>> 0; }
function lcg(seed) { let x = mix(seed); return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }
// Research pays: base template ×2, plus up to +100% more with reputation (sponsors pay famous universities more).
export const RESEARCH_PAY = 2;
export const researchPayFactor = reputation => RESEARCH_PAY * (1 + Math.max(0, reputation) / 100);
function makeOffers(seed, term, reputation = 10) {
  const r = lcg(seed ^ 0x9e3779b9), pool = CONTRACT_TEMPLATES.map((t, i) => i), out = [], k = researchPayFactor(reputation);
  for (let n = 0; n < 3 && pool.length; n++) {
    const i = pool.splice(Math.floor(r() * pool.length), 1)[0], t = CONTRACT_TEMPLATES[i];
    out.push({ ...t, id: `${term}-${i}`, upfront: Math.round(t.upfront * k / 1000) * 1000, payment: Math.round(t.payment * k / 1000) * 1000 });
  }
  return out;
}

export function createState(seed = 2535, map = MAP) {
  return {
    version: SAVE_VERSION, map, seed: seed >>> 0, year: ECON.startYear, term: 1, termCount: 0, money: ECON.startMoney,
    reputation: 10, students: 0, satisfaction: 70, buildings: [], roads: [], claimedGhosts: [], nextId: 1,
    pipes: [], powerLines: [], aps: [], facilities: [], shuttles: 0, roadCondition: 100, safetyPenalty: 0, incidents: 0, workers: 0, storage: [], labourUsed: 0, harvests: 0, perennialHarvests: 0, farmIncome: 0, researchTitles: [], lecturers: 0, schools: [], researchOffers: makeOffers(seed, 0), researchActive: [], researchDone: 0,
    debtTerms: 0, lastFinance: null, chapter: 0, stage: 0, missionsDone: [], graduatesTotal: 0, grants: 0, roadsBuilt: 0,
    flags: [], finished: false, storyQueue: [{ kind: 'intro', chapter: 0 }, { kind: 'stage', chapter: 0, stage: 0 }],
    log: ['ยินดีต้อนรับสู่มหาวิทยาลัยแห่งท่าศาลา • เริ่มจากอาคารบริหารติดถนน'],
  };
}

// ---------- tiles & roads ----------
const roadSetCache = new WeakMap();
function roadSet(state) {
  let set = roadSetCache.get(state.roads);
  if (!set) { set = new Set(state.roads); roadSetCache.set(state.roads, set); }
  return set;
}
export function tileAt(state, x, y) {
  const { w, h, tiles } = state.map;
  if (x < 0 || y < 0 || x >= w || y >= h) return 'O';
  const i = y * w + x;
  return roadSet(state).has(i) ? 'r' : tiles[i];
}
const isRoad = t => t === 'R' || t === 'r';

// Road tiles reachable from the fixed main network.
const connectedCache = new WeakMap();
function connectedRoads(state) {
  const key = state.roads;
  const cached = connectedCache.get(key);
  if (cached && cached.map === state.map) return cached.set;
  const { w, h, tiles } = state.map;
  const mine = roadSet(state);
  const seen = new Set(), stack = [];
  for (let i = 0; i < tiles.length; i++) if (tiles[i] === 'R') { seen.add(i); stack.push(i); }
  while (stack.length) {
    const i = stack.pop(), x = i % w, y = (i - x) / w;
    for (const [dx, dy] of N4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (!seen.has(j) && mine.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  connectedCache.set(key, { map: state.map, set: seen });
  return seen;
}

function access(state, box) {
  // 'ok' | 'none' (no adjacent road) | 'island' (adjacent road not linked to main network)
  const { w } = state.map, linked = connectedRoads(state);
  let any = false;
  for (let y = box.y; y < box.y + box.h; y++) for (let x = box.x; x < box.x + box.w; x++) for (const [dx, dy] of N4) {
    const nx = x + dx, ny = y + dy;
    if (nx >= box.x && nx < box.x + box.w && ny >= box.y && ny < box.y + box.h) continue;
    if (!isRoad(tileAt(state, nx, ny))) continue;
    any = true;
    if (linked.has(ny * w + nx)) return 'ok';
  }
  return any ? 'island' : 'none';
}

export function roadError(state, x, y) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) return 'ตำแหน่งไม่ถูกต้อง';
  const t = tileAt(state, x, y);
  if (isRoad(t)) return 'มีถนนอยู่แล้ว';
  if (t !== 'G' && t !== 'H') return 'สร้างถนนได้บนพื้นหญ้าเท่านั้น';
  if (state.buildings.some(b => overlap({ x, y, w: 1, h: 1 }, b))) return 'มีอาคารอยู่แล้ว';
  if (state.money < roadCost(state, x, y)) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export const roadCost = (state, x, y) => (state.map.tiles[y * state.map.w + x] === 'H' ? ROAD.hintCost : ROAD.cost);

export function placeRoad(state, x, y) {
  if (roadError(state, x, y)) return state;
  const cost = roadCost(state, x, y);
  return progress({ ...state, money: state.money - cost, roads: [...state.roads, y * state.map.w + x], roadsBuilt: state.roadsBuilt + 1 });
}

export function removeRoadError(state, x, y) {
  const i = y * state.map.w + x;
  if (!roadSet(state).has(i)) return tileAt(state, x, y) === 'R' ? 'ถนนสายหลักรื้อไม่ได้' : 'ไม่มีถนนตรงนี้';
  const after = { ...state, roads: state.roads.filter(r => r !== i) };
  const before = { ...state };
  for (const b of state.buildings) if (access(before, b) === 'ok' && access(after, b) !== 'ok') return `${TYPES[b.type].name}จะไม่มีถนนเชื่อมถนนหลัก`;
  return '';
}
export function removeRoad(state, x, y) {
  if (removeRoadError(state, x, y)) return state;
  const i = y * state.map.w + x;
  return { ...state, roads: state.roads.filter(r => r !== i) };
}

// ---------- chapters & stages ----------
export function unlockedTypes(state) {
  if (state.finished) return Object.keys(TYPES);
  return CHAPTERS.slice(0, state.chapter + 1).flatMap(c => c.unlocks);
}
export const isUnlocked = (state, type) => unlockedTypes(state).includes(type);
export function unlockChapter(type) {
  const c = CHAPTERS.find(c => c.unlocks.includes(type));
  return c ? c.level : null;
}
export function missionStatus(state, m = metrics(state)) {
  const st = CHAPTERS[state.chapter]?.stages[state.stage];
  if (!st || state.finished) return [];
  return st.missions.map(ms => {
    const { current, target } = ms.check(state, m);
    const done = state.missionsDone.includes(ms.id) || current >= target;
    return { id: ms.id, text: ms.text, current: Math.min(current, target), target, done };
  });
}
export function stageStatus(state) {
  const c = CHAPTERS[state.chapter];
  if (!c || state.finished) return null;
  const st = c.stages[state.stage];
  return { chapter: c.level, title: c.title, index: state.stage, count: c.stages.length, stageTitle: st.title, missions: missionStatus(state) };
}

function scene(state, key) {
  if (state.flags.includes(key)) return state;
  return { ...state, flags: [...state.flags, key], storyQueue: [...state.storyQueue, { kind: 'scene', key }] };
}
function milestones(state) {
  let s = state;
  if (s.lecturers > 0) s = scene(s, 'firstLecturers');
  if (s.schools.length) s = scene(s, 'firstSchool');
  if (s.researchActive.length || s.researchDone) s = scene(s, 'firstResearch');
  if (s.researchDone) s = scene(s, 'firstResearchDone');
  if (s.buildings.some(b => levelOf(b) > 1)) s = scene(s, 'firstUpgrade');
  if (s.students >= 1000) s = scene(s, 'students1000');
  if (s.students >= 5000) s = scene(s, 'students5000');
  if (s.students > 0 && s.students > teachingCapacity(s)) s = scene(s, 'ratioHigh');
  const u = utilities(s);
  if (u.water.supply > 0 && u.water.short > 0) s = scene(s, 'waterShort');
  if (u.power.supply > 0 && u.power.short > 0) s = scene(s, 'powerShort');
  if (u.wifi.level >= 2) s = scene(s, 'digitalUp');
  if (u.wifi.aps > 0) s = scene(s, 'firstWifi');
  if (s.buildings.some(b => b.type === 'farm')) {
    s = scene(s, 'farmBuilt');
    for (const c of CROPS) if (c.unlock && Object.keys(c.unlock).length && !s.flags.includes('crop:' + c.id) && !cropUnlockReason(s, c)) {
      s = { ...s, flags: [...s.flags, 'crop:' + c.id], storyQueue: [...s.storyQueue, { kind: 'scene', speaker: VP_NAME, text: `ปลดล็อกพืชใหม่: ${c.icon} ${c.name}! ${c.kind === 'perennial' ? 'เป็นไม้ยืนต้น ลงทุนครั้งเดียวเก็บผลได้หลายปี' : 'โตไว เก็บเกี่ยวได้เร็ว'}` }], log: logged(s, `ปลดล็อกพืช ${c.name}`) };
    }
  }
  if (s.harvests > 0) s = scene(s, 'firstHarvest');
  if (s.buildings.some(b => b.type === 'services')) s = scene(s, 'servicesBuilt');
  if (s.roadCondition < 60) s = scene(s, 'roadBad');
  if (s.incidents > 0) s = scene(s, 'firstIncident');
  if (s.shuttles > 0) s = scene(s, 'firstShuttle');
  if (s.facilities.some(o => o.kind === 'cam')) s = scene(s, 'firstCam');
  return s;
}

// Lock in done missions; advance stages and chapters as long as everything is complete.
function progress(state) {
  let s = milestones(state);
  for (let guard = 0; guard < 40 && !s.finished; guard++) {
    const status = missionStatus(s);
    const done = [...new Set([...s.missionsDone, ...status.filter(x => x.done).map(x => x.id)])];
    if (done.length !== s.missionsDone.length) s = { ...s, missionsDone: done };
    if (!status.every(x => x.done)) break;
    const c = CHAPTERS[s.chapter], st = c.stages[s.stage];
    const last = s.stage === c.stages.length - 1;
    const msgs = [`สำเร็จตอนที่ ${s.stage + 1}: ${st.title}${st.reward ? ` • รางวัล ${st.reward.toLocaleString('th-TH')} ฿` : ''}`];
    s = { ...s, money: s.money + (st.reward || 0), missionsDone: [] };
    if (!last) {
      s = { ...s, stage: s.stage + 1, storyQueue: [...s.storyQueue, { kind: 'stage', chapter: s.chapter, stage: s.stage + 1 }], log: logged(s, ...msgs) };
      continue;
    }
    const next = CHAPTERS[s.chapter + 1];
    const queue = [...s.storyQueue, { kind: 'complete', chapter: s.chapter }];
    msgs.unshift(`สำเร็จบทที่ ${c.level}: ${c.title}${c.reward ? ` • รางวัล ${c.reward.toLocaleString('th-TH')} ฿` : ''}`);
    if (next) {
      queue.push({ kind: 'intro', chapter: s.chapter + 1 }, { kind: 'stage', chapter: s.chapter + 1, stage: 0 });
      msgs.unshift(`เริ่มบทที่ ${next.level}: ${next.title}`);
      const skip = s.year < next.year;
      s = { ...s, chapter: s.chapter + 1, stage: 0, money: s.money + c.reward, storyQueue: queue, year: skip ? next.year : s.year, term: skip ? 1 : s.term, log: logged(s, ...msgs) };
    } else {
      s = { ...s, finished: true, money: s.money + c.reward, storyQueue: queue, log: logged(s, ...msgs) };
    }
  }
  return s;
}
export const ackStory = state => ({ ...state, storyQueue: state.storyQueue.slice(1) });

// ---------- utilities: water, power, Wi-Fi ----------
const LINE_OK = new Set(['G', 'H', 'R']);
const inBox = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
const touchesBox = (b, x, y) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h && !((x === b.x - 1 || x === b.x + b.w) && (y === b.y - 1 || y === b.y + b.h));
export const lineCost = layer => LINES[layer].cost;

export function lineError(state, layer, x, y) {
  const L = LINES[layer];
  if (!L || !Number.isInteger(x) || !Number.isInteger(y)) return 'ตำแหน่งไม่ถูกต้อง';
  const { w, h, tiles } = state.map;
  if (x < 0 || y < 0 || x >= w || y >= h) return 'อยู่นอกแผนที่';
  const i = y * w + x;
  if (state[layer].includes(i)) return `มี${L.name}อยู่แล้ว`;
  if (!LINE_OK.has(tiles[i])) return `เดิน${L.name}บนน้ำหรือนอกพื้นที่ไม่ได้`;
  if (state.buildings.some(b => inBox(b, x, y))) return 'ผ่านใต้อาคารไม่ได้';
  if ((state.aps || []).includes(i)) return 'มีจุดกระจาย Wi-Fi อยู่';
  if (state.money < L.cost) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export function placeLine(state, layer, x, y) {
  if (lineError(state, layer, x, y)) return state;
  return progress({ ...state, money: state.money - LINES[layer].cost, [layer]: [...state[layer], y * state.map.w + x] });
}
// Place several line tiles with a single progress check (drag painting, bots).
export function placeLines(state, layer, tiles) {
  let s = state, n = 0;
  for (const i of tiles) {
    const x = i % s.map.w, y = (i - x) / s.map.w;
    if (lineError(s, layer, x, y)) continue;
    s = { ...s, money: s.money - LINES[layer].cost, [layer]: [...s[layer], i] }; n++;
  }
  return n ? progress(s) : state;
}
export function removeLine(state, layer, x, y) {
  const i = y * state.map.w + x;
  if (!state[layer].includes(i)) return state;
  return { ...state, [layer]: state[layer].filter(t => t !== i) };
}

// Connected components of one line layer; returns tile -> component id.
// Power poles: wires span up to LINES.powerLines.span tiles between poles.
function poleDist(w, a, b) { return Math.hypot((a % w) - (b % w), Math.floor(a / w) - Math.floor(b / w)); }
function poleNeighbours(state) {
  const { w } = state.map, span = LINES.powerLines.span, grid = new Map(), out = new Map();
  const cell = i => `${Math.floor((i % w) / span)},${Math.floor(Math.floor(i / w) / span)}`;
  for (const i of state.powerLines) { const k = cell(i); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
  for (const i of state.powerLines) {
    const cx = Math.floor((i % w) / span), cy = Math.floor(Math.floor(i / w) / span), list = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) for (const j of grid.get(`${cx + dx},${cy + dy}`) || []) if (j !== i && poleDist(w, i, j) <= span) list.push(j);
    out.set(i, list);
  }
  return out;
}
// Wires to draw: a minimum spanning forest over pole pairs within span (tidy, no spider webs).
export function powerWires(state) {
  const { w } = state.map, nb = poleNeighbours(state), edges = [];
  for (const [i, list] of nb) for (const j of list) if (i < j) edges.push([poleDist(w, i, j), i, j]);
  edges.sort((a, b) => a[0] - b[0]);
  const parent = new Map(), find = x => { while (parent.has(x) && parent.get(x) !== x) x = parent.get(x); return x; };
  const out = [];
  for (const [, i, j] of edges) { const a = find(i), b = find(j); if (a !== b) { parent.set(a, b); parent.set(b, b); out.push([i, j]); } }
  return out;
}
function components(state, layer) {
  const { w } = state.map, set = new Set(state[layer]), comp = new Map();
  if (layer === 'powerLines') {
    const nb = poleNeighbours(state); let id = 0;
    for (const start of state.powerLines) {
      if (comp.has(start)) continue;
      const stack = [start]; comp.set(start, id);
      while (stack.length) for (const j of nb.get(stack.pop()) || []) if (!comp.has(j)) { comp.set(j, id); stack.push(j); }
      id++;
    }
    return comp;
  }
  let id = 0;
  for (const start of state[layer]) {
    if (comp.has(start)) continue;
    const stack = [start]; comp.set(start, id);
    while (stack.length) {
      const i = stack.pop(), x = i % w, y = (i - x) / w;
      for (const [dx, dy] of N4) { const j = (y + dy) * w + (x + dx); if (x + dx >= 0 && x + dx < w && set.has(j) && !comp.has(j)) { comp.set(j, id); stack.push(j); } }
    }
    id++;
  }
  return comp;
}
// Components a building footprint touches (on or edge-adjacent).
function touched(state, comp, b, reach = 1) {
  const { w } = state.map, out = new Set();
  for (let y = b.y - reach; y < b.y + b.h + reach; y++) for (let x = b.x - reach; x < b.x + b.w + reach; x++) {
    if (reach === 1 && !touchesBox(b, x, y)) continue;
    const c = comp.get(y * w + x);
    if (c !== undefined) out.add(c);
  }
  return [...out];
}

const utilCache = new WeakMap();
// Who gets water and power. Grandfathered buildings (from old saves) are always supplied.
export function utilities(state) {
  const key = state.buildings;
  const hit = utilCache.get(key);
  if (hit && hit.pipes === state.pipes && hit.powerLines === state.powerLines && hit.aps === state.aps) return hit.value;
  const result = { water: { supply: 0, used: 0, short: 0 }, power: { supply: 0, used: 0, short: 0 }, supplied: new Map(), wifi: { aps: 0, max: 0, coverage: 0, covered: new Set() } };
  for (const [layer, kind] of [['pipes', 'water'], ['powerLines', 'power']]) {
    const raw = components(state, layer), budget = new Map();
    // A plant joins every line touching it into one network (union-find over component ids).
    const parent = new Map(), find = c => { while (parent.has(c) && parent.get(c) !== c) c = parent.get(c); return c; };
    const plants = state.buildings.filter(b => TYPES[b.type].supply === kind);
    const reach = layer === 'powerLines' ? LINES.powerLines.reach : 1;
    for (const p of plants) { const cs = touched(state, raw, p, reach).map(find); for (const c of cs) parent.set(c, cs[0]); }
    const comp = new Map([...raw].map(([tile, c]) => [tile, find(c)]));
    for (const p of plants) {
      const cs = touched(state, comp, p, reach), amount = PLANT_SUPPLY * capacityScale(levelOf(p));
      if (!cs.length) continue;
      budget.set(cs[0], (budget.get(cs[0]) || 0) + amount); result[kind].supply += amount;
    }
    for (const b of [...state.buildings].sort((p, q) => p.id - q.id)) {
      if (TYPES[b.type].utility) continue;
      const need = (DEMAND[b.type]?.[kind === 'water' ? 0 : 1] || 0) * upkeepScale(levelOf(b));
      const rec = result.supplied.get(b.id) || { water: false, power: false };
      if (b.grandfathered) { rec[kind] = true; result.supplied.set(b.id, rec); continue; }
      const c = touched(state, comp, b, reach).find(c => (budget.get(c) || 0) >= need);
      if (c !== undefined) { budget.set(c, budget.get(c) - need); rec[kind] = true; result[kind].used += need; }
      else result[kind].short++;
      result.supplied.set(b.id, rec);
    }
  }
  // Wi-Fi: access points need a digital centre; each must sit next to a live power line or powered building.
  const digital = state.buildings.filter(b => b.type === 'digital' && isSupplied(result, b));
  const level = digital.reduce((a, b) => Math.max(a, levelOf(b)), 0);
  result.wifi.max = WIFI.maxByLevel[level];
  const { w } = state.map;
  const live = state.aps.slice(0, result.wifi.max);
  result.wifi.aps = live.length;
  const targets = state.buildings.filter(b => !TYPES[b.type].utility);
  for (const b of targets) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (live.some(i => Math.hypot((i % w) + 0.5 - cx, Math.floor(i / w) + 0.5 - cy) <= WIFI.radiusByLevel[level])) result.wifi.covered.add(b.id);
  }
  result.wifi.coverage = targets.length ? result.wifi.covered.size / targets.length : 0;
  result.wifi.level = level;
  result.wifi.radius = WIFI.radiusByLevel[level];
  utilCache.set(key, { pipes: state.pipes, powerLines: state.powerLines, aps: state.aps, value: result });
  return result;
}
function isSupplied(u, b) {
  if (TYPES[b.type].utility) return true;
  const r = u.supplied.get(b.id);
  return !!(r && r.water && r.power);
}
export const supplied = (state, b) => isSupplied(utilities(state), b);

export function apError(state, x, y) {
  const { w, h, tiles } = state.map;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= w || y >= h) return 'ตำแหน่งไม่ถูกต้อง';
  const u = utilities(state), i = y * w + x;
  if (!u.wifi.max) return 'ต้องมีศูนย์คอมพิวเตอร์ที่มีไฟฟ้าก่อน';
  if (state.aps.length >= u.wifi.max) return `ติดตั้งได้สูงสุด ${u.wifi.max} จุด (อัปเกรดศูนย์คอมพิวเตอร์เพื่อเพิ่ม)`;
  if (!['G', 'H'].includes(tileAt(state, x, y)) || state.aps.includes(i)) return 'ติดตั้งได้บนพื้นหญ้าว่างเท่านั้น';
  if (state.buildings.some(b => inBox(b, x, y)) || state.pipes.includes(i) || state.powerLines.includes(i)) return 'ตำแหน่งนี้มีสิ่งก่อสร้างอยู่แล้ว';
  const nearPower = state.powerLines.some(j => poleDist(w, j, y * w + x) <= LINES.powerLines.reach) || state.buildings.some(b => touchesBox(b, x, y) && TYPES[b.type].supply !== 'water' && (TYPES[b.type].supply === 'power' || isSupplied(u, b)));
  if (!nearPower) return 'ต้องอยู่ติดสายไฟหรืออาคารที่มีไฟฟ้า';
  if (state.money < WIFI.cost) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export function placeAP(state, x, y) {
  if (apError(state, x, y)) return state;
  return progress({ ...state, money: state.money - WIFI.cost, aps: [...state.aps, y * state.map.w + x] });
}
export function removeAP(state, x, y) {
  const i = y * state.map.w + x;
  return state.aps.includes(i) ? { ...state, aps: state.aps.filter(a => a !== i) } : state;
}

// ---------- smart farm ----------
export const FARM = { plotsPerLevel: 2, lotsPerLevel: 4, workerFee: 10000, workerSalary: 4000, wifiBonus: 0.15, schoolBonus: 0.15, levelBonus: 0.25 };
const farmsOf = s => s.buildings.filter(b => b.type === 'farm');
const cropById = id => CROPS.find(c => c.id === id);

// Unlocked if ANY listed condition holds (chapter reached, any farm at level, a research contract with the keyword done).
export function cropUnlockReason(state, crop) {
  const u = crop.unlock || {}, conds = [];
  if (!Object.keys(u).length) return '';
  if (u.chapter) { if (state.chapter + 1 >= u.chapter || state.finished) return ''; conds.push(`บทที่ ${u.chapter}`); }
  if (u.farmLevel) { if (farmsOf(state).some(f => levelOf(f) >= u.farmLevel)) return ''; conds.push(`ฟาร์มระดับ ${u.farmLevel}`); }
  if (u.research) { if ((state.researchTitles || []).some(t => t.includes(u.research))) return ''; conds.push(`งานวิจัยเรื่อง${u.research}สำเร็จ`); }
  return `ปลดล็อกเมื่อถึง${conds.join(' หรือ ')}`;
}
export function cropStatus(state) {
  return CROPS.map(c => { const reason = cropUnlockReason(state, c); return { ...c, unlocked: !reason, reason, price: marketPrice(state, c.id) }; });
}
// Seeded market: ±20% per term, fruit a bit cheaper in its harvest season (every 3rd term).
export function marketPrice(state, cropId) {
  const c = cropById(cropId);
  if (!c) return 0;
  const r = lcg((state.seed ^ (cropId.length * 7919) ^ (state.termCount || 0) * 104729) >>> 0)();
  const season = c.every === 3 && (state.term === 3) ? 0.85 : 1;
  return Math.round(c.price * (0.8 + 0.4 * r) * season * 100) / 100;
}
export const farmLabour = state => (state.workers || 0) + Math.min(10, Math.floor(state.students / 300)); // part-time students help
export const labourLeft = state => farmLabour(state) - (state.labourUsed || 0);
export const storageCap = state => farmsOf(state).reduce((a, f) => a + FARM.lotsPerLevel * levelOf(f), 0);

export function hireWorkers(state, n = 1) {
  n = Math.max(1, Math.floor(n));
  if (!farmsOf(state).length) return state;
  if (state.money < FARM.workerFee * n) return state;
  return { ...state, workers: (state.workers || 0) + n, money: state.money - FARM.workerFee * n, log: logged(state, `จ้างคนงานฟาร์ม ${n} คน`) };
}
export function releaseWorkers(state, n = 1) {
  const k = Math.min(Math.max(1, Math.floor(n)), state.workers || 0);
  return k ? { ...state, workers: state.workers - k } : state;
}

function plotsOf(f) {
  const n = FARM.plotsPerLevel * levelOf(f), plots = [...(f.plots || [])];
  while (plots.length < n) plots.push(null);
  return plots;
}
const setPlots = (state, farmId, plots) => ({ ...state, buildings: state.buildings.map(b => (b.id === farmId ? { ...b, plots } : b)) });

export function plantError(state, farmId, plot, cropId) {
  const f = state.buildings.find(b => b.id === farmId && b.type === 'farm'), c = cropById(cropId);
  if (!f || !c) return 'ไม่พบฟาร์มหรือพืช';
  const plots = plotsOf(f);
  if (plot < 0 || plot >= plots.length) return 'ไม่มีแปลงนี้';
  if (plots[plot]) return 'แปลงนี้ปลูกอยู่แล้ว';
  const why = cropUnlockReason(state, c);
  if (why) return why;
  if (state.money < c.seed) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export function plantCrop(state, farmId, plot, cropId) {
  if (plantError(state, farmId, plot, cropId)) return state;
  const c = cropById(cropId), f = state.buildings.find(b => b.id === farmId);
  const plots = plotsOf(f);
  plots[plot] = { crop: cropId, growth: 0, sinceYield: 0, ready: false, readyAge: 0, yields: 0 };
  return progress({ ...setPlots(state, farmId, plots), money: state.money - c.seed, log: logged(state, `ปลูก${c.name}ในแปลงที่ ${plot + 1}`) });
}
export function clearPlot(state, farmId, plot) {
  const f = state.buildings.find(b => b.id === farmId);
  if (!f) return state;
  const plots = plotsOf(f);
  if (!plots[plot]) return state;
  plots[plot] = null;
  return setPlots(state, farmId, plots);
}

function yieldUnits(state, f, crop) {
  const wifi = utilities(state).wifi.covered.has(f.id) ? FARM.wifiBonus : 0;
  const school = state.schools.includes(crop.school) ? FARM.schoolBonus : 0;
  return Math.round(crop.units * (1 + FARM.levelBonus * (levelOf(f) - 1) + wifi + school));
}
export function harvestError(state, farmId, plot) {
  const f = state.buildings.find(b => b.id === farmId && b.type === 'farm');
  const p = f && plotsOf(f)[plot];
  if (!p || !p.ready) return 'ยังไม่พร้อมเก็บเกี่ยว';
  if (labourLeft(state) < cropById(p.crop).labour) return `แรงงานไม่พอ (ต้องการ ${cropById(p.crop).labour} คน เหลือ ${labourLeft(state)})`;
  if ((state.storage || []).length >= storageCap(state)) return 'คลังเต็ม ขายผลผลิตก่อน';
  return '';
}
export function harvestPlot(state, farmId, plot) {
  if (harvestError(state, farmId, plot)) return state;
  const f = state.buildings.find(b => b.id === farmId), plots = plotsOf(f), p = plots[plot], c = cropById(p.crop);
  const units = yieldUnits(state, f, c);
  const processed = !!(c.processed && levelOf(f) >= 3);
  plots[plot] = c.kind === 'annual' ? null : { ...p, ready: false, readyAge: 0, sinceYield: 0, yields: p.yields + 1 };
  const lot = { crop: c.id, units, age: 0, processed };
  return progress({
    ...setPlots(state, farmId, plots), labourUsed: (state.labourUsed || 0) + c.labour, storage: [...(state.storage || []), lot],
    harvests: (state.harvests || 0) + 1, perennialHarvests: (state.perennialHarvests || 0) + (c.kind === 'perennial' ? 1 : 0),
    log: logged(state, `เก็บเกี่ยว${processed ? c.processed.name : c.name} ${units.toLocaleString('th-TH')} ${c.unit}`),
  });
}
// Harvest every ready plot that labour and storage allow.
export function harvestAll(state) {
  let s = state;
  for (const f of farmsOf(s)) plotsOf(f).forEach((p, i) => { if (p && p.ready) s = harvestPlot(s, f.id, i); });
  return s;
}
export function lotValue(state, lot) {
  const c = cropById(lot.crop);
  return Math.round(lot.units * marketPrice(state, lot.crop) * (lot.processed ? c.processed.price : 1));
}
export function sellLots(state, indexes) {
  const set = new Set(indexes), storage = state.storage || [];
  let total = 0;
  storage.forEach((l, i) => { if (set.has(i)) total += lotValue(state, l); });
  if (!total) return state;
  return progress({ ...state, money: state.money + total, storage: storage.filter((_, i) => !set.has(i)), farmIncome: (state.farmIncome || 0) + total, log: logged(state, `ขายผลผลิตฟาร์ม ${total.toLocaleString('th-TH')} ฿`) });
}
export const sellAll = state => sellLots(state, (state.storage || []).map((_, i) => i));

// Growth, spoilage and level-3 auto-harvest for one term. Returns {state, events}.
function farmTick(state, events) {
  let s = state;
  const u = utilities(s);
  for (const f of farmsOf(s)) {
    const powered = isSupplied(u, f);
    const plots = plotsOf(f).map(p => {
      if (!p) return p;
      const c = cropById(p.crop);
      if (p.ready) {
        if (p.readyAge >= 1) { // left in the field too long
          events.push(`${c.name}ในแปลงสุกเกินไป เสียหาย${c.kind === 'annual' ? '' : ' (รอรอบถัดไป)'}`);
          return c.kind === 'annual' ? null : { ...p, ready: false, readyAge: 0, sinceYield: 0 };
        }
        return { ...p, readyAge: p.readyAge + 1 };
      }
      if (!powered) return p; // no water/power: nothing grows
      const growth = p.growth + 1;
      if (growth < c.grow) return { ...p, growth };
      if (c.kind === 'annual' || growth === c.grow) return { ...p, growth, ready: true, readyAge: 0 };
      const since = p.sinceYield + 1;
      return since >= c.every ? { ...p, growth, sinceYield: since, ready: true, readyAge: 0 } : { ...p, growth, sinceYield: since };
    });
    s = setPlots(s, f.id, plots);
  }
  // produce in storage ages; perishable lots rot
  const kept = [];
  for (const lot of s.storage || []) {
    const c = cropById(lot.crop), keep = lot.processed ? c.processed.keep : c.keep, age = lot.age + 1;
    if (age > keep) events.push(`${c.name}ในคลังเน่าเสีย ${lot.units.toLocaleString('th-TH')} ${c.unit}`);
    else kept.push({ ...lot, age });
  }
  s = { ...s, storage: kept, labourUsed: 0 };
  if (farmsOf(s).some(f => levelOf(f) >= 3)) s = harvestAll(s); // automation
  return s;
}

// ---------- central services: road repair, shuttle, security ----------
// Small 1x1 facilities placed on grass. needs: 'road' (edge-adjacent road) or 'power' (next to a power line or powered building).
export const FACILITIES = {
  guard: { name: 'ป้อมรักษาความปลอดภัย', icon: '🛡️', cost: 80000, upkeep: 12000, radius: 8, needs: 'road', unlock: { chapter: 2, services: 1 } },
  stop: { name: 'ป้ายรถไฟฟ้า', icon: '🚏', cost: 30000, upkeep: 1000, radius: 5, needs: 'road', unlock: { chapter: 3, services: 2 } },
  cam: { name: 'กล้องวงจรปิด', icon: '📹', cost: 25000, upkeep: 500, radius: 6, needs: 'power', unlock: { chapter: 4, services: 3 } },
};
export const SHUTTLE = { cost: 900000, upkeep: 30000, capacity: 400, name: 'รถไฟฟ้ารับส่ง' };
export const ROADCARE = { baseWear: 2, wearPer1000: 0.6, repairPerLevel: 4 };

const servicesLevel = s => s.buildings.filter(b => b.type === 'services').reduce((a, b) => Math.max(a, isSupplied(utilities(s), b) ? levelOf(b) : 0), 0);
export { servicesLevel };

export function facilityUnlockReason(state, kind) {
  const f = FACILITIES[kind];
  if (!f) return 'ไม่รู้จักสิ่งก่อสร้างนี้';
  if (f.unlock.chapter && state.chapter + 1 < f.unlock.chapter && !state.finished) return `ปลดล็อกในบทที่ ${f.unlock.chapter}`;
  if (servicesLevel(state) < f.unlock.services) return `ต้องมีส่วนบริการกลางระดับ ${f.unlock.services} ที่มีน้ำและไฟ`;
  return '';
}
export function facilityError(state, kind, x, y) {
  const why = facilityUnlockReason(state, kind);
  if (why) return why;
  const f = FACILITIES[kind], { w, h } = state.map;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= w || y >= h) return 'ตำแหน่งไม่ถูกต้อง';
  const i = y * w + x;
  if (!['G', 'H'].includes(tileAt(state, x, y))) return 'ต้องวางบนพื้นหญ้า';
  if (state.buildings.some(b => inBox(b, x, y)) || state.pipes.includes(i) || state.powerLines.includes(i) || state.aps.includes(i) || state.facilities.some(o => o.i === i)) return 'ตำแหน่งนี้มีสิ่งก่อสร้างอยู่แล้ว';
  if (f.needs === 'road' && !N4.some(([dx, dy]) => isRoad(tileAt(state, x + dx, y + dy)))) return 'ต้องอยู่ติดถนน';
  if (f.needs === 'power') {
    const u = utilities(state);
    const ok = state.powerLines.some(j => poleDist(w, j, y * w + x) <= LINES.powerLines.reach) || state.buildings.some(b => touchesBox(b, x, y) && (TYPES[b.type].supply === 'power' || isSupplied(u, b)));
    if (!ok) return 'ต้องอยู่ติดสายไฟหรืออาคารที่มีไฟฟ้า';
  }
  if (state.money < f.cost) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export function placeFacility(state, kind, x, y) {
  if (facilityError(state, kind, x, y)) return state;
  const f = FACILITIES[kind];
  return progress({ ...state, money: state.money - f.cost, facilities: [...state.facilities, { kind, i: y * state.map.w + x }], log: logged(state, `ติดตั้ง${f.name}`) });
}
export function removeFacility(state, x, y) {
  const i = y * state.map.w + x;
  return state.facilities.some(o => o.i === i) ? { ...state, facilities: state.facilities.filter(o => o.i !== i) } : state;
}
export function shuttleError(state) {
  if (facilityUnlockReason(state, 'stop')) return facilityUnlockReason(state, 'stop');
  if (state.facilities.filter(o => o.kind === 'stop').length < 2) return 'ต้องมีป้ายรถไฟฟ้าอย่างน้อย 2 ป้าย';
  if (state.money < SHUTTLE.cost) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export function buyShuttle(state) {
  if (shuttleError(state)) return state;
  return progress({ ...state, money: state.money - SHUTTLE.cost, shuttles: state.shuttles + 1, log: logged(state, 'ซื้อรถไฟฟ้ารับส่งเพิ่ม 1 คัน') });
}
export const sellShuttle = state => (state.shuttles > 0 ? { ...state, shuttles: state.shuttles - 1, money: state.money + Math.round(SHUTTLE.cost * 0.3) } : state);

// Share of (non-utility) buildings within reach of a facility kind, cams only count when powered & services level 3.
function reach(state, kinds) {
  const { w } = state.map, targets = state.buildings.filter(b => !TYPES[b.type].utility);
  if (!targets.length) return { share: 0, covered: new Set() };
  const pts = state.facilities.filter(o => kinds.includes(o.kind) && !facilityUnlockReason({ ...state, money: 1e12 }, o.kind));
  const covered = new Set();
  for (const b of targets) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (pts.some(o => Math.hypot((o.i % w) + 0.5 - cx, Math.floor(o.i / w) + 0.5 - cy) <= FACILITIES[o.kind].radius + Math.max(b.w, b.h) / 2)) covered.add(b.id);
  }
  return { share: covered.size / targets.length, covered };
}
// Campus services summary used by tick and UI.
export function services(state) {
  const security = reach(state, ['guard', 'cam']);
  const stops = reach(state, ['stop']);
  const seats = state.shuttles * SHUTTLE.capacity;
  const shuttle = state.shuttles ? stops.share * Math.min(1, seats / Math.max(1, state.students)) : 0;
  return { level: servicesLevel(state), roadCondition: state.roadCondition, security: security.share, secured: security.covered, shuttle, stopsCovered: stops.covered, seats };
}

// ---------- buildings ----------
export function buildingName(b) {
  const t = TYPES[b.type];
  return t?.levelNames?.[levelOf(b) - 1] || t?.name || 'อาคาร';
}
export function metrics(state) {
  const m = { seats: 0, beds: 0, meals: 0, library: 0, sports: 0, academic: 0, coop: 0, hospital: 0, upkeep: 0, matches: 0, roadUpkeep: state.roads.length * ROAD.upkeep, adminLevel: 0 };
  const u = utilities(state);
  m.unsupplied = 0;
  for (const b of state.buildings) {
    const t = TYPES[b.type], lvl = levelOf(b), match = b.matched ? 1.1 : 1;
    m.upkeep += t.upkeep * upkeepScale(lvl);
    if (b.matched) m.matches++;
    if (!isSupplied(u, b)) { m.unsupplied++; continue; } // no water or power: the building doesn't work
    for (const key of ['seats', 'beds', 'meals']) m[key] += (t[key] || 0) * match * capacityScale(lvl);
    if (['library', 'sports', 'academic', 'coop', 'hospital'].includes(b.type)) m[b.type] += match * effectScale(lvl);
    if (b.type === 'admin') m.adminLevel = lvl;
  }
  m.lineUpkeep = state.pipes.length * LINES.pipes.upkeep + state.powerLines.length * LINES.powerLines.upkeep + state.aps.length * WIFI.upkeep
    + (state.facilities || []).reduce((a, o) => a + FACILITIES[o.kind].upkeep, 0) + (state.shuttles || 0) * SHUTTLE.upkeep;
  m.upkeep += m.roadUpkeep + m.lineUpkeep;
  m.wifi = u.wifi.coverage;
  return m;
}

export function placementError(state, type, x, y) {
  const t = TYPES[type];
  if (!t || !Number.isInteger(x) || !Number.isInteger(y)) return 'ตำแหน่งไม่ถูกต้อง';
  if (!isUnlocked(state, type)) return `ปลดล็อกในบทที่ ${unlockChapter(type)}`;
  if (type !== 'admin' && !state.buildings.some(b => b.type === 'admin')) return 'สร้างอาคารบริหารก่อน';
  if (type === 'admin' && state.buildings.some(b => b.type === 'admin')) return 'มีอาคารบริหารแล้ว';
  if (state.money < t.cost) return 'งบประมาณไม่เพียงพอ';
  if (x < 0 || y < 0 || x + t.w > state.map.w || y + t.h > state.map.h) return 'อยู่นอกแผนที่';
  const box = { x, y, w: t.w, h: t.h };
  if (state.buildings.some(b => overlap(box, b) > 0)) return 'พื้นที่มีอาคารอยู่แล้ว';
  for (let yy = y; yy < y + t.h; yy++) for (let xx = x; xx < x + t.w; xx++) {
    const tile = tileAt(state, xx, yy);
    if (isRoad(tile)) return 'สร้างทับถนนไม่ได้';
    if (tile !== 'G' && tile !== 'H') return 'ต้องวางบนพื้นหญ้าเท่านั้น';
    const i = yy * state.map.w + xx;
    if (state.pipes.includes(i) || state.powerLines.includes(i) || state.aps.includes(i)) return 'มีท่อ สายไฟ หรือ Wi-Fi อยู่ (รื้อก่อน)';
  }
  if (t.utility) return ''; // water plants and substations are fed by pipes/poles, no road needed
  const a = access(state, box);
  if (a === 'none') return 'ขอบอาคารต้องติดถนน';
  if (a === 'island') return 'ถนนยังไม่เชื่อมกับถนนหลัก';
  return '';
}
export const canPlace = (state, type, x, y) => placementError(state, type, x, y) === '';

export function place(state, type, x, y) {
  if (!canPlace(state, type, x, y)) return state;
  const t = TYPES[type], box = { x, y, w: t.w, h: t.h };
  const ghostIds = [];
  state.map.ghosts.forEach((g, i) => { if (g.kind === type && overlap(box, g) >= 0.5 * Math.min(g.w * g.h, t.w * t.h)) ghostIds.push(i); });
  const matched = ghostIds.length > 0;
  const reward = ghostIds.some(i => !state.claimedGhosts.includes(i)) ? 2 : 0;
  return progress({
    ...state, money: state.money - t.cost, reputation: Math.min(100, state.reputation + reward), nextId: state.nextId + 1,
    claimedGhosts: [...new Set([...state.claimedGhosts, ...ghostIds])],
    buildings: [...state.buildings, { id: state.nextId, type, ...box, matched, level: 1, invested: t.cost }],
    log: logged(state, `สร้าง${t.name}${matched ? ' • ตรงผังจริง (+10% ผลลัพธ์)' : ''}${reward ? ' • ชื่อเสียง +2' : ''}`),
  });
}

// Moving keeps level, crops and investment; costs a share of the building's base price.
export const MOVE_RATE = 0.2;
export const moveCost = b => Math.round(TYPES[b.type].cost * MOVE_RATE);
export function moveError(state, id, x, y) {
  const b = state.buildings.find(o => o.id === id);
  if (!b) return 'ไม่พบอาคาร';
  if (b.x === x && b.y === y) return 'อยู่ตำแหน่งเดิม';
  const others = { ...state, buildings: state.buildings.filter(o => o.id !== id), money: Infinity };
  if (b.type !== 'admin' && !others.buildings.some(o => o.type === 'admin')) others.buildings = [...others.buildings, { id: -1, type: 'admin', x: -99, y: -99, w: 1, h: 1 }];
  const err = placementError(others, b.type, x, y);
  if (err) return err;
  if (state.money < moveCost(b)) return `งบประมาณไม่เพียงพอ (ค่าย้าย ${moveCost(b).toLocaleString('th-TH')} ฿)`;
  return '';
}
export function moveBuilding(state, id, x, y) {
  if (moveError(state, id, x, y)) return state;
  const b = state.buildings.find(o => o.id === id), box = { x, y, w: b.w, h: b.h };
  const matched = state.map.ghosts.some(g => g.kind === b.type && overlap(box, g) >= 0.5 * Math.min(g.w * g.h, b.w * b.h));
  const moved = { ...b, x, y, matched };
  return progress({ ...state, money: state.money - moveCost(b), buildings: state.buildings.map(o => (o.id === id ? moved : o)), log: logged(state, `ย้าย${buildingName(b)} • ค่าย้าย ${moveCost(b).toLocaleString('th-TH')} ฿`) });
}

export function demolish(state, id) {
  const b = state.buildings.find(b => b.id === id);
  if (!b) return state;
  const refund = Math.floor((b.invested || TYPES[b.type].cost) * 0.3);
  return { ...state, buildings: state.buildings.filter(b => b.id !== id), money: state.money + refund, log: logged(state, `รื้อ${buildingName(b)} • คืนเงิน ${refund.toLocaleString('th-TH')} ฿`) };
}

export const upgradeCost = b => Math.floor(TYPES[b.type].cost * 0.6 * levelOf(b));
export function upgradeInfo(state, id) {
  const b = state.buildings.find(x => x.id === id);
  if (!b) return null;
  const lvl = levelOf(b), t = TYPES[b.type];
  if (lvl >= MAX_LEVEL) return { level: lvl, max: true };
  const next = lvl + 1, cost = upgradeCost(b);
  const what = t.seats || t.beds || t.meals
    ? `${t.seats ? 'ที่นั่ง' : t.beds ? 'เตียง' : 'อาหาร'} ${Math.round((t.seats || t.beds || t.meals) * capacityScale(lvl))} → ${Math.round((t.seats || t.beds || t.meals) * capacityScale(next))}`
    : b.type === 'admin' ? `รับงานวิจัยพร้อมกัน ${2 + lvl} → ${3 + lvl} งาน` : `ผลต่อมหาวิทยาลัย ×${effectScale(lvl).toFixed(1)} → ×${effectScale(next).toFixed(1)}`;
  return { level: lvl, next, cost, effect: what, upkeep: Math.round(t.upkeep * upkeepScale(next)), name: buildingName({ ...b, level: next }), error: state.money < cost ? 'งบประมาณไม่เพียงพอ' : '' };
}
export function upgradeBuilding(state, id) {
  const b = state.buildings.find(x => x.id === id);
  const info = upgradeInfo(state, id);
  if (!b || !info || info.max || info.error) return state;
  const up = { ...b, level: info.next, invested: (b.invested || TYPES[b.type].cost) + info.cost };
  return progress({ ...state, money: state.money - info.cost, buildings: state.buildings.map(x => (x.id === id ? up : x)), log: logged(state, `อัปเกรดเป็น${buildingName(up)} ระดับ ${info.next}`) });
}

// ---------- lecturers ----------
export const assignedLecturers = s => s.researchActive.reduce((a, p) => a + p.lecturers, 0);
export const teachingCapacity = s => Math.max(0, s.lecturers - assignedLecturers(s)) * ECON.perLecturer;
export function hireError(state, n) {
  if (!state.buildings.some(b => b.type === 'admin')) return 'ต้องมีอาคารบริหารก่อน';
  if (state.money < ECON.hireFee * n) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export function hireLecturers(state, n = 1) {
  n = Math.max(1, Math.floor(n));
  if (hireError(state, n)) return state;
  return progress({ ...state, lecturers: state.lecturers + n, money: state.money - ECON.hireFee * n, log: logged(state, `จ้างอาจารย์ ${n} คน • ค่าจ้างแรกเข้า ${(ECON.hireFee * n).toLocaleString('th-TH')} ฿`) });
}
export function releaseLecturers(state, n = 1) {
  const free = state.lecturers - assignedLecturers(state);
  n = Math.min(Math.max(1, Math.floor(n)), free);
  if (n <= 0) return state;
  return { ...state, lecturers: state.lecturers - n, log: logged(state, `เลิกจ้างอาจารย์ ${n} คน`) };
}

// ---------- schools ----------
export function schoolError(state, id) {
  const sc = SCHOOLS.find(x => x.id === id);
  if (!sc) return 'ไม่พบสำนักวิชา';
  if (state.schools.includes(id)) return 'เปิดแล้ว';
  const r = sc.req || {};
  if (r.chapter && state.chapter + 1 < r.chapter && !state.finished) return `ปลดล็อกในบทที่ ${r.chapter}`;
  for (const [type, n] of Object.entries(r.buildings || {})) if (state.buildings.filter(b => b.type === type).length < n) return `ต้องมี${TYPES[type].name} ${n} หลัง`;
  if (state.lecturers < sc.minLecturers) return `ต้องมีอาจารย์อย่างน้อย ${sc.minLecturers} คน`;
  if (state.money < sc.cost) return 'งบประมาณไม่เพียงพอ';
  return '';
}
export function schoolStatus(state) {
  return SCHOOLS.map(sc => { const reason = schoolError(state, sc.id); return { ...sc, opened: state.schools.includes(sc.id), canOpen: !reason, reason }; });
}
export function openSchool(state, id) {
  if (schoolError(state, id)) return state;
  const sc = SCHOOLS.find(x => x.id === id);
  return progress({ ...state, schools: [...state.schools, id], money: state.money - sc.cost, log: logged(state, `เปิดสำนักวิชา${sc.name}`) });
}
function schoolEffects(state) {
  const list = state.schools.map(id => SCHOOLS.find(x => x.id === id)).filter(Boolean);
  return {
    demand: 0.6 + list.reduce((a, x) => a + x.demand, 0),
    tuition: list.length ? list.reduce((a, x) => a + x.tuition, 0) / list.length : 1,
    reputation: list.reduce((a, x) => a + x.reputation, 0),
  };
}

// ---------- research contracts ----------
export const maxResearch = state => 2 + Math.max(1, metrics(state).adminLevel);
export function researchError(state, offer) {
  if (!offer) return 'ไม่พบงานนี้';
  if (state.researchActive.length >= maxResearch(state)) return `รับงานพร้อมกันได้ ${maxResearch(state)} งาน (อัปเกรดอาคารบริหารเพื่อเพิ่ม)`;
  if (offer.school && !state.schools.includes(offer.school)) return `ต้องเปิดสำนักวิชา${SCHOOLS.find(x => x.id === offer.school)?.name || ''}`;
  if (state.buildings.filter(b => b.type === 'academic').length < offer.academic) return `ต้องมีอาคารวิชาการ ${offer.academic} หลัง`;
  if (state.lecturers - assignedLecturers(state) < offer.lecturers) return `ต้องมีอาจารย์ว่าง ${offer.lecturers} คน`;
  return '';
}
export function researchStatus(state) {
  return {
    offers: state.researchOffers.map(o => ({ ...o, error: researchError(state, o) })),
    active: state.researchActive, done: state.researchDone, max: maxResearch(state),
  };
}
export function acceptResearch(state, offerId) {
  const offer = state.researchOffers.find(o => o.id === offerId);
  if (researchError(state, offer)) return state;
  // upfront is the sponsor's first instalment: we receive it
  return progress({
    ...state, money: state.money + offer.upfront, researchOffers: state.researchOffers.filter(o => o.id !== offerId),
    researchActive: [...state.researchActive, { ...offer, progress: 0 }], log: logged(state, `ได้รับทุนวิจัย “${offer.title}” จาก${offer.sponsor} • รับเงินงวดแรก +${offer.upfront.toLocaleString('th-TH')} ฿`),
  });
}

// ---------- time ----------
function random(seed) { const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return [next, next / 4294967296]; }

// opts.lifeMood (0–100): average mood of simulated students this term; blends 30% into satisfaction.
export function tick(state, opts = {}) {
  const m = metrics(state), fx = schoolEffects(state);
  const open = state.chapter > 0 || state.finished;
  const graduates = state.term === 3 ? Math.floor(state.students * 0.2) : 0;
  const remaining = state.students - graduates;
  const coopBoost = 1 + 0.15 * Math.min(m.coop, 2) + 0.05 * Math.max(0, m.coop - 2);
  const demand = Math.floor((100 + state.reputation * 16) * coopBoost * fx.demand);
  const hasAdmin = state.buildings.some(b => b.type === 'admin');
  const capacity = Math.min(m.seats, m.beds * 1.2, 1200 + m.academic * 2000, teachingCapacity(state));
  const enrolled = open && hasAdmin ? Math.max(0, Math.floor(Math.min(demand, capacity - remaining))) : 0;
  const students = remaining + enrolled;
  const share = supply => (students ? clamp(supply / students, 0, 1) : 0);
  const base = clamp(20 + 25 * share(m.beds * 1.2) + 25 * share(m.meals) + 20 * share(m.library * 1800) + 10 * share(m.sports * 2000), 0, 100);
  const life = Number.isFinite(opts.lifeMood) ? clamp(opts.lifeMood, 0, 100) : null;
  const teaching = Math.max(1, state.lecturers - assignedLecturers(state));
  const ratio = students / teaching;
  const ratioEffect = !students ? 0 : ratio <= 18 ? 3 : ratio > ECON.perLecturer ? -Math.min(20, (ratio - ECON.perLecturer) * 0.8) : 0;
  // roads wear with traffic; the central services unit repairs them
  const sv = services(state);
  const wear = state.buildings.length ? ROADCARE.baseWear + ROADCARE.wearPer1000 * state.students / 1000 : 0;
  const roadCondition = clamp(state.roadCondition - wear + ROADCARE.repairPerLevel * sv.level * (1 + 0.5 * (sv.level - 1)), 0, 100);
  const roadEffect = roadCondition < 85 ? -(85 - roadCondition) * 0.15 : 0;
  // security incidents: less likely with guard posts / CCTV coverage
  const r2 = lcg((state.seed ^ 0x5bd1e995) >>> 0);
  let safetyPenalty = (state.safetyPenalty || 0) * 0.5, incidents = state.incidents || 0, incidentCost = 0;
  const pIncident = 0.3 * (1 - sv.security) * Math.min(1, state.students / 1500);
  const incidentEvents = [];
  if (r2() < pIncident) {
    incidents++; safetyPenalty += 6;
    if (r2() < 0.5) { incidentCost = 150000; incidentEvents.push('เกิดเหตุลักขโมยในหอพัก • เสียหาย 150,000 ฿ (ป้อมยามและกล้องช่วยลดเหตุ)'); }
    else incidentEvents.push(roadCondition < 70 ? 'อุบัติเหตุมอเตอร์ไซค์บนถนนที่ชำรุด • นักศึกษาไม่พอใจ' : 'มีคนแปลกหน้าบุกรุกตอนกลางคืน • นักศึกษากังวลเรื่องความปลอดภัย');
  }
  const satisfaction = students ? Math.round(clamp((life === null ? base : base * 0.7 + life * 0.3) + ratioEffect * 0.5 + 8 * m.wifi + 6 * sv.shuttle + roadEffect - safetyPenalty, 0, 100)) : 70;
  const target = clamp(5 + satisfaction * 0.6 + Math.min(m.academic, 6) * 3.5 + Math.min(m.library, 3) * 3 + Math.min(m.hospital, 1) * 12 + Math.min(m.coop, 2) * 5 + Math.min(m.matches, 20) * 0.4 + Math.min(fx.reputation, 20) * 0.6 + ratioEffect, 0, 100);
  let reputation = clamp(state.reputation + (target - state.reputation) * 0.12, 0, 100);
  const income = Math.round(students * ECON.tuition * fx.tuition);
  const salary = state.lecturers * ECON.salary;
  const farmSalary = (state.workers || 0) * FARM.workerSalary;
  let expense = m.upkeep + students * ECON.perStudent + salary + farmSalary, grant = 0, grants = state.grants;
  const [seed, roll] = random(state.seed);
  const events = [];
  const grantChance = m.academic > 0 ? 0.06 + 0.03 * Math.min(m.academic, 5) : 0;
  if (roll < 0.06 && state.buildings.length) { expense += Math.round(m.upkeep * 0.8); events.push('มรสุมน้ำท่วม • ค่าบำรุงรักษาเพิ่ม 80% ในเทอมนี้'); }
  else if (roll >= 0.06 && roll < 0.06 + grantChance) { grant = Math.round(400000 * (1 + reputation / 50) / 10000) * 10000; grants++; events.push(`ได้ทุนวิจัย • รับเงินสนับสนุน ${grant.toLocaleString('th-TH')} ฿`); }
  // research contracts progress; a library or hospital speeds them a little
  let researchIncome = 0, researchDone = state.researchDone, researchTitles = state.researchTitles || [];
  const speed = 1 + (m.library >= 2 ? 0.25 : 0) + 0.25 * m.wifi + (utilities(state).wifi.level >= 3 ? 0.25 : 0);
  const researchActive = [];
  for (const p of state.researchActive) {
    const np = { ...p, progress: p.progress + speed };
    if (np.progress >= p.terms) { researchIncome += p.payment; researchDone++; researchTitles = [...researchTitles, p.title]; reputation = clamp(reputation + p.reputation, 0, 100); events.push(`ส่งมอบงานวิจัย “${p.title}” สำเร็จ • รับ ${p.payment.toLocaleString('th-TH')} ฿`); }
    else researchActive.push(np);
  }
  expense += incidentCost;
  events.push(...incidentEvents);
  const money = Math.round(state.money + income - expense + grant + researchIncome);
  const debtTerms = money < 0 ? state.debtTerms + 1 : 0;
  if (debtTerms >= 2) events.push('คำเตือน: เงินติดลบต่อเนื่องอย่างน้อย 2 เทอม • ชะลอการขยายและลดค่าใช้จ่าย');
  const termCount = (state.termCount || 0) + 1;
  const summary = `พ.ศ. ${state.year} / เทอม ${state.term} • ${open ? `รับใหม่ ${enrolled} คน` : 'ยังไม่เปิดรับนักศึกษา'}${graduates ? ` • จบการศึกษา ${graduates} คน` : ''} • สุทธิ ${(income - expense + grant + researchIncome).toLocaleString('th-TH')} ฿`;
  const farmed = farmTick({ ...state, termCount }, events);
  return progress({
    ...state, buildings: farmed.buildings, storage: farmed.storage, labourUsed: 0, harvests: farmed.harvests, perennialHarvests: farmed.perennialHarvests, researchTitles,
    seed, students, money: money + (farmed.money - state.money), roadCondition, safetyPenalty, incidents, reputation, satisfaction, debtTerms, grants, graduatesTotal: state.graduatesTotal + graduates,
    year: state.year + (state.term === 3 ? 1 : 0), term: state.term === 3 ? 1 : state.term + 1, termCount,
    researchActive, researchDone, researchOffers: makeOffers(seed, termCount, reputation),
    lastFinance: { income, expense, salary, farmSalary, grant, researchIncome, enrolled, graduates, ratio: students ? ratio : 0 },
    log: [...events, summary, ...state.log].slice(0, 60),
  });
}

// ---------- saves ----------
// Accepts v2 or v3 save objects (without `map`) and returns a v3 state, or throws.
export function migrateSave(obj, map = MAP) {
  if (!obj || typeof obj !== 'object') throw Error('bad');
  if (obj.version !== 2 && obj.version !== SAVE_VERSION) throw Error('old');
  const fresh = createState(obj.seed, map);
  const s = { ...fresh, ...obj, map, version: SAVE_VERSION };
  if (obj.version === 2) {
    Object.assign(s, {
      lecturers: Math.ceil((obj.students || 0) / ECON.perLecturer) + 2, schools: obj.chapter >= 1 ? ['arts', 'management'] : [],
      researchActive: [], researchDone: 0, stage: 0, missionsDone: [], flags: [], termCount: 0,
      researchOffers: makeOffers(obj.seed >>> 0, 0), storyQueue: [{ kind: 'stage', chapter: obj.chapter || 0, stage: 0 }],
    });
  }
  const nums = ['money', 'reputation', 'students', 'satisfaction', 'year', 'term', 'seed', 'nextId', 'chapter', 'stage', 'lecturers', 'researchDone', 'graduatesTotal', 'grants', 'roadsBuilt'];
  if (!nums.every(k => Number.isFinite(s[k]))) throw Error('bad');
  if (s.chapter < 0 || s.chapter >= CHAPTERS.length || s.stage < 0 || s.stage >= CHAPTERS[s.chapter].stages.length) throw Error('bad');
  for (const k of ['buildings', 'roads', 'schools', 'researchOffers', 'researchActive', 'missionsDone', 'flags', 'log', 'storyQueue', 'claimedGhosts']) if (!Array.isArray(s[k])) throw Error('bad');
  s.buildings = s.buildings.map(b => {
    const t = TYPES[b.type];
    if (!t || b.w !== t.w || b.h !== t.h || !Number.isInteger(b.x) || !Number.isInteger(b.y)) throw Error('bad');
    const level = clamp(Math.floor(b.level || 1), 1, MAX_LEVEL);
    return { ...b, level, invested: b.invested || t.cost };
  });
  if (!Array.isArray(obj.pipes)) { // saves from before utilities: existing buildings keep working
    s.pipes = []; s.powerLines = []; s.aps = [];
    s.buildings = s.buildings.map(b => ({ ...b, grandfathered: true }));
  }
  for (const k of ['pipes', 'powerLines', 'aps']) s[k] = (s[k] || []).filter(i => Number.isInteger(i) && i >= 0 && i < map.tiles.length);
  s.roads = s.roads.filter(i => Number.isInteger(i) && i >= 0 && i < map.tiles.length && 'GH'.includes(map.tiles[i]));
  s.schools = s.schools.filter(id => SCHOOLS.some(x => x.id === id));
  for (const [k, v] of [['facilities', []], ['shuttles', 0], ['roadCondition', 100], ['safetyPenalty', 0], ['incidents', 0], ['workers', 0], ['storage', []], ['harvests', 0], ['perennialHarvests', 0], ['farmIncome', 0], ['researchTitles', []], ['labourUsed', 0]]) if (s[k] === undefined) s[k] = v;
  s.storyQueue = s.storyQueue.filter(q => q && ((q.kind === 'scene' && (SCENES[q.key] || q.text)) || (['intro', 'complete', 'stage'].includes(q.kind) && CHAPTERS[q.chapter])));
  return s;
}
