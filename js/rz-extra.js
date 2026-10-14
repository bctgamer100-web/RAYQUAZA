// RAYQUAZA EXTRA — ตำนานลึกลับมาเยือน · เทศกาล · รหัสลับเพิ่ม · ตู้เสื้อผ้าคู่หู · ป้าย HP สต็อก (คู่กับ css/rz-extra.css)
//  1) ตำนานมาเยือน: วันแดดแรง/ฝนตก มีโอกาสวันละครั้งที่ "เงาปริศนา" (ผมวาดเองเป็นเงายักษ์แห่งผืนดิน/ท้องทะเล) โผล่ขอบจอ แล้ว RAYQUAZA บินมาไล่ → ลมกรด Delta Stream ทั้งวัน
//  2) เทศกาล (ดูจากวันที่): สงกรานต์ 💦 · ลอยกระทง 🏮 · ฮาโลวีน 🦇 · คริสต์มาส 🎄 · ปีใหม่ 🎆 · ตรุษจีน 🧧  (ลองดูได้: window.RZEXTRA.fest('songkran'))
//  3) รหัสลับ (พิมพ์ตอนไม่ได้อยู่ในช่อง): hyper = ลำแสงไฮเปอร์บีมกวาดจอ · shiny = สลับร่างสีชั่วคราว · pokedex = คลัง SKU ที่เคยเปิดดู
//  4) ตู้เสื้อผ้าคู่หู: ปลดล็อกของแต่งตามเลเวล (โบว์ หมวก ผ้าพันคอ แว่น มงกุฎ วงแหวนแสง) เลือกใส่ในบัตรเทรนเนอร์
//  5) ป้าย HP สต็อก: ตารางหน้า RZ Plan ช่องคงเหลือ ≤ 5 = ⚠ HP ต่ำ · ≤ 0 = 💀 หมดแรง
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function on() { return !reduce && root.classList.contains('rz-fx-on') && !document.hidden; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function flag(k) { return ls(k) !== '0'; }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function sfx(n) { if (window.RZPOKE) window.RZPOKE.sfx(n); }
  function lvl() { var S = window.RZTRAINER ? window.RZTRAINER.state() : null, e = S ? S.exp : 0, l = 1; while (l < 100 && e >= 40 + l * 20) { e -= 40 + l * 20; l++; } return l; }
  function busy() { return !!document.querySelector('.rz-lock, .rz-battle, .rz-meteor, .rz-epic-evo, .rz-ball-intro, .rz-visit'); }

  /* ================= 1) ตำนานลึกลับมาเยือน ================= */
  // เงาวาดเองด้วย SVG (ไม่ใช่ภาพจากเกม): ยักษ์หลังหนามแห่งผืนดิน / วาฬยักษ์ครีบใหญ่แห่งท้องทะเล
  var LAND = '<svg viewBox="0 0 400 260" aria-hidden="true"><path d="M20 250 C40 170 70 150 95 120 L80 70 L120 105 L135 40 L160 95 L185 25 L205 90 L235 35 L245 100 L285 60 L280 120 C330 130 370 170 385 250 Z" /><circle class="eye" cx="118" cy="150" r="7"/><circle class="eye" cx="150" cy="148" r="6"/></svg>';
  var SEA = '<svg viewBox="0 0 420 220" aria-hidden="true"><path d="M10 160 C60 80 160 50 260 70 C330 85 380 120 410 105 L395 150 L415 200 C370 175 330 180 290 185 C200 200 90 205 10 160 Z M170 70 L200 10 L235 72 Z M120 170 L95 215 L160 185 Z" /><circle class="eye" cx="105" cy="128" r="7"/><path class="eye-line" d="M60 150 Q140 175 230 160" /></svg>';
  function visit(kind) {
    if (!on() || busy()) return false;
    kind = kind || (window.RZWORLD && window.RZWORLD.current() === 'rain' ? 'sea' : 'land');
    var ov = el('div', 'rz-visit is-' + kind, '<div class="rz-visit-shade"></div><div class="rz-visit-mon">' + (kind === 'sea' ? SEA : LAND) + '</div>');
    document.body.appendChild(ov);
    toast(kind === 'sea' ? '🌊 เงาของตำนานแห่งท้องทะเลโผล่ขึ้นที่ขอบฟ้า… ฝนเริ่มหนักขึ้น!' : '🌋 เงาของตำนานแห่งผืนดินโผล่ขึ้นที่ขอบฟ้า… แดดร้อนแรงขึ้น!', '');
    sfx('roar');
    setTimeout(function () { document.body.classList.add('rz-rumble'); }, 600);
    setTimeout(function () {
      document.body.classList.remove('rz-rumble');
      if (window.RZFX2) { window.RZFX2.fly.force = true; window.RZFX2.fly('cross'); window.RZFX2.fly.force = false; }
      if (window.RZFX) window.RZFX.strike();
      sfx('thunder');
      ov.classList.add('is-flee');
    }, 3600);
    setTimeout(function () {
      ov.remove();
      if (window.RZWORLD) window.RZWORLD.weather('delta', false);
      toast('🌪️ RAYQUAZA ไล่ตำนานกลับไปแล้ว! ท้องฟ้าสงบด้วยลมกรด Delta Stream (+40 EXP)', 'success');
      if (window.RZTRAINER) window.RZTRAINER.gain(40, 'visit');
      if (window.RZBUDDY) window.RZBUDDY.say('ไม่มีใครมาป่วนท้องฟ้าของเราได้หรอก!');
    }, 5600);
    return true;
  }
  (function scheduleVisit() {
    var today = new Date().toDateString();
    if (ls('rz_visit_day') === today) return;
    setTimeout(function tryV() {
      if (!flag('rz_visit_v1') || root.classList.contains('rz-focus')) return;
      var w = window.RZWORLD ? window.RZWORLD.current() : '';
      if (w !== 'sun' && w !== 'rain') { ls('rz_visit_day', today); return; }
      if (Math.random() > 0.4) { ls('rz_visit_day', today); return; }
      if (document.querySelector('.rz-charge.is-on:not(.is-done), .rz-tc-ov, .rz-alert') || !visit()) { setTimeout(tryV, 60000); return; }
      ls('rz_visit_day', today);
    }, (5 + Math.random() * 25) * 60000);
  })();

  /* ================= 2) เทศกาล ================= */
  // วันลอยกระทง (เพ็ญเดือน 12) ไม่ตรงกันทุกปี — ใส่วันที่ไว้ล่วงหน้า (ประมาณการ ตรวจสอบกับปฏิทินจริงอีกครั้ง)
  var LOY = ['2025-11-5', '2026-11-24', '2027-11-13', '2028-11-2'];
  var CNY = ['2026-2-17', '2027-2-6', '2028-1-26', '2029-2-13'];
  function festToday(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate(), k = d.getFullYear() + '-' + m + '-' + day;
    if (m === 4 && day >= 13 && day <= 15) return 'songkran';
    if (LOY.indexOf(k) >= 0) return 'loy';
    if (CNY.some(function (c) { var x = new Date(c); return Math.abs(d - x) < 2 * 864e5 && d >= x - 864e5; })) return 'cny';
    if (m === 10 && day === 31) return 'halloween';
    if (m === 12 && (day === 24 || day === 25)) return 'xmas';
    if ((m === 12 && day === 31) || (m === 1 && day === 1)) return 'newyear';
    return '';
  }
  var FEST = {
    songkran: ['💦', 'สุขสันต์วันสงกรานต์!'], loy: ['🏮', 'สุขสันต์วันลอยกระทง!'], cny: ['🧧', 'ซินเจียยู่อี่ ซินนี้ฮวดไช้!'],
    halloween: ['🦇', 'Happy Halloween! ระวังผีสต็อกหาย 👻'], xmas: ['🎄', 'Merry Christmas!'], newyear: ['🎆', 'สวัสดีปีใหม่!']
  };
  var fcv = null, fx = null, fParts = [], fKind = '', fT = 0;
  function startFest(kind) {
    stopFest();
    if (!kind || !FEST[kind]) return;
    fKind = kind;
    root.setAttribute('data-rz-fest', kind);
    fcv = el('canvas'); fcv.id = 'rzFest'; fcv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fcv);
    fx = fcv.getContext('2d');
    var resize = function () { fcv.width = innerWidth; fcv.height = innerHeight; };
    resize(); window.addEventListener('resize', resize);
    // ป้ายเทศกาลบนแถบนำทาง
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (bar && !bar.querySelector('.rz-fest-tag')) {
      var tag = el('span', 'rz-fest-tag', FEST[kind][0] + ' <b>' + FEST[kind][1] + '</b>');
      var h1 = bar.querySelector('h1'); bar.insertBefore(tag, h1 ? h1.nextSibling : bar.firstChild);
    }
    if (kind === 'cny' || kind === 'xmas') {
      var g = el('div', 'rz-fest-garland is-' + kind);
      for (var i = 0; i < 14; i++) g.appendChild(el('i'));
      document.body.appendChild(g);
    }
    loopFest();
  }
  function stopFest() {
    cancelAnimationFrame(fT);
    if (fcv) fcv.remove();
    document.querySelectorAll('.rz-fest-tag, .rz-fest-garland').forEach(function (x) { x.remove(); });
    root.removeAttribute('data-rz-fest');
    fcv = null; fParts = []; fKind = '';
  }
  function spawnFest() {
    var W = fcv.width, H = fcv.height, r = Math.random;
    switch (fKind) {
      case 'songkran': return { x: r() * W, y: -10, vx: (r() - 0.5) * 2, vy: 6 + r() * 6, s: 2 + r() * 3, c: 'rgba(120,200,255,', a: 0.7 };
      case 'loy': return { x: r() * W, y: H + 20, vx: (r() - 0.5) * 0.4, vy: -(0.4 + r() * 0.8), s: 6 + r() * 8, c: 'lantern', a: 0.9, ph: r() * 6 };
      case 'halloween': return { x: -30, y: r() * H * 0.6, vx: 2 + r() * 3, vy: 0, s: 10 + r() * 10, c: 'bat', a: 0.85, ph: r() * 6 };
      case 'xmas': return { x: r() * W, y: -10, vx: (r() - 0.5) * 0.6, vy: 0.6 + r() * 1.2, s: 1.5 + r() * 3, c: 'rgba(255,255,255,', a: 0.85, ph: r() * 6 };
      case 'cny': return { x: r() * W, y: -10, vx: (r() - 0.5) * 0.5, vy: 0.5 + r(), s: 2 + r() * 2.5, c: 'rgba(255,210,80,', a: 0.9, ph: r() * 6 };
      case 'newyear': return null;
    }
    return null;
  }
  var nextFw = 0;
  function loopFest(t) {
    fT = requestAnimationFrame(loopFest);
    if (!fcv) return;
    var show = on() && !root.classList.contains('rz-focus');
    fcv.style.display = show ? '' : 'none';
    if (!show) return;
    var W = fcv.width, H = fcv.height;
    fx.clearRect(0, 0, W, H);
    var target = { songkran: 90, loy: 26, halloween: 7, xmas: 80, cny: 40, newyear: 0 }[fKind];
    while (fParts.length < target) { var p0 = spawnFest(); if (!p0) break; if (fKind !== 'loy' && fKind !== 'halloween' && fParts.length < target / 2) p0.y = Math.random() * H; fParts.push(p0); }
    // ปีใหม่: พลุ
    if (fKind === 'newyear' && (t || 0) > nextFw) {
      nextFw = (t || 0) + 700 + Math.random() * 1400;
      var cx = W * (0.15 + Math.random() * 0.7), cy = H * (0.15 + Math.random() * 0.35), hue = Math.floor(Math.random() * 360);
      for (var k = 0; k < 46; k++) { var a = k / 46 * 6.283, v = 2 + Math.random() * 3; fParts.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 2, c: 'hsla(' + hue + ',100%,65%,', a: 1, fw: true }); }
    }
    for (var i = fParts.length - 1; i >= 0; i--) {
      var p = fParts[i];
      p.ph = (p.ph || 0) + 0.05;
      p.x += p.vx + (p.c === 'lantern' ? Math.sin(p.ph) * 0.3 : 0);
      p.y += p.vy + (p.c === 'bat' ? Math.sin(p.ph * 2) * 1.5 : 0);
      if (p.fw) { p.vy += 0.04; p.vx *= 0.985; p.vy *= 0.985; p.a *= 0.975; }
      if (p.c === 'lantern') {
        var gl = fx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 3);
        gl.addColorStop(0, 'rgba(255,200,90,.55)'); gl.addColorStop(1, 'rgba(255,120,30,0)');
        fx.fillStyle = gl; fx.beginPath(); fx.arc(p.x, p.y, p.s * 3, 0, 6.283); fx.fill();
        fx.fillStyle = '#ffb347'; fx.fillRect(p.x - p.s * 0.6, p.y - p.s, p.s * 1.2, p.s * 1.6);
      } else if (p.c === 'bat') {
        var wv = Math.sin(p.ph * 6) * p.s * 0.5;
        fx.fillStyle = 'rgba(20,10,20,' + p.a + ')';
        fx.beginPath(); fx.moveTo(p.x, p.y); fx.quadraticCurveTo(p.x - p.s, p.y - wv - p.s * 0.4, p.x - p.s * 1.6, p.y + wv * 0.3);
        fx.quadraticCurveTo(p.x - p.s * 0.6, p.y + 2, p.x, p.y + 3); fx.quadraticCurveTo(p.x + p.s * 0.6, p.y + 2, p.x + p.s * 1.6, p.y + wv * 0.3);
        fx.quadraticCurveTo(p.x + p.s, p.y - wv - p.s * 0.4, p.x, p.y); fx.fill();
      } else {
        fx.fillStyle = p.c + p.a + ')';
        if (fKind === 'songkran' && !p.fw) { fx.fillRect(p.x, p.y, p.s * 0.6, p.s * 4); }
        else { fx.beginPath(); fx.arc(p.x, p.y, p.s, 0, 6.283); fx.fill(); }
      }
      if (p.y > H + 30 || p.y < -60 || p.x > W + 60 || p.a < 0.03) fParts.splice(i, 1);
    }
  }
  function fest(kind) { if (kind) startFest(kind); else stopFest(); }
  function syncFest() {
    var k = flag('rz_fest_v1') ? festToday() : '';
    if (k !== fKind) {
      startFest(k);
      if (k && ls('rz_fest_seen') !== new Date().toDateString()) { ls('rz_fest_seen', new Date().toDateString()); setTimeout(function () { toast(FEST[k][0] + ' ' + FEST[k][1], 'success'); }, 5000); }
    }
  }
  window.addEventListener('rz:setting', function (e) { if (e.detail && e.detail.key === 'rz_fest_v1') syncFest(); if (e.detail && e.detail.key === 'rz_lowhp_v1') tagStock(); });

  /* ================= 3) รหัสลับ ================= */
  function hyperBeam() {
    if (!on() || busy()) return;
    var ov = el('div', 'rz-hyper', '<i class="rz-hyper-beam"></i><i class="rz-hyper-core"></i><b>HYPER BEAM!!</b>');
    document.body.appendChild(ov);
    sfx('thunder'); sfx('roar');
    document.body.classList.remove('rz-quake'); void document.body.offsetWidth; document.body.classList.add('rz-quake');
    var A = window.RZFX;
    if (A && A.burst) [0, 150, 300, 450].forEach(function (d, i) { setTimeout(function () { A.burst(innerWidth * (0.2 + i * 0.2), innerHeight / 2); }, d); });
    setTimeout(function () { document.body.classList.remove('rz-quake'); ov.remove(); }, 1600);
    if (window.RZTRAINER) window.RZTRAINER.gain(5, 'secret-hyper');
  }
  function altColor() {
    var v = !root.classList.contains('rz-alt-color');
    root.classList.toggle('rz-alt-color', v);
    toast(v ? '✨ สลับร่างสีพิเศษชั่วคราว! (พิมพ์ shiny อีกครั้งเพื่อกลับ)' : 'กลับร่างสีปกติแล้ว', 'success');
    if (window.RZBUDDY) window.RZBUDDY.say(v ? 'สีใหม่เป็นไงบ้าง? ✨' : 'กลับมาสีเดิมแล้ว!');
  }
  function pokedexAll() {
    if (document.querySelector('.rz-pdx-ov')) return;
    var seen = {};
    try { seen = JSON.parse(ls('rz_dex_seen_v1') || '{}'); } catch (e) { /* ข้าม */ }
    var keys = Object.keys(seen).sort();
    var ov = el('div', 'rz-tc-ov rz-pdx-ov', '<div class="rz-dex rz-pdx" role="dialog" aria-label="คลัง RZ-DEX"><div class="rz-dex-top"><span class="rz-dex-lens"></span><span class="rz-dex-led r"></span><span class="rz-dex-led y"></span><span class="rz-dex-led g"></span><b>RZ-DEX</b><span class="rz-dex-seen">พบแล้ว ' + keys.length + ' SKU</span><button type="button" class="rz-dex-x" aria-label="ปิด">×</button></div>' +
      '<input type="search" class="rz-pdx-q" placeholder="ค้นหา SKU ในคลัง…">' +
      '<div class="rz-pdx-list">' + (keys.length ? keys.map(function (k, i) { return '<button type="button" data-sku="' + esc(k) + '"><small>No.' + ('00' + (i + 1)).slice(-3) + '</small>' + esc(k) + '</button>'; }).join('') : '<p>ยังไม่เคยเปิดดู SKU ไหนเลย — ดับเบิลคลิก SKU ในตารางเพื่อเริ่มบันทึก</p>') + '</div></div>');
    document.body.appendChild(ov);
    var close = function () { ov.remove(); };
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.rz-dex-x')) { close(); return; }
      var b = e.target.closest('[data-sku]');
      if (b) { close(); if (window.RZDEX) window.RZDEX.open(b.getAttribute('data-sku')); }
    });
    ov.querySelector('.rz-pdx-q').addEventListener('input', function (e) {
      var q = e.target.value.trim().toUpperCase();
      ov.querySelectorAll('[data-sku]').forEach(function (b) { b.style.display = !q || b.getAttribute('data-sku').toUpperCase().indexOf(q) >= 0 ? '' : 'none'; });
    });
    setTimeout(function () { ov.querySelector('.rz-pdx-q').focus(); }, 50);
  }
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    typed = (typed + e.key.toLowerCase()).slice(-7);
    if (/hyper$/.test(typed)) { typed = ''; hyperBeam(); }
    else if (/shiny$/.test(typed)) { typed = ''; altColor(); }
    else if (/pokedex$/.test(typed)) { typed = ''; pokedexAll(); }
  });

  /* ================= 4) ตู้เสื้อผ้าคู่หู ================= */
  var ACC = [
    ['none', '—', 'ไม่ใส่', 1], ['bow', '🎀', 'โบว์', 3], ['hat', '🎩', 'หมวก', 5], ['scarf', '🧣', 'ผ้าพันคอ', 10],
    ['shades', '🕶️', 'แว่นกันแดด', 15], ['crown', '👑', 'มงกุฎ', 25], ['halo', '😇', 'วงแหวนแสง', 40]
  ];
  function wearing() { return ls('rz_buddy_acc') || 'none'; }
  // ของแต่งที่ได้จากกล่อง Mystery Gift (rz-adventure.js) ใส่ได้ก่อนถึงเลเวล
  function gifted(id) { try { return (JSON.parse(ls('rz_acc_gift') || '[]')).indexOf(id) >= 0; } catch (e) { return false; } }
  function paintAcc() {
    var body = document.querySelector('.rz-buddy-body');
    if (!body) return;
    var a = body.querySelector('.rz-buddy-acc');
    if (!a) { a = el('span', 'rz-buddy-acc'); body.appendChild(a); }
    var cur = ACC.filter(function (x) { return x[0] === wearing(); })[0] || ACC[0];
    if (cur[3] > lvl() && !gifted(cur[0])) cur = ACC[0];
    a.textContent = cur[0] === 'none' ? '' : cur[1];
    a.className = 'rz-buddy-acc is-' + cur[0];
  }
  // วางของแต่งไว้ที่หัว: หัวอยู่ฝั่งที่มังกรหันไป (ทิศในภาพ × การพลิก)
  setInterval(function () {
    var b = document.querySelector('.rz-buddy'), a = b && b.querySelector('.rz-buddy-acc');
    if (!a || !a.textContent) return;
    var face = +(b.dataset.face || 1), flip = +(getComputedStyle(b).getPropertyValue('--rz-bflip') || 1);
    b.classList.toggle('acc-left', face * flip < 0);
  }, 400);
  window.addEventListener('rz:card', function (e) {
    var card = e.detail && e.detail.el;
    if (!card) return;
    var L = lvl(), cur = wearing();
    var sec = el('section', 'rz-tc-wardrobe', '<h5>👗 ตู้เสื้อผ้าคู่หู <small>ปลดล็อกตามเลเวล</small></h5><div class="rz-wd">' + ACC.map(function (x) {
      var lock = x[3] > L && !gifted(x[0]);
      return '<button type="button" data-acc="' + x[0] + '"' + (lock ? ' disabled' : '') + ' class="' + (cur === x[0] ? 'is-on' : '') + '"><i>' + (lock ? '🔒' : x[1]) + '</i><span>' + (lock ? 'Lv.' + x[3] : x[2]) + '</span></button>';
    }).join('') + '</div>');
    var heat = card.querySelector('.rz-tc-heat') || card.querySelector('.rz-tc-badges');
    if (heat) heat.parentNode.insertBefore(sec, heat.nextSibling);
    sec.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-acc]');
      if (!b || b.disabled) return;
      ls('rz_buddy_acc', b.getAttribute('data-acc'));
      sec.querySelectorAll('[data-acc]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      paintAcc();
      if (window.RZBUDDY && b.getAttribute('data-acc') !== 'none') window.RZBUDDY.say('ชุดใหม่! เท่ไหม? ✨');
    });
  });
  window.addEventListener('rz:levelup', function (e) {
    var lv = e.detail && e.detail.lv;
    ACC.forEach(function (x) { if (x[3] === lv) setTimeout(function () { toast('👗 ปลดล็อกของแต่งคู่หู: ' + x[1] + ' ' + x[2] + '! (เลือกใส่ในบัตรเทรนเนอร์)', 'success'); }, 3500); });
  });

  /* ================= 5) ป้าย HP สต็อก (หน้า RZ Plan) ================= */
  var STOCK_COL = /คงเหลือ|สต็อก|สต๊อก|^stock$|^qty$/i, NOT_COL = /ขาย|สั่ง|order|เป้า|ย้าย|เข้า|ออก/i;
  var tagT = 0;
  function tagStock() {
    tagT = 0;
    var out = document.getElementById('sunOutput');
    if (!out) return;
    var en = flag('rz_lowhp_v1');
    out.querySelectorAll('table').forEach(function (tb) {
      var head = (tb.tHead && tb.tHead.rows[0]) || tb.querySelector('tr');
      if (!head) return;
      var cols = [];
      Array.prototype.forEach.call(head.cells, function (c, i) { var h = (c.textContent || '').trim(); if (STOCK_COL.test(h) && !NOT_COL.test(h)) cols.push(i); });
      if (!cols.length) return;
      var rows = (tb.tBodies[0] || tb).rows;
      for (var r = 0; r < rows.length && r < 3000; r++) {
        cols.forEach(function (i) {
          var td = rows[r].cells[i];
          if (!td || td.tagName !== 'TD') return;
          var v = parseFloat((td.textContent || '').replace(/,/g, ''));
          var cls = !en || isNaN(v) ? '' : v <= 0 ? 'rz-hp0' : v <= 5 ? 'rz-hp1' : '';
          td.classList.toggle('rz-hp0', cls === 'rz-hp0');
          td.classList.toggle('rz-hp1', cls === 'rz-hp1');
        });
      }
    });
  }
  function watchStock() {
    var out = document.getElementById('sunOutput');
    if (!out) return;
    new MutationObserver(function () { if (!tagT) tagT = setTimeout(tagStock, 200); }).observe(out, { childList: true, subtree: true });
  }

  function init() {
    syncFest();
    setInterval(syncFest, 10 * 60000);
    paintAcc();
    new MutationObserver(paintAcc).observe(document.body, { childList: true });
    watchStock();
    tagStock();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.RZEXTRA = { visit: visit, fest: fest, hyper: hyperBeam, shiny: altColor, pokedex: pokedexAll, festToday: festToday };
})();
