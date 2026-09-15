// Calibration and weapon ranges: apollyon-sys/wardogs-calculator, 2026-09-14.
export const maps = {
  bakurani: { name: 'Bakurani', minX: 23.35, maxX: 133.60, minY: 19.34, maxY: 129.65 },
  ozeti: { name: 'Ozeti', minX: 57.58, maxX: 143.07, minY: 21.81, maxY: 99.56 },
  zestafona: { name: 'Zestafona', minX: 19.90, maxX: 124.89, minY: 50.70, maxY: 141.90 },
};
export const tileBounds = { minX: -0.03, maxX: 163.81, minY: -0.01, maxY: 163.83 };
// Tower number, game X, game Y. Upstream marker coordinates are meters / 100.
export const towers = {
  bakurani: [[1,80.52,69.85],[2,77.19,70],[3,77.19,73.44],[4,83.64,72.85],[5,82.22,68.41]],
  ozeti: [[1,95.80,62.82],[2,100.37,59.23],[3,104.49,63.71],[4,100.62,67.64]],
  zestafona: [[1,68.599808,104.153],[2,72.892416,105.070592],[3,70.172672,100.1717]],
};
// WardogTools.gg artillery POI, checked 2026-09-14; meters converted to game units.
export const landmarks = [{id:'sunflower-church',mapId:'bakurani',x:84.48,y:71.40,zh:'向日葵教堂',en:'Sunflower Church'}];
// MetaForge Bakurani, 2026-09-14. Registered by full tile extents; see docs/map-data-check.md.
export const controlZones = {bakurani: [
  {id:'default',x:79.875405,y:71.801725,r:5.019608},
  {id:'farmland',x:81.339590,y:69.347970,r:5.019608},
  {id:'lumberyard',x:82.469092,y:71.798502,r:5.019608},
]};
export const spawnPoints = {bakurani: [
  {id:'alpha',x:87.327340,y:32.532218},
  {id:'bravo',x:118.691958,y:70.896478},
  {id:'charlie-1',x:39.471603,y:77.674957},
]};
export const spawnAreas = {
  bakurani: [{"name":"VALKYRA","color":"#d86666","points":[[117.5,73.76],[121.22,70.71],[118.18,66.99],[114.45,70.04]]},{"name":"MANTICORE","color":"#82c596","points":[[38.68,79.88],[43.39,78.85],[42.35,74.15],[37.65,75.18]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[83.08,35.27],[87.72,36.51],[88.97,31.86],[84.32,30.62]]}],
  ozeti: [{"name":"VALKYRA","color":"#d86666","points":[[133.98,68.51],[138.58,69.92],[139.99,65.32],[135.39,63.91]]},{"name":"MANTICORE","color":"#82c596","points":[[69.22,90.85],[73.09,87.98],[70.22,84.12],[66.36,86.99]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[81.52,34.03],[86.33,34.03],[86.33,29.21],[81.53,29.22]]}],
  zestafona: [{"name":"MANTICORE","color":"#82c596","points":[[103.3011,111.7061],[101.9084,116.31],[106.5123,117.6862],[107.8886,113.0987]]},{"name":"VALKYRA","color":"#d86666","points":[[40.2718,121.8805],[35.7007,123.3551],[37.175296,127.9262],[41.7464,126.4517]]},{"name":"LONESTAR","color":"#5fa8d3","points":[[65.1264,64.8151],[66.306,69.4681],[70.9591,68.2721],[69.7794,63.619]]}],
};
export const weapons = {
  mortar: { en: 'L81 Mortar', zh: 'L81 迫击炮', min: 132, max: 684 },
  sph2: { en: 'SPH-2', zh: 'SPH-2 自行炮', min: 780, max: 2629 },
};
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
