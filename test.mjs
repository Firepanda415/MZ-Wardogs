import assert from 'node:assert/strict';
import { maps, weapons, parseCoordinate, validPoint, solution, heading, screenToWorld } from './core.mjs';

const origin={x:100,y:80}, mortar=weapons.mortar;
for(const [target,bearing] of [[{x:100,y:81},0],[{x:101,y:80},90],[{x:100,y:79},180],[{x:99,y:80},270]]) {
  assert.equal(solution(origin,target,mortar).bearing,bearing);
  assert.equal(solution(origin,target,mortar).distance,100);
}
assert.equal(solution(origin,{x:103,y:84},mortar).distance,500);
assert.equal(solution(origin,origin,mortar).bearing,null);
assert.equal(heading(359.8).degrees,0);
assert.deepEqual(heading(253),{degrees:253,direction:'W'});
for(const w of Object.values(weapons)) {
  assert.equal(solution(origin,{x:origin.x+w.min/100,y:80},w).status,'in');
  assert.equal(solution(origin,{x:origin.x+w.max/100,y:80},w).status,'in');
  assert.equal(solution(origin,{x:origin.x+(w.min-1)/100,y:80},w).status,'near');
  assert.equal(solution(origin,{x:origin.x+(w.max+1)/100,y:80},w).status,'far');
}
for(const value of ['', '  ', 'Infinity', '1e2', '12x', '1.234', null, '-1'])assert.equal(parseCoordinate(value),null);
assert.equal(parseCoordinate(' 100,05 '),100.05);
assert.equal(parseCoordinate('80.'),80);
for(const b of Object.values(maps)) {
  assert.ok(validPoint({x:b.minX,y:b.maxY},b));
  assert.ok(!validPoint({x:b.minX-.01,y:b.maxY},b));
  assert.ok(!validPoint({x:null,y:b.maxY},b));
}
const view={x:100,y:80,width:400,height:300,scale:10};
assert.deepEqual(screenToWorld(200,150,view),origin);
assert.deepEqual(screenToWorld(210,140,view),{x:101,y:81});
console.log('Passed: distances, compass, weapon limits, input validation, map bounds and screen coordinates.');
