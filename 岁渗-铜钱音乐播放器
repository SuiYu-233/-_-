// ==UserScript==
// @name        岁渗铜钱音乐播放器
// @version      4.2.0
// @description  铜钱精准落位 · 物理方向校准 · 本地数据库永久存歌 · 歌单删除功能
// ==/UserScript==

(function () {
  'use strict';

  let D;
  try { D = window.parent.document; } catch (e) { D = document; }
  const oldRoot = D.getElementById('gfRoot');
  if (oldRoot) oldRoot.remove();

  /* ── 默认初始曲目列表 ── */
  const DEFAULT_TRACKS = [
    { id: 'def_1', name: '过桥', artist: '后弦',          src: 'https://videotourl.com/audio/1793297043365-076b51d1-aff2-4a0e-9059-0e8c14709922.m4a' },
    { id: 'def_2', name: '众生相',   artist: 'Oh元', src: 'https://videotourl.com/audio/1793350928490-65292479-b5b7-46cc-b5f2-bd04b8cd465e.m4a' },
    { id: 'def_3', name: '戏文说',   artist: '叫宝宝/祥嘞嘞', src: 'https://videotourl.com/audio/1793330708715-3d409908-b66c-4604-9f2c-504485531a20.mp3' },
    { id: 'def_4', name: '昆明湖',     artist: '后弦',          src: 'https://videotourl.com/audio/1793351027001-88830db2-9155-4c84-bd53-7cbed469cfc1.m4a' },
    { id: 'def_5', name: '青梅晃',     artist: '王书渝',          src: 'https://videotourl.com/audio/1793323391500-8b230f57-8136-41a8-b94f-208a33803faa.m4a' },
    { id: 'def_6', name: '情呀爱呀',     artist: '礼越',          src: 'https://videotourl.com/audio/1793323502641-d3a6fc5c-ff69-4b90-bec9-a552c4369d7f.m4a' },
    { id: 'def_7', name: '茶汤',     artist: '郁可唯',          src: 'https://videotourl.com/audio/1793350751942-201476d0-b8d5-4ee7-bfd7-dbd1d752ec7c.m4a' },
    { id: 'def_8', name: '罗汉拳',     artist: '阿萨Aza',          src: 'https://videotourl.com/audio/1793351104195-e83eb7d2-8fa7-4602-a763-8c9a92b0a1b7.m4a' },
    { id: 'def_9', name: '下完这场雨',     artist: '后弦',          src: 'https://videotourl.com/audio/1793350873304-180d085c-1c4a-4f69-acce-9832dca5eb19.m4a' },
    { id: 'def_10', name: '来春打马',     artist: 'ILEM',          src: 'https://videotourl.com/audio/1793324368692-5c80ff9d-3929-44ee-a2cc-357d29a458d2.m4a' }
  ];



  let TRACKS = [];

  /* ══════════════════════════════════════════
     本地永久存储系统 (IndexedDB，支持直接存音频文件)
     ══════════════════════════════════════════ */
  const DB_NAME = 'GfMusicPlayerDB';
  const STORE_NAME = 'tracks_store';

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveTracksToDB() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      TRACKS.forEach((t, idx) => {
        store.put({
          id: t.id || ('track_' + Date.now() + '_' + idx),
          order: idx,
          name: t.name,
          artist: t.artist,
          src: t.blob ? '' : t.src,
          blob: t.blob || null
        });
      });
    } catch (err) {
      console.warn('保存歌单到本地系统失败:', err);
    }
  }

  async function loadTracksFromDB() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          if (list.length === 0) {
            resolve(null);
          } else {
            list.sort((a, b) => a.order - b.order);
            const restored = list.map(item => ({
              id: item.id,
              name: item.name,
              artist: item.artist,
              blob: item.blob || null,
              src: item.blob ? URL.createObjectURL(item.blob) : item.src
            }));
            resolve(restored);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      return null;
    }
  }

  /* ── SVG 图标（含新增删除图标 del） ── */
  const ICO = {
    prev:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>`,
    next:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>`,
    play:   `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause:  `<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`,
    seq:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
    loop:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><text x="10" y="15" font-size="8" fill="currentColor" stroke="none" font-weight="bold">1</text></svg>`,
    rand:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
    list:   `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    import: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    edit:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    del:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>`
  };

  /* ══════════════════════════════════════════
     CSS 样式
     ══════════════════════════════════════════ */
  const CSS = `
  .gf-root {
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 2147483647;
    font-family: "Kaiti SC", "STKaiti", "KaiTi", "Songti SC", serif;
    pointer-events: none;
  }

  .gf-hanger-wrap {
    position: fixed;
    top: -40px;
    right: -60px;
    z-index: 10;
    pointer-events: none;
  }

  .gf-hanger {
    position: relative;
    user-select: none;
    transform-origin: 50% 0;
    pointer-events: none;
    will-change: transform;
  }

  .gf-hanger img {
    width: 260px;
    height: auto;
    display: block;
    pointer-events: none;
    filter: drop-shadow(0 6px 14px rgba(0,0,0,.35));
  }

  .gf-hitbox {
    position: absolute;
    top: 205px;
    left: 50%;
    transform: translateX(-50%);
    width: 92px;
    height: 92px;
    border-radius: 50%;
    cursor: grab;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
  }
  .gf-hitbox:active {
    cursor: grabbing;
  }

  .gf-panel-dock {
    position: fixed;
    top: 110px;
    right: 75px;
    width: 285px;
    z-index: 12;
    opacity: 0;
    visibility: hidden;
    transform: translateX(18px) scale(0.96);
    transition: opacity .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1), visibility .3s;
    pointer-events: none;
  }
  .gf-panel-dock.open {
    opacity: 1;
    visibility: visible;
    transform: translateX(0) scale(1);
    pointer-events: auto;
  }

  .gf-panel {
    position: relative;
    width: 100%;
    background: url('https://i.postimg.cc/V6kDDWf0/IMG-9015.jpg') no-repeat center center / cover;
    border-radius: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.16) inset;
    padding: 20px 16px 15px;
    box-sizing: border-box;
    color: #ffffff;
    overflow: hidden;
    cursor: move;
    user-select: none;
  }

  .gf-drag-bar {
    width: 36px;
    height: 4px;
    background: rgba(255,255,255,0.35);
    border-radius: 2px;
    margin: -8px auto 10px;
    pointer-events: none;
  }

  .gf-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(15,10,10,0.55) 0%, rgba(15,5,5,0.35) 45%, rgba(10,5,5,0.78) 100%);
    pointer-events: none;
    z-index: 0;
  }

  .gf-panel > * {
    position: relative;
    z-index: 1;
  }

  .gf-title {
    font-size: 17px;
    color: #ffffff;
    font-weight: bold;
    letter-spacing: 1.5px;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 6px rgba(0,0,0,0.85);
  }
  .gf-artist {
    font-family: "Songti SC", serif;
    font-size: 12px;
    color: rgba(255,255,255,0.85);
    margin-bottom: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 4px rgba(0,0,0,0.85);
  }

  .gf-progress-wrap {
    position: relative;
    width: 100%;
    height: 16px;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-bottom: 4px;
  }
  .gf-progress-track {
    width: 100%;
    height: 3px;
    background: rgba(255,255,255,0.28);
    border-radius: 3px;
    overflow: hidden;
  }
  .gf-progress-fill {
    height: 100%;
    width: 0%;
    background: #ffffff;
    border-radius: 3px;
    box-shadow: 0 0 8px rgba(255,255,255,0.9);
  }
  .gf-progress-thumb {
    position: absolute;
    top: 50%;
    left: 0%;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 6px rgba(0,0,0,0.6);
    transform: translate(-50%,-50%);
    pointer-events: none;
  }

  .gf-time {
    display: flex;
    justify-content: space-between;
    font-family: monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.8);
    margin-bottom: 12px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  }

  .gf-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    margin-bottom: 16px;
  }
  .gf-btn {
    background: none;
    border: none;
    padding: 6px;
    cursor: pointer;
    color: rgba(255,255,255,0.92);
    transition: all .15s;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 2px 5px rgba(0,0,0,0.6));
  }
  .gf-btn:hover {
    color: #ffffff;
    transform: scale(1.12);
  }
  .gf-btn:active {
    transform: scale(.92);
  }
  .gf-play {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: 1.5px solid rgba(255,255,255,0.55);
    backdrop-filter: blur(4px);
    color: #ffffff !important;
    box-shadow: 0 4px 14px rgba(0,0,0,.45);
  }
  .gf-play:hover {
    background: rgba(255,255,255,0.3);
  }

  .gf-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 4px 6px;
    backdrop-filter: blur(6px);
  }
  .gf-tool-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.88);
    font-size: 11px;
    font-family: inherit;
    padding: 5px 4px;
    border-radius: 14px;
    cursor: pointer;
    transition: background .15s, color .15s;
    white-space: nowrap;
  }
  .gf-tool-btn:hover, .gf-tool-btn.active {
    background: rgba(255,255,255,0.2);
    color: #ffffff;
  }
  .gf-tool-divider {
    width: 1px;
    height: 14px;
    background: rgba(255,255,255,0.2);
  }

  .gf-playlist-float {
    position: absolute;
    top: calc(100% + 12px);
    left: 0;
    width: 100%;
    max-height: 220px;
    background: rgba(18, 12, 12, 0.84);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 12px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.68);
    padding: 10px;
    box-sizing: border-box;
    color: #ffffff;
    overflow-y: auto;

    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all .28s cubic-bezier(.4,0,.2,1);
    pointer-events: none;
  }
  .gf-playlist-float.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  }
  .gf-playlist-float::-webkit-scrollbar { width: 4px; }
  .gf-playlist-float::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }

  .gf-track-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: background .15s;
  }
  .gf-track-item:hover { background: rgba(255,255,255,0.1); }
  .gf-track-item.active { background: rgba(185, 45, 40, 0.48); }
  .gf-track-num {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    width: 16px;
    text-align: center;
  }
  .gf-track-item.active .gf-track-num { color: #ffffff; font-weight: bold; }
  .gf-track-info { flex: 1; min-width: 0; }
  .gf-track-name {
    font-size: 13px;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gf-track-artist {
    font-size: 10px;
    color: rgba(255,255,255,0.65);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gf-edit-btn, .gf-del-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.55);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
  .gf-edit-btn:hover {
    color: #ffffff;
    background: rgba(255,255,255,0.15);
  }
  .gf-del-btn:hover {
    color: #ff6b6b;
    background: rgba(255, 80, 80, 0.18);
  }

  .gf-modal {
    position: absolute;
    inset: 0;
    background: rgba(12, 8, 8, 0.9);
    backdrop-filter: blur(8px);
    z-index: 10;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 16px;
    box-sizing: border-box;
    opacity: 0;
    visibility: hidden;
    transition: all .2s;
    cursor: default;
  }
  .gf-modal.open {
    opacity: 1;
    visibility: visible;
  }
  .gf-modal-title {
    font-size: 14px;
    color: #ffffff;
    margin-bottom: 12px;
    text-align: center;
    letter-spacing: 1px;
  }
  .gf-input {
    width: 100%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 6px;
    padding: 7px 10px;
    color: #ffffff;
    font-size: 12px;
    font-family: inherit;
    margin-bottom: 10px;
    box-sizing: border-box;
    outline: none;
  }
  .gf-input:focus {
    border-color: #ffffff;
    background: rgba(255,255,255,0.18);
  }
  .gf-modal-btns {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }
  .gf-modal-btn {
    flex: 1;
    padding: 6px 0;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.1);
    color: #ffffff;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
  }
  .gf-modal-btn.save {
    background: rgba(185, 45, 40, 0.75);
    border-color: rgba(255,255,255,0.4);
  }
  `;

  /* ══════════════════════════════════════════
     HTML 结构
     ══════════════════════════════════════════ */
  const HTML = `
  <div class="gf-root" id="gfRoot">
    <div class="gf-panel-dock" id="gfPanelDock">
      <div class="gf-panel" id="gfPanel">
        <div class="gf-drag-bar"></div>
        <div class="gf-title" id="gfTitle">—</div>
        <div class="gf-artist" id="gfArtist">—</div>

        <div class="gf-progress-wrap" id="gfProgressWrap">
          <div class="gf-progress-track">
            <div class="gf-progress-fill" id="gfProgressFill"></div>
          </div>
          <div class="gf-progress-thumb" id="gfProgressThumb"></div>
        </div>
        <div class="gf-time">
          <span id="gfTimeCur">0:00</span>
          <span id="gfTimeTot">0:00</span>
        </div>

        <div class="gf-controls">
          <button class="gf-btn" id="gfPrevBtn" title="上一首"></button>
          <button class="gf-btn gf-play" id="gfPlayBtn" title="播放/暂停"></button>
          <button class="gf-btn" id="gfNextBtn" title="下一首"></button>
        </div>

        <div class="gf-toolbar">
          <button class="gf-tool-btn" id="gfModeBtn">
            <span id="gfModeIco"></span>
            <span id="gfModeTxt">顺序</span>
          </button>
          <div class="gf-tool-divider"></div>
          <button class="gf-tool-btn" id="gfListBtn">
            ${ICO.list}
            <span>歌单</span>
          </button>
          <div class="gf-tool-divider"></div>
          <button class="gf-tool-btn" id="gfImportBtn">
            ${ICO.import}
            <span>导入</span>
          </button>
        </div>

        <div class="gf-modal" id="gfModal">
          <div class="gf-modal-title" id="gfModalTitle">编辑歌曲信息</div>
          <input class="gf-input" id="gfInputName" placeholder="请输入歌曲名" />
          <input class="gf-input" id="gfInputArtist" placeholder="请输入歌手/作者" />
          <div class="gf-modal-btns">
            <button class="gf-modal-btn" id="gfModalCancel">取消</button>
            <button class="gf-modal-btn save" id="gfModalSave">保存</button>
          </div>
        </div>
      </div>

      <div class="gf-playlist-float" id="gfPlaylistFloat"></div>
    </div>

    <div class="gf-hanger-wrap" id="gfHangerWrap">
      <div class="gf-hanger" id="gfHanger">
        <img src="https://i.postimg.cc/6pxt7ycW/0B46F722-46B9-43D6-80AA-168D19B00CB0.png" alt="铜钱挂件">
        <div class="gf-hitbox" id="gfHitbox" title="点击铜钱打开/收起播放器，按住可拖拽"></div>
      </div>
    </div>

    <input type="file" id="gfFileInput" accept=".mp3,.m4a,audio/mp3,audio/mp4,audio/x-m4a" style="display:none" />
    <audio id="gfAudio" preload="none"></audio>
  </div>`;

  /* ══════════════════════════════════════════
     注入与初始化
     ══════════════════════════════════════════ */
  const styleEl = D.createElement('style');
  styleEl.textContent = CSS;
  D.head.appendChild(styleEl);

  const wrapper = D.createElement('div');
  wrapper.innerHTML = HTML;
  D.body.appendChild(wrapper.firstElementChild);

  const hangerWrap    = D.getElementById('gfHangerWrap');
  const hangerEl      = D.getElementById('gfHanger');
  const hitboxEl      = D.getElementById('gfHitbox');
  const panelDock     = D.getElementById('gfPanelDock');
  const panelEl       = D.getElementById('gfPanel');
  const playlistFloat = D.getElementById('gfPlaylistFloat');
  const audio         = D.getElementById('gfAudio');
  const playBtn       = D.getElementById('gfPlayBtn');
  const prevBtn       = D.getElementById('gfPrevBtn');
  const nextBtn       = D.getElementById('gfNextBtn');
  const modeBtn       = D.getElementById('gfModeBtn');
  const modeIco       = D.getElementById('gfModeIco');
  const modeTxt       = D.getElementById('gfModeTxt');
  const listBtn       = D.getElementById('gfListBtn');
  const importBtn     = D.getElementById('gfImportBtn');
  const fileInput     = D.getElementById('gfFileInput');
  const titleEl       = D.getElementById('gfTitle');
  const artistEl      = D.getElementById('gfArtist');
  const pWrap         = D.getElementById('gfProgressWrap');
  const pFill         = D.getElementById('gfProgressFill');
  const pThumb        = D.getElementById('gfProgressThumb');
  const tCur          = D.getElementById('gfTimeCur');
  const tTot          = D.getElementById('gfTimeTot');

  const modalEl       = D.getElementById('gfModal');
  const modalTitle    = D.getElementById('gfModalTitle');
  const inputName     = D.getElementById('gfInputName');
  const inputArtist   = D.getElementById('gfInputArtist');
  const modalCancel   = D.getElementById('gfModalCancel');
  const modalSave     = D.getElementById('gfModalSave');

  let cur = 0;
  let playMode = 0;
  const MODES = [
    { name: '顺序', ico: ICO.seq },
    { name: '单曲', ico: ICO.loop },
    { name: '随机', ico: ICO.rand }
  ];

  panelDock.addEventListener('click', e => e.stopPropagation());

  /* ── 工具与渲染 ── */
  function fmt(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  function setProgress(ratio) {
    const pct = (Math.min(1, Math.max(0, ratio)) * 100).toFixed(2) + '%';
    pFill.style.width = pct;
    pThumb.style.left = pct;
  }

  function loadTrack(index, play = false) {
    if (!TRACKS.length) return;
    cur = (index + TRACKS.length) % TRACKS.length;
    const t = TRACKS[cur];
    audio.src = t.src;
    audio.load();

    titleEl.textContent = t.name;
    artistEl.textContent = t.artist;
    setProgress(0);
    tCur.textContent = '0:00';
    tTot.textContent = '0:00';

    renderList();
    if (play) audio.play().catch(() => {});
  }

  function renderList() {
    playlistFloat.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const el = D.createElement('div');
      el.className = `gf-track-item ${i === cur ? 'active' : ''}`;
      el.innerHTML = `
        <div class="gf-track-num">${i + 1}</div>
        <div class="gf-track-info">
          <div class="gf-track-name">${t.name}</div>
          <div class="gf-track-artist">${t.artist}</div>
        </div>
        <button class="gf-edit-btn" title="修改歌曲名与作者">${ICO.edit}</button>
        <button class="gf-del-btn" title="删除此歌曲">${ICO.del}</button>
      `;

      // 点击切换歌曲
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        loadTrack(i, true);
      });

      // 点击修改歌曲名/作者并保存到系统
      const editBtn = el.querySelector('.gf-edit-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal('修改歌曲信息', t.name, t.artist, (newName, newArtist) => {
          t.name = newName || t.name;
          t.artist = newArtist || t.artist;
          if (i === cur) {
            titleEl.textContent = t.name;
            artistEl.textContent = t.artist;
          }
          renderList();
          saveTracksToDB();
        });
      });

      // 点击删除歌曲并同步数据库
      const delBtn = el.querySelector('.gf-del-btn');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasPlaying = !audio.paused;
        if (t.blob && t.src) {
          URL.revokeObjectURL(t.src);
        }
        TRACKS.splice(i, 1);

        // 若全部删空，则自动恢复初始默认曲目
        if (TRACKS.length === 0) {
          TRACKS = DEFAULT_TRACKS.map(item => ({ ...item }));
          saveTracksToDB();
          loadTrack(0, false);
          return;
        }

        saveTracksToDB();

        if (i === cur) {
          cur = i % TRACKS.length;
          loadTrack(cur, wasPlaying);
        } else {
          if (i < cur) cur--;
          renderList();
        }
      });

      playlistFloat.appendChild(el);
    });
  }

  function syncPlayBtn() {
    playBtn.innerHTML = audio.paused ? ICO.play : ICO.pause;
  }

  function syncModeBtn() {
    modeIco.innerHTML = MODES[playMode].ico;
    modeTxt.textContent = MODES[playMode].name;
  }

  function nextTrackByMode(isAutoEnded = false) {
    if (!TRACKS.length) return;
    if (isAutoEnded && playMode === 1) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    if (playMode === 2 && TRACKS.length > 1) {
      let nextIdx = cur;
      while (nextIdx === cur) {
        nextIdx = Math.floor(Math.random() * TRACKS.length);
      }
      loadTrack(nextIdx, true);
    } else {
      loadTrack((cur + 1) % TRACKS.length, true);
    }
  }

  /* ── 弹窗与本地音频导入（自动存入IndexedDB） ── */
  let modalCallback = null;
  function openEditModal(title, defaultName, defaultArtist, callback) {
    modalTitle.textContent = title;
    inputName.value = defaultName;
    inputArtist.value = defaultArtist;
    modalCallback = callback;
    modalEl.classList.add('open');
  }

  modalCancel.addEventListener('click', () => {
    modalEl.classList.remove('open');
    modalCallback = null;
  });

  modalSave.addEventListener('click', () => {
    if (modalCallback) {
      modalCallback(inputName.value.trim(), inputArtist.value.trim());
    }
    modalEl.classList.remove('open');
    modalCallback = null;
  });

  importBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    let defArtist = '本地导入';
    let defName = rawName;
    if (rawName.includes('-')) {
      const parts = rawName.split('-');
      defName = parts[0].trim();
      defArtist = parts.slice(1).join('-').trim();
    }

    openEditModal('导入新歌曲', defName, defArtist, (finalName, finalArtist) => {
      TRACKS.push({
        id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: finalName || defName || '未命名歌曲',
        artist: finalArtist || defArtist || '未知歌手',
        blob: file,
        src: url
      });
      saveTracksToDB();
      loadTrack(TRACKS.length - 1, true);
      playlistFloat.classList.add('open');
      listBtn.classList.add('active');
    });
  });

  /* ══════════════════════════════════════════
     1. 铜钱挂件：精准热区拖拽与点击
     ══════════════════════════════════════════ */
  let isCoinDragging = false;
  let coinStartX = 0, coinStartY = 0, coinStartL = 0, coinStartT = 0;
  let lastCoinX = 0;

  hitboxEl.addEventListener('mousedown', onCoinDown);
  hitboxEl.addEventListener('touchstart', onCoinDown, { passive: false });

  function onCoinDown(e) {
    e.stopPropagation();
    requestMotionPermission();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    coinStartX = clientX;
    coinStartY = clientY;
    lastCoinX = clientX;

    const rect = hangerWrap.getBoundingClientRect();
    coinStartL = rect.left;
    coinStartT = rect.top;
    isCoinDragging = false;

    D.addEventListener('mousemove', onCoinMove);
    D.addEventListener('touchmove', onCoinMove, { passive: false });
    D.addEventListener('mouseup', onCoinUp);
    D.addEventListener('touchend', onCoinUp);
  }

  function onCoinMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - coinStartX;
    const dy = clientY - coinStartY;

    if (!isCoinDragging && Math.hypot(dx, dy) > 6) {
      isCoinDragging = true;
      hangerWrap.style.right = 'auto';
      hangerWrap.style.left = coinStartL + 'px';
      hangerWrap.style.top = coinStartT + 'px';
    }

    if (isCoinDragging) {
      if (e.cancelable) e.preventDefault();
      hangerWrap.style.left = (coinStartL + dx) + 'px';
      hangerWrap.style.top = (coinStartT + dy) + 'px';

      const vx = clientX - lastCoinX;
      lastCoinX = clientX;
      // 校准拖拽时的惯性摆动方向
      angularVelocity += vx * 0.015;
    }
  }

  function onCoinUp() {
    D.removeEventListener('mousemove', onCoinMove);
    D.removeEventListener('touchmove', onCoinMove);
    D.removeEventListener('mouseup', onCoinUp);
    D.removeEventListener('touchend', onCoinUp);
    setTimeout(() => { isCoinDragging = false; }, 50);
  }

  hitboxEl.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isCoinDragging) return;
    const isOpen = panelDock.classList.toggle('open');
    if (!isOpen) {
      playlistFloat.classList.remove('open');
      listBtn.classList.remove('active');
    }
    angularVelocity += (Math.random() > 0.5 ? 0.7 : -0.7);
  });

  /* ══════════════════════════════════════════
     2. 播放器面板：自由独立拖拽功能
     ══════════════════════════════════════════ */
  let isPanelDragging = false;
  let panelStartX = 0, panelStartY = 0, panelStartL = 0, panelStartT = 0;

  panelEl.addEventListener('mousedown', onPanelDown);
  panelEl.addEventListener('touchstart', onPanelDown, { passive: false });

  function onPanelDown(e) {
    if (e.target.closest('button, input, .gf-progress-wrap, .gf-modal, .gf-toolbar')) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    panelStartX = clientX;
    panelStartY = clientY;

    const rect = panelDock.getBoundingClientRect();
    panelStartL = rect.left;
    panelStartT = rect.top;
    isPanelDragging = false;

    D.addEventListener('mousemove', onPanelMove);
    D.addEventListener('touchmove', onPanelMove, { passive: false });
    D.addEventListener('mouseup', onPanelUp);
    D.addEventListener('touchend', onPanelUp);
  }

  function onPanelMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - panelStartX;
    const dy = clientY - panelStartY;

    if (!isPanelDragging && Math.hypot(dx, dy) > 4) {
      isPanelDragging = true;
      panelDock.style.right = 'auto';
      panelDock.style.left = panelStartL + 'px';
      panelDock.style.top = panelStartT + 'px';
    }

    if (isPanelDragging) {
      if (e.cancelable) e.preventDefault();
      panelDock.style.left = (panelStartL + dx) + 'px';
      panelDock.style.top = (panelStartT + dy) + 'px';
    }
  }

  function onPanelUp() {
    D.removeEventListener('mousemove', onPanelMove);
    D.removeEventListener('touchmove', onPanelMove);
    D.removeEventListener('mouseup', onPanelUp);
    D.removeEventListener('touchend', onPanelUp);
    setTimeout(() => { isPanelDragging = false; }, 50);
  }

  /* ══════════════════════════════════════════
     3. 柔和物理引擎（已反转左右倾斜与摇晃方向）
     ══════════════════════════════════════════ */
  let currentAngle = 6;
  let targetAngle = 0;
  let angularVelocity = 0;
  let motionGranted = false;

  function updatePhysics() {
    const springK = 0.045;
    const damping = 0.88;
    const microBreeze = Math.sin(Date.now() / 1300) * 0.6;

    const force = (targetAngle + microBreeze - currentAngle) * springK;
    angularVelocity = (angularVelocity + force) * damping;
    currentAngle += angularVelocity;

    if (currentAngle > 10) { currentAngle = 10; angularVelocity *= -0.3; }
    if (currentAngle < -10) { currentAngle = -10; angularVelocity *= -0.3; }

    hangerEl.style.transform = `rotate(${currentAngle.toFixed(2)}deg)`;
    requestAnimationFrame(updatePhysics);
  }
  requestAnimationFrame(updatePhysics);

  // 已修复：去掉原本的负号，使手机左右倾斜方向与铜钱垂坠方向一致
  function handleOrientation(e) {
    if (e.gamma !== null && e.gamma !== undefined) {
      const clamped = Math.max(-30, Math.min(30, e.gamma));
      targetAngle = clamped * 0.2;
    }
  }

  // 已修复：将 += 改为 -=，使摇晃受力方向反转校准
  function handleMotion(e) {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (acc && acc.x !== null && acc.x !== undefined) {
      if (Math.abs(acc.x) > 1.8) {
        angularVelocity -= Math.max(-1.2, Math.min(1.2, acc.x * 0.045));
      }
    }
  }

  function requestMotionPermission() {
    if (motionGranted) return;
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(state => {
        if (state === 'granted') {
          motionGranted = true;
          window.addEventListener('devicemotion', handleMotion, true);
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      }).catch(() => {});
    } else {
      motionGranted = true;
      window.addEventListener('devicemotion', handleMotion, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  }
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission !== 'function') {
    requestMotionPermission();
  }

  /* ── 音频与按钮事件绑定 ── */
  playBtn.innerHTML = ICO.play;
  prevBtn.innerHTML = ICO.prev;
  nextBtn.innerHTML = ICO.next;
  syncModeBtn();

  playBtn.addEventListener('click', () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });

  prevBtn.addEventListener('click', () => {
    if (playMode === 2 && TRACKS.length > 1) {
      nextTrackByMode(false);
    } else {
      loadTrack((cur - 1 + TRACKS.length) % TRACKS.length, true);
    }
  });

  nextBtn.addEventListener('click', () => nextTrackByMode(false));

  modeBtn.addEventListener('click', () => {
    playMode = (playMode + 1) % 3;
    syncModeBtn();
  });

  listBtn.addEventListener('click', () => {
    const isListOpen = playlistFloat.classList.toggle('open');
    listBtn.classList.toggle('active', isListOpen);
  });

  audio.addEventListener('play', syncPlayBtn);
  audio.addEventListener('pause', syncPlayBtn);
  audio.addEventListener('ended', () => nextTrackByMode(true));
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    setProgress(audio.currentTime / audio.duration);
    tCur.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('durationchange', () => {
    tTot.textContent = fmt(audio.duration);
  });

  /* ── 进度条交互 ── */
  let seekActive = false;
  function seekFrom(e) {
    const rect = pWrap.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const ratio = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
    if (audio.duration) {
      audio.currentTime = ratio * audio.duration;
      setProgress(ratio);
    }
  }
  pWrap.addEventListener('mousedown', e => { seekActive = true; seekFrom(e); e.stopPropagation(); });
  pWrap.addEventListener('touchstart', e => { seekActive = true; seekFrom(e); e.stopPropagation(); }, { passive: true });
  D.addEventListener('mousemove', e => { if (seekActive) seekFrom(e); });
  D.addEventListener('touchmove', e => { if (seekActive) seekFrom(e); }, { passive: true });
  D.addEventListener('mouseup', () => { seekActive = false; });
  D.addEventListener('touchend', () => { seekActive = false; });

  /* ── 启动时从本地数据库恢复歌单 ── */
  (async function initPlayer() {
    const saved = await loadTracksFromDB();
    if (saved && saved.length > 0) {
      TRACKS = saved;
    } else {
      TRACKS = DEFAULT_TRACKS.map(item => ({ ...item }));
      await saveTracksToDB();
    }
    loadTrack(0, true);
  })();

})();
