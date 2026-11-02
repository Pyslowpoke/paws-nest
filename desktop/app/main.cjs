'use strict';
const {app,BrowserWindow,Tray,Menu,nativeImage,ipcMain,screen,safeStorage}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const model=require('./room/pet-model.js'),mail=require('./room/mail-model.js'),{fit}=require('./window-state.cjs');
const chatSmokeArg=process.argv.find(v=>v.startsWith('--chat-smoke='));
const smokeArg=process.argv.find(v=>v.startsWith('--smoke='));
if(chatSmokeArg)app.setPath('userData',path.join(path.dirname(chatSmokeArg.slice(13)),'chat-smoke-profile'));
const {ChatService}=require('./chat-service.cjs');let chat;
if(smokeArg)app.setPath('userData',path.join(path.dirname(smokeArg.slice(8)),'smoke-profile'));
app.setName('LittleDeskcat');
if(process.platform==='win32')app.setAppUserModelId('little.deskcat.companion');
let pet,house,tray,quitting=false,settings,saveTimer,dragStart,settingsFile,ignored;
const owned=e=>[pet?.webContents,house?.webContents].includes(e.sender);
const snapshot=()=>({...settings,petVisible:pet?.isVisible()||false});
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{fs.mkdirSync(path.dirname(settingsFile),{recursive:true});fs.writeFileSync(settingsFile+'.tmp',JSON.stringify(settings,null,2));fs.renameSync(settingsFile+'.tmp',settingsFile);}catch(e){console.error('Settings could not be saved:',e.message);}},180);}
function broadcast(){for(const w of [pet,house])if(w&&!w.isDestroyed())w.webContents.send('cat:state',snapshot());refreshMenu();}
function mouse(ignore){if(pet&&!pet.isDestroyed()&&ignore!==ignored){pet.setIgnoreMouseEvents(ignore,{forward:true});ignored=ignore;}}
function showPet(){if(!settings.profile.completed){showHouse();return;}pet.setAlwaysOnTop(settings.pinned);pet.showInactive();mouse(settings.clickThrough);house?.webContents.send('cat:action','leave-house');broadcast();}
function showHouse(action){house.show();house.focus();if(action)house.webContents.send('cat:action',action);}
function refreshMenu(){if(!tray)return;tray.setToolTip(`${settings.pet.name} · 爪爪小窝${settings.clickThrough?' · 鼠标穿透中':''}`);tray.setContextMenu(Menu.buildFromTemplate([
  {label:pet?.isVisible()?'暂时收起小猫':'让小猫回来',click:()=>{if(pet.isVisible())pet.hide();else showPet();broadcast();}},
  {label:'打开小屋 / 调整外观',click:()=>showHouse()},
  {label:'和小猫聊聊',click:()=>showHouse('chat')},
  {label:`打开小猫信箱${settings.profile.letters.some(l=>!l.read)?' · 有新信':''}`,click:()=>showHouse('mailbox')},
  {type:'separator'},
  {label:'保持桌面置顶',type:'checkbox',checked:settings.pinned,click:i=>setPreference('pinned',i.checked)},
  {label:settings.clickThrough?'恢复鼠标交互':'鼠标穿透（用托盘恢复）',type:'checkbox',checked:settings.clickThrough,click:i=>setPreference('clickThrough',i.checked)},
  {label:'安静陪伴',type:'checkbox',checked:settings.pet.quiet,click:i=>{settings.pet.quiet=i.checked;persist();broadcast();}},
  {label:'把小猫放回屏幕右下角',click:()=>{const a=screen.getPrimaryDisplay().workArea;pet.setPosition(a.x+a.width-380,a.y+a.height-480);rememberPosition();showPet();}},
  {type:'separator'},{label:'退出爪爪小窝',click:()=>app.quit()}
]));}
function setPreference(key,value){if(['pinned','clickThrough'].includes(key)&&typeof value==='boolean')settings[key]=value;else if(key==='size'&&['small','medium','large'].includes(value))settings.size=value;else return;pet.setAlwaysOnTop(settings.pinned);mouse(settings.clickThrough);persist();broadcast();}
function rememberPosition(){if(pet&&!pet.isDestroyed()){settings.position=pet.getBounds();persist();}}
function secure(w){w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());w.webContents.session.setPermissionRequestHandler((_,__,done)=>done(false));w.webContents.on('will-attach-webview',e=>e.preventDefault());}
function command(name){switch(name){
  case 'show-pet':showPet();break;
  case 'hide-pet':pet.hide();broadcast();break;
  case 'house':showHouse();break;
  case 'mail':showHouse('mailbox');break;
  case 'chat':showHouse('chat');break;
  case 'home':showHouse('sleepNest');pet.hide();broadcast();break;
  case 'menu':refreshMenu();tray.popUpContextMenu();break;
  case 'quit':app.quit();break;
}}
ipcMain.on('cat:initial',e=>{e.returnValue=owned(e)?snapshot():null;});
ipcMain.on('cat:save',(e,raw)=>{if(!owned(e)||!raw||typeof raw!=='object')return;settings.pet=model.normalize(raw);persist();broadcast();});
ipcMain.on('cat:profile',(e,patch)=>{if(!owned(e)||!patch||typeof patch!=='object')return;const p=mail.normalize(settings.profile);if(Object.hasOwn(patch,'birthday'))p.birthday=mail.birthday(patch.birthday);if(patch.completed===true)p.completed=true;settings.profile=mail.advance(p,settings.pet.name).profile;persist();broadcast();});
ipcMain.on('cat:read-letter',(e,id)=>{if(!owned(e)||typeof id!=='string')return;settings.profile=mail.markRead(settings.profile,id);persist();broadcast();});
ipcMain.on('cat:command',(e,name)=>{if(owned(e)&&typeof name==='string')command(name);});
ipcMain.on('cat:interaction',(e,name)=>{if(owned(e)&&(Object.hasOwn(model.actions,name)||['wake','sleepDesk'].includes(name)))pet.webContents.send('cat:action',name);});
ipcMain.on('cat:preference',(e,v)=>{if(owned(e)&&v&&typeof v==='object')setPreference(v.key,v.value);});
ipcMain.on('cat:hover',(e,hit)=>{if(e.sender===pet?.webContents&&!dragStart)mouse(settings.clickThrough||hit!==true);});
ipcMain.on('cat:drag',(e,phase)=>{if(e.sender!==pet?.webContents||settings.clickThrough)return;
  if(phase==='start'){dragStart={cursor:screen.getCursorScreenPoint(),bounds:pet.getBounds()};mouse(false);}
  else if(phase==='move'&&dragStart){const p=screen.getCursorScreenPoint();pet.setBounds(fit({...dragStart.bounds,x:dragStart.bounds.x+p.x-dragStart.cursor.x,y:dragStart.bounds.y+p.y-dragStart.cursor.y},screen.getAllDisplays()));}
  else if(phase==='end'){dragStart=null;rememberPosition();}
});
for(const [channel,fn] of Object.entries({
 'chat:state':()=>chat.snapshot(), 'chat:configure':patch=>chat.configure(patch),
 'chat:send':async text=>{const result=await chat.send(text);pet?.webContents.send('cat:chat-reply',result.reply);return result;},
 'chat:cancel':()=>{chat.cancel();return chat.snapshot();}, 'chat:remove-key':()=>chat.removeKey(),
 'chat:clear':()=>chat.clearHistory(), 'chat:memory':patch=>chat.memory(patch?.action,patch?.value)
})){ipcMain.handle(channel,async(e,payload)=>{if(!owned(e)||!chat)return {ok:false,error:'当前窗口无法使用聊天。'};try{return {ok:true,value:await fn(payload)};}catch(error){const message=error.message||'';return {ok:false,error:/^(设置|Key |本机|请选择|请先|这|先|小猫|DeepSeek |请求|等得|暂时|记忆|当前|本地)/.test(message)?message:'操作没有完成，请检查本地存储权限后重试。'};}});}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',()=>{showPet();showHouse();});
 app.whenReady().then(async()=>{
  chat=new ChatService({directory:app.getPath('userData'),safeStorage,getCat:()=>settings?.pet||{name:'团子'},onChange:value=>{for(const w of [pet,house])if(w&&!w.isDestroyed())w.webContents.send('cat:chat-state',value);}});await chat.init();
  settingsFile=path.join(app.getPath('userData'),'companion.json');let raw={};try{raw=JSON.parse(fs.readFileSync(settingsFile,'utf8'));}catch{}
  settings={pet:model.normalize(raw.pet),profile:mail.advance(mail.normalize(raw.profile),raw.pet?.name).profile,pinned:raw.pinned!==false,clickThrough:raw.clickThrough===true,size:['small','medium','large'].includes(raw.size)?raw.size:'medium',position:raw.position};
  const area=screen.getPrimaryDisplay().workArea;
  const safe=raw.position&&Number.isFinite(raw.position.x)&&Number.isFinite(raw.position.y)?{x:raw.position.x,y:raw.position.y}: {x:area.x+area.width-380,y:area.y+area.height-480};
  const bounds=fit({...safe,width:360,height:470},screen.getAllDisplays());
  const webPreferences={preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webviewTag:false};
  pet=new BrowserWindow({...bounds,show:false,title:'爪爪小窝 · 桌宠',frame:false,transparent:true,backgroundColor:'#00000000',hasShadow:false,resizable:false,maximizable:false,fullscreenable:false,skipTaskbar:true,alwaysOnTop:settings.pinned,webPreferences});
  house=new BrowserWindow({width:1190,height:850,minWidth:930,minHeight:680,show:false,title:'爪爪小窝 · 小屋',backgroundColor:'#f6f3e9',autoHideMenuBar:true,icon:path.join(__dirname,'icon.png'),webPreferences});
  house.removeMenu();secure(pet);secure(house);
  pet.on('close',e=>{if(!quitting){e.preventDefault();pet.hide();broadcast();}});
  house.on('close',e=>{if(!quitting){e.preventDefault();house.hide();if(!pet.isVisible())showPet();}});
  pet.on('moved',rememberPosition);
  screen.on('display-removed',()=>{pet.setBounds(fit(pet.getBounds(),screen.getAllDisplays()));rememberPosition();});
  screen.on('display-metrics-changed',()=>{pet.setBounds(fit(pet.getBounds(),screen.getAllDisplays()));rememberPosition();});
  tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')).resize({width:24,height:24}));
  tray.on('click',()=>showPet());tray.on('double-click',()=>showHouse());refreshMenu();
  const issues=[];for(const w of [pet,house]){w.webContents.on('console-message',event=>{if(event.level==='error')issues.push(event.message);});w.webContents.on('render-process-gone',(_,d)=>issues.push(d.reason));}
  await Promise.all([pet.loadFile(path.join(__dirname,'room/index.html'),{query:{surface:'pet'}}),house.loadFile(path.join(__dirname,'room/index.html'),{query:{surface:'house'}})]);
  showPet();if(!settings.profile.completed)showHouse();
  setInterval(()=>{const r=mail.advance(settings.profile,settings.pet.name);if(r.added.length||r.profile.lastChecked!==settings.profile.lastChecked){settings.profile=r.profile;persist();broadcast();}},60000).unref();
  if(chatSmokeArg){try{await require('./chat-smoke.cjs')({pet,house,chat,command,settings,output:chatSmokeArg.slice(13),app,issues});}catch(e){fs.writeFileSync(chatSmokeArg.slice(13),JSON.stringify({passed:false,error:e.stack,issues},null,2));app.exit(1);}}
  if(smokeArg){try{await require('./portfolio-smoke.cjs')({pet,house,settings,snapshot,command,setPreference,fit,issues,output:smokeArg.slice(8),app});}catch(e){fs.writeFileSync(smokeArg.slice(8),JSON.stringify({passed:false,error:e.stack,issues},null,2));app.exit(1);}}
 });
 app.on('before-quit',()=>{quitting=true;chat?.cancel();if(settingsFile&&settings){clearTimeout(saveTimer);try{fs.writeFileSync(settingsFile,JSON.stringify(settings,null,2));}catch{}}});
 app.on('window-all-closed',()=>{});
}
