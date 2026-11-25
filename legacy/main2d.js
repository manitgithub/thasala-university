import { MAP } from './map-data.js';
import { CHAPTERS, DISCLAIMER } from './story.js';
import {
  TYPES, ROAD, ECON, SAVE_VERSION, createState, metrics, placementError, place, demolish, tick,
  tileAt, roadError, roadCost, placeRoad, removeRoad, removeRoadError, isUnlocked, unlockChapter, missionStatus, ackStory,
} from './sim.js';

const $ = id => document.getElementById(id);
const canvas = $('map'), ctx = canvas.getContext('2d');
let state = createState(), tool = 'admin', selected = null, hover = null, showGhosts = true;
let width = 1, height = 1, zoom = 8, ox = 0, oy = 0, drag = null, dirty = true, autoElapsed = 0, lastTime = 0, toastTimer;
const keys = new Set();
const number = n => Math.round(n).toLocaleString('th-TH');
const compact = n => (n >= 1e6 ? `${(n / 1e6).toLocaleString('th-TH', { maximumFractionDigits: 1 })} ล้าน` : `${number(n / 1000)} พัน`);
const colors = { O: '#263e35', G: '#8da779', H: '#8da779', R: '#b8c0b7', W: '#75adb6' };

// Static terrain layer (hint tiles look like grass; their dashed hint is drawn on top when enabled).
const terrain = document.createElement('canvas');
terrain.width = MAP.w * 5; terrain.height = MAP.h * 5;
const tc = terrain.getContext('2d');
for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) {
  const t = MAP.tiles[y * MAP.w + x];
  tc.fillStyle = colors[t] || colors.G; tc.fillRect(x * 5, y * 5, 5, 5);
  if ((t === 'G' || t === 'H') && (x * 73 + y * 31) % 7 === 0) { tc.fillStyle = '#819c6f'; tc.fillRect(x * 5 + 1, y * 5 + 2, 2, 1); }
  if (t === 'W' && (x + y) % 3 === 0) { tc.fillStyle = '#91bdc0'; tc.fillRect(x * 5 + 1, y * 5 + 2, 3, 1); }
}
const hints = document.createElement('canvas');
hints.width = MAP.w * 5; hints.height = MAP.h * 5;
const hc = hints.getContext('2d');
hc.fillStyle = '#e8e2c8aa';
for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) if (MAP.tiles[y * MAP.w + x] === 'H') hc.fillRect(x * 5 + 1, y * 5 + 1, 3, 3);

function notify(message) {
  $('toast').textContent = message; $('toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3200);
}
function choose(type) { tool = type; selected = null; hover = null; update(); }

// ---------- palette ----------
const roadButton = document.createElement('button');
roadButton.className = 'build-option'; roadButton.dataset.type = 'road';
roadButton.innerHTML = `<span class="building-icon" style="--b:${ROAD.color}" aria-hidden="true">ถนน</span><span><strong>ถนน</strong><small>ลากเพื่อสร้าง</small></span><span class="cost">${compact(ROAD.cost)}/ช่อง</span>`;
roadButton.addEventListener('click', () => choose('road'));
$('palette').append(roadButton);
for (const [type, t] of Object.entries(TYPES)) {
  const button = document.createElement('button');
  button.className = 'build-option'; button.dataset.type = type;
  button.innerHTML = `<span class="building-icon" style="--b:${t.color}" aria-hidden="true">${t.w}×${t.h}</span><span><strong>${t.name}</strong><small></small></span><span class="cost">${compact(t.cost)}</span>`;
  button.title = `${t.description} • ค่าดูแล ${number(t.upkeep)} ฿ / เทอม`;
  button.addEventListener('click', () => choose(type));
  $('palette').append(button);
}

// ---------- panels ----------
function renderMissions() {
  const c = CHAPTERS[state.chapter];
  if (state.finished || !c) {
    $('missions').innerHTML = `<div class="level"><span class="eyebrow">จบเนื้อเรื่อง</span><strong>เลเวล ${CHAPTERS.length}/${CHAPTERS.length}</strong></div><p>มหาวิทยาลัยของคุณสำเร็จครบทุกบทแล้ว เล่นต่อแบบอิสระได้เลย</p>`;
    return;
  }
  const items = missionStatus(state).map(ms => `<li class="${ms.done ? 'done' : ''}"><span>${ms.text}</span> <small>${number(ms.current)} / ${number(ms.target)}</small><progress max="${ms.target}" value="${ms.current}"></progress></li>`).join('');
  $('missions').innerHTML = `<div class="level"><span class="eyebrow">เลเวล ${c.level}/${CHAPTERS.length} • พ.ศ. ${c.year}</span></div><strong>บทที่ ${c.level}: ${c.title}</strong><ul>${items}</ul><button id="reread">อ่านเรื่องราวบทนี้</button>`;
  $('reread').onclick = () => openStory({ kind: 'intro', chapter: state.chapter }, true);
}

function update() {
  const m = metrics(state);
  $('stats').innerHTML = [['เงิน', number(state.money), '฿'], ['นักศึกษา', number(state.students), 'คน'], ['ที่นั่ง', number(m.seats), 'ที่'], ['เตียง', number(m.beds), 'เตียง'], ['ความพึงพอใจ', state.satisfaction, '%'], ['ชื่อเสียง', Math.round(state.reputation), '/ 100']]
    .map(([name, value, unit], i) => `<div class="stat ${i === 0 && state.money < 0 ? 'negative' : ''}"><span>${name}</span><strong>${value} <small>${unit}</small></strong></div>`).join('');
  $('date').textContent = `พ.ศ. ${state.year} / เทอม ${state.term}`;
  $('log').replaceChildren(...state.log.slice(0, 16).map(message => { const li = document.createElement('li'); li.textContent = message; return li; }));
  for (const b of document.querySelectorAll('.build-option')) {
    const type = b.dataset.type, active = tool === type;
    b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active));
    if (type === 'road') continue;
    const t = TYPES[type], locked = !isUnlocked(state, type);
    const adminDone = type === 'admin' && state.buildings.some(x => x.type === 'admin');
    b.classList.toggle('locked', locked);
    b.disabled = locked || adminDone;
    b.querySelector('small').textContent = locked ? `🔒 ปลดล็อกบทที่ ${unlockChapter(type)}` : adminDone ? 'สร้างแล้ว' : `${t.w}×${t.h} ช่อง`;
  }
  $('bulldoze').classList.toggle('selected', tool === 'bulldoze');
  $('bulldoze').setAttribute('aria-pressed', String(tool === 'bulldoze'));
  const f = state.lastFinance;
  $('finance').textContent = f ? `เทอมก่อน: รายรับ ${number(f.income + f.grant)} ฿ · รายจ่าย ${number(f.expense)} ฿` : `ค่าเล่าเรียน ${number(ECON.tuition)} ฿ / คน / เทอม`;
  const b = state.buildings.find(x => x.id === selected);
  if (b) {
    const t = TYPES[b.type];
    $('info').innerHTML = `<span class="eyebrow">ข้อมูลอาคาร</span><h2>${t.name}</h2><p>${t.description}</p><p>ค่าดูแล ${number(t.upkeep)} ฿ / เทอม</p>${b.matched ? '<p class="match">ตรงผังจริง • ผลลัพธ์เพิ่ม 10%</p>' : ''}<button id="remove-selected">รื้อถอน · รับคืน ${number(t.cost * 0.3)} ฿</button>`;
    $('remove-selected').onclick = () => { state = demolish(state, b.id); selected = null; update(); };
  } else if (tool === 'road') {
    $('info').innerHTML = `<span class="eyebrow">เตรียมก่อสร้าง</span><h2>ถนน</h2><p>คลิกหรือลากบนพื้นหญ้า ถนนต้องต่อจากถนนหลักอาคารจึงจะใช้งานได้</p><p>${number(ROAD.cost)} ฿ / ช่อง • บนแนวถนนเดิม (จุดจาง) ${number(ROAD.hintCost)} ฿<br>ค่าดูแล ${number(ROAD.upkeep)} ฿ / ช่อง / เทอม</p><p>ถนนที่สร้างแล้ว ${number(state.roads.length)} ช่อง</p>`;
  } else if (TYPES[tool]) {
    const t = TYPES[tool];
    $('info').innerHTML = `<span class="eyebrow">เตรียมก่อสร้าง</span><h2>${t.name}</h2><p>${t.description}</p><p>งบก่อสร้าง ${number(t.cost)} ฿<br>ค่าดูแล ${number(t.upkeep)} ฿ / เทอม</p><p>วางทับกรอบเส้นประชนิดเดียวกัน เพื่อรับโบนัสตรงผังจริง</p>`;
  } else {
    $('info').innerHTML = '<h2>สำรวจมหาวิทยาลัย</h2><p>คลิกอาคารเพื่อดูรายละเอียด<br>กรอบเส้นประคือตำแหน่งอาคารจริง<br>จุดจางคือแนวถนนเดิม</p>';
  }
  $('hint').textContent = tool === 'bulldoze' ? 'คลิกอาคารหรือถนนที่สร้างเองเพื่อรื้อ' : tool === 'road' ? 'ลากเพื่อสร้างถนน • คลิกขวาลากเพื่อเลื่อนแผนที่' : TYPES[tool] ? `กำลังวาง${TYPES[tool].name} • ขอบต้องติดถนนที่เชื่อมถนนหลัก` : 'คลิกอาคารเพื่อดูข้อมูล • เลือกเครื่องมือจากเมนูเพื่อสร้าง';
  renderMissions();
  dirty = true;
  showNextStory();
}

// ---------- story modal ----------
let storyOpen = false;
function openStory(item, replay = false) {
  const c = CHAPTERS[item.chapter];
  if (!c) return;
  storyOpen = true;
  $('speed').value = '0';
  if (item.kind === 'intro') {
    $('story-kicker').textContent = `บทที่ ${c.level} • พ.ศ. ${c.year}`;
    $('story-title').textContent = c.title;
    $('story-text').textContent = c.intro;
    const unlocks = c.unlocks.map(t => TYPES[t].name);
    $('story-extra').innerHTML = `<strong>ภารกิจ</strong><ul>${c.missions.map(m => `<li>${m.text}</li>`).join('')}</ul>${unlocks.length && c.level > 1 ? `<p>ปลดล็อก: ${unlocks.join(', ')}</p>` : ''}`;
    $('story-ok').textContent = replay ? 'ปิด' : 'เริ่มบทนี้';
  } else {
    const last = item.chapter === CHAPTERS.length - 1;
    $('story-kicker').textContent = last ? 'จบเนื้อเรื่อง' : `สำเร็จบทที่ ${c.level}`;
    $('story-title').textContent = last ? 'มหาวิทยาลัยแห่งความภาคภูมิใจ' : c.title;
    $('story-text').textContent = c.outro;
    $('story-extra').innerHTML = c.reward ? `<p class="reward">รางวัล: ${number(c.reward)} ฿</p>` : '';
    $('story-ok').textContent = last ? 'เล่นต่อแบบอิสระ' : 'ไปต่อ';
  }
  $('story-note').textContent = DISCLAIMER;
  $('story-ok').onclick = () => {
    $('story').close(); storyOpen = false;
    if (!replay) { state = ackStory(state); }
    update();
  };
  if (!$('story').open) $('story').showModal();
}
function showNextStory() {
  if (storyOpen || !state.storyQueue.length) return;
  openStory(state.storyQueue[0]);
}
$('story').addEventListener('cancel', e => e.preventDefault());

// ---------- camera ----------
function resize() {
  const r = canvas.getBoundingClientRect();
  width = r.width; height = r.height;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dirty = true;
}
function fit() {
  zoom = Math.min((width - 34) / MAP.w, (height - 34) / MAP.h);
  ox = (width - MAP.w * zoom) / 2; oy = (height - MAP.h * zoom) / 2; dirty = true;
}
function focusCampus() {
  // Centre on the admin/lecture cluster of the real layout at a comfortable zoom.
  const core = MAP.ghosts.filter(g => ['admin', 'lecture', 'library'].includes(g.kind));
  const cx = core.length ? core.reduce((a, g) => a + g.x + g.w / 2, 0) / core.length : MAP.w / 2;
  const cy = core.length ? core.reduce((a, g) => a + g.y + g.h / 2, 0) / core.length : MAP.h / 2;
  zoom = Math.max(6, Math.min(10, width / 70));
  ox = width / 2 - cx * zoom; oy = height / 2 - cy * zoom; dirty = true;
}
function zoomAt(factor, x = width / 2, y = height / 2) {
  const z = Math.max(1.1, Math.min(30, zoom * factor));
  ox = x - (x - ox) * z / zoom; oy = y - (y - oy) * z / zoom; zoom = z; dirty = true;
}
const box = b => [ox + b.x * zoom, oy + b.y * zoom, b.w * zoom, b.h * zoom];

// ---------- render ----------
function render() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.O; ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(terrain, ox, oy, MAP.w * zoom, MAP.h * zoom);
  if (showGhosts) ctx.drawImage(hints, ox, oy, MAP.w * zoom, MAP.h * zoom);
  ctx.fillStyle = '#cfd3cb';
  for (const i of state.roads) {
    const x = i % MAP.w, y = (i - x) / MAP.w;
    ctx.fillRect(ox + x * zoom, oy + y * zoom, zoom + 0.5, zoom + 0.5);
  }
  if (zoom > 9) {
    ctx.strokeStyle = '#263e3517'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let x = Math.max(0, Math.floor(-ox / zoom)); x <= Math.min(MAP.w, (width - ox) / zoom); x++) { ctx.moveTo(ox + x * zoom, Math.max(0, oy)); ctx.lineTo(ox + x * zoom, Math.min(height, oy + MAP.h * zoom)); }
    for (let y = Math.max(0, Math.floor(-oy / zoom)); y <= Math.min(MAP.h, (height - oy) / zoom); y++) { ctx.moveTo(Math.max(0, ox), oy + y * zoom); ctx.lineTo(Math.min(width, ox + MAP.w * zoom), oy + y * zoom); }
    ctx.stroke();
  }
  if (showGhosts) {
    ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
    for (const g of MAP.ghosts) { ctx.strokeStyle = TYPES[g.kind]?.color || '#d4e0bf'; ctx.strokeRect(...box(g)); }
    ctx.setLineDash([]);
  }
  for (const b of state.buildings) {
    const [x, y, w, h] = box(b), t = TYPES[b.type];
    if (x + w < 0 || y + h < 0 || x > width || y > height) continue;
    ctx.fillStyle = '#203c3455'; ctx.fillRect(x + 3, y + 4, w, h);
    ctx.fillStyle = t.color; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = selected === b.id ? '#fff4ba' : '#344b40'; ctx.lineWidth = selected === b.id ? 3 : 1;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#fff6dd88'; ctx.fillRect(x + 3, y + 3, w - 6, Math.max(2, zoom * 0.35));
    if (zoom > 5) { ctx.fillStyle = '#34544366'; for (let xx = x + zoom * 0.6; xx < x + w - 4; xx += zoom * 0.8) ctx.fillRect(xx, y + h * 0.48, Math.max(2, zoom * 0.25), Math.max(2, zoom * 0.4)); }
    if (zoom > 8) { ctx.font = `${Math.max(10, Math.min(13, zoom))}px Tahoma`; ctx.textAlign = 'center'; ctx.fillStyle = '#18392c'; ctx.fillText(t.name, x + w / 2, y + h - 4); }
    if (b.matched) { ctx.fillStyle = '#2c6b43'; ctx.beginPath(); ctx.arc(x + w - 3, y + 3, 3, 0, Math.PI * 2); ctx.fill(); }
  }
  if (hover && (TYPES[tool] || tool === 'road')) {
    const size = tool === 'road' ? { w: 1, h: 1 } : TYPES[tool];
    const valid = tool === 'road' ? !roadError(state, hover.x, hover.y) : !placementError(state, tool, hover.x, hover.y);
    const r = box({ ...hover, w: size.w, h: size.h });
    ctx.fillStyle = valid ? '#d4f5b288' : '#ec6e6388'; ctx.fillRect(...r);
    ctx.strokeStyle = valid ? '#e7ffd5' : '#ffe3cf'; ctx.lineWidth = 2; ctx.strokeRect(...r);
  }
  $('scale').style.width = `${4 * zoom}px`;
  dirty = false;
}

// ---------- input ----------
function point(e) {
  const r = canvas.getBoundingClientRect();
  return { px: e.clientX - r.left, py: e.clientY - r.top, x: Math.floor((e.clientX - r.left - ox) / zoom), y: Math.floor((e.clientY - r.top - oy) / zoom) };
}
let painted = 0, paintError = '';
function paintRoad(p) {
  const err = roadError(state, p.x, p.y);
  if (err) { if (err !== 'มีถนนอยู่แล้ว') paintError = err; return; }
  state = placeRoad(state, p.x, p.y); painted++;
}
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
  canvas.focus(); canvas.setPointerCapture(e.pointerId);
  const painting = tool === 'road' && e.button === 0 && e.pointerType !== 'touch';
  drag = { id: e.pointerId, button: e.button, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, painting };
  if (painting) { painted = 0; paintError = ''; const p = point(e); drag.tile = { x: p.x, y: p.y }; paintRoad(p); update(); }
});
canvas.addEventListener('pointermove', e => {
  if (drag && drag.id === e.pointerId) {
    if (drag.painting) {
      // Walk tile by tile from the last painted tile so fast drags leave no gaps (4-connected).
      const p = point(e); let { x, y } = drag.tile;
      while (x !== p.x || y !== p.y) {
        if (Math.abs(p.x - x) >= Math.abs(p.y - y)) x += Math.sign(p.x - x); else y += Math.sign(p.y - y);
        paintRoad({ x, y });
      }
      drag.tile = { x, y }; hover = p; update(); return;
    }
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 5) drag.moved = true;
    if (drag.moved) { ox += e.clientX - drag.lastX; oy += e.clientY - drag.lastY; dirty = true; }
    drag.lastX = e.clientX; drag.lastY = e.clientY;
  }
  hover = point(e); dirty = true;
});
canvas.addEventListener('pointerup', e => {
  if (!drag || drag.id !== e.pointerId) return;
  const { moved, painting, button } = drag;
  drag = null;
  if (painting) {
    if (painted) notify(`สร้างถนน ${painted} ช่อง`); else if (paintError) notify(paintError);
    update(); return;
  }
  if (moved || button !== 0) return;
  const p = point(e);
  const building = state.buildings.find(b => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h);
  if (tool === 'bulldoze') {
    if (building) { state = demolish(state, building.id); selected = null; notify('รื้อถอนแล้ว • คืนเงิน 30%'); }
    else if (tileAt(state, p.x, p.y) === 'r' || tileAt(state, p.x, p.y) === 'R') {
      const err = removeRoadError(state, p.x, p.y);
      if (err) notify(err); else { state = removeRoad(state, p.x, p.y); notify('รื้อถนนแล้ว'); }
    } else notify('เลือกอาคารหรือถนนที่ต้องการรื้อ');
  } else if (tool === 'road') {
    const err = roadError(state, p.x, p.y); // touch tap
    if (err) notify(err); else { state = placeRoad(state, p.x, p.y); notify(`สร้างถนน • ${number(roadCost(state, p.x, p.y))} ฿`); }
  } else if (building) {
    selected = building.id;
  } else if (TYPES[tool]) {
    const error = placementError(state, tool, p.x, p.y);
    if (error) notify(error);
    else { state = place(state, tool, p.x, p.y); notify(`สร้าง${TYPES[tool].name}แล้ว`); if (tool === 'admin') tool = 'road'; selected = null; }
  }
  update();
});
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('pointerleave', () => { if (!drag) hover = null; dirty = true; });
canvas.addEventListener('wheel', e => { e.preventDefault(); const p = point(e); zoomAt(Math.exp(-e.deltaY * 0.0015), p.px, p.py); hover = point(e); }, { passive: false });
window.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName) || storyOpen) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(k)) { keys.add(k); e.preventDefault(); }
  if (k === 'escape') choose(null);
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function advance() {
  if (storyOpen) return;
  state = tick(state); update();
  if (state.debtTerms >= 2) notify('เตือน: เงินติดลบต่อเนื่อง 2 เทอม');
}
$('next').onclick = () => { advance(); autoElapsed = 0; };
$('speed').onchange = () => { autoElapsed = 0; };
$('bulldoze').onclick = () => choose(tool === 'bulldoze' ? null : 'bulldoze');
$('ghosts').onchange = e => { showGhosts = e.target.checked; dirty = true; };
$('fit').onclick = fit;
$('zoomin').onclick = () => zoomAt(1.35);
$('zoomout').onclick = () => zoomAt(1 / 1.35);

// ---------- save / load ----------
const SAVE_KEY = 'thasala-campus-v2';
$('save').onclick = () => {
  try { const { map, ...saved } = state; localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); notify('บันทึกมหาวิทยาลัยแล้ว'); }
  catch { notify('บันทึกไม่ได้: เบราว์เซอร์ไม่อนุญาตพื้นที่จัดเก็บ'); }
};
function validateSave(s) {
  if (!s || s.version !== SAVE_VERSION) throw Error('old');
  const nums = ['money', 'reputation', 'students', 'satisfaction', 'year', 'term', 'seed', 'nextId', 'debtTerms', 'chapter', 'graduatesTotal', 'grants', 'roadsBuilt'];
  if (!nums.every(k => Number.isFinite(s[k])) || ![1, 2, 3].includes(s.term) || s.chapter < 0 || s.chapter >= CHAPTERS.length) throw Error();
  if (!Array.isArray(s.buildings) || !Array.isArray(s.roads) || !Array.isArray(s.missionsDone) || !Array.isArray(s.claimedGhosts) || !Array.isArray(s.log) || !Array.isArray(s.storyQueue)) throw Error();
  if (!s.roads.every(i => Number.isInteger(i) && i >= 0 && i < MAP.tiles.length && 'GH'.includes(MAP.tiles[i]))) throw Error();
  for (const b of s.buildings) {
    const t = TYPES[b.type];
    if (!t || b.w !== t.w || b.h !== t.h || !Number.isInteger(b.x) || !Number.isInteger(b.y) || b.x < 0 || b.y < 0 || b.x + b.w > MAP.w || b.y + b.h > MAP.h) throw Error();
  }
  return { ...createState(), ...s, map: MAP, storyQueue: [] };
}
$('load').onclick = () => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { notify(localStorage.getItem('thasala-campus-v1') ? 'เซฟเวอร์ชันเก่า เริ่มเกมใหม่' : 'ยังไม่มีเกมที่บันทึกไว้'); return; }
    state = validateSave(JSON.parse(raw));
    selected = null; tool = null; autoElapsed = 0; $('speed').value = '0';
    update(); notify('โหลดมหาวิทยาลัยแล้ว');
  } catch (e) { notify(e.message === 'old' ? 'เซฟเวอร์ชันเก่า เริ่มเกมใหม่' : 'โหลดไม่ได้: ข้อมูลบันทึกไม่ถูกต้อง'); }
};

new ResizeObserver(resize).observe(canvas.parentElement);
resize(); focusCampus(); update();

function frame(time) {
  const dt = lastTime ? Math.min(time - lastTime, 250) : 0;
  lastTime = time;
  let dx = 0, dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx += 1;
  if (keys.has('d') || keys.has('arrowright')) dx -= 1;
  if (keys.has('w') || keys.has('arrowup')) dy += 1;
  if (keys.has('s') || keys.has('arrowdown')) dy -= 1;
  if (dx || dy) { ox += dx * dt * 0.45; oy += dy * dt * 0.45; hover = null; dirty = true; }
  const speed = Number($('speed').value);
  if (speed && !storyOpen) { autoElapsed += dt; if (autoElapsed >= 10000 / speed) { autoElapsed = 0; advance(); } }
  if (dirty) render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
