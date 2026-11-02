'use strict';
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const persona=require('./cat-persona.cjs');
const MODELS=['deepseek-flash','deepseek-v4-pro'];
function clean(value,max=2000){return typeof value==='string'?value.trim().slice(0,max):'';}
function preferences(text){const explicit=text.match(/^(?:请)?记住[：:，,\s]*(.{1,120})$/);if(explicit)return [explicit[1]];return (text.match(/(?:^|[。！？\n，,])(?:我(?:很|更|最|比较)?喜欢|我不喜欢|我偏爱|请叫我)[^。！？\n，,]{1,100}/g)||[]).map(s=>s.replace(/^[。！？\n，,]/,'')).slice(0,3);}
function normalize(raw={}){return {model:MODELS.includes(raw.model)?raw.model:MODELS[0],remember:raw.remember!==false,messages:(Array.isArray(raw.messages)?raw.messages:[]).filter(m=>m&&['user','assistant'].includes(m.role)&&clean(m.text)).slice(-60).map(m=>({id:clean(m.id,80)||randomUUID(),role:m.role,text:clean(m.text),time:clean(m.time,40)})),memories:(Array.isArray(raw.memories)?raw.memories:[]).filter(m=>m&&clean(m.text,120)).slice(-30).map(m=>({id:clean(m.id,80)||randomUUID(),text:clean(m.text,120),time:clean(m.time,40)}))};}
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',data);fs.renameSync(file+'.tmp',file);}
class ChatService{
 constructor({directory,safeStorage,fetchImpl=fetch,onChange=()=>{},getCat=()=>({name:'团子'}),timeout=45000}){Object.assign(this,{directory,safeStorage,fetchImpl,onChange,getCat,timeout});this.key='';this.busy=false;this.generation=0;this.keyProblem=false;this.state=normalize();this.file=path.join(directory,'chat-state.json');this.keyFile=path.join(directory,'deepseek-key.bin');}
 async init(){try{this.state=normalize(JSON.parse(fs.readFileSync(this.file,'utf8')));}catch{}if(fs.existsSync(this.keyFile)){try{this.key=(await this.safeStorage.decryptStringAsync(fs.readFileSync(this.keyFile))).result;}catch{this.keyProblem=true;}}return this.snapshot();}
 snapshot(){return JSON.parse(JSON.stringify({...this.state,configured:!!this.key,keyProblem:this.keyProblem,busy:this.busy}));}
 emit(){this.onChange(this.snapshot());}
 persist(next){const valid=normalize(next);write(this.file,JSON.stringify(valid,null,2));this.state=valid;this.emit();}
 cancel(){this.generation++;this.controller?.abort();this.busy=false;this.emit();}
 async configure(patch){if(!patch||typeof patch!=='object')throw Error('设置无效。');this.cancel();
  if(typeof patch.apiKey==='string'&&patch.apiKey.trim()){const key=patch.apiKey.trim();if(!/^[\x21-\x7e]{12,512}$/.test(key))throw Error('Key 格式不正确，请复制完整的 API Key。');if(!await this.safeStorage.isAsyncEncryptionAvailable())throw Error('本机加密存储暂不可用，Key 没有保存。');const encrypted=await this.safeStorage.encryptStringAsync(key);write(this.keyFile,encrypted);this.key=key;this.keyProblem=false;}
  const next={...this.state};if(Object.hasOwn(patch,'model')){if(!MODELS.includes(patch.model))throw Error('请选择受支持的模型。');next.model=patch.model;}if(typeof patch.remember==='boolean')next.remember=patch.remember;this.persist(next);return this.snapshot();
 }
 removeKey(){this.cancel();fs.rmSync(this.keyFile,{force:true});this.key='';this.keyProblem=false;this.emit();return this.snapshot();}
 clearHistory(){this.cancel();this.persist({...this.state,messages:[]});return this.snapshot();}
 memory(action,value){this.cancel();let list=[...this.state.memories];if(action==='add'){const text=clean(value,120);if(!text)throw Error('先写下一件想让小猫记住的事。');list=list.filter(m=>m.text!==text);list.push({id:randomUUID(),text,time:new Date().toISOString()});}else if(action==='remove')list=list.filter(m=>m.id!==value);else if(action==='clear')list=[];else throw Error('记忆操作无效。');this.persist({...this.state,memories:list.slice(-30)});return this.snapshot();}
 async send(input){const text=clean(input);if(!text)throw Error('先和小猫说一句话吧。');if(typeof input!=='string'||input.length>2000)throw Error('这条消息太长了，先说 2000 字以内吧。');if(!this.key)throw Error('请先在聊天设置中填写自己的 DeepSeek API Key。');if(this.busy)throw Error('小猫还在回复，可以稍等或点停止。');
  this.busy=true;const generation=++this.generation;this.controller=new AbortController();const controller=this.controller;let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},this.timeout);this.emit();
  try{const identity={catName:clean(this.getCat().name,12),date:new Date().toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}),preferences:this.state.remember?this.state.memories.map(m=>m.text):[]};
   const system=persona.prompt(identity),fixed=persona.boundaryReply(text);let reply;
   const messages=[{role:'system',content:system},...this.state.messages.slice(-16).map(m=>({role:m.role,content:m.text})),{role:'user',content:text}];
   if(fixed){reply=fixed;}else{const res=await this.fetchImpl('https://api.deepseek.com/chat/completions',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+this.key,'Content-Type':'application/json'},body:JSON.stringify({model:this.state.model,messages,thinking:{type:'disabled'},max_tokens:512,stream:false}),signal:controller.signal});
   if(!res.ok){const errors={401:'Key 无效或已失效，请在设置中重新填写。',402:'DeepSeek 余额不足，请检查你的 API 账户。',403:'DeepSeek 暂不允许这次请求，请检查账户权限。',429:'请求有点频繁，请稍后再试。'};throw Error(errors[res.status]||(res.status>=500?'DeepSeek 暂时没有回应，稍后再试吧。':'DeepSeek 未接受请求，请检查模型与账户设置。'));}
   const data=await res.json();reply=clean(data?.choices?.[0]?.message?.content);if(!reply)throw Error('这次没有收到有效回复，可以再试一次。');}reply=persona.limitReply(reply);if(generation!==this.generation||controller.signal.aborted)throw Error('这次回复已停止。');
   const time=new Date().toISOString();let memories=[...this.state.memories];const learned=this.state.remember?preferences(text):[];for(const note of learned){memories=memories.filter(m=>m.text!==note);memories.push({id:randomUUID(),text:note,time});}
   this.persist({...this.state,messages:[...this.state.messages,{id:randomUUID(),role:'user',text,time},{id:randomUUID(),role:'assistant',text:reply,time}],memories:memories.slice(-30)});return {reply,learned,state:this.snapshot()};
  }catch(e){if(generation!==this.generation)throw Error('这次回复已停止。');if(timedOut)throw Error('等得有点久了，请检查网络后再试。');if(controller.signal.aborted)throw Error('这次回复已停止。');const allowed=/^(Key |DeepSeek |请求有点|这次没有|这次回复)/;throw Error(allowed.test(e.message)?e.message:'暂时连接不上 DeepSeek。请检查网络后再试，消息没有丢失。');}
  finally{clearTimeout(timer);if(generation===this.generation){this.busy=false;this.emit();}}
 }
}
module.exports={ChatService,preferences,normalize};
