import assert from 'node:assert/strict';
import { mortarScale, mortarMil, mortarRange } from './core.mjs';
// Independent transcription of every numbered row in the seven supplied screenshots.
assert.deepEqual(mortarScale.slice().reverse(),[[684,150],[661,200],[637,250],[609,300],[578,350],[545,400],[510,450],[470,500],[430,550],[385,600],[340,650],[290,700],[240,750],[187,800],[132,850],[110,900],[80,950]]);
for (const [distance,mil] of mortarScale) {
  assert.equal(mortarMil(distance),mil);
  assert.equal(mortarRange(mil),distance);
}
assert.equal(mortarMil(213.5),775);
assert.equal(mortarMil(527.5),425);
assert.equal(mortarRange(425),527.5);
assert.equal(mortarRange(600),385);
assert.equal(mortarRange(900),110);
for (const distance of [-1,0,79.99,684.01,1000]) assert.equal(mortarMil(distance),null);
for (const mil of [-1,100,149.99,950.01,1000]) assert.equal(mortarRange(mil),null);
assert.equal(mortarMil((100.8-100)*100),950);
assert.equal(mortarMil((106.84-100)*100),150);
for (const value of [NaN,Infinity]) {
  assert.equal(mortarMil(value),null);
  assert.equal(mortarRange(value),null);
}
import { maps, outsideControlZone, towers, landmarks, controlZones, spawnPoints, spawnAreas, weapons, markerTypes, validMarker, parseCoordinate, validPoint, solution, heading, screenToWorld } from './core.mjs';

const origin={x:100,y:80}, mortar=weapons.mortar;
for (const [distance,status] of [[80,'near'],[110,'near'],[119,'near'],[120,'in'],[132,'in'],[684,'in'],[685,'far']]) {
  assert.equal(solution(origin,{x:100+distance/100,y:80},mortar).status,status);
}
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
for(const [mapId,count] of [['bakurani',5],['ozeti',4],['zestafona',3]]) {
  assert.equal(towers[mapId].length,count);
  assert.equal(new Set(towers[mapId].map(([number])=>number)).size,count);
  for(const [,x,y] of towers[mapId]) assert.ok(validPoint({x,y},maps[mapId]));
}
assert.deepEqual(towers.bakurani[0],[1,80.52,69.89]);
for(const [mapId,areas] of Object.entries(spawnAreas)) {
  assert.deepEqual(areas.map(a=>a.name).sort(),['LONESTAR','MANTICORE','VALKYRA']);
  for(const area of areas) {
    assert.equal(area.points.length,4);
    for(const [x,y] of area.points) assert.ok(validPoint({x,y},maps[mapId]));
  }
}
const marker={id:'check',mapId:'bakurani',type:'observe',x:80,y:70};
assert.equal(Object.keys(markerTypes).length,3);
assert.ok(validMarker(marker));
for(const patch of [{type:'<script>'},{type:'constructor'},{mapId:'missing'},{id:''},{x:NaN},{x:999},{x:'80'}]) assert.ok(!validMarker({...marker,...patch}));
assert.ok(!validMarker(null));
console.log('Passed: calculations, bounds, tower/spawn data and saved marker validation.');

assert.deepEqual(landmarks.map(({mapId,x,y})=>({mapId,x,y})),[{mapId:"bakurani",x:84.53,y:71.43},{mapId:"bakurani",x:78.72,y:71.74},{mapId:"ozeti",x:101.19,y:63.00}]);
for(const p of landmarks) assert.ok(validPoint(p,maps[p.mapId]));

assert.equal(controlZones.bakurani.length,1);
assert.equal(spawnPoints.bakurani.length,3);
for(const p of [...controlZones.bakurani,...spawnPoints.bakurani]) assert.ok(validPoint(p,maps.bakurani));
for(const [x,y] of [[82.31,66.90],[82.15,76.90],[87.37,71.95]]) {
  const z=controlZones.bakurani[0];
  assert.ok(Math.abs(Math.hypot(x-z.x,y-z.y)-z.r)<.03);
}
console.log('Passed: Control Zone and Spawn point registration.');

assert.equal(controlZones.bakurani[0].id,'lumberyard');
for(const p of spawnPoints.bakurani) assert.ok(spawnAreas.bakurani.some(a=>a.name===p.faction));

assert.deepEqual(towers.bakurani.filter(([,x,y])=>outsideControlZone('bakurani',x,y)).map(([n])=>n),[2,3]);
assert.equal(outsideControlZone('ozeti',95.8,62.82),false);
const z=controlZones.bakurani[0];
assert.equal(outsideControlZone('bakurani',z.x,z.y),false);
assert.equal(outsideControlZone('bakurani',z.x+z.r+.001,z.y),true);
assert.equal(maps.zestafona.name,'Zestafona');
assert.equal(maps.ozeti.name,'Ozeti');
assert.equal(controlZones.zestafona.length,1);
assert.ok(validPoint(controlZones.zestafona[0],maps.zestafona));
assert.deepEqual(towers.zestafona.filter(([,x,y])=>outsideControlZone('zestafona',x,y)).map(([n])=>n),[2]);

assert.deepEqual(towers.zestafona[0],[1,68.58,104.15]);
assert.deepEqual(towers.zestafona[2],[3,70.15,100.18]);
assert.equal(controlZones.ozeti.length,1);
assert.ok(validPoint(controlZones.ozeti[0],maps.ozeti));
assert.deepEqual(towers.ozeti.filter(([,x,y])=>outsideControlZone('ozeti',x,y)).map(([n])=>n),[3,4]);
// Independent screenshot boundary readings, allowing 3 m cursor/outline uncertainty.
for(const [x,y] of [[92.14,62.42],[97.71,56.89],[97.78,56.92]]) {
  const z=controlZones.ozeti[0];
  assert.ok(Math.abs(Math.hypot(x-z.x,y-z.y)-z.r)<.03);
}

// Each measured spawn icon must sit inside its own convex four-corner area.
for(const mapId of Object.keys(maps)) {
assert.equal(spawnPoints[mapId].length,3);
for(const p of spawnPoints[mapId]) {
  const a=spawnAreas[mapId].find(a=>a.name===p.faction);
  const signs=a.points.map(([x,y],i)=>{const [u,v]=a.points[(i+1)%4];return Math.sign((u-x)*(p.y-y)-(v-y)*(p.x-x));});
  assert.ok(signs.every(s=>s===signs[0]));
  assert.ok(validPoint(p,maps[mapId]));
}
}
