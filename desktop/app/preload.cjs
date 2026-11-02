'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopCat',{
  initial:ipcRenderer.sendSync('cat:initial'),
  chatState:()=>ipcRenderer.invoke('chat:state'),
  chatConfigure:patch=>ipcRenderer.invoke('chat:configure',patch),
  chatSend:text=>ipcRenderer.invoke('chat:send',text),
  chatCancel:()=>ipcRenderer.invoke('chat:cancel'),
  chatRemoveKey:()=>ipcRenderer.invoke('chat:remove-key'),
  chatClear:()=>ipcRenderer.invoke('chat:clear'),
  chatMemory:patch=>ipcRenderer.invoke('chat:memory',patch),
  onChatState:callback=>{const f=(_,v)=>callback(v);ipcRenderer.on('cat:chat-state',f);return()=>ipcRenderer.removeListener('cat:chat-state',f);},
  onChatReply:callback=>{const f=(_,v)=>callback(v);ipcRenderer.on('cat:chat-reply',f);return()=>ipcRenderer.removeListener('cat:chat-reply',f);},
  savePet:pet=>ipcRenderer.send('cat:save',pet),
  saveProfile:patch=>ipcRenderer.send('cat:profile',patch),
  readLetter:id=>ipcRenderer.send('cat:read-letter',id),
  command:name=>ipcRenderer.send('cat:command',name),
  action:name=>ipcRenderer.send('cat:interaction',name),
  preference:(key,value)=>ipcRenderer.send('cat:preference',{key,value}),
  hover:value=>ipcRenderer.send('cat:hover',value===true),
  drag:phase=>ipcRenderer.send('cat:drag',phase),
  onState:callback=>{const f=(_,v)=>callback(v);ipcRenderer.on('cat:state',f);return()=>ipcRenderer.removeListener('cat:state',f);},
  onAction:callback=>{const f=(_,v)=>callback(v);ipcRenderer.on('cat:action',f);return()=>ipcRenderer.removeListener('cat:action',f);}
});
