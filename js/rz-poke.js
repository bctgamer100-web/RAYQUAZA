// RAYQUAZA POKé — ตกแต่งธีมเกมโปเกมอน (คู่กับ css/rz-poke.css)
//  1) กล่องข้อความแบบเกม: แทน fxToast และ alert() — ตัวหนังสือพิมพ์ทีละตัว + ▼ กะพริบ
//  2) หลอด HP: สรุปผลหน้า ตรวจ ORDER กับ Stock (HP = สัดส่วน SKU ที่สต็อกพอ)
//  3) ฉากเปิดแอปด้วย MASTER BALL (ครั้งแรกของแท็บ/เซสชัน แทนฉากเปิดตัวเดิม)
//  4) หน้าว่างมีเงา RAYQUAZA หลับ (CSS)
//  5) ป้ายธาตุ: DRAGON/FLYING ข้างโลโก้ + ช่องสถานะในตารางผลตรวจ (พอ/ขาด/ไม่มี)
//  6) แถบเลื่อน/สีไฮไลต์/เมาส์ Master Ball (CSS)
//  7) ฉลองภารกิจสำเร็จ: ตรวจแล้วสต็อกพอทุกรายการ / ปริ้นเสร็จ
//  8) สลับ กลางวัน/ไชนี่ ตามเวลาจริง (ปุ่ม ⏱ อัตโนมัติ: 06:00–17:59 = กลางวัน)
//  9) เสียงประกอบ สร้างด้วย Web Audio (ไม่มีไฟล์เสียง) ปิดไว้เป็นค่าเริ่มต้น กดปุ่ม 🔇/🔊 บนแถบนำทาง
// ไม่แตะตรรกะของระบบ: ข้อความที่แสดงยังเป็นข้อความเดิมของระบบ (เพิ่มแค่คำพูดประกอบ)
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ }
    return null;
  }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }

  // ฉากเปิดตัวเดิมของ rz-fx.js ถูกแทนด้วยฉาก Master Ball (อ่านค่าก่อน rz-fx.js จะบันทึกว่าเห็นแล้ว)
  var introSeen = false;
  try { introSeen = sessionStorage.getItem('rz_intro') === '1'; } catch (e) { /* ข้าม */ }
  window.RZ_CUSTOM_INTRO = true;

  /* ================= ระดับเสียง (ปรับในศูนย์ตั้งค่า ⚙) ================= */
  // window.RZVOL.bgm() / .sfx() = 0–1 (ค่าเริ่ม 0.7) · .out(ctx) = ช่องออกเสียงประกอบที่คุมระดับแล้ว · เปลี่ยนค่า = เหตุการณ์ rz:volume
  function volOf(k) { var v = parseFloat(ls(k)); return isNaN(v) ? 0.7 : Math.max(0, Math.min(1, v / 100)); }
  window.RZVOL = {
    bgm: function () { return volOf('rz_vol_bgm'); },
    sfx: function () { return volOf('rz_vol_sfx'); },
    out: function (a) {
      if (!a._rzOut) { a._rzOut = a.createGain(); a._rzOut.connect(a.destination); }
      a._rzOut.gain.value = volOf('rz_vol_sfx') / 0.7; // 70% = ดังเท่าเดิม
      return a._rzOut;
    }
  };

  /* ================= 9) เสียงประกอบ ================= */
  var SOUND_KEY = 'rz_sound_v1';
  var soundOn = ls(SOUND_KEY) === '1';
  var actx = null, noiseBuf = null;
  function ac() {
    if (!soundOn) return null;
    if (!actx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      actx = new C();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, dur, type, vol, when, slideTo) {
    var a = ac(); if (!a) return;
    var t = a.currentTime + (when || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(window.RZVOL.out(a));
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, cutoff, when, sweepTo) {
    var a = ac(); if (!a) return;
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var t = a.currentTime + (when || 0);
    var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf;
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff || 500, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(window.RZVOL.out(a));
    s.start(t); s.stop(t + dur);
  }
  var SFX = {
    click: function () { tone(660, 0.05, 'square', 0.025, 0, 990); },
    tick: function () { tone(1250, 0.018, 'square', 0.012); },
    ok: function () { tone(1047, 0.07, 'square', 0.04); tone(1319, 0.07, 'square', 0.04, 0.07); tone(1568, 0.12, 'square', 0.04, 0.14); },
    err: function () { tone(330, 0.12, 'square', 0.05); tone(247, 0.2, 'square', 0.05, 0.12); },
    thunder: function () { noise(1.4, 0.28, 900, 0, 120); noise(0.25, 0.18, 3000, 0, 400); },
    shake: function () { tone(180, 0.06, 'triangle', 0.08); noise(0.08, 0.08, 1200); },
    open: function () { noise(0.6, 0.18, 400, 0, 6000); tone(300, 0.5, 'sawtooth', 0.04, 0, 1400); tone(1568, 0.3, 'triangle', 0.05, 0.45); },
    roar: function () { tone(140, 0.7, 'sawtooth', 0.06, 0, 70); noise(0.8, 0.12, 700, 0, 200); },
    fanfare: function () {
      var n = [784, 1047, 1319, 1568, 1319, 1568, 2093];
      var at = [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.7];
      for (var i = 0; i < n.length; i++) tone(n[i], i === n.length - 1 ? 0.45 : 0.1, 'square', 0.04, at[i]);
      tone(523, 0.9, 'triangle', 0.05, 0.7);
    }
  };
  function sfx(name) { if (soundOn && SFX[name]) { try { SFX[name](); } catch (e) { /* ข้าม */ } } }

  /* ================= 1) กล่องข้อความแบบเกม ================= */
  var dlgWrap = null;
  var FLAVOR = ['ได้ผลดีมาก!', 'RAYQUAZA ดีใจมาก!', 'พลังมังกรเต็มเปี่ยม!', 'สำเร็จอย่างสวยงาม!', 'ยอดเยี่ยมไปเลย!'];
  function typeInto(node, text, done) {
    var i = 0, step = Math.max(1, Math.ceil(text.length / 40));
    if (reduce || !fxOn()) { node.textContent = text; if (done) done(); return function () {}; }
    var id = setInterval(function () {
      i = Math.min(text.length, i + step);
      node.textContent = text.slice(0, i);
      if (i % 3 === 0) sfx('tick');
      if (i >= text.length) { clearInterval(id); if (done) done(); }
    }, 22);
    return function () { clearInterval(id); node.textContent = text; if (done) done(); };
  }
  function pokeToast(message, type) {
    message = String(message == null ? '' : message);
    try { window.dispatchEvent(new CustomEvent('rz:toast', { detail: { message: message, type: type || '' } })); } catch (e) { /* ข้าม */ }
    if (!dlgWrap) { dlgWrap = el('div', 'rz-dlg-wrap'); document.body.appendChild(dlgWrap); }
    while (dlgWrap.children.length >= 3) dlgWrap.firstChild.remove();
    var quick = /^เปิด /.test(message);
    var box = el('div', 'rz-dlg' + (type === 'success' ? ' is-ok' : '') + (quick ? ' is-quick' : ''));
    var txt = el('div', 'rz-dlg-text');
    box.appendChild(el('span', 'rz-dlg-ball'));
    box.appendChild(txt);
    var sub = null;
    if (type === 'success' && !quick && Math.random() < 0.6) {
      sub = el('div', 'rz-dlg-sub');
      box.appendChild(sub);
    }
    box.appendChild(el('span', 'rz-dlg-next', '▼'));
    dlgWrap.appendChild(box);
    var shown = quick ? 'RAYQUAZA บินไปที่ ' + message.slice(5) + '!' : message;
    if (type === 'success' && !quick) sfx('ok'); else if (!quick) sfx('click');
    var finish = typeInto(txt, shown, function () {
      if (sub) sub.textContent = FLAVOR[Math.floor(Math.random() * FLAVOR.length)];
      box.classList.add('is-done');
    });
    var close = function () { finish(); box.classList.add('is-out'); setTimeout(function () { box.remove(); }, 260); };
    box.addEventListener('click', close);
    setTimeout(close, (quick ? 1500 : 2800) + Math.min(1000, shown.length * 22));
    if (type === 'success' && /ปริ้น|พิมพ์/.test(message)) celebrate('ปริ้นเสร็จแล้ว!', 'ส่งงานถึงมือทีมเรียบร้อย');
  }

  // alert(): กล่องข้อความใหญ่กลางล่าง ต้องกดรับทราบ (คลิก / Enter / Space / Esc)
  var alertQ = [], alertOpen = false;
  function pokeAlert(msg) {
    alertQ.push(String(msg == null ? '' : msg));
    if (!alertOpen) nextAlert();
  }
  function nextAlert() {
    var msg = alertQ.shift();
    if (msg === undefined) { alertOpen = false; return; }
    alertOpen = true;
    var ov = el('div', 'rz-alert');
    var box = el('div', 'rz-dlg rz-dlg-big');
    var txt = el('div', 'rz-dlg-text');
    box.appendChild(el('span', 'rz-dlg-ball'));
    box.appendChild(txt);
    box.appendChild(el('span', 'rz-dlg-next', '▼'));
    box.appendChild(el('span', 'rz-dlg-hint', 'กดเพื่อรับทราบ'));
    ov.appendChild(box);
    document.body.appendChild(ov);
    sfx('err');
    var typing = true;
    var finish = typeInto(txt, msg, function () { typing = false; box.classList.add('is-done'); });
    var closed = false;
    function close() {
      if (typing) { finish(); return; } // กดครั้งแรกระหว่างพิมพ์ = แสดงข้อความเต็ม
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      ov.classList.add('is-out');
      setTimeout(function () { ov.remove(); nextAlert(); }, 200);
    }
    function onKey(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    }
    ov.addEventListener('click', close);
    document.addEventListener('keydown', onKey, true);
  }

  /* ================= 2) หลอด HP ================= */
  var hp = null, hpSig = '';
  function num(id) {
    var x = document.getElementById(id);
    if (!x) return 0;
    var v = x._rzV !== undefined && x._rzV !== null ? x._rzV : parseInt(String(x.textContent).replace(/,/g, ''), 10);
    return isNaN(v) ? 0 : v;
  }
  function buildHp() {
    var qs = document.getElementById('compareQuickStatus');
    if (!qs || hp) return;
    hp = el('div', 'rz-hp',
      '<div class="rz-hp-head"><b>STOCK</b><span class="rz-hp-types"><i class="rz-type t-grass">พอ</i><i class="rz-type t-electric">ขาด</i><i class="rz-type t-fire">ไม่มี</i></span><span class="rz-hp-lv">Lv.<b>0</b></span></div>' +
      '<div class="rz-hp-row"><span class="rz-hp-tag">HP</span><div class="rz-hp-track"><i class="rz-hp-fill"></i></div></div>' +
      '<div class="rz-hp-foot"><span class="rz-hp-mix"><i class="m-ok"></i><i class="m-short"></i><i class="m-none"></i></span><span class="rz-hp-num">0 / 0</span></div>');
    qs.parentNode.insertBefore(hp, qs);
    // แสดง/ซ่อนตามแถบสรุปเดิมของระบบ (ซ่อนอยู่จนกว่าจะตรวจเสร็จ)
    new MutationObserver(scheduleHp).observe(qs, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
  }
  function updateHp() {
    buildHp();
    if (!hp) return;
    var total = num('compareQuickTotal'), ok = num('compareQuickOk'), sh = num('compareQuickShort'), none = num('compareQuickNone');
    var qs = document.getElementById('compareQuickStatus');
    hp.style.display = total > 0 && qs && getComputedStyle(qs).display !== 'none' ? '' : 'none';
    if (!total) { hpSig = ''; return; }
    var pct = ok / total * 100;
    var fill = hp.querySelector('.rz-hp-fill');
    fill.style.width = pct.toFixed(1) + '%';
    hp.classList.toggle('hp-mid', pct <= 50 && pct > 20);
    hp.classList.toggle('hp-low', pct <= 20);
    hp.querySelector('.rz-hp-lv b').textContent = total.toLocaleString('en-US');
    hp.querySelector('.rz-hp-num').textContent = ok.toLocaleString('en-US') + ' / ' + total.toLocaleString('en-US');
    hp.querySelector('.m-ok').style.flexGrow = ok;
    hp.querySelector('.m-short').style.flexGrow = sh;
    hp.querySelector('.m-none').style.flexGrow = none;
    // ฉลองเมื่อผลตรวจชุดใหม่ สต็อกพอทุกรายการ
    var sig = total + '/' + ok + '/' + sh + '/' + none;
    if (sig !== hpSig) {
      hpSig = sig;
      try { window.dispatchEvent(new CustomEvent('rz:compare', { detail: { total: total, ok: ok, short: sh, none: none } })); } catch (e) { /* ข้าม */ }
      if (ok === total && sh === 0 && none === 0 && !(window.RZBATTLE && window.RZBATTLE.enabled())) celebrate('ภารกิจสำเร็จ!', 'สต็อกพอครบทั้ง ' + total.toLocaleString('en-US') + ' SKU');
    }
  }
  var hpTimer = 0;
  function scheduleHp() { clearTimeout(hpTimer); hpTimer = setTimeout(updateHp, 950); }
   // รอตัวเลข HUD นับเสร็จ

  /* ================= 5) ป้ายธาตุ ================= */
  function addBrandTypes() {
    var h1 = document.querySelector('.shell > .top:not(.side-right) h1');
    if (!h1 || h1.querySelector('.rz-brand-types')) return;
    h1.appendChild(el('span', 'rz-brand-types', '<i class="rz-type t-dragon">DRAGON</i><i class="rz-type t-flying">FLYING</i>'));
  }
  var STATUS_TYPE = [['✅', 'GRASS', 't-grass'], ['⚠️', 'ELECTRIC', 't-electric'], ['❌', 'FIRE', 't-fire']];
  var typeTimer = 0;
  function tagStatusCells() {
    typeTimer = 0;
    var scope = document.getElementById('compareTool');
    if (!scope) return;
    var tds = scope.querySelectorAll('td:not([data-rz-type])');
    for (var i = 0; i < tds.length; i++) {
      var t = tds[i].textContent;
      for (var k = 0; k < STATUS_TYPE.length; k++) {
        if (t.indexOf(STATUS_TYPE[k][0]) === 0) {
          tds[i].setAttribute('data-rz-type', STATUS_TYPE[k][1]);
          tds[i].classList.add('rz-st', STATUS_TYPE[k][2]);
          break;
        }
      }
    }
  }

  /* ================= 7) ฉลองภารกิจสำเร็จ ================= */
  var lastCelebrate = 0;
  function celebrate(title, sub) {
    var now = Date.now();
    if (now - lastCelebrate < 4000 || reduce || !fxOn()) return;
    lastCelebrate = now;
    var ov = el('div', 'rz-win', '<div class="rz-win-rays"></div><div class="rz-win-card"><small>MISSION COMPLETE</small><b></b><span></span></div>');
    ov.querySelector('b').textContent = title;
    ov.querySelector('span').textContent = sub || '';
    var colors = ['var(--rz-ribbon-a)', 'var(--rz-ribbon-b)', 'var(--rz-trim)', '#ec5fa6', '#8e44ad', '#ffffff'];
    for (var i = 0; i < 70; i++) {
      var c = el('i', 'rz-confetti');
      c.style.left = (Math.random() * 100) + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.6) + 's';
      c.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
      c.style.setProperty('--rz-drift', ((Math.random() - 0.5) * 220) + 'px');
      c.style.setProperty('--rz-spin', ((Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 720)) + 'deg');
      ov.appendChild(c);
    }
    document.body.appendChild(ov);
    try { window.dispatchEvent(new CustomEvent('rz:celebrate')); } catch (e) { /* ข้าม */ }
    if (!(window.RZWORLD && window.RZWORLD.bgmOn())) sfx('fanfare'); // เปิดเพลงอยู่: ใช้เพลงชัยชนะแทน
    var A = window.RZFX;
    if (A && A.burst) [0, 250, 500].forEach(function (ms, j) {
      setTimeout(function () { A.burst(window.innerWidth * (0.3 + j * 0.2), window.innerHeight * 0.45); }, ms);
    });
    setTimeout(function () { ov.classList.add('is-out'); }, 2600);
    setTimeout(function () { ov.remove(); }, 3100);
  }

  /* ================= 3) ฉากเปิดแอป MASTER BALL ================= */
  function masterBallIntro() {
    var spr = isDay() ? 'img/rayquaza-mega.png?v=1' : 'img/rayquaza-shiny.png?v=2';
    var ov = el('div', 'rz-ball-intro' + (isDay() ? ' is-day' : ' is-night'),
      '<div class="rz-ball-flash"></div>' +
      '<div class="rz-ball-mon"><img alt="" draggable="false"></div>' +
      '<div class="rz-ball"><div class="rz-ball-in"><div class="rz-ball-top"></div><div class="rz-ball-bot"></div><div class="rz-ball-glow"></div></div></div>' +
      '<div class="rz-ball-title"><small>ไปเลย!</small><b>RAYQUAZA</b></div>' +
      '<div class="rz-ball-skip">คลิกเพื่อข้าม</div>');
    ov.querySelector('.rz-ball-mon img').src = spr;
    document.body.appendChild(ov);
    var timers = [];
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
    // จังหวะ: ตก+เด้ง → เขย่า 3 ครั้ง → ปุ่มกะพริบ → เปิด + แสงวาบ → มังกรออกมา → หายไป
    at(650, function () { sfx('shake'); });
    at(1050, function () { sfx('shake'); });
    at(1450, function () { sfx('shake'); });
    at(1850, function () { ov.classList.add('is-open'); sfx('open'); });
    at(2150, function () { sfx('roar'); var A = window.RZFX; if (A && A.strike) A.strike(); });
    at(3500, function () { ov.classList.add('is-out'); });
    at(3900, function () { ov.remove(); });
    ov.addEventListener('click', function () {
      timers.forEach(clearTimeout);
      ov.classList.add('is-out');
      setTimeout(function () { ov.remove(); }, 300);
    });
  }

  /* ================= 8) กลางวัน/ไชนี่ ตามเวลา ================= */
  var AUTO_KEY = 'rz_auto_theme_v1';
  var autoOn = ls(AUTO_KEY) === '1';
  var autoBtn = null;
  function wantTheme() {
    // เปิดสภาพอากาศจริง (rz-online.js) = ใช้เวลาพระอาทิตย์ขึ้น/ตกจริง
    var S = window.RZ_SUN, now = Date.now();
    if (S && S.rise && S.set && Math.abs(now - S.rise) < 864e5) return now >= S.rise && now < S.set ? 'light' : 'dark';
    var h = new Date().getHours(); return h >= 6 && h < 18 ? 'light' : 'dark';
  }
  function paintAuto() {
    if (!autoBtn) return;
    autoBtn.setAttribute('aria-pressed', String(autoOn));
    autoBtn.title = autoOn ? 'อัตโนมัติ: 06:00–17:59 กลางวัน · 18:00–05:59 ไชนี่ (กดเพื่อปิด)' : 'สลับโหมดตามเวลาจริงอัตโนมัติ';
  }
  function applyAuto() {
    if (!autoOn) return;
    var want = wantTheme();
    if ((want === 'light') === isDay()) return;
    var b = document.querySelector('[data-theme-choice="' + want + '"]');
    if (b) b.click(); // คลิกแบบโปรแกรม: ใช้ตัวสลับเดิมของระบบ (บันทึกค่า + ฉาก MEGA EVOLUTION)
  }
  function addAutoBtn() {
    var sw = document.querySelector('.theme-switch');
    if (!sw || sw.querySelector('.rz-auto-opt')) return;
    autoBtn = el('button', 'theme-opt rz-auto-opt', '<span class="rz-auto-ico">⏱</span>');
    autoBtn.setAttribute('aria-label', 'สลับโหมดตามเวลาอัตโนมัติ');
    autoBtn.type = 'button';
    autoBtn.addEventListener('click', function () {
      autoOn = !autoOn;
      ls(AUTO_KEY, autoOn ? '1' : '0');
      paintAuto();
      if (autoOn) { pokeToast('โหมดอัตโนมัติ: กลางวัน 06:00–17:59 · ไชนี่ 18:00–05:59', 'success'); applyAuto(); }
    });
    sw.appendChild(autoBtn);
    paintAuto();
    // เลือกโหมดเองด้วยมือ = ปิดอัตโนมัติ
    sw.addEventListener('click', function (e) {
      if (e.isTrusted && e.target.closest('[data-theme-choice]') && autoOn) { autoOn = false; ls(AUTO_KEY, '0'); paintAuto(); }
    }, true);
    setInterval(applyAuto, 30000);
  }

  /* ================= 9) ปุ่มเสียง ================= */
  function addSoundBtn() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('rzSoundToggle')) return;
    var b = el('button', 'rz-fx-toggle rz-sound-toggle');
    b.type = 'button';
    b.id = 'rzSoundToggle';
    var paint = function () {
      b.textContent = soundOn ? '🔊' : '🔇';
      b.setAttribute('aria-pressed', String(soundOn));
      b.title = soundOn ? 'ปิดเสียงประกอบ' : 'เปิดเสียงประกอบ';
    };
    b.addEventListener('click', function () {
      soundOn = !soundOn;
      ls(SOUND_KEY, soundOn ? '1' : '0');
      paint();
      if (soundOn) sfx('ok');
    });
    paint();
    var after = document.getElementById('rz3dToggle') || document.getElementById('rzFxToggle');
    bar.insertBefore(b, after ? after.nextSibling : bar.querySelector('.theme-switch'));
  }

  /* ---------- เชื่อมเข้ากับระบบ ---------- */
  function hookFx() {
    var A = window.RZFX;
    if (!A) return;
    var prev = A.onBolt;
    A.onBolt = function (x) { if (prev) prev(x); sfx('thunder'); };
  }
  function watch() {
    var mo = new MutationObserver(function (list) {
      var hpHit = false, tableHit = false;
      for (var i = 0; i < list.length; i++) {
        var t = list[i].target;
        var e = t.nodeType === 3 ? t.parentNode : t;
        if (!e || !e.closest) continue;
        if (e.closest('#compareQuickStatus')) hpHit = true;
        else if (!tableHit && e.closest('#compareTool')) tableHit = true;
      }
      if (hpHit) scheduleHp();
      if (tableHit && !typeTimer) typeTimer = setTimeout(tagStatusCells, 120);
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  // แทนที่ทันที (ก่อน DOMContentLoaded) — app.js ตั้ง fxToast ไว้แล้วตอนนี้
  window.fxToast = pokeToast;
  window.alert = pokeAlert;
  window.RZPOKE = { toast: pokeToast, alert: pokeAlert, celebrate: celebrate, sfx: sfx, intro: masterBallIntro };

  function init() {
    window.fxToast = pokeToast; // เผื่อสคริปต์อื่นตั้งทับระหว่างโหลด
    addBrandTypes();
    addAutoBtn();
    addSoundBtn();
    hookFx();
    watch();
    updateHp();
    tagStatusCells();
    applyAuto();
    // เสียงคลิกปุ่ม
    document.addEventListener('pointerdown', function (e) {
      if (soundOn && e.target.closest && e.target.closest('button, .tab, summary, a')) sfx('click');
    }, true);
    if (!introSeen && fxOn() && !reduce && !window.RZ_LOCK_ACTIVE) setTimeout(masterBallIntro, 120); // มีหน้าล็อก Master Ball แล้วไม่ต้องเล่นซ้ำ
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
