// ==UserScript==
// @name         绥玉の音楽播放器
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  在 SillyTavern 中注入双岛音乐播放器
// @match *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
‘use strict’;

/* ── 曲目 ── */
const TRACKS = [
{ name: ‘Fendi2’,        artist: ‘Rakhim / Khim / ayv1o’,    src: ‘http://music.163.com/song/media/outer/url?id=2754092574.mp3’ },
{ name: ‘有线耳机’,      artist: ‘ChiliChill / 电鸟个灯泡’,  src: ‘http://music.163.com/song/media/outer/url?id=2042954758.mp3’ },
{ name: ‘Run Run Run’,   artist: ‘The Real Group’,            src: ‘http://music.163.com/song/media/outer/url?id=3597639.mp3’    },
{ name: ‘Never Cease’,   artist: ‘SCARECROW’,                 src: ‘https://files.catbox.moe/027fkg.mp3’                         },
{ name: ‘Panic Attack’,  artist: ‘Alisky’,                    src: ‘https://files.catbox.moe/2p55dn.mp3’                         },
{ name: ‘摆渡’,          artist: ‘王天戈’,                    src: ‘https://files.catbox.moe/tinquz.mp3’                         },
{ name: ‘泡泡’,          artist: ‘牛佳钰’,                    src: ‘https://files.catbox.moe/rbqsvd.mp3’                         },
{ name: ‘Mute Mode’,     artist: ‘SCARECROW’,                 src: ‘https://files.catbox.moe/cijz86.mp3’                         },
];

/* ── CSS ── */
const CSS = `
@keyframes _diMw {
from { height: 3px;  opacity: .35; }
to   { height: 11px; opacity: 1;   }
}

```
.di-root {
  position: fixed; top: 68px; left: 50%;
  transform: translateX(-50%);
  z-index: 2147483647;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  pointer-events: none;
}
.di-root * { pointer-events: auto; }

.di-island {
  background: #000;
  border-radius: 22px;
  box-shadow: 0 0 0 1.5px #1e1e1e, 0 8px 28px rgba(0,0,0,.85);
  overflow: hidden;
  transition: width .32s cubic-bezier(.4,0,.2,1), border-radius .32s ease;
}

/* 上岛 */
.di-player { width: 155px; }
.di-player.open { width: 300px; border-radius: 26px; }

.di-player-hdr {
  height: 34px; padding: 0 12px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; user-select: none;
}
.di-ctitle {
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 11px; color: #fff;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 100px;
}
.di-wave { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.di-wave span {
  display: block; width: 2px; background: #fff; border-radius: 2px;
  animation: _diMw var(--d) ease-in-out infinite alternate;
  animation-delay: var(--dl, 0s);
}
.di-wave.paused span { animation-play-state: paused; height: 4px; opacity: .25; }

.di-player-body { max-height: 0; overflow: hidden; transition: max-height .35s cubic-bezier(.4,0,.2,1); }
.di-player.open .di-player-body { max-height: 110px; }

.di-player-cnt {
  padding: 8px 14px 12px;
  border-top: 1px solid rgba(255,255,255,.08);
  display: flex; flex-direction: column; gap: 7px;
}
.di-pname {
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 13px; font-weight: 600; color: #fff; letter-spacing: -.3px;
}
.di-partist {
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 10px; color: rgba(255,255,255,.36); margin-top: 2px;
}
.di-audio { width: 100%; height: 28px; filter: invert(1) hue-rotate(180deg) brightness(.8); }

/* 下岛 */
.di-list { width: 175px; }
.di-list.open { width: 300px; border-radius: 26px; }

.di-list-hdr {
  height: 30px; padding: 0 12px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; user-select: none;
}
.di-list-label {
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 10px; color: rgba(255,255,255,.4);
  display: flex; align-items: center; gap: 5px;
}
.di-chevron { transition: transform .28s ease; flex-shrink: 0; }
.di-list.open .di-chevron { transform: rotate(180deg); }

.di-list-body { max-height: 0; overflow: hidden; transition: max-height .42s cubic-bezier(.4,0,.2,1); }
.di-list.open .di-list-body { max-height: 300px; }

.di-list-scroll {
  padding: 4px 8px 8px;
  border-top: 1px solid rgba(255,255,255,.07);
  display: flex; flex-direction: column; gap: 1px;
  overflow-y: auto; max-height: 260px;
  transform: translateY(-10px); opacity: 0;
  transition: transform .34s cubic-bezier(.4,0,.2,1) .06s, opacity .28s ease .06s;
}
.di-list.open .di-list-scroll { transform: translateY(0); opacity: 1; }

.di-list-scroll::-webkit-scrollbar { width: 3px; }
.di-list-scroll::-webkit-scrollbar-track { background: transparent; }
.di-list-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }

.di-track {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 7px; border-radius: 10px;
  cursor: pointer; transition: background .15s;
}
.di-track:hover  { background: rgba(255,255,255,.07); }
.di-track.active { background: rgba(255,255,255,.10); }

.di-track-ind { width: 18px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.di-track-num {
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 10px; color: rgba(255,255,255,.2); font-variant-numeric: tabular-nums;
}
.di-track.active .di-track-num { display: none; }

.di-mini-wave { display: none; align-items: center; gap: 1.5px; }
.di-track.active .di-mini-wave { display: flex; }
.di-mini-wave span {
  display: block; width: 2px; background: rgba(255,255,255,.78); border-radius: 2px;
  animation: _diMw var(--d) ease-in-out infinite alternate;
  animation-delay: var(--dl, 0s);
}
.di-mini-wave.paused span { animation-play-state: paused; height: 3px; opacity: .25; }

.di-track-text { flex: 1; min-width: 0; }
.di-track-name {
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,.55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.di-track.active .di-track-name { color: #fff; }
.di-track-artist {
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 9.5px; color: rgba(255,255,255,.22); margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
```

`;

/* ── HTML ── */
const HTML = `<div class="di-root"> <div class="di-island di-player" id="diPlayer"> <div class="di-player-hdr" id="diPlayerHdr"> <span class="di-ctitle" id="diCtitle">—</span> <div class="di-wave" id="diWave"> <span style="--d:.7s;--dl:0s"></span> <span style="--d:1s;--dl:.1s"></span> <span style="--d:.85s;--dl:.22s"></span> <span style="--d:1.1s;--dl:.08s"></span> </div> </div> <div class="di-player-body"> <div class="di-player-cnt"> <div> <div class="di-pname" id="diName"></div> <div class="di-partist" id="diArtist"></div> </div> <audio class="di-audio" id="diAudio" controls> <source id="diSrc" src="" type="audio/mpeg"> </audio> </div> </div> </div> <div class="di-island di-list" id="diList"> <div class="di-list-hdr" id="diListHdr"> <span class="di-list-label"> <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"> <line x1="3" y1="6" x2="21" y2="6"/> <line x1="3" y1="12" x2="21" y2="12"/> <line x1="3" y1="18" x2="21" y2="18"/> </svg> 播放列表 </span> <svg class="di-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2.5"> <polyline points="6 9 12 15 18 9"/> </svg> </div> <div class="di-list-body"> <div class="di-list-scroll" id="diScroll"></div> </div> </div> </div>`;

/* ── 注入 ── */
const styleEl = document.createElement(‘style’);
styleEl.textContent = CSS;
document.head.appendChild(styleEl);

const wrapper = document.createElement(‘div’);
wrapper.innerHTML = HTML;
document.body.appendChild(wrapper);

/* ── 逻辑 ── */
let cur = 0;
const audio    = document.getElementById(‘diAudio’);
const srcEl    = document.getElementById(‘diSrc’);
const nameEl   = document.getElementById(‘diName’);
const artistEl = document.getElementById(‘diArtist’);
const ctitleEl = document.getElementById(‘diCtitle’);
const waveEl   = document.getElementById(‘diWave’);
const playerEl = document.getElementById(‘diPlayer’);
const listEl   = document.getElementById(‘diList’);
const scrollEl = document.getElementById(‘diScroll’);

document.getElementById(‘diPlayerHdr’).addEventListener(‘click’, () => playerEl.classList.toggle(‘open’));
document.getElementById(‘diListHdr’).addEventListener(‘click’,  () => listEl.classList.toggle(‘open’));

function load(i, play) {
cur = i;
const t = TRACKS[i];
srcEl.src = t.src;
audio.load();
nameEl.textContent   = t.name;
artistEl.textContent = t.artist;
ctitleEl.textContent = t.name;
render();
if (play && t.src) audio.play().catch(() => {});
}

function render() {
scrollEl.innerHTML = ‘’;
TRACKS.forEach((t, i) => {
const el = document.createElement(‘div’);
el.className = ‘di-track’ + (i === cur ? ’ active’ : ‘’);
el.innerHTML = `<div class="di-track-ind"> <span class="di-track-num">${i + 1}</span> <div class="di-mini-wave" id="mw${i}"> <span style="--d:.8s;--dl:0s"></span> <span style="--d:1.1s;--dl:.15s"></span> <span style="--d:.9s;--dl:.3s"></span> </div> </div> <div class="di-track-text"> <div class="di-track-name">${t.name}</div> <div class="di-track-artist">${t.artist}</div> </div>`;
el.addEventListener(‘click’, () => load(i, true));
scrollEl.appendChild(el);
});
syncAll();
}

function syncAll() {
const p = audio.paused;
waveEl.classList.toggle(‘paused’, p);
const mw = document.getElementById(‘mw’ + cur);
if (mw) mw.classList.toggle(‘paused’, p);
}

audio.addEventListener(‘play’,  syncAll);
audio.addEventListener(‘pause’, syncAll);
audio.addEventListener(‘ended’, () => {
if (cur < TRACKS.length - 1) load(cur + 1, true);
});

load(0, false);
})();
