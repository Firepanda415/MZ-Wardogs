const { app, BrowserWindow, protocol, net, ipcMain, Menu, Tray, nativeImage, screen, shell, dialog } = require('electron');
const {spawn}=require('node:child_process');
const {createInterface}=require('node:readline');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const smoke = process.argv.includes('--smoke-test');
if (smoke) app.setPath('userData', fs.mkdtempSync(path.join(app.getPath('temp'), 'wardogs-overlay-test-')));
else app.setPath('userData', path.join(app.getPath('appData'), 'MZ-Wardogs-Overlay'));
protocol.registerSchemesAsPrivileged([{ scheme:'wardogs', privileges:{ standard:true, secure:true, supportFetchAPI:true } }]);
const root = app.isPackaged ? path.join(__dirname, 'web') : path.resolve(__dirname, '..');
const settingsFile = path.join(app.getPath('userData'), 'overlay.json');
let settings = {};
try { settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8')); } catch(error) { if(error.code!=='ENOENT') console.error('Cannot read overlay settings:',error.message); }
const clamp=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
let opacity=clamp(settings.opacity,.3,1,.8);
const calibration={scale:clamp(settings.calibration?.scale,.5,2,1),offsetX:clamp(settings.calibration?.offsetX,-2000,2000,0),offsetY:clamp(settings.calibration?.offsetY,-2000,2000,0)};
let mapWindow, sightWindow, tray, solution=null, sightMode=false, interactive=true, hidden=false;
let compact=false, fullBounds;
let hotkeys, hotkeyPath;
const shortcutErrors=[];
const state=()=>({solution,calibration,opacity,interactive,sightMode,compact,shortcutErrors});
function broadcast(){ for(const win of [mapWindow,sightWindow])if(win&&!win.isDestroyed())win.webContents.send('overlay-state',state()); }
function save(){
  if(smoke||!mapWindow||mapWindow.isDestroyed())return;
  try {
    fs.mkdirSync(path.dirname(settingsFile),{recursive:true});
    fs.writeFileSync(settingsFile+'.tmp',JSON.stringify({bounds:compact?fullBounds:mapWindow.getNormalBounds(),compact,opacity,calibration}));
    fs.renameSync(settingsFile+'.tmp',settingsFile);
  }catch(error){console.error('Cannot save overlay settings:',error.message);}
}
function trayMenu(){
  tray?.setContextMenu(Menu.buildFromTemplate([
    {label:'显示地图 / 恢复操作',click:showMap},
    {label:'瞄具 开 / 关 · ~+F2',click:toggleSight},
    {label:'交互 / 鼠标穿透 · ~+F1',click:()=>setInteraction(!interactive)},
    {label:'全部隐藏 / 显示 · ~+F3',click:toggleHidden},
    {type:'separator'}, {label:'退出',click:()=>app.quit()},
  ]));
}
function setInteraction(value){
  interactive=value;hidden=false;
  for(const win of [mapWindow,sightWindow]){
    win.setIgnoreMouseEvents(!interactive,{forward:true});
    win.setFocusable(interactive);
    if(!interactive)win.blur();
  }
  if(sightMode)sightWindow.showInactive();else sightWindow.hide();
  mapWindow.showInactive();mapWindow.moveTop();
  if(interactive)mapWindow.focus();
  broadcast();
}
function showMap(){setInteraction(true);}
function toggleCompact(){
  if(!compact)fullBounds=mapWindow.getNormalBounds();
  compact=!compact;
  mapWindow.setMinimumSize(440,compact?200:520);
  const b=compact?{...mapWindow.getBounds(),width:440,height:320}:fullBounds;
  const area=screen.getDisplayMatching(b).workArea;
  mapWindow.setBounds({...b,x:clamp(b.x,area.x,area.x+area.width-b.width,area.x),y:clamp(b.y,area.y,area.y+area.height-b.height,area.y)});
  broadcast();save();
}
function toggleSight(){
  sightMode=!sightMode;
  if(sightMode)sightWindow.setBounds(screen.getDisplayMatching(mapWindow.getBounds()).bounds);
  setInteraction(interactive);
}
function toggleHidden(){if(hidden)setInteraction(interactive);else{hidden=true;mapWindow.hide();sightWindow.hide();}}
function allowedFile(raw){
  try{
    const url=new URL(raw),name=decodeURIComponent(url.pathname).slice(1);
    if(url.protocol!=='wardogs:'||url.hostname!=='app'||name.includes('..')||name.includes('\\'))return null;
    const files=['index.html','style.css','app.js','core.mjs','routing.mjs','roads-bakurani.mjs','roads-ozeti.mjs','roads-zestafona.mjs','favicon.svg','desktop/overlay.css','desktop/sight.html','desktop/sight.css','desktop/sight.mjs'];
    if(!files.includes(name)&&!/^assets\/maps\/(bakurani|ozeti|zestafona)\/zoom_[0-7]\/\d+_\d+\.webp$/.test(name))return null;
    return path.join(root,name);
  }catch{return null;}
}
function trusted(event){return [mapWindow,sightWindow].some(w=>w&&!w.isDestroyed()&&event.sender===w.webContents&&event.senderFrame===w.webContents.mainFrame);}
async function command(name,value){
  if(name==='interact')setInteraction(!interactive);
  else if(name==='sight')toggleSight();
  else if(name==='compact')toggleCompact();
  else if(name==='compact-height'&&compact&&Number.isFinite(value)){
    const b=mapWindow.getBounds(),area=screen.getDisplayMatching(b).workArea;
    const height=clamp(Math.ceil(value)+b.height-mapWindow.getContentSize()[1],200,area.height,b.height);
    if(Math.abs(b.height-height)>1)mapWindow.setBounds({height,y:clamp(b.y,area.y,area.y+area.height-height,area.y)});
  }
  else if(name==='hide')toggleHidden();
  else if(name==='quit')app.quit();
  else if(name==='opacity'){
    opacity=clamp(value,.3,1,opacity);
    for(const win of [mapWindow,sightWindow])win.setOpacity(opacity);
    save();broadcast();
  }else if(name==='calibration'&&value&&typeof value==='object'){
    for(const key of Object.keys(calibration))if(Object.hasOwn(value,key))calibration[key]=clamp(value[key],key==='scale'?.5:-2000,key==='scale'?2:2000,calibration[key]);
    save();broadcast();
  }
  return state();
}
function createWindow(options){
  const win=new BrowserWindow({...options,show:false,frame:false,backgroundColor:options.transparent?'#00000000':'#121713',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:true}});
  win.setAlwaysOnTop(true,'screen-saver');win.setOpacity(opacity);win.setMenu(null);
  win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))shell.openExternal(url);return {action:'deny'};});
  win.webContents.on('will-navigate',(event,url)=>{event.preventDefault();if(/^https:\/\//.test(url))shell.openExternal(url);});
  win.webContents.on('will-attach-webview',event=>event.preventDefault());
  return win;
}
function icon(){
  const size=32,data=Buffer.alloc(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const ink=(x>=7&&x<=10||x>=21&&x<=24)&&y>=7&&y<=24||y>=7&&y<=16&&(Math.abs(x-y)<2||Math.abs(x-(31-y))<2);
    const color=ink?[19,23,18]:[154,223,208]; // BGRA
    data.set([...color,255],(y*size+x)*4);
  }
  return nativeImage.createFromBitmap(data,{width:size,height:size});
}
async function start(){
  await app.whenReady();
  app.setAppUserModelId('MZ.Wardogs.Overlay');
  protocol.handle('wardogs',async request=>{
    const file=allowedFile(request.url);
    if(!file)return new Response('Not found',{status:404});
    try{
      const response=await net.fetch(pathToFileURL(file).href),headers=new Headers(response.headers);
      if(!file.endsWith('.webp'))headers.set('Cache-Control','no-store');
      if(/\.(mjs|js)$/.test(file))headers.set('Content-Type','text/javascript');
      if(file.endsWith('.html'))headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'");
      return new Response(response.body,{status:response.status,headers});
    }catch{return new Response('Not found',{status:404});}
  });
  const area=screen.getPrimaryDisplay().workArea;
  let bounds={x:area.x+area.width-Math.min(440,area.width),y:area.y+24,width:Math.min(440,area.width),height:Math.min(570,area.height-24)};
  const b=settings.bounds;
  if(b&&['x','y','width','height'].every(k=>Number.isFinite(b[k]))){
    const d=screen.getDisplayMatching(b).workArea,w=clamp(b.width,440,d.width,440),h=clamp(b.height,520,d.height,570);
    bounds={width:w,height:h,x:clamp(b.x,d.x,d.x+d.width-w,d.x),y:clamp(b.y,d.y,d.y+d.height-h,d.y)};
  }
  mapWindow=createWindow({...bounds,minWidth:440,minHeight:520,title:'MZ Wardogs Overlay'});
  sightWindow=createWindow({...screen.getPrimaryDisplay().bounds,transparent:true,resizable:false,skipTaskbar:true,focusable:false,title:'MZ 全屏瞄具'});
  mapWindow.on('close',save);
  mapWindow.on('closed',()=>app.quit());
  for(const win of [mapWindow,sightWindow])win.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
  ipcMain.handle('overlay-command',(event,name,value)=>{if(!trusted(event))throw new Error('Untrusted sender');return command(name,value);});
  ipcMain.on('solution',(event,data)=>{
    if(!trusted(event)||event.sender!==mapWindow.webContents)return;
    solution=data&&Number.isFinite(data.distance)&&data.distance>=0&&(data.bearing===null||Number.isFinite(data.bearing)&&data.bearing>=0&&data.bearing<360)&&typeof data.weaponId==='string'?{distance:data.distance,bearing:data.bearing,weaponId:data.weaponId}:null;
    broadcast();
  });
  // Windows hotkeys accept modifiers only; a tiny native helper handles the requested physical-key chord.
  try{
    hotkeyPath=app.isPackaged?path.join(__dirname,'Hotkeys.exe'):require('./build-hotkeys.cjs')();
    await new Promise((resolve,reject)=>{
      hotkeys=spawn(hotkeyPath,[String(process.pid)],{windowsHide:true,stdio:['ignore','pipe','pipe']});
      const timer=setTimeout(()=>reject(new Error('快捷键启动超时')),5000);
      hotkeys.on('error',error=>{clearTimeout(timer);reject(error);});
      createInterface({input:hotkeys.stdout}).on('line',line=>{
        if(line==='READY'){clearTimeout(timer);resolve();}
        else if(line==='1')setInteraction(!interactive);
        else if(line==='2')toggleSight();
        else if(line==='3')toggleHidden();
      });
      hotkeys.stderr.on('data',data=>console.error(String(data)));
      hotkeys.on('exit',()=>{clearTimeout(timer);reject(new Error('快捷键进程已退出'));shortcutErrors.push('请重启程序');broadcast();});
    });
  }catch(error){hotkeys?.kill();shortcutErrors.push(error.message);}
  tray=new Tray(icon());tray.setToolTip('MZ Wardogs Overlay');tray.on('double-click',showMap);trayMenu();
  screen.on('display-removed',()=>{mapWindow.setPosition(screen.getPrimaryDisplay().workArea.x,screen.getPrimaryDisplay().workArea.y);if(sightMode)sightWindow.setBounds(screen.getDisplayMatching(mapWindow.getBounds()).bounds);showMap();});
  screen.on('display-metrics-changed',()=>{if(sightMode)sightWindow.setBounds(screen.getDisplayMatching(sightWindow.getBounds()).bounds);});
  await Promise.all([mapWindow.loadURL('wardogs://app/index.html'),sightWindow.loadURL('wardogs://app/desktop/sight.html')]);
  if(settings.compact===true)toggleCompact();
  mapWindow.show();broadcast();
  if(smoke){
    try{await require('./smoke-test.cjs')({mapWindow,sightWindow,command,state,allowedFile,root,app,hotkeyPath});app.exit(0);}
    catch(error){console.error(error);app.exit(1);}
  }
}
if(!smoke&&!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{if(mapWindow&&sightWindow)showMap();});
  app.on('before-quit',save);app.on('quit',()=>hotkeys?.kill());
  start().catch(error=>{console.error(error);if(!smoke)dialog.showErrorBox('悬浮工具启动失败',error.message);app.exit(1);});
}
