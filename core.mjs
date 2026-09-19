// Map bounds, tile calibration and SPH-2 ranges: apollyon-sys/wardogs-calculator.
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
// Landmark centers measured from gameplay screenshots; Sunflower Church name from community references.
export const landmarks = [
  {id:'sunflower-church',mapId:'bakurani',x:84.53,y:71.43,zh:'向日葵教堂',en:'Sunflower Church'},
  // Center of four user-supplied in-game reference points, 2026-09-14.
  {id:'factory',mapId:'bakurani',x:78.72,y:71.74,zh:'货柜工厂',en:'Container&Factory'},
  {id:'hilltop-church',mapId:'ozeti',x:101.19,y:63.00,zh:'山顶教堂',en:'Hilltop Church'},
  {id:'stadium',mapId:'ozeti',x:97.72,y:65.43,zh:'体育场',en:'Stadium',presetVersion:2},
  {id:'pool-diving-platform',mapId:'ozeti',x:100.04,y:65.49,zh:'泳池跳台',en:'Pool Diving Platform',presetVersion:3},
  {id:'southwest-church',mapId:'bakurani',x:79.16,y:67.47,zh:'西南教堂',en:'Southwest Church',presetVersion:4},
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
// All spawn coordinates: gameplay screenshot measurements. See README for methods.
export const spawnPoints = {ozeti: [
  {id:'manticore',faction:'MANTICORE',x:68.26,y:88.07},
  {id:'lonestar',faction:'LONESTAR',x:83.72,y:30.70},
  {id:'valkyra',faction:'VALKYRA',x:138.18,y:67.27},
], bakurani: [
  {id:'alpha',faction:'LONESTAR',x:87.34,y:32.54},
  {id:'bravo',faction:'VALKYRA',x:118.60,y:71.00},
  {id:'charlie-1',faction:'MANTICORE',x:39.37,y:77.76},
], zestafona: [
  {id:'manticore',faction:'MANTICORE',x:105.35,y:115.00},
  {id:'lonestar',faction:'LONESTAR',x:67.84,y:65.83},
  {id:'valkyra',faction:'VALKYRA',x:38.51,y:125.25},
]};
export const spawnAreas = {
  bakurani: [{"name":"VALKYRA","color":"#d86666","points":[[117.41,73.86],[121.07,70.79],[118.06,67.11],[114.37,70.12]]},{"name":"MANTICORE","color":"#82c596","points":[[38.59,79.94],[43.24,78.89],[42.26,74.21],[37.61,75.26]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[83.06,35.27],[87.69,36.52],[88.93,31.89],[84.28,30.63]]}],
  ozeti: [{"name":"VALKYRA","color":"#d86666","points":[[133.93,68.56],[138.53,69.96],[139.94,65.37],[135.35,63.97]]},{"name":"MANTICORE","color":"#82c596","points":[[69.06,90.89],[72.96,88.09],[70.13,84.25],[66.26,86.98]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[81.48,34.06],[86.29,34.06],[86.27,29.25],[81.46,29.25]]}],
  zestafona: [{"name":"MANTICORE","color":"#82c596","points":[[103.26,111.73],[101.88,116.31],[106.45,117.69],[107.84,113.11]]},{"name":"VALKYRA","color":"#d86666","points":[[40.21,121.93],[35.64,123.40],[37.10,127.95],[41.68,126.48]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[65.08,64.87],[66.24,69.47],[70.89,68.29],[69.71,63.68]]}],
};
export const weapons = {
  // User-confirmed adjustment stop in 20260915002406_1.jpg: center ~877 MIL, ~120 m.
  mortar: { en: 'L81 Mortar', zh: 'L81 迫击炮', min: 120, max: 684 },
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

export const defaultSavedPositions = [
  ...Object.entries(towers).flatMap(([mapId,points]) => points.map(([number,x,y]) =>
    // Version 4 adds towers excluded by the earlier control-zone filter.
    ({id:`preset:${mapId}:tower:${number}`,mapId,x,y,zh:`${number}号塔`,en:`Tower ${number}`,presetVersion:({bakurani:[2,3],ozeti:[3,4],zestafona:[2]})[mapId].includes(number)?4:1}))),
  ...landmarks.map(p => ({...p,id:`preset:${p.mapId}:${p.id}`})),
];
