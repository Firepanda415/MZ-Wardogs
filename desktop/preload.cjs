const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('wardogsOverlay', {
  setSolution: data => ipcRenderer.send('solution', data),
  command: (name, value) => ipcRenderer.invoke('overlay-command', name, value),
  onState: callback => ipcRenderer.on('overlay-state', (_event, state) => callback(state)),
});
window.addEventListener('DOMContentLoaded', () => {
  if (location.pathname !== '/index.html') return;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = './desktop/overlay.css'; document.head.append(css);
  const bar = document.createElement('section');
  bar.id = 'overlay-toolbar'; bar.setAttribute('aria-label', '悬浮窗口控制');
  bar.innerHTML = `<span class="overlay-drag">MZ Overlay</span>
    <button id="overlay-compact" title="切换简略炮击界面" aria-pressed="false">简略版</button>
    <button id="overlay-sight" title="~+F2">全屏瞄具</button>
    <button id="overlay-pass" title="~+F1">鼠标穿透</button>
    <label title="不透明度：越往右越实"><input id="overlay-opacity" aria-label="窗口不透明度，越往右越实" type="range" min="30" max="100" step="5"></label>
    <button id="overlay-hide" title="全部隐藏 / 显示 · ~+F3" aria-label="隐藏窗口">−</button>
    <button id="overlay-quit" title="退出" aria-label="退出悬浮工具">×</button>`;
  document.body.prepend(bar);
  const help = document.createElement('div'); help.id = 'overlay-help'; help.setAttribute('role', 'status');
  const hints = document.createElement('div'); hints.id = 'overlay-hints'; hints.append(help); bar.after(hints);
  const saved = document.getElementById('saved-open'), savedHome = saved.parentElement;
  const fitCompact=()=>{
    if(document.body.classList.contains('overlay-compact'))
      ipcRenderer.invoke('overlay-command','compact-height',document.getElementById('app').getBoundingClientRect().bottom);
  };
  new ResizeObserver(fitCompact).observe(document.getElementById('app'));
  for (const [id, action] of [['compact', 'compact'], ['sight', 'sight'], ['pass', 'interact'], ['hide', 'hide'], ['quit', 'quit']])
    document.getElementById(`overlay-${id}`).onclick = () => ipcRenderer.invoke('overlay-command', action);
  document.getElementById('overlay-opacity').oninput = event => ipcRenderer.invoke('overlay-command', 'opacity', Number(event.target.value) / 100);
  const showState = state => {
    document.body.classList.toggle('overlay-compact',state.compact);
    document.getElementById('overlay-compact').textContent = state.compact ? '完整版' : '简略版';
    document.getElementById('overlay-compact').setAttribute('aria-pressed', String(state.compact));
    if(state.compact&&saved.parentElement!==hints)hints.append(saved);
    else if(!state.compact&&saved.parentElement!==savedHome)savedHome.prepend(saved);
    if(state.compact)requestAnimationFrame(fitCompact);
    document.getElementById('overlay-sight').textContent = state.sightMode ? '关闭瞄具' : '全屏瞄具';
    document.getElementById('overlay-sight').setAttribute('aria-pressed', String(state.sightMode));
    document.getElementById('overlay-pass').textContent = state.interactive ? '鼠标穿透' : '恢复交互';
    document.getElementById('overlay-opacity').value = Math.round(state.opacity * 100);
    document.getElementById('overlay-opacity').parentElement.title = `不透明度 ${Math.round(state.opacity * 100)}%：越往右越实`;
    help.textContent = state.shortcutErrors.length ? `快捷键不可用：${state.shortcutErrors.join('、')}；请用托盘菜单操作。` :
      `~+F1 交互 · ~+F2 瞄具 · ~+F3 隐藏 · ~+F4 切回`;
    help.title = '~+F1 交互/穿透 · ~+F2 瞄具开关 · ~+F3 全部隐藏/显示 · ~+F4 切回面板并恢复交互';
  };
  ipcRenderer.on('overlay-state', (_event, state) => showState(state));
  ipcRenderer.invoke('overlay-command', 'state').then(showState);
});
