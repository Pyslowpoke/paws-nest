(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = { orange: '奶油橘白 · 晒过太阳的颜色', ink: '黑白奶牛 · 穿了一件小花衣', siamese: '暹罗色 · 一双蓝蓝的小眼睛' };
  function select(button, selector) {
    document.querySelectorAll(selector).forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }
  document.querySelectorAll('[data-look]').forEach(button => button.addEventListener('click', () => {
    const look = button.dataset.look;
    $('lookCat').src = 'assets/cat-' + look + '.svg';
    $('lookCat').alt = labels[look].split(' · ')[0] + '小猫的外观预览';
    $('lookLabel').textContent = labels[look];
    select(button, '[data-look]');
  }));
  let petTimer;
  $('petDemo').onclick = () => {
    const paper = document.querySelector('.cat-paper');
    paper.classList.remove('petted');
    $('petWhisper').textContent = '呼噜……';
    requestAnimationFrame(() => paper.classList.add('petted'));
    clearTimeout(petTimer);
    petTimer = setTimeout(() => paper.classList.remove('petted'), 2500);
  };
  const letter = $('introLetter');
  $('openLetter').onclick = () => letter.showModal();
  $('closeLetter').onclick = () => letter.close();
  letter.addEventListener('click', event => { if (event.target === letter) {
    const r = letter.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) letter.close();
  }});

  // Bounded illustration only: never accesses or controls the visitor's desktop.
  const scene = $('desktopScene'), cat = $('deskCat'), bubble = $('deskBubble');
  let drag = null, sleeping = false;
  function move(x, y) {
    const left = Math.max(8, Math.min(scene.clientWidth - cat.offsetWidth - 8, x));
    cat.style.left = left + 'px';
    cat.style.top = Math.max(42, Math.min(scene.clientHeight - cat.offsetHeight - 10, y)) + 'px';
    const half = bubble.offsetWidth / 2;
    bubble.style.left = Math.max(half + 4 - left, Math.min(cat.offsetWidth / 2, scene.clientWidth - left - half - 4)) + 'px';
  }
  function corner() { move(scene.clientWidth - cat.offsetWidth - 25, scene.clientHeight - cat.offsetHeight - 28); }
  cat.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, left: cat.offsetLeft, top: cat.offsetTop };
    cat.setPointerCapture(event.pointerId);
    bubble.textContent = sleeping ? '轻一点，咪在睡觉。' : '咪挪一挪。';
  });
  cat.addEventListener('pointermove', event => { if (drag) move(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y); });
  function endDrag() { drag = null; bubble.textContent = sleeping ? '呼……小小休息一下。' : '这里，刚刚好。'; move(cat.offsetLeft, cat.offsetTop); }
  cat.addEventListener('pointerup', endDrag);
  cat.addEventListener('pointercancel', endDrag);
  cat.addEventListener('lostpointercapture', endDrag);
  cat.addEventListener('keydown', event => {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    move(cat.offsetLeft + direction[0] * 15, cat.offsetTop + direction[1] * 15);
  });
  document.querySelectorAll('[data-size]').forEach(button => button.addEventListener('click', () => {
    cat.style.width = ({ small: 110, medium: 145, large: 175 })[button.dataset.size] + 'px';
    select(button, '[data-size]');
    move(cat.offsetLeft, cat.offsetTop);
  }));
  $('demoNap').onclick = () => {
    sleeping = !sleeping;
    cat.dataset.sleeping = String(sleeping);
    $('deskCatImage').src = 'assets/' + (sleeping ? 'cat-nap.svg' : 'cat-orange.svg');
    $('demoNap').setAttribute('aria-pressed', String(sleeping));
    $('demoNap').textContent = sleeping ? '轻轻叫醒 ☀' : '睡一会儿 ☾';
    endDrag();
  };
  $('resetDesk').onclick = corner;
  new ResizeObserver(() => move(cat.offsetLeft, cat.offsetTop)).observe(scene);

  // Editorial examples, not model calls. No input, API key, or conversation is stored here.
  const samples = {
    tired: ['今天好累，什么都不想做。', '那就先歇一会儿吧。咪把爪爪收好，陪你安静坐一会儿。想说的时候，再慢慢说。', '不用急着把心情整理好。'],
    like: ['我喜欢热可可，帮我记住好吗？', '热可可，咪记在小本本上了。今天也想捧着暖暖的杯子，歇一会儿吗？', '客户端可查看、删除或关闭偏好记忆；这里不保存资料。'],
    boundary: ['帮我写一份复杂的商业方案。', '这个有点难，咪的小脑袋还没弄明白。不过忙了这么久，要不要先伸个懒腰？咪陪你歇一下。', '小猫专注日常陪伴，复杂任务会轻轻转回陪伴场景。']
  };
  let samplePetTimer;
  $('samplePet').onclick = () => {
    $('samplePet').classList.remove('petted');
    requestAnimationFrame(() => $('samplePet').classList.add('petted'));
    $('sampleMemory').textContent = '呼噜……小猫轻轻蹭了蹭你。';
    clearTimeout(samplePetTimer);
    samplePetTimer = setTimeout(() => $('samplePet').classList.remove('petted'), 2200);
  };
  document.querySelectorAll('[data-chat]').forEach(button => button.addEventListener('click', () => {
    const [you, reply, note] = samples[button.dataset.chat];
    $('sampleYou').textContent = you;
    $('sampleCat').textContent = reply;
    $('sampleMemory').textContent = note;
    select(button, '[data-chat]');
  }));
})();
