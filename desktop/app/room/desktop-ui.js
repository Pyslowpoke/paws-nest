(() => {
  const native=window.desktopCat,controller=window.DeskcatController;if(!native||!controller)return;
  const icons={food:'M4 11h16l-2 7H6z M7 7h1m4-2h1m3 3h1',can:'M6 7h12v11H6z M6 7c0-4 12-4 12 0 M9 11h6',sleep:'M18 14A7 7 0 0 1 10 4 8 8 0 1 0 20 16',home:'M3 11 12 4l9 7 M6 10v10h12V10 M10 20v-6h4v6',settings:'M6 4v16 M12 4v16 M18 4v16 M3 8h6 M9 15h6 M15 10h6',menu:'M5 6h14 M5 12h14 M5 18h14',wake:'M12 3v2m0 14v2M3 12h2m14 0h2 M6 6l1 1m10 10 1 1M6 18l1-1M17 7l1-1 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0'};
  const button=(id,label,icon)=>`<button id="${id}" title="${label}" aria-label="${label}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[icon]}"/></svg></button>`;
  function preferences(){const s=window.desktopSnapshot;document.documentElement.style.setProperty('--pet-width',({small:120,medium:160,large:210})[s.size]+'px');
    document.querySelectorAll('[data-native-pref]').forEach(input=>{const v=s[input.dataset.nativePref];if(input.type==='checkbox')input.checked=v;else input.value=v;});
    const n=document.getElementById('desktopName');if(n)n.textContent=s.pet.name+' · 拖动';
    const quiet=document.getElementById('nativeQuiet');if(quiet)quiet.textContent=s.pet.quiet?'已安静陪伴':'安静陪伴';
    const launch=document.getElementById('companionLaunch');launch.textContent='去桌面陪伴 ↗';
    if(window.desktopSurface==='house'){document.body.classList.toggle('companion-active',s.petVisible);if(s.petVisible){document.getElementById('status').textContent='正在桌面上，安静地陪着你';document.getElementById('roomLabel').textContent='小猫在桌边陪你';document.getElementById('bedTitle').textContent='给它留好的软软窝';document.getElementById('bedDetail').textContent='点一下，叫它回窝休息';}}
  }
  if(window.desktopSurface==='house'){
    document.querySelector('.edition').textContent='WINDOWS · 桌边的小小陪伴';
    document.querySelector('.foot').innerHTML='<span>关掉小屋，小猫也会继续在桌面陪你。</span><span>右下角托盘 · 可以收起或退出</span>';
    document.querySelector('.companion-note').textContent='';
    const panel=document.createElement('section');panel.className='native-settings';
    panel.innerHTML='<details><summary class="native-settings-title">桌边的位置 <small>大小与桌宠设置</small></summary><label>小猫大小 <select data-native-pref="size"><option value="small">小小一只</option><option value="medium">刚刚好</option><option value="large">大一点</option></select></label><label><span>在其他窗口上方陪伴</span><input type="checkbox" data-native-pref="pinned"></label><label><span>鼠标穿透小猫</span><input type="checkbox" data-native-pref="clickThrough"></label><p>穿透后，从系统托盘菜单恢复交互。外观只保存在这台电脑，随时可以更换。</p><button id="nativeShow">让小猫来桌面</button> <button id="nativeQuit">退出桌宠</button></details>';
    document.querySelector('aside').append(panel);
    document.querySelectorAll('[data-native-pref]').forEach(input=>input.addEventListener('change',()=>native.preference(input.dataset.nativePref,input.type==='checkbox'?input.checked:input.value)));
    document.getElementById('nativeShow').onclick=()=>native.command('show-pet');document.getElementById('nativeQuit').onclick=()=>native.command('quit');
    document.getElementById('companionLaunch').addEventListener('click',()=>native.command('show-pet'));
  }else{
    document.title='爪爪小窝 · 桌宠';
    const stage=document.createElement('div');stage.id='desktopStage';stage.className='desktop-stage';
    const catButton=document.getElementById('catButton');stage.append(catButton);document.body.append(stage);
    catButton.querySelectorAll('button').forEach(b=>b.remove());
    const speech=document.getElementById('speech');speech.classList.add('desktop-bubble');document.body.append(speech);
    const name=document.createElement('button');name.id='desktopName';name.className='desktop-name';name.title='拖动移动小猫；轻点听一句悄悄话';document.body.append(name);
    const tools=document.createElement('nav');tools.className='desktop-tools';tools.setAttribute('aria-label','桌宠操作');tools.innerHTML=button('nativeFood','添猫粮','food')+button('nativeCan','开罐头','can')+button('nativeSleep','趴下睡 / 轻轻叫醒','sleep')+button('nativeHome','回猫窝','home')+button('nativeHouse','打开小屋，调整外观','settings')+button('nativeMenu','收起、穿透与退出','menu');document.body.append(tools);
    document.getElementById('nativeFood').onclick=()=>controller.interact('kibble');document.getElementById('nativeCan').onclick=()=>controller.interact('can');
    document.getElementById('nativeSleep').onclick=()=>controller.isSleeping()?controller.wake():controller.sleepAt('desk');
    document.getElementById('nativeHome').onclick=()=>native.command('home');document.getElementById('nativeHouse').onclick=()=>native.command('house');document.getElementById('nativeMenu').onclick=()=>native.command('menu');
    function hit(e){const r=catButton.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*234,y=(e.clientY-r.top)/r.height*356;
      const sleeping=controller.isSleeping();
      return sleeping?(x>15&&x<220&&y>205&&y<318):((x>24&&x<164&&y>85&&y<313)||(x>162&&x<216&&y>190&&y<293));
    }
    let pressing=null,lastHover,hoverTimer;
    const interactive=e=>!!e.target.closest('.desktop-tools,.desktop-name')||hit(e);
    window.addEventListener('mousemove',e=>{
      const h=interactive(e);if(h!==lastHover){lastHover=h;native.hover(h);clearTimeout(hoverTimer);if(h)document.body.classList.add('pet-hover');else hoverTimer=setTimeout(()=>document.body.classList.remove('pet-hover'),650);}
    });
    window.addEventListener('pointermove',e=>{
      if(pressing){if(!pressing.dragged&&Math.hypot(e.screenX-pressing.x,e.screenY-pressing.y)>5){pressing.dragged=true;native.drag('start');}if(pressing.dragged)native.drag('move');}
    });
    window.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.desktop-tools')||!interactive(e))return;pressing={x:e.screenX,y:e.screenY,dragged:false,name:e.target===name};e.target.setPointerCapture?.(e.pointerId);});
    window.addEventListener('pointerup',e=>{if(!pressing)return;const p=pressing;pressing=null;if(p.dragged){native.drag('end');return;}if(p.name){controller.say(window.DeskcatCopy.chooseQuote(-1).text);return;}if(controller.isSleeping()){controller.wake();return;}const r=catButton.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*234,y=(e.clientY-r.top)/r.height*356;controller.interact(x>165?'tail':y<132?'ears':y>270?'paw':'head');});
    window.addEventListener('pointercancel',()=>{pressing=null;native.drag('end');});
    window.addEventListener('blur',()=>{pressing=null;native.drag('end');});
    window.addEventListener('contextmenu',e=>{e.preventDefault();native.command('menu');});
    window.addEventListener('keydown',e=>{if(e.key==='Escape')native.command('hide-pet');if(e.key===' '&&e.target===document.body){e.preventDefault();controller.interact('head');}});
    window.addEventListener('mouseleave',()=>{if(!pressing){native.hover(false);lastHover=false;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>document.body.classList.remove('pet-hover'),650);}});
    setTimeout(()=>controller.say(window.DeskcatCopy.greetingForHour(new Date().getHours())+'。我在这里陪你。'),600);
  }
  window.addEventListener('desktop-state',preferences);preferences();
})();
