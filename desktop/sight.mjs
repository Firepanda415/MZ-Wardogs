import { mortarMil, mortarRange } from '../core.mjs';
const api=window.wardogsOverlay, $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';
const add=(tag,attributes,text,parent=$('sight'))=>{
  const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attributes))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;
  if(tag==='path'||tag==='circle'){
    const halo=e.cloneNode();halo.removeAttribute('data-mil');halo.setAttribute('class',`${attributes.class||''} halo`);halo.setAttribute('aria-hidden','true');parent.append(halo);
  }
  parent.append(e);return e;
};
// 3840x2160 reference: center 1079.5 px; 50 MIL spans 204 px. Scale uniformly by screen height.
export const reference={width:3840,height:2160,x:1919.5,y:1079.5,pixelsPerMil:204/50};
let latestState;
function render(state){
  latestState=state;
  const {solution:s,calibration:c,interactive,opacity}=state;
  $('calibration').hidden=!interactive;
  for(const id of ['scale','offsetX','offsetY'])if(document.activeElement!==$(id))$(id).value=id==='scale'?c.scale*100:c[id];
  if(document.activeElement!==$('opacity'))$('opacity').value=Math.round(opacity*100);
  // Match the viewport aspect ratio: labels span the screen, while calibrated geometry scales uniformly by height.
  const width=reference.height*innerWidth/innerHeight,unitsPerPixel=reference.height/innerHeight;
  $('sight').setAttribute('viewBox',`0 0 ${width} ${reference.height}`);
  $('sight').replaceChildren();
  const usable=s?.weaponId==='mortar'&&s.distance>=120&&s.distance<=684;
  $('readout').hidden=usable;
  if(!usable){$('readout').textContent='L81 瞄具覆盖\n'+(!s?'返回地图设置自己与目标坐标':s.weaponId!=='mortar'?'请选择 L81 迫击炮':'超出 L81 射程（120–684 m）')+'\n~+F2 关闭瞄具';return;}
  const mil=mortarMil(s.distance),first=Math.max(150,Math.min(850,Math.round(mil/50)*50-50)),{x,y}=reference;
  const centerX=width/2-.5+c.offsetX*unitsPerPixel,centerY=y+c.offsetY*unitsPerPixel;
  const left=width*.285,right=width*.715;
  const reticle=add('g',{transform:`translate(${centerX} ${centerY}) scale(${c.scale}) translate(${-x} ${-y})`});
  add('path',{class:'reticle',d:`M${x} ${y-210}v90 M${x-41.25} ${y-120}h82.5 M${x} ${y+210}v-90 M${x-41.25} ${y+120}h82.5`},undefined,reticle);
  add('path',{d:`M${x-90} ${y-63.75}h-30v127.5h30 M${x+90} ${y-63.75}h30v127.5h-30`},undefined,reticle);
  add('circle',{cx:x,cy:y,r:12},undefined,reticle);
  if(s.bearing!==null){
    // Keep the screenshot's horizontal degree spacing; narrow screens show fewer degrees, without stretching.
    const pixelsPerDegree=15.36,span=Math.min(37.5,(width/2-100)/pixelsPerDegree);
    const compass=add('g',{id:'heading-compass','aria-label':'目标方位罗盘刻度'});
    for(let angle=Math.ceil((s.bearing-span)/5)*5;angle<=s.bearing+span;angle+=5){
      const cx=width/2+(angle-s.bearing)*pixelsPerDegree,major=angle%15===0,bearing=(angle%360+360)%360;
      add('path',{class:'ticks',d:`M${cx} ${major?150:165}V180`},undefined,compass);
      if(major)add('text',{'data-bearing':bearing,x:cx,y:130,'text-anchor':'middle'},String(bearing).padStart(3,'0'),compass);
    }
    add('path',{class:'compass-center',d:`M${width/2} 145V195`},undefined,compass);
  }
  add('text',{class:'heading',x:width/2,y:260,'text-anchor':'middle'},`目标方位 ${s.bearing===null?'—':s.bearing.toFixed(1)+'°'}`);
  add('text',{class:'side-heading',x:left-38,y:580,'text-anchor':'end'},`距离 ${Math.round(s.distance)} m`);
  add('text',{class:'side-heading',x:right+38,y:580},`MIL ${mil.toFixed(1)}`);
  for(let value=first;value<=first+100;value+=50){
    const cy=centerY+(value-mil)*reference.pixelsPerMil*c.scale;
    add('path',{class:'ticks','data-mil':value,d:`M${left} ${cy-18.75}v37.5 M${left} ${cy}h37.5 M${right} ${cy-18.75}v37.5 M${right} ${cy}h-37.5`});
    add('text',{x:left-38,y:cy+12,'text-anchor':'end'},`${mortarRange(value)}M`);
    add('text',{x:right+38,y:cy+12},String(value));
  }
}
for(const id of ['scale','offsetX','offsetY'])$(id).onchange=()=>{const value=Number($(id).value);if(Number.isFinite(value))api.command('calibration',{[id]:id==='scale'?value/100:value});};
$('opacity').oninput=()=>api.command('opacity',Number($('opacity').value)/100);
$('reset').onclick=()=>api.command('calibration',{scale:1,offsetX:0,offsetY:0});
$('done').onclick=()=>api.command('interact');$('map').onclick=()=>api.command('sight');
window.addEventListener('resize',()=>{if(latestState)render(latestState);});
api.onState(render);api.command('state').then(render);
