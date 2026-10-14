// RAYQUAZA BUDDY — คู่หูมังกรตัวเล็กมุมจอ (คู่กับ css/rz-buddy.css) ทำงานเมื่อเปิด ✦ FX และเปิด "คู่หู" ในเมนู ✦
//  - หันหน้า/เอียงตัวตามเมาส์ · ลอยขึ้นลงเบาๆ · ไม่ได้ใช้งานนาน = งีบหลับ
//  - งานสำเร็จ = กระโดดดีใจ · มีข้อผิดพลาด = คำรามและจอสั่น · ภารกิจสำเร็จ = บินวนรอบจอ · ระบบทำงาน = เชียร์
//  - คลิก = ลูบหัว (หัวใจลอย + ค่าความสนิท) · ลากไปวางตรงไหนก็ได้ (จำตำแหน่งไว้)
//  - พูดเตือน/แนะนำเองเป็นระยะ และใช้เป็น "ปาก" ของ RAYQUAZA ให้โมดูลอื่น (window.RZBUDDY.say)
(function () {
  'use strict';

  var KEY = 'rz_buddy_v1';
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function sfx(n) { if (window.RZPOKE) window.RZPOKE.sfx(n); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var S = { on: true, fr: 0, x: null, y: null };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) for (var k in raw) S[k] = raw[k]; } catch (e) { /* ข้าม */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ข้าม */ } }

  // face = ทิศที่หัวหันในภาพ (1 = ขวา)
  var SPR = { night: ['img/rayquaza-shiny.png?v=2', 1], day: ['img/rayquaza-mega.png?v=1', -1] };
  var el = null, img = null, bubble = null, btn = null;
  var state = 'idle', lastInput = Date.now(), sayTimer = 0, busyCheered = false;

  function build() {
    el = document.createElement('div');
    el.className = 'rz-buddy';
    el.setAttribute('aria-label', 'RAYQUAZA คู่หู — คลิกเพื่อลูบหัว ลากเพื่อย้าย');
    el.innerHTML = '<div class="rz-buddy-bubble" role="status"></div><div class="rz-buddy-body"><img alt="" draggable="false"><span class="rz-buddy-z">z</span><span class="rz-buddy-z z2">Z</span></div><div class="rz-buddy-shadow"></div>';
    img = el.querySelector('img');
    bubble = el.querySelector('.rz-buddy-bubble');
    document.body.appendChild(el);
    place();
    paintSprite();
    drag();
  }
  function place() {
    var w = 130, h = 120;
    var x = S.x === null ? 18 : Math.min(Math.max(4, S.x), window.innerWidth - w);
    var y = S.y === null ? window.innerHeight - h - 18 : Math.min(Math.max(70, S.y), window.innerHeight - h);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
  function paintSprite() {
    var s = isDay() !== root.classList.contains('rz-alt-color') ? SPR.day : SPR.night;
    if (img.getAttribute('src') !== s[0]) img.src = s[0];
    el.dataset.face = s[1];
  }
  function visible() { return S.on && fxOn() && !reduce; }
  function sync() {
    if (!el) return;
    el.style.display = visible() ? '' : 'none';
    if (btn) { btn.textContent = '🐉'; btn.setAttribute('aria-pressed', String(S.on)); btn.classList.toggle('is-off', !S.on); }
  }

  /* ---------- พูด ---------- */
  function say(text, ms) {
    if (!el || !visible()) return;
    bubble.textContent = text;
    el.classList.add('is-talk');
    clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { el.classList.remove('is-talk'); }, ms || Math.min(6000, 2200 + text.length * 60));
  }
  function mood(name, ms) {
    if (!el) return;
    el.classList.remove('m-happy', 'm-angry', 'm-cheer', 'm-pet', 'm-glow');
    void el.offsetWidth;
    el.classList.add('m-' + name);
    setTimeout(function () { el.classList.remove('m-' + name); }, ms || 1200);
  }

  /* ---------- หันตามเมาส์ ---------- */
  var mx = 0, my = 0, raf = 0;
  function look() {
    raf = 0;
    if (!visible() || state === 'sleep' || el.classList.contains('is-fly')) return;
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dir = mx < cx ? -1 : 1;                       // อยากหันไปทางไหน
    var flip = dir * (+el.dataset.face) < 0 ? -1 : 1; // ต้องพลิกภาพไหม
    var ang = Math.max(-12, Math.min(12, (my - cy) / 25)) * dir;
    el.style.setProperty('--rz-bflip', flip);
    el.style.setProperty('--rz-btilt', ang.toFixed(1) + 'deg');
  }
  function onMove(e) {
    mx = e.clientX; my = e.clientY;
    lastInput = Date.now();
    if (state === 'sleep') wakeUp();
    if (!raf) raf = requestAnimationFrame(look);
  }

  /* ---------- หลับ/ตื่น ---------- */
  function wakeUp() {
    lastInput = Date.now();
    if (state === 'sleep') { state = 'idle'; el.classList.remove('is-sleep'); say(pick(['หาว~ ตื่นแล้ว!', 'อ๊ะ! กลับมาแล้วเหรอ', 'งีบไปแป๊บเดียวเอง…'])); }
  }
  setInterval(function () {
    if (!el || !visible()) return;
    if (state !== 'sleep' && Date.now() - lastInput > 90 * 1000) { state = 'sleep'; el.classList.add('is-sleep'); el.classList.remove('is-talk'); }
    // เชียร์ตอนระบบกำลังทำงาน
    var busy = !!document.querySelector('.rz-charge.is-on:not(.is-done)');
    if (busy && !busyCheered && state !== 'sleep') { busyCheered = true; mood('cheer', 2000); say(pick(['สู้ๆ! กำลังชาร์จพลัง!', 'รอแป๊บนะ กำลังจัดการให้!', 'ฮึบ! ใกล้เสร็จแล้ว!'])); }
    if (!busy) busyCheered = false;
  }, 1000);

  /* ---------- ลูบหัว / ลาก ---------- */
  var PET_LINES = [
    [0, ['กรรร~ ♪', 'อุ่นจัง!', 'ชอบๆ!']],
    [10, ['เราสนิทกันขึ้นแล้วนะ!', 'ลูบอีกๆ ♪', 'วันนี้ทำงานเก่งมาก!']],
    [50, ['เพื่อนรัก! ♥', 'พร้อมบินไปกับเธอทุกที่!', 'ไว้ใจเราได้เลย!']],
    [150, ['เทรนเนอร์ที่ดีที่สุดในโลก!', 'จะปกป้องสต็อกของเธอเอง!', 'MEGA ♥ ♥ ♥']]
  ];
  function pet(e) {
    if (state === 'sleep') { wakeUp(); return; }
    S.fr++; save();
    try { window.dispatchEvent(new CustomEvent('rz:pet', { detail: { fr: S.fr } })); } catch (er) { /* ข้าม */ }
    sfx('click');
    mood('pet', 900);
    for (var i = 0; i < 3; i++) {
      var hrt = document.createElement('span');
      hrt.className = 'rz-buddy-heart';
      hrt.textContent = '♥';
      hrt.style.left = (40 + Math.random() * 50) + 'px';
      hrt.style.animationDelay = (i * 0.12) + 's';
      el.appendChild(hrt);
      setTimeout(function (h) { return function () { h.remove(); }; }(hrt), 1400);
    }
    var lines = PET_LINES[0][1];
    PET_LINES.forEach(function (p) { if (S.fr >= p[0]) lines = p[1]; });
    say(pick(lines) + '  ♥ ' + S.fr);
    if (S.fr % 25 === 0 && window.fxToast) window.fxToast('ความสนิทกับ RAYQUAZA เพิ่มขึ้น! ♥ ' + S.fr, 'success');
    void e;
  }
  function drag() {
    var sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      down = true; moved = false;
      sx = e.clientX; sy = e.clientY;
      var r = el.getBoundingClientRect(); ox = r.left; oy = r.top;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) { moved = true; el.classList.add('is-drag'); }
      if (moved) { el.style.left = (ox + dx) + 'px'; el.style.top = (oy + dy) + 'px'; }
    });
    el.addEventListener('pointerup', function (e) {
      if (!down) return;
      down = false;
      el.classList.remove('is-drag');
      if (moved) { var r = el.getBoundingClientRect(); S.x = Math.round(r.left); S.y = Math.round(r.top); save(); place(); }
      else pet(e);
    });
  }

  /* ---------- บินวนรอบจอ (ภารกิจสำเร็จ) ---------- */
  function flyAround() {
    if (!visible() || !el.animate) return;
    var r = el.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
    var hx = r.left, hy = r.top;
    var pts = [[0, 0], [W * 0.3 - hx, H * 0.25 - hy], [W * 0.75 - hx, H * 0.18 - hy], [W * 0.82 - hx, H * 0.6 - hy], [W * 0.4 - hx, H * 0.7 - hy], [0, 0]];
    el.classList.add('is-fly');
    var anim = el.animate(pts.map(function (p, i) {
      return { transform: 'translate(' + p[0] + 'px,' + p[1] + 'px) rotate(' + (i % 2 ? 8 : -8) + 'deg) scale(' + (i === 0 || i === pts.length - 1 ? 1 : 1.25) + ')' };
    }), { duration: 2600, easing: 'ease-in-out' });
    anim.onfinish = function () { el.classList.remove('is-fly'); };
  }

  /* ---------- ปฏิกิริยาต่อเหตุการณ์ ---------- */
  var lastHappy = 0;
  window.addEventListener('rz:toast', function (e) {
    var d = e.detail || {};
    if (!el || d.type !== 'success' || /^เปิด /.test(d.message || '')) return;
    if (Date.now() - lastHappy < 4000) return;
    lastHappy = Date.now();
    wakeUp();
    mood('happy');
    if (Math.random() < 0.5) say(pick(['เยี่ยม!', 'ไปต่อ! ♪', 'ง่ายนิดเดียว!', 'สุดยอด!', 'เรียบร้อย!']));
  });
  window.addEventListener('rz:celebrate', function () { wakeUp(); say('เย้! ภารกิจสำเร็จ!!'); flyAround(); });
  window.addEventListener('rz:levelup', function (e) { wakeUp(); mood('glow', 2500); say('เลเวลอัป! ตอนนี้ Lv.' + ((e.detail && e.detail.lv) || '?') + ' แล้ว!'); });
  window.addEventListener('rz:shiny', function () { say('เห็นไหม! ตัวสีพิเศษบินผ่านไปแล้ว ✨'); });
  // กล่องแจ้งข้อผิดพลาด (alert) โผล่ = คำราม + จอสั่น
  new MutationObserver(function (list) {
    for (var i = 0; i < list.length; i++) {
      for (var j = 0; j < list[i].addedNodes.length; j++) {
        var n = list[i].addedNodes[j];
        if (n.nodeType === 1 && n.classList.contains('rz-alert') && !n.classList.contains('rz-ask') && el && visible()) {
          wakeUp();
          mood('angry', 1000);
          say(pick(['กร๊าวว! มีอะไรผิดปกติ!', 'แง่ง! ลองดูข้อความนี้ก่อนนะ', 'อุ๊ย! ติดปัญหานิดหน่อย']));
          document.body.classList.remove('rz-quake'); void document.body.offsetWidth; document.body.classList.add('rz-quake');
          setTimeout(function () { document.body.classList.remove('rz-quake'); }, 900);
        }
      }
    }
  }).observe(document.body, { childList: true });

  /* ---------- พูดแนะนำเป็นระยะ ---------- */
  function tip() {
    if (!el || !visible() || state === 'sleep' || document.querySelector('.rz-tc-ov, .rz-alert, .rz-battle, .rz-dex-ov')) return;
    var h = new Date().getHours(), T = window.RZTRAINER ? window.RZTRAINER.state() : null;
    var c = [];
    if (T && T.today && T.today.compare === 0 && h >= 10 && h < 17) c.push('วันนี้ยังไม่ได้ตรวจ ORDER กับ Stock เลยนะ!');
    if (h === 12) c.push('เที่ยงแล้ว พักกินข้าวด้วยนะ 🍱');
    if (h >= 17 && h < 18) c.push('ใกล้เลิกงานแล้ว สู้อีกนิด!');
    if (h >= 21) c.push('ดึกแล้วนะ อย่าลืมพักผ่อน 🌙');
    c.push('ดับเบิลคลิก SKU ในตาราง = เปิด Pokédex!', 'กด T ดูบัตรเทรนเนอร์ได้นะ', 'กด ? ดูคีย์ลัดทั้งหมด', 'ลองพิมพ์ rayquaza ดูสิ… ✨', 'ลากเราไปวางตรงไหนก็ได้นะ', 'ดื่มน้ำด้วยนะ 💧');
    if (window.RZWORLD) c.push('วันนี้อากาศ' + ({ clear: 'แจ่มใส', rain: 'ฝนตก ☔', sun: 'แดดแรง ☀️', delta: 'มีลมกรด Delta Stream 🌪️', snow: 'หิมะตก ❄️', fog: 'มีหมอก 🌫️' }[window.RZWORLD.current()] || ''));
    say(pick(c));
  }
  setInterval(tip, 8 * 60 * 1000 + Math.random() * 4 * 60 * 1000);

  /* ---------- ปุ่มเปิด/ปิดในเมนู ✦ ---------- */
  function addToggle() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('rzBuddyToggle')) return;
    btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'rzBuddyToggle'; btn.className = 'rz-fx-toggle rz-sound-toggle';
    btn.addEventListener('click', function () {
      S.on = !S.on; save(); sync();
      if (S.on) { mood('happy'); say('กลับมาแล้ว! ♪'); }
    });
    bar.appendChild(btn);
  }

  function init() {
    build();
    addToggle();
    sync();
    window.addEventListener('pointermove', onMove, { passive: true });
    ['pointerdown', 'keydown', 'wheel'].forEach(function (ev) { window.addEventListener(ev, function () { lastInput = Date.now(); if (state === 'sleep') wakeUp(); }, { passive: true, capture: true }); });
    window.addEventListener('resize', place, { passive: true });
    // เปลี่ยนโหมด/เปิดปิด FX แล้วอัปเดตตาม
    new MutationObserver(function () { paintSprite(); sync(); }).observe(root, { attributes: true, attributeFilter: ['class', 'data-prod-theme'] });
    setTimeout(function () { if (visible()) say(pick(['สวัสดี! เราจะอยู่ตรงนี้คอยช่วยนะ', 'พร้อมลุยงานวันนี้!', 'คลิกเราเพื่อลูบหัวได้นะ ♪'])); }, 6500);
    window.RZBUDDY = { say: say, mood: mood, fly: flyAround };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
