import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Load ES modules through data: URLs so this runs without a package.json.
const read = f => readFile(new URL(`../src/${f}`, import.meta.url), 'utf8');
const url = src => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const mapURL = url(await read('map-data.js'));
const storyURL = url(await read('story.js'));
const academiaURL = url(await read('academia.js'));
const simSrc = (await read('sim.js')).replace("'./map-data.js'", JSON.stringify(mapURL)).replace("'./story.js'", JSON.stringify(storyURL)).replace("'./academia.js'", JSON.stringify(academiaURL));
const simURL = url(simSrc);
const S = await import(simURL);
const Life = await import(url((await read('life.js')).replace("'./sim.js'", JSON.stringify(simURL))));
const { CHAPTERS } = await import(storyURL);
const { createState, canPlace, placementError, place, tick, metrics, TYPES, placeRoad, roadError, removeRoad, removeRoadError, missionStatus, ackStory, hireLecturers, releaseLecturers, openSchool, schoolStatus, acceptResearch, researchStatus, upgradeBuilding, upgradeInfo, stageStatus, migrateSave, ECON, placeLine, lineError, utilities, placeAP, apError, WIFI, plantCrop, plantError, harvestPlot, harvestError, harvestAll, sellAll, cropStatus, hireWorkers, FARM, CROPS, placeFacility, facilityError, buyShuttle, shuttleError, services, FACILITIES } = S;

// Synthetic map: main road on row 5, a hint strip on row 15, plain grass elsewhere.
function smallMap() {
  const w = 40, h = 30, tiles = Array(w * h).fill('G');
  for (let x = 0; x < w; x++) { tiles[5 * w + x] = 'R'; tiles[15 * w + x] = 'H'; }
  return { w, h, cellMeters: 25, tiles: tiles.join(''), ghosts: [{ kind: 'lecture', x: 5, y: 6, w: 4, h: 3 }] };
}
const start = () => createState(42, smallMap());
// Admin plus a water plant, a substation and both lines along the main road (row 5).
function supplyRow(s) {
  s = place(place(s, 'water', 34, 6), 'power', 37, 6);
  for (let x = 0; x < 40; x++) { s = placeLine(s, 'pipes', x, 5); if (x % 4 === 0 || x === 39) s = placeLine(s, 'powerLines', x, 5); }
  return s;
}
const withAdmin = () => supplyRow(place(start(), 'admin', 0, 6));
const rich = s => ({ ...s, money: 1e9 });

test('new game starts in 2535 at chapter 1 with an intro queued', () => {
  const s = start();
  assert.equal(s.year, 2535); assert.equal(s.chapter, 0); assert.equal(s.money, ECON.startMoney);
  assert.deepEqual(s.storyQueue, [{ kind: 'intro', chapter: 0 }, { kind: 'stage', chapter: 0, stage: 0 }]);
  assert.equal(ackStory(s).storyQueue.length, 1);
  assert.equal(stageStatus(s).count, CHAPTERS[0].stages.length);
});

test('road painting costs less on real-road hint tiles', () => {
  const s = withAdmin();
  const g = placeRoad(s, 10, 6), h = placeRoad(s, 10, 15);
  assert.equal(s.money - g.money, 6000);
  assert.equal(s.money - h.money, 3000);
  assert.equal(g.roadsBuilt, 1);
  assert.ok(roadError(g, 10, 6)); // already a road
  assert.ok(roadError(s, 0, 6)); // under the admin building
});

test('buildings need a road linked to the main network', () => {
  let s = rich(withAdmin());
  // isolated road far from row 5
  s = placeRoad(s, 20, 20);
  assert.equal(placementError(s, 'dorm', 21, 20), 'ถนนยังไม่เชื่อมกับถนนหลัก');
  for (let y = 19; y >= 6; y--) s = placeRoad(s, 20, y);
  assert.equal(placementError(s, 'dorm', 21, 20), '');
  assert.equal(placementError(s, 'dorm', 21, 25), 'ขอบอาคารต้องติดถนน');
  assert.equal(placementError(s, 'dorm', 19, 18), 'สร้างทับถนนไม่ได้');
});

test('cannot remove a road a building needs; main roads are fixed', () => {
  let s = rich(withAdmin());
  for (let y = 6; y <= 12; y++) s = placeRoad(s, 20, y);
  s = place(s, 'dorm', 21, 10);
  assert.equal(s.buildings.length, 4);
  assert.ok(removeRoadError(s, 20, 8));
  assert.equal(removeRoad(s, 20, 8), s);
  assert.equal(removeRoadError(s, 20, 12), ''); // dead end beyond the dorm's link
  assert.equal(removeRoadError(s, 3, 5), 'ถนนสายหลักรื้อไม่ได้');
});

test('locked buildings are refused until their chapter', () => {
  const s = rich(withAdmin());
  assert.match(placementError(s, 'library', 10, 6), /บทที่ 2/);
  assert.match(placementError(s, 'hospital', 10, 6), /บทที่ 5/);
});

test('enrollment stays closed until chapter 1 is complete', () => {
  let s = rich(withAdmin());
  s = place(place(s, 'lecture', 5, 6), 'dorm', 10, 6);
  const t = tick(s);
  assert.equal(t.students, 0);
  assert.equal(t.lastFinance.enrolled, 0);
});

test('chapter 1 goes stage by stage, then pays the reward, unlocks and skips to 2541', () => {
  let s = place(start(), 'admin', 0, 6);
  assert.equal(s.stage, 0);
  for (let x = 0; x < 15; x++) s = placeRoad(s, x, 15);
  assert.equal(s.stage, 1, 'stage 1 done after admin + roads');
  assert.equal(s.storyQueue.at(-1).kind, 'stage');
  s = supplyRow(s);
  assert.equal(s.stage, 2, 'utilities stage done once everything is supplied');
  // building before the stage is active still counts once it opens
  s = place(s, 'lecture', 5, 6);
  assert.equal(s.stage, 2);
  s = hireLecturers(s, 10);
  assert.equal(s.stage, 3);
  s = place(s, 'dorm', 10, 6);
  const before = s;
  s = place(s, 'canteen', 14, 6);
  assert.equal(s.chapter, 1); assert.equal(s.stage, 0);
  assert.equal(s.year, 2541); assert.equal(s.term, 1);
  assert.equal(s.money, before.money - TYPES.canteen.cost + CHAPTERS[0].reward);
  assert.deepEqual(s.storyQueue.slice(-3), [{ kind: 'complete', chapter: 0 }, { kind: 'intro', chapter: 1 }, { kind: 'stage', chapter: 1, stage: 0 }]);
  assert.equal(placementError(rich(s), 'library', 20, 6), '');
});

test('lecturers: fee, salary, and teaching capacity caps enrollment', () => {
  let s = rich(place(place(place(withAdmin(), 'lecture', 5, 6), 'dorm', 10, 6), 'canteen', 14, 6));
  s = { ...s, chapter: 1, stage: 0, reputation: 80 };
  const h = hireLecturers(s, 4);
  assert.equal(s.money - h.money, 4 * ECON.hireFee);
  const t = tick(h);
  assert.equal(t.lastFinance.salary, 4 * ECON.salary);
  assert.ok(t.students <= 4 * ECON.perLecturer, `students ${t.students}`);
  assert.equal(releaseLecturers(h, 10).lecturers, 0);
  assert.ok(h.flags.includes('firstLecturers'));
  assert.equal(h.storyQueue.filter(q => q.key === 'firstLecturers').length, 1);
  assert.equal(hireLecturers(h, 1).storyQueue.filter(q => q.key === 'firstLecturers').length, 1, 'scene only once');
});

test('schools: requirements, cost and tuition multiplier', () => {
  let s = rich({ ...withAdmin(), chapter: 1 });
  assert.match(schoolStatus(s).find(x => x.id === 'science').reason, /อาจารย์/);
  assert.match(schoolStatus(s).find(x => x.id === 'medicine').reason, /บทที่ 5/);
  s = hireLecturers(s, 40);
  const o = openSchool(s, 'science');
  assert.deepEqual(o.schools, ['science']);
  assert.equal(s.money - o.money, 300000);
  assert.equal(openSchool(o, 'science'), o);
  const med = { ...o, chapter: 4 };
  assert.match(schoolStatus(med).find(x => x.id === 'medicine').reason, /โรงพยาบาล/);
});

test('research contracts pay on completion and free lecturers', () => {
  let s = rich({ ...withAdmin(), chapter: 2 });
  s = hireLecturers(s, 30);
  s = openSchool(openSchool(s, 'arts'), 'management');
  s = { ...s, researchOffers: [{ id: 'x', title: 'ทดสอบ', sponsor: 'ทดสอบ', school: 'arts', academic: 0, lecturers: 2, terms: 2, upfront: 50000, payment: 300000, reputation: 2 }] };
  const a = acceptResearch(s, 'x');
  assert.equal(a.researchActive.length, 1);
  assert.equal(a.money - s.money, 50000);
  assert.equal(S.assignedLecturers(a), 2);
  const t1 = tick(a), t2 = tick(t1);
  assert.equal(t1.researchActive.length, 1);
  assert.equal(t2.researchActive.length, 0);
  assert.equal(t2.researchDone, 1);
  assert.equal(t2.lastFinance.researchIncome, 300000);
  assert.equal(t1.researchOffers.length, 3, 'fresh offers each term');
  // limit
  const many = { ...a, researchActive: [1, 2, 3].map(i => ({ ...a.researchActive[0], id: 'r' + i })) };
  assert.match(researchStatus({ ...many, researchOffers: s.researchOffers }).offers[0].error, /พร้อมกัน/);
});

test('building upgrades: cost, effect, cap and refund', () => {
  let s = rich(withAdmin());
  s = place(s, 'lecture', 5, 6);
  const id = s.buildings.at(-1).id;
  const info = upgradeInfo(s, id);
  assert.equal(info.cost, TYPES.lecture.cost * 0.6);
  const u = upgradeBuilding(s, id);
  assert.equal(u.buildings.at(-1).level, 2);
  assert.ok(metrics(u).seats > metrics(s).seats * 1.4);
  const u3 = upgradeBuilding(u, id);
  assert.equal(u3.buildings.at(-1).level, 3);
  assert.equal(upgradeBuilding(u3, id), u3);
  assert.equal(S.demolish(u3, id).money - u3.money, Math.floor(u3.buildings.at(-1).invested * 0.3));
});

test('v2 saves migrate to v3', () => {
  const { map, ...old } = place(start(), 'admin', 0, 6);
  delete old.pipes; delete old.powerLines; delete old.aps;
  const v2 = { ...old, version: 2, chapter: 1, students: 500 };
  for (const k of ['lecturers', 'schools', 'stage', 'researchActive', 'flags']) delete v2[k];
  const m = migrateSave(v2, smallMap());
  assert.equal(m.version, 3);
  assert.ok(m.lecturers >= 20);
  assert.equal(m.buildings[0].level, 1);
  assert.ok(m.buildings.every(b => b.grandfathered), 'pre-utility saves keep working');
  assert.equal(metrics(m).unsupplied, 0);
  assert.throws(() => migrateSave({ version: 1 }));
});

test('utilities: lines, supply order, unsupplied buildings do nothing', () => {
  let s = rich(place(start(), 'admin', 0, 6));
  assert.match(lineError(s, 'pipes', 0, 6), /ใต้อาคาร/);
  s = place(s, 'lecture', 5, 6);
  assert.equal(metrics(s).seats, 0, 'no water/power yet');
  assert.equal(metrics(s).unsupplied, 2);
  const before = s.money;
  s = placeLine(s, 'pipes', 3, 5);
  assert.equal(before - s.money, 2000);
  s = supplyRow(s);
  assert.equal(metrics(s).unsupplied, 0);
  assert.equal(Math.round(metrics(s).seats), 440);
  // demand above supply: buildings beyond capacity (by id) go dark
  let big = s;
  for (const x of [9, 12, 15, 18, 21, 24, 27, 30]) big = place(big, "dorm", x, 6);
  const u = utilities(big);
  assert.ok(u.water.short > 0, 'water runs short with many dorms');
  const dark = big.buildings.filter(b => !S.supplied(big, b)).map(b => b.id);
  assert.ok(dark.length && Math.min(...dark) > big.buildings.find(b => b.type === 'lecture').id, 'earliest buildings keep supply');
});

test('Wi-Fi needs a powered digital centre; limit by level; coverage', () => {
  let s = rich({ ...withAdmin(), chapter: 2 });
  assert.match(apError(s, 1, 9), /ศูนย์คอมพิวเตอร์/);
  s = place(s, 'digital', 10, 6);
  assert.equal(utilities(s).wifi.max, WIFI.maxByLevel[1]);
  assert.match(apError(s, 20, 20), /สายไฟ/);
  s = placeAP(s, 1, 9);
  assert.equal(s.aps.length, 1);
  assert.ok(utilities(s).wifi.coverage > 0);
  assert.equal(S.buildingName(s.buildings.find(b => b.type === 'digital')), 'ศูนย์คอมพิวเตอร์');
  const up = S.upgradeBuilding(s, s.buildings.find(b => b.type === 'digital').id);
  assert.equal(S.buildingName(up.buildings.find(b => b.type === 'digital')), 'ศูนย์เทคโนโลยีดิจิทัล');
  assert.equal(utilities(up).wifi.max, WIFI.maxByLevel[2]);
});

test('farm: plant, grow, harvest with labour, storage, spoilage, unlocks', () => {
  let s = rich({ ...withAdmin(), chapter: 1 });
  s = place(s, 'farm', 9, 6);
  const farm = s.buildings.find(b => b.type === 'farm');
  assert.ok(S.supplied(s, farm), 'farm on the supplied row');
  assert.match(plantError(s, farm.id, 0, 'rubber'), /ปลดล็อก/);
  assert.equal(plantError(s, farm.id, 0, 'salad'), '');
  const before = s.money;
  s = plantCrop(s, farm.id, 0, 'salad');
  assert.equal(before - s.money, CROPS.find(c => c.id === 'salad').seed);
  assert.match(harvestError(s, farm.id, 0), /ยังไม่พร้อม/);
  s = tick(s);
  const ready = s.buildings.find(b => b.id === farm.id).plots[0];
  assert.equal(ready.ready, true);
  assert.match(harvestError(s, farm.id, 0), /แรงงาน/);
  s = hireWorkers(s, 4);
  const h = harvestPlot(s, farm.id, 0);
  assert.equal(h.storage.length, 1);
  assert.equal(h.buildings.find(b => b.id === farm.id).plots[0], null, 'annual plot is cleared');
  assert.ok(h.harvests === 1 && h.flags.includes('firstHarvest'));
  const sold = sellAll(h);
  assert.ok(sold.money > h.money && sold.storage.length === 0);
  // left in storage too long rots (salad keeps 1 term)
  const rotted = tick(tick(h));
  assert.equal(rotted.storage.length, 0);
  // left in the field: spoils after one term
  const spoiled = tick(tick(s));
  assert.equal(spoiled.buildings.find(b => b.id === farm.id).plots[0], null);
  // perennials unlock with farm level 2 and keep yielding
  let p = S.upgradeBuilding(hireWorkers(s, 10), farm.id);
  assert.equal(plantError(p, farm.id, 1, 'rubber'), '');
  p = plantCrop(p, farm.id, 1, 'rubber');
  for (let i = 0; i < 4; i++) p = tick(p);
  assert.equal(p.buildings.find(b => b.id === farm.id).plots[1].ready, true);
  p = harvestPlot(p, farm.id, 1);
  assert.equal(p.buildings.find(b => b.id === farm.id).plots[1].crop, 'rubber', 'perennial stays planted');
  p = tick(p);
  assert.equal(p.buildings.find(b => b.id === farm.id).plots[1].ready, true, 'rubber yields again next term');
  assert.ok(p.flags.includes('crop:rubber'), 'unlock announced');
});

test('central services: road repair, unlock order, shuttle and security', () => {
  let s = rich({ ...withAdmin(), chapter: 1, students: 2000 });
  assert.match(facilityError(s, 'guard', 1, 9), /ส่วนบริการกลาง/);
  const worn = tick({ ...s, roadCondition: 100 });
  assert.ok(worn.roadCondition < 100, 'roads wear without repairs');
  s = place(s, 'services', 20, 6);
  assert.equal(services(s).level, 1);
  const fixed = tick({ ...s, roadCondition: 50 });
  assert.ok(fixed.roadCondition > 50, 'repair crew fixes roads');
  assert.equal(facilityError(s, 'guard', 24, 6), '');
  assert.match(facilityError(s, 'guard', 24, 9), /ติดถนน/);
  s = placeFacility(s, 'guard', 24, 6);
  assert.ok(services(s).security > 0);
  assert.match(facilityError(s, 'stop', 25, 6), /บทที่ 3/);
  s = { ...s, chapter: 2 };
  assert.match(facilityError(s, 'stop', 25, 6), /ระดับ 2/);
  s = S.upgradeBuilding(s, s.buildings.find(b => b.type === 'services').id);
  s = placeFacility(placeFacility(s, 'stop', 25, 6), 'stop', 26, 6);
  assert.equal(shuttleError(s), '');
  s = buyShuttle(s);
  assert.equal(s.shuttles, 1);
  assert.ok(services(s).shuttle > 0);
  assert.match(facilityError(s, 'cam', 27, 6), /บทที่ 4/);
  // incidents are rarer with full security coverage
  const risky = { ...s, facilities: [] }, safe = s;
  let a = 0, b = 0;
  for (let seed = 1; seed < 60; seed++) { a += tick({ ...risky, seed }).incidents - risky.incidents; b += tick({ ...safe, seed }).incidents - safe.incidents; }
  assert.ok(b < a, `secured ${b} < unsecured ${a}`);
});

test('power poles link up to 7 tiles apart and reach buildings within 3', () => {
  let s = rich(place(start(), 'admin', 0, 6));
  s = place(s, 'power', 30, 6);
  s = placeLine(s, 'powerLines', 29, 5);
  for (let x = 22; x >= 1; x -= 7) s = placeLine(s, 'powerLines', x, 5);
  assert.equal(utilities(s).supplied.get(s.buildings[0].id).power, true, 'admin powered through 7-tile spans');
  assert.equal(S.powerWires(s).length, s.powerLines.length - 1);
  const gap = { ...s, powerLines: s.powerLines.filter(i => i !== 5 * 40 + 15) };
  assert.equal(utilities(gap).supplied.get(s.buildings[0].id).power, false, 'a 10-tile gap breaks the line');
});

test('water plants and substations do not need a road', () => {
  const s = rich({ ...withAdmin() });
  assert.equal(placementError(s, 'water', 10, 20), '');
  assert.equal(placementError(s, 'power', 15, 20), '');
  assert.equal(placementError(s, 'dorm', 10, 20), 'ขอบอาคารต้องติดถนน');
});

test('moving a building keeps level and costs 20% of its price', () => {
  let s = rich(withAdmin());
  s = place(s, 'lecture', 5, 6);
  const id = s.buildings.at(-1).id;
  s = S.upgradeBuilding(s, id);
  assert.match(S.moveError(s, id, 5, 20), /ติดถนน/);
  assert.equal(S.moveError(s, id, 14, 6), '');
  const m = S.moveBuilding(s, id, 14, 6);
  const b = m.buildings.find(o => o.id === id);
  assert.deepEqual([b.x, b.y, b.level], [14, 6, 2]);
  assert.equal(s.money - m.money, TYPES.lecture.cost * S.MOVE_RATE);
  assert.equal(b.matched, false, 'left the real-layout spot');
  assert.match(S.moveError(m, id, 0, 6), /อาคารอยู่แล้ว/);
});

test('ghost match bonus', () => {
  const s = withAdmin();
  const matched = place(s, 'lecture', 5, 6);
  assert.equal(matched.buildings.at(-1).matched, true);
  assert.equal(matched.reputation, s.reputation + 2);
  assert.ok(Math.abs(metrics(matched).seats - 440) < 1e-8);
});

test('ticks are pure and seeded', () => {
  const s = place(withAdmin(), 'lecture', 5, 6), snap = structuredClone(s);
  tick(s); assert.deepEqual(s, snap);
  const run = () => { let x = s; for (let i = 0; i < 40; i++) x = tick(x); return x; };
  assert.deepEqual(run(), run());
});

// ---------- bot playthrough on the real campus map ----------
function spots(state, type) {
  const t = TYPES[type], out = [];
  for (const g of state.map.ghosts) if (g.kind === type) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) out.push([g.x + dx, g.y + dy]);
  return out;
}
// Breadth-first road from the linked network to the edge of a ghost footprint.
function roadTo(state, g) {
  const { w, h } = state.map, prev = new Map(), queue = [];
  for (let i = 0; i < w * h; i++) { const t = S.tileAt(state, i % w, (i / w) | 0); if (t === 'R' || t === 'r') { prev.set(i, -1); queue.push(i); } }
  const goal = i => { const x = i % w, y = (i / w) | 0; return x >= g.x - 1 && x <= g.x + g.w && y >= g.y - 1 && y <= g.y + g.h && !(x >= g.x && x < g.x + g.w && y >= g.y && y < g.y + g.h); };
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q];
    if (goal(i)) { const path = []; for (let j = i; prev.get(j) !== -1; j = prev.get(j)) path.push(j); let s = state; for (const j of path.reverse()) s = placeRoad(s, j % w, (j / w) | 0); return s; }
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, j = ny * w + nx;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || prev.has(j)) continue;
      if (nx >= g.x && nx < g.x + g.w && ny >= g.y && ny < g.y + g.h) continue;
      if (roadError({ ...state, money: 1e12 }, nx, ny)) continue;
      prev.set(j, i); queue.push(j);
    }
  }
  return state;
}
// Grid positions ordered by distance from the admin building (or map centre).
function nearSpots(state) {
  const a = state.buildings.find(b => b.type === 'admin'), cx = a ? a.x : state.map.w / 2, cy = a ? a.y : state.map.h / 2, out = [];
  for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) out.push([cx + dx, cy + dy]);
  return out;
}
function build(state, type) {
  if (TYPES[type].utility || type === 'digital' || state.chapter === 0) { for (const [x, y] of nearSpots(state)) if (canPlace(state, type, x, y)) return place(state, type, x, y); }
  for (const [x, y] of spots(state, type)) if (canPlace(state, type, x, y)) return place(state, type, x, y);
  for (const g of state.map.ghosts) {
    if (g.kind !== type || state.buildings.some(b => b.x < g.x + g.w && g.x < b.x + b.w && b.y < g.y + g.h && g.y < b.y + b.h)) continue;
    const linked = roadTo(state, g);
    if (linked === state || linked.money < TYPES[type].cost) continue;
    for (const [x, y] of spots(linked, type)) if (canPlace(linked, type, x, y)) return place(linked, type, x, y);
  }
  for (const [x, y] of nearSpots(state)) if (canPlace(state, type, x, y)) return place(state, type, x, y);
  return state;
}
function roads(state, n) {
  const { w, h } = state.map;
  let s = state;
  for (let y = 0; y < h && n > 0; y++) for (let x = 0; x < w && n > 0; x++) {
    if (roadError(s, x, y)) continue;
    const touches = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => ['R', 'r'].includes(S.tileAt(s, x + dx, y + dy)));
    if (touches) { s = placeRoad(s, x, y); n--; }
  }
  return s;
}
const count = (s, t) => s.buildings.filter(b => b.type === t).length;
function wish(s) {
  const m = metrics(s), c = s.chapter, stu = Math.max(s.students, 300);
  if (!count(s, 'admin')) return 'admin';
  if (c === 0 && s.stage < 3) return null;
  if (c >= 4 && !count(s, 'hospital')) return 'hospital';
  if (c >= 2 && count(s, 'coop') < 1) return 'coop';
  if (c >= 2 && count(s, 'academic') < (c >= 4 ? 5 : c >= 3 ? 5 : 2)) return 'academic';
  if (c >= 1 && count(s, 'library') < Math.max(1, Math.ceil(stu / 1800))) return 'library';
  if (c >= 1 && count(s, 'sports') < Math.ceil(stu / 2000) && stu > 1500) return 'sports';
  if (m.beds * 1.2 < m.seats + 1 || m.beds < s.students + 200) return 'dorm';
  if (m.meals < stu + 300) return 'canteen';
  const cap = 1200 + m.academic * 2000;
  if (m.seats < cap) return 'lecture';
  if (c >= 2 && count(s, 'academic') < 10) return 'academic';
  return null;
}
const touches = (b, x, y) => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h && !((x === b.x - 1 || x === b.x + b.w) && (y === b.y - 1 || y === b.y + b.h));
// BFS a line from the plants' network to a building that lacks it.
function lineTo(s, layer, b) {
  const kind = layer === 'pipes' ? 'water' : 'power';
  const { w, h } = s.map, have = new Set(s[layer]), prev = new Map(), q = [];
  const plants = s.buildings.filter(p => TYPES[p.type].supply === kind && p.id !== b.id);
  const blocked = new Set(s.aps);
  for (const o of s.buildings) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) blocked.add(y * w + x);
  const free = i => have.has(i) || (!blocked.has(i) && 'GHR'.includes(s.map.tiles[i]));
  for (const p of plants) for (let y = p.y - 1; y <= p.y + p.h; y++) for (let x = p.x - 1; x <= p.x + p.w; x++) {
    const i = y * w + x; if (x >= 0 && y >= 0 && x < w && y < h && touches(p, x, y) && free(i) && !prev.has(i)) { prev.set(i, -1); q.push(i); }
  }
  for (let k = 0; k < q.length; k++) {
    const i = q[k], x = i % w, y = (i / w) | 0;
    if (touches(b, x, y)) { let path = []; for (let j = i; j !== -1; j = prev.get(j)) if (!have.has(j)) path.push(j); if (layer === 'powerLines') path = path.filter((_, k) => k % 4 === 0 || k === path.length - 1); return S.placeLines(s, layer, path); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, j = ny * w + nx; if (nx >= 0 && ny >= 0 && nx < w && ny < h && !prev.has(j) && free(j)) { prev.set(j, i); q.push(j); } }
  }
  return s;
}
function utilitiesBot(s) {
  if (!count(s, 'admin')) return s;
  for (const kind of ['water', 'power']) {
    const u = utilities(s)[kind];
    const plants = s.buildings.filter(b => b.type === kind);
    if (!plants.length || u.used > u.supply * 0.75) {
      const up = plants.find(p => (p.level || 1) < 3);
      if (up && s.money > upgradeInfo(s, up.id).cost + 400000) s = upgradeBuilding(s, up.id);
      else if (s.money > TYPES[kind].cost + 400000 || !plants.length) {
        const n = build(s, kind);
        if (n !== s && plants.length) s = lineTo(n, kind === 'water' ? 'pipes' : 'powerLines', n.buildings.at(-1)); // join the existing network
        else s = n;
      }
    }
  }
  for (const b of s.buildings) {
    if (TYPES[b.type].utility || S.supplied(s, b)) continue;
    const r = utilities(s).supplied.get(b.id) || {};
    if (!r.water) s = lineTo(s, 'pipes', b);
    if (!(utilities(s).supplied.get(b.id) || {}).power) s = lineTo(s, 'powerLines', b);
  }
  // Wi-Fi: digital centre in chapter 3+, access points next to uncovered buildings
  if (s.chapter >= 2 && !count(s, 'digital') && s.money > TYPES.digital.cost + 500000) s = build(s, 'digital');
  const u = utilities(s);
  if (u.wifi.max && s.aps.length >= u.wifi.max) { const d = s.buildings.find(b => b.type === 'digital'); const i = d && upgradeInfo(s, d.id); if (i && !i.max && s.money > i.cost + 500000) s = upgradeBuilding(s, d.id); }
  for (const b of s.buildings) {
    if (TYPES[b.type].utility || utilities(s).wifi.covered.has(b.id) || s.money < 300000) continue;
    outer: for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) if (!apError(s, x, y)) { s = placeAP(s, x, y); break outer; }
  }
  return s;
}
function farmBot(s) {
  if (s.chapter < 1) return s;
  if (!count(s, 'farm') && s.money > TYPES.farm.cost + 500000) { const n = build(s, 'farm'); if (n !== s) s = utilitiesBot(n); }
  const farm = s.buildings.find(b => b.type === 'farm');
  if (!farm) return s;
  if ((s.workers || 0) < 6 && s.money > 200000) s = hireWorkers(s, 6 - (s.workers || 0));
  if (s.chapter >= 3 && (farm.level || 1) < 2 && s.money > upgradeInfo(s, farm.id).cost + 1000000) s = upgradeBuilding(s, farm.id);
  const crops = cropStatus(s).filter(c => c.unlocked).sort((a, b) => (b.kind === 'perennial') - (a.kind === 'perennial') || a.seed - b.seed);
  const f = s.buildings.find(b => b.type === 'farm');
  const n = FARM.plotsPerLevel * (f.level || 1);
  for (let i = 0; i < n; i++) for (const c of crops) if (!plantError(s, f.id, i, c.id) && s.money > c.seed + 300000) { s = plantCrop(s, f.id, i, c.id); break; }
  s = harvestAll(s);
  return sellAll(s);
}
// Place a 1x1 facility on the ring around a building.
function nearBuilding(s, kind, b) {
  for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) if (!facilityError(s, kind, x, y)) return placeFacility(s, kind, x, y);
  return s;
}
function servicesBot(s) {
  if (s.chapter < 1) return s;
  if (!count(s, 'services')) { if (s.money > TYPES.services.cost + 300000) { const n = build(s, 'services'); if (n !== s) s = utilitiesBot(n); } return s; }
  const svc = s.buildings.find(b => b.type === 'services'), lvl = svc.level || 1, want = s.chapter >= 3 ? 3 : s.chapter >= 2 ? 2 : 1;
  if (lvl < want || services(s).roadCondition < 70 && lvl < 3) { const i = upgradeInfo(s, svc.id); if (i && !i.max && s.money > i.cost + 400000) s = upgradeBuilding(s, svc.id); }
  const sv = services(s);
  for (const b of s.buildings) {
    if (TYPES[b.type].utility || s.money < 400000) continue;
    if (!services(s).secured.has(b.id) && ['dorm', 'lecture', 'academic', 'library'].includes(b.type) && services(s).security < 0.7) s = nearBuilding(s, 'guard', b);
    if (s.chapter >= 2 && ['dorm', 'lecture', 'canteen'].includes(b.type) && !services(s).stopsCovered.has(b.id)) s = nearBuilding(s, 'stop', b);
  }
  // CCTV mission: a handful of cameras around key buildings
  if (s.chapter >= 3) for (const b of s.buildings) { if (s.facilities.filter(o => o.kind === 'cam').length >= 6 || s.money < 300000) break; s = nearBuilding(s, 'cam', b); }
  if (s.chapter >= 2 && !shuttleError(s) && s.money > 1700000 && s.shuttles * 400 < Math.max(400, s.students * 0.5)) s = buyShuttle(s);
  return s;
}
function manage(s) {
  s = utilitiesBot(s);
  s = servicesBot(s);
  s = farmBot(s);
  if (!count(s, 'admin')) return s;
  // lecturers: keep a teaching buffer above current students
  const want = s.chapter === 0 ? 10 : Math.max(10, Math.ceil((s.students + 200) / ECON.perLecturer) + S.assignedLecturers(s) + 2);
  if (s.lecturers < want && s.money > 300000) s = hireLecturers(s, Math.min(want - s.lecturers, Math.floor((s.money - 200000) / ECON.hireFee)));
  // schools: open the cheapest available
  for (const sc of schoolStatus(s).filter(x => x.canOpen).sort((a, b) => a.cost - b.cost)) {
    if (s.money > sc.cost + 600000 || (sc.id === 'medicine' && s.money > sc.cost + 200000)) s = openSchool(s, sc.id);
  }
  // research when lecturers are idle
  for (const o of researchStatus(s).offers) if (!o.error && s.lecturers - S.assignedLecturers(s) - o.lecturers > Math.ceil(s.students / ECON.perLecturer)) s = acceptResearch(s, o.id);
  // upgrades: one to level 2 in chapter 4, dorms/lectures to 3 in chapter 6
  const order = s.buildings.filter(b => ['lecture', 'dorm', 'canteen'].includes(b.type)).sort((a, b) => (b.level || 1) - (a.level || 1));
  if (s.chapter >= 3) for (const b of order) { const i = upgradeInfo(s, b.id); if (i && !i.max && s.money > i.cost + 1500000) { s = upgradeBuilding(s, b.id); break; } }
  return s;
}
function play(maxTerms = 160, stopAt = Infinity) {
  let s = createState(); const report = []; let minMoney = s.money, terms = 0, last = s.chapter;
  while (!s.finished && terms < maxTerms && terms < stopAt) {
    if (!count(s, 'admin')) s = build(s, 'admin');
    s = utilitiesBot(s);
    if (s.chapter === 0 && s.roadsBuilt < 15) s = roads(s, 15);
    s = manage(s);
    for (let k = 0; k < 6; k++) {
      const type = wish(s);
      if (!type || s.money < TYPES[type].cost + 300000) break;
      const n = build(s, type);
      if (n === s) break;
      s = utilitiesBot(n);
    }
    s = manage(s);
    if (process.env.BOTDBG && terms >= 30 && terms < 60 && terms % 3 === 0) console.log('T', terms, s.chapter, s.stage, Math.round(s.money), s.buildings.map(b => b.type).join(','), s.pipes.length, s.powerLines.length, metrics(s).unsupplied, JSON.stringify(s.lastFinance), Math.round(metrics(s).upkeep), s.facilities.length, s.shuttles, s.workers, s.students, Math.round(s.roadCondition), s.incidents);
    s = tick(s); terms++;
    minMoney = Math.min(minMoney, s.money);
    if (process.env.BOTEND && terms % 10 === 0) { const m = metrics(s), u = utilities(s); console.log('E', terms, s.chapter, s.stage, s.students, Math.round(m.seats), Math.round(m.beds), m.academic.toFixed(1), S.teachingCapacity(s), m.unsupplied, JSON.stringify(u.water), JSON.stringify(u.power)); }
    if (s.chapter !== last || s.finished) { report.push({ chapter: last + 1, terms, year: s.year, money: s.money, students: s.students, lecturers: s.lecturers, schools: s.schools.length, research: s.researchDone, pipes: s.pipes.length, power: s.powerLines.length, aps: s.aps.length }); last = s.chapter; }
  }
  return { s, report, minMoney, terms };
}

test('a simple bot completes all six chapters without going broke', () => {
  const { s, report, minMoney, terms } = play();
  console.log(JSON.stringify({ terms, minMoney, report }));
  assert.equal(s.finished, true, `stuck in chapter ${s.chapter + 1} stage ${s.stage + 1}: ${JSON.stringify(missionStatus(s))} money ${s.money}`);
  assert.ok(terms <= 160);
  assert.ok(minMoney > -500000, `min money ${minMoney}`);
});

test('students live a daily routine on the roads', () => {
  const { s } = play(150, 12);
  assert.ok(s.students > 0);
  const L = Life.createLife(3);
  const seen = { walking: 0, inside: 0, queue: 0 }, activities = new Set();
  for (let step = 0; step < 48 * 4; step++) {
    Life.updateLife(L, s, 0.25);
    for (const a of L.agents) { seen[a.mode]++; activities.add(a.activity); }
  }
  assert.ok(L.agents.length >= 6 && L.agents.length <= Life.MAX_AGENTS + 12);
  assert.ok(seen.walking > 0 && seen.inside > 0, JSON.stringify(seen));
  for (const act of ['sleep', 'class', 'eat']) assert.ok(activities.has(act), act);
  const m = Life.takeTermMood(L);
  assert.ok(m > 0 && m <= 100, String(m));
  const t = tick(s, { lifeMood: 0 }), u = tick(s, { lifeMood: 100 });
  assert.ok(u.satisfaction > t.satisfaction);
  console.log(JSON.stringify({ agents: L.agents.length, seen, mood: Math.round(m), day: L.day }));
});
