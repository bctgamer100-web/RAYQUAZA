// RAYQUAZA TERRITORY — หน้า RZ Plan เป็น "ถิ่นของสองตำนาน" (คู่กับ css/rz-territory.css)
//  ใบสั่งซื้อล่วงหน้า + สินค้าขายดี ABC = ถิ่น PRIMAL GROUDON (ลาวา · แดดแผดเผา Desolate Land · เถ้าถ่านลอย)
//  ประวัติเคลื่อนไหวสต๊อก + ตำแหน่งไม่เคลื่อนไหว = ถิ่น PRIMAL KYOGRE (ทะเลลึก · ฝนกระหน่ำ Primordial Sea · ฟองอากาศ)
//  - เข้าถิ่น = ฉากสั้น (สัญลักษณ์ α / Ω + ร่าง Primal คำราม) · สลับจากถิ่นหนึ่งไปอีกถิ่นติดกัน = RAYQUAZA บินมาหยุดศึก
//  - ระหว่างอยู่ในถิ่น: สีธีม แบนเนอร์ ท้องฟ้า 3D สภาพอากาศ และเพลง (ถ้าเปิดเพลง) เปลี่ยนตามเจ้าถิ่น · ออกจาก RZ Plan = คืนค่าเดิม
//  ภาพ: img/primal-groudon.png, img/primal-kyogre.png (ผู้ใช้จัดหามาเอง)
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on') && !reduce; }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function sfx(n) { if (window.RZPOKE) window.RZPOKE.sfx(n); }

  var MAP = { purchase: 'groudon', best: 'groudon', stockin: 'kyogre', idle: 'kyogre' };
  var LAND = {
    groudon: { name: 'PRIMAL GROUDON', th: 'ผืนดินแผดเผา', sym: 'α', img: 'img/primal-groudon.png?v=1', face: 1, weather: 'sun' },
    kyogre: { name: 'PRIMAL KYOGRE', th: 'มหาสมุทรดึกดำบรรพ์', sym: 'Ω', img: 'img/primal-kyogre.png?v=1', face: -1, weather: 'rain' }
  };
  var cur = '', prevWeather = null, lastLand = '';

  /* ---------- หาว่าตอนนี้อยู่หน้าไหน ---------- */
  function currentLand() {
    var sec = document.getElementById('sunTool');
    if (!sec || !sec.classList.contains('active')) return '';
    var t = document.querySelector('.tab.active[data-sun-mode]');
    return t ? MAP[t.getAttribute('data-sun-mode')] || '' : '';
  }
  function sync(fromClick) {
    var want = currentLand();
    if (want === cur) return;
    var from = cur;
    cur = want;
    if (want) {
      root.setAttribute('data-rz-land', want);
      if (window.RZWORLD) {
        if (prevWeather === null) prevWeather = window.RZWORLD.current();
        window.RZWORLD.weather(LAND[want].weather, false, true);
      }
      startParticles(want);
      if ((fromClick || Date.now() - clickedAt < 1500) && fxOn() && !root.classList.contains('rz-focus')) entry(want, from);
      lastLand = want;
    } else {
      root.removeAttribute('data-rz-land');
      stopParticles();
      if (window.RZWORLD && prevWeather !== null) window.RZWORLD.weather(prevWeather, false, true);
      prevWeather = null;
    }
  }

  /* ---------- ฉากเข้าถิ่น ---------- */
  function entry(land, from) {
    if (document.querySelector('.rz-lock, .rz-battle, .rz-meteor')) return;
    var L = LAND[land], truce = from && from !== land;
    var ov = el('div', 'rz-land-in is-' + land,
      '<div class="rz-li-bg"></div><div class="rz-li-sym">' + L.sym + '</div>' +
      '<img class="rz-li-mon' + (L.face < 0 ? ' is-face-l' : '') + '" alt="" src="' + L.img + '">' +
      '<div class="rz-li-title"><small>' + (truce ? '⚡ RAYQUAZA มาหยุดศึก! · ' : '') + 'เข้าสู่ถิ่นของ</small><b>' + L.name + '</b><span>' + L.th + '</span></div>');
    document.body.appendChild(ov);
    sfx('roar');
    if (land === 'groudon') { document.body.classList.remove('rz-quake'); void document.body.offsetWidth; document.body.classList.add('rz-quake'); setTimeout(function () { document.body.classList.remove('rz-quake'); }, 900); }
    else sfx('thunder');
    if (truce && window.RZFX2) setTimeout(function () { window.RZFX2.fly.force = true; window.RZFX2.fly('cross'); window.RZFX2.fly.force = false; }, 500);
    var done = function () { if (!ov.parentNode) return; ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 400); };
    ov.addEventListener('click', done);
    setTimeout(done, 1900);
    if (truce && window.RZBUDDY) setTimeout(function () { window.RZBUDDY.say('หยุดทะเลาะกันได้แล้ว! ⚡'); }, 1200);
  }

  /* ---------- ละอองประจำถิ่น: เถ้าถ่าน/ประกายไฟ (กราดอน) · ฟองอากาศ (ไคโอกา) ---------- */
  var cv = null, cx = null, parts = [], raf = 0;
  function startParticles(land) {
    if (!cv) {
      cv = el('canvas'); cv.id = 'rzLandFx'; cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv);
      cx = cv.getContext('2d');
      var rs = function () { cv.width = innerWidth; cv.height = innerHeight; };
      rs(); window.addEventListener('resize', rs);
    }
    parts = [];
    cancelAnimationFrame(raf);
    loop();
  }
  function stopParticles() { cancelAnimationFrame(raf); parts = []; if (cx) cx.clearRect(0, 0, cv.width, cv.height); }
  function loop() {
    raf = requestAnimationFrame(loop);
    var show = cur && fxOn() && !document.hidden && !root.classList.contains('rz-focus');
    cv.style.display = show ? '' : 'none';
    if (!show) return;
    var W = cv.width, H = cv.height, r = Math.random;
    cx.clearRect(0, 0, W, H);
    var target = cur === 'groudon' ? 70 : 45;
    while (parts.length < target) {
      parts.push(cur === 'groudon'
        ? { x: r() * W, y: H + 10 - (parts.length < target / 2 ? r() * H : 0), vx: (r() - 0.5) * 0.6, vy: -(0.5 + r() * 1.6), s: 1 + r() * 2.6, hot: r() < 0.55, a: 0.5 + r() * 0.5, ph: r() * 6 }
        : { x: r() * W, y: H + 20 - (parts.length < target / 2 ? r() * H : 0), vx: 0, vy: -(0.4 + r() * 1.2), s: 2 + r() * 7, a: 0.25 + r() * 0.35, ph: r() * 6 });
    }
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.ph += 0.04;
      p.x += p.vx + Math.sin(p.ph) * (cur === 'groudon' ? 0.5 : 0.7);
      p.y += p.vy;
      if (cur === 'groudon') {
        cx.globalCompositeOperation = p.hot ? 'lighter' : 'source-over';
        cx.fillStyle = p.hot ? 'rgba(255,' + (120 + (p.ph * 40 % 100) | 0) + ',40,' + p.a + ')' : 'rgba(60,40,40,' + (p.a * 0.6) + ')';
        cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 6.283); cx.fill();
      } else {
        cx.globalCompositeOperation = 'source-over';
        cx.strokeStyle = 'rgba(170,230,255,' + p.a + ')'; cx.lineWidth = 1.2;
        cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 6.283); cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,' + (p.a * 0.8) + ')';
        cx.beginPath(); cx.arc(p.x - p.s * 0.35, p.y - p.s * 0.35, p.s * 0.22, 0, 6.283); cx.fill();
      }
      if (p.y < -20) parts.splice(i, 1);
    }
    cx.globalCompositeOperation = 'source-over';
  }

  /* ---------- เฝ้าการเปลี่ยนหน้า ---------- */
  // เข้าถิ่นจากการกดแท็บเท่านั้นถึงเล่นฉาก (ตัวเฝ้าคลาสของหน้าอาจทำงานก่อน จึงจำเวลาที่กดไว้แทน)
  var clickedAt = 0;
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.tab[data-tool]')) { clickedAt = Date.now(); setTimeout(function () { sync(true); }, 60); }
  }, true);
  function init() {
    var sec = document.getElementById('sunTool');
    if (sec) new MutationObserver(function () { sync(false); }).observe(sec, { attributes: true, attributeFilter: ['class'] });
    sync(false);
    window.RZLAND = { current: function () { return cur; }, enter: function (l) { entry(l, lastLand); } };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
