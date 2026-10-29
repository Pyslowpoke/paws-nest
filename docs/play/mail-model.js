(function(root,factory){
  const api=factory(typeof module!=='undefined'&&module.exports?require('./lib/lunar.js'):root);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DeskcatMail=api;
})(typeof window!=='undefined'?window:globalThis,function(calendar){
  'use strict';
  const pad=n=>String(n).padStart(2,'0');
  function dayKey(date=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);return ['year','month','day'].map(k=>p.find(v=>v.type===k).value).join('-');}
  function validDay(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00+08:00');return Number.isFinite(+d)&&dayKey(d)===s;}
  function birthday(s){return typeof s==='string'&&/^\d{2}-\d{2}$/.test(s)&&validDay('2000-'+s)?s:'';}
  const leap=y=>y%4===0&&(y%100!==0||y%400===0);
  const templates={
    welcome:{label:'相遇',title:'你好呀，今后请多关照',lines:['从今天起，我的小窝就安在这里了。','你可以摸摸我的头，也可以忙自己的事。我会找个舒服的位置，慢慢陪着你。','这只邮筒归我们啦。重要的日子，我会把想说的话放进信里。']},
    birthday:{label:'生日',title:'今天，想把祝福留给你',lines:['生日快乐。今天是属于你的日子。','希望这一岁，有让你安心的人，有值得期待的小事，也有可以自在休息的晚上。','我把最软的小爪子印在这里，陪你一起，慢慢长大。']},
    newyear:{label:'元旦',title:'新的一年，也想陪在你身边',lines:['新年好。窗外又翻过一页日历啦。','新的一年，愿你有自己的节奏，也有随时停下来喘口气的地方。','我的小窝已经铺好了。接下来的日子，也一起慢慢过吧。']},
    spring:{label:'春节',title:'给你留了一份暖暖的年味',lines:['新春快乐。听说过年，要把最好的祝愿送给惦记的人。','愿你新岁平安，吃得暖暖的，睡得香香的，想见的人都能好好相见。','我也给自己安排了一个任务：继续陪着你。爪印为证。']},
    qingming:{label:'清明',title:'愿春风，也带一点温柔给你',lines:['清明时节，想给你留一封安静的信。','有些思念可以慢慢安放，有些心情不必急着说完。愿你和挂念的人，都平安。','如果今天想静静待一会儿，我就在旁边。']},
    labour:{label:'劳动节',title:'今天，把休息也留给自己',lines:['劳动节快乐。辛苦的日子里，你一直有在认真生活。','愿今天能留一点时间给自己：吃喜欢的东西，看看天空，或者什么也不做。','我的建议是：找一个软软的地方，一起打个盹。']},
    dragon:{label:'端午',title:'一份端午安康，装进小信封',lines:['端午安康。愿你身边有清香的艾草、热乎的饭，也有让人安心的陪伴。','甜粽还是咸粽都好，合你的心意最重要。','这封信不大，装下的祝福倒是满满的。']},
    midautumn:{label:'中秋',title:'今晚，分你一点窗边的月光',lines:['中秋快乐。今晚的月亮，很适合一起看一会儿。','愿你牵挂的人也在好好生活，愿团圆如期而至，独处的时候也能自在。','我把窗边最舒服的位置留给你了。']},
    national:{label:'国庆',title:'给假期寄一张小小的邀请',lines:['国庆快乐。愿这几天有好天气，也有一点属于自己的空闲。','出门看看也好，在家休息也好，愿你自在、平安，遇见喜欢的小风景。','如果你留在家里，我就陪你把日子过得慢一点。']}
  };
  function normalize(raw,now=new Date()){
    const r=raw&&typeof raw==='object'?raw:{},today=dayKey(now),seen=new Set();
    const letters=(Array.isArray(r.letters)?r.letters:[]).filter(l=>l&&typeof l.id==='string'&&l.id.length<80&&Object.hasOwn(templates,l.kind)&&validDay(l.date)&&!seen.has(l.id)&&(seen.add(l.id)||true)).slice(-300).map(l=>({id:l.id,kind:l.kind,date:l.date,from:typeof l.from==='string'?l.from.slice(0,12):'团子',read:l.read===true}));
    return {completed:r.completed===true,birthday:birthday(r.birthday),created:validDay(r.created)&&r.created<=today?r.created:today,lastChecked:validDay(r.lastChecked)&&r.lastChecked<=today?r.lastChecked:'',letters};
  }
  const cache=new Map();
  function festivals(year){
    if(cache.has(year))return cache.get(year);
    const {Solar,Lunar}=calendar;
    const first=Lunar.fromYmd(year,1,1).getSolar();
    const qingming=Solar.fromYmd(year,4,1).getLunar().getJieQiTable()['清明'];
    const list=[{kind:'newyear',date:`${year}-01-01`,days:1},{kind:'spring',date:first.next(-1).toYmd(),days:4},{kind:'qingming',date:qingming.toYmd(),days:1},{kind:'labour',date:`${year}-05-01`,days:2},{kind:'dragon',date:Lunar.fromYmd(year,5,5).getSolar().toYmd(),days:1},{kind:'midautumn',date:Lunar.fromYmd(year,8,15).getSolar().toYmd(),days:1},{kind:'national',date:`${year}-10-01`,days:3}];
    cache.set(year,list);return list;
  }
  function plusDays(day,n){const d=new Date(day+'T12:00:00+08:00');d.setTime(+d+n*86400000);return dayKey(d);}
  function advance(raw,catName='团子',now=new Date()){
    const profile=normalize(raw,now);if(!profile.completed)return {profile,added:[]};
    const today=dayKey(now),year=Number(today.slice(0,4)),added=[],known=new Set(profile.letters.map(l=>l.id));
    const append=(id,kind,date)=>{if(known.has(id))return;const letter={id,kind,date,from:String(catName||'团子').slice(0,12),read:false};profile.letters.push(letter);known.add(id);added.push(letter);};
    append('welcome','welcome',profile.created);
    // Daily checks are cheap; recompute due dates to recover missed days and profile changes.
    for(let y=Math.max(Number(profile.created.slice(0,4)),year-1);y<=year;y++){
      for(const f of festivals(y)){
        const end=plusDays(f.date,f.days-1);
        if(f.date<=today&&end>=profile.created)append(`holiday:${y}:${f.kind}`,f.kind,f.date);
      }
      if(profile.birthday){const md=profile.birthday==='02-29'&&!leap(y)?'02-28':profile.birthday,date=`${y}-${md}`;if(date>=profile.created&&date<=today)append(`birthday:${y}`,'birthday',date);}
    }
    profile.lastChecked=today;profile.letters=profile.letters.slice(-300);
    return {profile,added};
  }
  function markRead(raw,id,now=new Date()){const p=normalize(raw,now);p.letters=p.letters.map(l=>l.id===id?{...l,read:true}:l);return p;}
  function textFor(letter){const t=templates[letter.kind]||templates.welcome;return {...t,lines:[...t.lines],signature:letter.from+'，留下一枚爪印'};}
  return {dayKey,validDay,birthday,normalize,advance,markRead,textFor,festivals,templates};
});
