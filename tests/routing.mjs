import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRoadGraph, snapToRoad, findRoadRoute } from '../routing.mjs';
import { roads, nonJunctionPairs } from '../roads-bakurani.mjs';
import { roads as ozetiRoads } from '../roads-ozeti.mjs';
import { roads as zestafonaRoads } from '../roads-zestafona.mjs';
import { maps, validPoint, spawnPoints, controlZones } from '../core.mjs';
const graph=points=>buildRoadGraph(points.map((points,i)=>({id:String(i),points})));
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const line=graph([[[0,0],[10,0]]]);
const snap=snapToRoad(line,{x:3,y:2});
near(snap.x,3);near(snap.y,0);near(snap.gap,200);
near(snapToRoad(line,{x:-2,y:1}).x,0);
near(snapToRoad(line,{x:12,y:1}).x,10);
near(snapToRoad(graph([[[0,0],[10,10]]]),{x:6,y:2}).x,4);
const route=findRoadRoute(line,{x:3,y:2},{x:7,y:-1});
near(route.distance,400);near(route.start.gap,200);near(route.end.gap,100);
near(findRoadRoute(line,{x:7,y:-1},{x:3,y:2}).distance,400);
near(findRoadRoute(line,{x:3,y:2},{x:3,y:2}).distance,0);
near(findRoadRoute(line,{x:0,y:0},{x:10,y:0}).distance,1000);
assert.equal(findRoadRoute(line,{x:NaN,y:0},{x:1,y:0}).status,'invalid');
assert.equal(findRoadRoute(graph([]),{x:0,y:0},{x:1,y:0}).status,'empty');
// Crossing lines do not create an intersection unless a shared vertex is recorded.
const crossing=graph([[[0,0],[10,0]],[[5,-5],[5,5]]]);
assert.equal(findRoadRoute(crossing,{x:1,y:0},{x:5,y:4}).status,'disconnected');
// Choose the short side of a loop; interior snaps must not force a trip to its ends.
const loop=graph([[[0,0],[10,0]],[[0,0],[0,10],[10,10],[10,0]]]);
near(findRoadRoute(loop,{x:2,y:0},{x:10,y:3}).distance,1100);
const junction=graph([[[0,0],[5,0],[10,0]],[[5,0],[5,5]]]);
near(findRoadRoute(junction,{x:3,y:0},{x:5,y:4}).distance,600);

const real=buildRoadGraph(roads), zone=controlZones.bakurani[0];
const reviewedJunctions=JSON.parse(readFileSync(new URL('./road-junctions-3d.json',import.meta.url),'utf8'));
for(const [mapId,mapRoads] of Object.entries({bakurani:roads,ozeti:ozetiRoads,zestafona:zestafonaRoads})) {
  const roadGraph=buildRoadGraph(mapRoads);
  for(const {start,end,maxDistance} of reviewedJunctions[mapId]) {
    const route=findRoadRoute(roadGraph,{x:start[0],y:start[1]},{x:end[0],y:end[1]});
    assert.equal(route.status,'ok',`${mapId}: reviewed junction disconnected`);
    assert(route.distance<=maxDistance&&route.start.gap<3&&route.end.gap<3,`${mapId}: reviewed junction requires a detour at ${start}`);
  }
}
// Tower 2's access roads reach its perimeter and join below the bridge deck.
assert(snapToRoad(buildRoadGraph(ozetiRoads),{x:100.34,y:59.25}).gap<25,'Ozeti tower 2 roads missing');
assert(ozetiRoads.find(r=>r.id==='south-tower2-west-road').points[0][1]<=60.12,'Tower access incorrectly joins the bridge deck');
// Short road mouths must connect; the two main-road crossings have four arms.
const ozetiGraph=buildRoadGraph(ozetiRoads);
for(const [a,b] of [
  [{x:100.63,y:58.49},{x:100.76,y:58.48}],
  [{x:100.88,y:62.65},{x:100.99,y:62.61}],
  [{x:102.99,y:63.43},{x:102.9,y:63.62}],
]) {
  const r=findRoadRoute(ozetiGraph,a,b);
  assert.equal(r.status,'ok');
  assert(r.distance<30&&r.start.gap<2&&r.end.gap<2,'Ozeti short junction requires a detour');
}
for(const [x,y] of [[104.06,65.32],[115.27,66.94]]) {
  const i=ozetiGraph.nodes.findIndex(p=>p.x===x&&p.y===y);
  assert(i>=0&&ozetiGraph.edges.filter(e=>e.a===i||e.b===i).length===4,'Ozeti crossing must have four arms');
}
assert.deepEqual(ozetiRoads.find(r=>r.id==='feedback2-church-main').points.at(-1),ozetiRoads.find(r=>r.id==='town-east-field-path').points[0],'Crossing has a triangular bypass');
// The marked farm junction is one node; old triangle and false riverbank road must stay removed.
for(const id of ['south-farm-road-north','south-farm-village-west','south-farm-village-west-north-entry','south-farm-village-west-east-link'])
  assert(roads.find(r=>r.id===id).points.some(([x,y])=>x===81.58&&y===50.30),`${id}: farm junction split again`);
assert(!roads.some(r=>r.id==='west-river-north-east-lane'));
assert(!ozetiRoads.some(r=>['south-valley-connector','town-east-gate','town-southwest-diagonal'].includes(r.id)),'Removed false or duplicate roads returned');
assert(!ozetiRoads.some(r=>r.id==='town-city-middle'),'Crossed-out Ozeti courtyard road returned');
for(const id of ['zestafona-city-central8','zestafona-north-farm1','zestafona-south-fields-divider','zestafona-south-fields-footpath','zestafona-south-base-entry','zestafona-south-base-west-connect'])
  assert(!zestafonaRoads.some(r=>r.id===id),`Removed false road returned: ${id}`);
assert(zestafonaRoads.some(r=>r.id==='zestafona-south-village-track'),'Road with withdrawn red cross must remain');
const northBoundary=zestafonaRoads.find(r=>r.id==='zestafona-south-fields-loop');
for(const id of ['zestafona-south-village1-lane','zestafona-south-village1-main']) {
  const road=zestafonaRoads.find(r=>r.id===id);
  assert(!road.points.some(p=>northBoundary.points.some(q=>p[0]===q[0]&&p[1]===q[1])),`${id}: closed northern entrance reconnected`);
}
// The northwest field spur meets the main road at its mouth, without an 800 m detour.
const fieldMouth=findRoadRoute(buildRoadGraph(zestafonaRoads),{x:66.92,y:109.02},{x:67.18,y:108.98});
assert.equal(fieldMouth.status,'ok');
assert(fieldMouth.distance<40&&fieldMouth.end.gap<3,'Northwest field-spur junction is disconnected');
// Road mouths must allow local turns, not a detour around the surrounding fields.
for(const [data,cases] of [
  [roads,[
    [[79.41,47.4],[79.08,47.5],55],
    [[78.74,44.99],[78.27,45.25],85],
    [[78.33,43.49],[78,43.5],55],
    [[79.87,40.85],[79.98,40.18],90],
    [[82.72,49.99],[83.31,50.4],130],
    [[47,76.95],[46.3,76.94],85],
    [[46.95,76.14],[46.25,76.28],100],
    [[47.6,75.56],[47.01,75.73],85],
    [[47.76,75.29],[47.51,74.99],80],
    [[67.75,70.17],[67.21,70.42],90],
    [[66.49,71.45],[65.98,71.19],85],
  ]],
  [ozetiRoads,[
    [[105.58,62.91],[105.79,62.46],85],
    [[77.94,81.34],[78.5,81.94],110],
  ]],
  [zestafonaRoads,[
    [[71,89.32],[69.91,94.13],560],
    [[75.1,87.13],[75.12,91.26],450],
    [[68.42,81.03],[67.93,79.95],130],
  ]],
]) {
  const g=buildRoadGraph(data);
  for(const [a,b,limit] of cases) {
    const r=findRoadRoute(g,{x:a[0],y:a[1]},{x:b[0],y:b[1]});
    assert.equal(r.status,'ok');
    assert(r.start.gap<2&&r.end.gap<2&&r.distance<limit,`Road mouth ${a} / ${b}: ${r.distance} m`);
  }
}
assert(!zestafonaRoads.some(r=>r.id==='zestafona-ne-farm9'),'Field-interior loop returned');
// The blue base uses its visible northwest diagonal, not the old westward detour.
const blueExit=findRoadRoute(real,{x:87.34,y:32.54},{x:83.15,y:36.85});
assert.equal(blueExit.status,'ok');
assert(blueExit.distance<700&&blueExit.path.every(p=>p.x>=83.14),'Blue base diagonal exit missing');
// Surveyed missing corridors must be joined, not merely drawn beside one another.
for (const [start,end,maxDistance] of [
  [{x:60.2,y:59},{x:70.4,y:61.3},1300],
  [{x:82.8,y:61.85},{x:86.81,y:68.24},1100],
  [{x:99.32,y:70.58},{x:101,y:65.4},650],
  [{x:77.95,y:61.01},{x:77.93,y:58.85},230],
  [{x:90.72,y:74.2},{x:90.04,y:72.27},250],
  [{x:91.23,y:72.09},{x:91.05,y:70.9},160],
]) {
  const r=findRoadRoute(real,start,end);
  assert.equal(r.status,'ok');
  assert(r.start.gap<20&&r.end.gap<20,'Missing road near a surveyed checkpoint');
  assert(r.distance<maxDistance,'Missing farm-road junction causes an unnecessary detour');
}
// The factory road bridge crosses above the riverside road, without a turn-off.
const bridge=roads.find(r=>r.id==='factory-south-bridge'), underpass=roads.find(r=>r.id==='west-river-highway');
assert(!bridge.points.some(p=>underpass.points.some(q=>p[0]===q[0]&&p[1]===q[1])),'Bridge incorrectly joined to the road below');
const bridgeExit=findRoadRoute(real,{x:77.95,y:61.01},{x:77.76,y:59.88});
assert.equal(bridgeExit.status,'ok');
assert(bridgeExit.distance>500,'Route must leave the bridge before joining the riverside road');
for(const point of [{x:98.28,y:129.65},{x:23.35,y:86.8},{x:133.6,y:52.96}])
  assert.equal(findRoadRoute(real,point,zone).status,'ok','Outer roads must reach the control zone');
for(const [a,b] of nonJunctionPairs) {
  const upper=roads.find(r=>r.id===a),lower=roads.find(r=>r.id===b);
  assert(upper&&lower,`Missing bridge road: ${a} / ${b}`);
  assert(!upper.points.some(p=>lower.points.some(q=>p[0]===q[0]&&p[1]===q[1])),`Grade-separated roads joined: ${a} / ${b}`);
}
for(const [mapId,data] of Object.entries({bakurani:roads,ozeti:ozetiRoads,zestafona:zestafonaRoads})) {
  const g=buildRoadGraph(data),cz=controlZones[mapId][0];
  assert.equal(new Set(data.map(r=>r.id)).size,data.length);
  for(const p of g.nodes)assert(validPoint(p,maps[mapId]),`${mapId}: road vertex outside map`);
  const adjacent=g.nodes.map(()=>[]);
  for(const e of g.edges){adjacent[e.a].push(e.b);adjacent[e.b].push(e.a);}
  const reachable=new Set([0]),queue=[0];
  while(queue.length)for(const n of adjacent[queue.pop()])if(!reachable.has(n)){reachable.add(n);queue.push(n);}
  assert.equal(reachable.size,g.nodes.length,`${mapId}: disconnected road data`);
  for(const base of spawnPoints[mapId]) {
    const forward=findRoadRoute(g,base,cz),reverse=findRoadRoute(g,cz,base);
    assert.equal(forward.status,'ok');near(forward.distance,reverse.distance);
    assert(forward.distance>1000&&forward.distance<20000,'Unexpected base route length');
    // The user removed Lonestar's building-interior routes; its eastern road is 110 m away.
    const eastOnly=mapId==='zestafona'&&base.id==='lonestar';
    assert(forward.start.gap<(eastOnly?120:100)&&forward.end.gap<100,`${mapId}: base or control-zone access missing`);
    if(eastOnly)assert(forward.start.x>base.x&&forward.start.gap>100,'Lonestar must use the eastern road outside the building');
    near(forward.path.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-forward.path[i].x,p.y-forward.path[i].y)*100,0),forward.distance);
    console.log(`${mapId} ${base.faction}: ${Math.round(forward.distance)} m; off-road ${Math.round(forward.start.gap)} / ${Math.round(forward.end.gap)} m`);
  }
  console.log(`PASS: ${mapId}: ${data.length} roads, ${g.nodes.length} connected vertices.`);
}
console.log('PASS: segment snapping, same-edge travel, loops, grade-separated crossings, invalid input and all released maps.');
