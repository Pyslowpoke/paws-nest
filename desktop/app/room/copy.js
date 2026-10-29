(function () {
  'use strict';
  const quotes = [
    '累了的话，就在这里坐一会儿。',
    '这一会儿，舒服地待着就好。',
    '小猫把身边的位置留给了你。',
    '不急，我们慢慢来。',
    '这里有一处柔软的位置。',
    '今天，也有一个小角落属于你。',
    '先松松肩膀，再往前走。',
    '愿你有一段不被催促的时光。',
    '休息的时候，也可以什么都不做。',
    '欢迎回来，小猫刚好也在。',
    '把这一刻，留给柔软的小事。',
    '不用说话，也可以一起待着。'
  ];
  function greetingForHour(hour) {
    if (hour >= 5 && hour < 11) return '早上好';
    if (hour >= 11 && hour < 14) return '午安';
    if (hour >= 14 && hour < 18) return '下午好';
    if (hour >= 18 && hour < 23) return '晚上好';
    return '夜深了';
  }
  function chooseQuote(last, random = Math.random) {
    const candidates = quotes.map((text, index) => ({ text, index })).filter(q => q.index !== last);
    return candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)))];
  }
  const api = { quotes, greetingForHour, chooseQuote };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.DeskcatCopy = api;
})();
