const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
module.exports=()=>{
  const source=path.join(__dirname,'Hotkeys.cs'),folder=path.join(__dirname,'bin'),exe=path.join(folder,'Hotkeys.exe');
  fs.mkdirSync(folder,{recursive:true});
  if(!fs.existsSync(exe)||fs.statSync(source).mtimeMs>fs.statSync(exe).mtimeMs){
    const compiler=path.join(process.env.WINDIR||'C:\\Windows','Microsoft.NET','Framework64','v4.0.30319','csc.exe');
    execFileSync(compiler,['/nologo','/target:exe','/platform:x64','/reference:System.Windows.Forms.dll','/out:'+exe,source],{windowsHide:true});
  }
  return exe;
};
