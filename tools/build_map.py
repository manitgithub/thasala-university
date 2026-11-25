"""Convert the read-only Overpass extracts to a compact, anonymous game map."""
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CELL = 25
boundary = json.loads((ROOT / 'data/boundary.json').read_text())['elements'][0]['geometry']
features = json.loads((ROOT / 'data/campus.json').read_text())['elements']
lat0 = (min(p['lat'] for p in boundary) + max(p['lat'] for p in boundary)) / 2
lon0 = (min(p['lon'] for p in boundary) + max(p['lon'] for p in boundary)) / 2

def project(p):
    return ((p['lon'] - lon0) * 111320 * math.cos(math.radians(lat0)), -(p['lat'] - lat0) * 111320)

points = [project(p) for p in boundary]
left, top = min(p[0] for p in points), min(p[1] for p in points)
def grid(p):
    x, y = project(p)
    return ((x-left)/CELL, (y-top)/CELL)

poly = [grid(p) for p in boundary]
w = math.ceil((max(p[0] for p in points)-left)/CELL)
h = math.ceil((max(p[1] for p in points)-top)/CELL)
def inside(x, y, polygon):
    hit = False
    for a, b in zip(polygon, polygon[1:] + polygon[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:
            hit = not hit
    return hit

tiles = ['G' if inside(x+.5,y+.5,poly) else 'O' for y in range(h) for x in range(w)]
def paint(x,y,kind):
    if 0 <= x < w and 0 <= y < h and tiles[y*w+x] != 'O':
        tiles[y*w+x] = kind

def bounds(ps):
    return max(0,math.floor(min(x for x,y in ps))), max(0,math.floor(min(y for x,y in ps))), min(w,math.ceil(max(x for x,y in ps))), min(h,math.ceil(max(y for x,y in ps)))

def fill(ps,kind):
    x0,y0,x1,y1 = bounds(ps)
    for y in range(y0,y1):
        for x in range(x0,x1):
            if inside(x+.5,y+.5,ps): paint(x,y,kind)

def line(ps,kind,width):
    # 4-connected raster: step one axis at a time so diagonal roads never touch only at corners.
    for a,b in zip(ps,ps[1:]):
        x0,y0 = math.floor(a[0]),math.floor(a[1]); x1,y1 = math.floor(b[0]),math.floor(b[1])
        steep = abs(b[1]-a[1]) > abs(b[0]-a[0])
        cells=[(x0,y0)]
        x,y = x0,y0
        n = max(1,math.ceil(math.dist(a,b)*6))
        for i in range(1,n+1):
            tx,ty = math.floor(a[0]+(b[0]-a[0])*i/n), math.floor(a[1]+(b[1]-a[1])*i/n)
            while (x,y)!=(tx,ty):
                if x!=tx and (y==ty or not steep): x += 1 if tx>x else -1
                else: y += 1 if ty>y else -1
                cells.append((x,y))
        for cx,cy in cells:
            for offset in range(width):
                if steep: paint(cx+offset,cy,kind)
                else: paint(cx,cy+offset,kind)

def classify(t):
    name = t.get('name','') + t.get('name:th','')
    if t.get('amenity') == 'hospital': return 'hospital'
    if t.get('building') == 'dormitory' or any(v in name for v in ['ลักษณานิเวศ','วลัยนิวาส']): return 'dorm'
    if 'อาคารเรียนรวม' in name: return 'lecture'
    if any(v in name for v in ['อาคารวิชาการ','เครื่องมือวิทยาศาสตร์','วิจัย','กายวิภาค','คอมพิวเตอร์','สถาปัตยกรรม','ปฏิบัติการ']): return 'academic'
    if 'สหกิจ' in name: return 'coop'
    if 'บรรณสาร' in name: return 'library'
    if any(v in name for v in ['อาคารบริหาร','ส่วนบริการกลาง','ไทยบุรี']): return 'admin'
    if 'ศูนย์อาหาร' in name or t.get('amenity') in ['fast_food','marketplace']: return 'canteen'
    if t.get('leisure') in ['pitch','stadium','sports_centre','swimming_pool'] or any(v in name for v in ['โรงยิม','ศูนยกีฬา','ศูนย์กีฬา','ฟิตเนส']): return 'sports'
    return 'other'

prepared = [(e, [grid(p) for p in e.get('geometry',[])]) for e in features]
# Roads win at water crossings, preserving bridges and connected access.
for e,ps in prepared:
    t=e.get('tags',{})
    if t.get('natural') == 'water' and len(ps)>2: fill(ps,'W')
    if t.get('waterway') in ['stream','canal']: line(ps,'W',2 if t['waterway']=='canal' else 1)
def is_main(t):
    hw=t.get('highway')
    return hw=='tertiary' or (hw=='unclassified' and t.get('name','').startswith('ถนน'))
# Minor real roads become faint hints the player may follow; paths become grass.
for e,ps in prepared:
    t=e.get('tags',{}); highway=t.get('highway')
    if highway in ['unclassified','residential','road','service'] and not is_main(t): line(ps,'H',1)
for e,ps in prepared:
    t=e.get('tags',{})
    if is_main(t): line(ps,'R',2 if t['highway']=='tertiary' else 1)
ghosts=[]
for e,ps in prepared:
    t=e.get('tags',{})
    closed = len(ps)>3 and ps[0]==ps[-1]
    if closed and ('building' in t or 'leisure' in t or t.get('amenity')=='hospital'):
        x0,y0,x1,y1=bounds(ps)
        if x1>x0 and y1>y0: ghosts.append(dict(kind=classify(t),x=x0,y=y0,w=x1-x0,h=y1-y0))
# Keep only the largest connected main-road network; stray fragments become hints.
best=set(); seen=set()
for i,c in enumerate(tiles):
    if c!='R' or i in seen: continue
    comp=[i]; seen.add(i); k0=0
    while k0<len(comp):
        j=comp[k0]; k0+=1; x,y=j%w,j//w
        for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            k=ny*w+nx
            if 0<=nx<w and 0<=ny<h and tiles[k]=='R' and k not in seen: seen.add(k); comp.append(k)
    if len(comp)>len(best): best=set(comp)
stray=[i for i,c in enumerate(tiles) if c=='R' and i not in best]
for i in stray: tiles[i]='H'
print('Stray main-road cells turned into hints:',len(stray))
# Smooth road centrelines (grid coordinates) for drawing; gameplay still uses tiles.
def poly(ps): return [[round(x,2),round(y,2)] for x,y in ps]
mainRoads=[]; minorRoads=[]
for e,ps in prepared:
    t=e.get('tags',{})
    if len(ps)<2: continue
    if is_main(t):
        # only draw as a main road where the tiles really are main road (stray fragments became hints)
        on=sum(1 for x,y in ps if 0<=int(x)<w and 0<=int(y)<h and tiles[int(y)*w+int(x)]=='R')
        if on>=0.6*len(ps): mainRoads.append(dict(width=2 if t['highway']=='tertiary' else 1, pts=poly(ps)))
        else: minorRoads.append(poly(ps))
    elif t.get('highway') in ['unclassified','residential','road','service']: minorRoads.append(poly(ps))
result=dict(w=w,h=h,cellMeters=CELL,tiles=''.join(tiles),ghosts=ghosts,mainRoads=mainRoads,minorRoads=minorRoads)
(ROOT/'src/map-data.js').write_text('// Generated by tools/build_map.py; no source names are retained.\nexport const MAP = '+json.dumps(result,separators=(',',':'))+';\n')
print(f'Grid: {w} x {h}, {CELL} m/cell')
print('Tiles:',dict(Counter(tiles)))
print('Ghosts:',dict(Counter(g['kind'] for g in ghosts)))
print('Road polylines: main',len(mainRoads),'minor',len(minorRoads))
seen=set(); comps=[]
for i,c in enumerate(tiles):
    if c!='R' or i in seen: continue
    stack=[i]; seen.add(i); n=0
    while stack:
        j=stack.pop(); n+=1; x,y=j%w,j//w
        for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            k=ny*w+nx
            if 0<=nx<w and 0<=ny<h and tiles[k]=='R' and k not in seen: seen.add(k); stack.append(k)
    comps.append(n)
print('Main road components before cleanup:',len(comps),sorted(comps,reverse=True)[:8])
