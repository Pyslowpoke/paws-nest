(() => {
  'use strict';
  const $=id=>document.getElementById(id), model=window.DeskcatPet, copy=window.DeskcatCopy;
  const key='deskcat-mvp-v1';
  let data=model.normalize(null), canSave=true;
  try{data=model.normalize(JSON.parse(localStorage.getItem(key)));}catch{canSave=false;}
  let state='idle',place='desk',actionTimer,moveTimer,speechTimer,toastTimer,actionStart=0,gazeX=0,gazeY=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function save(){try{localStorage.setItem(key,JSON.stringify(data));window.desktopCat?.savePet(data);canSave=true;$('saveState').textContent='已保存在这台电脑';}catch{canSave=false;$('saveState').textContent='当前无法保存，关闭页面后设置会丢失';}}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
  function updateClock(now=new Date()){
    document.querySelector('.room').dataset.period=now.getHours()<5?'night':now.getHours()<11?'morning':now.getHours()<18?'day':'evening';
    $('greeting').textContent=copy.greetingForHour(now.getHours())+'，很高兴见到你。';
    $('localClock').textContent=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');$('localClock').dateTime=now.toISOString();
    const calendar=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());$('day').textContent='相遇的第 '+Math.max(1,1+Math.floor((calendar(now)-calendar(new Date(data.adopted)))/86400000))+' 天';
  }
  let lastQuote=-1;try{lastQuote=Number(sessionStorage.getItem('deskcat-last-quote')??-1);}catch{}
  function refreshQuote(){const q=copy.chooseQuote(lastQuote);lastQuote=q.index;$('quote').textContent=q.text;try{sessionStorage.setItem('deskcat-last-quote',String(lastQuote));}catch{}}
  function render(){
    const c=model.coats[data.coat];for(const k of ['fur','patch','stripe'])document.documentElement.style.setProperty('--'+k,c[k]);
    document.documentElement.style.setProperty('--eye-color',data.eyeColor);$('cat').dataset.pattern=c.pattern;$('cat').dataset.coat=data.coat;
    $('petName').textContent=data.name;$('nameInput').value=data.name;$('coatName').textContent=c.name;
    document.querySelectorAll('[data-coat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.coat===data.coat)));
    $('eyeColor').value=data.eyeColor;$('mouthShape').value=data.mouth;$('tailLength').value=Math.round(data.tailLength*100);$('tailValue').textContent=Math.round(data.tailLength*100)+'%';
    $('eyeSize').value=Math.round(data.eyeSize*100);$('eyeSizeValue').textContent=Math.round(data.eyeSize*100)+'%';
    document.querySelectorAll('.eye-open ellipse').forEach(e=>{e.setAttribute('rx',4.2*data.eyeSize);e.setAttribute('ry',5*data.eyeSize);});
    const s=data.eyeSize;cat.querySelector('.eye-happy').setAttribute('d',`M${72-6*s} 154 Q72 ${154-7*s} ${72+6*s} 154 M${116-6*s} 153 Q116 ${153-7*s} ${116+6*s} 153`);
    $('mouth').setAttribute('d',{cat:'M95 172 V177 M89 177 Q92 182 95 177 Q98 182 101 177',smile:'M89 176 Q95 185 101 176',dot:'M94 179 H96'}[data.mouth]);
    $('quiet').setAttribute('aria-pressed',String(data.quiet));if(data.quiet)$('speech').classList.remove('show');
    if(!canSave)$('saveState').textContent='当前无法保存，关闭页面后设置会丢失';
    updateState();updateClock();requestMotion();
  }
  function updateState(){
    const sleep=model.isSleeping(state),busy=model.isBusy(state);
    $('status').textContent=model.actions[state]?.status||({idle:'正在安静地陪着你',sleepDesk:'趴在桌面上，下巴枕着小爪子',sleepNest:'在猫窝里蜷成了一个小团子',settling:'正在找一个舒服的位置'})[state];
    $('hint').textContent=busy?'等它回应完，再轻轻碰一下。':sleep?'睡着了，可以轻轻叫醒它。':data.quiet?'需要它的时候，轻轻摸一下。':'试试摸摸头、耳朵、尾巴或爪子。';
    $('roomLabel').textContent=place==='nest'?'小猫的软软窝':'一个安静的桌边角落';
    document.querySelector('.room').classList.toggle('nest-view',place==='nest');$('catButton').classList.toggle('in-nest',place==='nest');$('catButton').classList.toggle('napping',sleep||state==='settling');
    $('speech').classList.toggle('nest-speech',place==='nest');
    document.querySelectorAll('[data-touch],[data-food],[data-sleep],[data-bed]').forEach(b=>b.disabled=busy);
    const inBed=state==='sleepNest';document.querySelectorAll('[data-bed]').forEach(b=>{b.setAttribute('aria-pressed',String(inBed));b.setAttribute('aria-label',inBed?'轻轻叫醒猫窝里的小猫':'让小猫回猫窝休息');});
    $('bedTitle').textContent=inBed?'小猫正在软软窝里睡觉':'给它留好的软软窝';$('bedDetail').textContent=inBed?'轻轻点一下，叫它醒来':'点一下，回窝休息一会儿';
    $('wake').disabled=busy||(!sleep&&place==='desk');
    requestMotion();
  }
  function say(message){clearTimeout(speechTimer);if(data.quiet)return;$('speech').textContent=message;$('speech').classList.add('show');speechTimer=setTimeout(()=>$('speech').classList.remove('show'),3000);}
  function relocate(destination,then){
    clearTimeout(actionTimer);clearTimeout(moveTimer);
    if(place===destination){then();return;}
    state='settling';$('catButton').classList.add('relocating');$('speech').classList.remove('show');updateState();
    moveTimer=setTimeout(()=>{place=destination;updateState();moveTimer=setTimeout(()=>{$('catButton').classList.remove('relocating');then();},reduced.matches?0:850);},reduced.matches?0:280);
  }
  function interact(action,local=false){
    if(!local&&window.desktopSurface==='house'&&window.desktopSnapshot.petVisible){window.desktopCat.action(action);return;}
    if(model.isBusy(state)||!model.actions[action])return;
    const run=()=>{state=action;actionStart=performance.now();updateState();say(model.actions[action].speech);actionTimer=setTimeout(()=>{state='idle';updateState();},model.actions[action].duration);};
    if(place==='nest')relocate('desk',run);else run();
  }
  function sleepAt(destination,local=false){if(!local&&window.desktopSurface==='house'&&window.desktopSnapshot.petVisible){if(destination==='desk'){window.desktopCat.action('sleepDesk');return;}window.desktopCat.command('hide-pet');}if(model.isBusy(state))return;if(destination==='nest')dock.close();relocate(destination,()=>{state=destination==='nest'?'sleepNest':'sleepDesk';updateState();say(destination==='nest'?'窝里软软的……':'就在你旁边睡一会儿。');});}
  function wake(local=false){if(!local&&window.desktopSurface==='house'&&window.desktopSnapshot.petVisible){window.desktopCat.action('wake');return;}if(model.isBusy(state))return;relocate('desk',()=>{state='idle';updateState();say('嗯？我醒啦。');});}
  function selectMenu(menu){for(const name of ['touch','food','sleep']){$(name+'Options').hidden=name!==menu;document.querySelector('[data-menu="'+name+'"]').setAttribute('aria-selected',String(name===menu));}}

  const cat=$('cat'),names=['head','body-breathe','tail','ear','eyes','eye-open','eye-happy','eye-sleep','hearts','sleep-z','normal-cat','desk-nap','nest-nap','kibble-food','can-food','lifted-paw','sparkles'];
  const dock=window.DeskcatCompanion.create();
  const parts=Object.fromEntries(names.map(name=>[name,cat.querySelector('.'+name)]));
  const outline=cat.querySelector('#lineCatOutline'),clip=cat.querySelector('#lineCatClipPath'),whiskers=cat.querySelector('.whisker-motion');
  const deform=window.CatContour.createDeformer(outline.getAttribute('d'));
  const pose={headR:0,headY:0,bodyY:0,breath:0,tailR:0,earR:0,eye:1,happy:0,sleep:0,kibble:0,can:0,heart:0,gazeX:0,gazeY:0,paw:0,deskNap:0,nestNap:0,sparkle:0};
  let frame=0,previous=0,nextBlink=performance.now()+4000,blinkStart=-1000;
  function requestMotion(){if(!frame&&!document.hidden)frame=requestAnimationFrame(animate);}
  function animate(now){
    if(previous&&now-previous<31){frame=requestAnimationFrame(animate);return;}
    frame=0;const dt=previous?Math.min(.05,(now-previous)/1000):1/60;previous=now;
    const t=now/1000,still=data.quiet||reduced.matches,active=!still,elapsed=(now-actionStart)/1000;
    const descriptor=model.actions[state],duration=(descriptor?.duration||3000)/1000,p=Math.min(1,Math.max(0,elapsed/duration)),env=Math.sin(Math.PI*p);
    const head=state==='head',ears=state==='ears',tail=state==='tail',paw=state==='paw',kibble=state==='kibble',can=state==='can',sleep=model.isSleeping(state);
    const excited=can&&elapsed<1.1,chewing=kibble||(can&&elapsed>=1.1),enjoy=head||paw||chewing;
    if(now>=nextBlink){blinkStart=now;nextBlink=now+4200+Math.random()*4500;}
    const age=now-blinkStart,blink=active&&age>=0&&age<240?Math.sin(Math.PI*age/240):0;
    const wave=active?env:0;
    const targets={
      headR:head?5*wave*Math.sin(elapsed*2.8):ears?-6*wave:tail?8*wave:chewing?2*wave*Math.sin(elapsed*7):excited?-3*wave:active?.7*Math.sin(t*.7):0,
      headY:head?-3*wave:chewing?5*wave*(.5+.5*Math.sin(elapsed*7)):paw?-2*wave:active?-.6*Math.sin(t*1.25):0,
      bodyY:excited&&active?-6*Math.abs(Math.sin(elapsed*7)):0,
      breath:active?Math.sin(t*(sleep?.95:1.25))*.007:0,
      tailR:tail?16*wave*Math.sin(elapsed*8):can&&active?-9+7*Math.sin(t*5):active?3.5*Math.sin(t*.85)+1.2*Math.sin(t*1.7+.4):0,
      earR:ears?-12*wave*Math.sin(elapsed*11):excited&&active?-6:active?1.3*Math.sin(t*1.1+1)+(head?-3*env:0):0,
      eye:enjoy?.06:excited?1.35:1-blink*.95,happy:enjoy?1:0,sleep:sleep?1:0,
      kibble:kibble?1:0,can:can?1:0,heart:head?wave:0,paw:paw?Math.sin(Math.PI*p)**.6:0,
      deskNap:state==='sleepDesk'?1:0,nestNap:state==='sleepNest'?1:0,sparkle:excited&&active?1:0,
      gazeX:tail?2*wave:state==='idle'&&active?gazeX:0,gazeY:state==='idle'&&active?gazeY:0
    };
    let unsettled=false;for(const name of Object.keys(pose)){const rate=name==='eye'?25:name==='headR'||name==='headY'?8:9;pose[name]+=(targets[name]-pose[name])*(reduced.matches?1:1-Math.exp(-rate*dt));if(Math.abs(targets[name]-pose[name])>.002)unsettled=true;}
    parts.head.style.transform=`translateY(${pose.headY}px) rotate(${pose.headR}deg)`;
    whiskers.style.transform=parts.head.style.transform;
    const contour=deform(pose.headR,pose.headY,pose.earR);outline.setAttribute('d',contour);clip.setAttribute('d',contour);
    parts['body-breathe'].style.transform=`translateY(${pose.bodyY}px) scale(${1+pose.breath*.3},${1+pose.breath})`;
    parts.tail.style.transform=`rotate(${pose.tailR}deg) scaleX(${data.tailLength})`;parts.ear.style.transform=`rotate(${pose.earR}deg)`;
    parts.eyes.style.transform=`translate(${pose.gazeX}px,${pose.gazeY}px)`;
    parts['eye-open'].setAttribute('transform',`translate(0 154) scale(1 ${pose.eye}) translate(0 -154)`);parts['eye-open'].style.opacity=1-pose.happy;parts['eye-happy'].style.opacity=pose.happy;parts['eye-sleep'].style.opacity=0;
    parts['normal-cat'].style.opacity=1-Math.max(pose.deskNap,pose.nestNap);parts['desk-nap'].style.opacity=pose.deskNap;parts['nest-nap'].style.opacity=pose.nestNap;
    for(const s of ['desk-nap','nest-nap'])parts[s].style.transform=`scale(${1+pose.breath*.3},${1+pose.breath})`;
    parts['kibble-food'].style.opacity=pose.kibble;parts['can-food'].style.opacity=pose.can;
    parts['lifted-paw'].style.opacity=pose.paw;parts['lifted-paw'].style.transform=`translateY(${-28*pose.paw}px) rotate(${-12*pose.paw}deg)`;
    parts.hearts.style.opacity=pose.heart;parts.hearts.style.transform=`translateY(${-Math.min(elapsed,3.4)*4}px)`;
    parts.sparkles.style.opacity=pose.sparkle;parts['sleep-z'].style.opacity=active?pose.sleep*(.5+.25*Math.sin(t*1.4)):0;
    if(active||unsettled)requestMotion();
  }
  document.querySelectorAll('[data-touch]').forEach(b=>b.addEventListener('click',()=>interact(b.dataset.touch)));
  document.querySelectorAll('[data-food]').forEach(b=>b.addEventListener('click',()=>interact(b.dataset.food)));
  document.querySelectorAll('[data-sleep]').forEach(b=>b.addEventListener('click',()=>sleepAt(b.dataset.sleep)));
  document.querySelectorAll('[data-bed]').forEach(b=>b.addEventListener('click',()=>state==='sleepNest'?wake():sleepAt('nest')));
  $('companionLaunch').addEventListener('click',()=>{if(model.isBusy(state)){toast('等小猫回应完，再带它过来。');return;}relocate('desk',()=>{state='idle';updateState();dock.open();});});
  document.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>selectMenu(b.dataset.menu)));$('wake').addEventListener('click',()=>wake());
  $('nameForm').addEventListener('submit',e=>{e.preventDefault();const name=$('nameInput').value.trim();if(!name){toast('给小猫留一个名字吧。');return;}data.name=name.slice(0,12);save();render();toast(canSave?'记住啦，它叫'+data.name+'。':'名字已更改，但当前无法保存。');});
  document.querySelectorAll('[data-coat]').forEach(b=>b.addEventListener('click',()=>{data.coat=b.dataset.coat;data.eyeColor=model.coats[data.coat].eye;save();render();}));
  $('eyeColor').addEventListener('input',e=>{data.eyeColor=e.target.value;save();render();});$('mouthShape').addEventListener('change',e=>{data.mouth=e.target.value;save();render();});
  $('tailLength').addEventListener('input',e=>{data.tailLength=Number(e.target.value)/100;save();render();});
  $('eyeSize').addEventListener('input',e=>{data.eyeSize=Number(e.target.value)/100;save();render();});
  $('quiet').addEventListener('click',()=>{data.quiet=!data.quiet;save();render();});$('refreshQuote').addEventListener('click',refreshQuote);
  document.querySelector('.room').addEventListener('pointermove',e=>{if(data.quiet||state!=='idle'||reduced.matches)return;const r=$('catButton').getBoundingClientRect();gazeX=Math.max(-2,Math.min(2,(e.clientX-r.left-r.width/2)/70));gazeY=Math.max(-1.3,Math.min(1.3,(e.clientY-r.top-r.height/2)/90));requestMotion();});
  document.querySelector('.room').addEventListener('pointerleave',()=>{gazeX=0;gazeY=0;requestMotion();});
  $('companionCanvas').addEventListener('pointermove',e=>{if(!dock.isOpen()||data.quiet||state!=='idle'||reduced.matches)return;const r=$('catButton').getBoundingClientRect();gazeX=Math.max(-2,Math.min(2,(e.clientX-r.left-r.width/2)/70));gazeY=Math.max(-1.3,Math.min(1.3,(e.clientY-r.top-r.height/2)/90));requestMotion();});
  $('companionCanvas').addEventListener('pointerleave',()=>{gazeX=0;gazeY=0;requestMotion();});
  reduced.addEventListener('change',render);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;}else{updateClock();requestMotion();}});setInterval(()=>updateClock(),30000);
  window.DeskcatController={interact,sleepAt,wake,say,customize:patch=>{data=model.normalize({...data,...patch});save();render();},leave:()=>{clearTimeout(actionTimer);clearTimeout(moveTimer);state='idle';place='desk';$('catButton').classList.remove('relocating');updateState();},isSleeping:()=>model.isSleeping(state),getState:()=>state,getData:()=>({...data}),receive:raw=>{data=model.normalize(raw);render();}};save();refreshQuote();render();
})();
