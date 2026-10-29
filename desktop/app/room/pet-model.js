(function(){
  'use strict';
  const coats={
    orange:{name:'奶油橘白',fur:'#fff9e9',patch:'#d9a46f',stripe:'#b77b4f',eye:'#65513d',pattern:'bicolor'},
    ink:{name:'黑白奶牛',fur:'#fffaf0',patch:'#62615b',stripe:'#4f514c',eye:'#64825d',pattern:'bicolor'},
    cream:{name:'奶茶纯色',fur:'#e7d2b3',patch:'#dfc6a1',stripe:'#d0b18b',eye:'#65513d',pattern:'solid'},
    siamese:{name:'暹罗色',fur:'#eee2ca',patch:'#7c6557',stripe:'#6b584e',eye:'#6b9cb8',pattern:'point'},
    black:{name:'黑猫',fur:'#575651',patch:'#575651',stripe:'#575651',eye:'#dbc17c',pattern:'solid'},
    maine:{name:'长毛 · 缅因风',fur:'#d5b68c',patch:'#a68464',stripe:'#876b51',eye:'#748561',pattern:'longhair'}
  };
  const actions={
    head:{duration:3000,status:'把脑袋往手心里蹭了蹭',speech:'呼噜……',label:'摸头'},
    ears:{duration:2400,status:'耳朵抖了抖，歪头看着你',speech:'嗯？有一点痒。',label:'摸耳朵'},
    tail:{duration:2400,status:'尾巴轻轻摆开，回头看了你一眼',speech:'尾巴先借我一下。',label:'摸尾巴'},
    paw:{duration:3000,status:'收了收小爪子，又露出软软的肉垫',speech:'给你看看我的小爪子。',label:'摸爪子'},
    kibble:{duration:3800,status:'低下头，慢慢嚼着猫粮',speech:'咔嚓，咔嚓。',label:'添猫粮'},
    can:{duration:5000,status:'看到罐头，开心得尾巴都翘起来了',speech:'是罐头！给我的吗？',label:'开罐头'}
  };
  const isSleeping=s=>s==='sleepDesk'||s==='sleepNest';
  const isBusy=s=>Object.hasOwn(actions,s)||s==='settling';
  function normalize(raw,now=new Date().toISOString()){
    const r=raw&&typeof raw==='object'?raw:{};
    const coat=Object.hasOwn(coats,r.coat)?r.coat:'orange';
    return {name:typeof r.name==='string'&&r.name.trim()?r.name.trim().slice(0,12):'团子',coat,quiet:r.quiet===true,
      adopted:typeof r.adopted==='string'&&Number.isFinite(Date.parse(r.adopted))&&Date.parse(r.adopted)<=Date.parse(now)?r.adopted:now,
      eyeColor:typeof r.eyeColor==='string'&&/^#[0-9a-f]{6}$/i.test(r.eyeColor)?r.eyeColor:coats[coat].eye,
      eyeSize:typeof r.eyeSize==='number'&&Number.isFinite(r.eyeSize)?Math.min(1.6,Math.max(.7,r.eyeSize)):1,
      mouth:['cat','smile','dot'].includes(r.mouth)?r.mouth:'cat',tailLength:typeof r.tailLength==='number'&&Number.isFinite(r.tailLength)?Math.min(1.15,Math.max(.65,r.tailLength)):1};
  }
  const api={coats,actions,isBusy,isSleeping,normalize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.DeskcatPet=api;
})();
