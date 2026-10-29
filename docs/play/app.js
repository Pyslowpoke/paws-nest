(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const key = 'deskcat-mvp-v1';
  const coats = {
    orange: { name: '奶油橘白', fur: '#fff9e9', patch: '#d9a46f', stripe: '#b77b4f' },
    ink: { name: '黑白奶牛', fur: '#fffaf0', patch: '#6b6a65', stripe: '#4f514c' },
    cream: { name: '奶茶纯色', fur: '#e7d2b3', patch: '#dfc6a1', stripe: '#d0b18b' }
  };
  const copy = window.DeskcatCopy;
  let data = { name: '团子', coat: 'orange', quiet: false, adopted: new Date().toISOString() };
  let canSave = true;
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    if (raw && typeof raw === 'object') {
      if (typeof raw.name === 'string' && raw.name.trim()) data.name = raw.name.trim().slice(0, 12);
      if (Object.hasOwn(coats, raw.coat)) data.coat = raw.coat;
      data.quiet = raw.quiet === true;
      if (typeof raw.adopted === 'string' && Number.isFinite(Date.parse(raw.adopted)) && Date.parse(raw.adopted) <= Date.now()) data.adopted = raw.adopted;
    }
  } catch { canSave = false; }
  let state = 'idle', actionTimer, speechTimer, toastTimer, actionStart = 0;
  let gazeX = 0, gazeY = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2600);
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      canSave = true;
      $('saveState').textContent = '已保存在这个浏览器';
    } catch {
      canSave = false;
      $('saveState').textContent = '当前无法保存，关闭页面后设置会丢失';
    }
  }
  function updateClock(now = new Date()) {
    const hour = now.getHours();
    $('greeting').textContent = copy.greetingForHour(hour) + '，很高兴见到你。';
    $('localClock').textContent = String(hour).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    $('localClock').dateTime = now.toISOString();
    const a = new Date(data.adopted);
    const calendar = d => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    $('day').textContent = '相遇的第 ' + Math.max(1, 1 + Math.floor((calendar(now) - calendar(a)) / 86400000)) + ' 天';
  }
  let lastQuote = -1;
  try { lastQuote = Number(sessionStorage.getItem('deskcat-last-quote') ?? -1); } catch { /* quotes work without storage */ }
  function refreshQuote() {
    const selected = copy.chooseQuote(lastQuote);
    lastQuote = selected.index;
    $('quote').textContent = selected.text;
    try { sessionStorage.setItem('deskcat-last-quote', String(lastQuote)); } catch { /* optional memory */ }
  }
  function render() {
    const c = coats[data.coat];
    for (const k of ['fur', 'patch', 'stripe']) document.documentElement.style.setProperty('--' + k, c[k]);
    $('petName').textContent = data.name;
    $('nameInput').value = data.name;
    $('catButton').setAttribute('aria-label', '摸摸' + data.name);
    $('coatName').textContent = c.name;
    document.querySelectorAll('[data-coat]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.coat === data.coat)));
    $('quiet').setAttribute('aria-pressed', String(data.quiet));
    if (data.quiet) $('speech').classList.remove('show');
    if (!canSave) $('saveState').textContent = '当前无法保存，关闭页面后设置会丢失';
    updateState();
    updateClock();
    requestMotion();
  }
  function updateState() {
    const sleeping = state === 'sleeping';
    $('sleep').setAttribute('aria-pressed', String(sleeping));
    $('sleepLabel').textContent = sleeping ? '轻轻叫醒' : '睡一会儿';
    $('status').textContent = {
      idle: '正在安静地陪着你',
      sleeping: '合上眼睛，轻轻打起了盹',
      petting: '眯起眼睛，蹭了蹭你的手',
      feeding: '正在认真吃一点小零食'
    }[state];
    $('hint').textContent = data.quiet ? '需要它的时候，轻轻摸一下。' : sleeping ? '小声一点，让它打个盹。' : '靠近一点，它会看向你。';
    const busy = state === 'petting' || state === 'feeding';
    $('pet').disabled = busy;
    $('feed').disabled = busy;
    $('sleep').disabled = busy;
    requestMotion();
  }
  function say(message) {
    clearTimeout(speechTimer);
    if (data.quiet) return;
    $('speech').textContent = message;
    $('speech').classList.add('show');
    speechTimer = setTimeout(() => $('speech').classList.remove('show'), 3000);
  }
  function interact(action) {
    if (state === 'feeding' || state === 'petting') return;
    clearTimeout(actionTimer);
    state = action;
    actionStart = performance.now();
    updateState();
    say(action === 'feeding' ? '咔嚓咔嚓……好吃。' : '呼噜……');
    actionTimer = setTimeout(() => { state = 'idle'; updateState(); }, action === 'feeding' ? 3400 : 3200);
  }

  // Every pose uses a shared clock and blends toward its target; switching states never resets a keyframe.
  const cat = $('cat');
  const parts = Object.fromEntries(['head', 'body-breathe', 'tail', 'ear', 'eyes', 'eye-open', 'eye-happy', 'eye-sleep', 'food', 'hearts', 'sleep-z'].map(name => [name, cat.querySelector('.' + name)]));
  const pose = { headR: 0, headY: 0, breath: 0, tailR: 0, earR: 0, eye: 1, happy: 0, sleep: 0, food: 0, heart: 0, gazeX: 0, gazeY: 0 };
  let frame = 0, previous = 0, nextBlink = performance.now() + 4000, blinkStart = -1000;
  function requestMotion() { if (!frame && !document.hidden) frame = requestAnimationFrame(animate); }
  function animate(now) {
    frame = 0;
    const dt = previous ? Math.min(.05, (now - previous) / 1000) : 1 / 60;
    previous = now;
    const t = now / 1000, still = data.quiet || reduced.matches;
    const elapsed = (now - actionStart) / 1000;
    const petting = state === 'petting', feeding = state === 'feeding', sleeping = state === 'sleeping';
    const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, elapsed / (feeding ? 3.4 : 3.2))));
    if (now >= nextBlink) { blinkStart = now; nextBlink = now + 4200 + Math.random() * 4500; }
    const blinkAge = now - blinkStart;
    const blink = !still && blinkAge >= 0 && blinkAge < 240 ? Math.sin(Math.PI * blinkAge / 240) : 0;
    const active = !still;
    const targets = {
      headR: sleeping ? -6 : petting && active ? 5 * envelope * Math.sin(elapsed * 2.8) : feeding && active ? 2.2 * envelope * Math.sin(elapsed * 7) : active ? .7 * Math.sin(t * .7) : 0,
      headY: sleeping ? 6 : feeding && active ? 4 * envelope * (.5 + .5 * Math.sin(elapsed * 7)) : petting && active ? -2 * envelope : active ? -.6 * Math.sin(t * 1.25) : 0,
      breath: active ? Math.sin(t * (sleeping ? .95 : 1.25)) * .007 : 0,
      tailR: active ? 3.5 * Math.sin(t * .85) + 1.2 * Math.sin(t * 1.7 + .4) : 0,
      earR: active ? 1.3 * Math.sin(t * 1.1 + 1) + (petting ? -3 * envelope : 0) : 0,
      eye: sleeping || petting || feeding ? .06 : 1 - blink * .95,
      happy: petting || feeding ? 1 : 0,
      sleep: sleeping ? 1 : 0,
      food: feeding ? 1 : 0,
      heart: petting && active ? envelope : 0,
      gazeX: state === 'idle' && active ? gazeX : 0,
      gazeY: state === 'idle' && active ? gazeY : 0
    };
    let unsettled = false;
    for (const name of Object.keys(pose)) {
      const rate = name === 'eye' ? 25 : name === 'headR' || name === 'headY' ? 8 : 10;
      pose[name] += (targets[name] - pose[name]) * (reduced.matches ? 1 : 1 - Math.exp(-rate * dt));
      if (Math.abs(targets[name] - pose[name]) > .002) unsettled = true;
    }
    parts.head.style.transform = `translateY(${pose.headY}px) rotate(${pose.headR}deg)`;
    parts['body-breathe'].style.transform = `scale(${1 + pose.breath * .3},${1 + pose.breath})`;
    parts.tail.style.transform = `rotate(${pose.tailR}deg)`;
    parts.ear.style.transform = `rotate(${pose.earR}deg)`;
    parts.eyes.style.transform = `translate(${pose.gazeX}px,${pose.gazeY}px)`;
    parts['eye-open'].setAttribute('transform', `translate(0 99) scale(1 ${pose.eye}) translate(0 -99)`);
    parts['eye-open'].style.opacity = 1 - Math.max(pose.happy, pose.sleep);
    parts['eye-happy'].style.opacity = pose.happy;
    parts['eye-sleep'].style.opacity = pose.sleep;
    parts.food.style.opacity = pose.food;
    parts.food.style.transform = `translateY(${(1 - pose.food) * 7}px)`;
    parts.hearts.style.opacity = pose.heart;
    parts.hearts.style.transform = `translateY(${-Math.min(elapsed, 3.4) * 4}px)`;
    parts['sleep-z'].style.opacity = active ? pose.sleep * (.5 + .25 * Math.sin(t * 1.4)) : 0;
    if (active || unsettled) requestMotion();
  }
  $('pet').addEventListener('click', () => interact('petting'));
  $('catButton').addEventListener('click', () => interact('petting'));
  $('feed').addEventListener('click', () => interact('feeding'));
  $('sleep').addEventListener('click', () => {
    clearTimeout(actionTimer);
    state = state === 'sleeping' ? 'idle' : 'sleeping';
    updateState();
    say(state === 'sleeping' ? '我就在这里，打个盹。' : '嗯？我醒啦。');
  });
  $('nameForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('nameInput').value.trim();
    if (!name) { toast('给小猫留一个名字吧。'); return; }
    data.name = name.slice(0, 12);
    save(); render();
    toast(canSave ? '记住啦，它叫' + data.name + '。' : '名字已更改，但当前无法保存。');
  });
  document.querySelectorAll('[data-coat]').forEach(b => b.addEventListener('click', () => { data.coat = b.dataset.coat; save(); render(); }));
  $('quiet').addEventListener('click', () => { data.quiet = !data.quiet; save(); render(); });
  $('refreshQuote').addEventListener('click', refreshQuote);
  document.querySelector('.room').addEventListener('pointermove', e => {
    if (data.quiet || state !== 'idle' || reduced.matches) return;
    const r = $('catButton').getBoundingClientRect();
    gazeX = Math.max(-2, Math.min(2, (e.clientX - r.left - r.width / 2) / 70));
    gazeY = Math.max(-1.3, Math.min(1.3, (e.clientY - r.top - r.height / 2) / 90));
    requestMotion();
  });
  document.querySelector('.room').addEventListener('pointerleave', () => { gazeX = 0; gazeY = 0; requestMotion(); });
  reduced.addEventListener('change', render);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    else { updateClock(); requestMotion(); }
  });
  setInterval(() => updateClock(), 30000);
  save(); refreshQuote(); render();
})();
