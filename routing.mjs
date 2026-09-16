const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y)*100;
const finitePoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);

export function buildRoadGraph(roads) {
  const nodes=[], edges=[], indices=new Map();
  function node([x,y]) {
    if(!Number.isFinite(x)||!Number.isFinite(y)) throw new Error('Invalid road coordinate');
    const key=`${x},${y}`;
    if(!indices.has(key)){indices.set(key,nodes.length);nodes.push({x,y});}
    return indices.get(key);
  }
  for(const road of roads) {
    if(!Array.isArray(road.points)||road.points.length<2) throw new Error('Road needs two points');
    const ids=road.points.map(node);
    for(let i=1;i<ids.length;i++) if(ids[i-1]!==ids[i])
      edges.push({a:ids[i-1],b:ids[i],roadId:road.id,length:distance(nodes[ids[i-1]],nodes[ids[i]])});
  }
  return {nodes,edges};
}

export function snapToRoad(graph, point) {
  if(!finitePoint(point)) return null;
  let best=null;
  graph.edges.forEach((edge,index)=>{
    const a=graph.nodes[edge.a],b=graph.nodes[edge.b],dx=b.x-a.x,dy=b.y-a.y;
    const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy)));
    const p={x:a.x+t*dx,y:a.y+t*dy},gap=distance(point,p);
    if(!best||gap<best.gap)best={...p,t,edge:index,gap};
  });
  return best;
}

export function findRoadRoute(graph, origin, target) {
  if(!finitePoint(origin)||!finitePoint(target))return {status:'invalid'};
  const start=snapToRoad(graph,origin),end=snapToRoad(graph,target);
  if(!start||!end)return {status:'empty'};
  const nodes=[...graph.nodes,start,end],s=nodes.length-2,t=s+1;
  const adjacency=nodes.map(()=>[]);
  const connect=(a,b,length)=>{adjacency[a].push([b,length]);adjacency[b].push([a,length]);};
  for(const edge of graph.edges)connect(edge.a,edge.b,edge.length);
  for(const [id,p] of [[s,start],[t,end]]) {
    const edge=graph.edges[p.edge];
    connect(id,edge.a,edge.length*p.t);connect(id,edge.b,edge.length*(1-p.t));
  }
  // Two points on the same segment can travel directly without visiting a junction.
  if(start.edge===end.edge)connect(s,t,distance(start,end));
  const distances=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set();
  distances[s]=0;
  // ponytail: O(V²) Dijkstra for this small static network; use a heap for city-size data.
  for(;;) {
    let u=-1;
    for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(u<0||distances[i]<distances[u]))u=i;
    if(u<0||!Number.isFinite(distances[u])||u===t)break;
    visited.add(u);
    for(const [v,length] of adjacency[u])if(distances[u]+length<distances[v]){
      distances[v]=distances[u]+length;previous[v]=u;
    }
  }
  if(!Number.isFinite(distances[t]))return {status:'disconnected',start,end};
  const path=[];
  for(let i=t;i!==-1;i=previous[i])path.push({x:nodes[i].x,y:nodes[i].y});
  path.reverse();
  return {status:'ok',start,end,path,distance:distances[t]};
}
