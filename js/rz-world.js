// RAYQUAZA WORLD — สภาพอากาศ · เพลงประกอบ 8-bit · เอฟเฟกต์ตาราง (คู่กับ css/rz-trainer.css)
//  - สภาพอากาศสุ่มวันละแบบ (ทุกเครื่องได้แบบเดียวกันในวันเดียวกัน): แจ่มใส / ฝน / แดดแรง / Delta Stream ลมกรด / หิมะ / หมอก
//    ฉากฝน/หิมะ/ลม วาดบน canvas ที่กดทะลุได้ และปรับท้องฟ้า 3D (rz-3d.js) ให้เข้ากัน · กดปุ่มสภาพอากาศ หรือปุ่ม W เพื่อเปลี่ยน
//  - เพลงประกอบ: 6 เพลงแต่งเอง เล่นด้วย Web Audio (ไม่มีไฟล์เพลง) เปลี่ยนเองตามสถานการณ์ ปิดไว้เป็นค่าเริ่มต้น ปุ่ม 🎵 / ปุ่ม M
//  - ตาราง: แถวที่ชี้เมาส์มีแสงทอง · ระหว่าง "กำลังโหลด" แสดงแถบแสงวิ่งแทนช่องว่าง
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function dayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* ================= สภาพอากาศ ================= */
  var WEATHERS = {
    clear: { ico: '🌤️', name: 'ท้องฟ้าแจ่มใส', sky: { dens: 1, speed: 1, tint: null, tintAmt: 0 } },
    rain: { ico: '🌧️', name: 'ฝนตก', sky: { dens: 1.45, speed: 1.4, tint: [0.25, 0.3, 0.38], tintAmt: 0.35 }, bolt: 7000 },
    sun: { ico: '☀️', name: 'แดดแรง', sky: { dens: 0.55, speed: 0.8, tint: [1, 0.75, 0.3], tintAmt: 0.4 } },
    delta: { ico: '🌪️', name: 'Delta Stream ลมกรด', sky: { dens: 1.15, speed: 3.6, tint: [0.45, 0.9, 0.7], tintAmt: 0.3 }, bolt: 12000 },
    snow: { ico: '❄️', name: 'หิมะตก', sky: { dens: 1.2, speed: 0.6, tint: [0.85, 0.92, 1], tintAmt: 0.45 } },
    fog: { ico: '🌫️', name: 'หมอกลง', sky: { dens: 1.6, speed: 0.45, tint: [0.7, 0.7, 0.72], tintAmt: 0.5 } }
  };
  var ORDER = ['clear', 'rain', 'sun', 'delta', 'snow', 'fog'];
  var WEIGHT = { clear: 35, rain: 20, sun: 15, delta: 15, snow: 7, fog: 8 };
  // สุ่มจากวันที่ (เครื่องไหนก็ได้แบบเดียวกันในวันเดียวกัน)
  function dailyWeather() {
    var k = dayKey(), h = 2166136261;
    for (var i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
    var r = ((h >>> 0) % 100), acc = 0;
    for (var j = 0; j < ORDER.length; j++) { acc += WEIGHT[ORDER[j]]; if (r < acc) return ORDER[j]; }
    return 'clear';
  }
  var WKEY = 'rz_weather_v1';
  var cur = dailyWeather();
  try { var sv = JSON.parse(ls(WKEY) || 'null'); if (sv && sv.day === dayKey() && WEATHERS[sv.w]) cur = sv.w; } catch (e) { /* ข้าม */ }

  var wcv = document.createElement('canvas');
  wcv.id = 'rzWeather';
  wcv.setAttribute('aria-hidden', 'true');
  var wx = wcv.getContext('2d');
  var W = 0, H = 0, parts = [], wBtn = null, nextBolt = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    W = window.innerWidth; H = window.innerHeight;
    wcv.width = Math.round(W * dpr); wcv.height = Math.round(H * dpr);
    wcv.style.width = W + 'px'; wcv.style.height = H + 'px';
    wx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function applySky() {
    var s = WEATHERS[cur].sky;
    if (window.RZ3D) window.RZ3D.weather = { dens: s.dens, speed: s.speed, tint: s.tint, tintAmt: s.tintAmt };
    root.setAttribute('data-rz-weather', cur);
    parts.length = 0;
    if (wBtn) { wBtn.textContent = WEATHERS[cur].ico; wBtn.title = 'สภาพอากาศวันนี้: ' + WEATHERS[cur].name + ' (กดเพื่อเปลี่ยน · W)'; }
  }
  function setWeather(w, announce, temp) {
    cur = w;
    if (!temp) ls(WKEY, JSON.stringify({ day: dayKey(), w: w })); // temp = เปลี่ยนชั่วคราว (เช่นถิ่นตำนาน) ไม่บันทึกเป็นอากาศของวัน
    applySky();
    if (announce) toast('สภาพอากาศ: ' + WEATHERS[w].ico + ' ' + WEATHERS[w].name + (w === 'delta' ? ' — สนามพลังของ RAYQUAZA!' : ''), '');
  }
  function cycle() { setWeather(ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length], true); }

  function spawn() {
    if (cur === 'rain') return { x: Math.random() * (W + 200) - 100, y: -20, v: 14 + Math.random() * 8, l: 12 + Math.random() * 14, a: 0.25 + Math.random() * 0.35 };
    if (cur === 'snow') return { x: Math.random() * W, y: -10, v: 0.6 + Math.random() * 1.2, r: 1.2 + Math.random() * 2.6, ph: Math.random() * 6.28, a: 0.5 + Math.random() * 0.45 };
    if (cur === 'delta') return { x: -300, y: Math.random() * H, v: 18 + Math.random() * 16, l: 120 + Math.random() * 260, a: 0.08 + Math.random() * 0.16, wob: Math.random() * 6.28 };
    if (cur === 'sun') return { x: Math.random() * W, y: H + 10, v: 0.2 + Math.random() * 0.5, r: 1 + Math.random() * 2, ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.35 };
    return null;
  }
  var TARGET = { rain: 140, snow: 90, delta: 26, sun: 30 };
  function frame(ts) {
    requestAnimationFrame(frame);
    var show = fxOn() && !reduce && !document.hidden && TARGET[cur];
    if (!show) { if (wcv.style.display !== 'none') { wx.clearRect(0, 0, W, H); wcv.style.display = 'none'; } return; }
    if (wcv.style.display === 'none') wcv.style.display = '';
    wx.clearRect(0, 0, W, H);
    while (parts.length < TARGET[cur]) { var p0 = spawn(); if (!p0) break; if (parts.length < TARGET[cur] * 0.6 && cur !== 'delta') p0.y = Math.random() * H; parts.push(p0); }
    var t = ts / 1000, i, p;
    if (cur === 'rain') {
      wx.strokeStyle = isDay() ? 'rgba(40,70,90,1)' : 'rgba(190,210,230,1)';
      wx.lineWidth = 1.1;
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.y += p.v; p.x -= p.v * 0.18;
        wx.globalAlpha = p.a;
        wx.beginPath(); wx.moveTo(p.x, p.y); wx.lineTo(p.x + p.l * 0.18, p.y - p.l); wx.stroke();
        if (p.y > H) parts.splice(i, 1);
      }
    } else if (cur === 'snow') {
      wx.fillStyle = '#ffffff';
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.ph += 0.02; p.y += p.v; p.x += Math.sin(p.ph) * 0.6;
        wx.globalAlpha = p.a;
        wx.beginPath(); wx.arc(p.x, p.y, p.r, 0, 6.283); wx.fill();
        if (p.y > H + 5) parts.splice(i, 1);
      }
    } else if (cur === 'delta') {
      wx.lineCap = 'round';
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.x += p.v;
        var yy = p.y + Math.sin(p.x * 0.006 + p.wob) * 18;
        var g = wx.createLinearGradient(p.x - p.l, 0, p.x, 0);
        g.addColorStop(0, 'rgba(120,255,200,0)');
        g.addColorStop(1, isDay() ? 'rgba(20,90,70,' + (p.a * 1.6) + ')' : 'rgba(150,255,210,' + p.a + ')');
        wx.strokeStyle = g; wx.lineWidth = 1.6; wx.globalAlpha = 1;
        wx.beginPath(); wx.moveTo(p.x - p.l, yy + 6); wx.quadraticCurveTo(p.x - p.l / 2, yy - 8, p.x, yy); wx.stroke();
        if (p.x - p.l > W) parts.splice(i, 1);
      }
    } else if (cur === 'sun') {
      // แสงจ้ามุมขวาบน + ละอองแสงลอยขึ้น
      var rg = wx.createRadialGradient(W * 0.92, H * 0.02, 10, W * 0.92, H * 0.02, Math.max(W, H) * 0.55);
      rg.addColorStop(0, 'rgba(255,240,180,' + (0.22 + Math.sin(t * 0.8) * 0.04) + ')');
      rg.addColorStop(0.4, 'rgba(255,190,90,0.06)');
      rg.addColorStop(1, 'rgba(255,190,90,0)');
      wx.globalAlpha = 1; wx.fillStyle = rg; wx.fillRect(0, 0, W, H);
      wx.fillStyle = '#fff1c0';
      for (i = parts.length - 1; i >= 0; i--) {
        p = parts[i]; p.ph += 0.03; p.y -= p.v; p.x += Math.sin(p.ph) * 0.3;
        wx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.ph * 2));
        wx.beginPath(); wx.arc(p.x, p.y, p.r, 0, 6.283); wx.fill();
        if (p.y < -5) parts.splice(i, 1);
      }
    }
    wx.globalAlpha = 1;
    // ฝน/ลมกรด: ฟ้าผ่าถี่ขึ้น
    var bolt = WEATHERS[cur].bolt;
    if (bolt && ts > nextBolt) {
      if (nextBolt && window.RZFX && window.RZFX.strike) window.RZFX.strike();
      nextBolt = ts + bolt * (0.7 + Math.random() * 0.6);
    }
  }

  /* ================= เพลงประกอบ 8-bit — แต่งเองทั้งหมด เปลี่ยนเพลงเองตามสถานการณ์เหมือนในเกม =================
     ใช้งานปกติ (กลางวัน) = Emerald Town · ใช้งานปกติ (ไชนี่) = Sky Pillar Run · ระบบกำลังทำงาน = Wild ORDER Appeared!
     พักหน้าจอ = Dragon's Lullaby · ภารกิจสำเร็จ = Mission Clear! · เลเวลอัป = Level Up!
     โน้ต: 1 ช่อง = โน้ตตัวที่ 16 · "C5" = โน้ต · "-" = ลากเสียงต่อ · "." = เงียบ · คอร์ด 1 ตัวต่อครึ่งห้อง */
  var BGM_KEY = 'rz_bgm_v1';
  var bgmOn = ls(BGM_KEY) === '1';
  var bctx = null, master = null, timer = 0, nextT = 0, noiseBuf = null, mBtn = null;
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  var PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(n) {
    var m = /^([A-G])(#|b)?(\d)$/.exec(n);
    return m ? 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null;
  }
  // แปลงทำนองเป็นรายการ [โน้ต, ความยาว] ต่อช่อง (null = ไม่มีโน้ตเริ่มที่ช่องนี้)
  function parse(str) {
    var tk = str.trim().split(/\s+/), out = [];
    for (var i = 0; i < tk.length; i++) {
      var n = midi(tk[i]);
      if (n === null) { out.push(null); continue; }
      var len = 1;
      while (tk[i + len] === '-') len++;
      out.push([n, len]);
    }
    return out;
  }
  function chords(str) { // "C Am F G" → [[ราก, ชนิด]] · ชนิด: '' เมเจอร์, m ไมเนอร์, 7 โดมินันต์
    return str.trim().split(/\s+/).map(function (c) {
      var m = /^([A-G])(#|b)?(m|7)?$/.exec(c);
      return [12 * 3 + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), m[3] || ''];
    });
  }
  function triad(ch) { return ch[1] === 'm' ? [0, 3, 7] : [0, 4, 7]; }

  var SONGS = {
    town: {
      name: 'Emerald Town', bpm: 104, loop: true, lead: 'square', leadVol: 0.085, bass: 'oompah', stabs: true,
      drums: { k: [0, 8], s: [4, 12], h: [2, 6, 10, 14], sVol: 0.18 },
      chords: chords('C C Am Am F F G G C C Am Am Dm G C C'),
      notes: parse(
        'E5 - G5 - C6 - - - B5 - G5 - E5 - - - ' +
        'A5 - - - G5 - E5 - C5 - D5 - E5 - - - ' +
        'F5 - A5 - C6 - A5 - G5 - F5 - E5 - D5 - ' +
        'D5 - - - G5 - - - B4 - D5 - G5 - - - ' +
        'E5 - G5 - C6 - E6 - D6 - C6 - B5 - G5 - ' +
        'A5 - - - C6 - B5 - A5 - G5 - E5 - - - ' +
        'F5 - E5 - D5 - F5 - G5 - - - B5 - D6 - ' +
        'C6 - - - - - - - G5 - E5 - C5 - - -')
    },
    sky: {
      name: 'Sky Pillar Run', bpm: 132, loop: true, lead: 'square', leadVol: 0.1, bass: 'drive8', arp: true,
      drums: { k: [0, 8, 10], s: [4, 12], h: [1, 3, 5, 7, 9, 11, 13, 15] },
      chords: chords('Am Am F F C C G G Am Am F F C C G G'),
      notes: parse(
        'E5 - D5 E5 G5 - E5 - D5 C5 - D5 E5 - - - ' +
        'C5 - D5 C5 A4 - C5 - D5 - E5 D5 C5 - - - ' +
        'G4 - C5 E5 G5 - F5 E5 D5 - C5 - E5 - - - ' +
        'D5 - B4 D5 G5 - F#5 G5 A5 - G5 - D5 - B4 - ' +
        'A5 - G5 E5 G5 - A5 - C6 - B5 A5 G5 - - - ' +
        'F5 - E5 D5 C5 - D5 E5 F5 - E5 D5 C5 - - - ' +
        'E5 F5 G5 - C6 - G5 - E5 - D5 C5 D5 - E5 - ' +
        'G5 - F#5 - G5 A5 B5 - D6 - - - B5 - - -')
    },
    battle: {
      name: 'Wild ORDER Appeared!', bpm: 160, loop: true, lead: 'square', leadVol: 0.09, bass: 'octave8', arp: true,
      drums: { k: [0, 3, 8, 11], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], hVol: 0.07 },
      chords: chords('Am Am F F G G E E Am Am F F G G E E'),
      notes: parse(
        'A5 . A5 . C6 . A5 . E6 - D6 - C6 - B5 - ' +
        'C6 . C6 . F6 . C6 . A5 - G5 - F5 - E5 - ' +
        'D6 . D6 . B5 . G5 . D6 - E6 - F6 - D6 - ' +
        'E6 - - - G#5 - B5 - E6 - D6 - B5 - G#5 - ' +
        'A5 . C6 . E6 . A6 . G6 - E6 - C6 - E6 - ' +
        'F6 - E6 - C6 - A5 - C6 - D6 - E6 - F6 - ' +
        'G6 - F6 - D6 - B5 - D6 - E6 - F6 - G6 - ' +
        'G#6 - - - E6 - - - B5 - - - G#5 - E5 -')
    },
    lull: {
      name: "Dragon's Lullaby", bpm: 72, loop: true, lead: 'triangle', leadVol: 0.2, bass: 'soft', bell: true,
      chords: chords('F F Dm Dm Bb Bb C C'),
      notes: parse(
        'A5 - - - C6 - - - F6 - - - E6 - C6 - ' +
        'D6 - - - A5 - - - F5 - - - A5 - - - ' +
        'Bb5 - - - D6 - - - F6 - - - D6 - Bb5 - ' +
        'C6 - - - E6 - - - G6 - - - - - - -')
    },
    // ถิ่นของสองตำนาน (rz-territory.js) — แต่งเอง
    groudon: {
      name: 'Desolate Land', bpm: 112, loop: true, lead: 'square', leadVol: 0.1, bass: 'octave8', arp: false,
      drums: { k: [0, 3, 6, 8, 11, 14], s: [4, 12], sVol: 0.4 },
      chords: chords('Dm Dm Bb Bb C C A A Dm Dm Bb Bb C C A A'),
      notes: parse(
        'D5 - - - A4 - D5 - F5 - E5 - D5 - - - ' +
        'Bb4 - - - D5 - F5 - Bb5 - A5 - F5 - - - ' +
        'C5 - - - E5 - G5 - C6 - Bb5 - G5 - E5 - ' +
        'A5 - - - - - E5 - C#5 - E5 - A4 - - - ' +
        'D6 - - - C6 - A5 - F5 - - - D5 - F5 - ' +
        'Bb5 - A5 - F5 - D5 - Bb4 - D5 - F5 - - - ' +
        'C6 - Bb5 - G5 - E5 - G5 - C6 - E6 - - - ' +
        'A5 - - - C#6 - - - E6 - - - A5 - - -')
    },
    kyogre: {
      name: 'Primordial Sea', bpm: 88, loop: true, lead: 'triangle', leadVol: 0.2, bass: 'soft', arp: true, bell: true,
      drums: { h: [2, 6, 10, 14], hVol: 0.05 },
      chords: chords('Em Em C C D D Bm Bm Em Em C C Am Am B B'),
      notes: parse(
        'E5 - - - G5 - - - B5 - - - A5 - G5 - ' +
        'E5 - - - - - - - D5 - E5 - G5 - - - ' +
        'F#5 - - - A5 - - - D6 - - - C6 - B5 - ' +
        'B5 - - - - - - - F#5 - - - D5 - - - ' +
        'E6 - - - D6 - B5 - G5 - - - B5 - D6 - ' +
        'C6 - - - B5 - A5 - E5 - - - - - - - ' +
        'A5 - - - C6 - - - E6 - - - D6 - C6 - ' +
        'B5 - - - D#6 - - - F#6 - - - B5 - - -')
    },
    victory: {
      name: 'Mission Clear!', bpm: 140, loop: false, lead: 'square', leadVol: 0.1, bass: 'hold',
      drums: { k: [0], s: [12] },
      chords: chords('C C G C'),
      notes: parse(
        'G5 . G5 . G5 . E6 - - - - - C6 - - - ' +
        'D6 - - - B5 - - - C6 - - - - - - -')
    },
    levelup: {
      name: 'Level Up!', bpm: 150, loop: false, lead: 'square', leadVol: 0.1, bass: 'hold',
      chords: chords('C C'),
      notes: parse('C6 E6 G6 C7 - - . G6 C7 - - - - - - -')
    }
  };

  function voice(type, freq, t, dur, vol) {
    var o = bctx.createOscillator(), g = bctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function drum(kind, t, vol) {
    if (kind === 'k') {
      var o = bctx.createOscillator(), g = bctx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(vol || 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.16);
      return;
    }
    if (!noiseBuf) {
      noiseBuf = bctx.createBuffer(1, bctx.sampleRate * 0.3, bctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var s = bctx.createBufferSource(), f = bctx.createBiquadFilter(), gn = bctx.createGain();
    s.buffer = noiseBuf;
    f.type = kind === 's' ? 'bandpass' : 'highpass';
    f.frequency.value = kind === 's' ? 1800 : 7000;
    var len = kind === 's' ? 0.14 : 0.04;
    gn.gain.setValueAtTime(vol || (kind === 's' ? 0.35 : 0.12), t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(f); f.connect(gn); gn.connect(master); s.start(t); s.stop(t + len);
  }

  var song = null, songKey = '', pos = 0, pending = '', resumeKey = '';
  function playStep(S, i, t) {
    var spb = 60 / S.bpm / 4, inBar = i % 16;
    var ch = S.chords[Math.floor(i / 8) % S.chords.length], tri = triad(ch), root = ch[0];
    var n = S.notes[i];
    if (n) voice(S.lead, mtof(n[0]), t, spb * n[1] * 0.92, S.leadVol);
    if (S.bell && n) voice('sine', mtof(n[0] + 12), t, spb * n[1] * 1.2, 0.05); // กล่องดนตรี
    switch (S.bass) {
      case 'oompah': if (inBar % 4 === 0) voice('triangle', mtof(root + (inBar % 8 === 4 ? 7 : 0)), t, spb * 1.8, 0.3); break;
      case 'drive8': if (inBar % 2 === 0) voice('triangle', mtof(root + (inBar % 8 === 6 ? 7 : 0)), t, spb * 1.7, 0.32); break;
      case 'octave8': if (inBar % 2 === 0) voice('triangle', mtof(root + (inBar % 4 === 2 ? 12 : 0)), t, spb * 1.5, 0.34); break;
      case 'soft': if (inBar === 0 || inBar === 8) voice('sine', mtof(root + (inBar === 8 ? 7 : 0)), t, spb * 7, 0.22); break;
      case 'hold': if (inBar % 8 === 0) voice('triangle', mtof(root), t, spb * 7.5, 0.3); break;
    }
    if (S.arp) voice('square', mtof(root + 24 + tri[inBar % 3]), t, spb * 0.6, 0.03);
    if (S.stabs && inBar % 4 === 2) tri.forEach(function (x) { voice('square', mtof(root + 24 + x), t, spb * 0.8, 0.018); });
    var D = S.drums;
    if (D) {
      if (D.k && D.k.indexOf(inBar) >= 0) drum('k', t);
      if (D.s && D.s.indexOf(inBar) >= 0) drum('s', t, D.sVol);
      if (D.h && D.h.indexOf(inBar) >= 0) drum('h', t, D.hVol);
    }
    return spb;
  }
  function setSong(key) {
    song = SONGS[key]; songKey = key; pos = 0;
    if (mBtn) mBtn.setAttribute('data-label', 'เพลง ♪ ' + song.name + ' (M)');
  }
  function schedule() {
    if (!song) setSong(wantLoop());
    while (nextT < bctx.currentTime + 0.12) {
      // เปลี่ยนเพลงตอนต้นห้อง (ฟังต่อเนื่อง ไม่สะดุดกลางประโยค)
      if (pending && pos % 16 === 0 && song.loop) { setSong(pending); pending = ''; }
      nextT += playStep(song, pos, nextT);
      pos++;
      if (pos >= song.notes.length) {
        if (song.loop) pos = 0;
        else { setSong(resumeKey || wantLoop()); resumeKey = ''; nextT += 0.25; } // จบเพลงสั้น → กลับเพลงเดิม
      }
    }
  }
  // เพลงวนที่ควรเล่นตอนนี้
  function wantLoop() {
    if (document.querySelector('.rz-idle, .rz-lock.is-sleep')) return 'lull';
    if (document.querySelector('.rz-battle')) return 'battle';
    var land = root.getAttribute('data-rz-land');
    if (document.querySelector('.rz-charge.is-on:not(.is-done)')) return 'battle';
    if (land === 'groudon' || land === 'kyogre') return land; // อยู่ในถิ่นตำนาน: เพลงประจำถิ่น
    if (root.classList.contains('rz-legends-on')) return 'battle'; // หน้า ตรวจ ORDER กับ Stock (ภาพศึกสามตำนาน): เพลงต่อสู้
    return isDay() ? 'town' : 'sky';
  }
  setInterval(function () {
    if (!timer || !song || !song.loop) return;
    var w = wantLoop();
    pending = w !== songKey ? w : '';
  }, 400);
  function jingle(key) {
    if (!timer || !bgmOn) return;
    resumeKey = song && song.loop ? songKey : resumeKey;
    setSong(key);
    nextT = Math.max(nextT, bctx.currentTime + 0.05);
  }
  window.addEventListener('rz:celebrate', function () { jingle('victory'); });
  window.addEventListener('rz:levelup', function () { jingle('levelup'); });

  // ระดับเพลง: 70% = ดังเท่าเดิม (0.16) · ปรับในศูนย์ตั้งค่า ⚙
  function bgmGain() { return 0.23 * (window.RZVOL ? window.RZVOL.bgm() : 0.7); }
  window.addEventListener('rz:volume', function () { if (master && bctx) master.gain.setTargetAtTime(bgmGain(), bctx.currentTime, 0.05); });
  function startBgm() {
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    if (!bctx) { bctx = new C(); master = bctx.createGain(); master.gain.value = bgmGain(); master.connect(bctx.destination); }
    if (bctx.state === 'suspended') bctx.resume();
    if (timer) return;
    nextT = bctx.currentTime + 0.08;
    timer = setInterval(function () { if (!document.hidden) schedule(); else nextT = bctx.currentTime + 0.08; }, 40);
  }
  function stopBgm() {
    clearInterval(timer); timer = 0;
    if (bctx) bctx.suspend();
  }
  function paintM() {
    if (!mBtn) return;
    mBtn.textContent = '🎵';
    mBtn.classList.toggle('is-off', !bgmOn);
    mBtn.setAttribute('aria-pressed', String(bgmOn));
    mBtn.title = bgmOn ? 'ปิดเพลงประกอบ (M)' : 'เปิดเพลงประกอบ (M)';
    if (!song) mBtn.setAttribute('data-label', 'เพลงประกอบ (M)');
  }
  function toggleBgm() {
    bgmOn = !bgmOn;
    ls(BGM_KEY, bgmOn ? '1' : '0');
    if (bgmOn) { startBgm(); toast('เปิดเพลงประกอบ 🎵 เพลงจะเปลี่ยนเองตามสถานการณ์ (แต่งเองสำหรับ RAYQUAZA)', 'success'); } else stopBgm();
    paintM();
  }

  /* ================= ปุ่มบนแถบนำทาง ================= */
  function addButtons() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar) return;
    var after = document.getElementById('rzSoundToggle') || document.getElementById('rz3dToggle');
    if (!document.getElementById('rzBgmToggle')) {
      mBtn = document.createElement('button');
      mBtn.type = 'button'; mBtn.id = 'rzBgmToggle'; mBtn.className = 'rz-fx-toggle rz-sound-toggle rz-bgm-toggle';
      mBtn.addEventListener('click', toggleBgm);
      bar.insertBefore(mBtn, after ? after.nextSibling : null);
      paintM();
    }
    if (!document.getElementById('rzWeatherBtn')) {
      wBtn = document.createElement('button');
      wBtn.type = 'button'; wBtn.id = 'rzWeatherBtn'; wBtn.className = 'rz-fx-toggle rz-sound-toggle rz-weather-btn';
      wBtn.addEventListener('click', cycle);
      bar.insertBefore(wBtn, mBtn ? mBtn.nextSibling : null);
    }
  }

  /* ---------- รวมปุ่มเปิด/ปิดทั้งหมดไว้ในเมนู ✦ เดียว (แถบนำทางจะได้ไม่แน่นจนแท็บถูกตัด) ---------- */
  var DOCK = [
    ['rzSettingsBtn', 'ตั้งค่าทั้งหมด'],
    ['rzFocusBtn', 'โหมดโฟกัส (F)'],
    ['rzFxToggle', 'เอฟเฟกต์ FX'],
    ['rz3dToggle', 'ฉาก 3D'],
    ['rzSoundToggle', 'เสียงประกอบ'],
    ['rzBgmToggle', 'เพลงประกอบ (M)'],
    ['rzWeatherBtn', 'สภาพอากาศ (W)'],
    ['rzBuddyToggle', 'คู่หู RAYQUAZA'],
    ['rzBattleToggle', 'โหมดต่อสู้ (ตรวจ ORDER)'],
    ['rzOnlineBtn', 'ออนไลน์ (อากาศจริง · อันดับ · เสียง)'],
    ['rzLockBtn', 'ล็อกหน้าจอ / โหมดสลีป (L)'],
    ['rzSwoopToggle', 'ฉาก RAYQUAZA โฉบตอนเปลี่ยนหน้า'],
    ['rzMeteorBtn', 'METEOR CRISIS! (พิมพ์ comet)']
  ];
  function buildDock() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.querySelector('.rz-dock')) return;
    var first = document.getElementById(DOCK[0][0]);
    var dock = document.createElement('div');
    dock.className = 'rz-dock';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rz-fx-toggle rz-dock-btn';
    btn.textContent = '✦';
    btn.title = 'เอฟเฟกต์ · 3D · เสียง · เพลง · สภาพอากาศ';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    var panel = document.createElement('div');
    panel.className = 'rz-dock-panel';
    panel.setAttribute('role', 'menu');
    DOCK.forEach(function (d) {
      var b = document.getElementById(d[0]);
      if (!b) return;
      b.setAttribute('data-label', d[1]);
      panel.appendChild(b);
    });
    dock.appendChild(btn);
    dock.appendChild(panel);
    bar.insertBefore(dock, bar.querySelector('.theme-switch') || (first && first.nextSibling) || null);
    var open = function (v) { dock.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', String(v)); };
    btn.addEventListener('click', function (e) { e.stopPropagation(); open(!dock.classList.contains('is-open')); });
    document.addEventListener('pointerdown', function (e) { if (!dock.contains(e.target)) open(false); }, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
  }

  /* ================= ตาราง: แถบแสงวิ่งระหว่างโหลด ================= */
  var LOAD_RE = /^\s*(⏳\s*)?กำลังโหลด/;
  function markLoading(scope) {
    var ps = (scope || document).querySelectorAll('.sun-hint, .beta-table');
    for (var i = 0; i < ps.length; i++) ps[i].classList.toggle('rz-loading', LOAD_RE.test(ps[i].textContent || ''));
  }
  var lt = 0;
  new MutationObserver(function () { if (!lt) lt = setTimeout(function () { lt = 0; markLoading(); }, 60); })
    .observe(document.documentElement, { subtree: true, childList: true, characterData: true });

  /* ---------- คีย์ลัด W / M ---------- */
  function typing(e) { var t = e.target; return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)); }
  document.addEventListener('keydown', function (e) {
    if ((window.RZ_MIDWORD && window.RZ_MIDWORD()) || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'w' || e.key === 'W') cycle();
    else if (e.key === 'm' || e.key === 'M') toggleBgm();
  });

  function init() {
    document.body.appendChild(wcv);
    resize();
    window.addEventListener('resize', resize, { passive: true });
    addButtons();
    buildDock();
    applySky();
    // ประกาศสภาพอากาศครั้งแรกของวัน
    var seen = ls('rz_weather_seen');
    if (seen !== dayKey() && cur !== 'clear') setTimeout(function () { setWeather(cur, true); }, 7000);
    ls('rz_weather_seen', dayKey());
    // เพลงต้องเริ่มหลังผู้ใช้กดอะไรสักอย่าง (กฎของเบราว์เซอร์)
    if (bgmOn) window.addEventListener('pointerdown', function once() { window.removeEventListener('pointerdown', once, true); if (bgmOn) startBgm(); }, true);
    markLoading();
    requestAnimationFrame(frame);
    window.RZWORLD = { weather: setWeather, cycle: cycle, current: function () { return cur; }, bgm: toggleBgm, bgmOn: function () { return bgmOn && !!timer; }, song: function () { return songKey; } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
