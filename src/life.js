// Daily life of students: schedules, needs, walking on roads. No DOM, no Three.js.
// Each agent stands for `scale` real students so the campus stays readable and fast.
import { TYPES, SCHOOLS, NO_SCHOOL, utilities, services } from './sim.js';

export const MAX_AGENTS = 300;
export const WALK_SPEED = 20; // tiles per game hour
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const FIRST = ['ต้นกล้า', 'ใบเตย', 'ภูผา', 'น้ำฝน', 'ก้องภพ', 'มะปราง', 'ธันวา', 'ข้าวหอม', 'ปลายฟ้า', 'ณัฐ', 'พิมพ์ชนก', 'ทะเล', 'อินทนิล', 'ชลธี', 'กันตพงศ์', 'ปาริชาต', 'วายุ', 'ดาวเหนือ', 'สายรุ้ง', 'เมฆา', 'ตะวัน', 'นภัส', 'จิรายุ', 'แพรวา'];
const LAST = ['ใจดี', 'ทองคำ', 'ศรีสมุทร', 'รักษ์ใต้', 'ชายทะเล', 'บุญมา', 'แก้วประเสริฐ', 'สุขสวัสดิ์', 'ท่าศาลา', 'นาคสวัสดิ์', 'พรหมวงศ์', 'เพชรรัตน์'];
export const FACULTIES = [
  { name: 'แพทยศาสตร์', color: '#2f8f5b' }, { name: 'พยาบาลศาสตร์', color: '#e58fb0' },
  { name: 'วิศวกรรมศาสตร์', color: '#b2452f' }, { name: 'วิทยาศาสตร์', color: '#e2b13c' },
  { name: 'การจัดการ', color: '#3a6fb0' }, { name: 'ศิลปศาสตร์', color: '#8c5bb5' },
  { name: 'สารสนเทศศาสตร์', color: '#2aa3a3' }, { name: 'สถาปัตยกรรม', color: '#d97a2b' },
];

// Where each activity happens; first type present wins, last entry is the fallback.
const PLACES = {
  sleep: ['dorm'], class: ['lecture', 'academic'], eat: ['canteen'], farm: ['farm'],
  study: ['library', 'dorm'], exercise: ['sports', 'dorm'], work: ['admin'], care: ['hospital'],
};
export const ACTIVITY_TH = {
  sleep: 'นอนหลับ', class: 'เข้าเรียน', eat: 'กินข้าว', study: 'อ่านหนังสือ', exercise: 'ออกกำลังกาย', work: 'ทำงาน', farm: 'ช่วยงานฟาร์ม', relax: 'พักผ่อนที่หอ',
};

function schedule(hour, a) {
  const h = (hour + a.offset + 24) % 24;
  if (a.staff) return h >= 8 && h < 17 ? 'work' : 'sleep';
  if (h < 6.5 || h >= 23) return 'sleep';
  if (h < 7.5) return 'eat';
  if (h < 12) return 'class';
  if (h < 13) return 'eat';
  if (h < 16) return a.id % 3 === 0 ? 'study' : 'class';
  if (h < 18) return a.id % 2 ? 'exercise' : 'study';
  if (h < 19) return 'eat';
  if (h < 21.5) return a.id % 4 === 0 ? 'study' : 'relax';
  return 'relax';
}

function mulberry(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function createLife(seed = 7) {
  return { day: 1, hour: 7, agents: [], nextId: 1, rand: mulberry(seed), graph: null, moodSum: 0, moodN: 0, scale: 1, occupancy: new Map() };
}

// ---------- road graph ----------
function buildGraph(state) {
  const { w, h, tiles } = state.map;
  const road = new Uint8Array(w * h);
  for (let i = 0; i < tiles.length; i++) if (tiles[i] === 'R') road[i] = 1;
  for (const i of state.roads) road[i] = 1;
  const doors = new Map();
  for (const b of state.buildings) {
    let best = -1, bestD = Infinity;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) {
      const inside = x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
      const corner = (x === b.x - 1 || x === b.x + b.w) && (y === b.y - 1 || y === b.y + b.h);
      if (inside || corner || x < 0 || y < 0 || x >= w || y >= h || !road[y * w + x]) continue;
      const d = Math.abs(x + 0.5 - cx) + Math.abs(y + 0.5 - cy);
      if (d < bestD) { bestD = d; best = y * w + x; }
    }
    if (best >= 0) doors.set(b.id, best);
  }
  return { w, h, road, doors, fields: new Map(), roads: state.roads, buildings: state.buildings, map: state.map };
}
function field(g, id) {
  let f = g.fields.get(id);
  if (f) return f;
  f = new Int32Array(g.w * g.h).fill(-1);
  const start = g.doors.get(id);
  if (start === undefined) return f;
  const q = [start]; f[start] = 0;
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % g.w, y = (i - x) / g.w;
    for (const [dx, dy] of N4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      const j = ny * g.w + nx;
      if (g.road[j] && f[j] < 0) { f[j] = f[i] + 1; q.push(j); }
    }
  }
  g.fields.set(id, f);
  return f;
}

// ---------- capacity per building, in agents ----------
function capacity(b, scale) {
  const t = TYPES[b.type];
  const real = (t.beds || t.seats || t.meals || { library: 1800, sports: 2000, academic: 1500, admin: 400, coop: 600, hospital: 800 }[b.type] || 500) * (1+0.5*((b.level||1)-1));
  const bonus = b.matched ? 1.1 : 1;
  // Canteens serve several sittings per meal, so per-moment capacity is a third of daily meals.
  return Math.max(1, Math.round((b.type === 'canteen' ? real / 3 : real) * bonus / scale));
}

function pickBuilding(L, state, activity, a, u) {
  const types = PLACES[activity] || ['dorm'];
  for (const type of types) {
    if (type === 'dorm') { const home = state.buildings.find(b => b.id === a.home); return home && (TYPES[home.type].utility || (u.supplied.get(home.id)?.water && u.supplied.get(home.id)?.power)) ? home : null; }
    const options = state.buildings.filter(b => b.type === type && L.graph.doors.has(b.id) && u.supplied.get(b.id)?.water && u.supplied.get(b.id)?.power);
    if (!options.length) continue;
    // nearest with free room, else nearest overall (they will queue)
    const from = a.at;
    const dist = b => { const f = field(L.graph, b.id); return f[from] >= 0 ? f[from] : 1e9; };
    options.sort((p, q) => dist(p) - dist(q));
    return options.find(b => (L.occupancy.get(b.id) || 0) < capacity(b, L.scale)) || options[0];
  }
  return null;
}

function spawn(L, state, staff = false) {
  const r = L.rand, dorms = state.buildings.filter(b => b.type === (staff ? 'admin' : 'dorm') && L.graph.doors.has(b.id));
  if (!dorms.length) return null;
  const home = dorms[L.nextId % dorms.length];
  const opened = (state.schools || []).map(id => SCHOOLS.find(x => x.id === id)).filter(Boolean);
  const fac = opened.length?opened[Math.floor(r()*opened.length)]:{name:'ยังไม่สังกัดสำนักวิชา',color:'#829080'};
  const a = {
    id: L.nextId++, staff, name: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`,
    faculty: staff ? { name: 'เจ้าหน้าที่', color: '#5b6b63' } : fac, year: 1 + Math.floor(r() * 4), home: home.id,
    offset: (r() - 0.5) * 1.2, at: L.graph.doors.get(home.id), x: 0, y: 0, mode: 'inside', inside: home.id, target: null,
    activity: 'relax', needs: { hunger: 20 + r() * 30, energy: 60 + r() * 30, fun: 50 + r() * 30, stress: 10 + r() * 20 },
    thought: 'เพิ่งย้ายเข้ามาอยู่หอ ตื่นเต้นจัง', waited: 0, gaveUp: 0,
  };
  const i = a.at; a.x = (i % L.graph.w) + 0.5; a.y = Math.floor(i / L.graph.w) + 0.5;
  return a;
}

function thoughtFor(a, situation) {
  if (situation) return situation;
  const n = a.needs;
  if (n.hunger > 75) return 'หิวมาก อยากกินข้าว';
  if (n.energy < 20) return 'ง่วงจนตาจะปิด';
  if (n.stress > 70) return 'งานเยอะ เครียดจัง';
  if (n.fun < 25) return 'อยากมีที่ให้ไปเล่นกีฬาหรือเที่ยว';
  return ['ชีวิตในมหาวิทยาลัยดีจัง', 'วันนี้อากาศดี', 'เรียนเหนื่อยแต่สนุก', 'คิดถึงบ้านนิดหน่อย', 'ปีหน้าจะไปสหกิจที่ไหนดีนะ'][a.id % 5];
}

export function mood(a) {
  const n = a.needs;
  return Math.max(0, Math.min(100, (100 - n.hunger) * 0.3 + n.energy * 0.25 + n.fun * 0.2 + (100 - n.stress) * 0.25));
}

// Advance life by dtHours of game time.
export function updateLife(L, state, dtHours) {
  const g = L.graph;
  if (!g || g.roads !== state.roads || g.buildings !== state.buildings || g.map !== state.map) L.graph = buildGraph(state);
  const G = L.graph, ids = new Set(state.buildings.map(b => b.id));
  const u = utilities(state);

  // population: one agent per `scale` students, plus a few staff once the admin exists
  const target = state.students > 0 ? Math.min(MAX_AGENTS, Math.max(6, Math.ceil(state.students / 20))) : 0;
  L.scale = target ? state.students / target : 1;
  L.agents = L.agents.filter(a => ids.has(a.home) && (a.inside === null || ids.has(a.inside)) && G.road[a.at]);
  let students = L.agents.filter(a => !a.staff);
  while (students.length > target) { const drop = students.pop(); L.agents = L.agents.filter(a => a !== drop); }
  for (let k = students.length; k < target; k++) { const a = spawn(L, state); if (!a) break; L.agents.push(a); }
  const staffWanted = state.buildings.some(b => b.type === 'admin') ? Math.min(12, 3 + Math.floor(state.buildings.length / 4)) : 0;
  let staff = L.agents.filter(a => a.staff).length;
  for (; staff < staffWanted; staff++) { const a = spawn(L, state, true); if (!a) break; L.agents.push(a); }

  L.hour += dtHours;
  while (L.hour >= 24) { L.hour -= 24; L.day++; }

  L.occupancy = new Map();
  for (const a of L.agents) if (a.mode === 'inside' && a.inside !== null) L.occupancy.set(a.inside, (L.occupancy.get(a.inside) || 0) + 1);

  for (const a of L.agents) {
    const n = a.needs;
    // needs drift
    n.hunger = Math.min(100, n.hunger + 6 * dtHours);
    n.energy = Math.max(0, n.energy - 4 * dtHours);
    n.fun = Math.max(0, n.fun - 2 * dtHours);
    n.stress = Math.max(0, n.stress - 1 * dtHours);

    const currentBuilding = state.buildings.find(b => b.id === a.inside);
    if (currentBuilding && !TYPES[currentBuilding.type].utility && (!u.supplied.get(currentBuilding.id)?.water || !u.supplied.get(currentBuilding.id)?.power)) {
      const home = state.buildings.find(b => b.id === a.home && u.supplied.get(b.id)?.water && u.supplied.get(b.id)?.power);
      a.inside = null; a.target = home?.id ?? null; a.mode = home ? 'walking' : 'inside'; a.thought = 'ไฟดับ/น้ำไม่ไหล';
    }

    // what should I be doing now?
    let activity = schedule(L.hour, a);
    if (!a.staff && L.hour >= 13 && L.hour < 16 && state.buildings.some(b=>b.type==='farm') && a.id%7===0) activity='farm';
    if (!a.staff && n.hunger > 80 && activity !== 'sleep') activity = 'eat';
    if (activity !== a.activity || (a.mode === 'inside' && a.target === null && a.inside === null)) {
      a.activity = activity;
      const dest = pickBuilding(L, state, activity, a, u) || (() => { const home = state.buildings.find(b => b.id === a.home); return home && u.supplied.get(home.id)?.water && u.supplied.get(home.id)?.power ? home : null; })();
      if (dest && dest.id !== a.inside) {
        if (a.inside !== null) L.occupancy.set(a.inside, (L.occupancy.get(a.inside) || 1) - 1);
        a.inside = null; a.mode = 'walking'; a.target = dest.id; a.waited = 0;
        const distance=Math.hypot(dest.x+dest.w/2-a.x,dest.y+dest.h/2-a.y);
        const shuttleStops=(state.facilities||[]).filter(o=>o.kind==='stop').filter(o=>Math.hypot(o.i%state.map.w+.5-a.x,Math.floor(o.i/state.map.w)+.5-a.y)<6&&Math.hypot(o.i%state.map.w+.5-(dest.x+dest.w/2),Math.floor(o.i/state.map.w)+.5-(dest.y+dest.h/2))<6);
        a.shuttle=!!(state.shuttles&&shuttleStops.length&&a.id%4===0);a.ride=!a.shuttle&&!a.staff&&distance>15&&a.id%5<2;
        if(a.shuttle)a.thought='รถไฟฟ้าสบายจัง';
        const want = PLACES[activity]?.[0];
        if (want && want !== 'dorm' && dest.type !== want) a.thought = thoughtFor(a, state.buildings.some(b => b.type === want && !u.supplied.get(b.id)?.power) ? 'ไฟดับ/น้ำไม่ไหล เลยกลับหอ' : `ไม่มี${TYPES[want]?.name || 'ที่'}ให้ไป เลยกลับหอ`);
      }
    }

    if (a.mode === 'walking') {
      if(a.ride&&state.roadCondition<60&&a.id%9===L.day%9)a.thought='ถนนเป็นหลุม ขับยากมาก';
      const f = field(G, a.target);
      let budget = WALK_SPEED * dtHours * (a.shuttle?3.2:a.ride?2.5:1);
      while (budget > 0) {
        const tx = (a.at % G.w) + 0.5, ty = Math.floor(a.at / G.w) + 0.5;
        const d = Math.hypot(tx - a.x, ty - a.y);
        if (d > budget) { a.x += (tx - a.x) / d * budget; a.y += (ty - a.y) / d * budget; budget = 0; break; }
        a.x = tx; a.y = ty; budget -= d;
        if (f[a.at] <= 0) { // arrived at the door (or no route)
          a.mode = 'queue'; break;
        }
        const x = a.at % G.w, y = (a.at - x) / G.w;
        let next = -1;
        for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= G.w || ny >= G.h) continue; const j = ny * G.w + nx; if (f[j] >= 0 && f[j] < f[a.at]) { next = j; break; } }
        if (next < 0) { a.mode = 'queue'; break; }
        a.at = next;
      }
    }

    if (a.mode === 'queue') {
      const b = state.buildings.find(x => x.id === a.target);
      const occ = L.occupancy.get(a.target) || 0;
      if (b && occ < capacity(b, L.scale)) {
        a.mode = 'inside'; a.inside = b.id; a.target = null; L.occupancy.set(b.id, occ + 1);
      } else {
        a.waited += dtHours;
        n.stress = Math.min(100, n.stress + 6 * dtHours);
        a.thought = thoughtFor(a, b ? `${TYPES[b.type].name}คนเต็ม ต้องรอคิว` : 'หลงทาง ไม่มีถนนไปถึง');
        if (a.waited > 1.5) { // give up, go home unhappy
          a.gaveUp++; n.fun = Math.max(0, n.fun - 10);
          const home = state.buildings.find(x => x.id === a.home);
          a.target = home && home.id !== a.target ? home.id : null; a.mode = a.target ? 'walking' : 'inside'; a.inside = a.target ? null : a.home; a.waited = 0;
        }
      }
    }

    if (a.mode === 'inside') {
      const b = state.buildings.find(x => x.id === a.inside);
      const type = b?.type;
      if (type === 'canteen') n.hunger = Math.max(0, n.hunger - 60 * dtHours);
      if (type === 'dorm' || (a.staff && type === 'admin' && a.activity === 'sleep')) {
        if (a.activity === 'sleep') n.energy = Math.min(100, n.energy + 12 * dtHours);
        else n.fun = Math.min(100, n.fun + 3 * dtHours);
      }
      if (type === 'lecture' || type === 'academic') { n.stress = Math.min(100, n.stress + 5 * dtHours); n.energy = Math.max(0, n.energy - 2 * dtHours); }
      if (type === 'library') n.stress = Math.max(0, n.stress - 6 * dtHours);
      if (type === 'sports') { n.fun = Math.min(100, n.fun + 25 * dtHours); n.stress = Math.max(0, n.stress - 8 * dtHours); }
      if (type === 'farm') { n.fun=Math.min(100,n.fun+8*dtHours);if(a.id%5===0)a.thought='ปลูกเมล่อนลูกโตมาก';else if(a.id%5===1)a.thought='กรีดยางตั้งแต่เช้า'; }
      if (Math.floor((L.hour + a.id) * 2) % 6 === 0) a.thought = thoughtFor(a);
    }
    if (a.mode !== 'inside' && !a.staff) {
      const covered = state.aps.slice(0, u.wifi.max).some(i => Math.hypot(i % state.map.w + 0.5 - a.x, Math.floor(i / state.map.w) + 0.5 - a.y) <= u.wifi.radius);
      if (covered) { n.stress = Math.max(0, n.stress - 0.45 * dtHours); if (dtHours && Math.floor((L.hour + a.id * 3) * 2) !== Math.floor((L.hour - dtHours + a.id * 3) * 2) && (a.id % 4 === L.day % 4)) a.thought = 'เน็ตแรงดีจัง'; }
      else if (u.wifi.level && dtHours && Math.floor((L.hour + a.id) * 2) !== Math.floor((L.hour - dtHours + a.id) * 2) && (a.id % 7 === L.day % 7)) a.thought = 'ไม่มีเน็ต ส่งงานไม่ได้';
    }
    if (!a.staff) { L.moodSum += mood(a) * dtHours; L.moodN += dtHours; }
  }
}

// Average student mood since the last call (0–100), or undefined when nobody lives here yet.
export function takeTermMood(L) {
  const m = L.moodN > 0 ? L.moodSum / L.moodN : undefined;
  L.moodSum = 0; L.moodN = 0;
  return m;
}

export function agentPosition(L, a) {
  // queueing agents fan out around the door so crowds are visible
  if (a.mode === 'queue') {
    const k = a.id * 2.399;
    return { x: a.x + Math.cos(k) * 0.35, y: a.y + Math.sin(k) * 0.35 };
  }
  if(a.ride&&a.target!==null){const dest=L.graph?.doors.get(a.target);if(dest!==undefined){const dx=(dest%L.graph.w)+.5-a.x,dy=Math.floor(dest/L.graph.w)+.5-a.y,d=Math.hypot(dx,dy)||1;return{x:a.x-dy/d*.13,y:a.y+dx/d*.13};}}
  return { x: a.x, y: a.y };
}
