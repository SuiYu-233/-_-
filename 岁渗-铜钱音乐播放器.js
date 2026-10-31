// ==UserScript==
// @name        岁渗铜钱音乐播放器
// @version      5.4.0
// @description  菜单浮出不裁切 · 酷狗/网易云跨域古风歌词识别 · 60帧毫秒同步与词轴微调/跟唱校准
// ==/UserScript==

(function () {
  'use strict';

  let D;
  try { D = window.parent.document; } catch (e) { D = document; }
  const oldRoot = D.getElementById('gfRoot');
  if (oldRoot) oldRoot.remove();

  /* ── 默认初始曲目列表 ── */
  const DEFAULT_TRACKS = [
    { id: 'def_1', name: '过桥', artist: '后弦', src: 'https://videotourl.com/audio/1793297043365-076b51d1-aff2-4a0e-9059-0e8c14709922.m4a', lrc: '', offset: 0 },
    { id: 'def_2', name: '众生相', artist: 'Oh元', src: 'https://videotourl.com/audio/1793350928490-65292479-b5b7-46cc-b5f2-bd04b8cd465e.m4a', lrc: '', offset: 0 },
    { id: 'def_3', name: '戏文说', artist: '叫宝宝/祥嘞嘞', src: 'https://videotourl.com/audio/1793330708715-3d409908-b66c-4604-9f2c-504485531a20.mp3', lrc: '', offset: 0 },
    { id: 'def_4', name: '昆明湖', artist: '后弦', src: 'https://videotourl.com/audio/1793351027001-88830db2-9155-4c84-bd53-7cbed469cfc1.m4a', lrc: '', offset: 0 },
    { id: 'def_5', name: '青梅晃', artist: '王书渝', src: 'https://videotourl.com/audio/1793323391500-8b230f57-8136-41a8-b94f-208a33803faa.m4a', lrc: '', offset: 0 },
    { id: 'def_6', name: '情呀爱呀', artist: '礼越', src: 'https://videotourl.com/audio/1793323502641-d3a6fc5c-ff69-4b90-bec9-a552c4369d7f.m4a', lrc: '', offset: 0 },
    { id: 'def_7', name: '茶汤', artist: '郁可唯', src: 'https://videotourl.com/audio/1793350751942-201476d0-b8d5-4ee7-bfd7-dbd1d752ec7c.m4a', lrc: '', offset: 0 },
    { id: 'def_8', name: '罗汉拳', artist: '阿萨Aza', src: 'https://videotourl.com/audio/1793351104195-e83eb7d2-8fa7-4602-a763-8c9a92b0a1b7.m4a', lrc: '', offset: 0 },
    { id: 'def_9', name: '下完这场雨', artist: '后弦', src: 'https://videotourl.com/audio/1793350873304-180d085c-1c4a-4f69-acce-9832dca5eb19.m4a', lrc: '', offset: 0 },
    { id: 'def_10', name: '来春打马', artist: 'ILEM', src: 'https://videotourl.com/audio/1793324368692-5c80ff9d-3929-44ee-a2cc-357d29a458d2.m4a', lrc: '', offset: 0 }
  ];

  let TRACKS = [];

  /* ══════════════════════════════════════════
     本地永久存储系统 (IndexedDB + 桌面歌词配置)
     ══════════════════════════════════════════ */
  const DB_NAME = 'GfMusicPlayerDB';
  const STORE_NAME = 'tracks_store';
  const CFG_KEY = 'GfMusicPlayerConfig_v54';

  let deskCfg = {
    enabled: true,
    locked: false,
    opacity: 0.92,
    left: null,
    top: 14
  };
  try {
    const savedCfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
    deskCfg = { ...deskCfg, ...savedCfg };
  } catch (e) {}

  function saveDeskCfg() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(deskCfg)); } catch (e) {}
  }

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
          blob: t.blob || null,
          lrc: t.lrc || '',
          offset: Number(t.offset) || 0
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
              src: item.blob ? URL.createObjectURL(item.blob) : item.src,
              lrc: item.lrc || '',
              offset: Number(item.offset) || 0
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

  /* ══════════════════════════════════════════
     全网穿透 · 华语/古风/翻唱多通道歌词自动识别引擎
     解决浏览器 CORS 跨域拦截，聚合酷狗、网易云、LrcApi、LRCLIB
     ══════════════════════════════════════════ */
  function fetchWithTimeout(url, options = {}, timeout = 5500) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
    ]);
  }

  // 多重 CORS 代理穿透封装（专门解决浏览器拦截音乐接口的问题）
  async function fetchViaCorsProxy(targetUrl, asJson = true) {
    const proxies = [
      (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];
    for (const buildProxy of proxies) {
      try {
        const res = await fetchWithTimeout(buildProxy(targetUrl), {}, 5000);
        if (res.ok) {
          return asJson ? await res.json() : await res.text();
        }
      } catch (e) {}
    }
    return null;
  }

  // Base64 UTF-8 解码（用于酷狗歌词解码）
  function decodeBase64Utf8(b64) {
    try {
      const binStr = atob(b64.replace(/\s/g, ''));
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      return null;
    }
  }

  // 提取本地音频文件内嵌歌词
  async function extractEmbeddedLyrics(file) {
    if (!file) return null;
    try {
      const buf = await file.slice(0, 512 * 1024).arrayBuffer();
      const bytes = new Uint8Array(buf);
      const rawStr = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      const lrcMatch = rawStr.match(/(\[\d{2}:\d{2}(?:\.\d{1,3})?\][^\x00\r\n]+(?:\r?\n\[\d{2}:\d{2}(?:\.\d{1,3})?\][^\x00\r\n]+){2,})/);
      if (lrcMatch && lrcMatch[1]) return lrcMatch[1].trim();
    } catch (e) {}
    return null;
  }

  async function autoRecognizeLyrics(track, forceRefresh = false) {
    if (!track) return null;
    if (track.lrc && track.lrc.trim() && !forceRefresh) return track.lrc;

    const cleanName = (track.name || '')
      .replace(/\(.*?\)|（.*?）|\[.*?\]|【.*?】|feat\..*|ft\..*/gi, '')
      .replace(/[-_]/g, ' ')
      .trim();
    const cleanArtist = (track.artist || '')
      .replace(/本地导入|未知歌手/g, '')
      .split(/[\/、&,，]/)[0]
      .trim();
    const keyword = `${cleanName} ${cleanArtist}`.trim();

    // 通道 0：本地音频内嵌标签扫描
    if (track.blob) {
      const embedded = await extractEmbeddedLyrics(track.blob);
      if (embedded) return embedded;
    }

    // 通道 1：酷狗音乐 LRC 歌词库（华语、古风、网络翻唱收录率第一，自带标准毫秒时间轴）
    try {
      const kgSearchUrl = `http://lyrics.kugou.com/search?ver=1&man=yes&client=pc&keyword=${encodeURIComponent(keyword)}&duration=&hash=`;
      const kgSearchData = await fetchViaCorsProxy(kgSearchUrl, true);
      if (kgSearchData && Array.isArray(kgSearchData.candidates) && kgSearchData.candidates.length > 0) {
        const best = kgSearchData.candidates[0];
        const kgDlUrl = `http://lyrics.kugou.com/download?ver=1&client=pc&id=${best.id}&accesskey=${best.accesskey}&fmt=lrc&charset=utf8`;
        const kgDlData = await fetchViaCorsProxy(kgDlUrl, true);
        if (kgDlData && kgDlData.content) {
          const decodedLrc = decodeBase64Utf8(kgDlData.content);
          if (decodedLrc && decodedLrc.includes('[')) return decodedLrc.trim();
        }
      }
    } catch (e) {}

    // 通道 2：网易云音乐官方搜索与歌词接口（通过 CORS 代理直连，识别独立音乐人与古风歌手）
    try {
      const neSearchUrl = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(keyword)}&type=1&offset=0&total=true&limit=5`;
      const neData = await fetchViaCorsProxy(neSearchUrl, true);
      const songs = neData && neData.result && neData.result.songs;
      if (Array.isArray(songs) && songs.length > 0) {
        const matchedSong = songs.find(s => s.name && s.name.includes(cleanName)) || songs[0];
        const neLrcUrl = `https://music.163.com/api/song/lyric?os=pc&id=${matchedSong.id}&lv=-1&kv=-1&tv=-1`;
        const lrcJson = await fetchViaCorsProxy(neLrcUrl, true);
        if (lrcJson && lrcJson.lrc && lrcJson.lrc.lyric) {
          return lrcJson.lrc.lyric.trim();
        }
      }
    } catch (e) {}

    // 通道 3：开源 Meting 多节点聚合检索（网易云 + QQ音乐双源）
    const metingApis = [
      `https://api.i-meto.com/meting/api?server=netease&type=search&id=${encodeURIComponent(keyword)}`,
      `https://api.injahow.cn/meting/?type=search&server=netease&id=${encodeURIComponent(keyword)}`,
      `https://api.i-meto.com/meting/api?server=tencent&type=search&id=${encodeURIComponent(keyword)}`
    ];
    for (const apiUrl of metingApis) {
      try {
        const res = await fetchWithTimeout(apiUrl, {}, 4500);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0 && list[0].lrc) {
            const lrcRes = await fetchWithTimeout(list[0].lrc, {}, 4500);
            if (lrcRes.ok) {
              const text = await lrcRes.text();
              if (text && text.includes('[')) return text.trim();
            }
          }
        }
      } catch (e) {}
    }

    // 通道 4：HisAtri/LrcApi 聚合接口 (直连 + 代理双保险)
    try {
      const lrcCxUrl = `https://api.lrc.cx/lyrics?title=${encodeURIComponent(cleanName)}&artist=${encodeURIComponent(cleanArtist)}`;
      let text = null;
      try {
        const r = await fetchWithTimeout(lrcCxUrl, {}, 4000);
        if (r.ok) text = await r.text();
      } catch (e) {
        text = await fetchViaCorsProxy(lrcCxUrl, false);
      }
      if (text && text.trim() && !text.includes('<!DOCTYPE') && text.length > 15) {
        return text.trim();
      }
    } catch (e) {}

    // 通道 5：LRCLIB 国际开源同步歌词库（仅按歌名二次宽泛匹配）
    try {
      const res = await fetchWithTimeout(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanName)}`, {}, 4500);
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const item = list.find(i => i.syncedLyrics) || list[0];
          if (item.syncedLyrics) return item.syncedLyrics.trim();
          if (item.plainLyrics) return item.plainLyrics.trim();
        }
      }
    } catch (e) {}

    return null;
  }

  /* ══════════════════════════════════════════
     高精度 LRC / 纯文本智能解析引擎
     - 支持 [mm:ss.xx]、[mm:ss:xx]、[mm:ss] 全格式时间轴
     - 支持 [offset:xxx] 标签解析
     - 纯文本无时间轴时：自动预留前奏/尾奏，并按每句字数权重分配时长
     ══════════════════════════════════════════ */
  function parseLyrics(rawText, totalDuration = 0, userOffsetSec = 0) {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.split(/\r?\n/);
    const parsed = [];

    // 兼容 [01:23.45]、[01:23:45]、[01:23] 等各种野生 LRC 时间戳格式
    const timeReg = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
    const offsetMatch = rawText.match(/\[offset:\s*([+-]?\d+)\s*\]/i);
    const metaOffsetSec = offsetMatch ? (parseInt(offsetMatch[1], 10) / 1000) : 0;

    let hasTimestamp = false;
    for (const rawLine of lines) {
      const matches = [...rawLine.matchAll(timeReg)];
      const text = rawLine
        .replace(timeReg, '')
        .replace(/^\[(ti|ar|al|by|offset):.*\]$/i, '')
        .trim();

      if (matches.length > 0) {
        hasTimestamp = true;
        for (const m of matches) {
          const min = parseInt(m[1], 10);
          const sec = parseInt(m[2], 10);
          const fracStr = m[3] || '0';
          const ms = parseInt(fracStr.padEnd(3, '0').slice(0, 3), 10);
          // 实际触发时间 = 原始时间轴 + LRC内嵌offset + 用户微调offset
          const time = Math.max(0, min * 60 + sec + ms / 1000 + metaOffsetSec + userOffsetSec);
          if (text) parsed.push({ time, text, isPlain: false });
        }
      }
    }

    if (hasTimestamp && parsed.length > 0) {
      parsed.sort((a, b) => a.time - b.time);
      return parsed;
    }

    // 若用户上传的是没有时间轴的纯文本歌词：
    // 采用「前奏预留 + 字数权重分配」代替呆板的平均切分，并支持后续一键打轴
    const plainLines = lines
      .map(l => l.replace(/^\[(ti|ar|al|by|offset):.*\]$/i, '').trim())
      .filter(Boolean);
    if (!plainLines.length) return [];

    const dur = (totalDuration && isFinite(totalDuration) && totalDuration > 20)
      ? totalDuration
      : Math.max(180, plainLines.length * 3.8);

    // 默认预留前奏 12 秒（或总时长的 7%），尾奏预留 8%
    const introPadding = Math.min(16, dur * 0.07);
    const outroPadding = Math.min(18, dur * 0.08);
    const singingSpan = Math.max(20, dur - introPadding - outroPadding);

    // 按每句字数计算权重（字多的句子停留长，字少的短句停留短）
    const weights = plainLines.map(line => Math.max(4, line.length));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let accumTime = introPadding;
    return plainLines.map((text, idx) => {
      const itemTime = Math.max(0, accumTime + userOffsetSec);
      accumTime += (weights[idx] / totalWeight) * singingSpan;
      return {
        time: itemTime,
        text,
        isPlain: true
      };
    });
  }

  function formatLrcTimestamp(sec) {
    const s = Math.max(0, sec);
    const min = Math.floor(s / 60);
    const rem = s % 60;
    const secInt = Math.floor(rem);
    const cs = Math.floor((rem - secInt) * 100);
    return `[${String(min).padStart(2, '0')}:${String(secInt).padStart(2, '0')}.${String(cs).padStart(2, '0')}]`;
  }

  /* ── SVG 图标 ── */
  const ICO = {
    prev:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>`,
    next:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>`,
    play:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
    pause:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`,
    menu:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/></svg>`,
    seq:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
    loop:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><text x="10" y="15" font-size="8" fill="currentColor" stroke="none" font-weight="bold">1</text></svg>`,
    rand:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
    list:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    import: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
    lrc:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    magic:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
    tap:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    edit:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
    del:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>`,
    lock:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
    unlock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>`,
    close:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
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

  /* 铜钱挂件 */
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
  .gf-hitbox:active { cursor: grabbing; }

  /* 播放器主面板外层容器（overflow: visible，确保子菜单突破边框不被裁切） */
  .gf-panel-dock {
    position: fixed;
    top: 110px;
    right: 75px;
    width: 296px;
    z-index: 12;
    opacity: 0;
    visibility: hidden;
    transform: translateX(18px) scale(0.96);
    transition: opacity .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1), visibility .3s;
    pointer-events: none;
    overflow: visible;
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
    padding: 16px 15px 13px;
    box-sizing: border-box;
    color: #ffffff;
    overflow: hidden;
    cursor: move;
    user-select: none;
    z-index: 1;
  }
  .gf-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(15,10,10,0.6) 0%, rgba(15,5,5,0.45) 45%, rgba(10,5,5,0.86) 100%);
    pointer-events: none;
    z-index: 0;
  }
  .gf-panel > * {
    position: relative;
    z-index: 1;
  }

  .gf-drag-bar {
    width: 32px;
    height: 3px;
    background: rgba(255,255,255,0.32);
    border-radius: 2px;
    margin: -6px auto 8px;
    pointer-events: none;
  }

  /* ══════════════════════════════════════════
     侧上方“更多”菜单：置于 .gf-panel 外部，层级 z-index: 99 高于播放器本体，向外浮出永不遮挡
     ══════════════════════════════════════════ */
  .gf-top-menu-wrap {
    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 99;
    pointer-events: auto;
  }
  .gf-menu-trigger {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(0,0,0,0.42);
    color: rgba(255,255,255,0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: all .15s;
    padding: 0;
  }
  .gf-menu-trigger:hover, .gf-menu-trigger.active {
    background: rgba(185, 45, 40, 0.85);
    border-color: rgba(255,255,255,0.55);
    color: #fff;
    transform: scale(1.08);
  }

  .gf-menu-popover {
    position: absolute;
    top: 26px;
    right: -12px;
    background: rgba(20, 12, 12, 0.96);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 11px;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 126px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.5);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px) scale(0.95);
    transition: all .2s cubic-bezier(.4,0,.2,1);
    pointer-events: none;
    z-index: 100;
  }
  .gf-menu-popover.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }
  .gf-tool-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    background: none;
    border: none;
    color: rgba(255,255,255,0.9);
    font-size: 11.5px;
    font-family: inherit;
    padding: 6px 10px;
    border-radius: 7px;
    cursor: pointer;
    transition: background .15s, color .15s;
    white-space: nowrap;
    text-align: left;
  }
  .gf-tool-btn:hover, .gf-tool-btn.active {
    background: rgba(185, 45, 40, 0.55);
    color: #ffffff;
  }

  /* 顶部区域：左侧歌名歌手 + 右侧播放控制 */
  .gf-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-right: 24px;
    margin-bottom: 8px;
  }
  .gf-meta-info {
    flex: 1;
    min-width: 0;
  }
  .gf-title {
    font-size: 15.5px;
    color: #ffffff;
    font-weight: bold;
    letter-spacing: 1px;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 6px rgba(0,0,0,0.85);
  }
  .gf-artist {
    font-family: "Songti SC", serif;
    font-size: 11px;
    color: rgba(255,255,255,0.8);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 4px rgba(0,0,0,0.85);
  }

  .gf-controls-side {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
  }
  .gf-btn {
    background: none;
    border: none;
    padding: 4px;
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
    transform: scale(1.1);
  }
  .gf-btn:active { transform: scale(.92); }
  .gf-play {
    width: 31px;
    height: 31px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    border: 1.2px solid rgba(255,255,255,0.55);
    backdrop-filter: blur(4px);
    color: #ffffff !important;
    box-shadow: 0 3px 10px rgba(0,0,0,.45);
  }
  .gf-play:hover { background: rgba(255,255,255,0.3); }

  /* 进度条区域 */
  .gf-progress-wrap {
    position: relative;
    width: 100%;
    height: 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-bottom: 1px;
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
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 6px rgba(0,0,0,0.6);
    transform: translate(-50%,-50%);
    pointer-events: none;
  }
  .gf-time {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: monospace;
    font-size: 10px;
    color: rgba(255,255,255,0.75);
    margin-bottom: 6px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  }

  /* 词轴实时微调小胶囊（解决歌词快慢对不上的问题） */
  .gf-offset-bar {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-family: "Songti SC", serif;
    font-size: 9.5px;
    color: rgba(255,255,255,0.72);
    background: rgba(0,0,0,0.32);
    padding: 1px 5px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.14);
  }
  .gf-offset-btn {
    background: none;
    border: none;
    color: #ffd29d;
    cursor: pointer;
    font-size: 9.5px;
    padding: 0 3px;
    border-radius: 3px;
    font-family: monospace;
  }
  .gf-offset-btn:hover {
    background: rgba(255,255,255,0.2);
    color: #fff;
  }
  .gf-tap-trigger {
    background: rgba(185,45,40,0.55);
    border: 1px solid rgba(255,200,180,0.35);
    color: #fff;
    cursor: pointer;
    font-size: 9.5px;
    padding: 0 5px;
    border-radius: 6px;
    margin-left: 2px;
    font-family: inherit;
  }
  .gf-tap-trigger:hover { background: rgba(185,45,40,0.85); }

  /* ══════════════════════════════════════════
     面板最下方：严格的 3 行视口滚动歌词窗
     ══════════════════════════════════════════ */
  .gf-lyrics-box {
    position: relative;
    width: 100%;
    height: 72px;
    background: rgba(0, 0, 0, 0.34);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 9px;
    overflow: hidden;
    cursor: default;
  }
  .gf-lyrics-viewport {
    width: 100%;
    height: 100%;
    overflow: hidden;
    -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
    mask-image: linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%);
  }
  .gf-lyrics-track {
    width: 100%;
    will-change: transform;
    transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
    text-align: center;
  }
  .gf-lyric-line {
    height: 24px;
    line-height: 24px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.45);
    transition: color .2s ease, transform .2s ease, font-size .2s ease;
    padding: 0 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    box-sizing: border-box;
  }
  .gf-lyric-line:hover { color: rgba(255, 255, 255, 0.8); }
  .gf-lyric-line.active {
    font-size: 13.5px;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 0 10px rgba(255, 200, 150, 0.92), 0 1px 3px rgba(0,0,0,0.95);
    transform: scale(1.02);
  }
  .gf-lyric-status {
    height: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.68);
    font-size: 11.5px;
    gap: 5px;
  }
  .gf-lyric-empty-btn {
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.28);
    color: #fff;
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 10.5px;
    font-family: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .gf-lyric-empty-btn:hover { background: rgba(185, 45, 40, 0.7); }

  /* 跟唱打轴浮层（专门解决自传纯文本歌词没有时间轴、快慢对不上的终极武器） */
  .gf-tap-overlay {
    position: absolute;
    inset: 0;
    background: rgba(18, 10, 10, 0.94);
    z-index: 6;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    box-sizing: border-box;
    text-align: center;
  }
  .gf-tap-overlay.open { display: flex; }
  .gf-tap-hint {
    font-size: 11px;
    color: #ffd29d;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }
  .gf-tap-btns {
    display: flex;
    gap: 6px;
    width: 100%;
  }
  .gf-tap-main-btn {
    flex: 1;
    background: rgba(185, 45, 40, 0.85);
    border: 1px solid rgba(255,255,255,0.45);
    color: #fff;
    border-radius: 6px;
    padding: 5px 0;
    font-size: 11.5px;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
  }
  .gf-tap-main-btn:active { transform: scale(0.96); }
  .gf-tap-cancel-btn {
    padding: 5px 8px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25);
    color: #fff;
    border-radius: 6px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }

  /* 歌单浮动面板 */
  .gf-playlist-float {
    position: absolute;
    top: calc(100% + 10px);
    left: 0;
    width: 100%;
    max-height: 200px;
    background: rgba(18, 12, 12, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 12px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.68);
    padding: 8px;
    box-sizing: border-box;
    color: #ffffff;
    overflow-y: auto;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all .28s cubic-bezier(.4,0,.2,1);
    pointer-events: none;
    z-index: 20;
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
    gap: 6px;
    padding: 6px 8px;
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
    font-size: 12px;
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
  .gf-lrc-badge {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(255,255,255,0.16);
    color: rgba(255,255,255,0.85);
    margin-left: 4px;
  }
  .gf-lrc-btn, .gf-edit-btn, .gf-del-btn {
    background: none;
    border: none;
    color: rgba(255,255,255,0.58);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
  .gf-lrc-btn:hover, .gf-edit-btn:hover {
    color: #ffffff;
    background: rgba(255,255,255,0.15);
  }
  .gf-del-btn:hover {
    color: #ff6b6b;
    background: rgba(255, 80, 80, 0.18);
  }

  /* 弹窗（歌曲信息编辑 & 歌词识别/编辑/删除） */
  .gf-modal {
    position: absolute;
    inset: 0;
    background: rgba(12, 8, 8, 0.96);
    backdrop-filter: blur(10px);
    z-index: 30;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 12px 14px;
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
    font-size: 12.5px;
    color: #ffffff;
    margin-bottom: 7px;
    text-align: center;
    letter-spacing: 0.5px;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gf-input {
    width: 100%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 6px;
    padding: 6px 9px;
    color: #ffffff;
    font-size: 12px;
    font-family: inherit;
    margin-bottom: 8px;
    box-sizing: border-box;
    outline: none;
  }
  .gf-textarea {
    width: 100%;
    height: 92px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.28);
    border-radius: 6px;
    padding: 6px 8px;
    color: #ffffff;
    font-size: 11px;
    font-family: monospace, inherit;
    margin-bottom: 7px;
    box-sizing: border-box;
    outline: none;
    resize: none;
    line-height: 1.45;
  }
  .gf-input:focus, .gf-textarea:focus {
    border-color: #ffffff;
    background: rgba(255,255,255,0.16);
  }
  .gf-modal-subbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 7px;
    gap: 4px;
  }
  .gf-mini-btn {
    flex: 1;
    padding: 4px 3px;
    font-size: 10px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.12);
    color: #fff;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    white-space: nowrap;
  }
  .gf-mini-btn:hover { background: rgba(255,255,255,0.22); }
  .gf-mini-btn.primary { background: rgba(185, 45, 40, 0.58); border-color: rgba(255,200,180,0.4); }
  .gf-mini-btn.primary:hover { background: rgba(185, 45, 40, 0.85); }
  .gf-mini-btn.danger:hover { background: rgba(210, 50, 50, 0.55); }
  .gf-modal-btns {
    display: flex;
    gap: 8px;
  }
  .gf-modal-btn {
    flex: 1;
    padding: 5px 0;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.1);
    color: #ffffff;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
  }
  .gf-modal-btn.save {
    background: rgba(185, 45, 40, 0.78);
    border-color: rgba(255,255,255,0.45);
  }

  /* ══════════════════════════════════════════
     当播放器本体不显示时：屏幕正上居中【单句滚动】悬浮歌词栏
     ══════════════════════════════════════════ */
  .gf-desktop-lyric {
    position: fixed;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 11;
    width: min(84vw, 480px);
    padding: 6px 14px 8px;
    border-radius: 12px;
    text-align: center;
    pointer-events: auto;
    cursor: move;
    user-select: none;
    transition: opacity .25s ease, background .2s ease, box-shadow .2s ease;
  }
  .gf-desktop-lyric.hidden {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
  .gf-desktop-lyric:hover:not(.locked) {
    background: rgba(15, 10, 10, 0.62);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 4px 18px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.16) inset;
  }
  .gf-desktop-lyric.locked {
    cursor: default;
    pointer-events: none;
  }

  .gf-desk-viewport {
    position: relative;
    width: 100%;
    height: 44px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .gf-desk-line-main {
    width: 100%;
    font-size: 16.5px;
    font-weight: bold;
    color: #ffffff;
    letter-spacing: 1px;
    line-height: 24px;
    height: 24px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 0 10px rgba(185, 45, 40, 0.92), 0 2px 4px rgba(0,0,0,0.95), 0 0 2px #000;
    transition: transform .25s ease, opacity .25s ease;
  }
  .gf-desk-line-sub {
    width: 100%;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.78);
    line-height: 18px;
    height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 4px rgba(0,0,0,0.95);
    transition: transform .25s ease, opacity .25s ease;
  }

  .gf-desk-ctrl {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 4px;
    opacity: 0;
    visibility: hidden;
    transition: opacity .2s ease, visibility .2s ease;
    pointer-events: auto;
  }
  .gf-desktop-lyric:hover:not(.locked) .gf-desk-ctrl {
    opacity: 1;
    visibility: visible;
  }
  .gf-desk-unlock-pill {
    display: none;
    position: absolute;
    top: -4px;
    right: -4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(20, 12, 12, 0.8);
    border: 1px solid rgba(255,255,255,0.35);
    color: #ffd080;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    pointer-events: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.6);
    opacity: 0.35;
    transition: opacity .2s, transform .2s;
  }
  .gf-desk-unlock-pill:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  .gf-desktop-lyric.locked .gf-desk-unlock-pill {
    display: flex;
  }

  .gf-desk-btn {
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.25);
    color: #fff;
    border-radius: 6px;
    padding: 2px 6px;
    font-size: 10.5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 3px;
    font-family: inherit;
  }
  .gf-desk-btn:hover { background: rgba(185, 45, 40, 0.75); }
  .gf-desk-slider-wrap {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.12);
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.2);
  }
  .gf-desk-slider {
    width: 50px;
    height: 3px;
    accent-color: #d94a44;
    cursor: pointer;
  }
  `;

  /* ══════════════════════════════════════════
     HTML 结构（已将 gfTopMenuWrap 移出 gfPanel，彻底解决遮挡裁切）
     ══════════════════════════════════════════ */
  const HTML = `
  <div class="gf-root" id="gfRoot">
    <!-- 播放器本体不显示时：屏幕正上居中悬浮滚动歌词 -->
    <div class="gf-desktop-lyric" id="gfDeskLyric">
      <div class="gf-desk-ctrl" id="gfDeskCtrl">
        <div class="gf-desk-slider-wrap" title="调节歌词透明度">
          <span>透明</span>
          <input type="range" class="gf-desk-slider" id="gfDeskOpacity" min="0.15" max="1" step="0.05" value="0.92" />
        </div>
        <button class="gf-desk-btn" id="gfDeskLockBtn" title="锁定歌词">${ICO.lock}<span>锁定</span></button>
        <button class="gf-desk-btn" id="gfDeskCloseBtn" title="关闭歌词">${ICO.close}<span>关闭</span></button>
      </div>
      <button class="gf-desk-unlock-pill" id="gfDeskUnlockBtn" title="点击解锁歌词">${ICO.unlock}</button>
      <div class="gf-desk-viewport">
        <div class="gf-desk-line-main" id="gfDeskMain">岁渗铜钱 · 聆听佳音</div>
        <div class="gf-desk-line-sub" id="gfDeskSub"></div>
      </div>
    </div>

    <!-- 播放器外层停靠容器 -->
    <div class="gf-panel-dock" id="gfPanelDock">

      <!-- 侧上方小巧收纳按钮与弹出菜单（置于 gf-panel 外部，层级高于面板，绝不裁切遮挡） -->
      <div class="gf-top-menu-wrap" id="gfTopMenuWrap">
        <button class="gf-menu-trigger" id="gfMenuTrigger" title="更多功能">${ICO.menu}</button>
        <div class="gf-menu-popover" id="gfMenuPopover">
          <button class="gf-tool-btn" id="gfModeBtn">
            <span id="gfModeIco"></span>
            <span id="gfModeTxt">顺序播放</span>
          </button>
          <button class="gf-tool-btn" id="gfListBtn">
            ${ICO.list}
            <span>歌单列表</span>
          </button>
          <button class="gf-tool-btn" id="gfImportBtn">
            ${ICO.import}
            <span>导入音乐</span>
          </button>
          <button class="gf-tool-btn" id="gfCurLrcBtn">
            ${ICO.lrc}
            <span>歌词识别/编辑</span>
          </button>
          <button class="gf-tool-btn" id="gfStartTapMenuBtn">
            ${ICO.tap}
            <span>跟唱手动打轴</span>
          </button>
          <button class="gf-tool-btn" id="gfToggleDeskLrcBtn">
            ${ICO.lrc}
            <span id="gfToggleDeskLrcTxt">顶部歌词: 开</span>
          </button>
        </div>
      </div>

      <!-- 播放器本体面板 -->
      <div class="gf-panel" id="gfPanel">
        <div class="gf-drag-bar"></div>

        <!-- 顶部：左侧歌名歌手 + 侧边播放控制 -->
        <div class="gf-header-row">
          <div class="gf-meta-info">
            <div class="gf-title" id="gfTitle">—</div>
            <div class="gf-artist" id="gfArtist">—</div>
          </div>
          <div class="gf-controls-side">
            <button class="gf-btn" id="gfPrevBtn" title="上一首"></button>
            <button class="gf-btn gf-play" id="gfPlayBtn" title="播放/暂停"></button>
            <button class="gf-btn" id="gfNextBtn" title="下一首"></button>
          </div>
        </div>

        <!-- 中部：歌曲进度条 + 词轴快慢微调器 -->
        <div class="gf-progress-wrap" id="gfProgressWrap">
          <div class="gf-progress-track">
            <div class="gf-progress-fill" id="gfProgressFill"></div>
          </div>
          <div class="gf-progress-thumb" id="gfProgressThumb"></div>
        </div>
        <div class="gf-time">
          <span id="gfTimeCur">0:00</span>
          <div class="gf-offset-bar" title="歌词快了或慢了？点此实时微调时间轴并自动保存">
            <button class="gf-offset-btn" id="gfOffsetMinus" title="歌词慢了，提前0.5秒">-0.5s</button>
            <span id="gfOffsetVal">词轴0.0s</span>
            <button class="gf-offset-btn" id="gfOffsetPlus" title="歌词跑快了，延后0.5秒">+0.5s</button>
            <button class="gf-tap-trigger" id="gfQuickTapBtn" title="纯文本歌词对不上？点此跟唱按节奏拍打生成精准时间轴">打轴</button>
          </div>
          <span id="gfTimeTot">0:00</span>
        </div>

        <!-- 最下方：3行定高视口随进度滚动歌词 + 跟唱打轴校准器 -->
        <div class="gf-lyrics-box" id="gfLyricsBox">
          <div class="gf-lyrics-viewport">
            <div class="gf-lyrics-track" id="gfLyricsTrack"></div>
          </div>
          <div class="gf-tap-overlay" id="gfTapOverlay">
            <div class="gf-tap-hint" id="gfTapHint">准备打轴...</div>
            <div class="gf-tap-btns">
              <button class="gf-tap-main-btn" id="gfTapStampBtn">唱到这句时点我 (或按空格)</button>
              <button class="gf-tap-cancel-btn" id="gfTapExitBtn">完成</button>
            </div>
          </div>
        </div>

        <!-- 弹窗1：编辑歌曲信息 -->
        <div class="gf-modal" id="gfModal">
          <div class="gf-modal-title" id="gfModalTitle">编辑歌曲信息</div>
          <input class="gf-input" id="gfInputName" placeholder="请输入歌曲名" />
          <input class="gf-input" id="gfInputArtist" placeholder="请输入歌手/作者" />
          <div class="gf-modal-btns">
            <button class="gf-modal-btn" id="gfModalCancel">取消</button>
            <button class="gf-modal-btn save" id="gfModalSave">保存</button>
          </div>
        </div>

        <!-- 弹窗2：歌词自动识别 / 随时编辑 / 删除 -->
        <div class="gf-modal" id="gfLrcModal">
          <div class="gf-modal-title" id="gfLrcModalTitle">歌词识别与编辑</div>
          <div class="gf-modal-subbar">
            <button class="gf-mini-btn primary" id="gfLrcAutoBtn">${ICO.magic}<span>全网重搜歌词</span></button>
            <button class="gf-mini-btn" id="gfLrcUploadBtn">导入文件</button>
            <button class="gf-mini-btn" id="gfLrcTapModalBtn">${ICO.tap}<span>跟唱打轴</span></button>
            <button class="gf-mini-btn danger" id="gfLrcClearBtn">清空</button>
          </div>
          <textarea class="gf-textarea" id="gfLrcTextarea" placeholder="支持自动识别酷狗/网易云带[00:12.34]时间轴的歌词。若您粘贴的是无时间轴纯文本歌词，保存后点击面板上的「打轴」即可边听边点，1分钟对齐每句歌词！"></textarea>
          <div class="gf-modal-btns">
            <button class="gf-modal-btn" id="gfLrcModalCancel">取消</button>
            <button class="gf-modal-btn save" id="gfLrcModalSave">保存并长期储存</button>
          </div>
        </div>
      </div>

      <div class="gf-playlist-float" id="gfPlaylistFloat"></div>
    </div>

    <!-- 右上角铜钱挂件 -->
    <div class="gf-hanger-wrap" id="gfHangerWrap">
      <div class="gf-hanger" id="gfHanger">
        <img src="https://i.postimg.cc/6pxt7ycW/0B46F722-46B9-43D6-80AA-168D19B00CB0.png" alt="铜钱挂件">
        <div class="gf-hitbox" id="gfHitbox" title="点击铜钱打开/收起播放器，按住可拖拽"></div>
      </div>
    </div>

    <input type="file" id="gfFileInput" accept=".mp3,.m4a,audio/mp3,audio/mp4,audio/x-m4a" style="display:none" />
    <input type="file" id="gfLrcFileInput" accept=".lrc,.txt,text/plain" style="display:none" />
    <audio id="gfAudio" preload="none"></audio>
  </div>`;

  /* ══════════════════════════════════════════
     注入与初始化引用
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

  const menuTrigger   = D.getElementById('gfMenuTrigger');
  const menuPopover   = D.getElementById('gfMenuPopover');
  const modeBtn       = D.getElementById('gfModeBtn');
  const modeIco       = D.getElementById('gfModeIco');
  const modeTxt       = D.getElementById('gfModeTxt');
  const listBtn       = D.getElementById('gfListBtn');
  const importBtn     = D.getElementById('gfImportBtn');
  const curLrcBtn     = D.getElementById('gfCurLrcBtn');
  const startTapMenu  = D.getElementById('gfStartTapMenuBtn');
  const toggleDeskBtn = D.getElementById('gfToggleDeskLrcBtn');
  const toggleDeskTxt = D.getElementById('gfToggleDeskLrcTxt');

  const fileInput     = D.getElementById('gfFileInput');
  const lrcFileInput  = D.getElementById('gfLrcFileInput');
  const titleEl       = D.getElementById('gfTitle');
  const artistEl      = D.getElementById('gfArtist');
  const pWrap         = D.getElementById('gfProgressWrap');
  const pFill         = D.getElementById('gfProgressFill');
  const pThumb        = D.getElementById('gfProgressThumb');
  const tCur          = D.getElementById('gfTimeCur');
  const tTot          = D.getElementById('gfTimeTot');

  const offsetMinus   = D.getElementById('gfOffsetMinus');
  const offsetPlus    = D.getElementById('gfOffsetPlus');
  const offsetVal     = D.getElementById('gfOffsetVal');
  const quickTapBtn   = D.getElementById('gfQuickTapBtn');

  const lyricsTrack   = D.getElementById('gfLyricsTrack');
  const tapOverlay    = D.getElementById('gfTapOverlay');
  const tapHint       = D.getElementById('gfTapHint');
  const tapStampBtn   = D.getElementById('gfTapStampBtn');
  const tapExitBtn    = D.getElementById('gfTapExitBtn');

  const modalEl       = D.getElementById('gfModal');
  const modalTitle    = D.getElementById('gfModalTitle');
  const inputName     = D.getElementById('gfInputName');
  const inputArtist   = D.getElementById('gfInputArtist');
  const modalCancel   = D.getElementById('gfModalCancel');
  const modalSave     = D.getElementById('gfModalSave');

  const lrcModal      = D.getElementById('gfLrcModal');
  const lrcModalTitle = D.getElementById('gfLrcModalTitle');
  const lrcAutoBtn    = D.getElementById('gfLrcAutoBtn');
  const lrcUploadBtn  = D.getElementById('gfLrcUploadBtn');
  const lrcTapModalBtn= D.getElementById('gfLrcTapModalBtn');
  const lrcClearBtn   = D.getElementById('gfLrcClearBtn');
  const lrcTextarea   = D.getElementById('gfLrcTextarea');
  const lrcModalCancel= D.getElementById('gfLrcModalCancel');
  const lrcModalSave  = D.getElementById('gfLrcModalSave');

  const deskLyric     = D.getElementById('gfDeskLyric');
  const deskMain      = D.getElementById('gfDeskMain');
  const deskSub       = D.getElementById('gfDeskSub');
  const deskOpacity   = D.getElementById('gfDeskOpacity');
  const deskLockBtn   = D.getElementById('gfDeskLockBtn');
  const deskUnlockBtn = D.getElementById('gfDeskUnlockBtn');
  const deskCloseBtn  = D.getElementById('gfDeskCloseBtn');

  let cur = 0;
  let playMode = 0;
  let currentParsedLyrics = [];
  let activeLyricIdx = -1;

  const MODES = [
    { name: '顺序播放', ico: ICO.seq },
    { name: '单曲循环', ico: ICO.loop },
    { name: '随机播放', ico: ICO.rand }
  ];

  panelDock.addEventListener('click', e => e.stopPropagation());

  /* ══════════════════════════════════════════
     顶部居中悬浮歌词状态与交互
     ══════════════════════════════════════════ */
  function syncDesktopLyricState() {
    const isPanelOpen = panelDock.classList.contains('open');
    const shouldShow = deskCfg.enabled && !isPanelOpen;
    deskLyric.classList.toggle('hidden', !shouldShow);
    deskLyric.classList.toggle('locked', !!deskCfg.locked);
    deskLyric.style.opacity = deskCfg.opacity;
    deskOpacity.value = deskCfg.opacity;
    toggleDeskTxt.textContent = `顶部歌词: ${deskCfg.enabled ? '开' : '关'}`;

    if (deskCfg.left !== null && deskCfg.top !== null) {
      deskLyric.style.left = deskCfg.left + 'px';
      deskLyric.style.top = deskCfg.top + 'px';
      deskLyric.style.transform = 'none';
    } else {
      deskLyric.style.left = '50%';
      deskLyric.style.top = (deskCfg.top || 14) + 'px';
      deskLyric.style.transform = 'translateX(-50%)';
    }
  }

  deskOpacity.addEventListener('input', (e) => {
    deskCfg.opacity = parseFloat(e.target.value) || 0.92;
    deskLyric.style.opacity = deskCfg.opacity;
    saveDeskCfg();
  });

  deskLockBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deskCfg.locked = true;
    saveDeskCfg();
    syncDesktopLyricState();
  });

  deskUnlockBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deskCfg.locked = false;
    saveDeskCfg();
    syncDesktopLyricState();
  });

  deskCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deskCfg.enabled = false;
    saveDeskCfg();
    syncDesktopLyricState();
  });

  toggleDeskBtn.addEventListener('click', () => {
    deskCfg.enabled = !deskCfg.enabled;
    saveDeskCfg();
    syncDesktopLyricState();
  });

  // 桌面悬浮歌词拖拽
  let isDeskDragging = false;
  let deskStartX = 0, deskStartY = 0, deskStartL = 0, deskStartT = 0;

  deskLyric.addEventListener('mousedown', onDeskDown);
  deskLyric.addEventListener('touchstart', onDeskDown, { passive: false });

  function onDeskDown(e) {
    if (deskCfg.locked) return;
    if (e.target.closest('button, input, .gf-desk-slider-wrap')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    deskStartX = clientX;
    deskStartY = clientY;
    const rect = deskLyric.getBoundingClientRect();
    deskStartL = rect.left;
    deskStartT = rect.top;
    isDeskDragging = false;

    D.addEventListener('mousemove', onDeskMove);
    D.addEventListener('touchmove', onDeskMove, { passive: false });
    D.addEventListener('mouseup', onDeskUp);
    D.addEventListener('touchend', onDeskUp);
  }

  function onDeskMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - deskStartX;
    const dy = clientY - deskStartY;

    if (!isDeskDragging && Math.hypot(dx, dy) > 4) {
      isDeskDragging = true;
      deskLyric.style.transform = 'none';
      deskLyric.style.left = deskStartL + 'px';
      deskLyric.style.top = deskStartT + 'px';
    }
    if (isDeskDragging) {
      if (e.cancelable) e.preventDefault();
      deskCfg.left = deskStartL + dx;
      deskCfg.top = deskStartT + dy;
      deskLyric.style.left = deskCfg.left + 'px';
      deskLyric.style.top = deskCfg.top + 'px';
    }
  }

  function onDeskUp() {
    D.removeEventListener('mousemove', onDeskMove);
    D.removeEventListener('touchmove', onDeskMove);
    D.removeEventListener('mouseup', onDeskUp);
    D.removeEventListener('touchend', onDeskUp);
    if (isDeskDragging) saveDeskCfg();
    setTimeout(() => { isDeskDragging = false; }, 50);
  }

  /* ══════════════════════════════════════════
     歌词渲染、词轴微调 (±0.5s) 与跟唱打轴器
     ══════════════════════════════════════════ */
  const LINE_HEIGHT = 24;

  function updateOffsetDisplay() {
    const t = TRACKS[cur];
    const off = t ? (Number(t.offset) || 0) : 0;
    const sign = off > 0 ? '+' : '';
    offsetVal.textContent = `词轴${sign}${off.toFixed(1)}s`;
  }

  function adjustLyricOffset(deltaSec) {
    const t = TRACKS[cur];
    if (!t) return;
    t.offset = Math.round(((Number(t.offset) || 0) + deltaSec) * 10) / 10;
    updateOffsetDisplay();
    saveTracksToDB();
    rebuildLyricsView(false);
  }

  // -0.5s：歌词显示太慢（唱过了才出来），让歌词时间戳整体提前 0.5 秒
  offsetMinus.addEventListener('click', (e) => {
    e.stopPropagation();
    adjustLyricOffset(-0.5);
  });

  // +0.5s：歌词跑太快了（还没唱到就往后滚了），让歌词时间戳整体延后 0.5 秒
  offsetPlus.addEventListener('click', (e) => {
    e.stopPropagation();
    adjustLyricOffset(0.5);
  });

  function rebuildLyricsView(isRecognizing = false) {
    const t = TRACKS[cur];
    if (!t) return;
    updateOffsetDisplay();
    currentParsedLyrics = parseLyrics(t.lrc || '', audio.duration || 0, Number(t.offset) || 0);
    activeLyricIdx = -1;
    lyricsTrack.innerHTML = '';
    lyricsTrack.style.transform = 'translateY(0px)';

    if (isRecognizing) {
      lyricsTrack.innerHTML = `<div class="gf-lyric-status"><span>正在从酷狗/网易云曲库识别歌词...</span></div>`;
      deskMain.textContent = `${t.name} - ${t.artist}`;
      deskSub.textContent = '正在云端自动识别时间轴歌词...';
      return;
    }

    if (currentParsedLyrics.length === 0) {
      const emptyEl = D.createElement('div');
      emptyEl.className = 'gf-lyric-status';
      emptyEl.innerHTML = `
        <span>暂未匹配到歌词</span>
        <button class="gf-lyric-empty-btn">${ICO.magic}<span>手动搜索 / 粘贴歌词</span></button>
      `;
      emptyEl.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        openLyricModal(cur);
      });
      lyricsTrack.appendChild(emptyEl);
      deskMain.textContent = `${t.name} - ${t.artist}`;
      deskSub.textContent = '';
      return;
    }

    currentParsedLyrics.forEach((item) => {
      const lineEl = D.createElement('div');
      lineEl.className = 'gf-lyric-line';
      lineEl.textContent = item.text;
      lineEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.duration && isFinite(item.time)) {
          audio.currentTime = Math.min(audio.duration, Math.max(0, item.time));
          syncLyricsByTime(audio.currentTime, true);
        }
      });
      lyricsTrack.appendChild(lineEl);
    });

    syncLyricsByTime(audio.currentTime || 0, true);
  }

  function syncLyricsByTime(currentTime, force = false) {
    const t = TRACKS[cur];
    if (!currentParsedLyrics.length) return;

    let newIdx = 0;
    for (let i = 0; i < currentParsedLyrics.length; i++) {
      if (currentTime >= currentParsedLyrics[i].time) {
        newIdx = i;
      } else {
        break;
      }
    }

    if (!force && newIdx === activeLyricIdx) return;
    activeLyricIdx = newIdx;

    const lineEls = lyricsTrack.querySelectorAll('.gf-lyric-line');
    lineEls.forEach((el, idx) => {
      el.classList.toggle('active', idx === activeLyricIdx);
    });

    const offsetY = LINE_HEIGHT - (activeLyricIdx * LINE_HEIGHT);
    lyricsTrack.style.transform = `translateY(${offsetY}px)`;

    const curLine = currentParsedLyrics[activeLyricIdx];
    const nextLine = currentParsedLyrics[activeLyricIdx + 1];
    deskMain.textContent = curLine ? curLine.text : (t ? t.name : '');
    deskSub.textContent = nextLine ? nextLine.text : '';
  }

  /* ── 60帧高频同步循环（彻底消灭快歌歌词延迟落后的问题） ── */
  function highFreqLyricLoop() {
    if (!audio.paused && audio.duration) {
      syncLyricsByTime(audio.currentTime, false);
    }
    requestAnimationFrame(highFreqLyricLoop);
  }
  requestAnimationFrame(highFreqLyricLoop);

  /* ══════════════════════════════════════════
     指哪打哪：跟唱手动打轴器（把任意对不上的歌词1分钟变成毫秒级LRC）
     ══════════════════════════════════════════ */
  let tapLines = [];
  let tapIndex = 0;
  let tapResultLrc = [];

  function startTapSyncMode() {
    const t = TRACKS[cur];
    if (!t || !t.lrc || !t.lrc.trim()) {
      openLyricModal(cur);
      return;
    }
    const timeReg = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
    tapLines = t.lrc
      .split(/\r?\n/)
      .map(l => l.replace(timeReg, '').replace(/^\[(ti|ar|al|by|offset):.*\]$/i, '').trim())
      .filter(Boolean);

    if (tapLines.length === 0) {
      openLyricModal(cur);
      return;
    }

    tapIndex = 0;
    tapResultLrc = [];
    t.offset = 0;
    updateOffsetDisplay();
    lrcModal.classList.remove('open');
    menuPopover.classList.remove('open');
    menuTrigger.classList.remove('active');
    tapOverlay.classList.add('open');

    if (audio.paused) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    updateTapUI();
  }

  function updateTapUI() {
    if (tapIndex < tapLines.length) {
      tapHint.textContent = `第 ${tapIndex + 1}/${tapLines.length} 句：「${tapLines[tapIndex]}」`;
      tapStampBtn.textContent = `唱到这句时点我 (${tapIndex + 1}/${tapLines.length})`;
    } else {
      finishTapSyncMode();
    }
  }

  function stampCurrentTapLine() {
    if (!tapOverlay.classList.contains('open')) return;
    if (tapIndex < tapLines.length) {
      const stampTime = Math.max(0, (audio.currentTime || 0) - 0.12); // 自动补偿人手反应时间 0.12s
      tapResultLrc.push(`${formatLrcTimestamp(stampTime)}${tapLines[tapIndex]}`);
      tapIndex++;
      // 实时预览已打轴效果
      const t = TRACKS[cur];
      if (t) {
        const remaining = tapLines.slice(tapIndex).map((txt, i) => `${formatLrcTimestamp(stampTime + (i + 1) * 3.5)}${txt}`);
        t.lrc = [...tapResultLrc, ...remaining].join('\n');
        rebuildLyricsView(false);
      }
      updateTapUI();
    }
  }

  function finishTapSyncMode() {
    tapOverlay.classList.remove('open');
    const t = TRACKS[cur];
    if (t && tapResultLrc.length > 0) {
      saveTracksToDB();
      renderList();
      rebuildLyricsView(false);
    }
  }

  quickTapBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    startTapSyncMode();
  });
  startTapMenu.addEventListener('click', () => startTapSyncMode());
  lrcTapModalBtn.addEventListener('click', () => {
    const t = TRACKS[editingLrcTrackIndex];
    if (t && lrcTextarea.value.trim()) {
      t.lrc = lrcTextarea.value.trim();
      saveTracksToDB();
      if (editingLrcTrackIndex !== cur) loadTrack(editingLrcTrackIndex, true);
    }
    startTapSyncMode();
  });
  tapStampBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stampCurrentTapLine();
  });
  tapExitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    finishTapSyncMode();
  });

  /* ══════════════════════════════════════════
     播放器核心逻辑
     ══════════════════════════════════════════ */
  function fmt(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  function setProgress(ratio) {
    const pct = (Math.min(1, Math.max(0, ratio)) * 100).toFixed(2) + '%';
    pFill.style.width = pct;
    pThumb.style.left = pct;
  }

  async function loadTrack(index, play = false) {
    if (!TRACKS.length) return;
    tapOverlay.classList.remove('open');
    cur = (index + TRACKS.length) % TRACKS.length;
    const t = TRACKS[cur];
    audio.src = t.src;
    audio.load();

    titleEl.textContent = t.name;
    artistEl.textContent = t.artist;
    setProgress(0);
    tCur.textContent = '0:00';
    tTot.textContent = '0:00';
    updateOffsetDisplay();

    renderList();
    if (play) audio.play().catch(() => {});

    if (!t.lrc || !t.lrc.trim()) {
      rebuildLyricsView(true);
      const recognized = await autoRecognizeLyrics(t, false);
      if (recognized && TRACKS[cur] === t) {
        t.lrc = recognized;
        await saveTracksToDB();
        renderList();
      }
      if (TRACKS[cur] === t) {
        rebuildLyricsView(false);
      }
    } else {
      rebuildLyricsView(false);
    }
  }

  function renderList() {
    playlistFloat.innerHTML = '';
    TRACKS.forEach((t, i) => {
      const el = D.createElement('div');
      el.className = `gf-track-item ${i === cur ? 'active' : ''}`;
      const hasLrc = !!(t.lrc && t.lrc.trim());
      el.innerHTML = `
        <div class="gf-track-num">${i + 1}</div>
        <div class="gf-track-info">
          <div class="gf-track-name">${t.name}${hasLrc ? '<span class="gf-lrc-badge">词</span>' : ''}</div>
          <div class="gf-track-artist">${t.artist}</div>
        </div>
        <button class="gf-lrc-btn" title="识别/编辑/删除此首歌词">${ICO.lrc}</button>
        <button class="gf-edit-btn" title="修改歌曲名与作者">${ICO.edit}</button>
        <button class="gf-del-btn" title="删除此歌曲">${ICO.del}</button>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        loadTrack(i, true);
      });

      el.querySelector('.gf-lrc-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openLyricModal(i);
      });

      el.querySelector('.gf-edit-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal('修改歌曲信息', t.name, t.artist, async (newName, newArtist) => {
          t.name = newName || t.name;
          t.artist = newArtist || t.artist;
          if (i === cur) {
            titleEl.textContent = t.name;
            artistEl.textContent = t.artist;
          }
          if (!t.lrc) {
            const recognized = await autoRecognizeLyrics(t, true);
            if (recognized) t.lrc = recognized;
          }
          if (i === cur) rebuildLyricsView(false);
          renderList();
          saveTracksToDB();
        });
      });

      el.querySelector('.gf-del-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const wasPlaying = !audio.paused;
        if (t.blob && t.src) URL.revokeObjectURL(t.src);
        TRACKS.splice(i, 1);

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

  /* ══════════════════════════════════════════
     歌词管理弹窗
     ══════════════════════════════════════════ */
  let editingLrcTrackIndex = 0;

  function openLyricModal(trackIdx) {
    editingLrcTrackIndex = trackIdx;
    const t = TRACKS[trackIdx];
    if (!t) return;
    lrcModalTitle.textContent = `歌词识别与编辑 - ${t.name}`;
    lrcTextarea.value = t.lrc || '';
    lrcModal.classList.add('open');
    menuPopover.classList.remove('open');
    menuTrigger.classList.remove('active');
  }

  curLrcBtn.addEventListener('click', () => {
    openLyricModal(cur);
  });

  lrcAutoBtn.addEventListener('click', async () => {
    const t = TRACKS[editingLrcTrackIndex];
    if (!t) return;
    const oldHtml = lrcAutoBtn.innerHTML;
    lrcAutoBtn.innerHTML = `<span>正在穿透检索...</span>`;
    lrcAutoBtn.disabled = true;

    const recognized = await autoRecognizeLyrics(t, true);
    if (recognized) {
      lrcTextarea.value = recognized;
    } else {
      lrcTextarea.placeholder = `未能自动搜到《${t.name}》的时间轴歌词。您可以直接粘贴歌词文本，保存后点「打轴」边听边点对齐！`;
    }

    lrcAutoBtn.innerHTML = oldHtml;
    lrcAutoBtn.disabled = false;
  });

  lrcUploadBtn.addEventListener('click', () => {
    lrcFileInput.value = '';
    lrcFileInput.click();
  });

  lrcFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      lrcTextarea.value = String(reader.result || '');
    };
    reader.readAsText(file, 'utf-8');
  });

  lrcClearBtn.addEventListener('click', () => {
    lrcTextarea.value = '';
  });

  lrcModalCancel.addEventListener('click', () => {
    lrcModal.classList.remove('open');
  });

  lrcModalSave.addEventListener('click', () => {
    const t = TRACKS[editingLrcTrackIndex];
    if (t) {
      t.lrc = lrcTextarea.value.trim();
      saveTracksToDB();
      renderList();
      if (editingLrcTrackIndex === cur) {
        rebuildLyricsView(false);
      }
    }
    lrcModal.classList.remove('open');
  });

  /* ── 歌曲导入 ── */
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
    menuPopover.classList.remove('open');
    menuTrigger.classList.remove('active');
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
      // 自动判断是“歌手 - 歌名”还是“歌名 - 歌手”
      defName = parts[parts.length - 1].trim();
      defArtist = parts.slice(0, parts.length - 1).join('/').trim();
    }

    openEditModal('导入新歌曲（请确认歌名以便识别歌词）', defName, defArtist, async (finalName, finalArtist) => {
      const newTrack = {
        id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: finalName || defName || '未命名歌曲',
        artist: finalArtist || defArtist || '未知歌手',
        blob: file,
        src: url,
        lrc: '',
        offset: 0
      };
      TRACKS.push(newTrack);
      await saveTracksToDB();
      loadTrack(TRACKS.length - 1, true);
      playlistFloat.classList.add('open');
      listBtn.classList.add('active');
    });
  });

  /* ── 侧上方菜单按钮交互 ── */
  menuTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menuPopover.classList.toggle('open');
    menuTrigger.classList.toggle('active', isOpen);
  });

  D.addEventListener('click', (e) => {
    if (!e.target.closest('#gfTopMenuWrap')) {
      menuPopover.classList.remove('open');
      menuTrigger.classList.remove('active');
    }
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
      menuPopover.classList.remove('open');
      menuTrigger.classList.remove('active');
    }
    syncDesktopLyricState();
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
    if (e.target.closest('button, input, textarea, .gf-progress-wrap, .gf-modal, .gf-top-menu-wrap, .gf-lyrics-box, .gf-offset-bar')) return;

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
     3. 柔和物理引擎
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

  function handleOrientation(e) {
    if (e.gamma !== null && e.gamma !== undefined) {
      const clamped = Math.max(-30, Math.min(30, e.gamma));
      targetAngle = clamped * 0.2;
    }
  }

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
    menuPopover.classList.remove('open');
    menuTrigger.classList.remove('active');
  });

  audio.addEventListener('play', syncPlayBtn);
  audio.addEventListener('pause', syncPlayBtn);
  audio.addEventListener('ended', () => nextTrackByMode(true));
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    setProgress(audio.currentTime / audio.duration);
    tCur.textContent = fmt(audio.currentTime);
    syncLyricsByTime(audio.currentTime);
  });
  audio.addEventListener('durationchange', () => {
    tTot.textContent = fmt(audio.duration);
    if (currentParsedLyrics.length && currentParsedLyrics[0].isPlain) {
      rebuildLyricsView(false);
    }
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
      syncLyricsByTime(audio.currentTime, true);
    }
  }
  pWrap.addEventListener('mousedown', e => { seekActive = true; seekFrom(e); e.stopPropagation(); });
  pWrap.addEventListener('touchstart', e => { seekActive = true; seekFrom(e); e.stopPropagation(); }, { passive: true });
  D.addEventListener('mousemove', e => { if (seekActive) seekFrom(e); });
  D.addEventListener('touchmove', e => { if (seekActive) seekFrom(e); }, { passive: true });
  D.addEventListener('mouseup', () => { seekActive = false; });
  D.addEventListener('touchend', () => { seekActive = false; });

  /* ── 启动时恢复歌单并自动识别歌词 ── */
  (async function initPlayer() {
    const saved = await loadTracksFromDB();
    if (saved && saved.length > 0) {
      TRACKS = saved;
    } else {
      TRACKS = DEFAULT_TRACKS.map(item => ({ ...item }));
      await saveTracksToDB();
    }
    syncDesktopLyricState();
    loadTrack(0, true);
  })();

})();
