// RAYQUAZA BATTLE — ตรวจ ORDER กับ Stock เสร็จ = ฉากต่อสู้แบบเกม (คู่กับ css/rz-buddy.css) · คลิกเพื่อข้าม · ปิดได้ในเมนู ✦
//  ศัตรู "Wild ORDER" HP = จำนวน SKU ทั้งหมด · RAYQUAZA ใช้ Dragon Ascent ลด HP เท่ากับ SKU ที่สต็อกพอ
//  พอครบทุก SKU = ศัตรูหมดแรง (ชนะ + ฉากภารกิจสำเร็จ) · มี SKU ขาด/ไม่มีสต็อก = "หนีไปได้!" พร้อมบอกจำนวน
//  แค่แสดงผลจากตัวเลขสรุปเดิม ไม่แตะการตรวจของระบบ
(function () {
  'use strict';

  var KEY = 'rz_battle_v1';
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  var enabled = true;
  try { enabled = localStorage.getItem(KEY) !== '0'; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function sfx(n) { if (window.RZPOKE) window.RZPOKE.sfx(n); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function active() { return enabled && fxOn() && !reduce; }

  // ศัตรู: กล่องพัสดุ ORDER ตัวร้าย (วาดเองด้วย SVG)
  var ENEMY = '<svg viewBox="0 0 160 150" aria-hidden="true">' +
    '<ellipse cx="80" cy="140" rx="58" ry="8" fill="rgba(0,0,0,.25)"/>' +
    '<path d="M22 50 80 26l58 24v66l-58 26-58-26z" fill="#c8915a" stroke="#3a2614" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M22 50l58 24 58-24M80 74v68" fill="none" stroke="#3a2614" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M22 50 8 34l56-22 16 14zM138 50l14-16-56-22-16 14z" fill="#d9a46c" stroke="#3a2614" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M51 38l58 24" stroke="#e8d27a" stroke-width="9" opacity=".85"/>' +
    '<path d="M34 76l14 8M66 88l-14-4" stroke="#3a2614" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="44" cy="92" r="7" fill="#fff" stroke="#3a2614" stroke-width="3"/><circle cx="46" cy="93" r="3.5" fill="#c0201a"/>' +
    '<circle cx="64" cy="100" r="7" fill="#fff" stroke="#3a2614" stroke-width="3"/><circle cx="66" cy="101" r="3.5" fill="#c0201a"/>' +
    '<path d="M38 116q14-8 30 4" fill="none" stroke="#3a2614" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M42 113l3 5 4-4 4 5 4-4 4 5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<text x="110" y="104" text-anchor="middle" font-family="Chakra Petch,sans-serif" font-weight="700" font-size="15" fill="#3a2614" transform="translate(110 104) skewY(-22) translate(-110 -104)">ORDER</text>' +
    '</svg>';

  var running = null;
  function battle(d) {
    if (running || !active()) return;
    var total = d.total, ok = d.ok, sh = d.short, none = d.none;
    var all = ok === total;
    var T = window.RZTRAINER ? window.RZTRAINER.state() : null;
    var lvP = 1;
    try { var e0 = T.exp, lv = 1; while (lv < 100 && e0 >= 40 + lv * 20) { e0 -= 40 + lv * 20; lv++; } lvP = lv; } catch (e) { /* ข้าม */ }
    var lvE = Math.max(2, Math.min(100, Math.ceil(total / 10)));
    var exp = 15 + Math.min(35, Math.round(total / 40)) + (all ? 10 : 0);
    var spr = isDay() ? ['img/rayquaza-mega.png?v=1', -1] : ['img/rayquaza-shiny.png?v=2', 1];

    var ov = document.createElement('div');
    ov.className = 'rz-battle' + (isDay() ? ' is-day' : '');
    ov.innerHTML =
      '<div class="rz-bt-bars"></div>' +
      '<div class="rz-bt-field">' +
      '<div class="rz-bt-foe"><div class="rz-bt-pad"></div><div class="rz-bt-foe-mon">' + ENEMY + '</div></div>' +
      '<div class="rz-bt-me"><div class="rz-bt-pad"></div><img class="rz-bt-me-mon" alt="" draggable="false"></div>' +
      '<div class="rz-bt-info rz-bt-info-foe"><b>Wild ORDER <small>×' + fmt(total) + ' SKU</small></b><span class="rz-bt-lv">Lv.' + lvE + '</span>' +
      '<div class="rz-bt-hp"><span>HP</span><div class="rz-bt-track"><i class="rz-bt-fill foe"></i></div></div></div>' +
      '<div class="rz-bt-info rz-bt-info-me"><b>RAYQUAZA</b><span class="rz-bt-lv">Lv.' + lvP + '</span>' +
      '<div class="rz-bt-hp"><span>HP</span><div class="rz-bt-track"><i class="rz-bt-fill" style="width:100%"></i></div></div>' +
      '<div class="rz-bt-num">' + fmt(total) + ' / ' + fmt(total) + '</div><div class="rz-bt-exp"><i></i></div></div>' +
      '<div class="rz-bt-beam"></div><div class="rz-bt-flash"></div>' +
      '</div>' +
      '<div class="rz-bt-dlg"><span class="rz-bt-text"></span><span class="rz-dlg-next">▼</span></div>' +
      '<div class="rz-bt-skip">คลิกเพื่อข้าม</div>';
    var me = ov.querySelector('.rz-bt-me-mon');
    me.src = spr[0];
    if (spr[1] < 0) me.classList.add('is-flip'); // ให้หันขวาเข้าหาศัตรู
    document.body.appendChild(ov);
    running = ov;

    var text = ov.querySelector('.rz-bt-text');
    var foeFill = ov.querySelector('.rz-bt-fill.foe');
    foeFill.style.width = '100%';
    var timers = [];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    function line(s) {
      text.textContent = '';
      var i = 0;
      var id = setInterval(function () { i = Math.min(s.length, i + 2); text.textContent = s.slice(0, i); if (i % 4 === 0) sfx('tick'); if (i >= s.length) clearInterval(id); }, 24);
      timers.push(id);
    }
    function hpColor(el, pct) { el.classList.toggle('mid', pct <= 50 && pct > 20); el.classList.toggle('low', pct <= 20); }
    var left = total - ok, leftPct = total ? left / total * 100 : 0;

    at(150, function () { ov.classList.add('is-in'); line('Wild ORDER ×' + fmt(total) + ' SKU ปรากฏตัว!'); sfx('roar'); });
    at(1500, function () { line('ไปเลย RAYQUAZA!'); ov.classList.add('is-go'); });
    at(2300, function () { line('RAYQUAZA ใช้ Dragon Ascent!'); });
    at(2900, function () {
      ov.classList.add('is-beam'); sfx('thunder');
      var A = window.RZFX; if (A && A.strike) A.strike();
    });
    at(3250, function () {
      ov.classList.add('is-hit');
      foeFill.style.width = leftPct.toFixed(1) + '%';
      hpColor(foeFill, leftPct);
    });
    at(4300, function () {
      ov.classList.remove('is-beam');
      var r = total ? ok / total : 0;
      line(r >= 0.999 ? 'ได้ผลดีมาก! ตรวจครบทุก SKU!' : r >= 0.7 ? 'ได้ผลดีมาก! สต็อกพอ ' + fmt(ok) + ' SKU' : r >= 0.3 ? 'ได้ผล! สต็อกพอ ' + fmt(ok) + ' SKU' : 'ได้ผลไม่ค่อยดี… สต็อกพอแค่ ' + fmt(ok) + ' SKU');
    });
    at(5400, function () {
      if (all) { ov.classList.add('is-faint'); line('Wild ORDER หมดแรง! สต็อกพอครบทุก SKU!'); sfx('ok'); }
      else {
        ov.classList.add('is-flee');
        line('SKU ' + [sh ? 'ขาด ' + fmt(sh) : '', none ? 'ไม่มีสต็อก ' + fmt(none) : ''].filter(Boolean).join(' · ') + ' หนีไปได้!');
        sfx('err');
      }
    });
    at(6800, function () { line('RAYQUAZA ได้รับ ' + exp + ' EXP!'); ov.classList.add('is-exp'); sfx('ok'); });
    at(8200, finish);

    function finish() {
      if (!running) return;
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
      running = null;
      ov.classList.add('is-out');
      setTimeout(function () { ov.remove(); }, 450);
      if (all && window.RZPOKE) setTimeout(function () { window.RZPOKE.celebrate('ภารกิจสำเร็จ!', 'สต็อกพอครบทั้ง ' + fmt(total) + ' SKU'); }, 350);
    }
    ov.addEventListener('click', finish);
  }

  window.addEventListener('rz:compare', function (e) { if (e.detail && e.detail.total) battle(e.detail); });

  /* ---------- ปุ่มเปิด/ปิดในเมนู ✦ ---------- */
  function addToggle() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('rzBattleToggle')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'rzBattleToggle'; b.className = 'rz-fx-toggle rz-sound-toggle';
    var paint = function () { b.textContent = '⚔️'; b.setAttribute('aria-pressed', String(enabled)); b.classList.toggle('is-off', !enabled); };
    b.addEventListener('click', function () { enabled = !enabled; try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ข้าม */ } paint(); });
    paint();
    bar.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addToggle); else addToggle();
  window.RZBATTLE = { enabled: active, run: battle };
})();
