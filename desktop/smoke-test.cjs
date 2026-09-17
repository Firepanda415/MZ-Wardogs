const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
module.exports=async({mapWindow:map,sightWindow:sight,command,state,allowedFile,root,app,hotkeyPath})=>{
  const check=async(win,code)=>win.webContents.executeJavaScript(code,true);
  const settle=()=>check(map,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  assert(!allowedFile('wardogs://app/.git/config'));
  assert(!allowedFile('wardogs://app/desktop/main.cjs'));
  assert(!allowedFile('wardogs://app/assets/maps/%2e%2e/core.mjs'));
  assert(!allowedFile('https://example.com/index.html'));
  assert(allowedFile('wardogs://app/roads-ozeti.mjs?v=test'));
  const loaded=await check(map,`Promise.all(['bakurani','ozeti','zestafona'].map(async id=>{
    const module=await import('./roads-'+id+'.mjs');
    const {tileRoot,tileVersion}=await import('./map-assets.mjs');
    const response=await fetch(tileRoot+'/'+id+'/zoom_0/0_0.webp?v='+tileVersion);
    return module.roads.length>200&&response.ok;
  }))`);
  assert(loaded.every(Boolean),'All maps and road modules must load offline');
  assert(await check(map,`Array.from(document.querySelectorAll('#base-map, #tiles image')).every(image=>image.getAttribute('href')?.includes('/maps-display/')&&image.getAttribute('href').includes('?v='))`),'Visible maps must use versioned display tiles');
  assert(await check(map,"!!document.getElementById('overlay-toolbar')"));
  assert.equal(state().opacity,.8,'Fresh installs must default to the user-selected 80% opacity');
  assert.equal(await check(map,"typeof process"),'undefined','Renderer must not have Node access');
  await check(map,`(()=>{const $=id=>document.getElementById(id);$('map').value='ozeti';$('map').dispatchEvent(new Event('change'));$('weapon').value='mortar';$('weapon').dispatchEvent(new Event('change'));
    for(const [id,value] of Object.entries({'origin-x':'100','origin-y':'60','target-x':'100','target-y':'63'})){$(id).value=value;$(id).dispatchEvent(new Event('input',{bubbles:true}));}
  })()`);await settle();
  assert.equal(state().solution.distance,300,'Map coordinates must reach desktop host');
  assert(await check(map,"!!document.querySelector('[data-landmark=stadium]')"),'Ozeti must display Stadium');
  await check(map,"document.getElementById('saved-open').click()");
  assert(await check(map,"/Stadium|体育场/.test(document.getElementById('saved-list').textContent)"),'Artillery favorites must include Stadium');
  await check(map,"document.getElementById('saved-dialog').close()");
  assert(map.getSize().every((n,i)=>Math.abs(n-[440,570][i])<=2),'Default window should match the compact reference (allow DPI rounding)');
  await command('sight');assert(map.isVisible()&&sight.isVisible(),'Aiming overlay must preserve the map panel');
  assert(state().interactive&&map.isFocusable(),'Opening sights must keep coordinates editable');
  await check(map,"document.getElementById('target-y').value='63.1';document.getElementById('target-y').dispatchEvent(new Event('input',{bubbles:true}))");await settle();
  assert(Math.abs(state().solution.distance-310)<1e-7,'Visible map must update the sight');
  await check(map,"document.getElementById('target-y').value='63';document.getElementById('target-y').dispatchEvent(new Event('input',{bubbles:true}))");await settle();
  await command('interact');assert(!state().interactive&&!sight.isFocusable()&&!map.isFocusable());
  if(process.platform==='win32'){
    const handle=sight.getNativeWindowHandle().readBigUInt64LE().toString();
    const script=`Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class OverlayStyle{[DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")]public static extern IntPtr Get(IntPtr h,int n);}';[OverlayStyle]::Get([IntPtr]${handle},-20).ToInt64()`;
    const style=Number(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',windowsHide:true}));
    assert(style&0x20,'Windows click-through style must actually be set');
  }
  await check(sight,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const rows=await check(sight,"[...document.querySelectorAll('[data-mil]')].map(p=>[Number(p.dataset.mil),p.getAttribute('d')])");
  assert.equal(rows.length,3);assert.equal(rows[1][0]-rows[0][0],50);
  const ys=rows.map(r=>Number(r[1].match(/^M[\d.]+ ([\d.]+)/)[1]));assert(Math.abs(ys[1]-ys[0]-204)<1e-7,'Reference scale must be 204 px per 50 MIL');
  const compass=await check(sight,`(()=>{const c=document.getElementById('heading-compass'),labels=[...c.querySelectorAll('text')];return {
    bearings:labels.map(t=>Number(t.dataset.bearing)),positions:labels.map(t=>Number(t.getAttribute('x'))),
    aboveText:c.getBoundingClientRect().bottom<document.querySelector('#sight .heading').getBoundingClientRect().top
  };})()`);
  assert.deepEqual(compass.bearings,[330,345,0,15,30],'Compass must wrap smoothly across north');
  assert(compass.aboveText,'Simulated compass must sit above the numeric bearing');
  assert(Math.abs(compass.positions[2]-compass.positions[1]-15*15.36)<1e-7,'Compass labels must have uniform angular spacing');
  await command('focus');await settle();
  assert(state().interactive&&map.isFocused()&&map.webContents.isFocused(),'Focus shortcut must activate the interactive panel');
  assert(sight.isVisible()&&state().sightMode,'Focus shortcut must preserve the fullscreen sight');
  if(process.platform==='win32') {
    const expected=map.getNativeWindowHandle().readBigUInt64LE().toString();
    const script="Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class ForegroundCheck{[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();}';Write-Output READY;$null=[Console]::ReadLine();[ForegroundCheck]::GetForegroundWindow().ToInt64()";
    const foreground=await new Promise((resolve,reject)=>{
      const probe=require('node:child_process').spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true});
      const timeout=setTimeout(()=>{probe.kill();reject(new Error('Foreground check timed out'));},10000);
      probe.on('error',reject);
      require('node:readline').createInterface({input:probe.stdout}).on('line',async line=>{
        if(line==='READY'){await command('focus');await settle();probe.stdin.end('\n');}
        else {clearTimeout(timeout);resolve(line.trim());}
      });
    });
    assert.equal(foreground,expected,'Panel must be the Windows foreground window');
  }
  await command('calibration',{scale:1.1,offsetX:12,offsetY:-8});
  await check(sight,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const scaledTicks=await check(sight,"[...document.querySelectorAll('[data-mil]')].map(p=>Number(p.getAttribute('d').match(/^M[\\d.]+ ([\\d.]+)/)[1]))");
  assert(Math.abs(scaledTicks[1]-scaledTicks[0]-204*1.1)<1e-7,'Calibration must scale MIL spacing');
  await command('opacity',.7);assert(Math.abs(sight.getOpacity()-.7)<.01);
  await command('hide');assert(!sight.isVisible()&&!map.isVisible());await command('hide');assert(sight.isVisible()&&map.isVisible());
  await command('calibration',{scale:1,offsetX:0,offsetY:0});await command('opacity',.8);
  await check(sight,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  const output=path.join(app.getPath('temp'),'wardogs-overlay-smoke');fs.mkdirSync(output,{recursive:true});
  const screenshot=await sight.webContents.capturePage();assert.equal(screenshot.toBitmap()[3],0,'Fullscreen background must be transparent');
  fs.writeFileSync(path.join(output,'sight.png'),screenshot.toPNG());
  const sightBounds=sight.getBounds();
  for(const [width,height] of [[1280,720],[1024,768],[1720,720],[900,1440]]){
    sight.setBounds({x:sightBounds.x,y:sightBounds.y,width,height});
    await check(sight,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    const layout=await check(sight,`(()=>{
      const svg=document.getElementById('sight'),box=svg.getBoundingClientRect(),matrix=svg.getScreenCTM(),label=svg.querySelector('text'),style=getComputedStyle(label);
      return {fills:Math.abs(box.width-innerWidth)<1&&Math.abs(box.height-innerHeight)<1,uniform:Math.abs(matrix.a-matrix.d)<1e-6,
        contained:[...svg.querySelectorAll('text')].every(t=>{const r=t.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),
        fill:style.fill,stroke:style.stroke,paint:style.paintOrder};
    })()`);
    assert(layout.fills&&layout.uniform&&layout.contained,`Fullscreen layout must fit without distortion at ${width}x${height}`);
    assert.equal(layout.fill,'rgb(255, 255, 255)');assert.equal(layout.stroke,'rgb(0, 0, 0)');assert(layout.paint.startsWith('stroke'));
  }
  sight.setBounds(sightBounds);await check(sight,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  await check(sight,`(()=>{const s=document.getElementById('sight'),r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.id='contrast-background';r.setAttribute('width',s.viewBox.baseVal.width/2);r.setAttribute('height','2160');r.setAttribute('fill','#eee');r.setAttribute('stroke','none');s.prepend(r);})()`);
  await check(sight,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  fs.writeFileSync(path.join(output,'sight-contrast.png'),(await sight.webContents.capturePage()).toPNG());
  await check(sight,"document.getElementById('contrast-background').remove()");
  await command('sight');assert(map.isVisible()&&!sight.isVisible());
  await check(map,"document.getElementById('navigation').click()");await settle();
  assert(await check(map,"!!document.getElementById('navigation-route')"),'Navigation renders in desktop');
  await check(map,"document.getElementById('quick-open').click()");
  assert(await check(map,"/Stadium|体育场/.test(document.getElementById('quick-saved').textContent)"),'Navigation favorites must include Stadium');
  await check(map,"document.getElementById('quick-dialog').close()");
  const fullSize=map.getSize();
  await check(map,"document.getElementById('overlay-compact').click()");await settle();
  assert(state().compact&&map.getSize()[1]<=322,'Compact button must shrink the window');
  assert(await check(map,`['#map-panel','#distance-ruler','#route-panel'].every(s=>getComputedStyle(document.querySelector(s)).display==='none')`),'Compact mode hides map, navigation and embedded sight');
  assert(await check(map,`['.readout','.coordinates','.weapon-picker','.map-picker'].every(s=>getComputedStyle(document.querySelector(s)).display!=='none')`),'Map selection and artillery controls must remain visible even when navigation was active');
  assert.equal(await check(map,"document.querySelector('#distance-ruler').children.length"),0,'No embedded sight is rendered in compact mode');
  assert(await check(map,"document.getElementById('overlay-toolbar').scrollWidth<=innerWidth&&document.querySelector('.coordinates').getBoundingClientRect().bottom<=innerHeight"),'Compact toolbar and inputs must fit');
  assert(await check(map,"innerHeight-document.querySelector('.coordinates').getBoundingClientRect().bottom<=10"),'Compact window must fit content without excess bottom margin');
  assert(await check(map,"document.getElementById('saved-open').parentElement.id==='overlay-hints'"),'Compact favorites belong on the shortcut row');
  assert(await check(map,"document.getElementById('overlay-help').scrollWidth<=document.getElementById('overlay-help').clientWidth"),'All four shortcut hints must fit beside compact favorites');
  await check(map,"document.getElementById('saved-open').click()");
  assert(await check(map,"document.getElementById('saved-dialog').open"),'Compact favorites must open the shared collection');
  assert(await check(map,"/Stadium|体育场/.test(document.getElementById('saved-list').textContent)"),'Compact favorites must include Stadium');
  await check(map,"document.getElementById('saved-dialog').close()");
  await check(map,"document.getElementById('map').value='bakurani';document.getElementById('map').dispatchEvent(new Event('change'))");await settle();
  await check(map,"document.getElementById('map').value='ozeti';document.getElementById('map').dispatchEvent(new Event('change'))");await settle();
  assert.equal(state().solution.distance,300,'Map selection must preserve each map’s coordinates');
  await command('sight');await settle();assert(map.isVisible()&&sight.isVisible());
  await check(map,"document.getElementById('target-y').value='63.1';document.getElementById('target-y').dispatchEvent(new Event('input',{bubbles:true}))");await settle();
  assert(Math.abs(state().solution.distance-310)<1e-7,'Compact coordinates update fullscreen sights');
  fs.writeFileSync(path.join(output,'compact.png'),(await map.webContents.capturePage()).toPNG());
  await command('compact');await settle();
  assert(map.getSize().every((n,i)=>Math.abs(n-fullSize[i])<=2),'Full window size must be restored');
  assert(await check(map,"document.getElementById('saved-open').parentElement.classList.contains('header-actions')"),'Restore the full favorites toolbar');
  assert.equal(await check(map,"document.getElementById('target-y').value"),'63.1','Switching layout must preserve coordinates');
  assert(await check(map,"document.body.classList.contains('navigation-mode')&&!!document.getElementById('navigation-route')"),'Restore previous navigation view');
  await command('sight');
  await command('interact');await command('hide');
  await command('focus');await settle();
  assert(map.isVisible()&&map.isFocused()&&state().interactive&&!sight.isVisible(),'Focus must recover a hidden click-through panel without opening the sight');
  map.minimize();
  await command('focus');await settle();
  assert(!map.isMinimized()&&map.isFocused(),'Focus must restore a minimized panel');
  await command('focus');assert(state().interactive,'Repeated focus must not toggle click-through');
  map.setSize(440,520);await settle();
  assert(await check(map,"document.querySelector('#map-canvas').getBoundingClientRect().height>=130"),'Small window retains usable map');
  fs.writeFileSync(path.join(output,'map-small.png'),(await map.webContents.capturePage()).toPNG());
  map.setSize(560,760);await settle();fs.writeFileSync(path.join(output,'map.png'),(await map.webContents.capturePage()).toPNG());
  await check(map,"document.getElementById('target-y').value='70';document.getElementById('target-y').dispatchEvent(new Event('input',{bubbles:true}))");await settle();
  await command('sight');await check(sight,'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  assert.equal(await check(sight,"document.querySelectorAll('[data-mil]').length"),0,'Out-of-range targets must not display aiming marks');
  assert.deepEqual(state().shortcutErrors,[],'Native shortcut helper must start');
  assert(execFileSync(hotkeyPath,['--self-test'],{encoding:'utf8',windowsHide:true}).includes('PASS:'),'Held-prefix shortcuts must pass their input contracts');
  await check(map,`localStorage.setItem('mz-wardogs-v1',JSON.stringify({version:1,lang:'zh',mapId:'ozeti',defaultSavedInitialized:true,saved:[{id:'custom',name:'Camp',mapId:'ozeti',x:98,y:65}]}))`);
  await map.loadURL('wardogs://app/index.html');await settle();
  const upgraded=await check(map,"JSON.parse(localStorage.getItem('mz-wardogs-v1'))");
  assert.deepEqual(upgraded.saved.map(p=>p.id),['custom','preset:ozeti:stadium'],'Upgrade must preserve custom favorites and deleted older presets');
  assert.equal(upgraded.defaultSavedVersion,2);
  await check(map,"document.getElementById('saved-open').click();[...document.querySelectorAll('#saved-list article')].find(r=>r.textContent.includes('体育场')).querySelector('.saved-actions button:last-child').click()");
  await map.loadURL('wardogs://app/index.html');await settle();
  assert.deepEqual(await check(map,"JSON.parse(localStorage.getItem('mz-wardogs-v1')).saved.map(p=>p.id)"),['custom'],'Deleted Stadium must stay deleted after reload');
  console.log('PASS: offline maps, sandbox, solution relay, calibrated sight, interaction/hide, opacity, navigation, compact mode, shortcuts.');
  console.log('Screenshots: '+output+'; loaded assets: '+root);
};
