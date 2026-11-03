(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const dialog = $('downloadDialog');
  let controller, db, manifest, objectUrl, running = false;
  const memory = new Map();
  const sha = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
  const mb = bytes => (bytes / 1048576).toFixed(1);
  const note = text => { if ($('downloadStatus').textContent !== text) $('downloadStatus').textContent = text; };
  async function openStore() {
    if (db) return;
    try {
      db = await new Promise((resolve, reject) => {
        const r = indexedDB.open('paws-nest-downloads', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('chunks');
        r.onsuccess = () => resolve(r.result);
        r.onerror = r.onblocked = () => reject(new Error('Download cache unavailable'));
      });
    } catch { db = null; }
    $('downloadCacheNote').textContent = db ? '已校验的分段会暂存在此浏览器；暂停或刷新后，可继续下载。' : '浏览器未提供续传空间；请保持这个页面打开，暂停后可在本页继续。';
  }
  async function cache(action, key, value) {
    if (db) {
      try {
        const result = await new Promise((resolve, reject) => {
          const tx = db.transaction('chunks', action === 'get' ? 'readonly' : 'readwrite');
          const store = tx.objectStore('chunks');
          const request = action === 'put' ? store.put(value, key) : action === 'get' ? store.get(key) : store.delete(key);
          tx.oncomplete = () => resolve(request.result);
          tx.onerror = tx.onabort = () => reject(tx.error);
        });
        return action === 'get' && result === undefined ? memory.get(key) : result;
      } catch {
        // A full/private cache must not prevent a download from completing in memory.
        $('downloadCacheNote').textContent = '续传空间不足；剩余分段暂存在内存，请保持页面打开。';
      }
    }
    if (action === 'get') return memory.get(key);
    if (action === 'put') memory.set(key, value);
    else memory.delete(key);
  }
  function validate(m) {
    if (m.fileName !== 'paws-nest-windows-portable.exe' || !/^[a-f0-9]{64}$/.test(m.sha256) || !Array.isArray(m.chunks) || !m.chunks.length || m.chunks.length > 32) throw Error('下载信息不完整，请稍后再试。');
    if (m.chunks.some(c => !/^windows-[a-f0-9]{12}\/part-\d{2}\.bin$/.test(c.path) || !/^[a-f0-9]{64}$/.test(c.sha256) || !Number.isSafeInteger(c.bytes) || c.bytes < 1 || c.bytes > 8388608)) throw Error('下载信息校验失败。');
    if (m.chunks.reduce((sum, c) => sum + c.bytes, 0) !== m.bytes || m.bytes > 200 * 1048576) throw Error('下载大小校验失败。');
    return m;
  }
  async function start() {
    if (running) return;
    running = true; controller = new AbortController();
    const signal = controller.signal;
    $('downloadResume').hidden = true;
    $('downloadPause').hidden = false;
    $('downloadSave').hidden = true;
    $('downloadProgress').value = 0;
    note('正在准备下载，检查是否有已完成的分段……');
    try {
      const response = await fetch('downloads/windows-package.json', { cache: 'no-cache', signal });
      if (!response.ok) throw Error('暂时无法取得下载信息，可使用下方备用入口。');
      manifest = validate(await response.json());
      await openStore();
      const parts = new Array(manifest.chunks.length), received = manifest.chunks.map(() => 0);
      let done = 0, cursor = 0;
      const progress = () => {
        const bytes = received.reduce((sum, n) => sum + n, 0);
        $('downloadProgress').value = bytes / manifest.bytes * 100;
        $('downloadAmount').textContent = mb(bytes) + ' / ' + mb(manifest.bytes) + ' MB';
        note('已完成 ' + done + ' / ' + parts.length + ' 段 · 正在下载小窝');
      };
      async function worker() {
        while (cursor < parts.length) {
          signal.throwIfAborted();
          const index = cursor++, chunk = manifest.chunks[index], key = manifest.sha256 + ':' + index;
          let data = await cache('get', key);
          if (data && (data.byteLength !== chunk.bytes || await sha(data) !== chunk.sha256)) { await cache('delete', key); data = null; }
          if (!data) {
            for (let attempt = 0; attempt < 3; attempt++) {
              signal.throwIfAborted(); received[index] = 0; progress();
              try {
                const res = await fetch('downloads/' + chunk.path, { signal: AbortSignal.any([signal, AbortSignal.timeout(90000)]) });
                if (!res.ok) throw Error('分段暂时不可用');
                const reader = res.body.getReader(), bytes = new Uint8Array(chunk.bytes);
                let offset = 0;
                while (true) {
                  const next = await reader.read(); if (next.done) break;
                  if (offset + next.value.length > bytes.length) { await reader.cancel(); throw Error('分段长度异常'); }
                  bytes.set(next.value, offset); offset += next.value.length;
                  received[index] = offset; progress();
                }
                if (offset !== chunk.bytes || await sha(bytes) !== chunk.sha256) throw Error('分段校验未通过');
                data = bytes.buffer; await cache('put', key, data); break;
              } catch (error) { if (signal.aborted) throw error; }
            }
            if (!data) throw Error('这段网络有些慢，已保留完成的部分。点“继续下载”重试，或换备用入口。');
          }
          parts[index] = data; received[index] = chunk.bytes; done++; progress();
        }
      }
      const tasks = await Promise.allSettled([worker(), worker(), worker()]);
      signal.throwIfAborted();
      const failed = tasks.find(t => t.status === 'rejected'); if (failed) throw failed.reason;
      note('下载完成，正在检查完整文件……');
      const complete = new Uint8Array(manifest.bytes); let offset = 0;
      for (const part of parts) { complete.set(new Uint8Array(part), offset); offset += part.byteLength; }
      if (await sha(complete) !== manifest.sha256) throw Error('完整文件校验未通过，请使用备用入口。');
      signal.throwIfAborted();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(new Blob(parts, { type: 'application/octet-stream' }));
      $('downloadSave').href = objectUrl; $('downloadSave').download = manifest.fileName;
      $('downloadSave').hidden = false; $('downloadPause').hidden = true;
      note('校验通过！点击“保存到电脑”，然后双击文件解压。');
      $('downloadSave').focus();
    } catch (error) {
      controller.abort();
      note(signal.aborted && error.name === 'AbortError' ? '已暂停。完成的分段已保留，稍后可以继续。' : error.message || '下载暂时中断，可以继续下载或使用备用入口。');
      $('downloadPause').hidden = true; $('downloadResume').hidden = false;
    } finally { running = false; }
  }
  $('downloadPrimary').addEventListener('click', event => {
    // Older browsers still follow the ordinary release link.
    if (!window.crypto?.subtle || !window.AbortSignal?.any || !window.AbortSignal?.timeout) return;
    event.preventDefault(); dialog.showModal();
    if (!objectUrl) start();
  });
  $('downloadPause').onclick = () => controller?.abort();
  $('downloadResume').onclick = start;
  $('downloadClose').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (running) controller.abort(); });
  $('downloadClear').onclick = async () => {
    if (running) { note('请先暂停下载，再清理临时文件。'); return; }
    if (manifest) await Promise.all(manifest.chunks.map((_, i) => cache('delete', manifest.sha256 + ':' + i)));
    memory.clear();
    note('本次下载的续传缓存已清理。已保存到电脑的文件不受影响。');
  };
})();
