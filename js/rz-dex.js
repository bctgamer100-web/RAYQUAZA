// RAYQUAZA DEX — ดับเบิลคลิก SKU ในตารางไหนก็ได้ = เปิดการ์ดสินค้าแบบ Pokédex (คู่กับ css/rz-buddy.css)
//  - ข้อมูลมาจากแถวที่คลิก (ทุกคอลัมน์ที่เป็นตัวเลข = ค่าพลังเทียบกับค่าสูงสุดในตารางนั้น) + ผลตรวจ ORDER กับ Stock ล่าสุด (ถ้ามี)
//  - รูปสัตว์ประจำ SKU สร้างจากรหัสสินค้า (รหัสเดียวกันได้รูปเดียวกันเสมอ) · ธาตุจากยี่ห้อ + สถานะสต็อก
//  - นับจำนวน SKU ที่เคยเปิดดู ("พบแล้ว") เก็บในเบราว์เซอร์
(function () {
  'use strict';

  var SEEN_KEY = 'rz_dex_seen_v1';
  var TYPES = [
    ['NORMAL', '#a8a878'], ['FIRE', '#f08030'], ['WATER', '#6890f0'], ['GRASS', '#78c850'], ['ELECTRIC', '#f8d030'], ['ICE', '#98d8d8'],
    ['FIGHTING', '#c03028'], ['POISON', '#a040a0'], ['GROUND', '#e0c068'], ['FLYING', '#a890f0'], ['PSYCHIC', '#f85888'], ['BUG', '#a8b820'],
    ['ROCK', '#b8a038'], ['GHOST', '#705898'], ['DRAGON', '#7038f8'], ['DARK', '#705848'], ['STEEL', '#b8b8d0'], ['FAIRY', '#ee99ac']
  ];
  var FLAVOR = [
    'ว่ากันว่าถ้าวางผิดตำแหน่ง มันจะหายตัวไปในพริบตา',
    'ชอบอยู่รวมกันเป็นฝูงบนชั้นวาง ยิ่งใกล้วันโปรยิ่งตื่นตัว',
    'เมื่อถูกสแกนบาร์โค้ด จะส่งเสียง "บี๊บ" อย่างพอใจ',
    'นิสัยขี้อาย มักซ่อนตัวอยู่หลังกล่องใบอื่นในลัง',
    'มีข่าวลือว่าถ้านับสต็อกตอนเที่ยงคืน จำนวนจะไม่ตรงเสมอ',
    'เดินทางไกลได้วันละหลายร้อยกิโลด้วยรถขนส่ง',
    'ถ้าดูแลดี จะอยู่ในสภาพสมบูรณ์จนถึงมือลูกค้า',
    'เป็นที่ต้องการตัวสูงในช่วงปลายเดือน'
  ];
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(t) { var m = /^\s*-?[\d,]+(\.\d+)?\s*$/.exec(t || ''); return m ? parseFloat(t.replace(/,/g, '')) : null; }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }

  /* ---------- รูปสัตว์ประจำ SKU (พิกเซลสมมาตร 12×12 สร้างจากรหัส) ---------- */
  function sprite(sku, c1, c2) {
    var cv = document.createElement('canvas');
    var N = 12, S = 8;
    cv.width = cv.height = N * S;
    var g = cv.getContext('2d'), h = hash(sku), rnd = function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    var grid = [];
    for (var y = 0; y < N; y++) {
      grid.push([]);
      for (var x = 0; x < N / 2; x++) {
        var dx = (N / 2 - x) / (N / 2), dy = Math.abs(y - N / 2) / (N / 2);
        var p = 0.95 - dx * 0.55 - dy * 0.5;           // ตรงกลางมีโอกาสเป็นตัวมากกว่า
        grid[y][x] = rnd() < p ? (rnd() < 0.3 ? 2 : 1) : 0;
      }
    }
    // ทำเต็มกริด (สะท้อนซ้าย-ขวา) แล้วเติมขอบดำรอบตัว
    var full = [];
    for (var yy = 0; yy < N; yy++) {
      full.push([]);
      for (var xx = 0; xx < N; xx++) full[yy][xx] = grid[yy][xx < N / 2 ? xx : N - 1 - xx];
    }
    var cols = [null, c1, c2, '#1a1614'];
    for (var y2 = 0; y2 < N; y2++) {
      for (var x2 = 0; x2 < N; x2++) {
        if (full[y2][x2]) continue;
        var near = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(function (d) { var r = full[y2 + d[0]]; return r && r[x2 + d[1]] && r[x2 + d[1]] !== 3; });
        if (near) full[y2][x2] = 4; // ขอบ (ใส่ทีหลัง ไม่ให้นับเป็นตัว)
      }
    }
    for (var y3 = 0; y3 < N; y3++) {
      for (var x3 = 0; x3 < N; x3++) {
        var v = full[y3][x3];
        if (!v) continue;
        g.fillStyle = v === 4 ? '#1a1614' : cols[v];
        g.fillRect(x3 * S, y3 * S, S, S);
      }
    }
    var ey = 3 + Math.floor(rnd() * 3);
    g.fillStyle = '#ffffff'; g.fillRect(3 * S, ey * S, S * 1.5, S * 1.5); g.fillRect((N - 4.5) * S, ey * S, S * 1.5, S * 1.5);
    g.fillStyle = '#1a1614'; g.fillRect(3.5 * S, (ey + 0.5) * S, S * 0.8, S * 0.8); g.fillRect((N - 4) * S, (ey + 0.5) * S, S * 0.8, S * 0.8);
    return cv;
  }

  /* ---------- อ่านข้อมูลจากตาราง ---------- */
  function headersOf(table) {
    var row = (table.tHead && table.tHead.rows[0]) || table.querySelector('tr');
    return row ? Array.prototype.map.call(row.cells, function (c) { return (c.textContent || '').trim(); }) : [];
  }
  function skuIndex(heads) {
    for (var i = 0; i < heads.length; i++) if (/sku|รหัส/i.test(heads[i])) return i;
    return -1;
  }
  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9฀-๿]/g, ''); } // ไม่สนขีด/ช่องว่าง (สั่งด้วยเสียงพูดขีดไม่ได้)
  function brandOf(sku) { var m = /^([A-Za-z]+)/.exec(sku) || /^([^-\s]+)/.exec(sku); return m ? m[1].toUpperCase() : sku; }
  function compareItem(sku) {
    try {
      if (typeof compareResults === 'undefined' || !compareResults.length) return null; // eslint-disable-line no-undef
      var k = norm(sku);
      return compareResults.find(function (x) { return norm(x.sku) === k; }) || null; // eslint-disable-line no-undef
    } catch (e) { return null; }
  }

  var ov = null;
  function open(sku, table, tr) {
    close();
    sku = String(sku).trim();
    var heads = table ? headersOf(table) : [], cells = tr ? Array.prototype.map.call(tr.cells, function (c) { return (c.textContent || '').trim(); }) : [];
    // ค่าพลัง: คอลัมน์ตัวเลข เทียบกับค่าสูงสุดของคอลัมน์ในตาราง (ดูไม่เกิน 600 แถว)
    var stats = [];
    if (table && tr) {
      var rows = Array.prototype.slice.call((table.tBodies[0] || table).rows, 0, 600);
      heads.forEach(function (hd, i) {
        var v = num(cells[i]);
        if (v === null || !hd || /^#|ลำดับ|no\.?$/i.test(hd)) return;
        var max = 0;
        rows.forEach(function (r) { var x = r.cells[i] && num(r.cells[i].textContent); if (x !== null && Math.abs(x) > max) max = Math.abs(x); });
        stats.push([hd, v, max ? Math.abs(v) / max : 0]);
      });
    }
    var it = compareItem(sku);
    var h = hash(sku);
    var t1 = TYPES[hash(brandOf(sku)) % TYPES.length];
    var t2 = it ? (/^✅/.test(it.status) ? TYPES[3] : /^⚠️/.test(it.status) ? TYPES[4] : /^❌/.test(it.status) ? TYPES[1] : null) : null;
    if (t2 && t2[0] === t1[0]) t2 = null;
    var no = ('00' + (h % 999 + 1)).slice(-3);

    var seen = {};
    try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (e) { /* ข้าม */ }
    var isNew = !seen[sku];
    try { window.dispatchEvent(new CustomEvent('rz:dex', { detail: { sku: sku, isNew: isNew } })); } catch (e) { /* ข้าม */ }
    seen[sku] = 1;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* ข้าม */ }
    var seenN = Object.keys(seen).length;

    var desc = [];
    desc.push('สินค้ารหัส ' + sku + ' ของยี่ห้อ ' + brandOf(sku) + '.');
    if (it) {
      desc.push('มีสต็อก ' + fmt(it.stockQty) + ' ชิ้น' + (it.locations ? ' พบได้ที่ ' + it.locations : '') + '.');
      desc.push('ORDER ต้องการ ' + fmt(it.orderShown || it.orderQty) + ' ชิ้น — ' + it.status.replace(/^\S+\s*/, '') + '.');
      if (it.stockSku) desc.push('เบิกแทนด้วยรหัสคู่ ' + it.stockSku + '.');
    }
    desc.push(FLAVOR[h % FLAVOR.length] + '.');

    if (it) {
      var mx = Math.max(it.stockQty, it.orderQty, 1);
      stats.unshift(['สต็อก', it.stockQty, it.stockQty / mx], ['ORDER', it.orderQty, it.orderQty / mx]);
    }
    var statHtml = stats.slice(0, 7).map(function (s) {
      return '<div class="rz-dex-stat"><span>' + esc(s[0]) + '</span><b>' + fmt(s[1]) + '</b><i><em style="width:' + Math.max(3, Math.min(100, s[2] * 100)).toFixed(0) + '%"></em></i></div>';
    }).join('') || '<p class="rz-dex-none">ไม่มีค่าตัวเลขในแถวนี้</p>';
    var type = function (t) { return t ? '<i class="rz-type" style="background:' + t[1] + '">' + t[0] + '</i>' : ''; };

    ov = document.createElement('div');
    ov.className = 'rz-dex-ov';
    ov.innerHTML =
      '<div class="rz-dex" role="dialog" aria-label="Pokédex ' + esc(sku) + '">' +
      '<div class="rz-dex-top"><span class="rz-dex-lens"></span><span class="rz-dex-led r"></span><span class="rz-dex-led y"></span><span class="rz-dex-led g"></span>' +
      '<b>RZ-DEX</b><span class="rz-dex-seen">พบแล้ว ' + fmt(seenN) + ' SKU</span><button type="button" class="rz-dex-x" aria-label="ปิด">×</button></div>' +
      '<div class="rz-dex-body">' +
      '<div class="rz-dex-screen"><div class="rz-dex-mon"></div><div class="rz-dex-no">No.' + no + (isNew ? ' <em>NEW!</em>' : '') + '</div></div>' +
      '<div class="rz-dex-info"><h3>' + esc(sku) + '</h3><div class="rz-dex-types">' + type(t1) + type(t2) + '</div>' +
      '<div class="rz-dex-stats">' + statHtml + '</div></div>' +
      '</div>' +
      '<p class="rz-dex-desc">' + esc(desc.join(' ')) + '</p>' +
      '</div>';
    ov.querySelector('.rz-dex-mon').appendChild(sprite(sku, t1[1], t2 ? t2[1] : '#ffffff'));
    document.body.appendChild(ov);
    if (window.RZPOKE) window.RZPOKE.sfx(isNew ? 'ok' : 'click');
    if (isNew && window.RZBUDDY && seenN % 10 === 0) window.RZBUDDY.say('บันทึกลง RZ-DEX แล้ว ' + seenN + ' SKU!');
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.rz-dex-x')) close(); });
    document.addEventListener('keydown', onKey, true);
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
  function close() {
    if (!ov) return;
    var o = ov; ov = null;
    document.removeEventListener('keydown', onKey, true);
    o.classList.add('is-out');
    setTimeout(function () { o.remove(); }, 220);
  }

  document.addEventListener('dblclick', function (e) {
    var td = e.target.closest && e.target.closest('td');
    if (!td || e.target.closest('input, textarea, select, button, a')) return;
    var table = td.closest('table'), tr = td.closest('tr');
    if (!table || !tr) return;
    var heads = headersOf(table), i = skuIndex(heads);
    var sku = (i >= 0 && tr.cells[i] ? tr.cells[i].textContent : td.textContent || '').trim();
    if (!sku || sku === '-' || sku.length > 60) return;
    if (window.getSelection) try { window.getSelection().removeAllRanges(); } catch (er) { /* ข้าม */ }
    open(sku, table, tr);
  });

  // ให้โมดูลอื่น (rz-adventure.js) ใช้รูปพิกเซล/ธาตุเดียวกับการ์ด
  function spriteFor(sku) {
    var t1 = TYPES[hash(brandOf(sku)) % TYPES.length];
    return sprite(String(sku), t1[1], '#ffffff');
  }
  window.RZDEX = {
    sprite: spriteFor,
    open: function (sku) {
      // หาแถวของ SKU นี้ในตารางที่เห็นอยู่ (ถ้ามี) เพื่อดึงค่าพลัง
      var tds = document.querySelectorAll('td'), k = norm(sku);
      for (var i = 0; i < tds.length; i++) {
        if (tds[i].offsetParent && norm(tds[i].textContent) === k) return open((tds[i].textContent || '').trim(), tds[i].closest('table'), tds[i].closest('tr'));
      }
      var it = compareItem(sku);
      open(it ? it.sku : sku, null, null);
    }
  };
})();
