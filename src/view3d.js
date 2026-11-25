// Low-poly isometric 3D view (Three.js). One tile = 1 world unit; tile (x, y) sits at world (x+.5, 0, y+.5).
import * as THREE from 'three';
import { TYPES, utilities, CROPS, FACILITIES, SHUTTLE , powerWires, buildingName } from './sim.js';
import { agentPosition } from './life.js';

const TILE_PX = 12; // terrain texture pixels per tile
const COL = { O: '#3c5a45', G: '#8fb070', H: '#8fb070', R: '#8fb070', r: '#8fb070', W: '#5fa3bf' };

export function createView(canvas, MAP) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const sky = new THREE.Color('#9fd0e6');
  scene.background = sky.clone();

  // ---------- camera ----------
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -500, 1000);
  const target = new THREE.Vector3(MAP.w / 2, 0, MAP.h / 2);
  let angle = Math.PI / 4, viewSize = 40; // world units visible vertically
  let elev = Math.atan(1 / Math.SQRT2); // camera pitch (classic isometric ~35°), adjustable by orbiting
  let width = 1, height = 1;
  function placeCamera() {
    const dist = 200;
    camera.position.set(target.x + Math.sin(angle) * Math.cos(elev) * dist, Math.sin(elev) * dist, target.z + Math.cos(angle) * Math.cos(elev) * dist);
    camera.lookAt(target);
    const aspect = width / height;
    camera.left = -viewSize * aspect / 2; camera.right = viewSize * aspect / 2; camera.top = viewSize / 2; camera.bottom = -viewSize / 2;
    camera.updateProjectionMatrix();
  }

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight('#dff1ff', '#4d6b3c', 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff2d6', 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  // ---------- terrain ----------
  const tex = document.createElement('canvas');
  tex.width = MAP.w * TILE_PX; tex.height = MAP.h * TILE_PX;
  const tc = tex.getContext('2d');
  const baseCanvas = document.createElement('canvas'); baseCanvas.width = tex.width; baseCanvas.height = tex.height;
  const bc = baseCanvas.getContext('2d');
  function paintTile(x, y, kind) {
    bc.fillStyle = COL[kind] || COL.G;
    bc.fillRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX);
    if (kind === 'G' || kind === 'H') { if ((x * 73 + y * 31) % 5 === 0) { bc.fillStyle = '#82a565'; bc.fillRect(x * TILE_PX + 2, y * TILE_PX + 3, 3, 2); } }
    if (kind === 'W' && (x + y) % 3 === 0) { bc.fillStyle = '#86bfd3'; bc.fillRect(x * TILE_PX + 1, y * TILE_PX + 3, 5, 1); }
  }
  for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) paintTile(x, y, MAP.tiles[y * MAP.w + x]);
  let roadConditionBucket = 100;
  const mainRoads = (MAP.mainRoads || []).map(r => ({ pts: r.pts, width: r.width === 2 ? 2.1 : 1 }));
  function strokeRoad(ctx, pts, w, pass, player = false) {
    if (!pts || pts.length < 2) return;
    ctx.save(); ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath();
    ctx.moveTo(pts[0][0] * TILE_PX, pts[0][1] * TILE_PX);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * TILE_PX, pts[i][1] * TILE_PX);
    const px = w * TILE_PX;
    if (pass === 0) { ctx.strokeStyle = '#c9cdd0'; ctx.lineWidth = px + .35 * TILE_PX; }
    if (pass === 1) { ctx.strokeStyle = '#44474d'; ctx.lineWidth = px; }
    if (pass === 2) { ctx.strokeStyle = '#f1f0e8'; ctx.lineWidth = Math.max(1, px - .15 * TILE_PX); }
    if (pass === 3) { ctx.strokeStyle = '#44474d'; ctx.lineWidth = Math.max(1, px - .3 * TILE_PX); }
    if (pass === 4) {
      ctx.setLineDash([]);
      if (!player && w > 1) { ctx.strokeStyle = '#e7c94d'; ctx.lineWidth = .16 * TILE_PX; ctx.stroke(); ctx.lineWidth = .05 * TILE_PX; ctx.strokeStyle = '#44474d'; }
      else { ctx.strokeStyle = '#f5f5ee'; ctx.lineWidth = Math.max(1, .07 * TILE_PX); ctx.setLineDash([.6 * TILE_PX, .5 * TILE_PX]); }
    }
    if (pass !== 4 || (player || w <= 1)) ctx.stroke();
    ctx.restore();
  }
  function roadDisc(ctx, x, y, radius) { ctx.fillStyle = '#44474d'; ctx.beginPath(); ctx.arc(x * TILE_PX, y * TILE_PX, radius * TILE_PX, 0, Math.PI * 2); ctx.fill(); }
  function mainJunctions() {
    const out = [];
    const add = (x,y,r) => { if (!out.some(p => Math.hypot(p.x-x,p.y-y)<.08)) out.push({x,y,r}); };
    for (let a=0;a<mainRoads.length;a++) for (let b=a+1;b<mainRoads.length;b++) {
      const A=mainRoads[a],B=mainRoads[b];
      for (let i=0;i<A.pts.length-1;i++) for(let j=0;j<B.pts.length-1;j++) {
        const [x1,y1]=A.pts[i],[x2,y2]=A.pts[i+1],[x3,y3]=B.pts[j],[x4,y4]=B.pts[j+1];
        const den=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4); if(Math.abs(den)<1e-8) continue;
        const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/den,u=-((x1-x2)*(y1-y3)-(y1-y2)*(x1-x3))/den;
        if(t>=0&&t<=1&&u>=0&&u<=1) add(x1+t*(x2-x1),y1+t*(y2-y1),Math.max(A.width,B.width)/2+.1);
      }
      for(const p of A.pts) if(B.pts.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<.05)) add(p[0],p[1],Math.max(A.width,B.width)/2+.1);
    }
    return out;
  }
  const mainJoints = mainJunctions();
  function composeRoadTexture(playerTiles, condition = roadConditionBucket) {
    roadConditionBucket = condition;
    const pset = new Set(playerTiles || []), nodes = new Set(pset), degree = new Map(), adjacency = new Map(), chains = [], isolated = [];
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]], key = (a,b) => `${Math.min(a,b)}:${Math.max(a,b)}`;
    // Include main-road tiles only where they touch a player road.
    for (const i of pset) { const x=i%MAP.w,y=Math.floor(i/MAP.w); for(const [dx,dy] of dirs) { const nx=x+dx,ny=y+dy,j=ny*MAP.w+nx; if(nx>=0&&ny>=0&&nx<MAP.w&&ny<MAP.h&&MAP.tiles[j]==='R') nodes.add(j); } }
    for (const i of nodes) { const x=i%MAP.w,y=Math.floor(i/MAP.w), ns=[]; for(const [dx,dy] of dirs) { const nx=x+dx,ny=y+dy,j=ny*MAP.w+nx; if(nx>=0&&ny>=0&&nx<MAP.w&&ny<MAP.h&&nodes.has(j)) ns.push(j); } adjacency.set(i,ns); degree.set(i,ns.length); }
    const used = new Set();
    function trace(start, next) { const path=[start]; let prev=start, cur=next; used.add(key(prev,cur)); while(true) { path.push(cur); if(degree.get(cur)!==2) break; const n=adjacency.get(cur).find(j=>j!==prev&&!used.has(key(cur,j))); if(n==null) break; prev=cur;cur=n;used.add(key(prev,cur)); } return path; }
    for(const i of nodes) if(degree.get(i)!==2) for(const j of adjacency.get(i)) if(!used.has(key(i,j))) chains.push(trace(i,j));
    for(const i of nodes) for(const j of adjacency.get(i)) if(!used.has(key(i,j))) chains.push(trace(i,j));
    const smooth = path => {
      let pts=path.map(i=>[i%MAP.w+.5,Math.floor(i/MAP.w)+.5]);
      // RDP, preserving both endpoints.
      function simplify(a, eps) { if(a.length<3)return a; const p=a[0],q=a[a.length-1];let best=eps,idx=-1;for(let k=1;k<a.length-1;k++){const dx=q[0]-p[0],dy=q[1]-p[1],den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((a[k][0]-p[0])*dx+(a[k][1]-p[1])*dy)/den)):0,d=Math.hypot(a[k][0]-p[0]-t*dx,a[k][1]-p[1]-t*dy);if(d>best){best=d;idx=k;}}if(idx<0)return[p,q];const l=simplify(a.slice(0,idx+1),eps),r=simplify(a.slice(idx),eps);return l.slice(0,-1).concat(r); }
      pts=simplify(pts,.75);
      for(let it=0;it<2&&pts.length>2;it++){const out=[pts[0]];for(let k=0;k<pts.length-1;k++){const a=pts[k],b=pts[k+1];out.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]]);}out.push(pts[pts.length-1]);pts=out;}
      return pts;
    };
    const strokes=chains.filter(c=>c.some(i=>pset.has(i))).map(smooth);
    for(const i of pset) if(!(adjacency.get(i)||[]).length) isolated.push([i%MAP.w+.5,Math.floor(i/MAP.w)+.5]);
    tc.clearRect(0,0,tex.width,tex.height); tc.drawImage(baseCanvas,0,0);
    for(let pass=0;pass<5;pass++) for(const r of mainRoads) strokeRoad(tc,r.pts,r.width,pass,false);
    for(const p of mainJoints) roadDisc(tc,p.x,p.y,p.r);
    for(let pass=0;pass<5;pass++) for(const s of strokes) strokeRoad(tc,s,.95,pass,true);
    for(const [x,y] of isolated){tc.fillStyle='#44474d';tc.beginPath();tc.roundRect((x-.5)*TILE_PX,(y-.5)*TILE_PX,TILE_PX,TILE_PX,2);tc.fill();}
    for(const i of nodes) if(pset.has(i)&&degree.get(i)>=3) roadDisc(tc,i%MAP.w+.5,Math.floor(i/MAP.w)+.5,.55);
    for(const i of pset) if(adjacency.get(i)?.some(j=>MAP.tiles[j]==='R')) roadDisc(tc,i%MAP.w+.5,Math.floor(i/MAP.w)+.5,.55);
    if(condition<70){const density=Math.max(3,Math.floor(100/(70-condition))); tc.save();tc.fillStyle='#282b2e';tc.strokeStyle='#282b2e';
      for(let i=0;i<MAP.tiles.length;i++){const on=pset.has(i)||MAP.tiles[i]==='R';if(!on||((i*37)%density)!==0)continue;const x=(i%MAP.w+.25+((i*13)%50)/100)*TILE_PX,y=(Math.floor(i/MAP.w)+.25+((i*17)%50)/100)*TILE_PX;tc.beginPath();tc.ellipse(x,y,1.4,0.65,(i%7)*.3,0,Math.PI*2);tc.fill();} tc.restore();
    }
    groundTex.needsUpdate=true;
  }
  const groundTex = new THREE.CanvasTexture(tex);
  groundTex.magFilter = THREE.LinearFilter; groundTex.minFilter = THREE.LinearMipmapLinearFilter; groundTex.anisotropy = renderer.capabilities.getMaxAnisotropy(); groundTex.colorSpace = THREE.SRGBColorSpace;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP.w, MAP.h), new THREE.MeshLambertMaterial({ map: groundTex }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(MAP.w / 2, 0, MAP.h / 2); ground.receiveShadow = true;
  scene.add(ground);
  const utilCanvas = document.createElement('canvas'); utilCanvas.width = tex.width; utilCanvas.height = tex.height;
  const uc = utilCanvas.getContext('2d');
  const utilTex = new THREE.CanvasTexture(utilCanvas); utilTex.colorSpace = THREE.SRGBColorSpace;
  const utilOverlay = new THREE.Mesh(new THREE.PlaneGeometry(MAP.w, MAP.h), new THREE.MeshBasicMaterial({ map: utilTex, transparent: true, opacity: 0.88, depthWrite: false }));
  utilOverlay.rotation.x = -Math.PI / 2; utilOverlay.position.set(MAP.w / 2, 0.035, MAP.h / 2); utilOverlay.renderOrder = 2; scene.add(utilOverlay);
  let utilView = false, lineRefs = { pipes: null, powerLines: null }, utilBuildingRef = null;
  function updateLineTexture(state) {
    const changed = new Set();
    for (const layer of ['pipes', 'powerLines']) {
      if (lineRefs[layer] === state[layer]) continue;
      const before = new Set(lineRefs[layer] || []), after = new Set(state[layer]);
      for (const i of before) if (!after.has(i)) changed.add(i);
      for (const i of after) if (!before.has(i)) changed.add(i);
      lineRefs[layer] = state[layer];
    }
    for (const i of changed) {
      const x = i % MAP.w, y = Math.floor(i / MAP.w); uc.clearRect(x * TILE_PX, y * TILE_PX, TILE_PX, TILE_PX);
      if (state.pipes.includes(i) || state.powerLines.includes(i)) { uc.fillStyle = state.powerLines.includes(i) ? '#f8c82ccc' : '#168bffcc'; uc.fillRect(x * TILE_PX + 1, y * TILE_PX + 1, TILE_PX - 2, TILE_PX - 2); }
    }
    if (changed.size) utilTex.needsUpdate = true;
  }
  const under = new THREE.Mesh(new THREE.BoxGeometry(MAP.w + 0.2, 2, MAP.h + 0.2), new THREE.MeshLambertMaterial({ color: '#6b5a43' }));
  under.position.set(MAP.w / 2, -1.01, MAP.h / 2);
  scene.add(under);

  // old-road hints as a separate overlay so they can be toggled
  const hintCanvas = document.createElement('canvas');
  hintCanvas.width = tex.width; hintCanvas.height = tex.height;
  const hcx = hintCanvas.getContext('2d');
  hcx.save(); hcx.strokeStyle = '#f3ecd0'; hcx.globalAlpha = .35; hcx.lineWidth = .35*TILE_PX; hcx.lineCap = hcx.lineJoin = 'round'; hcx.setLineDash([.45*TILE_PX,.35*TILE_PX]);
  for (const road of MAP.minorRoads || []) { if (!road || road.length < 2) continue; hcx.beginPath(); hcx.moveTo(road[0][0]*TILE_PX,road[0][1]*TILE_PX); for(let i=1;i<road.length;i++) hcx.lineTo(road[i][0]*TILE_PX,road[i][1]*TILE_PX); hcx.stroke(); }
  hcx.restore();
  const hintTex = new THREE.CanvasTexture(hintCanvas); hintTex.magFilter = THREE.LinearFilter; hintTex.minFilter = THREE.LinearMipmapLinearFilter; hintTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const hints = new THREE.Mesh(new THREE.PlaneGeometry(MAP.w, MAP.h), new THREE.MeshBasicMaterial({ map: hintTex, transparent: true, opacity: 0.3, depthWrite: false }));
  hints.rotation.x = -Math.PI / 2; hints.position.set(MAP.w / 2, 0.02, MAP.h / 2);
  scene.add(hints);

  // ---------- trees (instanced, hidden where built) ----------
  const treeSpots = [];
  for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) {
    const t = MAP.tiles[y * MAP.w + x], hsh = (x * 928371 + y * 364479) % 1000;
    if ((t === 'G' && hsh < 70) || (t === 'O' && hsh < 140)) treeSpots.push({ x, y, s: 0.6 + (hsh % 50) / 70, out: t === 'O' });
  }
  const trunkGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5); trunkGeo.translate(0, 0.25, 0);
  const leafGeo = new THREE.ConeGeometry(0.38, 0.95, 6); leafGeo.translate(0, 0.9, 0);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshLambertMaterial({ color: '#6d4c2f' }), treeSpots.length);
  const leaves = new THREE.InstancedMesh(leafGeo, new THREE.MeshLambertMaterial({ color: '#3f7f3a' }), treeSpots.length);
  trunks.castShadow = leaves.castShadow = true;
  const tmp = new THREE.Object3D();
  function layoutTrees(blocked) {
    treeSpots.forEach((t, i) => {
      const hidden = blocked.has(t.y * MAP.w + t.x);
      tmp.position.set(t.x + 0.5 + ((t.x * 7) % 5 - 2) * 0.06, 0, t.y + 0.5 + ((t.y * 3) % 5 - 2) * 0.06);
      tmp.rotation.set(0, (t.x + t.y) * 0.7, 0);
      tmp.scale.setScalar(hidden ? 0 : t.s);
      tmp.updateMatrix();
      trunks.setMatrixAt(i, tmp.matrix); leaves.setMatrixAt(i, tmp.matrix);
      leaves.setColorAt(i, new THREE.Color(t.out ? '#2f5f33' : ['#3f7f3a', '#4d8c3f', '#5f9a45'][(t.x + t.y) % 3]));
    });
    trunks.instanceMatrix.needsUpdate = leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  }
  scene.add(trunks, leaves);

  // ---------- ghosts (real layout outlines) ----------
  const ghostGroup = new THREE.Group();
  for (const g of MAP.ghosts) {
    const color = TYPES[g.kind]?.color || '#e8f0d8';
    const pts = [[g.x, g.y], [g.x + g.w, g.y], [g.x + g.w, g.y + g.h], [g.x, g.y + g.h], [g.x, g.y]].map(([x, z]) => new THREE.Vector3(x, 0.05, z));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color, dashSize: 0.4, gapSize: 0.25 }));
    line.computeLineDistances();
    ghostGroup.add(line);
  }
  scene.add(ghostGroup);

  // ---------- buildings ----------
  const mats = new Map();
  const mat = (color, extra = {}) => {
    const key = color + JSON.stringify(extra);
    if (!mats.has(key)) mats.set(key, new THREE.MeshLambertMaterial({ color, ...extra }));
    return mats.get(key);
  };
  const windowMat = new THREE.MeshLambertMaterial({ color: '#33495a', emissive: '#ffd27a', emissiveIntensity: 0 });
  function box(w, h, d, color, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color) : color);
    m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function windows(group, w, d, floors, floorH, y0 = 0.15) {
    // strips of windows on the two long faces
    for (let f = 0; f < floors; f++) {
      const y = y0 + f * floorH + floorH * 0.35;
      for (const side of [-1, 1]) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, floorH * 0.32, 0.04), windowMat);
        strip.position.set(0, y, side * (d / 2 + 0.01));
        group.add(strip);
      }
    }
  }
  function roof(w, d, h, color, y) {
    const geo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); geo.rotateY(Math.PI / 4);
    const m = new THREE.Mesh(geo, mat(color));
    m.scale.set(w, h, d); m.position.y = y + h / 2; m.castShadow = true;
    return m;
  }
  const MODELS = {
    services(w, d, level = 1) {
      // depot: office + garage bays for the road crew; level 2 adds a shuttle charging canopy, level 3 a security control tower
      const g = new THREE.Group();
      g.add(box(w * 0.45, 1.3, d - 0.5, '#d9cfbd', -w * 0.25, 0, 0));
      windows(g, w * 0.45, d - 0.5, 1, 1.1);
      g.add(box(w * 0.5, 1.0, d - 0.4, '#a89c86', w * 0.22, 0, 0));
      for (let n = 0; n < 2; n++) g.add(box(0.7, 0.75, 0.04, '#6d6a62', w * 0.12 + n * 0.85, 0, (d - 0.4) / 2 + 0.01));
      g.add(box(w * 0.5 + 0.1, 0.08, d - 0.3, '#e09a3c', w * 0.22, 1.0));
      g.add(box(0.55, 0.35, 0.32, '#f2b33d', w * 0.45, 0, d / 2 - 0.05)); // repair truck
      if (level >= 2) { g.add(box(w * 0.9, 0.06, 0.9, '#4da879', 0, 1.5, -d / 2 + 0.2)); g.add(box(0.06, 1.5, 0.06, '#6b7570', -w * 0.4, 0, -d / 2 + 0.2)); g.add(box(0.06, 1.5, 0.06, '#6b7570', w * 0.4, 0, -d / 2 + 0.2)); }
      if (level >= 3) { g.add(box(0.8, 2.2, 0.8, '#cfd6db', -w * 0.25, 1.3, 0)); g.add(box(0.95, 0.4, 0.95, '#2d4f63', -w * 0.25, 3.5, 0)); }
      return g;
    },
    farm(w,d,level=1) {
      const g=new THREE.Group();
      g.add(box(w-.2,.08,d-.2,'#7b6041'));
      const houses=level;
      for(let n=0;n<houses;n++){const x=-w*.32+n*w*.32;g.add(box(1.1,1.2,1.3,'#e7eee0',x,0,-d*.28));g.add(box(1.18,.08,1.38,'#83c6d3',x,1.2,-d*.28));}
      const rows=level===1?2:level===2?3:4;
      for(let r=0;r<rows;r++){const z=-d*.05+r*.43;g.add(box(w*.82,.08,.23,'#795a38',0,.05,z));}
      if(level>=2){for(let r=0;r<3;r++)g.add(box(.08,.06,d*.72,'#5aa4a3',-w*.37+r*.35,.2,0));}
      if(level>=3){g.add(box(1.25,.8,1,'#d6c8a1',w*.27,0,d*.25));g.add(box(1.35,.08,1.1,'#7c5541',w*.27,.8,d*.25));for(let x=-.8;x<=.8;x+=.4)g.add(box(.28,.04,.55,'#243d37',x,1.3,d*.36));}
      return g;
    },
    water(w, d) {
      const g = new THREE.Group();
      g.add(box(w - 0.5, 0.45, d - 0.5, '#77b6cc', 0, 0, 0));
      g.add(box(w - 1.05, 0.12, d - 1.05, '#3387a6', 0, 0.45, 0));
      g.add(box(0.24, 1.5, 0.24, '#7c9295', -0.35, 0.55, -0.25));
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.55, 10), mat('#d4e5e4')); tank.position.set(-0.35, 2.25, -0.25); tank.castShadow = true; g.add(tank);
      g.add(new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.24, 10), mat('#4e92a7'))).position.set(-0.35, 2.64, -0.25);
      return g;
    },
    power(w, d) {
      const g = new THREE.Group();
      for (const x of [-w * 0.42, w * 0.42]) for (const z of [-d * 0.42, d * 0.42]) { g.add(box(0.07, 0.8, 0.07, '#6d776e', x, 0, z)); }
      g.add(box(w - 0.28, 0.08, 0.08, '#cbb674', 0, 0.8, -d * 0.42));
      g.add(box(w - 0.5, 0.55, d - 0.5, '#b8aa83', 0, 0, 0));
      g.add(box(0.22, 2.4, 0.22, '#747d78', 0.48, 0, -0.3));
      g.add(box(1.05, 0.08, 0.08, '#747d78', 0.48, 2.15, -0.3));
      for (const x of [0.1, 0.84]) g.add(box(0.07, 0.48, 0.07, '#747d78', x, 1.8, -0.3));
      return g;
    },
    digital(w, d, level = 1) {
      const g = new THREE.Group();
      if (level === 1) {
        g.add(box(w - 0.5, 1.15, d - 0.5, '#a8c9ce'));
        for (let i = 0; i < 3; i++) g.add(box(0.13, 0.72, 0.16, '#4d6670', -0.55 + i * 0.55, 0.2, -0.2));
        g.add(box(0.08, 1.5, 0.08, '#6a858d', 0.85, 0.4, 0.6));
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat('#57c9ff', { emissive: '#259fff', emissiveIntensity: 1.8 })); glow.position.set(0.85, 1.25, 0.6); g.add(glow);
      } else if (level === 2) {
        g.add(box(w - 0.5, 3.2, d - 0.5, mat('#92c9d2', { transparent: true, opacity: 0.82 })));
        windows(g, w - 0.5, d - 0.5, 4, 0.7, 0.2);
        g.add(box(w - 0.2, 0.12, d - 0.2, '#55aebd', 0, 3.2));
      } else {
        g.add(box(w - 0.4, 2.2, d - 0.4, mat('#bddce0', { transparent: true, opacity: 0.9 })));
        g.add(box(w * 0.7, 0.8, d * 0.7, '#5e9da9', 0.25, 2.2, 0));
        g.add(box(w + 0.05, 0.055, 0.12, mat('#39dded', { emissive: '#19bccc', emissiveIntensity: 1.7 }), 0, 1.25, d * 0.48));
        g.add(box(0.1, 0.08, d + 0.05, mat('#39dded', { emissive: '#19bccc', emissiveIntensity: 1.7 }), -w * 0.48, 1.25));
        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#d8e5e3')); dish.rotation.x = -Math.PI / 2; dish.position.set(0.45, 3.12, -0.25); g.add(dish);
        g.add(box(0.08, 0.45, 0.08, '#758d92', 0.45, 2.65, -0.25));
      }
      return g;
    },
    admin(w, d, level = 1) {
      const g = new THREE.Group();
      const floors = 2 + level - 1, fh = 0.9, bodyH = floors * fh;
      g.add(box(w - 0.4, bodyH, d - 0.4, '#efe3c8'));
      windows(g, w - 0.4, d - 0.4, floors, fh, 0.25);
      g.add(roof(w - 0.1, d - 0.1, 1.2, '#b5532f', bodyH));
      const towerH = 1.6 + (level - 1) * 0.55;
      g.add(roof(1.3 + (level - 1) * 0.25, 1.3 + (level - 1) * 0.25, towerH, '#d29a3c', bodyH + 1.2));
      g.add(box(0.12, 0.6 + (level - 1) * 0.35, 0.12, '#d8b04a', 0, bodyH + 2.8));
      return g;
    },
    lecture(w, d, level = 1) {
      const g = new THREE.Group();
      const floors = 2 + level - 1, fh = 0.75, bodyH = floors * fh;
      g.add(box(w - 0.3, bodyH, d - 0.4, '#f1e7cf'));
      windows(g, w - 0.3, d - 0.4, floors, fh, 0.12);
      g.add(box(w - 0.1, 0.12, d - 0.2, '#c9b48a', 0, bodyH));
      if (level >= 2) { g.add(box(w * 0.42, 0.9, d * 0.42, '#6e9b9c', w * 0.22, bodyH, 0)); g.add(box(w * 0.42, 0.1, d * 0.42, '#a7c2bb', w * 0.22, bodyH + 0.9)); }
      for (let i = 0; i < 5; i++) g.add(box(0.12, 1.2, 0.12, '#ffffff', -w / 2 + 0.5 + i * (w - 1) / 4, 0, d / 2 - 0.12));
      return g;
    },
    dorm(w, d, level = 1) {
      const g = new THREE.Group();
      const floors = 4 + (level - 1) * 2, fh = 0.62, bodyH = floors * fh;
      g.add(box(w - 0.5, bodyH, d - 0.9, '#f2d2bf'));
      windows(g, w - 0.5, d - 0.9, floors, fh, 0.2);
      for (let f = 0; f < floors; f++) for (const x of [-w * 0.28, w * 0.28]) g.add(box(0.44, 0.06, 0.22, '#8fa1a7', x, f * fh + 0.22, d / 2 - 0.34));
      g.add(box(w - 0.3, 0.12, d - 0.7, '#c47b5c', 0, bodyH));
      g.add(box(0.5, 0.35, 0.3, '#8fa1a7', 0.6, bodyH + 0.12, 0));
      return g;
    },
    canteen(w, d, level = 1) {
      const g = new THREE.Group();
      g.add(box(w - 0.4, 0.9, d - 0.4, '#f7eed6'));
      windows(g, w - 0.4, d - 0.4, 1, 0.8);
      g.add(roof(w + 0.1, d + 0.1, 0.6, '#5c8f4e', 0.9));
      g.add(box(w - 0.2, 0.06, 0.5, '#e9a13b', 0, 0.75, d / 2 - 0.05));
      if (level >= 2) { const hallW = w * 0.48; g.add(box(hallW, 0.9, d - 0.5, '#f7eed6', w * 0.27, 0, 0)); windows(g, hallW, d - 0.5, 1, 0.8); g.add(roof(hallW + 0.1, d, 0.6, '#5c8f4e', 0.9).translateX(w * 0.27)); }
      if (level >= 3) g.add(box(w - 0.8, 0.08, 0.35, '#d4a34f', 0, 1.55, -d * 0.22));
      return g;
    },
    library(w, d, level = 1) {
      const g = new THREE.Group();
      const floors = 2 + (level === 3 ? 1 : 0), fh = 0.8, bodyH = floors * fh;
      g.add(box(w - 0.6, bodyH, d - 0.6, '#d9e6e3'));
      windows(g, w - 0.6, d - 0.6, floors, fh, 0.15);
      const domeRadius = level >= 2 ? 1.45 : 1.1;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(domeRadius, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#5a9c94'));
      dome.position.y = bodyH; dome.castShadow = true; g.add(dome);
      if (level >= 3) { const second = dome.clone(); second.position.set(w * 0.27, bodyH, 0); second.scale.setScalar(0.72); g.add(second); }
      return g;
    },
    sports(w, d, level = 1) {
      const g = new THREE.Group();
      g.add(box(w - 0.3, 0.05, d - 0.3, '#4f9b48'));
      const track = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) / 2 - 0.45, 0.12, 4, 24), mat('#c4623f'));
      track.rotation.x = Math.PI / 2; track.position.y = 0.07; track.scale.set(w / d, 1, 1); g.add(track);
      g.add(box(w - 0.4, 0.5, 0.5, '#d9d9d9', 0, 0, -d / 2 + 0.4));
      if (level >= 2) {
        for (let row = 0; row < (level === 3 ? 4 : 3); row++) g.add(box(w * 0.56, 0.18, 0.36, '#d8d2c1', 0, 0.12 + row * 0.22, -d / 2 + 0.65 + row * 0.32));
        for (const x of [-w * 0.4, w * 0.4]) { g.add(box(0.08, 2.6, 0.08, '#6e7881', x, 0, -d * 0.24)); g.add(box(0.55, 0.08, 0.28, '#ffe89a', x, 2.52, -d * 0.24)); }
      }
      return g;
    },
    academic(w, d, level = 1) {
      const g = new THREE.Group();
      const floors = 3 + (level - 1), fh = 0.72, bodyH = floors * fh;
      g.add(box(w - 0.4, bodyH, d - 0.5, '#cfd8ee'));
      windows(g, w - 0.4, d - 0.5, floors, fh, 0.18);
      g.add(box(1.2, 0.8, 1.0, '#b9c4e6', w / 2 - 1, bodyH, 0));
      g.add(box(0.06, 0.8, 0.06, '#7d8db3', -w / 2 + 0.8, bodyH, 0));
      if (level >= 2) g.add(box(w * 0.38, 1.45, d * 0.55, mat('#78b6c0'), w * 0.28, 0, 0));
      if (level >= 3) g.add(box(w * 0.38, 1.45, d * 0.55, mat('#78b6c0'), w * 0.28, 1.45, 0));
      return g;
    },
    coop(w, d, level = 1) {
      const g = new THREE.Group();
      g.add(box(w - 0.5, 1.8, d - 0.5, new THREE.MeshLambertMaterial({ color: '#9fc6d9', emissive: '#ffd27a', emissiveIntensity: 0 })));
      g.add(box(w - 0.3, 0.12, d - 0.3, '#c9a0d8', 0, 1.8));
      if (level >= 2) { g.add(box(w - 0.5, 0.6, d - 0.5, new THREE.MeshLambertMaterial({ color: '#9fc6d9', emissive: '#ffd27a', emissiveIntensity: 0 }), 0, 1.92)); g.add(box(w + 0.35, 0.24, 0.35, '#73adbd', 0, 1.95)); }
      if (level >= 3) { g.add(box(w + 0.5, 0.3, 0.45, '#73adbd', 0, 2.55)); g.add(box(0.12, 0.8, 0.12, '#bd9f52', 0, 2.85)); }
      return g;
    },
    hospital(w, d, level = 1) {
      const g = new THREE.Group();
      const floors = 3 + (level - 1), fh = 0.8, bodyH = floors * fh;
      g.add(box(w - 0.6, bodyH, d - 1.2, '#f7f7f4'));
      windows(g, w - 0.6, d - 1.2, floors, fh, 0.15);
      g.add(box(2, 1.6, 2, '#eef1f1', 0, bodyH));
      g.add(box(0.8, 0.22, 0.22, '#d23b3b', 0, bodyH + 1, 1.02));
      g.add(box(0.22, 0.8, 0.22, '#d23b3b', 0, bodyH + 0.7, 1.02));
      if (level >= 2) { const wingW = w * 0.34; g.add(box(wingW, 1.6, d * 0.52, '#f7f7f4', -w * 0.28, 0, 0)); windows(g, wingW, d * 0.52, 2, 0.8); }
      if (level >= 3) { g.add(box(2.2, 0.12, 2.2, '#d9e0e0', 0, bodyH + 1.65)); g.add(box(1.15, 0.035, 0.1, '#d23b3b', 0, bodyH + 1.73)); g.add(box(0.1, 0.035, 1.15, '#d23b3b', 0, bodyH + 1.73)); }
      return g;
    },
  };
  const buildingGroup = new THREE.Group();
  scene.add(buildingGroup);
  const utilityGroup = new THREE.Group(), wifiGroup = new THREE.Group(), warningGroup = new THREE.Group();
  scene.add(utilityGroup, wifiGroup, warningGroup);
  let utilityRefs = null;
  function syncUtilityObjects(state) {
    updateLineTexture(state); utilOverlay.visible = utilView;
    if (utilityRefs && utilityRefs.pipes === state.pipes && utilityRefs.powerLines === state.powerLines && utilityRefs.aps === state.aps && utilityRefs.buildings === state.buildings) return;
    for (const g of [utilityGroup, wifiGroup, warningGroup]) while (g.children.length) g.remove(g.children[0]);
    const wood = mat('#76533b'), pGeo = new THREE.CylinderGeometry(0.045, 0.065, 0.95, 5); // pole height ~ wire top
    if (state.powerLines.length) {
      const poles = new THREE.InstancedMesh(pGeo, wood, state.powerLines.length), tmpObj = new THREE.Object3D();
      state.powerLines.forEach((i, n) => { tmpObj.position.set(i % MAP.w + 0.5, 0.48, Math.floor(i / MAP.w) + 0.5); tmpObj.updateMatrix(); poles.setMatrixAt(n, tmpObj.matrix); }); utilityGroup.add(poles);
      // sagging wires between linked poles (spanning forest from the sim)
      const pts = [], top = 0.9, SEG = 8;
      for (const [i, j] of powerWires(state)) {
        const ax = i % MAP.w + 0.5, az = Math.floor(i / MAP.w) + 0.5, bx = j % MAP.w + 0.5, bz = Math.floor(j / MAP.w) + 0.5;
        const sag = 0.06 * Math.hypot(bx - ax, bz - az);
        for (const side of [-0.07, 0.07]) {
          const nx = -(bz - az), nz = bx - ax, nl = Math.hypot(nx, nz) || 1;
          for (let k = 0; k < SEG; k++) {
            const t0 = k / SEG, t1 = (k + 1) / SEG, y = t => top - sag * 4 * t * (1 - t);
            pts.push(new THREE.Vector3(ax + (bx - ax) * t0 + nx / nl * side, y(t0), az + (bz - az) * t0 + nz / nl * side),
                     new THREE.Vector3(ax + (bx - ax) * t1 + nx / nl * side, y(t1), az + (bz - az) * t1 + nz / nl * side));
          }
        }
      }
      const arms = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.03, 0.03), wood, state.powerLines.length);
      state.powerLines.forEach((i, n) => { tmpObj.position.set(i % MAP.w + 0.5, top, Math.floor(i / MAP.w) + 0.5); tmpObj.updateMatrix(); arms.setMatrixAt(n, tmpObj.matrix); }); utilityGroup.add(arms);
      if (pts.length) utilityGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#4c4534' })));
    }
    const wifi = utilities(state).wifi, active = state.aps.slice(0, wifi.max);
    if (active.length) {
      const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.07, 0.85, 5), wood, active.length), tops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), mat('#42bfff', { emissive: '#168eff', emissiveIntensity: 2 }), active.length), tmpObj = new THREE.Object3D();
      active.forEach((i, n) => { const x = i % MAP.w + 0.5, z = Math.floor(i / MAP.w) + 0.5; tmpObj.position.set(x, 0.42, z); tmpObj.updateMatrix(); stems.setMatrixAt(n, tmpObj.matrix); tmpObj.position.set(x, 0.9, z); tmpObj.updateMatrix(); tops.setMatrixAt(n, tmpObj.matrix);
        if (wifi.radius) { const r = new THREE.Mesh(new THREE.RingGeometry(wifi.radius - 0.09, wifi.radius, 48), new THREE.MeshBasicMaterial({ color: '#51b8ff', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.045, z); wifiGroup.add(r); }
      }); utilityGroup.add(stems, tops);
    }
    const u = utilities(state);
    for (const b of state.buildings) if (!TYPES[b.type].utility) { const rec = u.supplied.get(b.id) || { water: true, power: true }; if (!rec.water || !rec.power) {
      const c = document.createElement('canvas'); c.width = 128; c.height = 64; const cx = c.getContext('2d'); cx.font = '48px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(`${rec.water ? '' : '💧'}${rec.power ? '' : '⚡'}`, 64, 32);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); sprite.scale.set(1.05, 0.55, 1); sprite.position.set(b.x + b.w / 2, 3.2, b.y + b.h / 2); warningGroup.add(sprite);
    } }
    utilityRefs = { pipes: state.pipes, powerLines: state.powerLines, aps: state.aps, buildings: state.buildings };
  }
  const levelBadges = new Map();
  function badgeTexture(level) {
    if (levelBadges.has(level)) return levelBadges.get(level);
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const cx = c.getContext('2d');
    cx.translate(48, 48); cx.rotate(Math.PI / 4);
    cx.fillStyle = level === 2 ? '#d99b35' : '#70c9df'; cx.strokeStyle = '#fff2bd'; cx.lineWidth = 5;
    cx.fillRect(-27, -27, 54, 54); cx.strokeRect(-27, -27, 54, 54);
    cx.rotate(-Math.PI / 4); cx.fillStyle = '#fff8dc'; cx.font = 'bold 44px sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(String(level), 0, 1);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; levelBadges.set(level, tex); return tex;
  }
  // Floating name tags above buildings (always face the camera, drawn on top).
  const labelGroup = new THREE.Group();
  scene.add(labelGroup);
  function nameLabel(text, level) {
    const c = document.createElement('canvas'), x = c.getContext('2d'), font = '600 34px -apple-system, "Noto Sans Thai", Tahoma, sans-serif';
    x.font = font;
    const tag = level >= 2 ? ` ${'★'.repeat(level - 1)}` : '';
    const w = Math.ceil(x.measureText(text + tag).width) + 36, h = 54;
    c.width = w; c.height = h;
    x.font = font;
    x.fillStyle = 'rgba(255,250,240,0.92)'; x.strokeStyle = 'rgba(24,62,52,0.35)'; x.lineWidth = 2;
    const r = 16; x.beginPath(); x.roundRect(1, 1, w - 2, h - 2, r); x.fill(); x.stroke();
    x.fillStyle = '#183e34'; x.textBaseline = 'middle'; x.fillText(text, 18, h / 2 + 1);
    if (tag) { x.fillStyle = '#c9932e'; x.fillText(tag, 18 + x.measureText(text).width, h / 2 + 1); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    const worldH = 0.62; sp.scale.set(worldH * w / h, worldH, 1); sp.renderOrder = 20;
    return sp;
  }
  const built = new Map(); // id + level -> {obj, born}
  const cropGroup=new THREE.Group();scene.add(cropGroup);let farmRefs=new Map();
  const facilityGroup=new THREE.Group();scene.add(facilityGroup);let facilityRef=null,facilityItems=[];
  const shuttleGroup=new THREE.Group();scene.add(shuttleGroup);let shuttlePaths=[],shuttleNodes=[],shuttleRoadRef=null,shuttleCount=-1;
  let windowGlow = 0;

  // ---------- player roads ----------
  let roadsRef = null, buildingsRef = null;
  function syncRoads(state) {
    const bucket=Math.floor(state.roadCondition/10)*10,conditionChanged=bucket!==roadConditionBucket;roadConditionBucket=bucket;
    if (state.roads === roadsRef&&!conditionChanged) return;
    composeRoadTexture(state.roads,bucket);
    roadsRef = state.roads;
  }

  function sync(state) {
    syncRoads(state);
    syncUtilityObjects(state);
    if(shuttleRoadRef!==state.roads||facilityRef!==state.facilities||shuttleCount!==state.shuttles){
      shuttleRoadRef=state.roads;shuttleCount=state.shuttles;shuttleGroup.clear();shuttleNodes=[];
      const roads=new Set(state.roads);for(let i=0;i<MAP.tiles.length;i++)if(MAP.tiles[i]==='R')roads.add(i);
      const stops=(state.facilities||[]).filter(o=>o.kind==='stop').map(o=>o.i);shuttlePaths=[];
      for(let k=0;k<stops.length;k++){const start=stops[k],goal=stops[(k+1)%stops.length],prev=new Map([[start,-1]]),q=[start];for(let h=0;h<q.length&&!prev.has(goal);h++){const i=q[h],x=i%MAP.w,y=Math.floor(i/MAP.w);for(const j of [x?i-1:-1,x+1<MAP.w?i+1:-1,y?i-MAP.w:-1,y+1<MAP.h?i+MAP.w:-1])if(j>=0&&roads.has(j)&&!prev.has(j)){prev.set(j,i);q.push(j)}}if(prev.has(goal)){const path=[];for(let i=goal;i>=0;i=prev.get(i)){path.push(i);if(i===start)break}shuttlePaths.push(path.reverse())}}
      for(let n=0;n<(state.shuttles||0);n++){const g=new THREE.Group();g.add(box(.55,.22,.3,'#f1eee0'));g.add(box(.52,.08,.33,'#4da879',0,.22));g.add(box(.1,.12,.32,'#d6ede1',-.18,.29));g.add(box(.1,.12,.32,'#d6ede1',.18,.29));shuttleGroup.add(g);shuttleNodes.push(g)}
    }
    if(facilityRef!==state.facilities){facilityGroup.clear();facilityItems=[];for(const f of state.facilities||[]){const x=f.i%MAP.w,z=Math.floor(f.i/MAP.w),g=new THREE.Group();if(f.kind==='guard'){g.add(box(.75,.75,.65,'#d7d4c3'));g.add(box(.85,.12,.75,'#c44b3e',0,.75));for(let n=0;n<4;n++)g.add(box(.08,.07,.72,n%2?'#f4e8c8':'#d94e43',-.35+n*.23,.18));}else if(f.kind==='stop'){g.add(box(.9,.1,.55,'#557b70',0,1));g.add(box(.9,.08,.55,'#b6d4ce',0,1.25));g.add(box(.05,1,.05,'#626c68',-.38,0,-.2));g.add(box(.05,1,.05,'#626c68',.38,0,-.2));}else{g.add(box(.08,1.25,.08,'#626c68',0,0));g.add(box(.3,.12,.13,'#333a3e',.12,1.1));g.add(new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),mat('#e23d32',{emissive:'#e23d32',emissiveIntensity:1}))).position.set(.25,1.1,0);}const radius=f.kind==='guard'?8:f.kind==='stop'?5:6,ring=new THREE.Mesh(new THREE.RingGeometry(radius-.06,radius,48),new THREE.MeshBasicMaterial({color:f.kind==='stop'?'#36d476':'#ef5550',transparent:true,opacity:.35,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;ring.visible=utilView;g.add(ring);g.position.set(x+.5,0,z+.5);facilityGroup.add(g);facilityItems.push({kind:f.kind,group:g});}facilityRef=state.facilities;}
    for (const [id, ref] of farmRefs) {
      const b=state.buildings.find(x=>x.id===id);
      if(!b){cropGroup.remove(ref.group);farmRefs.delete(id);continue;}
      if(b.plots!==ref.plots){cropGroup.remove(ref.group);farmRefs.delete(id);}
    }
    for(const f of state.buildings.filter(b=>b.type==='farm')) if(!farmRefs.has(f.id)) {
      const group=new THREE.Group();
      (f.plots||[]).forEach((p,i)=>{
        if(!p)return;
        const x=f.x+.8+(i%2)*1.4,z=f.y+2+Math.floor(i/2)*.45;
        const crop=CROPS.find(c=>c.id===p.crop),scale=Math.max(.12,Math.min(1,(p.growth||0)/Math.max(1,crop?.grow||4)));
        const perennial=['rubber','palm','coconut'].some(k=>p.crop.includes(k));
        const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.035,.06,.45+scale*.65,5),mat('#765438'));trunk.position.set(x,.25+scale*.3,z);group.add(trunk);
        const crown=new THREE.Mesh(new THREE.SphereGeometry((perennial?.22:.16)+scale*.15,7,5),mat(p.ready?'#4d9c39':'#77b94a'));crown.position.set(x,.65+scale*.7,z);group.add(crown);
        if(p.ready){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.045,5,4),mat('#e85b3f'));fruit.position.set(x+.14, .7+scale*.7,z+.08);group.add(fruit);}
        if(p.ready){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');ctx.font='48px sans-serif';ctx.textAlign='center';ctx.fillText('🧺',32,50);const tx=new THREE.CanvasTexture(c);const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false}));spr.scale.set(.45,.45,1);spr.position.set(x,1.8,z);group.add(spr);}
      });
      cropGroup.add(group);farmRefs.set(f.id,{plots:f.plots,group});
    }

    {
      const keys = new Set(state.buildings.map(b => `${b.id}:${Math.max(1, Math.min(3, b.level || 1))}`));
      for (const [key, rec] of built) if (!keys.has(key)) { buildingGroup.remove(rec.obj); if (rec.label) { labelGroup.remove(rec.label); rec.label.material.map.dispose(); rec.label.material.dispose(); } built.delete(key); }
      for (const b of state.buildings) {
        const level = Math.max(1, Math.min(3, b.level || 1)), key = `${b.id}:${level}`;
        if (built.has(key)) continue;
        const obj = (MODELS[b.type] || ((w, d) => { const g = new THREE.Group(); g.add(box(w - 0.4, 1.2, d - 0.4, TYPES[b.type]?.color || '#cccccc')); return g; }))(b.w, b.h, level);
        const utility = utilities(state).supplied.get(b.id);
        const windowsForBuilding = [];
        obj.traverse(o => { if (o.material === windowMat) { o.material = windowMat.clone(); windowsForBuilding.push(o.material); } });
        obj.position.set(b.x + b.w / 2, 0, b.y + b.h / 2);
        obj.userData.id = b.id;
        if (level >= 2) {
          const bounds = new THREE.Box3().setFromObject(obj);
          const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture(level), transparent: true, depthTest: false, depthWrite: false }));
          badge.scale.set(0.62, 0.62, 1); badge.position.set(0, bounds.max.y + 0.42, 0); badge.renderOrder = 10; obj.add(badge);
        }
        // a little plaza under every building
        const pad = new THREE.Mesh(new THREE.BoxGeometry(b.w - 0.08, 0.06, b.h - 0.08), mat(b.matched ? '#d9cf9f' : '#cfc8b4'));
        pad.position.y = 0.03; pad.receiveShadow = true; obj.add(pad);
        obj.scale.set(1, 0.01, 1);
        buildingGroup.add(obj);
        const top = new THREE.Box3().setFromObject(obj).max.y;
        const label = nameLabel(buildingName(b), level);
        label.position.set(b.x + b.w / 2, top + (level >= 2 ? 1.05 : 0.6), b.y + b.h / 2);
        labelGroup.add(label);
        built.set(key, { obj, born: performance.now(), windows: windowsForBuilding, id: b.id, label });
      }
      buildingsRef = state.buildings;
    }
    const utilityState = utilities(state);
    for (const rec of built.values()) {
      const status = utilityState.supplied.get(rec.id), powered = !status || status.power;
      for (const wm of rec.windows) { wm.emissiveIntensity = powered ? windowGlow * 0.9 : 0; wm.color.set(powered && windowGlow ? '#4a5a63' : '#26323a'); }
    }
    // hide trees under buildings and roads
    const blocked = new Set(state.roads);
    for (const b of state.buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) blocked.add(y * MAP.w + x);
    const key = blocked.size;
    if (key !== sync.lastBlocked) { layoutTrees(blocked); sync.lastBlocked = key; }
  }

  // ---------- people ----------
  const MAXP = 400;
  const bodyGeo = new THREE.BoxGeometry(0.16,0.25,0.11); bodyGeo.translate(0,.27,0);
  const headGeo = new THREE.SphereGeometry(0.075, 7, 6); headGeo.translate(0, 0.48, 0);
  const hairGeo=new THREE.SphereGeometry(.078,7,4,0,Math.PI*2,0,Math.PI/2);hairGeo.translate(0,.51,0);
  const limbGeo=new THREE.CylinderGeometry(.027,.035,.2,5);limbGeo.translate(0,-.09,0);
  const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial({ color: '#f2f0e6' }), MAXP);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial({ color: '#d9a77f' }), MAXP);
  const hair=new THREE.InstancedMesh(hairGeo,new THREE.MeshLambertMaterial({color:'#30271f'}),MAXP);
  const arms=new THREE.InstancedMesh(limbGeo,new THREE.MeshLambertMaterial({color:'#d9a77f'}),MAXP*2);
  const legs=new THREE.InstancedMesh(limbGeo,new THREE.MeshLambertMaterial({color:'#30353c'}),MAXP*2);
  const bikes=new THREE.InstancedMesh(new THREE.BoxGeometry(.34,.12,.13),new THREE.MeshLambertMaterial({color:'#258b70'}),MAXP);
  const bikeWheels=new THREE.InstancedMesh(new THREE.TorusGeometry(.07,.025,5,8),new THREE.MeshLambertMaterial({color:'#22262a'}),MAXP*2);
  bodies.castShadow = true; bodies.count = heads.count = hair.count = arms.count = legs.count = 0;
  bodies.frustumCulled = heads.frustumCulled = hair.frustumCulled = arms.frustumCulled = legs.frustumCulled = false;
  scene.add(bodies, heads, hair, arms, legs,bikes,bikeWheels);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.24, 16), new THREE.MeshBasicMaterial({ color: '#fff27a', side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
  let shown = [];
  const color = new THREE.Color();
  function drawPeople(life, selectedId, time) {
    shown = life.agents.filter(a => a.mode !== 'inside'&&!a.shuttle&&!a.ride).slice(0, MAXP);
    shown.forEach((a, i) => {
      const p = agentPosition(life, a);
      const bob = a.mode === 'walking' ? Math.abs(Math.sin(time / 120 + a.id)) * 0.04 : 0;
      tmp.position.set(p.x, bob, p.y); tmp.rotation.set(0, 0, 0); tmp.scale.setScalar(1.9); tmp.updateMatrix();
      bodies.setMatrixAt(i, tmp.matrix); heads.setMatrixAt(i, tmp.matrix);
      hair.setMatrixAt(i,tmp.matrix);
      bodies.setColorAt(i,color.set(a.staff?'#547a63':'#f2f0e6'));
      for(let side=0;side<2;side++){
        const swing=a.mode==='walking'?Math.sin(time/100+a.id+side*Math.PI)*.45:0;
        tmp.position.set(p.x+(side?-.1:.1),.31+bob,p.y);tmp.rotation.set(swing,0,side?-.08:.08);tmp.scale.setScalar(1.9);tmp.updateMatrix();arms.setMatrixAt(i*2+side,tmp.matrix);
        tmp.position.set(p.x+(side?-.045:.045),.15+bob,p.y);tmp.rotation.set(-swing,0,0);tmp.updateMatrix();legs.setMatrixAt(i*2+side,tmp.matrix);
      }
    });
    bodies.count = heads.count = hair.count = shown.length;arms.count=legs.count=shown.length*2;
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = hair.instanceMatrix.needsUpdate=arms.instanceMatrix.needsUpdate=legs.instanceMatrix.needsUpdate=true;
    if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
    const riders=life.agents.filter(a=>a.mode!=='inside'&&!a.shuttle&&a.ride).slice(0,MAXP);
    riders.forEach((a,i)=>{const p=agentPosition(life,a);tmp.position.set(p.x,.18,p.y);tmp.rotation.set(0,Math.atan2(a.x-p.x,a.y-p.y),0);tmp.scale.setScalar(1.8);tmp.updateMatrix();bikes.setMatrixAt(i,tmp.matrix);for(let w=0;w<2;w++){tmp.position.set(p.x+(w?-.2:.2),.11,p.y);tmp.rotation.set(Math.PI/2,0,0);tmp.scale.setScalar(1.8);tmp.updateMatrix();bikeWheels.setMatrixAt(i*2+w,tmp.matrix)}});bikes.count=riders.length;bikeWheels.count=riders.length*2;bikes.instanceMatrix.needsUpdate=bikeWheels.instanceMatrix.needsUpdate=true;
    const sel = life.agents.find(a => a.id === selectedId);
    ring.visible = !!sel && sel.mode !== 'inside';
    if (ring.visible) { const p = agentPosition(life, sel); ring.position.set(p.x, 0.04, p.y); }
  }

  // ---------- hover preview ----------
  const preview = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#9ff59a', transparent: true, opacity: 0.45, depthWrite: false }));
  preview.visible = false; scene.add(preview);
  function setPreview(p) {
    if (!p) { preview.visible = false; return; }
    preview.visible = true;
    preview.scale.set(p.w, p.h3 || 0.4, p.h);
    preview.position.set(p.x + p.w / 2, (p.h3 || 0.4) / 2, p.y + p.h / 2);
    preview.material.color.set(p.color || (p.valid ? '#9ff59a' : '#f26b5b'));
  }

  // ---------- day / night ----------
  function setTime(hour) {
    const t = ((hour - 6) / 12) * Math.PI; // sunrise 6, sunset 18
    const day = Math.max(0, Math.sin(t));
    const dusk = Math.max(0, 1 - Math.abs(hour - 18.5) / 1.5) + Math.max(0, 1 - Math.abs(hour - 6) / 1.2);
    sun.intensity = 0.15 + day * 1.6;
    hemi.intensity = 0.35 + day * 0.6;
    sun.color.set('#fff2d6').lerp(new THREE.Color('#ff9a5a'), Math.min(1, dusk));
    scene.background.copy(new THREE.Color('#0f1d33').lerp(sky, Math.min(1, day * 1.4 + dusk * 0.3)));
    const az = t;
    sun.position.set(target.x + Math.cos(az) * 60, 25 + day * 60, target.z + 30);
    sun.target.position.copy(target);
    windowGlow = hour >= 18 || hour < 6.5 ? 1 : 0;
    windowMat.emissiveIntensity += (windowGlow * 0.9 - windowMat.emissiveIntensity) * 0.1;
    windowMat.color.set(windowGlow ? '#4a5a63' : '#33495a');
  }

  // ---------- picking ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function groundAt(px, py) {
    ndc.set(px / width * 2 - 1, -(py / height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, hit)) return null;
    return { fx: hit.x, fy: hit.z, x: Math.floor(hit.x), y: Math.floor(hit.z) };
  }
  function pickBuilding(px, py) {
    ndc.set(px / width * 2 - 1, -(py / height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(buildingGroup.children, true);
    for (const h of hits) { let o = h.object; while (o && o.userData.id === undefined) o = o.parent; if (o) return o.userData.id; }
    return null;
  }
  const proj = new THREE.Vector3();
  function pickAgent(life, px, py) {
    // compare in screen space against each character's chest, so clicks on the body work
    let best = null, bestD = Math.max(12, height / viewSize * 0.5);
    for (const a of shown) {
      const p = agentPosition(life, a);
      proj.set(p.x, 0.45, p.y).project(camera);
      const sx = (proj.x + 1) / 2 * width, sy = (1 - proj.y) / 2 * height;
      const d = Math.hypot(sx - px, sy - py);
      if (d < bestD) { bestD = d; best = a; }
    }
    return best;
  }

  // ---------- controls ----------
  function resize(w, h) { width = Math.max(1, w); height = Math.max(1, h); renderer.setSize(width, height, false); placeCamera(); }
  function panPixels(dx, dy) {
    const unit = viewSize / height; // world units per pixel (vertical)
    const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
    const fwd = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
    const elevScale = 1 / Math.sin(elev);
    target.addScaledVector(right, -dx * unit).addScaledVector(fwd, dy * unit * elevScale);
    target.x = Math.max(0, Math.min(MAP.w, target.x)); target.z = Math.max(0, Math.min(MAP.h, target.z));
    placeCamera();
  }
  function zoomBy(f) { viewSize = Math.max(8, Math.min(150, viewSize / f)); placeCamera(); }
  function rotate(dir) { angle += dir * Math.PI / 2; placeCamera(); }
  // Free orbit from mouse drags: dx pixels turn around the target, dy pixels tilt between ~20° and ~75°.
  function orbit(dxPx, dyPx) {
    angle -= dxPx * 0.008;
    elev = Math.max(0.35, Math.min(1.3, elev + dyPx * 0.005));
    placeCamera();
  }
  function focus(x, y, size = 40) { target.set(x, 0, y); viewSize = size; placeCamera(); }
  function fitAll() { focus(MAP.w / 2, MAP.h / 2, Math.max(MAP.h * 1.1, MAP.w * 0.7 * height / width)); }

  let showLabels = true;
  function render(time, life, selectedAgent) {
    labelGroup.visible = showLabels && viewSize < 70;
    if (labelGroup.visible) { const k = Math.max(1, viewSize / 30); for (const sp of labelGroup.children) { const a = sp.material.map.image; sp.scale.set(0.62 * k * a.width / a.height, 0.62 * k, 1); } }
    shuttleNodes.forEach((g,i)=>{const path=shuttlePaths[i%Math.max(1,shuttlePaths.length)];if(!path||!path.length){g.visible=false;return}g.visible=true;const phase=(time/1800+i*.37)%1,at=phase*(path.length-1),n=Math.floor(at),a=path[n],b=path[Math.min(path.length-1,n+1)],t=at-n,ax=a%MAP.w+.5,az=Math.floor(a/MAP.w)+.5,bx=b%MAP.w+.5,bz=Math.floor(b/MAP.w)+.5;g.position.set(ax+(bx-ax)*t,.08,az+(bz-az)*t);g.rotation.y=Math.atan2(bx-ax,bz-az)});
    for (const [, rec] of built) {
      const k = Math.min(1, (time - rec.born) / 600);
      if (rec.obj.scale.y < 1) rec.obj.scale.y = Math.max(0.01, 1 - Math.pow(1 - k, 3));
    }
    setTime(life.hour);
    drawPeople(life, selectedAgent, time);
    // keep the shadow camera around what we're looking at
    sun.shadow.camera.left = -viewSize; sun.shadow.camera.right = viewSize; sun.shadow.camera.top = viewSize; sun.shadow.camera.bottom = -viewSize;
    sun.shadow.camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }

  return {
    sync, render, resize, panPixels, zoomBy, rotate, orbit, focus, fitAll, groundAt, pickBuilding, pickAgent, setPreview,
    setGhosts(v) { ghostGroup.visible = v; hints.visible = v; },
    setLabels(v) { showLabels = v; },
    setUtilityView(v) { utilView = !!v; utilOverlay.visible = utilView; wifiGroup.visible = utilView; facilityGroup.visible=true; facilityGroup.traverse(o=>{if(o.geometry?.type==='RingGeometry')o.visible=utilView}); },
    get zoomPx() { return height / viewSize; },
  };
}
