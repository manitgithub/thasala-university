import { MAP } from './map-data.js';
import { createView } from './view3d.js';
import { createLife, updateLife, takeTermMood, mood, ACTIVITY_TH } from './life.js';
import { CHAPTERS, DISCLAIMER, SCENES, RECTOR } from './story.js';
import {
  TYPES, ROAD, ECON, LINES, WIFI, SAVE_VERSION, createState, metrics, utilities, supplied, lineError, placeLines, removeLine, apError, placeAP, removeAP, placementError, place, demolish, tick,
  tileAt, roadError, roadCost, placeRoad, removeRoad, removeRoadError, isUnlocked, unlockChapter, missionStatus, stageStatus, ackStory,
  hireLecturers, releaseLecturers, hireError, assignedLecturers, teachingCapacity, schoolStatus, openSchool, researchStatus, acceptResearch,
  upgradeInfo, upgradeBuilding, buildingName, migrateSave, SCHOOLS, moveError, moveBuilding, moveCost,
  FARM, cropStatus, plantError, plantCrop, clearPlot, harvestError, harvestPlot, harvestAll, sellLots, sellAll, lotValue, farmLabour, labourLeft, storageCap, hireWorkers,
  FACILITIES, SHUTTLE, facilityUnlockReason, facilityError, placeFacility, removeFacility, shuttleError, buyShuttle, services,
} from './sim.js';

const $ = id => document.getElementById(id);
const canvas = $('map');
let state = createState(), tool = 'admin', selected = null, hover = null, showGhosts = true;
let drag = null, autoElapsed = 0, lastTime = 0, toastTimer, manageTab = 'staff', buildTab = 'buildings';
const keys = new Set();
const number = n => Math.round(n).toLocaleString('th-TH');
const compact = n => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toLocaleString('th-TH', { maximumFractionDigits: 1 })} ล้าน` : `${number(n / 1000)} พัน`);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const view = createView(canvas, MAP);
const life = createLife(11);
let selectedAgent = null, selectedVehicle = null, lifeSpeed = 1;

function notify(message) {
  $('toast').textContent = message; $('toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3200);
}
function choose(type) { tool = type; selected = null; hover = null; update(); }
// Run an action; if the state didn't change, show why.
function act(next, why, ok) {
  if (next === state) { if (why) notify(why); return false; }
  state = next; if (ok) notify(ok); update(); return true;
}

// ---------- categorized build palette ----------
const BUILD_TABS = {buildings:['admin','lecture','dorm','canteen','library','sports','academic','coop','hospital','digital','services'], utilities:['road','pipes','powerLines','ap','water','power'], farm:['farm'], services:['facility:guard','facility:stop','facility:cam']};
function renderPalette() {
  const root=$('palette');
  root.innerHTML=`<div class="build-tabs">${[['buildings','🏛️ อาคาร'],['utilities','🔌 สาธารณูปโภค'],['farm','🌾 ฟาร์ม'],['services','🛡️ บริการกลาง']].map(([k,n])=>`<button data-cat="${k}" class="${buildTab===k?'selected':''}">${n}</button>`).join('')}</div><div class="build-items"></div>`;
  root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{buildTab=b.dataset.cat;try{localStorage.setItem('uni-build-tab',buildTab)}catch{}renderPalette()});
  const list=root.querySelector('.build-items');
  for(const key of BUILD_TABS[buildTab]) {
    let name,cost,icon,reason='',type=key;
    if(key.startsWith('facility:')) {const kind=key.split(':')[1],f=FACILITIES[kind];name=f.name;cost=f.cost;icon=f.icon;reason=facilityUnlockReason(state,kind);}
    else if(['road','pipes','powerLines','ap'].includes(key)){const item=key==='road'?ROAD:key==='ap'?{name:'จุดกระจาย Wi-Fi',cost:WIFI.cost,color:'#55b9ee'}:LINES[key];name=key==='road'?'ถนน':key==='ap'?'จุดกระจาย Wi-Fi':item.name;cost=item.cost;icon=key==='ap'?'Wi-Fi':'1×1';}
    else {const t=TYPES[key];name=t.name;cost=t.cost;icon=`${t.w}×${t.h}`;if(!isUnlocked(state,key))reason=`ปลดล็อกบทที่ ${unlockChapter(key)}`;}
    const b=document.createElement('button');b.className='build-option';b.dataset.type=type;b.disabled=!!reason;b.innerHTML=`<span class="building-icon">${icon}</span><span><strong>${name}</strong><small>${reason?'🔒 '+reason:'เลือกเพื่อวาง'}</small></span><span class="cost">${compact(cost)}</span>`;b.onclick=()=>choose(type);list.append(b);
  }
  if(buildTab==='farm'){const x=document.createElement('div');x.className='farm-shortcuts';x.innerHTML='<button data-ha>เก็บเกี่ยวทั้งหมด</button><button data-sa>ขายผลผลิตทั้งหมด</button><div>'+cropStatus(state).filter(c=>c.unlocked).map(c=>`<small>${c.icon} ${c.name} · ${number(c.price)} ฿/${c.unit}</small>`).join('<br>')+'</div>';list.append(x);x.querySelector('[data-ha]').onclick=()=>act(harvestAll(state),'ไม่มีผลผลิตพร้อมเก็บ','เก็บเกี่ยวแล้ว');x.querySelector('[data-sa]').onclick=()=>act(sellAll(state),'ไม่มีผลผลิตในคลัง','ขายทั้งหมดแล้ว');}
  if(buildTab==='services'){const sv=services(state),why=shuttleError(state),x=document.createElement('div');x.className='farm-shortcuts';x.innerHTML=`<button data-buy>🚋 ซื้อรถไฟฟ้ารับส่ง</button><small>${why||`${state.shuttles} คัน • ${number(sv.seats)} ที่นั่ง`}</small>`;list.append(x);x.querySelector('[data-buy]').onclick=()=>act(buyShuttle(state),shuttleError(state),'ซื้อรถไฟฟ้ารับส่งแล้ว');}
}
try{const saved=localStorage.getItem('uni-build-tab');if(BUILD_TABS[saved])buildTab=saved}catch{}
renderPalette();
$('toggle-build').onclick = () => { const p = $('build-panel'); p.classList.toggle('collapsed'); $('toggle-build').setAttribute('aria-expanded', String(!p.classList.contains('collapsed'))); };
$('toggle-side').onclick = () => { const s = $('side'); s.classList.toggle('open'); $('toggle-side').setAttribute('aria-expanded', String(s.classList.contains('open'))); };

// ---------- missions / stages ----------
function renderMissions() {
  const st = stageStatus(state);
  if (!st) {
    $('missions').innerHTML = `<div class="level"><span class="eyebrow">จบเนื้อเรื่อง • เลเวล ${CHAPTERS.length}/${CHAPTERS.length}</span></div><h2>มหาวิทยาลัยชั้นนำ</h2><p>สำเร็จครบทุกบทแล้ว เล่นต่อแบบอิสระได้เลย</p>`;
    return;
  }
  const dots = Array.from({ length: st.count }, (_, i) => `<i class="${i < st.index ? 'on' : i === st.index ? 'now' : ''}"></i>`).join('');
  const items = st.missions.map(ms => `<li class="${ms.done ? 'done' : ''}"><span>${esc(ms.text)}</span> <small>${number(ms.current)} / ${number(ms.target)}</small><progress max="${ms.target}" value="${ms.current}"></progress></li>`).join('');
  $('missions').innerHTML = `<div class="level"><span class="eyebrow">เลเวล ${st.chapter}/${CHAPTERS.length} • ตอนที่ ${st.index + 1}/${st.count}</span><span class="dots">${dots}</span></div>
    <h2>บทที่ ${st.chapter}: ${esc(st.title)}</h2><div class="stage-title">${esc(st.stageTitle)}</div><ul>${items}</ul><button id="reread">อ่านเรื่องราว</button>`;
  $('reread').onclick = () => { openStory({ kind: 'intro', chapter: state.chapter }, true); };
}

// ---------- management panel ----------
for (const b of document.querySelectorAll('[data-tab]')) b.onclick = () => { manageTab = b.dataset.tab; renderManage(); };
function renderManage() {
  for (const b of document.querySelectorAll('[data-tab]')) b.classList.toggle('selected', b.dataset.tab === manageTab);
  const body = $('manage-body');
  if (manageTab === 'staff') {
    const busy = assignedLecturers(state), cap = teachingCapacity(state);
    const ratio = state.students / Math.max(1, state.lecturers - busy);
    body.innerHTML = `<div class="kv"><span>อาจารย์ทั้งหมด</span><b>${number(state.lecturers)} คน</b>
      <span>สอนอยู่ / ทำวิจัย</span><b>${number(state.lecturers - busy)} / ${number(busy)}</b>
      <span>รับนักศึกษาได้</span><b>${number(cap)} คน</b>
      <span>นักศึกษาต่ออาจารย์</span><b class="${ratio > ECON.perLecturer ? 'warn-text' : ''}">${state.students ? ratio.toFixed(1) : '–'} : 1</b>
      <span>ค่าจ้างต่อเทอม</span><b>${number(state.lecturers * ECON.salary)} ฿</b></div>
      <p><small>จ้างใหม่คนละ ${number(ECON.hireFee)} ฿ • เงินเดือน ${number(ECON.salary)} ฿/เทอม • 1 คนสอนได้ ${ECON.perLecturer} คน</small></p>
      <div class="btns"><button data-hire="1">จ้าง +1</button><button data-hire="5">จ้าง +5</button><button data-hire="20">จ้าง +20</button><button data-fire="1">เลิกจ้าง −1</button><button data-fire="5">−5</button></div>`;
    for (const b of body.querySelectorAll('[data-hire]')) b.onclick = () => { const n = +b.dataset.hire; act(hireLecturers(state, n), hireError(state, n), `จ้างอาจารย์ ${n} คน`); };
    for (const b of body.querySelectorAll('[data-fire]')) b.onclick = () => act(releaseLecturers(state, +b.dataset.fire), 'อาจารย์ที่ว่างไม่พอให้เลิกจ้าง');
  } else if (manageTab === 'schools') {
    body.innerHTML = schoolStatus(state).map(sc => `<div class="card ${sc.opened ? 'opened' : ''}"><h3><i class="dot" style="--c:${sc.color}"></i>${esc(sc.name)}</h3>
      <p>ค่าเปิด ${compact(sc.cost)} ฿ • อาจารย์ ${sc.minLecturers}+ • ผู้สมัคร +${Math.round(sc.demand * 100)}% • ค่าเทอม ×${sc.tuition}</p>
      ${sc.opened ? '' : `<div class="btns"><button data-open="${sc.id}" ${sc.canOpen ? '' : 'disabled'}>เปิดสำนักวิชา</button>${sc.reason ? `<small>${esc(sc.reason)}</small>` : ''}</div>`}</div>`).join('');
    for (const b of body.querySelectorAll('[data-open]')) b.onclick = () => act(openSchool(state, b.dataset.open), 'ยังเปิดไม่ได้', 'เปิดสำนักวิชาแล้ว');
  } else {
    const r = researchStatus(state);
    const active = r.active.map(p => `<div class="card"><h3>${esc(p.title)}</h3><p>${esc(p.sponsor)} • อาจารย์ ${p.lecturers} คน • 💰 ส่งมอบแล้วรับ +${compact(p.payment)} ฿</p><progress max="${p.terms}" value="${p.progress}"></progress></div>`).join('');
    const offers = r.offers.map(o => `<div class="card"><h3>${esc(o.title)}</h3><p>${esc(o.sponsor)}${o.school ? ` • ${esc(SCHOOLS.find(x => x.id === o.school)?.name || '')}` : ''} • อาจารย์ ${o.lecturers} คน • ${o.terms} เทอม</p>
      <p class="income">💰 รับทุนทันที +${compact(o.upfront)} ฿ • ส่งมอบแล้วรับอีก +${compact(o.payment)} ฿ • ชื่อเสียง +${o.reputation}</p>
      <div class="btns"><button data-accept="${esc(o.id)}" ${o.error ? 'disabled' : ''}>รับทุนวิจัย +${compact(o.upfront)} ฿</button>${o.error ? `<small>${esc(o.error)}</small>` : ''}</div></div>`).join('');
    body.innerHTML = `<div class="kv"><span>กำลังทำ</span><b>${r.active.length} / ${r.max} งาน</b><span>สำเร็จแล้ว</span><b>${r.done} งาน</b></div>
      ${active ? `<strong>กำลังดำเนินการ</strong>${active}` : ''}<strong>ข้อเสนอเทอมนี้</strong>${offers || '<small>ไม่มีข้อเสนอ</small>'}<small>ข้อเสนอเปลี่ยนทุกเทอม</small>`;
    for (const b of body.querySelectorAll('[data-accept]')) b.onclick = () => act(acceptResearch(state, b.dataset.accept), 'รับทุนนี้ไม่ได้', 'ได้รับทุนวิจัยแล้ว • เงินงวดแรกเข้าบัญชีมหาวิทยาลัย');
  }
}

// ---------- info panel ----------
function renderBuilding(b) {
  const t = TYPES[b.type], up = upgradeInfo(state, b.id), lvl = b.level || 1;
  if (b.type === 'farm') { renderFarm(b); return; }
  if (b.type === 'services') { renderServices(b); return; }
  const u = utilities(state), suppliedNow = u.supplied.get(b.id) || { water: true, power: true };
  const utilityHtml = t.utility
    ? `<p>เครือข่าย${t.supply === 'water' ? 'น้ำประปา' : 'ไฟฟ้า'}: ${number(u[t.supply].used)} / ${number(u[t.supply].supply)} หน่วย • ขาด ${number(u[t.supply].short)} อาคาร</p>`
    : `<p>💧 น้ำประปา ${suppliedNow.water ? '✓' : '✗'}${suppliedNow.water ? '' : ' • ยังไม่มีน้ำประปา — เดินท่อจากโรงผลิตน้ำมาให้ติดอาคาร'}<br>⚡ ไฟฟ้า ${suppliedNow.power ? '✓' : '✗'}${suppliedNow.power ? '' : ' • ยังไม่มีไฟฟ้า — เดินสายไฟจากสถานีมาให้ติดอาคาร'}</p>`;
  const digitalHtml = b.type === 'digital' ? `<p>📶 จุดกระจาย Wi-Fi ${u.wifi.aps}/${u.wifi.max} จุด • รัศมี ${u.wifi.radius} ช่อง</p>` : '';
  $('info').innerHTML = `<span class="eyebrow">ข้อมูลอาคาร</span><h2>${esc(buildingName(b))}<span class="level-badge">ระดับ ${lvl}</span></h2>
    <p>${esc(t.description)}</p><p>ค่าดูแล ${number(t.upkeep * (1 + 0.4 * (lvl - 1)))} ฿ / เทอม</p>
    ${utilityHtml}${digitalHtml}
    ${b.matched ? '<p class="match">✓ ตรงผังจริง • ผลลัพธ์เพิ่ม 10%</p>' : ''}
    ${up.max ? '<p class="match">อัปเกรดสูงสุดแล้ว</p>' : `<p><b>อัปเกรดเป็นระดับ ${up.next}</b>${up.name !== buildingName(b) ? ` (${esc(up.name)})` : ''}<br>${esc(up.effect)}<br>ค่าอัปเกรด ${number(up.cost)} ฿ • ค่าดูแลใหม่ ${number(up.upkeep)} ฿</p>`}
    <div class="row">${up.max ? '' : `<button id="upgrade" class="primary" ${up.error ? 'disabled' : ''}>⬆ อัปเกรด</button>`}<button id="move-selected">↔ ย้าย · ${compact(moveCost(b))} ฿</button><button id="remove-selected">รื้อถอน · คืน ${compact((b.invested || t.cost) * 0.3)} ฿</button></div>`;
  if ($('upgrade')) $('upgrade').onclick = () => act(upgradeBuilding(state, b.id), up.error || 'อัปเกรดไม่ได้', 'อัปเกรดแล้ว');
  $('remove-selected').onclick = () => { state = demolish(state, b.id); selected = null; update(); };
  if ($('move-selected')) $('move-selected').onclick = () => { tool = `move:${b.id}`; notify(`เลือกตำแหน่งใหม่ของ${buildingName(b)} • Esc เพื่อยกเลิก`); update(); };
}

function renderFarm(f) {
  const up = upgradeInfo(state, f.id);
 const crops=cropStatus(state), plots=f.plots||[], lots=state.storage||[];
 const cards=Array.from({length:2*(f.level||1)},(_,i)=>{const p=plots[i];if(!p)return `<div class="farm-plot"><b>แปลง ${i+1} ว่าง</b><select data-plant="${i}"><option value="">เลือกพืช</option>${crops.map(c=>`<option value="${c.id}" ${c.unlocked?'':'disabled'}>${c.icon} ${c.name} ${c.unlocked?`• เมล็ด ${number(c.seed)} ฿ • ${c.grow} เทอม • ~${number(c.units*c.price)} ฿`:'🔒 '+c.reason}</option>`).join('')}</select></div>`;const c=crops.find(x=>x.id===p.crop),pct=Math.min(100,p.growth/c.grow*100);return `<div class="farm-plot"><b>${c.icon} ${c.name}</b><progress max="${c.grow}" value="${p.growth}"></progress><small>${Math.round(pct)}% • ${p.ready?'พร้อมเก็บเกี่ยว':''}</small>${p.ready?`<button data-harvest="${i}">เก็บเกี่ยว</button>`:''}</div>`}).join('');
 const sv=services(state);
 $('info').innerHTML=`<span class="eyebrow">จัดการฟาร์ม • ระดับ ${f.level||1}</span><h2>${esc(buildingName(f))}</h2><div class="farm-plots">${cards}</div><h3>แรงงาน</h3><p>คนงาน ${state.workers||0} + นักศึกษาพาร์ตไทม์ ${Math.min(10,Math.floor(state.students/300))} • ใช้ ${state.labourUsed||0} / เหลือ ${labourLeft(state)} • จ้างคนละ ${number(FARM.workerFee)} ฿</p><div class="row"><button data-worker="1">จ้าง +1</button><button data-worker="5">จ้าง +5</button><button data-harvest-all>เก็บทั้งหมด</button><button id="remove-selected">รื้อถอน</button></div><h3>คลัง ${lots.length}/${storageCap(state)}</h3>${lots.map((l,i)=>{const c=crops.find(x=>x.id===l.crop);return `<div class="storage-lot">${c.icon} ${c.name} • ${number(l.units)} ${c.unit} • อายุ ${l.age}/${l.processed?c.processed.keep:c.keep} • ${number(lotValue(state,l))} ฿ <button data-sell="${i}">ขาย</button></div>`}).join('')||'<small>ยังไม่มีผลผลิต</small>'}<button data-sell-all>ขายทั้งหมด</button><p>ราคาตลาด: ${crops.filter(c=>c.unlocked).map(c=>`${c.icon} ${c.name} ${number(c.price)} ฿`).join(' • ')}</p>${up.max ? '<p class="match">อัปเกรดสูงสุดแล้ว</p>' : `<button id="upgrade" class="primary" ${up.error?'disabled':''}>⬆ อัปเกรดเป็น${esc(up.name)} • ${number(up.cost)} ฿</button>`}`;
 $('info').querySelectorAll('[data-plant]').forEach(s=>s.onchange=()=>{if(s.value)act(plantCrop(state,f.id,+s.dataset.plant,s.value),plantError(state,f.id,+s.dataset.plant,s.value),'ปลูกแล้ว')});$('info').querySelectorAll('[data-harvest]').forEach(x=>x.onclick=()=>act(harvestPlot(state,f.id,+x.dataset.harvest),harvestError(state,f.id,+x.dataset.harvest),'เก็บเกี่ยวแล้ว'));$('info').querySelectorAll('[data-worker]').forEach(x=>x.onclick=()=>act(hireWorkers(state,+x.dataset.worker),state.money<FARM.workerFee*(+x.dataset.worker)?'งบประมาณไม่เพียงพอ':'ไม่มีฟาร์ม','จ้างคนงานแล้ว'));$('info').querySelector('[data-harvest-all]').onclick=()=>act(harvestAll(state),'เก็บเกี่ยวไม่ได้','เก็บเกี่ยวแล้ว');$('info').querySelectorAll('[data-sell]').forEach(x=>x.onclick=()=>act(sellLots(state,[+x.dataset.sell]),'ขายไม่ได้','ขายแล้ว'));$('info').querySelector('[data-sell-all]').onclick=()=>act(sellAll(state),'ไม่มีผลผลิต','ขายทั้งหมดแล้ว');$('remove-selected').onclick=()=>{state=demolish(state,f.id);selected=null;update()};$('upgrade').onclick=()=>act(upgradeBuilding(state,f.id),up.error||'อัปเกรดไม่ได้','อัปเกรดแล้ว');
}
function renderServices(b){const up=upgradeInfo(state,b.id),s=services(state), unlocked=['guard','stop','cam'].map(k=>FACILITIES[k]).map(x=>x.name);$('info').innerHTML=`<span class="eyebrow">บริการกลาง</span><h2>${esc(buildingName(b))}</h2><p>สภาพถนน <progress max="100" value="${s.roadCondition}"></progress> ${Math.round(s.roadCondition)}%</p><p>ความปลอดภัย ${Math.round(s.security*100)}% • รถรับส่ง ${Math.round(s.shuttle*100)}% • เหตุการณ์ ${state.incidents||0}</p><p>ระดับถัดไปปลดล็อก: ${b.level===1?'ป้ายรถไฟฟ้า + รถไฟฟ้ารับส่ง':b.level===2?'กล้องวงจรปิด':'อัปเกรดสูงสุดแล้ว'}</p><div class="row">${up.max?'':`<button id="upgrade" class="primary" ${up.error?'disabled':''}>⬆ อัปเกรดเป็นระดับ ${up.next} • ${number(up.cost)} ฿</button>`}<button id="remove-selected">รื้อถอน</button></div>${up.error&&!up.max?`<small>${esc(up.error)}</small>`:''}`;$('remove-selected').onclick=()=>{state=demolish(state,b.id);selected=null;update()};if($('upgrade'))$('upgrade').onclick=()=>act(upgradeBuilding(state,b.id),up.error||'อัปเกรดไม่ได้','อัปเกรดส่วนบริการกลางแล้ว');}

function update() {
  const m = metrics(state);
  const u = utilities(state);
  const ratioBad = state.students > teachingCapacity(state);
  $('stats').innerHTML = [['เงิน', compact(state.money), '฿', state.money < 0], ['นักศึกษา', number(state.students), 'คน'], ['อาจารย์', number(state.lecturers), 'คน', ratioBad], ['ที่นั่ง', number(m.seats), ''], ['เตียง', number(m.beds), ''], ['💧', `${number(u.water.used)}/${number(u.water.supply)}`, 'ใช้/ผลิต', u.water.short > 0], ['⚡', `${number(u.power.used)}/${number(u.power.supply)}`, 'ใช้/ผลิต', u.power.short > 0], ['📶 Wi-Fi', `${Math.round(u.wifi.coverage * 100)}%`, 'ครอบคลุม'], ...(state.buildings.some(b=>b.type==='farm')?[['🌾', `${state.buildings.filter(b=>b.type==='farm').reduce((n,b)=>n+(b.plots||[]).filter(p=>p?.ready).length,0)} พร้อม • ${(state.storage||[]).length}/${storageCap(state)}`, 'คลัง', (state.buildings.some(b=>b.type==='farm'&&(b.plots||[]).some(p=>p?.ready)))]]:[]), ['🛣️', `${Math.round(services(state).roadCondition)}%`, 'ถนน', services(state).roadCondition<60], ['🛡️', `${Math.round(services(state).security*100)}%`, 'คุ้มครอง'], ['พึงพอใจ', state.satisfaction, '%'], ['ชื่อเสียง', Math.round(state.reputation), '/100']]
    .map(([name, value, unit, bad]) => `<div class="stat ${bad ? 'warn' : ''}"><span>${name}</span><strong>${value} <small>${unit}</small></strong></div>`).join('');
  $('date').textContent = `พ.ศ. ${state.year} • เทอม ${state.term}`;
  $('log').replaceChildren(...state.log.slice(0, 30).map(message => { const li = document.createElement('li'); li.textContent = message; return li; }));
  renderPalette();
  for (const b of document.querySelectorAll('.build-option')) {
    const type = b.dataset.type, active = tool === type;
    b.classList.toggle('selected', active); b.setAttribute('aria-pressed', String(active));
    if (['road', 'pipes', 'powerLines', 'ap'].includes(type) || type.startsWith('facility:')) continue;
    const t = TYPES[type], locked = !isUnlocked(state, type);
    const adminDone = type === 'admin' && state.buildings.some(x => x.type === 'admin');
    b.classList.toggle('locked', locked);
    b.disabled = locked || adminDone;
    b.querySelector('small').textContent = locked ? `🔒 ปลดล็อกบทที่ ${unlockChapter(type)}` : adminDone ? 'สร้างแล้ว' : `${t.w}×${t.h} ช่อง`;
  }
  $('bulldoze').classList.toggle('selected', tool === 'bulldoze');
  const f = state.lastFinance;
  $('finance').textContent = f ? `เทอมก่อน: ค่าเทอม ${number(f.income)} • งบรัฐ/ค่าหัว ${number((f.govGrant || 0) + (f.capitation || 0))} • งานวิจัย/ทุน ${number(f.researchIncome + f.grant)} • เงินเดือนอาจารย์ ${number(f.salary)} • รายจ่ายรวม ${number(f.expense)} ฿` : `ค่าเล่าเรียนพื้นฐาน ${number(ECON.tuition)} ฿ + ค่าหัวจากรัฐ 600 ฿ / คน / เทอม • งบประมาณแผ่นดินจ่ายทุกต้นปี`;
  const b = state.buildings.find(x => x.id === selected);
  if (b && ['farm','services'].includes(b.type)) { renderBuilding(b); }
  else if (selectedAgent && life.agents.some(a => a.id === selectedAgent)) {
    /* character panel is drawn by renderAgent() */
  } else if (b) {
    renderBuilding(b);
  } else if (tool === 'road') {
    $('info').innerHTML = `<span class="eyebrow">เตรียมก่อสร้าง</span><h2>ถนน</h2><p>คลิกหรือลากบนพื้นหญ้า ถนนต้องต่อจากถนนหลักอาคารจึงจะใช้งานได้</p><p>${number(ROAD.cost)} ฿ / ช่อง • บนแนวถนนเดิม (จุดจาง) ${number(ROAD.hintCost)} ฿<br>ค่าดูแล ${number(ROAD.upkeep)} ฿ / ช่อง / เทอม</p><p>ถนนที่สร้างแล้ว ${number(state.roads.length)} ช่อง</p>`;
  } else if (TYPES[tool]) {
    const t = TYPES[tool];
    $('info').innerHTML = `<span class="eyebrow">เตรียมก่อสร้าง</span><h2>${t.name}</h2><p>${t.description}</p><p>งบก่อสร้าง ${number(t.cost)} ฿<br>ค่าดูแล ${number(t.upkeep)} ฿ / เทอม</p><p>วางทับกรอบเส้นประชนิดเดียวกัน เพื่อรับโบนัสตรงผังจริง</p>`;
  } else if (selectedVehicle) {
    const v=[...life.agents.filter(a=>a.car&&a.mode==='walking'),...life.parked,...life.traffic].find(x=>x.id===selectedVehicle);
    if(v)$('info').innerHTML=`<span class="eyebrow">ยานพาหนะ • ${v.vehicle?.type||v.type||'รถยนต์'}</span><h2>${v.staff?v.name:'รถผู้มาติดต่อ'}</h2><p>${v.mode==='walking'||v.moving?'กำลังเดินทาง':'จอดอยู่'}</p>`;
    else $('info').innerHTML='<h2>สำรวจมหาวิทยาลัย</h2>';
  } else {
    $('info').innerHTML = '<h2>สำรวจมหาวิทยาลัย</h2><p>คลิกนักศึกษาเพื่อดูชีวิตของเขา<br>คลิกอาคารเพื่อดูรายละเอียดและอัปเกรด<br>กรอบเส้นประคือตำแหน่งอาคารจริง • จุดจางคือแนวถนนเดิม</p>';
  }
  const utilityToggle = $('utilities-view'); utilityToggle.checked = ['pipes', 'powerLines', 'ap'].includes(tool) ? true : utilityToggle.dataset.manual === 'true' ? utilityToggle.checked : false;
  view.setUtilityView(utilityToggle.checked);
  const facilityHint = typeof tool === 'string' && tool.startsWith('facility:') ? (() => { const k = tool.split(':')[1], f = FACILITIES[k]; return `คลิกเพื่อวาง${f.name} • ${f.needs === 'road' ? 'บนพื้นหญ้าที่ติดถนน' : 'บนพื้นหญ้าใกล้เสาไฟ (≤3 ช่อง) หรือติดอาคารที่มีไฟ'} • ครอบคลุมรัศมี ${f.radius} ช่อง • กรอบเขียว = วางได้ แดง = วางไม่ได้`; })() : '';
  const moveHint = typeof tool === 'string' && tool.startsWith('move:') ? 'คลิกตำแหน่งใหม่ (มุมซ้ายบนของอาคาร) • กรอบเขียว = ย้ายได้ • Esc ยกเลิก' : '';
  $('hint').textContent = moveHint || facilityHint || (tool === 'bulldoze' ? 'คลิกอาคาร จุด Wi-Fi หรือเส้นสาธารณูปโภคที่แสดงอยู่เพื่อรื้อ' : tool === 'road' ? 'ลากเพื่อสร้างถนน • ปุ่มกลางลากหรือ WASD เพื่อเลื่อน • คลิกขวาลากเพื่อหมุน' : tool === 'powerLines' ? `ลากเพื่อปักเสาไฟฟ้า (ปักให้ทุก ${LINES.powerLines.span} ช่อง สายพาดถึงกัน) • ${number(LINES.powerLines.cost)} ฿/ต้น • จ่ายไฟให้อาคารในระยะ ${LINES.powerLines.reach} ช่อง` : tool === 'pipes' ? `ลากเพื่อวาง${LINES[tool].name} • ${number(LINES[tool].cost)} ฿/ช่อง` : tool === 'ap' ? `คลิกเพื่อวางจุดกระจาย Wi-Fi • ${number(WIFI.cost)} ฿/จุด` : TYPES[tool] ? `กำลังวาง${TYPES[tool].name} • ขอบต้องติดถนนที่เชื่อมถนนหลัก` : 'คลิกอาคารหรือนักศึกษาเพื่อดูข้อมูล • เลือกเครื่องมือทางซ้ายเพื่อสร้าง');
  renderMissions();
  renderManage();
  if (selectedAgent) renderAgent();
  showNextStory();
}

// ---------- story dialog ----------
let storyOpen = false;
const AVATAR = { [RECTOR]: '👩‍🎓' };
function speakerHtml(name) { return `<div class="speaker"><span class="avatar">${AVATAR[name] || '👨‍🔬'}</span><strong>${esc(name)}</strong></div>`; }
function openStory(item, replay = false) {
  const c = CHAPTERS[item.chapter];
  storyOpen = true;
  $('speed').value = '0';
  $('story-note').textContent = '';
  if (item.kind === 'intro' && c) {
    $('story-kicker').textContent = `บทที่ ${c.level} • พ.ศ. ${c.year}`;
    $('story-title').textContent = c.title;
    $('story-text').textContent = c.intro;
    const unlocks = c.unlocks.map(t => TYPES[t].name);
    const st = replay ? c.stages[state.stage] : null;
    $('story-extra').innerHTML = `<strong>ตอนย่อยในบทนี้</strong><ul>${c.stages.map((s, i) => `<li>ตอนที่ ${i + 1}: ${esc(s.title)}</li>`).join('')}</ul>${unlocks.length && c.level > 1 ? `<p>ปลดล็อก: ${unlocks.join(', ')}</p>` : ''}${st ? `<hr>${speakerHtml(st.speaker)}<p>${esc(st.scene)}</p>` : ''}`;
    $('story-note').textContent = DISCLAIMER;
    $('story-ok').textContent = replay ? 'ปิด' : 'ไปต่อ';
  } else if (item.kind === 'stage' && c) {
    const st = c.stages[item.stage];
    $('story-kicker').textContent = `บทที่ ${c.level} • ตอนที่ ${item.stage + 1}/${c.stages.length}`;
    $('story-title').textContent = st.title;
    $('story-text').textContent = '';
    $('story-extra').innerHTML = `${speakerHtml(st.speaker)}<p>${esc(st.scene)}</p><strong>ภารกิจ</strong><ul>${st.missions.map(m => `<li>${esc(m.text)}</li>`).join('')}</ul>${st.reward ? `<p class="reward">รางวัลตอนนี้: ${number(st.reward)} ฿</p>` : ''}`;
    $('story-ok').textContent = 'เริ่มตอนนี้';
  } else if (item.kind === 'scene') {
    const sc = SCENES[item.key] || { speaker: item.speaker || 'เรื่องราว', text: item.text || '' };
    $('story-kicker').textContent = 'เหตุการณ์';
    $('story-title').textContent = '';
    $('story-text').textContent = '';
    $('story-extra').innerHTML = `${speakerHtml(sc.speaker)}<p>${esc(sc.text)}</p>`;
    $('story-ok').textContent = 'รับทราบ';
  } else if (c) {
    const last = item.chapter === CHAPTERS.length - 1;
    $('story-kicker').textContent = last ? 'จบเนื้อเรื่อง' : `สำเร็จบทที่ ${c.level}`;
    $('story-title').textContent = last ? 'มหาวิทยาลัยแห่งความภาคภูมิใจ' : c.title;
    $('story-text').textContent = c.outro;
    $('story-extra').innerHTML = c.reward ? `<p class="reward">รางวัล: ${number(c.reward)} ฿</p>` : '';
    $('story-ok').textContent = last ? 'เล่นต่อแบบอิสระ' : 'ไปต่อ';
  } else { storyOpen = false; if (!replay) state = ackStory(state); return; }
  $('story-ok').onclick = () => {
    $('story').close(); storyOpen = false;
    if (!replay) state = ackStory(state);
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
function resize() { const r = canvas.getBoundingClientRect(); view.resize(r.width, r.height); }
function focusCampus() {
  const core = MAP.ghosts.filter(g => ['admin', 'lecture', 'library'].includes(g.kind));
  const cx = core.length ? core.reduce((a, g) => a + g.x + g.w / 2, 0) / core.length : MAP.w / 2;
  const cy = core.length ? core.reduce((a, g) => a + g.y + g.h / 2, 0) / core.length : MAP.h / 2;
  view.focus(cx, cy, 36);
}

// ---------- character panel ----------
function bar(label, value, bad = false) {
  const v = Math.round(value);
  return `<div class="need"><span>${label}</span><progress max="100" value="${v}" class="${(bad ? v > 70 : v < 30) ? 'low' : ''}"></progress></div>`;
}
function renderAgent() {
  const a = life.agents.find(x => x.id === selectedAgent);
  if (!a) { selectedAgent = null; return false; }
  const where = a.mode === 'walking' ? 'กำลังเดินทาง' : a.mode === 'queue' ? 'กำลังรอคิว' : 'อยู่ในอาคาร';
  $('info').innerHTML = `<span class="eyebrow">${a.staff ? 'เจ้าหน้าที่' : `นักศึกษาปี ${a.year} • ${a.faculty.name}`}</span><h2><i class="dot" style="--c:${a.faculty.color}"></i>${a.name}</h2>
    <p class="thought">💭 “${a.thought}”</p><p>${ACTIVITY_TH[a.activity] || a.activity} • ${where}</p>
    ${bar('อิ่ม', 100 - a.needs.hunger)}${bar('พลังงาน', a.needs.energy)}${bar('สนุก', a.needs.fun)}${bar('ความเครียด', a.needs.stress, true)}
    <p>อารมณ์รวม ${Math.round(mood(a))}/100</p><button id="follow">ติดตามตัวละคร</button>`;
  $('follow').onclick = () => { following = a.id; notify(`กำลังติดตาม ${a.name}`); };
  return true;
}
let following = null, lastPanel = 0;

// ---------- input ----------
let painted = 0, paintError = '', lineTiles = new Set();
function paintRoad(p) {
  const err = roadError(state, p.x, p.y);
  if (err) { if (err !== 'มีถนนอยู่แล้ว') paintError = err; return; }
  state = placeRoad(state, p.x, p.y); painted++;
}
function local(e) { const r = canvas.getBoundingClientRect(); return { px: e.clientX - r.left, py: e.clientY - r.top }; }
function tileAtEvent(e) { const { px, py } = local(e); return view.groundAt(px, py); }
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  if (e.button !== 0 && e.button !== 1 && e.button !== 2) return;
  canvas.focus(); canvas.setPointerCapture(e.pointerId);
  const orbiting = e.button === 2 || (e.button === 0 && e.altKey);
  const painting = !orbiting && ['road', 'pipes', 'powerLines'].includes(tool) && e.button === 0;
  drag = { id: e.pointerId, orbiting, button: e.button, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, moved: false, painting };
  if (painting) { painted = 0; paintError = ''; lineTiles = new Set(); const p = tileAtEvent(e); if (p) { drag.tile = { x: p.x, y: p.y }; drag.axis = null; if (tool === 'road') paintRoad(p); else lineTiles.add(p.y * state.map.w + p.x); } update(); }
});
canvas.addEventListener('pointermove', e => {
  if (drag && drag.id === e.pointerId) {
    if (drag.painting) {
      const p = tileAtEvent(e);
      if (p && drag.tile) {
        let { x, y } = drag.tile;
        const dx=p.x-x,dy=p.y-y;
        if(!drag.axis&&(dx||dy)) drag.axis=Math.abs(dx)>=Math.abs(dy)?'x':'y';
        // Advance along the locked axis; a two-tile cross-axis offset turns
        // from the current endpoint and locks the path to the new axis.
        if(drag.axis==='x'&&Math.abs(dy)>=2) drag.axis='y'; else if(drag.axis==='y'&&Math.abs(dx)>=2) drag.axis='x';
        if(drag.axis==='x') {
          while(x!==p.x){x+=Math.sign(p.x-x);if(tool==='road')paintRoad({x,y});else lineTiles.add(y*state.map.w+x);}
          while(y!==p.y){y+=Math.sign(p.y-y);if(tool==='road')paintRoad({x,y});else lineTiles.add(y*state.map.w+x);}
        } else if(drag.axis==='y') {
          while(y!==p.y){y+=Math.sign(p.y-y);if(tool==='road')paintRoad({x,y});else lineTiles.add(y*state.map.w+x);}
          while(x!==p.x){x+=Math.sign(p.x-x);if(tool==='road')paintRoad({x,y});else lineTiles.add(y*state.map.w+x);}
        }
        drag.tile = { x, y };
      }
      hover = p; update(); return;
    }
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 5) drag.moved = true;
    if (drag.moved) { if (drag.orbiting) view.orbit(e.clientX - drag.lastX, e.clientY - drag.lastY); else { view.panPixels(e.clientX - drag.lastX, e.clientY - drag.lastY); following = null; } }
    drag.lastX = e.clientX; drag.lastY = e.clientY;
  }
  hover = tileAtEvent(e);
});
canvas.addEventListener('pointerup', e => {
  if (!drag || drag.id !== e.pointerId) return;
  const { moved, painting, button } = drag;
  drag = null;
  if (painting) {
    if (tool === 'road') { if (painted) notify(`สร้างถนน ${painted} ช่อง`); else if (paintError) notify(paintError); }
    else { const layer = tool, before = state[layer].length; const tiles = [...lineTiles]; state = placeLines(state, layer, layer === 'powerLines' ? tiles.filter((_, k) => k % LINES.powerLines.span === 0 || k === tiles.length - 1) : tiles); const count = state[layer].length - before; if (count) notify(`วาง${LINES[layer].name} ${count} ${layer === 'powerLines' ? 'ต้น' : 'ช่อง'}`); else { const p = tileAtEvent(e); if (p) notify(lineError(state, layer, p.x, p.y)); } }
    update(); return;
  }
  if (moved || button !== 0) return;
  const { px, py } = local(e), p = view.groundAt(px, py);
  if (!p) return;
  const buildingId = view.pickBuilding(px, py);
  const building = state.buildings.find(b => b.id === buildingId) || state.buildings.find(b => p.x >= b.x && p.x < b.x + b.w && p.y >= b.y && p.y < b.y + b.h);
  if (tool === 'bulldoze') {
    const i = p.y * state.map.w + p.x;
    if (state.facilities.some(o=>o.i===i)) { state=removeFacility(state,p.x,p.y);notify('รื้อบริการกลางแล้ว'); }
    else if (state.aps.includes(i)) { state = removeAP(state, p.x, p.y); notify('รื้อจุดกระจาย Wi-Fi แล้ว'); }
    else if ($('utilities-view').checked && (state.powerLines.includes(i) || state.pipes.includes(i))) { const layer = state.powerLines.includes(i) ? 'powerLines' : 'pipes'; state = removeLine(state, layer, p.x, p.y); notify(`รื้อ${LINES[layer].name}แล้ว`); }
    else if (building) { state = demolish(state, building.id); selected = null; notify('รื้อถอนแล้ว • คืนเงิน 30%'); }
    else if (tileAt(state, p.x, p.y) === 'r' || tileAt(state, p.x, p.y) === 'R') {
      const err = removeRoadError(state, p.x, p.y);
      if (err) notify(err); else { state = removeRoad(state, p.x, p.y); notify('รื้อถนนแล้ว'); }
    } else notify('เลือกอาคารหรือถนนที่ต้องการรื้อ');
  } else if (typeof tool === 'string' && tool.startsWith('move:')) {
    const id = +tool.slice(5), err = moveError(state, id, p.x, p.y);
    if (err) notify(err); else { state = moveBuilding(state, id, p.x, p.y); notify('ย้ายอาคารแล้ว'); tool = null; selected = id; }
  } else if (typeof tool === 'string' && tool.startsWith('facility:')) { const kind=tool.split(':')[1],err=facilityError(state,kind,p.x,p.y);if(err)notify(err);else{state=placeFacility(state,kind,p.x,p.y);notify(`ติดตั้ง${FACILITIES[kind].name}แล้ว`)}
  } else if (tool === 'ap') {
    const err = apError(state, p.x, p.y); if (err) notify(err); else { state = placeAP(state, p.x, p.y); notify('ติดตั้งจุดกระจาย Wi-Fi แล้ว'); }
  } else if (tool === 'road') {
    const err = roadError(state, p.x, p.y);
    if (err) notify(err); else { const cost = roadCost(state, p.x, p.y); state = placeRoad(state, p.x, p.y); notify(`สร้างถนน • ${number(cost)} ฿`); }
  } else if (TYPES[tool] && !building) {
    const error = placementError(state, tool, p.x, p.y);
    if (error) notify(error);
    else { state = place(state, tool, p.x, p.y); notify(`สร้าง${TYPES[tool].name}แล้ว`); if (tool === 'admin') tool = 'road'; selected = null; }
  } else {
    const agent = view.pickAgent(life, px, py);
    const vehicle = !agent && view.pickVehicle(life,px,py);
    if (agent) { selectedAgent = agent.id; selectedVehicle = null; selected = null; }
    else if(vehicle){selectedVehicle=vehicle.id;selectedAgent=null;selected=null;}
    else if (building) { selected = building.id; selectedAgent = null; selectedVehicle=null; }
    else { selected = null; selectedAgent = null; selectedVehicle=null; }
  }
  update();
});
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('pointerleave', () => { if (!drag) hover = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); view.zoomBy(Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
window.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName) || storyOpen) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(k)) { keys.add(k); e.preventDefault(); }
  if (k === 'q') view.rotate(-1);
  if (k === 'e') view.rotate(1);
  if (k === 'escape') { choose(null); selectedAgent = null; following = null; }
});
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

function advance() {
  if (storyOpen) return;
  state = tick(state, { lifeMood: takeTermMood(life) }); update();
  if (state.debtTerms >= 2) notify('เตือน: เงินติดลบต่อเนื่อง 2 เทอม');
}
$('next').onclick = () => { advance(); autoElapsed = 0; };
$('speed').onchange = () => { autoElapsed = 0; };
$('bulldoze').onclick = () => choose(tool === 'bulldoze' ? null : 'bulldoze');
$('labels').onchange = e => view.setLabels(e.target.checked);
$('ghosts').onchange = e => { showGhosts = e.target.checked; view.setGhosts(showGhosts); };
$('utilities-view').onchange = e => { if (['pipes', 'powerLines', 'ap'].includes(tool)) { e.target.checked = true; e.target.dataset.manual = 'false'; } else e.target.dataset.manual = 'true'; view.setUtilityView(e.target.checked); };
$('fit').onclick = () => { following = null; view.fitAll(); };
$('zoomin').onclick = () => view.zoomBy(1.35);
$('zoomout').onclick = () => view.zoomBy(1 / 1.35);
$('rotl').onclick = () => view.rotate(-1);
$('rotr').onclick = () => view.rotate(1);
for (const btn of document.querySelectorAll('[data-life]')) btn.onclick = () => {
  lifeSpeed = Number(btn.dataset.life);
  for (const o of document.querySelectorAll('[data-life]')) o.classList.toggle('selected', o === btn);
};

// ---------- save / load ----------
const SAVE_KEY = 'thasala-campus-v3', OLD_KEY = 'thasala-campus-v2';
const AUTOSAVE_MS = 20000;
function saveGame(silent = false) {
  try {
    const { map, ...saved } = state;
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    const t = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('autosave').textContent = `บันทึกล่าสุด ${t}`;
    if (!silent) notify('บันทึกมหาวิทยาลัยแล้ว');
    return true;
  } catch {
    $('autosave').textContent = 'บันทึกอัตโนมัติไม่ได้';
    if (!silent) notify('บันทึกไม่ได้: เบราว์เซอร์ไม่อนุญาตพื้นที่จัดเก็บ');
    return false;
  }
}
function readSave() {
  const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_KEY);
  return raw ? migrateSave(JSON.parse(raw), MAP) : null;
}
$('save').onclick = () => saveGame();
$('newgame').onclick = () => {
  if (!confirm('เริ่มเกมใหม่? ความคืบหน้าที่บันทึกไว้จะถูกแทนที่')) return;
  state = createState(); selected = null; selectedAgent = null; tool = 'admin';
  saveGame(true); update(); notify('เริ่มเกมใหม่แล้ว');
};
// Autosave every 20 s (skipped while a story dialog is open so the queue isn't half-acknowledged).
setInterval(() => { if (!storyOpen) saveGame(true); }, AUTOSAVE_MS);
window.addEventListener('pagehide', () => { if (!storyOpen) saveGame(true); });
$('load').onclick = () => {
  try {
    const loaded = readSave();
    if (!loaded) { notify('ยังไม่มีเกมที่บันทึกไว้'); return; }
    state = loaded; selected = null; tool = null; autoElapsed = 0; $('speed').value = '0';
    update(); notify('โหลดมหาวิทยาลัยแล้ว');
  } catch (e) { notify(e.message === 'old' ? 'เซฟเวอร์ชันเก่าเกินไป เริ่มเกมใหม่' : 'โหลดไม่ได้: ข้อมูลบันทึกไม่ถูกต้อง'); }
};
try {
  const loaded = readSave();
  if (loaded) { state = loaded; tool = null; setTimeout(() => notify('เล่นต่อจากที่บันทึกไว้'), 300); }
} catch { /* broken or too-old save: start fresh */ }

new ResizeObserver(resize).observe(canvas.parentElement);
resize(); focusCampus(); view.sync(state); update();

const TERM_MS = 30000; // auto term length at 1×
const HOUR_MS = 20000; // one in-game hour of daily life at 1× (walkers ≈ 1 tile/s)
function frame(time) {
  const dt = lastTime ? Math.min(time - lastTime, 250) : 0;
  lastTime = time;
  let dx = 0, dy = 0;
  if (keys.has('a') || keys.has('arrowleft')) dx += 1;
  if (keys.has('d') || keys.has('arrowright')) dx -= 1;
  if (keys.has('w') || keys.has('arrowup')) dy += 1;
  if (keys.has('s') || keys.has('arrowdown')) dy -= 1;
  if (dx || dy) { view.panPixels(dx * dt * 0.6, dy * dt * 0.6); following = null; }
  if (!storyOpen && lifeSpeed) updateLife(life, state, (dt / HOUR_MS) * lifeSpeed);
  const speed = Number($('speed').value);
  if (speed && !storyOpen) { autoElapsed += dt; if (autoElapsed >= TERM_MS / speed) { autoElapsed = 0; advance(); } }
  if (following) { const a = life.agents.find(x => x.id === following); if (a) view.focus(a.x, a.y, Math.min(24, 36)); else following = null; }
  view.sync(state);
  const isFacility = typeof tool === 'string' && tool.startsWith('facility:');
  const moving = typeof tool === 'string' && tool.startsWith('move:') ? state.buildings.find(b => b.id === +tool.slice(5)) : null;
  if (hover && moving) view.setPreview({ x: hover.x, y: hover.y, w: moving.w, h: moving.h, h3: 0.6, valid: !moveError(state, moving.id, hover.x, hover.y) });
  else
  if (hover && (TYPES[tool] || isFacility || ['road', 'pipes', 'powerLines', 'ap'].includes(tool))) {
    const size = tool === 'road' || isFacility || ['pipes', 'powerLines', 'ap'].includes(tool) ? { w: 1, h: 1 } : TYPES[tool];
    const valid = isFacility ? !facilityError(state, tool.split(':')[1], hover.x, hover.y) : tool === 'road' ? !roadError(state, hover.x, hover.y) : tool === 'pipes' || tool === 'powerLines' ? !lineError(state, tool, hover.x, hover.y) : tool === 'ap' ? !apError(state, hover.x, hover.y) : !placementError(state, tool, hover.x, hover.y);
    view.setPreview({ x: hover.x, y: hover.y, w: size.w, h: size.h, h3: tool === 'road' || isFacility || ['pipes', 'powerLines', 'ap'].includes(tool) ? 0.08 : 0.6, valid });
  } else view.setPreview(null);
  view.render(time, life, selectedAgent);
  if (time - lastPanel > 400) {
    lastPanel = time;
    const hh = Math.floor(life.hour), mm = Math.floor((life.hour - hh) * 60);
    $('clock').textContent = `วันที่ ${life.day} • ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} น. ${life.hour >= 6 && life.hour < 18 ? '☀️' : '🌙'}`;
    $('people').textContent = `ตัวละคร ${life.agents.length} คน${life.scale > 1.5 ? ` (1 คน ≈ ${Math.round(life.scale)} นักศึกษา)` : ''}`;
    if (selectedAgent) renderAgent();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Dev hook for testing in the browser console.
window.__campus = { get state() { return state; }, set state(v) { state = v; update(); }, life, view };
