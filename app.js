import { maps, outsideControlZone, tileBounds, towers, landmarks, controlZones, spawnPoints, spawnAreas, weapons, markerTypes, validMarker, parseCoordinate, validPoint, solution, heading, screenToWorld } from './core.mjs?v=map-calibration-6';

const $ = id => document.getElementById(id);
const strings = {
  zh: { saved:'收藏',distance:'距离',bearing:'罗盘方位',map:'地图',weapon:'武器',range:'射程',browse:'浏览',place:'炮击目标',expand:'展开地图',collapse:'返回计算',origin:'自己',target:'目标',inputOnly:'仅输入',inputOrMap:'输入或点选',lock:'锁定',locked:'已锁定',clear:'清空',save:'保存',name:'给坐标起个名字',about:'使用说明',coordinateHint:'游戏坐标 · 0.01 = 1 m',localNote:'仅保存在此浏览器，清除网站数据会删除收藏。',help1:'先输入自己坐标，再输入目标，或切换「炮击目标」点选地图。锁定后需先解锁才能修改或清空。',help2:'实线圈是最大射程，虚线圈内是过近区域。距离是平面距离，射程数据为社区参考值。',help3:'浏览模式：拖动、双指或滚轮缩放。键盘：方向键移动，+/− 缩放；放置模式下 Enter 放在地图中心。',help4:'展开地图可专心看图，点位与缩放会保留。收藏按地图分别保存，可载入自己或目标。',attribution:'地图及射程参考',unofficial:'非官方玩家工具。游戏地图与商标归各自权利人所有。',in:'射程内',near:'过近 · 小于最小射程',far:'超出最大射程',empty:'输入自己与目标坐标',same:'同一点 · 无方位',browseHint:'拖动浏览 · 双指 / 滚轮缩放',placeHint:'地图已固定 · 点选目标',lockedHint:'目标已锁定 · 解锁后可放置',invalid:'请输入范围内坐标（最多 2 位小数）',noSaved:'这张地图还没有收藏',loadOrigin:'设为自己',loadTarget:'设为目标',remove:'删除',undo:'撤销',deleted:'已删除收藏',savedDone:'坐标已收藏',storageError:'浏览器无法保存数据；本次操作仍可使用。',storageCorrupt:'本地数据无法读取，原数据已保留。',unlockFirst:'请先解锁这个坐标',outside:'请在地图边界内选择炮击目标',loading:'地图加载中…',mapError:'部分地图图片未能加载，请重试',retry:'重试',yourX:'自己 X',yourY:'自己 Y',targetX:'目标 X',targetY:'目标 Y',saveOrigin:'收藏自己坐标',saveTarget:'收藏目标坐标',zoomIn:'放大',zoomOut:'缩小',fit:'全图',close:'关闭',mapLabel:'地图：方向键浏览，加减号缩放；放置模式按回车选择中心点',rangeCircle:'最大射程',minCircle:'最小射程',badFields:'请检查坐标输入' },
  en: { saved:'Saved',distance:'DISTANCE',bearing:'BEARING',map:'MAP',weapon:'WEAPON',range:'RANGE',browse:'Browse',place:'Artillery target',expand:'Expand map',collapse:'Back to calculator',origin:'You',target:'Target',inputOnly:'Type only',inputOrMap:'Type or tap',lock:'Lock',locked:'Locked',clear:'Clear',save:'Save',name:'Name this position',about:'How to use',coordinateHint:'Game coordinates · 0.01 = 1 m',localNote:'Saved only in this browser. Clearing site data removes saved positions.',help1:'Enter your position, then enter a target or switch to Artillery target and tap the map. Unlock a position before editing or clearing it.',help2:'The solid circle is maximum range. The dashed circle marks the minimum range. Distance is horizontal; weapon ranges are community reference values.',help3:'Browse: drag, pinch or scroll to zoom. Keyboard: arrows to pan, +/− to zoom; Enter places the target at the map center in placement mode.',help4:'Expand the map to browse with your positions and zoom preserved. Saved positions are grouped by map and can be loaded as you or the target.',attribution:'Maps and range data',unofficial:'Unofficial fan tool. Game maps and trademarks belong to their respective owners.',in:'Within range',near:'Too close · below minimum',far:'Beyond maximum range',empty:'Enter your position and target',same:'Same position · no bearing',browseHint:'Drag to pan · pinch / scroll to zoom',placeHint:'Map fixed · tap to place target',lockedHint:'Target locked · unlock to place',invalid:'Enter coordinates within bounds (up to 2 decimals)',noSaved:'No saved positions on this map',loadOrigin:'Set as you',loadTarget:'Set as target',remove:'Delete',undo:'Undo',deleted:'Position deleted',savedDone:'Position saved',storageError:'Browser storage unavailable; this session still works.',storageCorrupt:'Saved data could not be read. Original data preserved.',unlockFirst:'Unlock this position first',outside:'Place the target within the map boundary',loading:'Loading map…',mapError:'Some map images could not load. Please retry.',retry:'Retry',yourX:'Your X',yourY:'Your Y',targetX:'Target X',targetY:'Target Y',saveOrigin:'Save your position',saveTarget:'Save target position',zoomIn:'Zoom in',zoomOut:'Zoom out',fit:'Fit map',close:'Close',mapLabel:'Map: arrow keys to pan, plus/minus to zoom; Enter places a target at the center in placement mode',rangeCircle:'Maximum range',minCircle:'Minimum range',badFields:'Check coordinate inputs' },
};
const storageKey = 'mz-wardogs-v1';
Object.assign(strings.zh,{appTitle:'炮击计算 · 地图标记',swap:'互换自己与目标坐标',swapLocked:'先解锁坐标再互换'});
Object.assign(strings.en,{appTitle:'Artillery & Map Markers',swap:'Swap your position and target',swapLocked:'Unlock positions before swapping'});
Object.assign(strings.zh,{markers:'标记',markerHint:'地图已固定 · 点空白添加，点标记删除',markerAdded:'已添加标记',markerRemoved:'已删除标记',markerOutside:'请在地图边界内放置标记'});
Object.assign(strings.en,{markers:'Markers',markerHint:'Map fixed · tap to add, tap a marker to delete',markerAdded:'Marker added',markerRemoved:'Marker deleted',markerOutside:'Place markers within the map boundary'});
Object.assign(strings.zh,{place:'目标',placeOrigin:'自己',outside:'请选择地图边界内的位置',mapLabel:'地图：方向键浏览，加减号缩放；点选或标记时按回车放在中心',placeOriginHint:'地图已固定 · 点选自己位置',inputOnly:'输入或点选',artilleryTitle:'炮击计算',markersTitle:'地图标记',markerHint:'拖动 / 缩放地图 · 点空白添加，点标记删除',help1:'炮击计算：输入自己和目标坐标，或点击地图上方「自己」「目标」后点选位置。点选时地图固定；「浏览」恢复拖动缩放。锁定后需先解锁才能修改、清空或互换坐标。',help3:'地图标记：点击「标记」自动展开地图，选择观察点、危险或集合点，点空白添加，点已有标记删除。标记时仍可拖动、双指或滚轮缩放；拖动不会添加标记。「关闭」收起标记菜单，右上角按钮返回计算。',help4:'坐标、收藏和标记按地图分别保存在当前浏览器。键盘方向键浏览，+/− 缩放；点选或标记时 Enter 放在地图中心。'});
Object.assign(strings.en,{place:'Target',placeOrigin:'You',outside:'Choose a position within the map boundary',mapLabel:'Map: arrows pan, +/− zoom; Enter places the selected point or marker at the center',placeOriginHint:'Map fixed · tap your position',inputOnly:'Type or tap',expand:'Expand',collapse:'Back',artilleryTitle:'Artillery',markersTitle:'Map Markers',markerHint:'Drag / zoom · tap to add or remove',help1:'Artillery: enter your position and target coordinates, or choose You / Target above the map and tap a position. Placement fixes the map; Browse restores pan and zoom. Unlock before editing, clearing or swapping coordinates.',help3:'Map Markers: Markers expands the map. Choose Observ, Danger or Rally; tap empty space to add, or a marker to remove. Drag, pinch and scroll still work and do not place markers. Close hides the marker menu; the top-right button returns to the calculator.',help4:'Coordinates, saved positions and markers are saved per map in this browser. Arrow keys pan; +/− zoom. Enter places a point at the center in placement or marker mode.'});
let lang = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
let mapId = 'bakurani', weaponId = 'mortar', mode = 'browse', mapOnly = false;
let perMap = {}, saved = [], savePoint = null, toastTimer, blockedStorage = false;
let markers = [], markerType = 'observe';
const t = key => strings[lang][key];
const blank = () => ({ origin: { x:'', y:'', locked:false }, target: { x:'', y:'', locked:false } });
function current() { return perMap[mapId] ||= blank(); }

try {
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !Array.isArray(data.saved)) throw new Error('Invalid stored data');
    if (['zh','en'].includes(data.lang)) lang = data.lang;
    if (Object.hasOwn(maps, data.mapId)) mapId = data.mapId;
    if (Object.hasOwn(weapons, data.weaponId)) weaponId = data.weaponId;
    for (const id of Object.keys(maps)) {
      perMap[id] = blank();
      for (const key of ['origin','target']) {
        const p = data.perMap?.[id]?.[key];
        if (p && validPoint({ x:parseCoordinate(p.x), y:parseCoordinate(p.y) }, maps[id]))
          perMap[id][key] = { x:String(p.x), y:String(p.y), locked:p.locked === true };
      }
    }
    saved = data.saved.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim() && p.name.length <= 60 && Object.hasOwn(maps,p.mapId) && validPoint(p,maps[p.mapId]));
    markers = Array.isArray(data.markers) ? data.markers.filter(validMarker) : [];
  }
} catch { blockedStorage = true; setTimeout(() => toast(t('storageCorrupt')), 0); }

function persist() {
  if (blockedStorage) return;
  try { localStorage.setItem(storageKey, JSON.stringify({ version:1,lang,mapId,weaponId,perMap,saved,markers })); }
  catch { toast(t('storageError')); }
}
function toast(text, undo) {
  clearTimeout(toastTimer);
  (document.querySelector('dialog[open]') || document.body).append($('toast'));
  $('toast').replaceChildren(document.createTextNode(text));
  if (undo) {
    const button = document.createElement('button'); button.textContent = t('undo');
    button.onclick = () => { undo(); $('toast').hidden = true; };
    $('toast').append(button);
  }
  $('toast').hidden = false;
  toastTimer = setTimeout(() => $('toast').hidden = true, undo ? 10000 : 4500);
}

function point(key) {
  const p = current()[key], result = { x:parseCoordinate(p.x), y:parseCoordinate(p.y) };
  return validPoint(result,maps[mapId]) ? result : null;
}
function writeInputs() {
  for (const key of ['origin','target']) for (const axis of ['x','y']) $(key+'-'+axis).value = current()[key][axis];
}
function setPoint(key, p) {
  if (current()[key].locked) return toast(t('unlockFirst'));
  if (!validPoint(p,maps[mapId])) return toast(t('outside'));
  current()[key] = { x:p.x.toFixed(2), y:p.y.toFixed(2), locked:false };
  writeInputs(); update(); persist();
}
function update() {
  for (const key of ['origin','target']) {
    const p = current()[key], locked = p.locked;
    let invalid = false;
    for (const axis of ['x','y']) {
      const input = $(key+'-'+axis), n = parseCoordinate(p[axis]);
      const bad = p[axis].trim() !== '' && (n === null || n < maps[mapId]['min'+axis.toUpperCase()] || n > maps[mapId]['max'+axis.toUpperCase()]);
      input.disabled = locked; input.setAttribute('aria-invalid',String(bad)); invalid ||= bad;
    }
    const error = $(key+'-error'); error.hidden = !invalid;
    error.textContent = `${t('invalid')} · X ${maps[mapId].minX}–${maps[mapId].maxX} / Y ${maps[mapId].minY}–${maps[mapId].maxY}`;
    $(key+'-lock').setAttribute('aria-pressed',String(locked));
    $(key+'-lock').querySelector('use').setAttribute('href',locked ? '#locked' : '#unlock');
    $(key+'-lock').querySelector('span').textContent = t(locked ? 'locked' : 'lock');
    $(key+'-lock').disabled = !locked && !point(key);
    $(key+'-clear').disabled = locked || !(p.x || p.y);
    $(key+'-save').disabled = !point(key);
  }
  const locked = current().origin.locked || current().target.locked;
  $('swap-coordinates').disabled = locked || !['origin','target'].some(key => current()[key].x || current()[key].y);
  $('swap-coordinates').title = t(locked ? 'swapLocked' : 'swap');
  const origin = point('origin'), target = point('target');
  const result = origin && target ? solution(origin,target,weapons[weaponId]) : null;
  $('distance').textContent = result ? String(Math.round(result.distance)) : '—';
  $('distance').closest('.metric').dataset.status = result?.status || '';
  $('range-status').textContent = result ? (result.bearing === null ? t('same') : t(result.status)) : t(document.querySelector('[aria-invalid=true]') ? 'badFields' : 'empty');
  const h = heading(result?.bearing ?? null);
  $('bearing').textContent = h.degrees; $('direction').textContent = h.direction;
  $('compass').replaceChildren();
  const center = result?.bearing ?? 0;
  for (let angle = Math.ceil((center-45)/5)*5; angle <= center+45; angle += 5) {
    const tick = document.createElement('span'); tick.style.left = `${50+(angle-center)/90*100}%`;
    const a = (angle+360)%360;
    tick.className = a%15===0 ? 'major' : 'minor';
    tick.textContent = a%15===0 ? (a%45===0 ? ['N','NE','E','SE','S','SW','W','NW'][a/45] : String(a)) : '';
    $('compass').append(tick);
  }
  $('distance-ruler').replaceChildren();
  $('distance-ruler').hidden = !result;
  if(result) for(let value=Math.max(0,Math.round(result.distance/100)*100-200);value<=result.distance+200;value+=100) {
    const tick=document.createElement('span');
    tick.className=value%200===0?'major':'minor';
    tick.style.top=`${50+(result.distance-value)*.17}%`;
    tick.textContent=value%200===0?String(value):'';
    $('distance-ruler').append(tick);
  }
  $('weapon-range').textContent = `${weapons[weaponId].min}–${weapons[weaponId].max} m`;
  $('saved-count').textContent = saved.filter(p => p.mapId === mapId).length;
  updateMode(); draw();
}
function updateMode() {
  $('browse').setAttribute('aria-pressed',String(mode === 'browse'));
  $('place').setAttribute('aria-pressed',String(mode === 'place'));
  $('place').disabled = current().target.locked;
  $('place-origin').setAttribute('aria-pressed',String(mode === 'origin'));
  $('place-origin').disabled = current().origin.locked;
  $('marker-mode').querySelector('span').textContent = t(mode === 'marker' ? 'close' : 'markers');
  $('marker-mode').setAttribute('aria-pressed',String(mode === 'marker'));
  $('marker-picker').hidden = mode !== 'marker';
  $('map-panel').classList.toggle('marking',mode === 'marker');
  $('map-panel').classList.toggle('placing',mode === 'place' || mode === 'origin');
  $('map-hint').textContent = t(mode === 'marker' ? 'markerHint' : mode === 'browse' ? 'browseHint' : mode === 'origin' ? 'placeOriginHint' : current().target.locked ? 'lockedHint' : 'placeHint');
  for (const id of ['zoom-in','zoom-out','fit']) $(id).disabled = mode === 'place' || mode === 'origin';
  for (const button of $('marker-picker').children) button.setAttribute('aria-pressed',String(button.dataset.type === markerType));
}
function translate() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = `${t('appTitle')} | WARDOGS`;
  document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  $('language').textContent = lang === 'zh' ? 'EN' : '中文';
  $('language').lang = lang === 'zh' ? 'en' : 'zh-CN';
  $('language').setAttribute('aria-label',lang === 'zh' ? 'Switch to English' : '切换到中文');
  for (const [id,key] of Object.entries({'swap-coordinates':'swap','origin-x':'yourX','origin-y':'yourY','target-x':'targetX','target-y':'targetY','origin-save':'saveOrigin','target-save':'saveTarget','zoom-in':'zoomIn','zoom-out':'zoomOut','fit':'fit','map-canvas':'mapLabel','map':'map','weapon':'weapon','info-open':'about'})) $(id).setAttribute('aria-label',t(key));
  document.querySelectorAll('.close-dialog').forEach(el => el.setAttribute('aria-label',t('close')));
  $('expand').querySelector('span').textContent = t(mapOnly ? 'collapse' : 'expand');
  $('expand').setAttribute('aria-label',t(mapOnly ? 'collapse' : 'expand'));
  $('weapon').replaceChildren(...Object.entries(weapons).map(([id,w]) => new Option(w[lang],id)));
  $('weapon').value = weaponId; $('map').value = mapId;
  $('marker-picker').replaceChildren();
  for(const [type,config] of Object.entries(markerTypes)) {
    const button=document.createElement('button');button.dataset.type=type;
    const icon=svg('svg',{viewBox:'-12 -12 24 24',class:'icon','aria-hidden':'true'});
    icon.append(svg('path',{d:config.path}));button.append(icon,document.createTextNode(config[lang]));
    button.onclick=()=>{markerType=type;updateMode();};$('marker-picker').append(button);
  }
  update(); if ($('saved-dialog').open) renderSaved();
}

// ponytail: native SVG + Pointer Events, no mapping framework or build step.
const svgNS = 'http://www.w3.org/2000/svg';
const canvas = $('map-canvas');
const camera = { x:0,y:0,scale:1,width:1,height:1,fit:1 };
const pointers = new Map();
let gesture = null, frame = 0, baseReady = false, baseFailed = false;
let tileLevel = -1;
const tileNodes = new Map();
function svg(tag, attrs, text) {
  const el = document.createElementNS(svgNS,tag);
  for (const [key,value] of Object.entries(attrs)) el.setAttribute(key,value);
  if (text !== undefined) el.textContent = text;
  return el;
}
function boundsRect(el, b) {
  for (const [key,value] of Object.entries({x:b.minX,y:-b.maxY,width:b.maxX-b.minX,height:b.maxY-b.minY})) el.setAttribute(key,value);
}
function fit() {
  const b = maps[mapId];
  camera.width = canvas.clientWidth; camera.height = canvas.clientHeight;
  camera.fit = Math.min((camera.width-28)/(b.maxX-b.minX),(camera.height-28)/(b.maxY-b.minY));
  camera.scale = camera.fit; camera.x = (b.minX+b.maxX)/2; camera.y = (b.minY+b.maxY)/2;
  draw();
}
function clampCamera() {
  const b = maps[mapId];
  camera.x = Math.min(b.maxX,Math.max(b.minX,camera.x)); camera.y = Math.min(b.maxY,Math.max(b.minY,camera.y));
}
function zoom(factor,x=camera.width/2,y=camera.height/2) {
  if (mode === 'place' || mode === 'origin') return;
  const before = screenToWorld(x,y,camera);
  camera.scale = Math.max(camera.fit,Math.min(camera.fit*64,camera.scale*factor));
  const after = screenToWorld(x,y,camera);
  camera.x += before.x-after.x; camera.y += before.y-after.y;
  clampCamera(); draw();
}
const tileURL = (z,x,y) => `./assets/maps/${mapId}/zoom_${z}/${x}_${y}.webp`;
function mapNotice() {
  const notice = $('map-notice');
  const tileFailed = [...tileNodes.values()].some(tile => tile.dataset.failed === 'true');
  notice.hidden = baseReady && !tileFailed;
  if (notice.hidden) return;
  notice.replaceChildren(document.createTextNode(t(baseFailed || tileFailed ? 'mapError' : 'loading')));
  if (baseFailed || tileFailed) {
    const retry = document.createElement('button'); retry.textContent = t('retry'); retry.onclick = loadMap; notice.append(retry);
  }
}
function loadMap() {
  baseReady = baseFailed = false; tileLevel = -1;
  $('tiles').replaceChildren(); tileNodes.clear();
  boundsRect($('base-map'),tileBounds); boundsRect($('clip-bounds'),maps[mapId]); boundsRect($('map-bounds'),maps[mapId]);
  const image = svg('image',{id:'base-map',preserveAspectRatio:'none'});
  boundsRect(image,tileBounds);
  image.onload = () => { if (image !== $('base-map')) return; baseReady = true; mapNotice(); };
  image.onerror = () => { if (image !== $('base-map')) return; baseFailed = true; mapNotice(); };
  $('base-map').replaceWith(image); image.setAttribute('href',tileURL(0,0,0));
  mapNotice(); draw();
}
function draw() {
  if (!frame) frame = requestAnimationFrame(renderMap);
}
function renderMap() {
  frame = 0;
  const {x,y,scale:s,width:w,height:h} = camera;
  if (!w || !h || !s) return;
  const left=x-w/(2*s),top=-y-h/(2*s),right=left+w/s,bottom=top+h/s;
  canvas.setAttribute('viewBox',`${left} ${top} ${w/s} ${h/s}`);
  const b=maps[mapId],tb=tileBounds,size=tb.maxX-tb.minX;
  const level=Math.max(1,Math.min(7,Math.ceil(Math.log2(size*s*Math.min(devicePixelRatio||1,2)/256))));
  if (level !== tileLevel) { tileNodes.clear(); $('tiles').replaceChildren(); tileLevel=level; }
  const count=2**level,unit=size/count,wanted=new Set();
  const x0=Math.max(0,Math.floor((Math.max(left,b.minX)-tb.minX)/unit)),x1=Math.min(count-1,Math.floor((Math.min(right,b.maxX)-tb.minX)/unit));
  const y0=Math.max(0,Math.floor((Math.max(top,-b.maxY)+tb.maxY)/unit)),y1=Math.min(count-1,Math.floor((Math.min(bottom,-b.minY)+tb.maxY)/unit));
  for(let ty=y0;ty<=y1;ty++) for(let tx=x0;tx<=x1;tx++) {
    const key=`${tx}_${ty}`; wanted.add(key);
    if(!tileNodes.has(key)) {
      const tile=svg('image',{x:tb.minX+tx*unit,y:-tb.maxY+ty*unit,width:unit+.001,height:unit+.001,preserveAspectRatio:'none'});
      tile.onerror=()=>{if(tile.isConnected){tile.dataset.failed='true';mapNotice();}};
      tile.onload=()=>{if(tile.isConnected){delete tile.dataset.failed;mapNotice();}};
      tile.setAttribute('href',tileURL(level,tx,ty)); tileNodes.set(key,tile); $('tiles').append(tile);
    }
  }
  // Browser HTTP cache handles revisits; only visible tiles remain in the DOM.
  for(const [key,node] of tileNodes) if(!wanted.has(key)){node.remove();tileNodes.delete(key);}
  mapNotice();
  const grid=$('grid'); grid.replaceChildren();
  const step=[.1,.5,1,5,10,20,50].find(n=>n*s>=40)||50;
  const line={stroke:'#dbe3ce','stroke-opacity':'.20','vector-effect':'non-scaling-stroke','stroke-width':.7};
  const textStyle={fill:'#eef2df','font-size':10/s,'font-family':'Arial','paint-order':'stroke',stroke:'#1a2518','stroke-width':2/s,'stroke-linejoin':'round'};
  for(let gx=Math.ceil(Math.max(left,b.minX)/step)*step;gx<=Math.min(right,b.maxX);gx+=step){
    grid.append(svg('line',{x1:gx,y1:-b.maxY,x2:gx,y2:-b.minY,...line}));
    grid.append(svg('text',{x:gx+3/s,y:Math.min(bottom-30/s,-b.minY-4/s),...textStyle},String(Number(gx.toFixed(1)))));
  }
  for(let gy=Math.ceil(Math.max(-bottom,b.minY)/step)*step;gy<=Math.min(-top,b.maxY);gy+=step){
    grid.append(svg('line',{x1:b.minX,y1:-gy,x2:b.maxX,y2:-gy,...line}));
    grid.append(svg('text',{x:Math.max(left+4/s,b.minX+4/s),y:-gy-3/s,...textStyle},String(Number(gy.toFixed(1)))));
  }
  const overlays=$('overlays');overlays.replaceChildren();
  for(const area of spawnAreas[mapId]) {
    const label=`${area.name} ${lang==='zh'?'出生区':'Spawn'}`;
    const g=svg('g',{'data-spawn':area.name,role:'img','aria-label':label,'pointer-events':'none'});
    g.append(svg('polygon',{points:area.points.map(([px,py])=>`${px},${-py}`).join(' '),fill:area.color,'fill-opacity':.12,stroke:area.color,'stroke-width':1.5,'stroke-dasharray':'5 4','vector-effect':'non-scaling-stroke'}));
    const cx=area.points.reduce((sum,p)=>sum+p[0],0)/area.points.length;
    const cy=area.points.reduce((sum,p)=>sum+p[1],0)/area.points.length;
    const anchor=(b.maxX-cx)*s<70?'end':(cx-b.minX)*s<70?'start':'middle';
    const name=svg('text',{x:cx,y:-cy-10/s,fill:area.color,'font-size':10/s,'font-weight':600,'text-anchor':anchor,'paint-order':'stroke',stroke:'#121713','stroke-width':3/s,'stroke-linejoin':'round'});
    name.append(svg('tspan',{x:cx},area.name));
    g.append(name);overlays.append(g);
  }
  for(const zone of controlZones[mapId]||[]) {
    overlays.append(svg('circle',{'data-control-zone':zone.id,cx:zone.x,cy:-zone.y,r:zone.r,fill:'none',stroke:'#fff','stroke-opacity':.45,'stroke-width':1.5,'stroke-dasharray':'6 5','vector-effect':'non-scaling-stroke','pointer-events':'none'}));
  }
  for(const spawn of spawnPoints[mapId]||[]) {
    const color=spawnAreas[mapId].find(area=>area.name===spawn.faction).color;
    const g=svg('g',{'data-spawn-point':spawn.id,transform:`translate(${spawn.x} ${-spawn.y}) scale(${1/s})`,fill:color,stroke:'none',role:'img','aria-label':`Spawn · X ${spawn.x.toFixed(2)} · Y ${spawn.y.toFixed(2)}`,'pointer-events':'none'});
    g.append(s>=12 ? svg('path',{d:'M0-6 1.8-1.9 6-1.9 2.9 1.1 3.9 5.3 0 2.9-3.9 5.3-2.9 1.1-6-1.9-1.8-1.9Z'}) : svg('rect',{x:-3,y:-3,width:6,height:6}));
    overlays.append(g);
  }
  const origin=point('origin'),target=point('target'),weapon=weapons[weaponId];
  if(origin){
    const ring = [weapon.max,weapon.min].map(m => {
      const r=m/100;
      return `M${-r} 0a${r} ${r} 0 1 0 ${2*r} 0a${r} ${r} 0 1 0 ${-2*r} 0Z`;
    }).join(' ');
    overlays.append(svg('path',{id:'range-fill',d:ring,transform:`translate(${origin.x} ${-origin.y})`,fill:'#b5e49a','fill-opacity':'.07','fill-rule':'evenodd','pointer-events':'none'}));
    overlays.append(svg('circle',{cx:origin.x,cy:-origin.y,r:weapon.max/100,fill:'none',stroke:'#bed99c','stroke-opacity':'.85','stroke-width':1.5,'vector-effect':'non-scaling-stroke','aria-label':`${t('rangeCircle')} ${weapon.max} m`}));
    overlays.append(svg('circle',{cx:origin.x,cy:-origin.y,r:weapon.min/100,fill:'none',stroke:'#f0bb9a','stroke-dasharray':'5 5','stroke-width':1,'vector-effect':'non-scaling-stroke','aria-label':`${t('minCircle')} ${weapon.min} m`}));
  }
  if(origin&&target) overlays.append(svg('line',{x1:origin.x,y1:-origin.y,x2:target.x,y2:-target.y,stroke:'#f0e8ce','stroke-width':1.5,'stroke-dasharray':'6 5','vector-effect':'non-scaling-stroke'}));
  for(const [number,tx,ty] of towers[mapId]) {
    const label=lang==='zh'?`${number}号塔`:`Tower ${number}`;
    const outside=outsideControlZone(mapId,tx,ty),color=outside?'#89918a':'#e8d79b';
    const g=svg('g',{'data-tower':number,'data-outside-zone':outside,transform:`translate(${tx} ${-ty}) scale(${1/s})`,role:'img','aria-label':`${label} · X ${tx.toFixed(2)} · Y ${ty.toFixed(2)}`,'pointer-events':'none'});
    g.append(svg('title',{},label));
    g.append(svg('rect',{x:-3,y:-3,width:6,height:6,fill:color,stroke:'#171e17','stroke-width':1.5}));
    // ponytail: show labels only when zoomed in; no label-collision engine.
    if(s>=12) {
      g.append(svg('path',{d:'M-5 5 0-8 5 5M-4 2h8M-3-2h6',fill:'none',stroke:color,'stroke-width':1.5}));
      g.append(svg('text',{x:0,y:20,'text-anchor':'middle',fill:outside?color:'#f6e6b4','font-size':11,'font-weight':600,'paint-order':'stroke',stroke:'#121713','stroke-width':3,'stroke-linejoin':'round'},label));
    }
    overlays.append(g);
  }
  for(const landmark of landmarks.filter(p=>p.mapId===mapId)) {
    const label=landmark[lang];
    const g=svg('g',{'data-landmark':landmark.id,transform:`translate(${landmark.x} ${-landmark.y}) scale(${1/s})`,role:'img','aria-label':`${label} · X ${landmark.x.toFixed(2)} · Y ${landmark.y.toFixed(2)}`,'pointer-events':'none'});
    g.append(svg('title',{},label),s>=12 ? svg('path',{d:landmark.id==='factory'?'M-7 6V-2L-2-5V-2L3-5V0H7V6ZM4 0V-9H7V0M-4 2V4M0 2V4M4 2V4':'M-5 6V-2L0-6 5-2V6ZM0-6V-11M-3-9H3M-1 6V2H1V6',fill:'#171e17',stroke:'#e8d79b','stroke-width':1.5}) : svg('rect',{x:-3,y:-3,width:6,height:6,fill:'#e8d79b'}));
    if(s>=12) g.append(svg('text',{x:9,y:4,fill:'#f6e6b4','font-size':11,'font-weight':600,'paint-order':'stroke',stroke:'#121713','stroke-width':3,'stroke-linejoin':'round'},label));
    overlays.append(g);
  }
  for(const [key,p,color] of [['origin',origin,'#9bd6c2'],['target',target,'#ffa18b']]) if(p){
    const g=svg('g',{'data-marker':key,transform:`translate(${p.x} ${-p.y}) scale(${1/s})`});
    g.append(svg('circle',{r:11,fill:'#121713','fill-opacity':'.9'}));
    if(key==='origin') g.append(svg('circle',{r:6,fill:color,stroke:'#e3fff4','stroke-width':1.5}));
    else g.append(svg('path',{d:'M0 -8 8 0 0 8 -8 0Z',fill:color,stroke:'#ffe1d8','stroke-width':1.5}));
    g.append(svg('text',{x:15,y:4,fill:color,'font-size':12,'font-weight':600,'paint-order':'stroke',stroke:'#121713','stroke-width':3,'stroke-linejoin':'round'},t(key)+(current()[key].locked?' •':'')));
    overlays.append(g);
  }
  for(const marker of markers.filter(p=>p.mapId===mapId)) {
    const config=markerTypes[marker.type];
    const g=svg('g',{'data-user-marker':marker.id,'data-marker-type':marker.type,transform:`translate(${marker.x} ${-marker.y}) scale(${1/s})`,role:'img','aria-label':`${config[lang]} · X ${marker.x.toFixed(2)} · Y ${marker.y.toFixed(2)}`});
    g.append(svg('title',{},config[lang]),svg('circle',{r:12,fill:'#121713',stroke:config.color,'stroke-width':1}),svg('path',{d:config.path,fill:'none',stroke:config.color,'stroke-width':1.6,'stroke-linecap':'round','stroke-linejoin':'round'}));
    overlays.append(g);
  }
  if(mode!=='browse') overlays.append(svg('path',{d:`M${x-7/s} ${-y}h${14/s}M${x} ${-y-7/s}v${14/s}`,stroke:'#fff9','stroke-width':1,'vector-effect':'non-scaling-stroke'}));
  const scaleMeters=[1,5,10,25,50,100,250,500,1000,2000,5000].filter(n=>n/100*s<=90).pop()||1;
  $('scale-bar').style.width=`${scaleMeters/100*s}px`; $('scale-bar').textContent=`${scaleMeters} m`;
  mapNotice();
}
function localPointer(event) { const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top}; }
function placeAt(world) {
  const p={x:Math.round(world.x*100)/100,y:Math.round(world.y*100)/100};
  if(mode==='place'||mode==='origin')return setPoint(mode==='origin'?'origin':'target',p);
  if(mode!=='marker')return;
  if(!validPoint(p,maps[mapId]))return toast(t('markerOutside'));
  // ponytail: nearest marker within a 44px touch target; no separate erase tool.
  const hit=markers.filter(m=>m.mapId===mapId).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)).find(m=>Math.hypot(m.x-p.x,m.y-p.y)*camera.scale<=22);
  if(hit){
    markers=markers.filter(m=>m.id!==hit.id);persist();draw();
    toast(t('markerRemoved'),()=>{markers.push(hit);persist();draw();});
  }else{
    const id=Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('-');
    markers.push({id,mapId,type:markerType,...p});persist();draw();
    toast(t('markerAdded'),()=>{markers=markers.filter(m=>m.id!==id);persist();draw();});
  }
}
function beginGesture() {
  const values=[...pointers.values()],a=values[0],b=values[1];
  gesture=a?{ x:b?(a.x+b.x)/2:a.x,y:b?(a.y+b.y)/2:a.y,distance:b?Math.hypot(a.x-b.x,a.y-b.y):0,camera:{...camera},multi:values.length>1,moved:false }:null;
}
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId,localPointer(event));beginGesture();
});
canvas.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId)||!gesture)return;
  const p=localPointer(event);pointers.set(event.pointerId,p);
  const values=[...pointers.values()],a=values[0],b=values[1];
  const x=b?(a.x+b.x)/2:a.x,y=b?(a.y+b.y)/2:a.y;
  if(Math.hypot(x-gesture.x,y-gesture.y)>7)gesture.moved=true;
  if(mode==='place'||mode==='origin')return;
  const anchor=screenToWorld(gesture.x,gesture.y,gesture.camera);
  camera.scale=gesture.distance&&b?Math.max(camera.fit,Math.min(camera.fit*64,gesture.camera.scale*Math.hypot(a.x-b.x,a.y-b.y)/gesture.distance)):gesture.camera.scale;
  camera.x=anchor.x-(x-camera.width/2)/camera.scale;camera.y=anchor.y+(y-camera.height/2)/camera.scale;
  clampCamera();draw();
});
function finishPointer(event,cancel=false){
  if(!pointers.has(event.pointerId))return;
  const p=localPointer(event),g=gesture;
  const place=!cancel&&mode!=='browse'&&g&&!g.multi&&!g.moved&&pointers.size===1&&Math.hypot(p.x-g.x,p.y-g.y)<=7;
  pointers.delete(event.pointerId);
  if(place)placeAt(screenToWorld(p.x,p.y,camera));
  const wasMulti=g?.multi;beginGesture();if(gesture&&wasMulti)gesture.multi=true;
}
canvas.addEventListener('pointerup',event=>finishPointer(event));
canvas.addEventListener('pointercancel',event=>finishPointer(event,true));
canvas.addEventListener('lostpointercapture',event=>finishPointer(event,true));
canvas.addEventListener('wheel',event=>{event.preventDefault();const p=localPointer(event);zoom(Math.exp(-event.deltaY*.002),p.x,p.y);},{passive:false});
canvas.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','+','=','-','Enter'].includes(event.key))return;
  event.preventDefault();
  if(event.key==='Enter'){if(mode!=='browse')placeAt({x:camera.x,y:camera.y});return;}
  if(mode==='place'||mode==='origin')return;
  if(['+','='].includes(event.key))return zoom(1.5);
  if(event.key==='-')return zoom(1/1.5);
  camera.x+=({'ArrowLeft':-60,'ArrowRight':60}[event.key]||0)/camera.scale;
  camera.y+=({'ArrowUp':60,'ArrowDown':-60}[event.key]||0)/camera.scale;
  clampCamera();draw();
});
new ResizeObserver(()=>{
  const width=canvas.clientWidth,height=canvas.clientHeight,b=maps[mapId];
  if(!width||!height)return;
  if(camera.width===1)return fit();
  camera.width=width;camera.height=height;
  camera.fit=Math.min((width-28)/(b.maxX-b.minX),(height-28)/(b.maxY-b.minY));
  // Preserve center and scale when expanding the map or opening the phone keyboard.
  draw();
}).observe(canvas);

function renderSaved() {
  $('saved-map').textContent=maps[mapId].name;
  const list=$('saved-list');list.replaceChildren();
  const positions=saved.filter(p=>p.mapId===mapId);
  if(!positions.length){const p=document.createElement('p');p.className='empty-saved';p.textContent=t('noSaved');list.append(p);}
  for(const p of positions){
    const row=document.createElement('article');row.className='saved-item';
    const name=document.createElement('strong');name.textContent=p.name;
    const coords=document.createElement('p');coords.className='saved-coordinates';coords.textContent=`X ${p.x.toFixed(2)}   ·   Y ${p.y.toFixed(2)}`;
    const actions=document.createElement('div');actions.className='saved-actions';
    for(const key of ['origin','target']){
      const button=document.createElement('button');button.textContent=t(key==='origin'?'loadOrigin':'loadTarget');button.disabled=current()[key].locked;
      button.onclick=()=>{setPoint(key,p);$('saved-dialog').close();};actions.append(button);
    }
    const remove=document.createElement('button');remove.textContent=t('remove');
    remove.onclick=()=>{saved=saved.filter(item=>item.id!==p.id);persist();renderSaved();update();toast(t('deleted'),()=>{saved.push(p);persist();renderSaved();update();});};
    actions.append(remove);row.append(name,coords,actions);list.append(row);
  }
}
function openSaved(key=null){
  savePoint=key?point(key):null;$('save-form').hidden=!savePoint;$('saved-name').value='';renderSaved();$('saved-dialog').showModal();
  if(savePoint)$('saved-name').focus();
}
for(const key of ['origin','target']){
  for(const axis of ['x','y'])$(key+'-'+axis).addEventListener('input',event=>{
    if(current()[key].locked)return;
    current()[key][axis]=event.target.value;update();persist();
  });
  $(key+'-lock').onclick=()=>{current()[key].locked=!current()[key].locked;if(current()[key].locked && mode===(key==='target'?'place':'origin'))mode='browse';update();persist();};
  $(key+'-clear').onclick=()=>{if(current()[key].locked)return;current()[key]={x:'',y:'',locked:false};writeInputs();update();persist();};
  $(key+'-save').onclick=()=>openSaved(key);
}
$('swap-coordinates').onclick=()=>{
  const points=current();
  if(points.origin.locked || points.target.locked)return;
  [points.origin,points.target]=[points.target,points.origin];
  writeInputs();update();persist();
};
$('browse').onclick=()=>{mode='browse';pointers.clear();gesture=null;updateMode();draw();};
$('place').onclick=()=>{if(current().target.locked)return;mode='place';pointers.clear();gesture=null;updateMode();draw();};
$('place-origin').onclick=()=>{if(current().origin.locked)return;mode='origin';pointers.clear();gesture=null;updateMode();draw();};
$('marker-mode').onclick=()=>{
  mode=mode==='marker'?'browse':'marker';pointers.clear();gesture=null;
  if(mode==='marker'){mapOnly=true;document.body.classList.add('map-only');$('expand').setAttribute('aria-pressed','true');}
  translate();
};
$('zoom-in').onclick=()=>zoom(1.5);$('zoom-out').onclick=()=>zoom(1/1.5);$('fit').onclick=fit;
$('expand').onclick=()=>{
  mapOnly=!mapOnly;mode='browse';document.body.classList.toggle('map-only',mapOnly);$('expand').setAttribute('aria-pressed',String(mapOnly));translate();
};
$('map').onchange=event=>{mapId=event.target.value;mode='browse';pointers.clear();gesture=null;writeInputs();fit();loadMap();update();persist();};
$('weapon').onchange=event=>{weaponId=event.target.value;update();persist();};
$('language').onclick=()=>{lang=lang==='zh'?'en':'zh';translate();persist();};
$('saved-open').onclick=()=>openSaved();$('info-open').onclick=()=>$('info-dialog').showModal();
document.querySelectorAll('.close-dialog').forEach(button=>button.onclick=()=>button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>document.body.append($('toast'))));
$('save-form').onsubmit=event=>{
  event.preventDefault();const name=$('saved-name').value.trim();
  if(!name||!savePoint)return;
  saved.push({id:Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16)).join('-'),mapId,name,...savePoint});persist();$('save-form').hidden=true;savePoint=null;renderSaved();update();toast(t('savedDone'));
};
writeInputs();translate();fit();loadMap();
