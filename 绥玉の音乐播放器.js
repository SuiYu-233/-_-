// 音乐播放器核心函数
// 音乐播放器核心函数
window.setupMusicPlayer = function() {
  console.log('🎵 开始设置音乐播放器');
  // ── 去重保护 ──
  const D = window.parent.document;
  if (D.getElementById('diRoot')) {
    console.log('⏭️ 播放器已存在，跳过注入');
    return;
  }
  /* ── 曲目列表 ── */
  const TRACKS = [
    { name: 'Fendi2', artist: 'Rakhim / Khim / ayv1o', src: 'http://music.163.com/song/media/outer/url?id=2754092574.mp3' },
    { name: '有线耳机', artist: 'ChiliChill / 电鸟个灯泡', src: 'http://music.163.com/song/media/outer/url?id=2042954758.mp3' },
    { name: 'Run Run Run', artist: 'The Real Group', src: 'http://music.163.com/song/media/outer/url?id=3597639.mp3' },
    { name: 'Never Cease', artist: 'SCARECROW', src: 'https://files.catbox.moe/027fkg.mp3' },
    { name: 'Panic Attack', artist: 'Alisky', src: 'https://files.catbox.moe/2p55dn.mp3' },
    { name: '摆渡', artist: '王天戈', src: 'https://files.catbox.moe/tinquz.mp3' },
    { name: '泡泡', artist: '牛佳钰', src: 'https://files.catbox.moe/rbqsvd.mp3' },
    { name: 'Mute Mode', artist: 'SCARECROW', src: 'https://files.catbox.moe/cijz86.mp3' },
  ];
  /* ── CSS样式 ── */
  const CSS = @keyframes _diMw {   from { height: 3px; opacity: .35; }   to { height: 11px; opacity: 1; } } .di-root {   position: fixed;    top: 68px;    left: 50%;   transform: translateX(-50%);   z-index: 2147483647;   display: flex;    flex-direction: column;    align-items: center;    gap: 4px;   pointer-events: none;   user-select: none;   cursor: move; } .di-root.dragging {   cursor: grabbing !important;   user-select: none !important; } .di-root * {    pointer-events: auto;    user-select: text; } .di-island {   background: #000;   border-radius: 22px;   box-shadow: 0 0 0 1.5px #1e1e1e, 0 8px 28px rgba(0,0,0,.85);   overflow: hidden;   transition: width .32s cubic-bezier(.4,0,.2,1), border-radius .32s ease;   cursor: default; } .di-player { width: 155px; } .di-player.open { width: 300px; border-radius: 26px; } .di-player-hdr {   height: 34px;    padding: 0 12px;   display: flex;    align-items: center;    justify-content: space-between;   cursor: pointer;    user-select: none; } .di-ctitle {   font-family: -apple-system,'Helvetica Neue',sans-serif;   font-size: 11px;    color: #fff;   white-space: nowrap;    overflow: hidden;    text-overflow: ellipsis;   max-width: 100px; } .di-wave { display: flex; align-items: center; gap: 2px; flex-shrink: 0; } .di-wave span {   display: block; width: 2px; background: #fff; border-radius: 2px;   animation: _diMw var(--d) ease-in-out infinite alternate;   animation-delay: var(--dl, 0s); } .di-wave.paused span { animation-play-state: paused; height: 4px; opacity: .25; } .di-player-body { max-height: 0; overflow: hidden; transition: max-height .35s cubic-bezier(.4,0,.2,1); } .di-player.open .di-player-body { max-height: 110px; } .di-player-cnt {   padding: 8px 14px 12px;   border-top: 1px solid rgba(255,255,255,.08);   display: flex; flex-direction: column; gap: 7px; } .di-pname {    font-family: -apple-system,'Helvetica Neue',sans-serif;    font-size: 13px; font-weight: 600; color: #fff; letter-spacing: -.3px;  } .di-partist {    font-family: -apple-system,'Helvetica Neue',sans-serif;    font-size: 10px; color: rgba(255,255,255,.36); margin-top: 2px;  } .di-audio {    width: 100%; height: 28px; filter: invert(1) hue-rotate(180deg) brightness(.8);  } .di-list { width: 175px; } .di-list.open { width: 300px; border-radius: 26px; } .di-list-hdr {   height: 30px; padding: 0 12px;   display: flex; align-items: center; justify-content: space-between;   cursor: pointer; user-select: none; } .di-list-label {   font-family: -apple-system,'Helvetica Neue',sans-serif;   font-size: 10px; color: rgba(255,255,255,.4);   display: flex; align-items: center; gap: 5px; } .di-chevron { transition: transform .28s ease; flex-shrink: 0; } .di-list.open .di-chevron { transform: rotate(180deg); } .di-list-body { max-height: 0; overflow: hidden; transition: max-height .42s cubic-bezier(.4,0,.2,1); } .di-list.open .di-list-body { max-height: 300px; } .di-list-scroll {   padding: 4px 8px 8px;   border-top: 1px solid rgba(255,255,255,.07);   display: flex; flex-direction: column; gap: 1px;   overflow-y: auto; max-height: 260px;   transform: translateY(-10px); opacity: 0;   transition: transform .34s cubic-bezier(.4,0,.2,1) .06s, opacity .28s ease .06s; } .di-list.open .di-list-scroll { transform: translateY(0); opacity: 1; } .di-list-scroll::-webkit-scrollbar { width: 3px; } .di-list-scroll::-webkit-scrollbar-track { background: transparent; } .di-list-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; } .di-track {   display: flex; align-items: center; gap: 8px;   padding: 5px 7px; border-radius: 10px;   cursor: pointer; transition: background .15s; } .di-track:hover { background: rgba(255,255,255,.07); } .di-track.active { background: rgba(255,255,255,.10); } .di-track-ind {    width: 18px; flex-shrink: 0;    display: flex; align-items: center; justify-content: center;  } .di-track-num {   font-family: -apple-system,'Helvetica Neue',sans-serif;   font-size: 10px; color: rgba(255,255,255,.2); font-variant-numeric: tabular-nums; } .di-track.active .di-track-num { display: none; } .di-mini-wave { display: none; align-items: center; gap: 1.5px; } .di-track.active .di-mini-wave { display: flex; } .di-mini-wave span {   display: block; width: 2px; background: rgba(255,255,255,.78); border-radius: 2px;   animation: _diMw var(--d) ease-in-out infinite alternate;   animation-delay: var(--dl, 0s); } .di-mini-wave.paused span { animation-play-state: paused; height: 3px; opacity: .25; } .di-track-text { flex: 1; min-width: 0; } .di-track-name {   font-family: -apple-system,'Helvetica Neue',sans-serif;   font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,.55);   white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .di-track.active .di-track-name { color: #fff; } .di-track-artist {   font-family: -apple-system,'Helvetica Neue',sans-serif;   font-size: 9.5px; color: rgba(255,255,255,.22); margin-top: 1px;   white-space: nowrap; overflow: hidden; text-overflow: ellipsis; };
  /* ── HTML结构 ── */
  const HTML = `
        播放列表
—      
`;


  /* ── 注入到主页面 ── */
  const styleEl = D.createElement('style');
  styleEl.id = 'di-player-styles';
  styleEl.textContent = CSS;
  D.head.appendChild(styleEl);
  const wrapper = D.createElement('div');
  wrapper.innerHTML = HTML;
  D.body.appendChild(wrapper);
  /* ── 核心逻辑 ── */
  let currentTrackIndex = 0;
  const audio = D.getElementById('diAudio');
  const srcEl = D.getElementById('diSrc');
  const nameEl = D.getElementById('diName');
  const artistEl = D.getElementById('diArtist');
  const ctitleEl = D.getElementById('diCtitle');
  const waveEl = D.getElementById('diWave');
  const playerEl = D.getElementById('diPlayer');
  const listEl = D.getElementById('diList');
  const scrollEl = D.getElementById('diScroll');
  // 展开/折叠事件
  D.getElementById('diPlayerHdr').addEventListener('click', () => {
    playerEl.classList.toggle('open');
  });
  D.getElementById('diListHdr').addEventListener('click', () => {
    listEl.classList.toggle('open');
  });
  // 加载曲目
  function loadTrack(index, shouldPlay) {
    if (index < 0 || index >= TRACKS.length) return;
currentTrackIndex = index;
const track = TRACKS[index];

srcEl.src = track.src;
audio.load();

nameEl.textContent = track.name;
artistEl.textContent = track.artist;
ctitleEl.textContent = track.name;

renderPlaylist();

if (shouldPlay && track.src) {
  audio.play().catch(e => {
    console.log('⏸️ 自动播放被阻止，点击播放器开始播放');
  });
}

  }
  // 渲染播放列表
  function renderPlaylist() {
    scrollEl.innerHTML = '';
    TRACKS.forEach((track, index) => {
      const trackEl = D.createElement('div');
      trackEl.className = 'di-track' + (index === currentTrackIndex ? ' active' : '');
      trackEl.innerHTML =          <div class="di-track-ind">           <span class="di-track-num">${index + 1}</span>           <div class="di-mini-wave" id="mw${index}">             <span style="--d:.8s;--dl:0s"></span>             <span style="--d:1.1s;--dl:.15s"></span>             <span style="--d:.9s;--dl:.3s"></span>           </div>         </div>         <div class="di-track-text">           <div class="di-track-name">${track.name}</div>           <div class="di-track-artist">${track.artist}</div>         </div>;
      trackEl.addEventListener('click', () => {
        loadTrack(index, true);
      });
      scrollEl.appendChild(trackEl);
    });
    syncVisualizer();
  }
  // 同步可视化效果
  function syncVisualizer() {
    const isPaused = audio.paused;
    waveEl.classList.toggle('paused', isPaused);
    const miniWave = D.getElementById('mw' + currentTrackIndex);
    if (miniWave) miniWave.classList.toggle('paused', isPaused);
  }
  // 音频事件监听
  audio.addEventListener('play', syncVisualizer);
  audio.addEventListener('pause', syncVisualizer);
  audio.addEventListener('ended', () => {
    if (currentTrackIndex < TRACKS.length - 1) {
      loadTrack(currentTrackIndex + 1, true);
    }
  });
  // 初始化第一首
  loadTrack(0, false);
  /* ── 新增：拖拽移动功能 ── */
  const root = D.getElementById('diRoot');
  let isDragging = false;
  let startX, startY, startLeft, startTop;
  // 鼠标按下开始拖动
  root.addEventListener('mousedown', (e) => {
    // 只允许在根元素上拖动，不触发子元素的点击事件
    if (e.target === root) {
      isDragging = true;
      root.classList.add('dragging');
  // 获取初始位置
  const rect = root.getBoundingClientRect();
  startX = e.clientX;
  startY = e.clientY;
  startLeft = rect.left;
  startTop = rect.top;

  // 移除居中定位，改为固定位置
  root.style.left = startLeft + 'px';
  root.style.top = startTop + 'px';
  root.style.transform = 'none';

  e.preventDefault();
}

  });
  // 鼠标移动时拖动
  D.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
const deltaX = e.clientX - startX;
const deltaY = e.clientY - startY;

root.style.left = (startLeft + deltaX) + 'px';
root.style.top = (startTop + deltaY) + 'px';

  });
  // 鼠标释放停止拖动
  D.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      root.classList.remove('dragging');
  // 保存位置到 localStorage
  const rect = root.getBoundingClientRect();
  localStorage.setItem('diPlayerPosition', JSON.stringify({
    left: rect.left,
    top: rect.top
  }));
}

  });
  // 加载保存的位置
  const savedPos = localStorage.getItem('diPlayerPosition');
  if (savedPos) {
    try {
      const pos = JSON.parse(savedPos);
      root.style.left = pos.left + 'px';
      root.style.top = pos.top + 'px';
      root.style.transform = 'none';
    } catch (e) {
      // 使用默认位置
    }
  }
  console.log('✅ 灵动岛音乐播放器已加载完成，支持拖拽移动');
};
