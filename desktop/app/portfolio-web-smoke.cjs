const {BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
module.exports=async({output,checks,issues})=>{
 const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
 const preview=new BrowserWindow({width:1280,height:900,show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,partition:'qa-portfolio-'+Date.now()}});
 preview.webContents.on('console-message',e=>{if(e.level==='error')issues.push(e.message);});
 const js=code=>preview.webContents.executeJavaScript(code),shot=async name=>fs.writeFileSync(path.join(path.dirname(output),name+'.png'),(await preview.webContents.capturePage()).toPNG());
 await preview.loadURL('http://127.0.0.1:8765/');await wait(250);check('landing is public static content',await js(`document.title.includes('爪爪小窝')&&typeof desktopCat==='undefined'`));
 check('landing art loaded',await js(`Array.from(document.images).every(img=>img.complete&&img.naturalWidth>0)`));
 await shot('portfolio-desktop');
 await js(`document.querySelector('[data-look="ink"]').click();document.getElementById('petDemo').click();`);await wait(100);check('landing coat and touch demo work',await js(`document.getElementById('lookCat').getAttribute('src').includes('ink')&&document.querySelector('.cat-paper').classList.contains('petted')`));
 await js(`document.getElementById('openLetter').click()`);check('landing letter opens',await js(`document.getElementById('introLetter').open`));await js(`document.getElementById('closeLetter').click()`);
 for(const width of [390,768,1280]){preview.setContentSize(width,900);await wait(80);check(`landing fits ${width}px viewport`,await js(`document.documentElement.scrollWidth<=innerWidth+1&&document.body.scrollWidth<=innerWidth+1&&document.querySelector('.hero h1').getBoundingClientRect().right<=innerWidth`));if(width===390)await shot('portfolio-mobile');}
 await preview.loadURL('http://127.0.0.1:8765/play/');await wait(200);check('web game starts without GPT login',await js(`typeof desktopCat==='undefined'&&document.getElementById('adoptionDialog').open`));
 preview.setContentSize(390,900);await wait(80);await shot('adoption-mobile');
 await js(`document.getElementById('adoptionNext').click();document.getElementById('birthdayMonth').value='02';document.getElementById('birthdayMonth').dispatchEvent(new Event('change'));document.getElementById('birthdayDay').value='29';document.getElementById('adoptionForm').requestSubmit();`);await wait(100);
 check('browser birthday and appearance stored locally',await js(`JSON.parse(localStorage.getItem('deskcat-profile-v1')).birthday==='02-29'&&!document.getElementById('adoptionDialog').open`));
 preview.webContents.reload();await new Promise(r=>preview.webContents.once('did-finish-load',r));await wait(150);check('reload retains adoption and letters',await js(`!document.getElementById('adoptionDialog').open&&DeskcatMailbox.getProfile().letters.length>0`));
 await js(`document.getElementById('mailboxButton').click()`);await wait(80);check('mail works at mobile width',await js(`document.getElementById('mailDialog').open&&document.getElementById('mailDialog').scrollWidth<=innerWidth`));await shot('letter-mobile');
 await js(`document.getElementById('mailClose').click()`);preview.setContentSize(1180,900);await wait(100);await shot('web-room');
 preview.destroy();
};
