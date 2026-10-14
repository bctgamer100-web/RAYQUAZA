// RAYQUAZA FX — เอฟเฟกต์ท้องฟ้ามังกร: พายุ/สายฟ้า, ริบบิ้นพลัง, ประกายไฟ, ร่องรอยเมาส์, คลื่นพลังตอนคลิก,
// ฉาก "MEGA EVOLUTION" ตอนสลับโหมด และฉากเปิดตัว · เปิด/ปิดได้ที่ปุ่ม ✦ FX บนแถบนำทาง (จำค่าไว้ในเบราว์เซอร์)
// โหมดกลางคืน = MEGA ไชนี่ (แดง/ส้ม/ทอง) · โหมดกลางวัน = MEGA ปกติ (เขียวมรกต/ทอง/พีช)
// ไม่แตะตรรกะของระบบ: วาดบน canvas ที่ pointer-events:none และ overlay ชั่วคราวเท่านั้น
(function () {
  'use strict';

  var KEY = 'rz_fx_v1';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  var enabled = !reduce;
  try { var saved = localStorage.getItem(KEY); if (saved !== null) enabled = saved === '1'; } catch (e) { /* ข้าม */ }

  var root = document.documentElement;
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function palette() {
    return isDay()
      ? { a: [255, 210, 74], b: [243, 163, 90], c: [108, 208, 180], d: [47, 168, 140], bolt: [255, 240, 170], flash: [255, 231, 161] }
      : { a: [255, 211, 77], b: [255, 138, 61], c: [224, 48, 30], d: [255, 90, 44], bolt: [255, 200, 150], flash: [255, 120, 60] };
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  function setClass() { root.classList.toggle('rz-fx-on', enabled); }
  setClass();

  /* ---------------- ท้องฟ้า (canvas) ---------------- */
  var canvas = document.createElement('canvas');
  canvas.id = 'rzSky';
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var sparks = [];      // ประกายไฟ/ละอองทอง
  var streaks = [];     // เส้นลม (กลางวัน)
  var bolt = null;      // สายฟ้า
  var nextBolt = 0;
  var flashAlpha = 0;
  var trail = [];       // ร่องรอยเมาส์
  var rings = [];       // คลื่นพลังตอนคลิก
  var burst = [];       // ประกายตอนคลิก
  var mouse = { x: -999, y: -999, t: 0 };
  var lastT = 0, slowFrames = 0, heavy = true;

  function spawnSpark(initial) {
    var day = isDay();
    sparks.push({
      x: Math.random() * W,
      y: initial ? Math.random() * H : H + 10,
      vx: (Math.random() - 0.5) * (day ? 0.25 : 0.5),
      vy: -(day ? 0.15 + Math.random() * 0.45 : 0.4 + Math.random() * 1.3),
      r: 1 + Math.random() * (day ? 2.2 : 2.8),
      ph: Math.random() * 6.28,
      life: 0, max: 400 + Math.random() * 500,
      hot: Math.random() < 0.35
    });
  }
  function spawnStreak(initial) {
    streaks.push({
      x: initial ? Math.random() * W : -200,
      y: Math.random() * H,
      len: 120 + Math.random() * 280,
      v: 2 + Math.random() * 4,
      a: 0.05 + Math.random() * 0.12
    });
  }
  function makeBolt() {
    var pts = [], x = W * (0.1 + Math.random() * 0.8), y = -10;
    var branches = [];
    while (y < H * (0.55 + Math.random() * 0.4)) {
      x += (Math.random() - 0.5) * 90;
      y += 20 + Math.random() * 50;
      pts.push([x, y]);
      if (Math.random() < 0.18) {
        var bx = x, by = y, bp = [[bx, by]];
        for (var i = 0; i < 4; i++) { bx += (Math.random() - 0.3) * 70; by += 14 + Math.random() * 30; bp.push([bx, by]); }
        branches.push(bp);
      }
    }
    return { pts: pts, branches: branches, t: 0, life: 38 };
  }

  function ribbon(t, base, amp, freq, speed, width, c1, c2, alpha) {
    var g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, rgba(c1, 0));
    g.addColorStop(0.25, rgba(c1, alpha));
    g.addColorStop(0.7, rgba(c2, alpha));
    g.addColorStop(1, rgba(c2, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 18;
    ctx.shadowColor = rgba(c1, 0.8);
    ctx.beginPath();
    for (var x = -20; x <= W + 20; x += 14) {
      var y = base + Math.sin(x * freq + t * speed) * amp + Math.sin(x * freq * 0.43 - t * speed * 0.7) * amp * 0.5;
      if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!enabled || document.hidden) { if (canvas.style.display !== 'none') { ctx.clearRect(0, 0, W, H); canvas.style.display = 'none'; } return; }
    if (canvas.style.display === 'none') canvas.style.display = '';
    var dt = lastT ? ts - lastT : 16;
    lastT = ts;
    // เครื่องช้า: ปิดของหนัก (สายฟ้า/ริบบิ้นเรืองแสง) อัตโนมัติ
    if (dt > 45) slowFrames++; else if (slowFrames > 0) slowFrames--;
    if (slowFrames > 90) heavy = false;

    var t = ts / 1000;
    var pal = palette();
    var day = isDay();
    ctx.clearRect(0, 0, W, H);

    // เส้นลม (กลางวัน)
    if (day) {
      while (streaks.length < 14) spawnStreak(streaks.length < 8);
      ctx.lineWidth = 1.2;
      for (var s = streaks.length - 1; s >= 0; s--) {
        var st = streaks[s];
        st.x += st.v;
        var gs = ctx.createLinearGradient(st.x - st.len, 0, st.x, 0);
        gs.addColorStop(0, rgba(pal.c, 0));
        gs.addColorStop(1, rgba(pal.a, st.a));
        ctx.strokeStyle = gs;
        ctx.beginPath(); ctx.moveTo(st.x - st.len, st.y); ctx.lineTo(st.x, st.y); ctx.stroke();
        if (st.x - st.len > W) streaks.splice(s, 1);
      }
    } else if (streaks.length) { streaks.length = 0; }

    // ริบบิ้นพลัง (เรืองแสง)
    if (heavy) {
      ctx.globalCompositeOperation = 'lighter';
      ribbon(t, H * 0.14, 40, 0.006, 0.9, 3, pal.b, pal.a, day ? 0.13 : 0.16);
      ribbon(t + 3, H * 0.9, 50, 0.0048, 0.7, 3, pal.c, pal.b, day ? 0.10 : 0.13);
      ctx.globalCompositeOperation = 'source-over';
    }

    // สายฟ้า (กลางคืนถี่/แรงกว่า)
    if (heavy && ts > nextBolt) {
      bolt = makeBolt();
      flashAlpha = day ? 0.10 : 0.16;
      // ให้ฉาก 3D (rz-3d.js) จุดแสงในเมฆตรงที่ฟ้าผ่า
      if (window.RZFX && window.RZFX.onBolt) window.RZFX.onBolt(bolt.pts[0][0] / W);
      nextBolt = ts + (day ? 9000 + Math.random() * 9000 : 5000 + Math.random() * 8000);
    }
    if (bolt) {
      var k = 1 - bolt.t / bolt.life;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(pal.bolt, 0.9 * k);
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 24; ctx.shadowColor = rgba(pal.flash, 1);
      ctx.beginPath(); ctx.moveTo(bolt.pts[0][0], -10);
      for (var i = 0; i < bolt.pts.length; i++) ctx.lineTo(bolt.pts[i][0], bolt.pts[i][1]);
      ctx.stroke();
      ctx.lineWidth = 1.1;
      for (var b = 0; b < bolt.branches.length; b++) {
        var bp = bolt.branches[b];
        ctx.beginPath(); ctx.moveTo(bp[0][0], bp[0][1]);
        for (var j = 1; j < bp.length; j++) ctx.lineTo(bp[j][0], bp[j][1]);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
      bolt.t++;
      if (bolt.t > bolt.life) bolt = null;
    }
    if (flashAlpha > 0.002) {
      ctx.fillStyle = rgba(pal.flash, flashAlpha);
      ctx.fillRect(0, 0, W, H);
      flashAlpha *= 0.86;
    }

    // ประกายไฟ / ละอองทอง
    var target = day ? 36 : 56;
    while (sparks.length < target) spawnSpark(sparks.length < target * 0.7);
    ctx.globalCompositeOperation = 'lighter';
    for (var p = sparks.length - 1; p >= 0; p--) {
      var sp = sparks[p];
      sp.life++;
      sp.ph += 0.04;
      sp.x += sp.vx + Math.sin(sp.ph) * 0.35;
      sp.y += sp.vy;
      var f = sp.life / sp.max;
      var al = Math.sin(Math.min(1, f) * Math.PI) * (sp.hot ? 0.7 : 0.4);
      var col = sp.hot ? pal.a : pal.b;
      ctx.fillStyle = rgba(col, al);
      ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r, 0, 6.283); ctx.fill();
      if (sp.hot) { ctx.fillStyle = rgba(col, al * 0.18); ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.r * 4, 0, 6.283); ctx.fill(); }
      if (sp.life > sp.max || sp.y < -10) sparks.splice(p, 1);
    }

    // ร่องรอยเมาส์ (ริบบิ้น)
    var now = ts;
    while (trail.length && now - trail[0].t > 520) trail.shift();
    if (trail.length > 2) {
      for (var q = 1; q < trail.length; q++) {
        var a0 = trail[q - 1], a1 = trail[q];
        var age = (now - a1.t) / 520;
        var wdt = Math.max(0.5, 7 * (1 - age) * (q / trail.length) + 1);
        ctx.strokeStyle = rgba(q % 2 ? pal.a : pal.b, 0.7 * (1 - age));
        ctx.lineWidth = wdt;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
      }
    }

    // คลื่นพลังตอนคลิก
    for (var r = rings.length - 1; r >= 0; r--) {
      var rg = rings[r];
      rg.r += 5.5; rg.a *= 0.93;
      ctx.strokeStyle = rgba(pal.a, rg.a);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = rgba(pal.b, rg.a * 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r * 0.72, 0, 6.283); ctx.stroke();
      if (rg.a < 0.03) rings.splice(r, 1);
    }
    for (var u = burst.length - 1; u >= 0; u--) {
      var bu = burst[u];
      bu.x += bu.vx; bu.y += bu.vy; bu.vx *= 0.96; bu.vy = bu.vy * 0.96 + 0.05; bu.a *= 0.94;
      ctx.fillStyle = rgba(bu.hot ? pal.a : pal.b, bu.a);
      ctx.beginPath(); ctx.arc(bu.x, bu.y, bu.s, 0, 6.283); ctx.fill();
      if (bu.a < 0.04) burst.splice(u, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function onMove(e) {
    if (!enabled) return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    var last = trail[trail.length - 1];
    if (!last || Math.abs(last.x - mouse.x) + Math.abs(last.y - mouse.y) > 6) {
      trail.push({ x: mouse.x, y: mouse.y, t: performance.now() });
      if (trail.length > 28) trail.shift();
    }
  }
  function onDown(e) {
    if (!enabled) return;
    rings.push({ x: e.clientX, y: e.clientY, r: 4, a: 0.9 });
    for (var i = 0; i < 14; i++) {
      var ang = (i / 14) * 6.283 + Math.random() * 0.4, sp = 2 + Math.random() * 4.5;
      burst.push({ x: e.clientX, y: e.clientY, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, s: 1.2 + Math.random() * 2, a: 0.95, hot: i % 2 === 0 });
    }
  }

  /* ---------------- ฉาก MEGA EVOLUTION / เปิดตัว (DOM overlay) ---------------- */
  function overlay(kind, title, sub, toDay) {
    if (!enabled) return;
    var old = document.getElementById('rzMega');
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'rzMega';
    var day = (typeof toDay === 'boolean') ? toDay : isDay();
    el.className = 'rz-mega rz-mega-' + kind + (day ? ' is-day' : ' is-night');
    el.innerHTML =
      '<div class="rz-mega-flash"></div>' +
      '<div class="rz-mega-ring r1"></div><div class="rz-mega-ring r2"></div><div class="rz-mega-ring r3"></div>' +
      '<div class="rz-mega-beam"></div>' +
      '<div class="rz-mega-title"><small>' + sub + '</small><b>' + title + '</b></div>';
    document.body.appendChild(el);
    var done = function () { if (el.parentNode) el.remove(); };
    el.addEventListener('click', done);
    setTimeout(done, kind === 'intro' ? 1900 : 1500);
  }

  function hookThemeSwitch() {
    document.addEventListener('click', function (e) {
      var opt = e.target.closest && e.target.closest('[data-theme-choice]');
      if (!opt) return;
      var want = opt.getAttribute('data-theme-choice');
      var isNow = isDay() ? 'light' : 'dark';
      if (want === isNow) return;
      if (window.RZEPIC && window.RZEPIC.evolve(want)) return; // ฉาก MEGA EVOLUTION แบบเต็ม (rz-epic.js)
      overlay('evolve', want === 'light' ? 'MEGA RAYQUAZA' : 'SHINY MEGA RAYQUAZA', 'MEGA EVOLUTION', want === 'light');
    }, true);
  }

  /* ---------------- ปุ่มเปิด/ปิด FX ---------------- */
  function addToggle() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('rzFxToggle')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'rzFxToggle';
    b.className = 'rz-fx-toggle';
    b.title = 'เปิด/ปิดเอฟเฟกต์ RAYQUAZA';
    var paint = function () { b.textContent = enabled ? '✦ FX' : '✧ FX'; b.setAttribute('aria-pressed', String(enabled)); };
    b.addEventListener('click', function () {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ข้าม */ }
      setClass(); paint();
      if (enabled) overlay('evolve', 'RAYQUAZA', 'DRAGON ASCENT');
    });
    paint();
    var sw = bar.querySelector('.theme-switch');
    bar.insertBefore(b, sw || null);
  }

  function init() {
    document.body.insertBefore(canvas, document.body.firstChild);
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true, capture: true });
    addToggle();
    hookThemeSwitch();
    requestAnimationFrame(frame);
    // ฉากเปิดตัว: ครั้งแรกของแท็บ/เซสชัน
    var seen = false;
    try { seen = sessionStorage.getItem('rz_intro') === '1'; sessionStorage.setItem('rz_intro', '1'); } catch (e) { /* ข้าม */ }
    // rz-poke.js มีฉากเปิดแอป Master Ball ของตัวเอง
    if (!seen && !window.RZ_CUSTOM_INTRO) setTimeout(function () { overlay('intro', 'RAYQUAZA', 'SKY HIGH DRAGON'); }, 150);
  }

  // ให้ rz-fx2.js (มังกร/HUD/ชาร์จพลัง/ปุ่มลับ) เรียกใช้ฉากและสายฟ้าได้
  window.RZFX = {
    overlay: overlay,
    strike: function () { nextBolt = 0; },
    burst: function (x, y) { onDown({ clientX: x, clientY: y }); },
    isOn: function () { return enabled; },
    isDay: isDay
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
