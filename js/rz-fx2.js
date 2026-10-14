// RAYQUAZA FX 2 — ต่อเติมจาก rz-fx.js (ทำงานเมื่อเปิด ✦ FX เท่านั้น และปิดเองถ้าเครื่องตั้ง "ลดการเคลื่อนไหว")
//  1) มังกรบินผ่านจอ: ภาพ MEGA RAYQUAZA จริง (img/rayquaza-mega.png / rayquaza-shiny.png) บินพลิ้วผ่านเป็นระยะ (และหลังฉาก MEGA EVOLUTION)
//  2) ตัวเลขสถิติแบบ HUD: ตัวเลขใน .sv / แถบสรุปสถานะ นับขึ้น-ลงแบบดิจิทัลเมื่อค่าเปลี่ยน + กรอบมุมเล็ง (CSS)
//  3) ชาร์จพลัง: ตอนระบบกำลังทำงาน (ปุ่ม ⏳ / แถบ progress) ขึ้นแถบ "DRAGON ENERGY" ด้านบน แล้วระเบิดแสงตอนเสร็จ
//  4) ปุ่มลับ: กด ↑ ↑ ↓ ↓ ← → ← → B A หรือพิมพ์ rayquaza (ตอนไม่ได้พิมพ์ในช่อง) = DRAGON ASCENT
// ไม่แตะตรรกะของระบบ: วาดบน canvas ที่ pointer-events:none + เขียนตัวเลขกลับเป็นค่าจริงทุกครั้งเมื่อจบแอนิเมชัน
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function on() { return !reduce && root.classList.contains('rz-fx-on') && !document.hidden; }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function api() { return window.RZFX || null; }

  /* ================= 1) มังกรบินผ่านจอ ================= */
  // ใช้ภาพจริงของ MEGA RAYQUAZA (img/) — กลางวัน = ปกติ (เขียว), กลางคืน = ไชนี่ (ดำ)
  // ทำให้ดูมีชีวิตด้วยการตัดภาพเป็นแถบแนวตั้งแล้วเลื่อนเป็นคลื่น (ลำตัวพลิ้ว หัวนิ่ง) + แสงเรืองรอบตัว + ประกายไฟ
  var cv = document.createElement('canvas');
  cv.id = 'rzDragon';
  var cx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  // face = ทิศที่หัวหันในภาพต้นฉบับ (1 = ขวา, -1 = ซ้าย)
  var SPRITES = {
    night: { src: 'img/rayquaza-shiny.png?v=2', face: 1, glow: [255, 90, 44], emA: '#ffd34d', emB: '#ff8a3d' },
    day: { src: 'img/rayquaza-mega.png?v=1', face: -1, glow: [255, 210, 74], emA: '#ffd24a', emB: '#f3a35a' }
  };
  // โหมดสลับสี (รหัสลับ shiny): ใช้ร่างอีกสีชั่วคราว
  function sprite() { return isDay() !== root.classList.contains('rz-alt-color') ? SPRITES.day : SPRITES.night; }
  function loadSprite(s) {
    if (s.img) return;
    s.img = new Image();
    s.img.onload = function () {
      // เตรียมเงาเรืองแสงไว้ครั้งเดียว (ภาพเบลอย้อมสี)
      var g = document.createElement('canvas'), pad = 30;
      g.width = s.img.naturalWidth + pad * 2; g.height = s.img.naturalHeight + pad * 2;
      var gx = g.getContext('2d');
      gx.filter = 'blur(14px)';
      gx.drawImage(s.img, pad, pad);
      gx.filter = 'none';
      gx.globalCompositeOperation = 'source-in';
      gx.fillStyle = 'rgb(' + s.glow.join(',') + ')';
      gx.fillRect(0, 0, g.width, g.height);
      s.glowCv = g; s.pad = pad; s.ready = true;
    };
    s.img.src = s.src;
  }

  var dragon = null;
  var embers = [];
  var nextFly = 0;

  // เส้นทางบิน: ตำแหน่งกลางตัวเป็นฟังก์ชันของเวลา p (0 → 1)
  function makeDragon(kind) {
    var s = sprite();
    // ล่าไชนี่: โอกาสเล็กน้อยที่จะเป็นอีกสี (กลางวันเจอตัวดำ / กลางคืนเจอตัวเขียว)
    var shiny = kind !== 'ascent' && Math.random() < (window.RZ_SHINY_RATE || 1 / 500);
    if (shiny) s = isDay() ? SPRITES.night : SPRITES.day;
    loadSprite(s);
    var d = { kind: kind, s: s, p: 0, shiny: shiny };
    if (shiny) setTimeout(function () { try { window.dispatchEvent(new CustomEvent('rz:shiny')); } catch (e) { /* ข้าม */ } }, 900);
    if (kind === 'dive') {
      // พุ่งจากขอบฟ้าที่ไกลลิบเข้าหากล้อง แล้วเฉียดผ่านจอไป
      d.h = Math.max(220, Math.min(H * 0.5, 440));
      d.dur = 4200;
      d.dir = Math.random() < 0.5 ? 1 : -1;
      d.rot = 0;
      var sx0 = W * (0.3 + Math.random() * 0.4), sy0 = H * (0.32 + Math.random() * 0.16);
      var ex = W * 0.5 + d.dir * W * 0.55, ey = H * (0.55 + Math.random() * 0.3);
      d.at = function (p) { var e = p * p; return [sx0 + (ex - sx0) * e + Math.sin(p * 8) * 30, sy0 + (ey - sy0) * e]; };
      d.scaleAt = function (p) { return 0.08 + Math.pow(p, 2.4) * 2.6; };
      d.far = true;
      return d;
    }
    if (kind === 'ascent') {
      d.h = Math.max(260, Math.min(H * 0.62, 560));
      d.dur = 2600;
      var cx0 = W * (0.35 + Math.random() * 0.3), swing = Math.min(W * 0.16, 220);
      d.dir = 1;
      d.rot = -Math.PI / 2; // หันหัวขึ้นฟ้า
      d.at = function (p) { return [cx0 + Math.sin(p * 7) * swing, H + d.h * 0.9 - p * (H + d.h * 1.8)]; };
    } else {
      d.h = Math.max(220, Math.min(H * 0.52, 460));
      d.dur = 6200;
      d.dir = Math.random() < 0.5 ? 1 : -1;
      d.rot = 0;
      var y0 = H * (0.3 + Math.random() * 0.4), A = 40 + Math.random() * 50, half = d.h * 1.2;
      var x0 = d.dir > 0 ? -half : W + half, span = W + half * 2;
      d.at = function (p) { return [x0 + d.dir * span * p, y0 + Math.sin(p * 9) * A]; };
      // มิติ 3D: บินโค้งเข้าหากล้องช่วงกลางทาง (ตัวใหญ่ขึ้น) แล้วถอยออกไปไกล
      d.scaleAt = function (p) { return 0.62 + 0.5 * Math.sin(p * Math.PI); };
    }
    return d;
  }

  function fly(kind) {
    if (!on() && kind !== 'ascent') return;
    // มังกรบินผ่านจอ (ตามเวลา/ตามเหตุการณ์) ปิดไว้เป็นค่าเริ่มต้น — เปิดได้ในศูนย์ตั้งค่า ⚙ (rz_flyby_v1 = '1')
    var flybyOn = false;
    try { flybyOn = localStorage.getItem('rz_flyby_v1') === '1'; } catch (e) { /* ข้าม */ }
    if (kind !== 'ascent' && !flybyOn) return;
    if (kind !== 'ascent' && root.classList.contains('rz-focus') && !fly.force) return; // โหมดโฟกัส: ไม่บินผ่านเอง
    if (dragon && kind !== 'ascent') return;
    dragon = makeDragon(kind || 'cross');
    cv.style.display = '';
    return dragon;
  }

  function drawDragon(d, t) {
    var s = d.s;
    if (!s.ready) return;
    var img = s.img, iw = img.naturalWidth, ih = img.naturalHeight;
    var depth = d.scaleAt ? d.scaleAt(d.p) : 1;
    var h = d.h * depth, w = h * iw / ih, sc = h / ih;
    var pos = d.at(d.p), nxt = d.at(Math.min(1, d.p + 0.01));
    // เอียงตามทิศบินเล็กน้อย + ลอยขึ้นลง
    var slope = Math.atan2(nxt[1] - pos[1], Math.abs(nxt[0] - pos[0]) + 0.001);
    var rot = d.rot ? d.rot + Math.sin(t * 3) * 0.08 : slope * 0.5 + Math.sin(t * 2.2) * 0.04;
    var flip = s.face !== d.dir; // ภาพหันคนละทางกับทิศบิน → พลิกภาพ
    var fadeIn = Math.min(1, d.p * 12), fadeOut = Math.min(1, (1 - d.p) * 12);

    cx.save();
    cx.translate(pos[0], pos[1] + Math.sin(t * 3.1) * 6);
    cx.rotate(rot);
    if (flip) cx.scale(-1, 1);
    // ไกล = จางลงเหมือนอยู่ในหมอก
    var haze = Math.min(1, 0.35 + depth * 0.75);
    if (d.far) fadeOut = Math.min(1, (1 - d.p) * 5);
    cx.globalAlpha = Math.min(fadeIn, fadeOut) * haze;

    // แสงเรืองด้านหลัง (เต้นตามจังหวะ)
    cx.globalCompositeOperation = 'lighter';
    cx.globalAlpha *= 0.4 + Math.sin(t * 5) * 0.15;
    cx.drawImage(s.glowCv, -w / 2 - s.pad * sc, -h / 2 - s.pad * sc, s.glowCv.width * sc, s.glowCv.height * sc);
    cx.globalCompositeOperation = 'source-over';
    cx.globalAlpha = Math.min(fadeIn, fadeOut) * haze;

    // ตัวมังกร: แถบแนวตั้ง เลื่อนเป็นคลื่น — ด้านหัวนิ่ง ด้านหางพลิ้วมาก
    var strip = Math.max(2, Math.round(iw / Math.max(24, Math.min(160, 120 * depth))));
    var amp = h * 0.035;
    for (var sx = 0; sx < iw; sx += strip) {
      var u = sx / iw;                        // 0 = ซ้ายของภาพ
      var fromHead = s.face > 0 ? 1 - u : u;  // 0 = หัว, 1 = หาง
      var off = Math.sin(fromHead * 9 - t * 7) * amp * Math.pow(fromHead, 1.3);
      var sw = Math.min(strip, iw - sx);
      cx.drawImage(img, sx, 0, sw, ih, -w / 2 + sx * sc, -h / 2 + off, sw * sc + 0.6, h);
    }
    cx.restore();

    // ไชนี่: ดาวประกายระยิบรอบตัว
    if (d.shiny) {
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      for (var sp = 0; sp < 7; sp++) {
        var a = t * 2 + sp * 0.9, rr = h * (0.35 + 0.2 * Math.sin(t * 3 + sp));
        var sx2 = pos[0] + Math.cos(a) * rr * 1.3, sy2 = pos[1] + Math.sin(a) * rr;
        var ss = 6 + 5 * Math.abs(Math.sin(t * 6 + sp));
        cx.fillStyle = sp % 2 ? '#fff6b0' : '#ffffff';
        cx.beginPath();
        cx.moveTo(sx2, sy2 - ss); cx.lineTo(sx2 + ss * 0.25, sy2 - ss * 0.25); cx.lineTo(sx2 + ss, sy2);
        cx.lineTo(sx2 + ss * 0.25, sy2 + ss * 0.25); cx.lineTo(sx2, sy2 + ss); cx.lineTo(sx2 - ss * 0.25, sy2 + ss * 0.25);
        cx.lineTo(sx2 - ss, sy2); cx.lineTo(sx2 - ss * 0.25, sy2 - ss * 0.25); cx.closePath(); cx.fill();
      }
      cx.restore();
    }

    // ประกายไฟปลิวจากตัว
    for (var k = 0; k < 2; k++) {
      embers.push({
        x: pos[0] + (Math.random() - 0.5) * w * 0.8, y: pos[1] + (Math.random() - 0.5) * h * 0.7,
        vx: -d.dir * (0.5 + Math.random() * 1.5) * (d.rot ? 0.3 : 1), vy: d.rot ? 1 + Math.random() * 2 : (Math.random() - 0.5) * 1.2,
        a: 0.9, r: 1 + Math.random() * 2.4, hot: Math.random() < 0.5, c1: s.emA, c2: s.emB
      });
    }
  }

  function drawEmbers() {
    if (!embers.length) return;
    cx.globalCompositeOperation = 'lighter';
    for (var i = embers.length - 1; i >= 0; i--) {
      var e = embers[i];
      e.x += e.vx; e.y += e.vy; e.vy += 0.02; e.a *= 0.955;
      cx.globalAlpha = e.a;
      cx.fillStyle = e.hot ? e.c1 : e.c2;
      cx.beginPath(); cx.arc(e.x, e.y, e.r, 0, 6.283); cx.fill();
      if (e.a < 0.04) embers.splice(i, 1);
    }
    cx.globalAlpha = 1;
    cx.globalCompositeOperation = 'source-over';
  }

  var lastT = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = lastT ? Math.min(50, ts - lastT) : 16;
    lastT = ts;
    if (!nextFly) { nextFly = ts + 14000 + Math.random() * 10000; loadSprite(sprite()); }
    if (!dragon && on() && ts > nextFly) { fly(Math.random() < 0.4 ? 'dive' : 'cross'); nextFly = ts + 75000 + Math.random() * 70000; }
    if (!dragon && !embers.length) { if (cv.style.display !== 'none') { cx.clearRect(0, 0, W, H); cv.style.display = 'none'; } return; }
    cx.clearRect(0, 0, W, H);
    if (dragon) {
      if (!root.classList.contains('rz-fx-on')) { dragon = null; embers.length = 0; return; }
      dragon.p += dt / dragon.dur;
      drawDragon(dragon, ts / 1000);
      if (dragon.p >= 1) dragon = null;
    }
    drawEmbers();
  }

  /* ================= 2) ตัวเลขสถิติแบบ HUD ================= */
  var HUD_SEL = '.sv, .quick-status-item b';
  function parseNum(s) {
    var m = /^\s*(-?[\d,]+)\s*$/.exec(s || '');
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
  }
  function animateNum(el) {
    var txt = el.textContent;
    if (el._rzW === txt) return;          // ข้อความที่เราเขียนเอง
    var to = parseNum(txt), from = el._rzV;
    el._rzV = to;
    if (to === null || from === null || from === undefined || from === to || !on()) return;
    var comma = txt.indexOf(',') >= 0 || Math.abs(to) >= 1000;
    var start = performance.now(), dur = Math.min(900, 380 + Math.abs(to - from) * 6);
    var id = (el._rzA || 0) + 1;
    el._rzA = id;
    el.classList.remove('rz-hud-hit'); void el.offsetWidth; el.classList.add('rz-hud-hit');
    (function step(now) {
      if (el._rzA !== id) return;
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(2, -10 * p);
      var v = Math.round(from + (to - from) * e);
      var out = p < 1 ? (comma ? v.toLocaleString('en-US') : String(v)) : txt;
      el._rzW = out;
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else setTimeout(function () { el.classList.remove('rz-hud-hit'); }, 300);
    })(start);
  }
  function seedNums() {
    document.querySelectorAll(HUD_SEL).forEach(function (el) { if (el._rzV === undefined) el._rzV = parseNum(el.textContent); });
  }

  /* ================= 3) ชาร์จพลัง ================= */
  var charge = null, chargeEl = null, chargeCheck = 0;
  function busyNow() {
    var prog = document.getElementById('progress');
    if (prog && prog.classList.contains('is-active')) {
      var bar = document.getElementById('compareBar');
      return { label: 'ANALYZING STOCK', pct: bar ? parseFloat(bar.style.width) || 0 : 0 };
    }
    var btns = document.querySelectorAll('button:disabled');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].textContent.indexOf('⏳') >= 0 && btns[i].offsetParent) return { label: 'DRAGON ENERGY', pct: null };
    }
    var st = document.querySelectorAll('.sun-imp-status, .beta-status, .scan-status, #sunAllStatus');
    for (var j = 0; j < st.length; j++) {
      if (st[j].textContent.indexOf('⏳') >= 0 && st[j].offsetParent) return { label: 'UPLOADING', pct: null };
    }
    return null;
  }
  function ensureChargeEl() {
    if (chargeEl) return chargeEl;
    chargeEl = document.createElement('div');
    chargeEl.className = 'rz-charge';
    chargeEl.setAttribute('aria-hidden', 'true');
    chargeEl.innerHTML = '<div class="rz-charge-top"><b>⚡ <span class="rz-charge-lbl">DRAGON ENERGY</span></b><span class="rz-charge-pct">0%</span></div>' +
      '<div class="rz-charge-track"><i class="rz-charge-fill"></i></div>';
    document.body.appendChild(chargeEl);
    return chargeEl;
  }
  function chargeTick() {
    var b = on() ? busyNow() : null;
    var now = performance.now();
    if (b && !charge) {
      charge = { t0: now, label: b.label, pct: 0 };
      var el = ensureChargeEl();
      el.classList.remove('is-done', 'is-out');
      el.classList.add('is-on');
    }
    if (charge) {
      var el2 = chargeEl;
      if (b) {
        // ไม่รู้ % จริง: ไล่เข้าใกล้ 95% เรื่อยๆ / รู้ % จริง: ใช้ค่านั้น
        var est = b.pct !== null ? b.pct : 95 * (1 - Math.exp(-(now - charge.t0) / 3200));
        charge.pct = Math.max(charge.pct, Math.min(99, est));
        el2.querySelector('.rz-charge-lbl').textContent = b.label;
        el2.querySelector('.rz-charge-fill').style.width = charge.pct.toFixed(1) + '%';
        el2.querySelector('.rz-charge-pct').textContent = Math.floor(charge.pct) + '%';
      } else {
        // เสร็จ: เต็มหลอด → COMPLETE → ระเบิดแสง
        var long = now - charge.t0 > 700;
        try { window.dispatchEvent(new CustomEvent('rz:charged', { detail: { ms: now - charge.t0 } })); } catch (e) { /* ข้าม */ }
        charge = null;
        el2.querySelector('.rz-charge-fill').style.width = '100%';
        el2.querySelector('.rz-charge-pct').textContent = '100%';
        el2.querySelector('.rz-charge-lbl').textContent = 'COMPLETE';
        el2.classList.add('is-done');
        if (long && on() && api()) {
          var r = el2.getBoundingClientRect();
          api().burst(r.left + r.width / 2, r.top + r.height / 2);
        }
        setTimeout(function () { if (!charge) el2.classList.add('is-out'); }, 900);
        setTimeout(function () { if (!charge) el2.classList.remove('is-on', 'is-done', 'is-out'); }, 1300);
      }
    }
  }
  function scheduleCharge() {
    if (chargeCheck) return;
    chargeCheck = requestAnimationFrame(function () { chargeCheck = 0; chargeTick(); });
  }

  /* ---------- เฝ้าการเปลี่ยนแปลงของหน้า (ตัวเลข + สถานะทำงาน) ---------- */
  function watch() {
    seedNums();
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target;
        var el = t.nodeType === 3 ? t.parentNode : t;
        if (el && el.matches && el.matches(HUD_SEL)) animateNum(el);
        else if (list[i].type === 'childList') {
          // การ์ดที่เพิ่งสร้าง (เช่นของ Sunshine): จำค่าเริ่มต้นไว้ ไม่ต้องนับ
          for (var a = 0; a < list[i].addedNodes.length; a++) {
            var n = list[i].addedNodes[a];
            if (n.nodeType !== 1) continue;
            if (n.matches(HUD_SEL) && n._rzV === undefined) n._rzV = parseNum(n.textContent);
            n.querySelectorAll(HUD_SEL).forEach(function (x) { if (x._rzV === undefined) x._rzV = parseNum(x.textContent); });
          }
        }
      }
      scheduleCharge();
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'class', 'style'] });
    // เผื่อหน้ามีงานค้างตอนแอนิเมชัน: เช็คซ้ำทุกวินาทีระหว่างชาร์จ
    setInterval(function () { if (charge) chargeTick(); }, 1000);
  }

  /* ================= 4) ปุ่มลับ DRAGON ASCENT ================= */
  var SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  var WORD = 'rayquaza';
  var seqPos = 0, typed = '', lastAscent = 0;
  function typing(e) {
    var t = e.target;
    return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
  }
  function ascent() {
    var now = performance.now();
    if (now - lastAscent < 4000) return;
    lastAscent = now;
    if (!root.classList.contains('rz-fx-on')) {
      // FX ปิดอยู่: กดปุ่มลับ = เปิด FX ให้ด้วย
      var tg = document.getElementById('rzFxToggle');
      if (tg) tg.click();
    }
    if (reduce) return;
    var A = api();
    if (A) A.overlay('evolve', 'DRAGON ASCENT', 'Δ  RAYQUAZA  Δ');
    document.body.classList.remove('rz-quake'); void document.body.offsetWidth; document.body.classList.add('rz-quake');
    setTimeout(function () { document.body.classList.remove('rz-quake'); }, 900);
    setTimeout(function () { fly('ascent'); }, 350);
    if (A) [200, 700, 1300, 2100].forEach(function (ms) { setTimeout(A.strike, ms); });
  }
  function onKey(e) {
    if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = (e.key || '').toLowerCase();
    seqPos = (k === SEQ[seqPos]) ? seqPos + 1 : (k === SEQ[0] ? 1 : 0);
    if (seqPos === SEQ.length) { seqPos = 0; ascent(); }
    if (k.length === 1) {
      typed = (typed + k).slice(-WORD.length);
      if (typed === WORD) { typed = ''; ascent(); }
    }
  }

  /* ---------- หลังฉาก MEGA EVOLUTION: มังกรบินผ่าน ---------- */
  function hookEvolve() {
    document.addEventListener('click', function (e) {
      var opt = e.target.closest && e.target.closest('[data-theme-choice]');
      if (!opt) return;
      var want = opt.getAttribute('data-theme-choice');
      if ((want === 'light') === isDay()) return;
      setTimeout(function () { fly('cross'); }, 1100);
    }, true);
  }

  function init() {
    cv.style.display = 'none';
    document.body.appendChild(cv);
    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('keydown', onKey, true);
    hookEvolve();
    watch();
    requestAnimationFrame(frame);
    window.RZFX2 = { fly: fly, ascent: ascent };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
