// ==UserScript=
// ==UserScript==
// @name        绥玉の音乐播放器
// @version     1.1.0
// @description 在 SillyTavern 中注入双岛音乐播放器
// ==/UserScript==

(function () {
  'use strict';

  // ── 去重保护：已存在就跳过 ──
  const D = window.parent.document;
  if (D.getElementById('diRoot')) return;

  /* ── 曲目 ── */
  const TRACKS = [
    { name: 'Fendi2',       artist: 'Rakhim / Khim / ayv1o',    src: 'http://music.163.com/song/media/outer/url?id=2754092574.mp3' },
    { name: '有线耳机',     artist: 'ChiliChill / 电鸟个灯泡',  src: 'http://music.163.com/song/media/outer/url?id=2042954758.mp3' },
    { name: 'Run Run Run',  artist: 'The Real Group',            src: 'http://music.163.com/song/media/outer/url?id=3597639.mp3'    },
    { name: 'Never Cease',  artist: 'SCARECROW',                 src: 'https://files.catbox.moe/027fkg.mp3'  },
    { name: 'Panic Attack', artist: 'Alisky',                    src: 'https://files.catbox.moe/2p55dn.mp3'  },
    { name: '摆渡',         artist: '王天戈',                    src: 'https://files.catbox.moe/tinquz.mp3'  },
    { name: '泡泡',         artist: '牛佳钰',                    src: 'https://files.catbox.moe/rbqsvd.mp3'  },
    { name: 'Mute Mode',    artist: 'SCARECROW',                 src: 'https://files.catbox.moe/cijz86.mp3'  },
  ];

  /* ── CSS ── */
  const CSS = `
@keyframes _diMw {
  from { height: 3px; opacity: .35; }
  to   { height: 11px; opacity: 1; }
}
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
.di-pname   { font-family: -apple-system,'Helvetica Neue',sans-serif; font-size: 13px; font-weight: 600; color: #fff; letter-spacing: -.3px; }
.di-partist { font-family: -apple-system,'Helvetica Neue',sans-serif; font-size: 10px; color: rgba(255,255,255,.36); margin-top: 2px; }
.di-audio   { width: 100%; height: 28px; filter: invert(1) hue-rotate(180deg) brightness(.8); }

/* 下岛 */
.di-list { width: 175px; }
.di-list.open { width: 300px; border-radius: 26px; }

.di-list-hdr {
  height: 30px; padding: 0 12px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; user-select: none;
}
.di-list-label {
  font-family: -apple-system,'Helvetica Neue',sans-serif;
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
  font-family: -apple-system,'Helvetica Neue',sans-serif;
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
  font-family: -apple-system,'Helvetica Neue',sans-serif;
  font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,.55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.di-track.active .di-track-name { color: #fff; }
.di-track-artist {
  font-family: -apple-system,'Helvetica Neue',sans-serif;
  font-size: 9.5px; color: rgba(255,255,255,.22); margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
`;

  /* ── HTML ── */
  const HTML = `
&lt;div class="di-root" id="diRoot"&gt;
  &lt;div class="di-island di-player" id="diPlayer"&gt;
    &lt;div class="di-player-hdr" id="diPlayerHdr"&gt;
      &lt;span class="di-ctitle" id="diCtitle"&gt;—&lt;/span&gt;
      &lt;div class="di-wave" id="diWave"&gt;
        &lt;span style="--d:.7s;--dl:0s"&gt;&lt;/span&gt;
        &lt;span style="--d:1s;--dl:.1s"&gt;&lt;/span&gt;
        &lt;span style="--d:.85s;--dl:.22s"&gt;&lt;/span&gt;
        &lt;span style="--d:1.1s;--dl:.08s"&gt;&lt;/span&gt;
      &lt;/div&gt;
    &lt;/div&gt;
    &lt;div class="di-player-body"&gt;
      &lt;div class="di-player-cnt"&gt;
        &lt;div&gt;
          &lt;div class="di-pname" id="diName"&gt;&lt;/div&gt;
          &lt;div class="di-partist" id="diArtist"&gt;&lt;/div&gt;
        &lt;/div&gt;
        &lt;audio class="di-audio" id="diAudio" controls&gt;
          &lt;source id="diSrc" src="" type="audio/mpeg"&gt;
        &lt;/audio&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;

  &lt;div class="di-island di-list" id="diList"&gt;
    &lt;div class="di-list-hdr" id="diListHdr"&gt;
      &lt;span class="di-list-label"&gt;
        &lt;svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"&gt;
          &lt;line x1="3" y1="6"  x2="21" y2="6"/&gt;
          &lt;line x1="3" y1="12" x2="21" y2="12"/&gt;
          &lt;line x1="3" y1="18" x2="21" y2="18"/&gt;
        &lt;/svg&gt;
        播放列表
      &lt;/span&gt;
      &lt;svg class="di-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2.5"&gt;
        &lt;polyline points="6 9 12 15 18 9"/&gt;
      &lt;/svg&gt;
    &lt;/div&gt;
    &lt;div class="di-list-body"&gt;
      &lt;div class="di-list-scroll" id="diScroll"&gt;&lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/div&gt;`;

  /* ── 注入到主页面 ── */
  // Fix 1: CSS 注入到主页面 &lt;head&gt;
  const styleEl = D.createElement('style');
  styleEl.id = 'diStyle';
  styleEl.textContent = CSS;
  D.head.appendChild(styleEl);

  // Fix 2: HTML 注入到主页面 &lt;body&gt;
  const wrapper = D.createElement('div');
  wrapper.innerHTML = HTML;
  D.body.appendChild(wrapper);

  /* ── 逻辑：getElementById 全部用主页面的 D ── */
  let cur = 0;
  const audio    = D.getElementById('diAudio');
  const srcEl    = D.getElementById('diSrc');
  const nameEl   = D.getElementById('diName');
  const artistEl = D.getElementById('diArtist');
  const ctitleEl = D.getElementById('diCtitle');
  const waveEl   = D.getElementById('diWave');
  const playerEl = D.getElementById('diPlayer');
  const listEl   = D.getElementById('diList');
  const scrollEl = D.getElementById('diScroll');

  D.getElementById('diPlayerHdr').addEventListener('click', () =&gt; playerEl.classList.toggle('open'));
  D.getElementById('diListHdr').addEventListener('click',  () =&gt; listEl.classList.toggle('open'));

  function load(i, play) {
    cur = i;
    const t = TRACKS[i];
    srcEl.src = t.src;
    audio.load();
    nameEl.textContent   = t.name;
    artistEl.textContent = t.artist;
    ctitleEl.textContent = t.name;
    render();
    if (play && t.src) audio.play().catch(() =&gt; {});
  }

  function render() {
    scrollEl.innerHTML = '';
    TRACKS.forEach((t, i) =&gt; {
      const el = D.createElement('div');
      el.className = 'di-track' + (i === cur ? ' active' : '');
      el.innerHTML = `
        &lt;div class="di-track-ind"&gt;
          &lt;span class="di-track-num"&gt;${i + 1}&lt;/span&gt;
          &lt;div class="di-mini-wave" id="mw${i}"&gt;
            &lt;span style="--d:.8s;--dl:0s"&gt;&lt;/span&gt;
            &lt;span style="--d:1.1s;--dl:.15s"&gt;&lt;/span&gt;
            &lt;span style="--d:.9s;--dl:.3s"&gt;&lt;/span&gt;
          &lt;/div&gt;
        &lt;/div&gt;
        &lt;div class="di-track-text"&gt;
          &lt;div class="di-track-name"&gt;${t.name}&lt;/div&gt;
          &lt;div class="di-track-artist"&gt;${t.artist}&lt;/div&gt;
        &lt;/div&gt;`;
      el.addEventListener('click', () =&gt; load(i, true));
      scrollEl.appendChild(el);
    });
    syncAll();
  }

  function syncAll() {
    const p = audio.paused;
    waveEl.classList.toggle('paused', p);
    const mw = D.getElementById('mw' + cur);
    if (mw) mw.classList.toggle('paused', p);
  }

  audio.addEventListener('play',  syncAll);
  audio.addEventListener('pause', syncAll);
  audio.addEventListener('ended', () =&gt; {
    if (cur &lt; TRACKS.length - 1) load(cur + 1, true);
  });

  load(0, false);
})();
