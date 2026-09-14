// Calibration and weapon ranges: apollyon-sys/wardogs-calculator, 2026-09-14.
export const maps = {
  bakurani: { name: 'Bakurani', minX: 23.35, maxX: 133.60, minY: 19.34, maxY: 129.65 },
  ozeti: { name: 'Ozeti', minX: 57.58, maxX: 143.07, minY: 21.81, maxY: 99.56 },
  zestafona: { name: 'Zestafona', minX: 19.90, maxX: 124.89, minY: 50.70, maxY: 141.90 },
};
export const tileBounds = { minX: -0.03, maxX: 163.81, minY: -0.01, maxY: 163.83 };
export const weapons = {
  mortar: { en: 'L81 Mortar', zh: 'L81 迫击炮', min: 132, max: 684 },
  sph2: { en: 'SPH-2', zh: 'SPH-2 自行炮', min: 780, max: 2629 },
};
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
