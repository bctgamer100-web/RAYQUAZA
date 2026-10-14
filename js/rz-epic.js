// RAYQUAZA EPIC — ฉากเวอร์ๆ (คู่กับ css/rz-epic.css) · ทำงานเมื่อเปิด ✦ FX · ปิดเองถ้าตั้ง "ลดการเคลื่อนไหว"
//  1) MEGA EVOLUTION: สลับ กลางวัน/ไชนี่ = หินเมก้า + วงแหวน DNA สีรุ้ง + ร่างเดิมเป็นเงาขาวแตกออก แล้วร่างใหม่ปรากฏ
//  2) METEOR CRISIS: อุกกาบาตยักษ์พุ่งใส่โลก RAYQUAZA บินขึ้นยิง Dragon Ascent ทำลาย (สุ่มวันละครั้ง · พิมพ์ comet · window.RZEPIC.meteor())
//  3) COMBO / OVERDRIVE: ทำงานสำเร็จติดๆ กัน (ห่างไม่เกิน 45 วิ) = คอมโบ x2 x3… ครบ 5 = OVERDRIVE ขอบจอลุกเป็นไฟ ครบ 10 = HYPER OVERDRIVE
//  4) เปลี่ยนหน้า: RAYQUAZA โฉบผ่านจอเป็นแถบพลังเฉียง (ปิดได้ในเมนู ✦)
//  5) การ์ดโฮโลแกรม: บัตรเทรนเนอร์ / RZ-DEX / การ์ดเลเวลอัป มีแสงรุ้งฟอยล์ตามเมาส์
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function on() { return !reduce && root.classList.contains('rz-fx-on') && !document.hidden; }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function sfx(n) { if (window.RZPOKE) window.RZPOKE.sfx(n); }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  var SPR = { light: 'img/rayquaza-mega.png?v=1', dark: 'img/rayquaza-shiny.png?v=2' };
  function busy() { return !!document.querySelector('.rz-lock, .rz-battle, .rz-ball-intro, .rz-epic-evo, .rz-meteor'); }

  /* ================= 1) MEGA EVOLUTION ================= */
  function evolve(want) {
    if (!on() || document.querySelector('.rz-epic-evo, .rz-lock')) return false;
    var from = want === 'light' ? 'dark' : 'light';
    var ov = el('div', 'rz-epic-evo is-' + want,
      '<div class="rz-evo-bg"></div>' +
      '<div class="rz-evo-dna"></div><div class="rz-evo-dna d2"></div>' +
      '<img class="rz-evo-stone" alt="" src="img/mega-stone.png?v=1">' +
      '<img class="rz-evo-old" alt="" src="' + SPR[from] + '">' +
      '<img class="rz-evo-new" alt="" src="' + SPR[want] + '">' +
      '<div class="rz-evo-shards"></div>' +
      '<div class="rz-evo-flash"></div>' +
      '<div class="rz-evo-title"><small>MEGA EVOLUTION</small><b>' + (want === 'light' ? 'MEGA RAYQUAZA' : 'SHINY MEGA RAYQUAZA') + '</b></div>');
    var sh = ov.querySelector('.rz-evo-shards');
    for (var i = 0; i < 18; i++) {
      var s = el('i');
      var a = i / 18 * 6.283;
      s.style.setProperty('--dx', (Math.cos(a) * (180 + Math.random() * 220)).toFixed(0) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * (140 + Math.random() * 200)).toFixed(0) + 'px');
      s.style.setProperty('--r', ((Math.random() - 0.5) * 720).toFixed(0) + 'deg');
      sh.appendChild(s);
    }
    document.body.appendChild(ov);
    sfx('shake');
    setTimeout(function () { sfx('shake'); }, 450);
    setTimeout(function () { sfx('open'); if (window.RZFX) window.RZFX.strike(); }, 1150);
    setTimeout(function () { sfx('roar'); }, 1500);
    var done = function () { if (!ov.parentNode) return; ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 500); };
    ov.addEventListener('click', done);
    setTimeout(done, 3300);
    return true;
  }

  /* ================= 2) METEOR CRISIS ================= */
  function meteor() {
    if (!on() || busy()) return false;
    var spr = isDay() ? SPR.light : SPR.dark;
    var ov = el('div', 'rz-meteor',
      '<div class="rz-mt-sky"></div>' +
      '<div class="rz-mt-warn"><b>⚠ WARNING</b><span>ตรวจพบอุกกาบาตยักษ์กำลังพุ่งเข้าหาโลก!</span></div>' +
      '<div class="rz-mt-rock"><i></i></div>' +
      '<img class="rz-mt-mon" alt="" src="' + spr + '">' +
      '<div class="rz-mt-beam"></div>' +
      '<div class="rz-mt-boom"></div>' +
      '<div class="rz-mt-title"><small>METEOR DESTROYED</small><b>โลกปลอดภัยแล้ว!</b><span>RAYQUAZA ทำลายอุกกาบาตด้วย Dragon Ascent · +100 EXP</span></div>' +
      '<div class="rz-mt-skip">คลิกเพื่อข้าม</div>');
    if (spr === SPR.light) ov.querySelector('.rz-mt-mon').classList.add('is-flip');
    document.body.appendChild(ov);
    var T = [];
    function at(ms, fn) { T.push(setTimeout(fn, ms)); }
    sfx('err');
    at(600, function () { sfx('err'); });
    at(1700, function () { ov.classList.add('is-rise'); sfx('roar'); });
    at(3000, function () { ov.classList.add('is-beam'); sfx('thunder'); if (window.RZFX) window.RZFX.strike(); });
    at(3600, function () {
      ov.classList.add('is-boom');
      document.body.classList.remove('rz-quake'); void document.body.offsetWidth; document.body.classList.add('rz-quake');
      var A = window.RZFX, W = window.innerWidth, H = window.innerHeight;
      if (A && A.burst) [0, 120, 240, 360, 520].forEach(function (d, i) { setTimeout(function () { A.burst(W * (0.55 + (Math.random() - 0.5) * 0.25), H * (0.28 + (Math.random() - 0.5) * 0.2)); }, d + i); });
      sfx('thunder');
    });
    at(4300, function () { document.body.classList.remove('rz-quake'); ov.classList.add('is-win'); sfx('fanfare'); try { window.dispatchEvent(new CustomEvent('rz:celebrate')); } catch (e) { /* ข้าม */ } });
    at(4400, function () { if (window.RZTRAINER) window.RZTRAINER.gain(100, 'meteor'); });
    var done = function () {
      T.forEach(clearTimeout);
      if (!ov.parentNode) return;
      ov.classList.add('is-out');
      setTimeout(function () { ov.remove(); }, 600);
      document.body.classList.remove('rz-quake');
      ls('rz_meteor_day', new Date().toDateString());
    };
    ov.addEventListener('click', done);
    at(7600, done);
    return true;
  }
  // สุ่มวันละครั้ง: หลังเปิดแอป 3–40 นาที โอกาส 35% ต่อวัน (ไม่ขัดตอนระบบกำลังทำงาน)
  (function scheduleMeteor() {
    if (ls('rz_meteor_day') === new Date().toDateString()) return;
    if (Math.random() > 0.35) { ls('rz_meteor_day', new Date().toDateString()); return; }
    var wait = (3 + Math.random() * 37) * 60000;
    var tryRun = function () {
      if (ls('rz_meteor_auto_v1') === '0') return;                                   // ปิดอุกกาบาตสุ่มในศูนย์ตั้งค่า
      if (root.classList.contains('rz-focus')) { setTimeout(tryRun, 300000); return; } // โหมดโฟกัส: รอไว้ก่อน
      if (document.querySelector('.rz-charge.is-on:not(.is-done), .rz-tc-ov, .rz-alert') || !meteor()) { setTimeout(tryRun, 60000); }
    };
    setTimeout(tryRun, wait);
  })();
  // พิมพ์ comet (ตอนไม่ได้พิมพ์ในช่อง) — ไม่ใช้ meteor เพราะตัว m/t ชนกับปุ่มลัดเพลง/บัตรเทรนเนอร์
  var typed = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-5);
    if (typed === 'comet') { typed = ''; meteor(); }
  });

  /* ================= 3) COMBO / OVERDRIVE ================= */
  var combo = 0, comboT = 0, comboEl = null, WINDOW = 45000, lastHit = 0;
  function comboHud() {
    if (comboEl) return comboEl;
    comboEl = el('div', 'rz-combo', '<small>COMBO</small><b>×<span>0</span></b><i><em></em></i><strong></strong>');
    document.body.appendChild(comboEl);
    return comboEl;
  }
  function hit(kind) {
    if (!on() || ls('rz_combo_v1') === '0' || root.classList.contains('rz-focus')) return;
    var now = Date.now();
    if (now - lastHit < 1500) return; // กันนับซ้ำจากเหตุการณ์เดียวกันที่ส่งมาหลายทาง
    lastHit = now;
    combo++;
    clearTimeout(comboT);
    comboT = setTimeout(endCombo, WINDOW);
    if (combo < 2) return;
    var h = comboHud();
    h.querySelector('span').textContent = combo;
    var bar = h.querySelector('em');
    bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth;
    bar.style.transition = 'width ' + WINDOW + 'ms linear'; bar.style.width = '0%';
    h.classList.remove('is-pop'); void h.offsetWidth; h.classList.add('is-on', 'is-pop');
    h.classList.toggle('is-hot', combo >= 5);
    h.classList.toggle('is-hyper', combo >= 10);
    var label = combo >= 10 ? 'HYPER OVERDRIVE!' : combo >= 5 ? 'OVERDRIVE!' : combo >= 3 ? 'GREAT!' : 'NICE!';
    h.querySelector('strong').textContent = label;
    root.classList.toggle('rz-overdrive', combo >= 5);
    root.classList.toggle('rz-hyper', combo >= 10);
    sfx('ok');
    if (combo >= 3 && window.RZTRAINER) window.RZTRAINER.gain(Math.min(30, combo * 2), 'combo' + combo);
    if (combo === 5) { if (window.RZBUDDY) window.RZBUDDY.say('OVERDRIVE!! พลังมังกรล้นแล้ว 🔥'); if (window.RZFX) window.RZFX.strike(); }
    if (combo === 10 || (combo > 10 && combo % 5 === 0)) { if (window.RZFX2) window.RZFX2.fly('cross'); if (window.RZBUDDY) window.RZBUDDY.say('HYPER OVERDRIVE!!! หยุดไม่อยู่แล้ว!'); }
    void kind;
  }
  function endCombo() {
    if (combo >= 5 && window.fxToast) window.fxToast('คอมโบจบที่ ×' + combo + '! เก่งมาก 🔥', 'success');
    combo = 0;
    root.classList.remove('rz-overdrive', 'rz-hyper');
    if (comboEl) comboEl.classList.remove('is-on', 'is-hot', 'is-hyper');
  }
  window.addEventListener('rz:toast', function (e) {
    var d = e.detail || {};
    if (d.type === 'success' && !/^เปิด |^ได้รับเหรียญ|^คอมโบจบ|^สภาพอากาศ|^โหมด|^เปิดเพลง|^ยินดีต้อนรับ|^ความสนิท|^ตั้งรหัส|^ปิดการล็อก|^🎙/.test(d.message || '')) hit('toast');
  });
  window.addEventListener('rz:compare', function (e) { if (e.detail && e.detail.total) hit('compare'); });
  window.addEventListener('rz:charged', function (e) { if (e.detail && e.detail.ms > 1500) hit('job'); });

  /* ================= 4) RAYQUAZA โฉบตอนเปลี่ยนหน้า ================= */
  var SW_KEY = 'rz_swoop_v1';
  var swoopOn = ls(SW_KEY) !== '0';
  var lastSwoop = 0;
  function swoop() {
    if (!swoopOn || !on() || busy() || root.classList.contains('rz-focus') || Date.now() - lastSwoop < 700) return;
    lastSwoop = Date.now();
    var dir = Math.random() < 0.5 ? 1 : -1;
    var ov = el('div', 'rz-swoop ' + (dir > 0 ? 'to-r' : 'to-l'), '<i class="rz-sw-band"></i><i class="rz-sw-band b2"></i><img alt="" src="' + (isDay() ? SPR.light : SPR.dark) + '">');
    var img = ov.querySelector('img');
    var face = isDay() ? -1 : 1;
    if (face !== dir) img.classList.add('is-flip');
    document.body.appendChild(ov);
    setTimeout(function () { ov.remove(); }, 750);
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('.tab[data-tool]');
    if (t && e.isTrusted && !t.classList.contains('active')) swoop();
  }, true);

  /* ================= 5) การ์ดโฮโลแกรม ================= */
  var HOLO = '.rz-tc, .rz-dex, .rz-lvup-card, .rz-win-card, .rz-badge.is-on i';
  document.addEventListener('pointermove', function (e) {
    var c = e.target.closest && e.target.closest(HOLO);
    if (!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty('--hx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    c.style.setProperty('--hy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }, { passive: true });

  /* ---------- ปุ่มในเมนู ✦ (ฉากเปลี่ยนหน้า) + ปุ่มอุกกาบาต ---------- */
  function addButtons() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar) return;
    if (!document.getElementById('rzSwoopToggle')) {
      var b = el('button', 'rz-fx-toggle rz-sound-toggle');
      b.type = 'button'; b.id = 'rzSwoopToggle';
      var paint = function () { b.textContent = '💨'; b.setAttribute('aria-pressed', String(swoopOn)); b.classList.toggle('is-off', !swoopOn); };
      b.addEventListener('click', function () { swoopOn = !swoopOn; ls(SW_KEY, swoopOn ? '1' : '0'); paint(); });
      paint();
      bar.appendChild(b);
    }
    if (!document.getElementById('rzMeteorBtn')) {
      var m = el('button', 'rz-fx-toggle rz-sound-toggle');
      m.type = 'button'; m.id = 'rzMeteorBtn'; m.textContent = '☄️';
      m.addEventListener('click', function () { var dock = document.querySelector('.rz-dock'); if (dock) dock.classList.remove('is-open'); setTimeout(meteor, 150); });
      bar.appendChild(m);
    }
    // เพิ่มในหน้าต่างคีย์ลัด
    var sm = document.getElementById('ppShortcutsModal');
    if (sm && !sm.querySelector('.rz-epic-short')) {
      var r = el('div', 'pp-short-row rz-epic-short', '<span>METEOR CRISIS</span><span class="pp-key">พิมพ์ comet</span>');
      sm.appendChild(r);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButtons); else addButtons();

  window.RZEPIC = { evolve: evolve, meteor: meteor, combo: function () { return combo; }, hit: hit, swoop: swoop };
})();
