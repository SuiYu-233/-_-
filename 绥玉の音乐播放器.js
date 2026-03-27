// ==UserScript=
// ==UserScript==
// @name         绥玉の音楽播放器 (修复版)
// @version      1.1.0
// @description  在 SillyTavern 中注入双岛音乐播放器 - 已修复语法与链接
// @namespace    https://github.com/SuiYu-233
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 启动日志
    console.log('🎵 [播放器-修复版] 脚本开始加载');

    // 全局错误捕获
    window.addEventListener('error', function(e) {
        console.error('❌ 播放器脚本全局错误:', e.message, '位于:', e.filename, ':', e.lineno);
    });

    /* ── 曲目列表 (已修复链接) ── */
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

    /* ── CSS样式 (保持原设计) ── */
    const CSS = `
        @keyframes _diMw {
            from { height: 3px; opacity: .35; }
            to { height: 11px; opacity: 1; }
        }
        .di-root {
            position: fixed;
            top: 68px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2147483647;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
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
        /* 上岛 - 播放器 */
        .di-player { width: 155px; }
        .di-player.open { width: 300px; border-radius: 26px; }
        .di-player-hdr {
            height: 34px;
            padding: 0 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }
        .di-ctitle {
            font-family: -apple-system, 'Helvetica Neue', sans-serif;
            font-size: 11px;
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100px;
        }
        .di-wave {
            display: flex;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
        }
        .di-wave span {
            display: block;
            width: 2px;
            background: #fff;
            border-radius: 2px;
            animation: _diMw var(--d) ease-in-out infinite alternate;
            animation-delay: var(--dl, 0s);
        }
        .di-wave.paused span {
            animation-play-state: paused;
            height: 4px;
            opacity: .25;
        }
        .di-player-body {
            max-height: 0;
            overflow: hidden;
            transition: max-height .35s cubic-bezier(.4,0,.2,1);
        }
        .di-player.open .di-player-body { max-height: 110px; }
        .di-player-cnt {
            padding: 8px 14px 12px;
            border-top: 1px solid rgba(255,255,255,.08);
            display: flex;
            flex-direction: column;
            gap: 7px;
        }
        .di-pname {
            font-family: -apple-system, 'Helvetica Neue', sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            letter-spacing: -.3px;
        }
        .di-partist {
            font-family: -apple-system, 'Helvetica Neue', sans-serif;
            font-size: 10px;
            color: rgba(255,255,255,.36);
            margin-top: 2px;
        }
        .di-audio {
            width: 100%;
            height: 28px;
            filter: invert(1) hue-rotate(180deg) brightness(.8);
        }
        /* 下岛 - 播放列表 */
        .di-list { width: 175px; }
        .di-list.open { width: 300px; border-radius: 26px; }
        .di-list-hdr {
            height: 30px;
            padding: 0 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }
        .di-list-label {
            font-family: -apple-system, 'Helvetica Neue', sans-serif;
            font-size: 10px;
            color: rgba(255,255,255,.4);
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .di-chevron { transition: transform .28s ease; flex-shrink: 0; }
        .di-list.open .di-chevron { transform: rotate(180deg); }
        .di-list-body {
            max-height: 0;
            overflow: hidden;
            transition: max-height .42s cubic-bezier(.4,0,.2,1);
        }
        .di-list.open .di-list-body { max-height: 300px; }
        .di-list-scroll {
            padding: 4px 8px 8px;
            border-top: 1px solid rgba(255,255,255,.07);
            display: flex;
            flex-direction: column;
            gap: 1px;
            overflow-y: auto;
            max-height: 260px;
            transform: translateY(-10px);
            opacity: 0;
            transition: transform .34s cubic-bezier(.4,0,.2,1) .06s, opacity .28s ease .06s;
        }
        .di-list.open .di-list-scroll {
            transform: translateY(0);
            opacity: 1;
        }
        .di-list-scroll::-webkit-scrollbar { width: 3px; }
        .di-list-scroll::-webkit-scrollbar-track { background: transparent; }
        .di-list-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 3px; }
        .di-track {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px 7px;
            border-radius: 10px;
            cursor: pointer;
            transition: background .15s;
        }
        .di-track:hover { background: rgba(255,255,255,.07); }
        .di-track.active { background: rgba(255,255,255,.10); }
        .di-track-ind {
            width: 18px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .di-track-num {
            font-family: -apple-system, 'Helvetica Neue', sans-serif;
            font-size: 10px;
            color: rgba(255,255,255,.2);
            font-variant-numeric: tabular-nums;
        }
        .di-track.active .di-track-num { display: none; }
        .di-mini-wave {
            display: none;
            align-items: center;
            gap: 1.5px;
        }
        .di-track.active .di-mini-wave { display: flex; }
        .di-mini-wave span {
            display: block;
            width: 2px;
            background: rgba(255,255,255,.78);
            border-radius: 2px;
            animation: _diMw var(--d) ease-in-out infinite alternate;
            animation-delay: var(--dl, 0s);
        }
        .di-mini-wave.paused span {
            animation-play-state: paused;
            height: 3px;
            opacity: .25;
        }
        .di-track-text { flex: 1; min-width: 0; }
        .di-track-name {
            font-family: -apple-system, 'Helvetica Neue', sans-serif;
            font-size: 11.5px;
            font-weight: 500;
            color: rgba(255,255,255,.55);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .di-track.active .di-track-name { color: #fff; }
        .di-track-artist {
            font-family: -apple-system, 'Helvetica Neue', sans-serif;
            font-size: 9.5px;
            color: rgba(255,255,255,.22);
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    `;

    /* ── HTML结构 ── */
    const HTML = `
    <div class="di-root">
        <div class="di-island di-player" id="diPlayer">
            <div class="di-player-hdr" id="diPlayerHdr">
                <span class="di-ctitle" id="diCtitle">—</span>
                <div class="di-wave" id="diWave">
                    <span style="--d:.7s;--dl:0s"></span>
                    <span style="--d:1s;--dl:.1s"></span>
                    <span style="--d:.85s;--dl:.22s"></span>
                    <span style="--d:1.1s;--dl:.08s"></span>
                </div>
            </div>
            <div class="di-player-body">
                <div class="di-player-cnt">
                    <div>
                        <div class="di-pname" id="diName"></div>
                        <div class="di-partist" id="diArtist"></div>
                    </div>
                    <audio class="di-audio" id="diAudio" controls>
                        <source id="diSrc" src="" type="audio/mpeg">
                    </audio>
                </div>
            </div>
        </div>
        <div class="di-island di-list" id="diList">
            <div class="di-list-hdr" id="diListHdr">
                <span class="di-list-label">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                    播放列表
                </span>
                <svg class="di-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </div>
            <div class="di-list-body">
                <div class="di-list-scroll" id="diScroll"></div>
            </div>
        </div>
    </div>`;

    /* ── 主函数：等待页面就绪后注入 ── */
    function initPlayer() {
        // 确保body已存在
        if (!document.body) {
            console.log('⏳ 等待 document.body 就绪...');
            setTimeout(initPlayer, 100);
            return;
        }

        // 避免重复注入
        if (document.getElementById('diPlayer')) {
            console.log('⏭️ 播放器已存在，跳过重复注入');
            return;
        }

        console.log('🎵 开始注入播放器样式与HTML');

        // 1. 注入CSS
        const styleEl = document.createElement('style');
        styleEl.textContent = CSS;
        document.head.appendChild(styleEl);

        // 2. 创建并注入播放器HTML容器
        const wrapper = document.createElement('div');
        wrapper.innerHTML = HTML;
        document.body.appendChild(wrapper);

        // 3. 获取DOM元素引用
        const audio = document.getElementById('diAudio');
        const srcEl = document.getElementById('diSrc');
        const nameEl = document.getElementById('diName');
        const artistEl = document.getElementById('diArtist');
        const ctitleEl = document.getElementById('diCtitle');
        const waveEl = document.getElementById('diWave');
        const playerEl = document.getElementById('diPlayer');
        const listEl = document.getElementById('diList');
        const scrollEl = document.getElementById('diScroll');

        let currentTrackIndex = 0;
        let userHasInteracted = false; // 新增：用户交互标志

        // 4. 绑定切换事件
        document.getElementById('diPlayerHdr').addEventListener('click', () => {
            playerEl.classList.toggle('open');
            // 用户第一次点击播放器时，尝试激活音频播放
            if (!userHasInteracted) {
                userHasInteracted = true;
                console.log('🖱️ 用户首次交互，尝试激活音频');
                // 如果当前音频是暂停状态，尝试播放
                if (audio.paused && srcEl.src) {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            console.log('⚠️ 首次播放尝试被阻止，可能需要更明确的点击操作。', e.name);
                        });
                    }
                }
            }
        });

        document.getElementById('diListHdr').addEventListener('click', () => {
            listEl.classList.toggle('open');
            // 点击列表也视为用户交互
            if (!userHasInteracted) {
                userHasInteracted = true;
                console.log('🖱️ 用户通过列表首次交互');
            }
        });

        /* ── 核心功能函数 ── */
        function loadTrack(index, shouldPlay) {
            if (index < 0 || index >= TRACKS.length) {
                console.error('❌ 无效的曲目索引:', index);
                return;
            }

            currentTrackIndex = index;
            const track = TRACKS[index];

            console.log(`🎶 加载曲目 ${index + 1}: ${track.name} - ${track.artist}`);

            // 更新音频源
            srcEl.src = track.src;
            audio.load(); // 重新加载新源

            // 更新曲目信息
            nameEl.textContent = track.name;
            artistEl.textContent = track.artist;
            ctitleEl.textContent = track.name;

            // 重新渲染播放列表
            renderPlaylist();

            // 如需播放，则尝试播放（仅在用户已交互后）
            if (shouldPlay && track.src && userHasInteracted) {
                console.log('▶️ 尝试播放...');
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.log('⏸️ 播放被阻止:', e.name, e.message);
                        // 可以在这里给用户一个提示
                    });
                }
            } else if (shouldPlay && !userHasInteracted) {
                console.log('💡 曲目已加载，点击播放器任意处开始播放');
            }
        }

        function renderPlaylist() {
            scrollEl.innerHTML = '';
            TRACKS.forEach((track, index) => {
                const trackEl = document.createElement('div');
                trackEl.className = 'di-track' + (index === currentTrackIndex ? ' active' : '');
                trackEl.innerHTML = `
                    <div class="di-track-ind">
                        <span class="di-track-num">${index + 1}</span>
                        <div class="di-mini-wave" id="mw${index}">
                            <span style="--d:.8s;--dl:0s"></span>
                            <span style="--d:1.1s;--dl:.15s"></span>
                            <span style="--d:.9s;--dl:.3s"></span>
                        </div>
                    </div>
                    <div class="di-track-text">
                        <div class="di-track-name">${track.name}</div>
                        <div class="di-track-artist">${track.artist}</div>
                    </div>
                `;
                trackEl.addEventListener('click', () => {
                    // 点击列表项时，确保用户交互标志为true
                    if (!userHasInteracted) userHasInteracted = true;
                    loadTrack(index, true);
                });
                scrollEl.appendChild(trackEl);
            });
            syncVisualizer();
        }

        function syncVisualizer() {
            const isPaused = audio.paused;
            waveEl.classList.toggle('paused', isPaused);
            const miniWave = document.getElementById('mw' + currentTrackIndex);
            if (miniWave) miniWave.classList.toggle('paused', isPaused);
        }

        // 5. 绑定音频事件
        audio.addEventListener('play', syncVisualizer);
        audio.addEventListener('pause', syncVisualizer);
        audio.addEventListener('ended', () => {
            console.log('⏭️ 当前曲目播放结束');
            // 播放结束时自动下一首
            if (currentTrackIndex < TRACKS.length - 1) {
                loadTrack(currentTrackIndex + 1, true);
            } else {
                console.log('🏁 播放列表已结束');
            }
        });

        // 添加音频加载错误监听
        audio.addEventListener('error', function(e) {
            console.error('❌ 音频加载/播放错误:', audio.error ? audio.error.message : '未知错误');
            console.error('   当前源:', srcEl.src);
            // 更新UI显示错误
            nameEl.textContent = '加载失败';
            ctitleEl.textContent = 'Error';
            waveEl.classList.add('paused');
        });

        // 6. 初始化：加载第一首曲目（不自动播放）
        loadTrack(0, false);

        console.log('✅ 播放器初始化和注入完成！请点击播放器开始使用。');
    }

    // 优化的启动方式：等待DOM完全就绪
    console.log('⏳ 等待页面就绪...');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 DOMContentLoaded 触发，开始初始化播放器');
            initPlayer();
        });
    } else {
        // DOMContentLoaded 已触发
        console.log('⚡ DOM 已就绪，立即初始化播放器');
        setTimeout(initPlayer, 0);
    }

})();
