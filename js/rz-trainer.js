// RAYQUAZA TRAINER — ระบบเทรนเนอร์ (คู่กับ css/rz-trainer.css) เก็บข้อมูลในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่ส่งไปไหน
//  1) EXP + เลเวล: ทำงานแล้วได้ EXP (ตรวจ ORDER, ปริ้น, ดาวน์โหลด, อัปโหลด, คัดลอก, งานที่รอนาน) หลอด EXP ใต้ชื่อแบรนด์ · เลเวลอัป = ฉากฉลอง
//  2) บัตรเทรนเนอร์ + เหรียญตรา: กดโลโก้ / หลอด EXP / ปุ่ม T
//  3) สรุปประจำวัน: ขึ้นเองครั้งแรกหลัง 17:30 ของวันที่มีงาน หรือกดจากบัตรเทรนเนอร์
//  4) กล่องยืนยันของธีม: window.rzConfirm(ข้อความ) → Promise<true/false> (โค้ดเดิมเรียกแทน confirm())
//  5) ทักทายตามเวลาตอนเปิดแอป
//  6) พักหน้าจอ: ไม่ได้ใช้งาน 5 นาที RAYQUAZA นอนหลับกลางจอ ขยับเมาส์/กดปุ่ม = ตื่น
//  7) เพิ่มคีย์ลัดของ RAYQUAZA ในหน้าต่างคีย์ลัดเดิม (ปุ่ม ?)
(function () {
  'use strict';

  var KEY = 'rz_trainer_v1';
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on'); }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function poke() { return window.RZPOKE || null; }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function sfx(n) { var P = poke(); if (P) P.sfx(n); }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function yesterdayKey() { var d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); }
  function thDate(ms) { try { return new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }

  /* ================= ข้อมูล ================= */
  function blank() {
    return {
      name: 'เทรนเนอร์', id: String(10000 + Math.floor(Math.random() * 89999)), started: Date.now(),
      exp: 0, c: { tasks: 0, compare: 0, skus: 0, allOk: 0, print: 0, download: 0, upload: 0, copy: 0, shiny: 0 },
      streak: 0, best: 0, lastDay: '', days: 0, badges: {}, night: false, early: false,
      today: { key: '', exp: 0, tasks: 0, skus: 0, print: 0, compare: 0, summaryShown: false }
    };
  }
  var S = blank();
  try {
    var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') {
      var b = blank();
      for (var k in b) if (raw[k] === undefined) raw[k] = b[k];
      for (var kc in b.c) if (raw.c[kc] === undefined) raw.c[kc] = 0;
      S = raw;
    }
  } catch (e) { /* ข้าม */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ข้าม */ } }
  function rollDay() {
    var k = dayKey();
    if (S.today.key !== k) S.today = { key: k, exp: 0, tasks: 0, skus: 0, print: 0, compare: 0, summaryShown: false };
  }

  /* ================= เลเวล ================= */
  var MAX_LV = 100;
  function need(lv) { return 40 + lv * 20; }              // EXP ที่ต้องใช้จาก lv → lv+1
  function levelOf(exp) {
    var lv = 1, left = exp;
    while (lv < MAX_LV && left >= need(lv)) { left -= need(lv); lv++; }
    return { lv: lv, into: left, need: lv >= MAX_LV ? 1 : need(lv) };
  }

  /* ================= เหรียญตรา ================= */
  var BADGES = [
    ['first', '🌱', 'ก้าวแรก', 'ทำงานชิ้นแรกสำเร็จ', function () { return S.c.tasks >= 1; }],
    ['cmp10', '🔍', 'นักตรวจ', 'ตรวจ ORDER กับ Stock 10 ครั้ง', function () { return S.c.compare >= 10; }],
    ['cmp100', '🏅', 'ปรมาจารย์สต็อก', 'ตรวจ ORDER กับ Stock 100 ครั้ง', function () { return S.c.compare >= 100; }],
    ['sku10k', '📦', 'หมื่น SKU', 'ตรวจรวม 10,000 SKU', function () { return S.c.skus >= 10000; }],
    ['allok', '💯', 'ครบทุกตัว', 'สต็อกพอทุกรายการ 10 รอบ', function () { return S.c.allOk >= 10; }],
    ['print50', '🖨️', 'นักปริ้น', 'ปริ้น 50 ครั้ง', function () { return S.c.print >= 50; }],
    ['streak7', '🔥', 'ไฟไม่มอด', 'ทำงานติดกัน 7 วัน', function () { return S.best >= 7; }],
    ['night', '🦉', 'นกฮูกราตรี', 'ทำงานหลัง 3 ทุ่ม', function () { return S.night; }],
    ['early', '🐓', 'ตื่นเช้า', 'ทำงานก่อน 7 โมงเช้า', function () { return S.early; }],
    ['shiny', '✨', 'นักล่าไชนี่', 'เจอ RAYQUAZA ไชนี่บินผ่าน', function () { return S.c.shiny >= 1; }],
    ['lv25', '🐉', 'ร่างเมก้า', 'ถึง Lv.25', function () { return levelOf(S.exp).lv >= 25; }],
    ['lv50', '👑', 'ราชาแห่งท้องฟ้า', 'ถึง Lv.50', function () { return levelOf(S.exp).lv >= 50; }]
  ];
  function checkBadges() {
    var got = [];
    BADGES.forEach(function (b) {
      if (!S.badges[b[0]] && b[4]()) { S.badges[b[0]] = Date.now(); got.push(b); }
    });
    got.forEach(function (b, i) {
      setTimeout(function () { toast('ได้รับเหรียญตรา ' + b[1] + ' ' + b[2] + '! — ' + b[3], 'success'); }, 600 + i * 1500);
    });
    return got.length;
  }

  /* ================= ได้ EXP ================= */
  var expBar = null, lastGain = {};
  function gain(amount, cat, extra) {
    if (!amount) return;
    var now = Date.now();
    // กันกดรัว (เช่นคลิกคัดลอก SKU ติดๆ กัน) ได้ EXP ซ้ำหมวดเดิมทุก 3 วินาทีเท่านั้น
    if (cat && lastGain[cat] && now - lastGain[cat] < 3000 && cat !== 'compare') return;
    if (cat) lastGain[cat] = now;
    rollDay();
    var before = levelOf(S.exp).lv;
    // วันทำงานต่อเนื่อง
    var tk = dayKey();
    if (S.lastDay !== tk) {
      S.streak = S.lastDay === yesterdayKey() ? S.streak + 1 : 1;
      S.best = Math.max(S.best, S.streak);
      S.days++;
      S.lastDay = tk;
    }
    var h = new Date().getHours();
    if (h >= 21) S.night = true;
    if (h < 7 && h >= 4) S.early = true;
    S.exp += amount;
    S.today.exp += amount;
    if (cat !== 'checkin' && cat !== 'shinyexp') { S.c.tasks++; S.today.tasks++; }
    if (cat && S.c[cat] !== undefined) S.c[cat]++;
    if (cat === 'print') S.today.print++;
    if (cat === 'compare') S.today.compare++;
    if (extra && extra.skus) { S.c.skus += extra.skus; S.today.skus += extra.skus; }
    if (extra && extra.allOk) S.c.allOk++;
    // ประวัติรายวัน (ใช้กับปฏิทินสถิติ/สรุปสัปดาห์ใน rz-progress.js) เก็บ 400 วันล่าสุด
    S.hist = S.hist || {};
    var hd = S.hist[tk] || (S.hist[tk] = { t: 0, s: 0, e: 0 });
    hd.e += amount;
    if (cat !== 'checkin' && cat !== 'shinyexp') hd.t++;
    if (extra && extra.skus) hd.s += extra.skus;
    var hk = Object.keys(S.hist);
    if (hk.length > 400) hk.sort(function (a, b) { return new Date(a) - new Date(b); }).slice(0, hk.length - 400).forEach(function (k) { delete S.hist[k]; });
    try { window.dispatchEvent(new CustomEvent('rz:gain', { detail: { cat: cat, amount: amount, extra: extra || null } })); } catch (e) { /* ข้าม */ }
    var after = levelOf(S.exp).lv;
    checkBadges();
    save();
    paintExp(amount);
    if (after > before) setTimeout(function () { levelUp(after); }, 700);
    maybeDailySummary();
  }

  /* ---------- จับงานที่ทำจากเหตุการณ์ของธีม ---------- */
  window.addEventListener('rz:compare', function (e) {
    var d = e.detail || {};
    if (!d.total) return;
    var all = d.ok === d.total;
    gain(15 + Math.min(35, Math.round(d.total / 40)) + (all ? 10 : 0), 'compare', { skus: d.total, allOk: all });
  });
  window.addEventListener('rz:toast', function (e) {
    var d = e.detail || {}, m = d.message || '';
    if (d.type !== 'success' || /^เปิด /.test(m) || /^ได้รับเหรียญ|^สภาพอากาศ|^โหมดอัตโนมัติ|^เปิดเพลง|^ยินดีต้อนรับ/.test(m)) return;
    if (/ปริ้น|พิมพ์/.test(m)) gain(12, 'print');
    else if (/อัปโหลด|นำเข้า/.test(m)) gain(8, 'upload');
    else if (/ดาวน์โหลด/.test(m)) gain(5, 'download');
    else if (/คัดลอก/.test(m)) gain(2, 'copy');
    else gain(3, 'misc');
  });
  window.addEventListener('rz:charged', function (e) {
    var ms = (e.detail && e.detail.ms) || 0;
    if (ms > 1500) gain(5, 'job');
  });
  window.addEventListener('rz:shiny', function () {
    S.c.shiny++;
    save();
    toast('✨ เจอ RAYQUAZA ไชนี่บินผ่าน! (ครั้งที่ ' + S.c.shiny + ')', 'success');
    gain(50, 'shinyexp');
  });

  /* ================= หลอด EXP ใต้ชื่อแบรนด์ ================= */
  function addExpBar() {
    var copy = document.querySelector('.shell > .top:not(.side-right) .brand-copy');
    if (!copy || expBar) return;
    expBar = el('span', 'rz-exp', '<em>Lv.<b>1</b></em><span class="rz-exp-track"><i></i></span>');
    expBar.title = 'บัตรเทรนเนอร์ (T)';
    copy.appendChild(expBar);
    expBar.addEventListener('click', openCard);
    var logo = document.querySelector('.shell > .top:not(.side-right) .brand-mark');
    if (logo) { logo.style.cursor = 'pointer'; logo.title = 'บัตรเทรนเนอร์ (T)'; logo.addEventListener('click', openCard); }
    paintExp(0);
  }
  function paintExp(gained) {
    if (!expBar) return;
    var L = levelOf(S.exp);
    expBar.querySelector('b').textContent = L.lv;
    expBar.querySelector('i').style.width = (L.lv >= MAX_LV ? 100 : L.into / L.need * 100).toFixed(1) + '%';
    expBar.title = 'Lv.' + L.lv + ' · EXP ' + fmt(L.into) + ' / ' + fmt(L.need) + ' — กดเพื่อดูบัตรเทรนเนอร์ (T)';
    if (gained > 0 && fxOn()) {
      var f = el('span', 'rz-exp-float', '+' + gained + ' EXP');
      expBar.appendChild(f);
      setTimeout(function () { f.remove(); }, 1400);
      expBar.classList.remove('is-gain'); void expBar.offsetWidth; expBar.classList.add('is-gain');
    }
  }

  /* ================= เลเวลอัป ================= */
  function levelUp(lv) {
    try { window.dispatchEvent(new CustomEvent('rz:levelup', { detail: { lv: lv } })); } catch (e) { /* ข้าม */ }
    if (!(window.RZWORLD && window.RZWORLD.bgmOn())) sfx('fanfare'); // เปิดเพลงอยู่: ใช้เพลงเลเวลอัปแทน
    if (!fxOn() || reduce) { toast('RAYQUAZA โตขึ้นเป็น Lv.' + lv + '!', 'success'); return; }
    var spr = isDay() ? 'img/rayquaza-mega.png?v=1' : 'img/rayquaza-shiny.png?v=2';
    var ov = el('div', 'rz-lvup',
      '<div class="rz-lvup-rays"></div>' +
      '<div class="rz-lvup-card"><img alt="" draggable="false"><small>LEVEL UP!</small><b>Lv.<span>' + (lv - 1) + '</span></b>' +
      '<p>RAYQUAZA โตขึ้นเป็น <strong>Lv.' + lv + '</strong>!</p></div>');
    ov.querySelector('img').src = spr;
    document.body.appendChild(ov);
    var num = ov.querySelector('b span');
    setTimeout(function () { num.textContent = lv; num.parentNode.classList.add('is-up'); }, 650);
    var A = window.RZFX;
    if (A && A.burst) setTimeout(function () { A.burst(window.innerWidth / 2, window.innerHeight / 2); }, 650);
    var close = function () { ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 400); };
    ov.addEventListener('click', close);
    setTimeout(close, 3200);
  }

  /* ================= บัตรเทรนเนอร์ ================= */
  var cardOv = null;
  function openCard() {
    if (cardOv) return;
    rollDay();
    var L = levelOf(S.exp);
    var spr = isDay() ? 'img/rayquaza-mega.png?v=1' : 'img/rayquaza-shiny.png?v=2';
    var stat = function (label, val) { return '<div class="rz-tc-stat"><span>' + label + '</span><b>' + val + '</b></div>'; };
    var badges = BADGES.map(function (b) {
      var on = !!S.badges[b[0]];
      return '<div class="rz-badge' + (on ? ' is-on' : '') + '" title="' + esc(b[2] + ' — ' + b[3] + (on ? ' (ได้รับ ' + thDate(S.badges[b[0]]) + ')' : ' (ยังไม่ปลดล็อก)')) + '">' +
        '<i>' + (on ? b[1] : '?') + '</i><span>' + esc(b[2]) + '</span></div>';
    }).join('');
    var nBadge = Object.keys(S.badges).length;
    cardOv = el('div', 'rz-tc-ov',
      '<div class="rz-tc" role="dialog" aria-label="บัตรเทรนเนอร์">' +
      '<div class="rz-tc-head"><b>TRAINER CARD</b><span>ID No. ' + esc(S.id) + '</span><button type="button" class="rz-tc-x" aria-label="ปิด">×</button></div>' +
      '<div class="rz-tc-body">' +
      '<div class="rz-tc-info">' +
      '<label class="rz-tc-name">ชื่อ <input type="text" maxlength="20" value="' + esc(S.name) + '" aria-label="ชื่อเทรนเนอร์"></label>' +
      '<div class="rz-tc-lv"><b>Lv.' + L.lv + '</b><span class="rz-tc-exptrack"><i style="width:' + (L.lv >= MAX_LV ? 100 : L.into / L.need * 100).toFixed(1) + '%"></i></span>' +
      '<small>EXP ' + fmt(L.into) + ' / ' + fmt(L.need) + ' · รวม ' + fmt(S.exp) + '</small></div>' +
      '<div class="rz-tc-stats">' +
      stat('งานทั้งหมด', fmt(S.c.tasks)) + stat('ตรวจ ORDER', fmt(S.c.compare)) + stat('SKU ที่ตรวจ', fmt(S.c.skus)) +
      stat('สต็อกพอครบ', fmt(S.c.allOk) + ' รอบ') + stat('ปริ้น', fmt(S.c.print)) + stat('ดาวน์โหลด', fmt(S.c.download)) +
      stat('อัปโหลด', fmt(S.c.upload)) + stat('วันที่ทำงาน', fmt(S.days)) + stat('ทำติดกัน', fmt(S.streak) + ' วัน (สูงสุด ' + fmt(S.best) + ')') +
      stat('เจอไชนี่', fmt(S.c.shiny)) + stat('เริ่มเดินทาง', thDate(S.started)) + stat('เหรียญตรา', nBadge + ' / ' + BADGES.length) +
      '</div></div>' +
      '<div class="rz-tc-mon"><img alt="" draggable="false"><div class="rz-tc-types"><i class="rz-type t-dragon">DRAGON</i><i class="rz-type t-flying">FLYING</i></div></div>' +
      '</div>' +
      '<div class="rz-tc-today"><b>วันนี้</b><span>+' + fmt(S.today.exp) + ' EXP</span><span>' + fmt(S.today.tasks) + ' งาน</span><span>' + fmt(S.today.skus) + ' SKU</span><span>ปริ้น ' + fmt(S.today.print) + '</span></div>' +
      '<div class="rz-tc-badges">' + badges + '</div>' +
      '<div class="rz-tc-foot"><button type="button" class="rz-tc-sum">📊 สรุปวันนี้</button><button type="button" class="rz-tc-close">ปิด</button></div>' +
      '</div>');
    cardOv.querySelector('.rz-tc-mon img').src = spr;
    // ให้โมดูลอื่นเติมส่วนเสริมในบัตร (ภารกิจ ปฏิทินสถิติ ตู้เสื้อผ้า สรุปสัปดาห์)
    try { window.dispatchEvent(new CustomEvent('rz:card', { detail: { el: cardOv.querySelector('.rz-tc') } })); } catch (e) { /* ข้าม */ }
    document.body.appendChild(cardOv);
    sfx('open');
    var inp = cardOv.querySelector('.rz-tc-name input');
    inp.addEventListener('change', function () { S.name = inp.value.trim() || 'เทรนเนอร์'; save(); });
    var close = function () {
      if (!cardOv) return;
      S.name = inp.value.trim() || 'เทรนเนอร์'; save();
      var o = cardOv; cardOv = null;
      document.removeEventListener('keydown', onKey, true);
      o.classList.add('is-out'); setTimeout(function () { o.remove(); }, 250);
    };
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    cardOv.addEventListener('click', function (e) { if (e.target === cardOv) close(); });
    cardOv.querySelector('.rz-tc-x').addEventListener('click', close);
    cardOv.querySelector('.rz-tc-close').addEventListener('click', close);
    cardOv.querySelector('.rz-tc-sum').addEventListener('click', function () { close(); setTimeout(function () { dailySummary(true); }, 260); });
  }

  /* ================= สรุปประจำวัน ================= */
  function dailySummary(manual) {
    rollDay();
    var t = S.today;
    var L = levelOf(S.exp);
    var mood = t.tasks >= 30 ? 'สุดยอดไปเลย! วันนี้ขยันมาก 🔥' : t.tasks >= 10 ? 'เก่งมาก เทรนเนอร์! 💪' : t.tasks > 0 ? 'ทำได้ดี พรุ่งนี้สู้ต่อ!' : 'วันนี้ยังไม่มีงาน เริ่มกันเลย!';
    var ov = el('div', 'rz-tc-ov',
      '<div class="rz-tc rz-day" role="dialog" aria-label="สรุปวันนี้">' +
      '<div class="rz-tc-head"><b>DAILY REPORT</b><span>' + thDate(Date.now()) + '</span><button type="button" class="rz-tc-x" aria-label="ปิด">×</button></div>' +
      '<p class="rz-day-lead">วันนี้ RAYQUAZA ช่วย <b>' + esc(S.name) + '</b> ทำงาน</p>' +
      '<div class="rz-day-grid">' +
      '<div><b>' + fmt(t.tasks) + '</b><span>งาน</span></div>' +
      '<div><b>' + fmt(t.compare) + '</b><span>ตรวจ ORDER</span></div>' +
      '<div><b>' + fmt(t.skus) + '</b><span>SKU</span></div>' +
      '<div><b>' + fmt(t.print) + '</b><span>ปริ้น</span></div>' +
      '</div>' +
      '<p class="rz-day-exp">+' + fmt(t.exp) + ' EXP · ตอนนี้ Lv.' + L.lv + ' · ทำติดกัน ' + fmt(S.streak) + ' วัน</p>' +
      '<p class="rz-day-mood">' + mood + '</p>' +
      '<div class="rz-tc-foot"><button type="button" class="rz-tc-close">ปิด</button></div>' +
      '</div>');
    document.body.appendChild(ov);
    if (t.tasks) sfx('ok');
    var close = function () { ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 250); };
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.rz-tc-x').addEventListener('click', close);
    ov.querySelector('.rz-tc-close').addEventListener('click', close);
    if (!manual) { S.today.summaryShown = true; save(); }
  }
  var sumTimer = 0;
  function maybeDailySummary() {
    rollDay();
    var d = new Date();
    if (S.today.summaryShown || S.today.tasks < 5 || sumTimer) return;
    if (d.getHours() * 60 + d.getMinutes() < 17 * 60 + 30) return;
    // รอให้ฉาก/กล่องอื่นหายก่อน (เลเวลอัป, ฉลอง, กล่องข้อความ) แล้วค่อยขึ้น
    var tryShow = function () {
      if (document.querySelector('.rz-tc-ov, .rz-alert, .rz-lvup, .rz-win, .rz-idle, .rz-ball-intro')) { sumTimer = setTimeout(tryShow, 2500); return; }
      sumTimer = 0;
      if (!S.today.summaryShown) dailySummary(false);
    };
    sumTimer = setTimeout(tryShow, 6000);
  }

  /* ================= 4) กล่องยืนยันของธีม ================= */
  function rzConfirm(msg) {
    return new Promise(function (resolve) {
      msg = String(msg == null ? '' : msg);
      var danger = /ลบ/.test(msg);
      var ov = el('div', 'rz-alert rz-ask');
      var box = el('div', 'rz-dlg rz-dlg-big');
      var txt = el('div', 'rz-dlg-text');
      txt.textContent = msg;
      box.appendChild(el('span', 'rz-dlg-ball'));
      box.appendChild(txt);
      var menu = el('div', 'rz-ask-menu', '<button type="button" data-v="1">ใช่</button><button type="button" data-v="0">ไม่ใช่</button>');
      var wrap = el('div', 'rz-ask-wrap');
      wrap.appendChild(menu);
      wrap.appendChild(box);
      ov.appendChild(wrap);
      document.body.appendChild(ov);
      sfx('click');
      var btns = menu.querySelectorAll('button');
      var idx = danger ? 1 : 0; // คำสั่งลบ: เลือก "ไม่ใช่" ไว้ก่อนกันพลาด
      function focus(i) { idx = (i + 2) % 2; btns.forEach(function (b, j) { b.classList.toggle('is-on', j === idx); }); btns[idx].focus(); }
      function done(v) {
        document.removeEventListener('keydown', onKey, true);
        ov.classList.add('is-out');
        setTimeout(function () { ov.remove(); }, 200);
        sfx(v ? 'ok' : 'click');
        resolve(v);
      }
      function onKey(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab') { e.preventDefault(); focus(idx + 1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); done(idx === 0); }
        else if (e.key === 'Escape') { e.preventDefault(); done(false); }
        e.stopPropagation();
      }
      btns.forEach(function (b, j) {
        b.addEventListener('mouseenter', function () { focus(j); });
        b.addEventListener('click', function () { done(b.getAttribute('data-v') === '1'); });
      });
      document.addEventListener('keydown', onKey, true);
      focus(idx);
    });
  }
  window.rzConfirm = rzConfirm;

  /* ================= 5) ทักทาย ================= */
  function greet() {
    try { if (sessionStorage.getItem('rz_greet') === '1') return; sessionStorage.setItem('rz_greet', '1'); } catch (e) { /* ข้าม */ }
    var h = new Date().getHours();
    var hi = h < 5 ? 'ดึกมากแล้วนะ ' + S.name + ' พักผ่อนบ้างนะ 🌙'
      : h < 11 ? 'อรุณสวัสดิ์ ' + S.name + '! วันนี้ RAYQUAZA พร้อมลุย ☀️'
      : h < 13 ? 'สวัสดีตอนเที่ยง ' + S.name + '! อย่าลืมกินข้าวนะ 🍱'
      : h < 17 ? 'สวัสดีตอนบ่าย ' + S.name + '! สู้ต่ออีกนิด 💪'
      : h < 21 ? 'สวัสดีตอนเย็น ' + S.name + '! ใกล้เลิกงานแล้ว 🌇'
      : 'ทำงานดึกแล้วนะ ' + S.name + ' อย่าหักโหมนะ 🌙';
    var L = levelOf(S.exp);
    var extra = S.lastDay === yesterdayKey() && S.streak >= 1 ? ' · ทำติดกันวันที่ ' + (S.streak + 1) + ' 🔥' : '';
    toast(hi + ' (Lv.' + L.lv + extra + ')', '');
  }

  /* ================= 6) พักหน้าจอ ================= */
  var IDLE_MS = 5 * 60 * 1000;
  var lastInput = Date.now(), idleOv = null, idleClock = 0;
  function wake() {
    lastInput = Date.now();
    if (!idleOv) return;
    var o = idleOv; idleOv = null;
    clearInterval(idleClock);
    o.classList.add('is-out');
    setTimeout(function () { o.remove(); }, 500);
    toast('ยินดีต้อนรับกลับ ' + S.name + '! RAYQUAZA ตื่นแล้ว ⚡', '');
  }
  function sleep() {
    if (idleOv || !fxOn() || reduce || document.hidden) return;
    if (window.RZLOCK && (window.RZLOCK.sleepEnabled() || window.RZLOCK.active())) return; // ใช้โหมดสลีปของหน้าล็อกแทน
    if (document.querySelector('.rz-charge.is-on, .rz-alert, .rz-tc-ov, .rz-ball-intro, .rz-lvup')) return;
    var spr = isDay() ? 'img/rayquaza-mega.png?v=1' : 'img/rayquaza-shiny.png?v=2';
    idleOv = el('div', 'rz-idle',
      '<div class="rz-idle-stars"></div>' +
      '<div class="rz-idle-mon"><img alt="" draggable="false"><span class="rz-idle-z">z</span><span class="rz-idle-z z2">Z</span><span class="rz-idle-z z3">z</span></div>' +
      '<div class="rz-idle-clock"><b></b><span></span></div>' +
      '<p>RAYQUAZA กำลังพักผ่อน… ขยับเมาส์หรือกดปุ่มใดก็ได้เพื่อปลุก</p>');
    idleOv.querySelector('img').src = spr;
    document.body.appendChild(idleOv);
    var paint = function () {
      var d = new Date();
      idleOv.querySelector('.rz-idle-clock b').textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      try { idleOv.querySelector('.rz-idle-clock span').textContent = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { /* ข้าม */ }
    };
    paint();
    idleClock = setInterval(function () { if (idleOv) paint(); }, 10000);
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, wake, { passive: true, capture: true });
  });
  setInterval(function () { if (Date.now() - lastInput > IDLE_MS) sleep(); }, 15000);

  /* ================= 7) คีย์ลัด ================= */
  function addShortcuts() {
    var m = document.getElementById('ppShortcutsModal');
    if (!m || m.querySelector('.rz-short-sec')) return;
    var rows = [
      ['บัตรเทรนเนอร์', 'T'],
      ['DRAGON ASCENT', '↑ ↑ ↓ ↓ ← → ← → B A'],
      ['DRAGON ASCENT (อีกแบบ)', 'พิมพ์ rayquaza'],
      ['สลับโหมด กลางวัน / ไชนี่', 'คลิกขวา 2 ครั้ง'],
      ['เปลี่ยนสภาพอากาศ', 'W'],
      ['เปิด/ปิดเพลงประกอบ', 'M'],
      ['เปิดตัวเลือกเวลา/วันที่', 'Alt + ↓'],
      ['ข้ามฉาก / ปิดกล่องข้อความ', 'คลิก / Esc']
    ];
    m.appendChild(el('div', 'pp-short-row rz-short-sec', '<span>⚡ RAYQUAZA</span><span></span>'));
    rows.forEach(function (r) { m.appendChild(el('div', 'pp-short-row', '<span>' + r[0] + '</span><span class="pp-key">' + r[1] + '</span>')); });
  }
  function typing(e) { var t = e.target; return t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)); }
  document.addEventListener('keydown', function (e) {
    if ((window.RZ_MIDWORD && window.RZ_MIDWORD()) || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 't' || e.key === 'T') { if (!document.querySelector('.rz-tc-ov')) openCard(); }
  });

  function init() {
    rollDay();
    addExpBar();
    addShortcuts();
    // เช็คอินวันแรกของวัน = EXP เล็กน้อย
    if (S.lastDay !== dayKey()) setTimeout(function () { gain(5, 'checkin'); }, 2500);
    // ครั้งแรกของแท็บมีฉาก Master Ball ก่อน: รอให้จบแล้วค่อยทักทาย
    var first = true;
    try { first = sessionStorage.getItem('rz_greet') !== '1'; } catch (e) { /* ข้าม */ }
    setTimeout(greet, first && fxOn() ? 4300 : 1500);
    setInterval(maybeDailySummary, 60000);
    window.RZTRAINER = { gain: gain, card: openCard, daily: dailySummary, state: function () { return S; }, sleep: sleep };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
