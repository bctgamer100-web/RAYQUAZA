// RAYQUAZA LOCK — ล็อกหน้าจอด้วย Master Ball (คู่กับ css/rz-lock.css)
//  - เปิดเว็บทุกครั้ง = ต้องใส่รหัสผ่าน · ถูก = Master Ball เปิดออก ปล่อย RAYQUAZA แล้วเข้าใช้งานได้ · ผิด = บอลส่ายปฏิเสธ (ผิด 5 ครั้ง พัก 30 วินาที)
//  - โหมดสลีป: ไม่ได้ใช้งานตามเวลาที่ตั้ง (ค่าเริ่มต้น 10 นาที) หรือซ่อนหน้าต่างไว้นานเกิน = RAYQUAZA หลับ + นาฬิกา → ขยับเมาส์/กดปุ่ม = ขอรหัสอีกครั้ง
//  - ตั้งค่า/เปลี่ยนรหัส/ปิดล็อก/ล็อกทันที: เมนู ✦ > 🔒 ล็อกหน้าจอ หรือกดปุ่ม L
//  - เก็บแค่ค่าแฮช (SHA-256 + salt) ไว้ในเบราว์เซอร์เครื่องนี้ · เป็นการล็อกหน้าจอกันคนอื่นใช้เครื่อง ไม่ได้เข้ารหัสข้อมูลในเครื่อง
//  ต้องโหลดก่อน rz-poke.js (ฉาก Master Ball ตอนเปิดเว็บจะใช้ของหน้าล็อกแทน)
(function () {
  'use strict';

  var KEY = 'rz_lock_v1';
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  var C = { hash: '', salt: '', sleep: 10, skip: false };
  try { var raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) for (var k in raw) C[k] = raw[k]; } catch (e) { /* ข้าม */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(C)); } catch (e) { /* ข้าม */ } }
  function sfx(n) { if (window.RZPOKE) window.RZPOKE.sfx(n); }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }

  /* ---------- แฮชรหัสผ่าน ---------- */
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function rand() { var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); return hex(a.buffer); }
  function hash(pw, salt) {
    var data = salt + ':rayquaza:' + pw;
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)).then(hex);
    }
    // สำรอง (เบราว์เซอร์ที่ไม่มี crypto.subtle): FNV-1a วนซ้ำ
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var r = 0; r < 2000; r++) for (var i = 0; i < data.length; i++) { h1 = Math.imul(h1 ^ data.charCodeAt(i), 16777619); h2 = Math.imul(h2 ^ (h1 >>> 7), 2246822507); }
    return Promise.resolve('f' + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16));
  }
  function check(pw) { return hash(pw, C.salt).then(function (h) { return h === C.hash; }); }
  function enabled() { return !!C.hash; }

  /* ---------- หน้าจอล็อก ---------- */
  var ov = null, mode = '', fails = 0, coolUntil = 0, clockT = 0;
  // mode: 'auth' ใส่รหัส · 'sleep' หลับ · 'setup' ตั้งรหัสครั้งแรก · 'reset' ลืมรหัส
  function spr() { return isDay() ? 'img/rayquaza-mega.png?v=1' : 'img/rayquaza-shiny.png?v=2'; }
  function show(m) {
    root.classList.add('rz-locked');
    if (!ov) {
      ov = el('div', 'rz-lock');
      ov.setAttribute('role', 'dialog');
      ov.setAttribute('aria-modal', 'true');
      document.body.appendChild(ov);
      document.addEventListener('keydown', guardKeys, true);
    }
    mode = m;
    ov.className = 'rz-lock is-' + m + (isDay() ? ' is-day' : '');
    if (m === 'sleep') renderSleep(); else renderAuth(m);
  }
  function hide() {
    root.classList.remove('rz-locked');
    clearInterval(clockT);
    if (!ov) return;
    var o = ov; ov = null; mode = '';
    document.removeEventListener('keydown', guardKeys, true);
    o.classList.add('is-out');
    setTimeout(function () { o.remove(); }, 650);
    lastInput = Date.now();
  }
  // ระหว่างล็อก: ปุ่มลัดของแอปใช้ไม่ได้ (ยกเว้นพิมพ์ในช่องรหัส)
  function guardKeys(e) {
    if (!ov) return;
    if (mode === 'sleep') { e.preventDefault(); e.stopPropagation(); toAuth(); return; }
    if (!ov.contains(e.target)) { e.stopPropagation(); if (e.key !== 'Tab') e.preventDefault(); var i = ov.querySelector('input'); if (i) i.focus(); }
  }

  function renderSleep() {
    ov.innerHTML =
      '<div class="rz-lock-stars"></div>' +
      '<div class="rz-lock-sleepmon"><img alt="" draggable="false"><span class="rz-lock-z">z</span><span class="rz-lock-z z2">Z</span><span class="rz-lock-z z3">z</span></div>' +
      '<div class="rz-lock-clock"><b></b><span></span></div>' +
      '<p class="rz-lock-hint">💤 โหมดสลีป — ขยับเมาส์หรือกดปุ่มใดก็ได้เพื่อปลุก</p>';
    ov.querySelector('img').src = spr();
    var paint = function () {
      if (!ov || mode !== 'sleep') return;
      var d = new Date();
      ov.querySelector('.rz-lock-clock b').textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      try { ov.querySelector('.rz-lock-clock span').textContent = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { /* ข้าม */ }
    };
    paint();
    clearInterval(clockT);
    clockT = setInterval(paint, 5000);
    var wake = function () { ov && ov.removeEventListener('pointerdown', wake); ov && ov.removeEventListener('pointermove', mv); toAuth(); };
    var sx = null, sy = null;
    var mv = function (e) { if (sx === null) { sx = e.clientX; sy = e.clientY; return; } if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 30) wake(); };
    ov.addEventListener('pointerdown', wake);
    ov.addEventListener('pointermove', mv);
  }
  function toAuth() {
    if (!ov || mode !== 'sleep') return;
    clearInterval(clockT);
    if (!enabled()) { hide(); return; }
    show('auth');
  }

  function renderAuth(m) {
    var setup = m === 'setup', reset = m === 'reset';
    ov.innerHTML =
      '<div class="rz-lock-stars"></div>' +
      '<div class="rz-lock-top"><b>RAYQUAZA</b><span>' + (setup ? 'ตั้งรหัสผ่าน Master Ball' : 'ORDER WORKSPACE · LOCKED') + '</span></div>' +
      '<div class="rz-lock-stage">' +
      '<div class="rz-lock-flash"></div>' +
      '<div class="rz-lock-mon"><img alt="" draggable="false"></div>' +
      '<div class="rz-lock-ball"><div class="rz-lock-ball-in"><i class="t"></i><i class="b"></i><span class="rz-lock-btn"></span></div></div>' +
      '</div>' +
      '<form class="rz-lock-form" autocomplete="off">' +
      '<label class="rz-lock-label"></label>' +
      '<div class="rz-lock-field"><input type="password" class="rz-lock-in" maxlength="64" autocomplete="off" spellcheck="false" aria-label="รหัสผ่าน">' +
      (setup ? '<input type="password" class="rz-lock-in2" maxlength="64" autocomplete="off" spellcheck="false" placeholder="ใส่รหัสอีกครั้ง" aria-label="ยืนยันรหัสผ่าน">' : '') +
      '<button type="submit" class="rz-lock-go"></button></div>' +
      '<p class="rz-lock-msg" role="status"></p>' +
      '<div class="rz-lock-links"></div>' +
      '</form>';
    ov.querySelector('.rz-lock-mon img').src = spr();
    var label = ov.querySelector('.rz-lock-label'), inp = ov.querySelector('.rz-lock-in'), inp2 = ov.querySelector('.rz-lock-in2');
    var go = ov.querySelector('.rz-lock-go'), msg = ov.querySelector('.rz-lock-msg'), links = ov.querySelector('.rz-lock-links');
    var ball = ov.querySelector('.rz-lock-ball');
    if (setup) {
      label.textContent = 'ตั้งรหัสผ่านสำหรับเปิดแอป (อย่างน้อย 4 ตัว)';
      inp.placeholder = 'รหัสผ่านใหม่';
      go.textContent = 'ตั้งรหัส';
      links.innerHTML = '<button type="button" class="rz-lock-link" data-a="skip">' + (enabled() ? 'ยกเลิก (ใช้รหัสเดิม)' : 'ไม่ใช้รหัสผ่าน (ตั้งทีหลังได้ที่เมนู ✦)') + '</button>';
    } else {
      label.textContent = 'ใส่รหัสผ่านเพื่อปล่อย RAYQUAZA';
      inp.placeholder = '••••';
      go.textContent = 'ปลดล็อก';
      links.innerHTML = '<button type="button" class="rz-lock-link" data-a="forgot">ลืมรหัสผ่าน?</button>';
    }
    setTimeout(function () { inp.focus(); }, 60);
    // พิมพ์แต่ละตัว = ปุ่มกลางบอลกะพริบ + บอลขยับนิดๆ
    inp.addEventListener('input', function () {
      ball.classList.remove('is-tap'); void ball.offsetWidth; ball.classList.add('is-tap');
      sfx('tick');
      msg.textContent = ''; msg.className = 'rz-lock-msg';
    });
    links.addEventListener('click', function (e) {
      var a = e.target.getAttribute('data-a');
      if (a === 'skip') { if (!enabled()) { C.skip = true; save(); } hide(); } // ตอนเปลี่ยนรหัส: ข้าม = ใช้รหัสเดิมต่อ
      if (a === 'forgot') forgot(msg, links);
    });
    ov.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = inp.value;
      if (setup) {
        if (pw.length < 4) { bad(msg, ball, 'รหัสสั้นไป ใช้อย่างน้อย 4 ตัว'); return; }
        if (pw !== inp2.value) { bad(msg, ball, 'ใส่รหัสสองช่องไม่ตรงกัน'); return; }
        C.salt = rand();
        hash(pw, C.salt).then(function (h) { C.hash = h; C.skip = false; save(); release('ตั้งรหัสผ่านแล้ว! ครั้งหน้าเปิดแอปต้องใช้รหัสนี้'); });
        return;
      }
      if (Date.now() < coolUntil) { bad(msg, ball, 'รออีก ' + Math.ceil((coolUntil - Date.now()) / 1000) + ' วินาทีแล้วลองใหม่'); return; }
      if (!pw) { bad(msg, ball, 'ใส่รหัสผ่านก่อนนะ'); return; }
      go.disabled = true;
      ball.classList.add('is-check');
      check(pw).then(function (ok) {
        setTimeout(function () {
          ball.classList.remove('is-check');
          go.disabled = false;
          if (ok) { fails = 0; release(); return; }
          fails++;
          inp.value = '';
          if (fails >= 5) { coolUntil = Date.now() + 30000; fails = 0; bad(msg, ball, 'ผิด 5 ครั้งแล้ว พักก่อน 30 วินาที'); }
          else bad(msg, ball, 'รหัสไม่ถูกต้อง — Master Ball ไม่ยอมเปิด! (' + fails + '/5)');
          inp.focus();
        }, 650); // ให้บอลเขย่าลุ้นนิดนึงก่อนเฉลย
      });
    });
  }
  function bad(msg, ball, text) {
    msg.textContent = text;
    msg.className = 'rz-lock-msg is-bad';
    ball.classList.remove('is-no'); void ball.offsetWidth; ball.classList.add('is-no');
    sfx('err');
  }
  function forgot(msg, links) {
    // ลืมรหัส: รอ 60 วินาทีแล้วล้างรหัส (กันคนแอบกดผ่านเร็วๆ) จากนั้นต้องตั้งรหัสใหม่
    links.innerHTML = '';
    var left = 60;
    msg.className = 'rz-lock-msg';
    var tick = function () {
      if (!ov) return;
      msg.textContent = 'ล้างรหัสผ่านใน ' + left + ' วินาที… (ปิด/รีเฟรชหน้า = ยกเลิก)';
      if (left-- <= 0) { C.hash = ''; C.salt = ''; save(); show('setup'); return; }
      setTimeout(tick, 1000);
    };
    tick();
  }

  // ถูกต้อง: บอลเปิด → แสงวาบ → RAYQUAZA ออกมา → เข้าใช้งาน
  function release(note) {
    if (!ov) return;
    ov.classList.add('is-open');
    sfx('open');
    setTimeout(function () { sfx('roar'); if (window.RZFX && window.RZFX.strike) window.RZFX.strike(); }, 350);
    setTimeout(function () {
      hide();
      if (note && window.fxToast) window.fxToast(note, 'success');
      if (window.RZBUDDY) window.RZBUDDY.say('ปล่อยตัวแล้ว! ไปลุยกัน ⚡');
    }, reduce ? 50 : 1700);
  }

  /* ---------- โหมดสลีป ---------- */
  var lastInput = Date.now(), hiddenAt = 0;
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (!ov) lastInput = Date.now(); }, { passive: true, capture: true });
  });
  function busy() { return !!document.querySelector('.rz-charge.is-on:not(.is-done)'); }
  setInterval(function () {
    if (ov || !C.sleep || busy()) return;
    if (Date.now() - lastInput > C.sleep * 60000) show('sleep');
  }, 5000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (!ov && C.sleep && enabled() && hiddenAt && Date.now() - hiddenAt > C.sleep * 60000) show('auth');
    hiddenAt = 0;
  });

  /* ---------- ตั้งค่า (เมนู ✦ > 🔒) ---------- */
  function settings() {
    if (document.querySelector('.rz-lock-set')) return;
    var w = el('div', 'rz-tc-ov rz-lock-set');
    var opts = [0, 1, 3, 5, 10, 15, 30, 60].map(function (m) { return '<option value="' + m + '"' + (C.sleep === m ? ' selected' : '') + '>' + (m ? m + ' นาที' : 'ไม่ใช้โหมดสลีป') + '</option>'; }).join('');
    w.innerHTML = '<div class="rz-tc rz-on" role="dialog" aria-label="ล็อกหน้าจอ"><div class="rz-tc-head"><b>MASTER BALL LOCK</b><span>' + (enabled() ? '🔒 เปิดใช้อยู่' : '🔓 ยังไม่ได้ตั้งรหัส') + '</span><button type="button" class="rz-tc-x" aria-label="ปิด">×</button></div>' +
      '<section class="rz-on-sec"><b>💤 โหมดสลีป</b><p class="rz-on-why" style="margin-left:0">ไม่ได้ใช้งานนานเท่านี้ RAYQUAZA จะหลับ ปลุกแล้ว' + (enabled() ? 'ต้องใส่รหัสใหม่' : 'ใช้งานต่อได้เลย (ยังไม่ได้ตั้งรหัส)') + ' · ระหว่างระบบกำลังทำงานจะไม่หลับ</p>' +
      '<label class="rz-on-place" style="margin-left:0">หลับเมื่อไม่ได้ใช้งาน <select class="rz-lock-sleepsel">' + opts + '</select></label></section>' +
      '<section class="rz-on-sec"><b>🔑 รหัสผ่าน</b><p class="rz-on-why" style="margin-left:0">เก็บแค่ค่าแฮชไว้ในเบราว์เซอร์เครื่องนี้ · เป็นการล็อกหน้าจอกันคนอื่นใช้เครื่อง ไม่ได้เข้ารหัสข้อมูล</p>' +
      '<div class="rz-lock-setbtns"></div></section>' +
      '<div class="rz-tc-foot"><button type="button" class="rz-lock-now">🔒 ล็อกเลย (L)</button><button type="button" class="rz-tc-close">ปิด</button></div></div>';
    document.body.appendChild(w);
    var btns = w.querySelector('.rz-lock-setbtns');
    btns.innerHTML = enabled()
      ? '<button type="button" data-a="change">เปลี่ยนรหัสผ่าน</button> <button type="button" data-a="off">ปิดการล็อก</button>'
      : '<button type="button" data-a="set">ตั้งรหัสผ่าน</button>';
    var close = function () { w.classList.add('is-out'); setTimeout(function () { w.remove(); }, 250); };
    w.addEventListener('click', function (e) {
      if (e.target === w || e.target.closest('.rz-tc-x, .rz-tc-close')) { close(); return; }
      if (e.target.closest('.rz-lock-now')) { close(); lockNow(); return; }
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'set') { close(); show('setup'); }
      if (a === 'change' || a === 'off') {
        close();
        // ยืนยันรหัสเดิมบนหน้าล็อก แล้วค่อยเปลี่ยน/ปิด
        pendingAfterAuth = a;
        show('auth');
      }
    });
    w.querySelector('.rz-lock-sleepsel').addEventListener('change', function (e) { C.sleep = +e.target.value; save(); });
  }
  var pendingAfterAuth = '';
  var baseRelease = release;
  release = function (note) {
    var a = pendingAfterAuth; pendingAfterAuth = '';
    if (a === 'off') { C.hash = ''; C.salt = ''; C.skip = true; save(); return baseRelease('ปิดการล็อกด้วยรหัสผ่านแล้ว'); }
    if (a === 'change') { ov.classList.remove('is-open'); show('setup'); return; }
    return baseRelease(note);
  };
  function lockNow() { if (enabled()) show('auth'); else show('setup'); }
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if ((window.RZ_MIDWORD && window.RZ_MIDWORD()) || ov || e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    if (e.key === 'l' || e.key === 'L') lockNow();
  });
  function addButton() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('rzLockBtn')) return;
    var b = el('button', 'rz-fx-toggle rz-sound-toggle');
    b.type = 'button'; b.id = 'rzLockBtn'; b.textContent = '🔒';
    b.addEventListener('click', settings);
    bar.appendChild(b);
  }

  /* ---------- เริ่ม: ล็อกทันทีตอนเปิดเว็บ ---------- */
  window.RZ_LOCK_ACTIVE = enabled() || !C.skip; // บอก rz-poke ว่าไม่ต้องเล่นฉาก Master Ball ซ้ำ
  if (enabled()) show('auth');
  else if (!C.skip) show('setup');
  else root.classList.remove('rz-locked');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton); else addButton();
  window.RZLOCK = { lock: lockNow, sleep: function () { show('sleep'); }, settings: settings, sleepEnabled: function () { return !!C.sleep; }, active: function () { return !!ov; } };
})();
