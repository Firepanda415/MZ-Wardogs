// Calibration and weapon ranges: apollyon-sys/wardogs-calculator, 2026-09-14.
export const maps = {
  bakurani: { name: 'Bakurani', minX: 23.35, maxX: 133.60, minY: 19.34, maxY: 129.65 },
  ozeti: { name: 'Ozeti', minX: 57.58, maxX: 143.07, minY: 21.81, maxY: 99.56 },
  zestafona: { name: 'Zestafona', minX: 19.90, maxX: 124.89, minY: 50.70, maxY: 141.90 },
};
export const tileBounds = { minX: -0.03, maxX: 163.81, minY: -0.01, maxY: 163.83 };
// Screenshot measurements, 2026-09-14: tower number, game X, game Y. See README.
export const towers = {
  bakurani: [[1,80.52,69.89],[2,77.20,70.02],[3,77.20,73.45],[4,83.60,72.81],[5,82.22,68.40]],
  ozeti: [[1,95.81,62.87],[2,100.34,59.25],[3,104.51,63.71],[4,100.64,67.66]],
  zestafona: [[1,68.58,104.15],[2,72.89,105.04],[3,70.15,100.18]],
};
// Landmark centers measured from user gameplay screenshots; display names chosen locally.
export const landmarks = [
  {id:'sunflower-church',mapId:'bakurani',x:84.53,y:71.43,zh:'向日葵教堂',en:'Sunflower Church'},
  // Center of four user-supplied in-game reference points, 2026-09-14.
  {id:'factory',mapId:'bakurani',x:78.72,y:71.74,zh:'货柜工厂',en:'Container&Factory'},
  {id:'hilltop-church',mapId:'ozeti',x:101.36,y:63.21,zh:'山顶教堂',en:'Hilltop Church'},
];
// Observed match circles measured from screenshots; not a guarantee for every match.
export const controlZones = {bakurani: [
  {id:'lumberyard',x:82.37,y:71.90,r:5.00},
], ozeti: [
  // In-game boundary fit, 2026-09-14; approximately 551 m radius.
  {id:'game-observed',x:97.64,y:62.42,r:5.51},
], zestafona: [
  // Zestafona terrain, in-game screenshots, 2026-09-14: estimated center and 500 m radius.
  {id:'game-observed',x:69.92,y:100.35,r:5},
]};
// Ozeti: own screenshot measurements. Other maps retain prior spawn data (see README).
export const spawnPoints = {ozeti: [
  {id:'manticore',faction:'MANTICORE',x:68.26,y:88.07},
  {id:'lonestar',faction:'LONESTAR',x:83.72,y:30.70},
  {id:'valkyra',faction:'VALKYRA',x:138.18,y:67.27},
], bakurani: [
  {id:'alpha',faction:'LONESTAR',x:87.327340,y:32.532218},
  {id:'bravo',faction:'VALKYRA',x:118.691958,y:70.896478},
  {id:'charlie-1',faction:'MANTICORE',x:39.471603,y:77.674957},
]};
export const spawnAreas = {
  bakurani: [{"name":"VALKYRA","color":"#d86666","points":[[117.5,73.76],[121.22,70.71],[118.18,66.99],[114.45,70.04]]},{"name":"MANTICORE","color":"#82c596","points":[[38.68,79.88],[43.39,78.85],[42.35,74.15],[37.65,75.18]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[83.08,35.27],[87.72,36.51],[88.97,31.86],[84.32,30.62]]}],
  ozeti: [{"name":"VALKYRA","color":"#d86666","points":[[133.93,68.56],[138.53,69.96],[139.94,65.37],[135.35,63.97]]},{"name":"MANTICORE","color":"#82c596","points":[[69.06,90.89],[72.96,88.09],[70.13,84.25],[66.26,86.98]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[81.48,34.06],[86.29,34.06],[86.27,29.25],[81.46,29.25]]}],
  zestafona: [{"name":"MANTICORE","color":"#82c596","points":[[103.3011,111.7061],[101.9084,116.31],[106.5123,117.6862],[107.8886,113.0987]]},{"name":"VALKYRA","color":"#d86666","points":[[40.2718,121.8805],[35.7007,123.3551],[37.175296,127.9262],[41.7464,126.4517]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[65.1264,64.8151],[66.306,69.4681],[70.9591,68.2721],[69.7794,63.619]]}],
};
export const weapons = {
  mortar: { en: 'L81 Mortar', zh: 'L81 迫击炮', min: 80, max: 684 },
  sph2: { en: 'SPH-2', zh: 'SPH-2 自行炮', min: 780, max: 2629 },
};
// Game sight labels transcribed from the seven 20260915 screenshots; see README.
export const mortarScale = [[80,950],[110,900],[132,850],[187,800],[240,750],[290,700],[340,650],[385,600],[430,550],[470,500],[510,450],[545,400],[578,350],[609,300],[637,250],[661,200],[684,150]];
export function mortarMil(distance) {
  if (!Number.isFinite(distance) || distance<80-1e-7 || distance>684+1e-7) return null;
  distance=Math.max(80,Math.min(684,distance));
  const found=mortarScale.findIndex(([range])=>range>=distance);
  const i=Math.max(1,found<0 ? mortarScale.length-1 : found);
  const [a,ma]=mortarScale[i-1], [b,mb]=mortarScale[i];
  return ma+(mb-ma)*(distance-a)/(b-a);
}
export function mortarRange(mil) {
  if (!Number.isFinite(mil) || mil<150 || mil>950) return null;
  const found=mortarScale.findIndex(([,value])=>value<=mil);
  const i=Math.max(1,found<0 ? mortarScale.length-1 : found);
  const [a,ma]=mortarScale[i-1], [b,mb]=mortarScale[i];
  return a+(b-a)*(mil-ma)/(mb-ma);
}
export const markerTypes = {
  observe: { zh:'观察点', en:'Observ', color:'#b8daf0', path:'M-8 0Q0-10 8 0Q0 10-8 0ZM-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0' },
  danger: { zh:'危险', en:'Danger', color:'#ffb18d', path:'M0-8 8 6H-8ZM0-3v4M0 3v1' },
  rally: { zh:'集合点', en:'Rally', color:'#d2dca4', path:'M-5 8V-8M-5-7H7L3-2 7 3H-5' },
};
export function validMarker(marker) {
  return !!(marker && typeof marker.id === 'string' && marker.id.length > 0 &&
    Object.hasOwn(markerTypes,marker.type) && Object.hasOwn(maps,marker.mapId) && validPoint(marker,maps[marker.mapId]));
}
export function parseCoordinate(value) {
  const text = String(value ?? '').trim().replace(',', '.');
  return /^\d+(?:\.\d{0,2})?$/.test(text) ? Number(text) : null;
}
export function validPoint(point, bounds) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) &&
    point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}
export function solution(origin, target, weapon) {
  const dx = target.x - origin.x, dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy) * 100;
  const bearing = distance < 1e-7 ? null : (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
  return { distance, bearing, status: distance < weapon.min - 1e-7 ? 'near' : distance > weapon.max + 1e-7 ? 'far' : 'in' };
}
export function heading(bearing) {
  if (bearing === null) return { degrees: '—', direction: '—' };
  const degrees = Math.round(bearing) % 360;
  return { degrees, direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(degrees / 45) % 8] };
}
export function screenToWorld(x, y, view) {
  return { x: view.x + (x - view.width / 2) / view.scale, y: view.y - (y - view.height / 2) / view.scale };
}

export function outsideControlZone(mapId,x,y) {
  const zones=controlZones[mapId];
  return !!zones?.length && !zones.some(z=>Math.hypot(x-z.x,y-z.y)<=z.r);
}
