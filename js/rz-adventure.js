// RAYQUAZA ADVENTURE — ลูกเล่นโปเกมอนชุดใหญ่ (คู่กับ css/rz-adventure.css) · ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้
//  1) Wild SKU: ตรวจ ORDER แล้วเจอ SKU ที่ไม่เคยเห็น = โยน Master Ball จับ → บันทึกลง RZ-DEX เอง (ครั้งแรกบันทึกเงียบๆ ทั้งหมด)
//  2) แผนที่คลังสินค้า: ตำแหน่งจากผลตรวจล่าสุด วาดเป็น Town Map แยกโซน · กดโซนดู SKU · หมุดกะพริบตอนเปิดจาก RZ-DEX
//  3) ยิม 8 แห่ง: ด่านระยะยาว ได้เข็มกลัดยิม (กล่องโชว์ในบัตรเทรนเนอร์)
//  4) คู่แข่ง "เรน": เป้า EXP ของวันขึ้นตามฝีมือ 7 วันล่าสุด แซงได้ = ชนะ (+30 EXP)
//  5) ฉายาเทรนเนอร์: ตามเลเวล + เข็มกลัดยิม
//  6) Mystery Gift: วันละกล่อง (EXP / ของแต่งหายาก / ตั๋วไชนี่ = วันนั้นเจอไชนี่ง่ายขึ้นมาก)
//  7) ไข่มังกร: ทำงานครบ 100 ชิ้นไข่ฟัก ได้ลูกมังกรพิกเซลมาเดินกับคู่หู
//  8) ศูนย์โปเกมอน: ทำงานต่อเนื่อง 2 ชั่วโมง ชวนพัก 5 นาที (พักครบ 3 นาทีขึ้นไป +20 EXP)
//  9) ท่าโจมตีตอนคลิก: ปลดล็อกตามเลเวล เลือกในบัตรเทรนเนอร์
// 10) เสียงร้องคู่หู: คลิกคู่หูแล้วร้อง (สร้างเสียงเอง ต้องเปิดเสียงประกอบ) ความสนิทสูงเสียงเปลี่ยน
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on') && !reduce; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function J(k, d) { try { var v = JSON.parse(ls(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function sfx(n) { if (window.RZPOKE) window.RZPOKE.sfx(n); }
  function say(t) { if (window.RZBUDDY) window.RZBUDDY.say(t); }
  function gain(n, c) { if (window.RZTRAINER) window.RZTRAINER.gain(n, c); }
  function T() { return window.RZTRAINER ? window.RZTRAINER.state() : {}; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function lvl() { var e = T().exp || 0, l = 1; while (l < 100 && e >= 40 + l * 20) { e -= 40 + l * 20; l++; } return l; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function overlayBusy() { return !!document.querySelector('.rz-lock, .rz-battle, .rz-win, .rz-lvup, .rz-meteor, .rz-epic-evo, .rz-ball-intro, .rz-catch, .rz-gift, .rz-center, .rz-alert'); }
  // รอจนไม่มีฉากอื่นค้างอยู่ค่อยเล่น
  function whenClear(fn, tries) {
    tries = tries || 0;
    if (overlayBusy() && tries < 60) { setTimeout(function () { whenClear(fn, tries + 1); }, 1500); return; }
    fn();
  }
  function compareList() { try { return typeof compareResults !== 'undefined' ? compareResults : []; } catch (e) { return []; } } // eslint-disable-line no-undef

  /* ================= 1) Wild SKU ================= */
  window.addEventListener('rz:compare', function (e) {
    if (!e.detail || !e.detail.total) return;
    var seen = J('rz_dex_seen_v1', {}), fresh = [];
    compareList().forEach(function (x) { var k = String(x.sku || '').trim(); if (k && !seen[k] && fresh.indexOf(k) < 0) fresh.push(k); });
    if (!fresh.length) return;
    var firstTime = !Object.keys(seen).length;
    fresh.forEach(function (k) { seen[k] = 1; });
    ls('rz_dex_seen_v1', JSON.stringify(seen));
    if (firstTime) { setTimeout(function () { toast('📖 สำรวจครั้งแรก: บันทึก ' + fmt(fresh.length) + ' SKU ลง RZ-DEX แล้ว (ต่อไปเจอ SKU ใหม่จะได้จับ!)', 'success'); }, 2500); return; }
    fresh.slice(0, 10).forEach(function (k) { try { window.dispatchEvent(new CustomEvent('rz:dex', { detail: { sku: k, isNew: true } })); } catch (er) { /* ข้าม */ } });
    if (fxOn()) whenClear(function () { catchScene(fresh); });
    else toast('📖 เจอ SKU ใหม่ ' + fmt(fresh.length) + ' ตัว บันทึกลง RZ-DEX แล้ว', 'success');
  });
  function catchScene(list) {
    var sku = list[0], many = list.length > 1;
    var ov = el('div', 'rz-catch',
      '<div class="rz-ct-grass"></div>' +
      '<div class="rz-ct-mon"></div>' +
      '<div class="rz-ct-ball"><i></i></div>' +
      '<div class="rz-ct-dlg"><span></span></div>');
    var mon = ov.querySelector('.rz-ct-mon');
    if (window.RZDEX && window.RZDEX.sprite) mon.appendChild(window.RZDEX.sprite(sku));
    if (many) mon.appendChild(el('b', 'rz-ct-many', '×' + fmt(list.length)));
    var txt = ov.querySelector('.rz-ct-dlg span');
    document.body.appendChild(ov);
    txt.textContent = many ? 'SKU ใหม่ ×' + fmt(list.length) + ' ปรากฏตัว! (' + sku + ' และอื่นๆ)' : 'Wild ' + sku + ' ปรากฏตัว!';
    sfx('roar');
    var T0 = [];
    function at(ms, fn) { T0.push(setTimeout(fn, ms)); }
    at(1300, function () { txt.textContent = 'ไปเลย Master Ball!'; ov.classList.add('is-throw'); sfx('click'); });
    at(2100, function () { ov.classList.add('is-in'); sfx('open'); });
    at(2600, function () { sfx('shake'); });
    at(3200, function () { sfx('shake'); });
    at(3800, function () { sfx('shake'); });
    at(4400, function () {
      ov.classList.add('is-got'); sfx('fanfare');
      txt.textContent = 'Gotcha! ' + (many ? 'จับ SKU ใหม่ได้ ' + fmt(list.length) + ' ตัว' : sku + ' ถูกจับแล้ว') + ' บันทึกลง RZ-DEX!';
      gain(Math.min(40, 5 + list.length * 3), 'catch');
    });
    var done = function () { T0.forEach(clearTimeout); ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 400); };
    at(6600, done);
    ov.addEventListener('click', done);
  }

  /* ================= 2) แผนที่คลังสินค้า ================= */
  function zoneOf(loc) { var m = /^\s*([A-Za-z]+)/.exec(loc) || /^\s*([^\-\s,]+)/.exec(loc); return m ? m[1].toUpperCase() : '?'; }
  function mapData() {
    var zones = {};
    compareList().forEach(function (x) {
      String(x.locations || '').split(',').forEach(function (l) {
        l = l.trim(); if (!l) return;
        var z = zoneOf(l);
        (zones[z] = zones[z] || { skus: {}, locs: {} });
        zones[z].skus[x.sku] = (zones[z].skus[x.sku] || []).concat(l);
        zones[z].locs[l] = 1;
      });
    });
    return zones;
  }
  function openMap(focusSku) {
    if (document.querySelector('.rz-map-ov')) return;
    var Z = mapData(), names = Object.keys(Z).sort();
    var pin = {};
    if (focusSku) names.forEach(function (z) { if (Z[z].skus[focusSku]) pin[z] = Z[z].skus[focusSku]; });
    var cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(names.length || 1))));
    var tiles = names.map(function (z, i) {
      var n = Object.keys(Z[z].skus).length, h = hash(z);
      return '<button type="button" class="rz-map-zone' + (pin[z] ? ' is-pin' : '') + '" data-z="' + esc(z) + '" style="--hue:' + (h % 360) + ';grid-column:' + (i % cols + 1) + '">' +
        '<i class="rz-map-roof"></i><b>' + esc(z) + '</b><small>' + n + ' SKU · ' + Object.keys(Z[z].locs).length + ' ช่อง</small>' + (pin[z] ? '<em>📍</em>' : '') + '</button>';
    }).join('');
    var ov = el('div', 'rz-tc-ov rz-map-ov',
      '<div class="rz-tc rz-map" role="dialog" aria-label="แผนที่คลังสินค้า"><div class="rz-tc-head"><b>TOWN MAP</b><span>' + (focusSku ? '📍 ' + esc(focusSku) : 'แผนที่คลังสินค้า · จากผลตรวจ ORDER ล่าสุด') + '</span><button type="button" class="rz-tc-x" aria-label="ปิด">×</button></div>' +
      (names.length ? '<div class="rz-map-land" style="--cols:' + cols + '">' + tiles + '</div><div class="rz-map-list"><p>กดโซนเพื่อดู SKU ที่อยู่ในโซนนั้น</p></div>'
        : '<p class="rz-map-empty">ยังไม่มีข้อมูลตำแหน่ง — ตรวจ ORDER กับ Stock ก่อน แผนที่จะใช้ตำแหน่งจากผลตรวจล่าสุด</p>') +
      '<div class="rz-tc-foot"><button type="button" class="rz-tc-close">ปิด</button></div></div>');
    document.body.appendChild(ov);
    sfx('click');
    function showZone(z) {
      ov.querySelectorAll('.rz-map-zone').forEach(function (b) { b.classList.toggle('is-on', b.dataset.z === z); });
      var sk = Object.keys(Z[z].skus).sort();
      ov.querySelector('.rz-map-list').innerHTML = '<h5>โซน ' + esc(z) + ' <small>' + sk.length + ' SKU</small></h5><div class="rz-map-skus">' + sk.map(function (s) {
        return '<button type="button" data-sku="' + esc(s) + '"' + (s === focusSku ? ' class="is-pin"' : '') + '><b>' + esc(s) + '</b><small>' + esc(Z[z].skus[s].join(', ')) + '</small></button>';
      }).join('') + '</div>';
    }
    var first = Object.keys(pin)[0]; if (first) showZone(first);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.rz-tc-x, .rz-tc-close')) { ov.remove(); return; }
      var zb = e.target.closest('.rz-map-zone'); if (zb) { showZone(zb.dataset.z); return; }
      var sb = e.target.closest('[data-sku]'); if (sb && window.RZDEX) { ov.remove(); window.RZDEX.open(sb.dataset.sku); }
    });
  }
  // ปุ่ม "📍 แผนที่" ในการ์ด RZ-DEX + ปุ่มแผนที่บนแบนเนอร์หน้าตรวจ
  new MutationObserver(function (list) {
    list.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1 || !n.classList.contains('rz-dex-ov') || n.classList.contains('rz-pdx-ov')) return;
        var h3 = n.querySelector('.rz-dex-info h3'); if (!h3) return;
        var sku = h3.textContent, Z = mapData();
        if (!Object.keys(Z).some(function (z) { return Z[z].skus[sku]; })) return;
        var b = el('button', 'rz-dex-map', '📍 ดูบนแผนที่คลัง'); b.type = 'button';
        b.addEventListener('click', function () { n.remove(); openMap(sku); });
        n.querySelector('.rz-dex-info').appendChild(b);
      });
    });
  }).observe(document.body, { childList: true });
  function addMapButton() {
    var acts = document.querySelector('#compareTool .rz-hero') ;
    if (!acts || acts.querySelector('.rz-map-btn')) return;
    var b = el('button', 'rz-map-btn', '🗺️ แผนที่คลัง'); b.type = 'button';
    b.addEventListener('click', function () { openMap(); });
    var a = acts.querySelector('.rz-hero-actions');
    if (!a) { a = el('div', 'rz-hero-actions'); acts.appendChild(a); }
    a.appendChild(b);
  }

  /* ================= 3) ยิม 8 แห่ง ================= */
  function histArr() { var H = T().hist || {}; return Object.keys(H).map(function (k) { return [new Date(k), H[k]]; }); }
  var GYMS = [
    ['rock', '🪨', 'ยิมหินผา', 'ตรวจ ORDER กับ Stock ครบ 25 ครั้ง', function () { return (T().c || {}).compare >= 25; }],
    ['speed', '⚡', 'ยิมสายฟ้า', 'ตรวจรวม 1,000 SKU ภายในวันเดียว', function () { return histArr().some(function (x) { return x[1].s >= 1000; }); }],
    ['grind', '🌿', 'ยิมพงหญ้า', 'ทำงาน 20 วันใน 30 วันล่าสุด', function () { var cut = Date.now() - 30 * 864e5; return histArr().filter(function (x) { return x[0] >= cut && x[1].t > 0; }).length >= 20; }],
    ['perfect', '💧', 'ยิมสายน้ำ', 'ตรวจแล้วสต็อกพอครบทุก SKU 20 รอบ', function () { return (T().c || {}).allOk >= 20; }],
    ['print', '🔥', 'ยิมเปลวเพลิง', 'ปริ้นครบ 200 ครั้ง', function () { return (T().c || {}).print >= 200; }],
    ['streak', '🌙', 'ยิมจันทรา', 'ทำงานติดกัน 14 วัน', function () { return (T().best || 0) >= 14; }],
    ['dex', '📖', 'ยิมนักสะสม', 'บันทึก SKU ลง RZ-DEX 300 ตัว', function () { return Object.keys(J('rz_dex_seen_v1', {})).length >= 300; }],
    ['champ', '🐉', 'ยิมมังกร', 'ได้ดาวภารกิจ 20 ดวง', function () { return ((J('rz_quests_v1', {}) || {}).stars || 0) >= 20; }]
  ];
  function gymState() { return J('rz_gyms_v1', {}); }
  function checkGyms() {
    var G = gymState(), got = [];
    GYMS.forEach(function (g) { if (!G[g[0]]) { var ok = false; try { ok = g[4](); } catch (e) { /* ข้าม */ } if (ok) { G[g[0]] = Date.now(); got.push(g); } } });
    if (!got.length) return;
    ls('rz_gyms_v1', JSON.stringify(G));
    got.forEach(function (g, i) {
      setTimeout(function () {
        whenClear(function () {
          if (window.RZPOKE) window.RZPOKE.celebrate('ได้เข็มกลัด' + g[2] + '!', g[1] + ' ' + g[3]);
          gain(80, 'gym-' + g[0]);
        });
      }, 1500 + i * 4000);
    });
  }
  window.addEventListener('rz:gain', function (e) { if (!/^gym-|^rival|^gift|^egg|^center|^catch/.test((e.detail || {}).cat || '')) setTimeout(checkGyms, 300); });

  /* ================= 4) คู่แข่ง ================= */
  var RIVAL = 'เรน';
  function rivalTarget() {
    var H = T().hist || {}, sum = 0, n = 0;
    for (var i = 1; i <= 7; i++) { var d = new Date(); d.setDate(d.getDate() - i); var h = H[dayKey(d)]; if (h && h.e) { sum += h.e; n++; } }
    var avg = n ? sum / n : 80;
    var f = 1 + (hash(dayKey()) % 30) / 100; // วันละ +0–29%
    return Math.max(60, Math.round(avg * f / 5) * 5);
  }
  function rivalCheck() {
    var S = T(), tk = dayKey(), today = S.today && S.today.key === tk ? S.today.exp : 0;
    var R = J('rz_rival_v1', { wins: 0, day: '' });
    if (R.day === tk) return;
    if (today >= rivalTarget()) {
      R.day = tk; R.wins = (R.wins || 0) + 1; ls('rz_rival_v1', JSON.stringify(R));
      whenClear(function () {
        if (window.RZPOKE) window.RZPOKE.celebrate('คุณชนะคู่แข่ง ' + RIVAL + '!', 'EXP วันนี้แซงเป้าของ' + RIVAL + 'แล้ว · ชนะรวม ' + R.wins + ' ครั้ง');
        gain(30, 'rival');
        say(RIVAL + ' บอกว่า "พรุ่งนี้ไม่ยอมแพ้หรอก!"');
      });
    }
  }
  window.addEventListener('rz:gain', function (e) { if (!/^rival/.test((e.detail || {}).cat || '')) setTimeout(rivalCheck, 500); });

  /* ================= 5) ฉายา ================= */
  function title() {
    var L = lvl(), g = Object.keys(gymState()).length;
    if (g >= 8) return '👑 แชมเปี้ยน';
    if (g >= 6 || L >= 60) return '💎 Elite Four';
    if (g >= 4 || L >= 40) return '🏆 ยอดเทรนเนอร์';
    if (g >= 2 || L >= 25) return '⭐ นักล่ายิม';
    if (L >= 10) return '📦 นักตรวจสต็อก';
    if (L >= 5) return '🎒 เทรนเนอร์ฝึกหัด';
    return '🌱 มือใหม่';
  }

  /* ================= 6) Mystery Gift ================= */
  var ACC_POOL = ['hat', 'scarf', 'shades', 'crown', 'halo'];
  function giftCheck() {
    if (ls('rz_gift_day') === dayKey()) return;
    whenClear(function () { if (ls('rz_gift_day') !== dayKey()) giftScene(); });
  }
  function giftScene() {
    ls('rz_gift_day', dayKey());
    var ov = el('div', 'rz-gift', '<div class="rz-gift-box"><i class="lid"></i><i class="box"></i><i class="ribbon"></i></div><div class="rz-gift-txt"><small>MYSTERY GIFT</small><b>มีของขวัญมาส่ง!</b><span>คลิกกล่องเพื่อเปิด</span></div>');
    document.body.appendChild(ov);
    sfx('ok');
    var opened = false;
    ov.addEventListener('click', function () {
      if (opened) { ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 400); return; }
      opened = true;
      ov.classList.add('is-open');
      sfx('open');
      var r = Math.random(), gifted = J('rz_acc_gift', []), msg;
      var locked = ACC_POOL.filter(function (a) { return gifted.indexOf(a) < 0; });
      if (r < 0.15 && locked.length) {
        var a = locked[Math.floor(Math.random() * locked.length)];
        gifted.push(a); ls('rz_acc_gift', JSON.stringify(gifted));
        msg = '👗 ของแต่งคู่หูหายาก: ' + { hat: '🎩 หมวก', scarf: '🧣 ผ้าพันคอ', shades: '🕶️ แว่นกันแดด', crown: '👑 มงกุฎ', halo: '😇 วงแหวนแสง' }[a] + ' (ใส่ได้เลยในบัตรเทรนเนอร์)';
      } else if (r < 0.4) {
        ls('rz_shiny_ticket', dayKey()); window.RZ_SHINY_RATE = 1 / 25;
        msg = '🎫 ตั๋วไชนี่! วันนี้โอกาสเจอ RAYQUAZA ไชนี่สูงขึ้นมาก';
      } else {
        var x = 20 + Math.floor(Math.random() * 7) * 10;
        gain(x, 'gift');
        msg = '✨ ได้ ' + x + ' EXP';
      }
      ov.querySelector('.rz-gift-txt').innerHTML = '<small>MYSTERY GIFT</small><b>' + esc(msg) + '</b><span>คลิกเพื่อปิด</span>';
      var A = window.RZFX; if (A && A.burst) A.burst(innerWidth / 2, innerHeight / 2 - 40);
    });
  }
  if (ls('rz_shiny_ticket') === dayKey()) window.RZ_SHINY_RATE = 1 / 25;

  /* ================= 7) ไข่มังกร ================= */
  var EGG_NEED = 100;
  function egg() { return J('rz_egg_v1', { prog: 0, hatched: 0, baby: '' }); }
  window.addEventListener('rz:gain', function (e) {
    var c = (e.detail || {}).cat || '';
    if (/^checkin|^egg|^gift|^gym-|^rival|^quest|^combo|^shinyexp|^center/.test(c)) return;
    var E = egg(); E.prog++;
    if (E.prog === 50 || E.prog === 80) setTimeout(function () { toast('🥚 ไข่มังกรขยับ… ' + (E.prog === 80 ? 'มีเสียงดังจากข้างใน!' : 'เปลือกเริ่มร้าว!'), ''); }, 1200);
    if (E.prog >= EGG_NEED) {
      E.prog = 0; E.hatched++; E.baby = 'baby-' + E.hatched + '-' + Date.now().toString(36);
      ls('rz_egg_v1', JSON.stringify(E));
      whenClear(function () { hatch(E); });
      return;
    }
    ls('rz_egg_v1', JSON.stringify(E));
  });
  function hatch(E) {
    var ov = el('div', 'rz-gift rz-hatch', '<div class="rz-egg"><i></i></div><div class="rz-hatch-baby"></div><div class="rz-gift-txt"><small>OH?</small><b>ไข่มังกรกำลังจะฟัก!</b><span></span></div>');
    if (window.RZDEX && window.RZDEX.sprite) ov.querySelector('.rz-hatch-baby').appendChild(window.RZDEX.sprite(E.baby));
    document.body.appendChild(ov);
    sfx('shake'); setTimeout(function () { sfx('shake'); }, 700); setTimeout(function () { sfx('shake'); }, 1400);
    setTimeout(function () {
      ov.classList.add('is-hatched'); sfx('fanfare');
      ov.querySelector('.rz-gift-txt').innerHTML = '<small>CONGRATULATIONS!</small><b>ลูกมังกรตัวที่ ' + E.hatched + ' ฟักออกมาแล้ว!</b><span>จะเดินเล่นอยู่ข้างคู่หู RAYQUAZA · คลิกเพื่อปิด</span>';
      gain(50, 'egg');
      paintBaby();
    }, 2300);
    ov.addEventListener('click', function () { if (ov.classList.contains('is-hatched')) { ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 400); } });
  }
  function paintBaby() {
    var b = document.querySelector('.rz-buddy'), E = egg();
    if (!b || !E.baby || !window.RZDEX || !window.RZDEX.sprite) return;
    var x = b.querySelector('.rz-baby');
    if (x && x.dataset.id === E.baby) return;
    if (x) x.remove();
    x = el('span', 'rz-baby'); x.dataset.id = E.baby; x.title = 'ลูกมังกรตัวที่ ' + E.hatched;
    x.appendChild(window.RZDEX.sprite(E.baby));
    b.appendChild(x);
  }

  /* ================= 8) ศูนย์โปเกมอน ================= */
  var activeMs = Number(ls('rz_active_ms') || 0), lastAct = Date.now(), lastTick = Date.now(), snoozeTo = 0;
  ['pointerdown', 'keydown', 'wheel'].forEach(function (ev) { window.addEventListener(ev, function () { lastAct = Date.now(); }, { passive: true, capture: true }); });
  setInterval(function () {
    var now = Date.now();
    // นับเวลาทำงานเฉพาะช่วงที่ใช้งานจริง (มีการกด/พิมพ์ใน 5 นาทีล่าสุด) · หยุดไป 15 นาที = นับใหม่
    if (now - lastAct < 5 * 60000 && !document.hidden) activeMs += now - lastTick;
    if (now - lastAct > 15 * 60000) activeMs = 0;
    lastTick = now;
    ls('rz_active_ms', String(activeMs));
    if (activeMs >= 2 * 3600000 && now > snoozeTo && fxOn() && !root.classList.contains('rz-focus') && !overlayBusy() && !document.querySelector('.rz-charge.is-on:not(.is-done)')) center();
  }, 30000);
  function center() {
    var spr = root.getAttribute('data-prod-theme') === 'light' ? 'img/rayquaza-mega.png?v=1' : 'img/rayquaza-shiny.png?v=2';
    var ov = el('div', 'rz-center', '<div class="rz-cn-card"><img alt="" src="' + spr + '"><small>POKÉMON CENTER</small><b>RAYQUAZA เหนื่อยแล้ว…</b><p>ทำงานต่อเนื่องมา 2 ชั่วโมงแล้ว พาไปศูนย์โปเกมอนพัก 5 นาทีกันไหม? ลุกยืดเส้น ดื่มน้ำ พักสายตา 👀💧</p>' +
      '<div class="rz-cn-btns"><button type="button" data-a="rest">💚 ไปพัก 5 นาที</button><button type="button" data-a="later">ไว้ทีหลัง (30 นาที)</button></div></div>');
    document.body.appendChild(ov);
    sfx('ok');
    ov.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a');
      if (a === 'later') { snoozeTo = Date.now() + 30 * 60000; ov.remove(); }
      if (a === 'rest') rest(ov);
      if (a === 'done') finishRest(ov);
    });
  }
  var restStart = 0, restT = 0;
  function rest(ov) {
    restStart = Date.now();
    ov.classList.add('is-rest');
    var card = ov.querySelector('.rz-cn-card');
    card.innerHTML = '<div class="rz-cn-tray"><i></i><i></i><i></i><i></i><i></i><i></i></div><small>POKÉMON CENTER</small><b>กำลังฟื้นพลัง…</b><div class="rz-cn-time">5:00</div><p>ลุกขึ้นยืดเส้น มองไกลๆ ดื่มน้ำ แล้วกลับมาลุยต่อ</p><div class="rz-cn-btns"><button type="button" data-a="done">✔ พักเสร็จแล้ว</button></div>';
    healJingle();
    restT = setInterval(function () {
      var left = Math.max(0, 300 - Math.floor((Date.now() - restStart) / 1000));
      var t = card.querySelector('.rz-cn-time'); if (t) t.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2);
      if (!left) finishRest(ov);
    }, 1000);
  }
  function finishRest(ov) {
    clearInterval(restT);
    var mins = (Date.now() - restStart) / 60000;
    activeMs = 0; ls('rz_active_ms', '0');
    ov.remove();
    if (mins >= 3) { gain(20, 'center'); toast('💚 RAYQUAZA ฟื้นพลังเต็มแล้ว! ขอบคุณที่พักนะ (+20 EXP)', 'success'); }
    else toast('💚 กลับมาแล้ว! คราวหน้าพักให้ครบสักหน่อยนะ', '');
    say('พลังเต็มแล้ว! ลุยต่อ!');
  }
  // เพลงฟื้นพลังสั้นๆ (แต่งเอง)
  function healJingle() {
    if (ls('rz_sound_v1') !== '1') return;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    var a = new C(), notes = [72, 76, 79, 84, 79, 84], t0 = a.currentTime + 0.05;
    notes.forEach(function (m, i) {
      var o = a.createOscillator(), g = a.createGain();
      o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
      var t = t0 + i * 0.16, d = i === notes.length - 1 ? 0.6 : 0.15;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(window.RZVOL ? window.RZVOL.out(a) : a.destination); o.start(t); o.stop(t + d + 0.05);
    });
    setTimeout(function () { a.close(); }, 2500);
  }

  /* ================= 9) ท่าโจมตีตอนคลิก ================= */
  var MOVES = [
    ['none', '✦', 'ปกติ', 1], ['thunder', '⚡', 'สายฟ้า', 5], ['flame', '🔥', 'พ่นไฟ', 10],
    ['ice', '❄️', 'ลำแสงน้ำแข็ง', 15], ['pulse', '🌀', 'Dragon Pulse', 20], ['hyper', '🌈', 'ไฮเปอร์', 30]
  ];
  function move() { var m = ls('rz_move') || 'none', def = MOVES.filter(function (x) { return x[0] === m; })[0]; return def && def[3] <= lvl() ? m : 'none'; }
  window.addEventListener('pointerdown', function (e) {
    var m = move();
    if (m === 'none' || !fxOn() || root.classList.contains('rz-focus') || e.button !== 0) return;
    if (e.target.closest && e.target.closest('input, textarea, select, .rz-lock')) return;
    var fx = el('i', 'rz-move is-' + m);
    fx.style.left = e.clientX + 'px'; fx.style.top = e.clientY + 'px';
    var n = m === 'thunder' ? 5 : m === 'pulse' ? 3 : 8;
    for (var i = 0; i < n; i++) {
      var p = el('b'); var a = i / n * 360;
      p.style.setProperty('--a', a + 'deg');
      p.style.setProperty('--d', (24 + Math.random() * 26) + 'px');
      fx.appendChild(p);
    }
    document.body.appendChild(fx);
    setTimeout(function () { fx.remove(); }, 700);
  }, { capture: true, passive: true });

  /* ================= 10) เสียงร้องคู่หู ================= */
  var cryCtx = null;
  window.addEventListener('rz:pet', function (e) {
    if (ls('rz_sound_v1') !== '1') return;
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    cryCtx = cryCtx || new C();
    if (cryCtx.state === 'suspended') cryCtx.resume();
    var fr = (e.detail && e.detail.fr) || 0, a = cryCtx, t = a.currentTime + 0.02;
    var base = 220 + Math.min(fr, 150) * 1.2;            // สนิทมาก = เสียงสูงสดใสขึ้น
    var o = a.createOscillator(), o2 = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain(), f = a.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'square';
    o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 1.9, t + 0.12); o.frequency.exponentialRampToValueAtTime(base * 0.8, t + 0.55);
    o2.frequency.setValueAtTime(base * 1.5, t); o2.frequency.exponentialRampToValueAtTime(base * 1.2, t + 0.55);
    lfo.frequency.value = fr > 50 ? 9 : 22; lg.gain.value = base * 0.06;   // สั่นเสียงคำราม (สนิทมาก = สั่นน้อยลง)
    lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'lowpass'; f.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(window.RZVOL ? window.RZVOL.out(a) : a.destination);
    [o, o2, lfo].forEach(function (x) { x.start(t); x.stop(t + 0.65); });
  });

  /* ================= ส่วนเสริมในบัตรเทรนเนอร์ ================= */
  window.addEventListener('rz:card', function (e) {
    var card = e.detail && e.detail.el; if (!card) return;
    // ฉายาใต้ชื่อ
    var nm = card.querySelector('.rz-tc-name');
    if (nm) nm.insertAdjacentHTML('afterend', '<div class="rz-tc-title">' + title() + '</div>');
    var anchor = card.querySelector('.rz-tc-badges');
    if (!anchor) return;
    // คู่แข่ง
    var S = T(), tk = dayKey(), today = S.today && S.today.key === tk ? S.today.exp : 0, tgt = rivalTarget(), R = J('rz_rival_v1', { wins: 0 });
    var riv = el('section', 'rz-tc-rival', '<h5>⚔️ คู่แข่งวันนี้: ' + RIVAL + ' <small>ชนะแล้ว ' + (R.wins || 0) + ' ครั้ง</small></h5>' +
      '<div class="rz-rv"><span>คุณ</span><i><em style="width:' + Math.min(100, today / tgt * 100).toFixed(0) + '%"></em></i><b>' + fmt(today) + '</b></div>' +
      '<div class="rz-rv is-rival"><span>' + RIVAL + '</span><i><em style="width:100%"></em></i><b>' + fmt(tgt) + '</b></div>' +
      '<p>' + (R.day === tk ? '🏆 วันนี้ชนะ' + RIVAL + 'แล้ว!' : 'ทำ EXP วันนี้ให้เกิน ' + fmt(tgt) + ' เพื่อชนะ') + '</p>');
    // ยิม
    var G = gymState();
    var gym = el('section', 'rz-tc-gyms', '<h5>🏟️ เข็มกลัดยิม <small>' + Object.keys(G).length + ' / 8</small></h5><div class="rz-gym-case">' + GYMS.map(function (g) {
      var on = !!G[g[0]];
      return '<div class="rz-gym' + (on ? ' is-on' : '') + '" title="' + esc(g[2] + ' — ' + g[3]) + '"><i>' + (on ? g[1] : '?') + '</i><span>' + esc(g[2]) + '</span></div>';
    }).join('') + '</div>');
    // ไข่มังกร
    var E = egg();
    var eg = el('section', 'rz-tc-egg', '<h5>🥚 ไข่มังกร <small>ฟักแล้ว ' + (E.hatched || 0) + ' ตัว</small></h5><div class="rz-egg-row"><span class="rz-egg-ico' + (E.prog >= 80 ? ' crack2' : E.prog >= 50 ? ' crack1' : '') + '">🥚</span><i><em style="width:' + E.prog + '%"></em></i><b>' + E.prog + '/' + EGG_NEED + ' งาน</b></div>');
    // ท่าโจมตีตอนคลิก
    var L = lvl(), cur = move();
    var mv = el('section', 'rz-tc-moves', '<h5>💥 ท่าตอนคลิก <small>ปลดล็อกตามเลเวล</small></h5><div class="rz-wd">' + MOVES.map(function (m) {
      var lock = m[3] > L;
      return '<button type="button" data-move="' + m[0] + '"' + (lock ? ' disabled' : '') + ' class="' + (cur === m[0] ? 'is-on' : '') + '"><i>' + (lock ? '🔒' : m[1]) + '</i><span>' + (lock ? 'Lv.' + m[3] : m[2]) + '</span></button>';
    }).join('') + '</div>');
    mv.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-move]'); if (!b || b.disabled) return;
      ls('rz_move', b.dataset.move);
      mv.querySelectorAll('[data-move]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
    });
    [riv, gym, eg, mv].forEach(function (s) { anchor.parentNode.insertBefore(s, anchor); });
  });

  function init() {
    addMapButton();
    setTimeout(checkGyms, 4000);
    setTimeout(giftCheck, 9000);
    var tryBaby = function () { paintBaby(); if (!document.querySelector('.rz-baby') && egg().baby) setTimeout(tryBaby, 2000); };
    setTimeout(tryBaby, 1500);
    window.RZADV = { map: openMap, gift: giftScene, center: center, hatch: function () { var E = egg(); E.hatched++; E.baby = 'baby-' + E.hatched + '-' + Date.now().toString(36); ls('rz_egg_v1', JSON.stringify(E)); hatch(E); }, catchScene: catchScene, title: title, rivalTarget: rivalTarget, gyms: checkGyms };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
