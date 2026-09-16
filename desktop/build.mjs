import { cp, mkdir, readFile, writeFile, rename, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'..');
const require=createRequire(import.meta.url),runtime=dirname(require('electron'));
const hotkeys=require('./build-hotkeys.cjs')();
// A portable folder uses Electron's native resources/app convention; no installer framework.
const out=join(here,'dist','MZ-Wardogs-Overlay'),dest=join(out,'resources','app');
await mkdir(dest,{recursive:true});
await cp(runtime,out,{recursive:true});
await rename(join(out,'electron.exe'),join(out,'MZ-Wardogs-Overlay.exe'));
for(const file of ['main.cjs','preload.cjs','smoke-test.cjs'])await cp(join(here,file),join(dest,file));
await cp(hotkeys,join(dest,'Hotkeys.exe'));
const manifest=JSON.parse(await readFile(join(here,'package.json'),'utf8'));
await writeFile(join(dest,'package.json'),JSON.stringify({name:manifest.name,productName:manifest.productName,version:manifest.version,main:'main.cjs'}));
const web=join(dest,'web');await mkdir(join(web,'desktop'),{recursive:true});
for(const file of ['index.html','app.js','style.css','core.mjs','routing.mjs','roads-bakurani.mjs','roads-ozeti.mjs','roads-zestafona.mjs','favicon.svg','THIRD_PARTY_NOTICES.md'])await cp(join(root,file),join(web,file));
for(const file of ['overlay.css','sight.html','sight.css','sight.mjs'])await cp(join(here,file),join(web,'desktop',file));
await cp(join(root,'assets'),join(web,'assets'),{recursive:true});
await cp(join(here,'README.md'),join(out,'README.md'));
for(const file of ['roads-ozeti.mjs','roads-zestafona.mjs','assets/maps/ozeti/zoom_0/0_0.webp'])await access(join(web,file));
console.log(`Portable overlay: ${join(out,'MZ-Wardogs-Overlay.exe')}`);
if(!process.argv.includes('--no-zip')){
  const zip=join(here,'dist',`MZ-Wardogs-Overlay-v${manifest.version}-win-x64.zip`),temporary=zip+`.${process.pid}.tmp`;
  const quote=value=>"'"+value.replaceAll("'","''")+"'";
  execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
    `Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory(${quote(out)},${quote(temporary)},[System.IO.Compression.CompressionLevel]::Optimal,$false)`],{windowsHide:true,stdio:'inherit'});
  await rename(temporary,zip);
  console.log(`Release ZIP: ${zip}`);
}
