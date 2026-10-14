// RAYQUAZA PROGRESS — ภารกิจประจำวัน · ปฏิทินสถิติ · บอสประจำสัปดาห์ · สรุปประจำสัปดาห์ (คู่กับ css/rz-extra.css)
//  - ภารกิจ: สุ่มวันละ 3 ข้อ (ทุกเครื่องได้ชุดเดียวกันในวันเดียวกัน) ทำครบข้อละ +30 EXP ครบทั้ง 3 = +50 EXP และได้ ⭐ ดาวภารกิจ
//  - ปฏิทินสถิติ: ช่องสีตามจำนวนงานแต่ละวัน 26 สัปดาห์ล่าสุด (ในบัตรเทรนเนอร์)
//  - บอสประจำสัปดาห์: SKU ที่ขาด/ไม่มีสต็อกบ่อยที่สุดในสัปดาห์ (นับจากผลตรวจ ORDER กับ Stock) แสดงบนแบนเนอร์หน้าตรวจ
//  - สรุปประจำสัปดาห์: ขึ้นเองวันศุกร์หลัง 16:00 (หรือกดจากบัตรเทรนเนอร์) เป็นรูปภาพ ดาวน์โหลด/คัดลอกไปแชร์ได้
// ข้อมูลทั้งหมดเก็บในเบราว์เซอร์เครื่องนี้
(function () {
  'use strict';

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function T() { return window.RZTRAINER ? window.RZTRAINER.state() : null; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function monday(d) { d = new Date(d || Date.now()); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; }
  function weekKey(d) { return dayKey(monday(d)); } // วันจันทร์ของสัปดาห์

  /* ================= ภารกิจประจำวัน ================= */
  var POOL = [
    ['compare', 'ตรวจ ORDER กับ Stock {n} รอบ', [2, 3, 5]],
    ['print', 'ปริ้นใบงาน {n} ครั้ง', [3, 5, 10]],
    ['download', 'ดาวน์โหลดไฟล์ {n} ครั้ง', [2, 4]],
    ['upload', 'อัปโหลด/นำเข้าข้อมูล {n} ครั้ง', [1, 2]],
    ['allok', 'ตรวจแล้วสต็อกพอครบทุก SKU {n} รอบ', [1]],
    ['skus', 'ตรวจรวม {n} SKU', [100, 300, 800]],
    ['dex', 'เปิด RZ-DEX ดู {n} SKU', [3, 5]],
    ['pet', 'ลูบหัวคู่หู RAYQUAZA {n} ครั้ง', [5, 10]],
    ['combo', 'ทำคอมโบให้ถึง ×{n}', [3, 5]],
    ['tasks', 'ทำงานให้ครบ {n} ชิ้น', [10, 20]]
  ];
  var Q = null;
  function loadQ() {
    var k = dayKey();
    try { Q = JSON.parse(ls('rz_quests_v1') || 'null'); } catch (e) { Q = null; }
    var stars = Q ? Q.stars || 0 : 0;
    if (!Q || Q.day !== k) {
      // สุ่มจากวันที่: 3 ข้อไม่ซ้ำ
      var h = hash(k), pool = POOL.slice(), list = [];
      while (list.length < 3) {
        var i = h % pool.length; h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0;
        var p = pool.splice(i, 1)[0];
        var n = p[2][h % p[2].length];
        list.push({ id: p[0], text: p[1].replace('{n}', fmt(n)), target: n, prog: 0, done: false });
      }
      Q = { day: k, list: list, stars: stars, bonus: false };
      saveQ();
    }
  }
  function saveQ() { ls('rz_quests_v1', JSON.stringify(Q)); paintPill(); }
  function bump(id, amount, absolute) {
    loadQ();
    var changed = false;
    Q.list.forEach(function (q) {
      if (q.id !== id || q.done) return;
      var v = absolute ? Math.max(q.prog, amount) : q.prog + (amount || 1);
      if (v === q.prog) return;
      q.prog = Math.min(q.target, v);
      changed = true;
      if (q.prog >= q.target) {
        q.done = true;
        setTimeout(function () {
          toast('📜 ภารกิจสำเร็จ: ' + q.text + '! (+30 EXP)', 'success');
          if (window.RZTRAINER) window.RZTRAINER.gain(30, 'quest-' + q.id);
          if (window.RZBUDDY) window.RZBUDDY.say('ภารกิจเสร็จไปอีกข้อ! ✔');
        }, 400);
      }
    });
    if (!changed) return;
    if (!Q.bonus && Q.list.every(function (q) { return q.done; })) {
      Q.bonus = true; Q.stars = (Q.stars || 0) + 1;
      setTimeout(function () {
        toast('⭐ ภารกิจประจำวันครบทั้ง 3 ข้อ! ได้ดาวภารกิจ (รวม ' + Q.stars + ' ดวง) +50 EXP', 'success');
        if (window.RZTRAINER) window.RZTRAINER.gain(50, 'quest-all');
        if (window.RZPOKE) window.RZPOKE.celebrate('ภารกิจประจำวันครบ!', 'ได้ดาวภารกิจ ⭐ ดวงที่ ' + Q.stars);
      }, 1800);
    }
    saveQ();
  }
  window.addEventListener('rz:gain', function (e) {
    var d = e.detail || {}, c = d.cat || '';
    if (/^quest|^checkin|^shinyexp|^combo|^meteor/.test(c)) { if (/^combo/.test(c) && window.RZEPIC) bump('combo', window.RZEPIC.combo(), true); return; }
    if (c === 'compare') { bump('compare'); if (d.extra && d.extra.skus) bump('skus', d.extra.skus); if (d.extra && d.extra.allOk) bump('allok'); }
    if (c === 'print' || c === 'download' || c === 'upload') bump(c);
    bump('tasks');
  });
  window.addEventListener('rz:dex', function (e) { if (e.detail && e.detail.isNew) bump('dex'); });
  window.addEventListener('rz:pet', function () { bump('pet'); });

  // ป้าย 📜 ข้างหลอด EXP
  function paintPill() {
    var exp = document.querySelector('.rz-exp');
    if (!exp || !Q) return;
    var p = exp.querySelector('.rz-qpill');
    if (!p) { p = el('span', 'rz-qpill'); exp.appendChild(p); }
    var done = Q.list.filter(function (q) { return q.done; }).length;
    p.textContent = '📜 ' + done + '/3';
    p.classList.toggle('is-done', done === 3);
    p.title = 'ภารกิจวันนี้: ' + Q.list.map(function (q) { return (q.done ? '✔ ' : '• ') + q.text + ' (' + fmt(q.prog) + '/' + fmt(q.target) + ')'; }).join('  ');
  }

  /* ================= บอสประจำสัปดาห์ ================= */
  function loadBoss() {
    var B = null;
    try { B = JSON.parse(ls('rz_boss_v1') || 'null'); } catch (e) { /* ข้าม */ }
    if (!B || B.week !== weekKey()) B = { week: weekKey(), counts: {}, prev: B && B.week !== weekKey() ? topOf(B) : (B && B.prev) || null };
    return B;
  }
  function topOf(B, n) {
    var arr = Object.keys(B.counts || {}).map(function (k) { return [k, B.counts[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    return n ? arr.slice(0, n) : (arr[0] || null);
  }
  window.addEventListener('rz:compare', function (e) {
    var d = e.detail || {};
    if (!d.total || (!d.short && !d.none)) { paintBoss(); return; }
    var B = loadBoss();
    try {
      // compareResults = ตัวแปรผลตรวจของ app.js (อ่านอย่างเดียว)
      (typeof compareResults !== 'undefined' ? compareResults : []).forEach(function (x) { // eslint-disable-line no-undef
        if (/^⚠️|^❌/.test(x.status)) B.counts[x.sku] = (B.counts[x.sku] || 0) + 1;
      });
    } catch (er) { /* ข้าม */ }
    ls('rz_boss_v1', JSON.stringify(B));
    paintBoss();
  });
  function paintBoss() {
    var hud = document.querySelector('#compareTool .rz-hero-hud');
    if (!hud) return;
    var B = loadBoss(), top = topOf(B);
    var chip = hud.querySelector('.rz-boss');
    if (!top) { if (chip) chip.remove(); return; }
    if (!chip) { chip = el('button', 'rz-boss'); chip.type = 'button'; hud.appendChild(chip); chip.addEventListener('click', function () { if (window.RZDEX) window.RZDEX.open(chip.dataset.sku); }); }
    chip.dataset.sku = top[0];
    chip.innerHTML = '<small>👹 บอสประจำสัปดาห์</small><b>' + esc(top[0]) + '</b><span>ขาด/ไม่มีสต็อก ' + top[1] + ' ครั้ง</span>';
    hud.classList.remove('is-empty');
  }

  /* ================= ปฏิทินสถิติ + ภารกิจ ในบัตรเทรนเนอร์ ================= */
  window.addEventListener('rz:card', function (e) {
    var card = e.detail && e.detail.el;
    if (!card) return;
    loadQ();
    var badges = card.querySelector('.rz-tc-badges');
    // ภารกิจวันนี้
    var qs = el('section', 'rz-tc-quests', '<h5>📜 ภารกิจวันนี้ <small>⭐ ดาวภารกิจ ' + (Q.stars || 0) + ' ดวง</small></h5>' + Q.list.map(function (q) {
      return '<div class="rz-q' + (q.done ? ' is-done' : '') + '"><span>' + (q.done ? '✔' : '•') + ' ' + esc(q.text) + '</span><i><em style="width:' + Math.round(q.prog / q.target * 100) + '%"></em></i><b>' + fmt(q.prog) + '/' + fmt(q.target) + '</b></div>';
    }).join(''));
    // ปฏิทิน 26 สัปดาห์
    var S = T() || {}, H = S.hist || {};
    var end = new Date(); end.setHours(0, 0, 0, 0);
    var start = monday(); start.setDate(start.getDate() - 25 * 7); // 26 สัปดาห์ เริ่มวันจันทร์
    var cells = '', max = 1, d = new Date(start);
    Object.keys(H).forEach(function (k) { if (H[k].t > max) max = H[k].t; });
    var active = 0, total = 0;
    while (d <= end) {
      var k = dayKey(d), v = H[k] ? H[k].t : 0;
      if (v) { active++; total += v; }
      var lv = v === 0 ? 0 : v <= max * 0.25 ? 1 : v <= max * 0.5 ? 2 : v <= max * 0.75 ? 3 : 4;
      cells += '<i class="l' + lv + '" title="' + d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' · ' + v + ' งาน"></i>';
      d.setDate(d.getDate() + 1);
    }
    var heat = el('section', 'rz-tc-heat', '<h5>🗓️ ปฏิทินสถิติ <small>26 สัปดาห์ · ทำงาน ' + active + ' วัน · ' + fmt(total) + ' งาน</small></h5><div class="rz-heat">' + cells + '</div>' +
      '<div class="rz-heat-key">น้อย <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> มาก</div>');
    if (badges) { badges.parentNode.insertBefore(qs, badges); badges.parentNode.insertBefore(heat, badges); }
    // ปุ่มสรุปสัปดาห์
    var foot = card.querySelector('.rz-tc-foot');
    if (foot) {
      var wb = el('button', 'rz-tc-week', '📈 สรุปสัปดาห์'); wb.type = 'button';
      wb.addEventListener('click', function () { var x = card.querySelector('.rz-tc-close'); if (x) x.click(); setTimeout(weekly, 280); });
      foot.insertBefore(wb, foot.firstChild);
    }
  });

  /* ================= สรุปประจำสัปดาห์ (รูปภาพ) ================= */
  function weekData() {
    var S = T() || {}, H = S.hist || {}, days = [], ws = monday();
    var t = 0, s = 0, ex = 0;
    for (var i = 0; i < 7; i++) {
      var d = new Date(ws); d.setDate(ws.getDate() + i);
      var h = H[dayKey(d)] || { t: 0, s: 0, e: 0 };
      days.push([d, h]); t += h.t; s += h.s; ex += h.e;
    }
    var B = loadBoss();
    return { days: days, tasks: t, skus: s, exp: ex, boss: topOf(B, 5), S: S };
  }
  function drawReport(cv) {
    var D = weekData(), g = cv.getContext('2d'), W = 1080, H = 1350;
    cv.width = W; cv.height = H;
    var day = document.documentElement.getAttribute('data-prod-theme') === 'light';
    var bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, day ? '#1f7a65' : '#1a0d10'); bg.addColorStop(1, day ? '#0d3a30' : '#050406');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var A = day ? '#ffd24a' : '#ffd34d', B2 = day ? '#f3a35a' : '#ff8a3d', TR = day ? '#c8a35a' : '#e0301e';
    g.strokeStyle = TR; g.lineWidth = 6; g.strokeRect(24, 24, W - 48, H - 48);
    var font = function (w, sz) { return w + ' ' + sz + 'px "Chakra Petch", "Bai Jamjuree", "Leelawadee UI", Tahoma, sans-serif'; };
    g.fillStyle = A; g.font = font(700, 30); g.fillText('RAYQUAZA · WEEKLY REPORT', 70, 100);
    var d0 = D.days[0][0], d6 = D.days[6][0];
    var rng = d0.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' – ' + d6.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    g.fillStyle = '#fff'; g.font = font(700, 64); g.fillText('สรุปประจำสัปดาห์', 70, 180);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = font(500, 32); g.fillText(rng + ' · ' + (D.S.name || 'เทรนเนอร์'), 70, 230);
    // ตัวเลขหลัก
    var stats = [['งาน', D.tasks], ['SKU ที่ตรวจ', D.skus], ['EXP', D.exp]];
    stats.forEach(function (s, i) {
      var x = 70 + i * 320;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 270, 290, 150);
      g.fillStyle = A; g.fillRect(x, 270, 6, 150);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.font = font(600, 28); g.fillText(s[0], x + 26, 315);
      g.fillStyle = '#fff'; g.font = font(700, 64); g.fillText(fmt(s[1]), x + 26, 395);
    });
    // กราฟแท่งงานรายวัน
    g.fillStyle = '#fff'; g.font = font(700, 36); g.fillText('งานรายวัน', 70, 490);
    var max = Math.max(1, Math.max.apply(null, D.days.map(function (x) { return x[1].t; })));
    var names = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
    D.days.forEach(function (x, i) {
      var bx = 90 + i * 132, bh = Math.round(x[1].t / max * 260), by = 800 - bh;
      var gr = g.createLinearGradient(0, by, 0, 800); gr.addColorStop(0, A); gr.addColorStop(1, B2);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(bx, 540, 84, 260);
      g.fillStyle = gr; g.fillRect(bx, by, 84, bh);
      g.fillStyle = '#fff'; g.font = font(700, 30); g.textAlign = 'center';
      g.fillText(String(x[1].t), bx + 42, by - 12);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = font(600, 28); g.fillText(names[i], bx + 42, 840);
      g.textAlign = 'left';
    });
    // บอส
    g.fillStyle = '#fff'; g.font = font(700, 36); g.fillText('👹 SKU ที่ขาดบ่อยสัปดาห์นี้', 70, 930);
    if (!D.boss.length) { g.fillStyle = 'rgba(255,255,255,.7)'; g.font = font(500, 30); g.fillText('ไม่มี SKU ขาดเลย สุดยอด! 🎉', 70, 985); }
    D.boss.forEach(function (b, i) {
      var y = 985 + i * 52;
      g.fillStyle = i === 0 ? A : 'rgba(255,255,255,.85)'; g.font = font(700, 30); g.fillText((i + 1) + '. ' + b[0], 90, y);
      g.textAlign = 'right'; g.fillText(b[1] + ' ครั้ง', W - 90, y); g.textAlign = 'left';
    });
    // ท้าย
    var lvl = 1, e0 = D.S.exp || 0; while (lvl < 100 && e0 >= 40 + lvl * 20) { e0 -= 40 + lvl * 20; lvl++; }
    g.fillStyle = 'rgba(255,255,255,.6)'; g.font = font(600, 26);
    g.fillText('Lv.' + lvl + ' · ทำงานติดกัน ' + (D.S.streak || 0) + ' วัน · ⭐ ดาวภารกิจ ' + ((Q && Q.stars) || 0), 70, H - 70);
    g.textAlign = 'right'; g.fillStyle = A; g.fillText('ORDER WORKSPACE', W - 70, H - 70); g.textAlign = 'left';
  }
  function weekly(auto) {
    if (document.querySelector('.rz-week-ov')) return;
    var ov = el('div', 'rz-tc-ov rz-week-ov',
      '<div class="rz-tc rz-week" role="dialog" aria-label="สรุปประจำสัปดาห์"><div class="rz-tc-head"><b>WEEKLY REPORT</b><span>สรุปประจำสัปดาห์</span><button type="button" class="rz-tc-x" aria-label="ปิด">×</button></div>' +
      '<canvas class="rz-week-img"></canvas>' +
      '<div class="rz-tc-foot"><button type="button" class="rz-week-dl">⬇ ดาวน์โหลดรูป</button><button type="button" class="rz-week-cp">📋 คัดลอกรูป</button><button type="button" class="rz-tc-close">ปิด</button></div></div>');
    document.body.appendChild(ov);
    var cv = ov.querySelector('canvas');
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { drawReport(cv); });
    var close = function () { ov.classList.add('is-out'); setTimeout(function () { ov.remove(); }, 250); };
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('.rz-tc-x, .rz-tc-close')) { close(); return; }
      if (e.target.closest('.rz-week-dl')) {
        cv.toBlob(function (b) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(b); a.download = 'RAYQUAZA-สรุปสัปดาห์-' + weekKey() + '.png';
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        });
      }
      if (e.target.closest('.rz-week-cp')) {
        cv.toBlob(function (b) {
          if (!navigator.clipboard || !window.ClipboardItem) { toast('เบราว์เซอร์นี้คัดลอกรูปไม่ได้ — ใช้ปุ่มดาวน์โหลดแทน', ''); return; }
          navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]).then(function () { toast('คัดลอกรูปสรุปสัปดาห์แล้ว — วางในแชทได้เลย', 'success'); })
            .catch(function () { toast('คัดลอกรูปไม่สำเร็จ — ใช้ปุ่มดาวน์โหลดแทน', ''); });
        });
      }
    });
    if (auto) ls('rz_week_shown', weekKey());
  }
  // ขึ้นเองวันศุกร์หลัง 16:00 (สัปดาห์ละครั้ง ถ้าสัปดาห์นี้มีงาน)
  setInterval(function () {
    var d = new Date();
    if (d.getDay() !== 5 || d.getHours() < 16 || ls('rz_week_shown') === weekKey()) return;
    if (document.querySelector('.rz-tc-ov, .rz-alert, .rz-lock, .rz-lvup, .rz-battle, .rz-meteor')) return;
    if (weekData().tasks < 1) return;
    weekly(true);
  }, 60000);

  function init() {
    loadQ();
    paintPill();
    paintBoss();
    var exp = document.querySelector('.rz-exp');
    if (exp) new MutationObserver(function () { if (!exp.querySelector('.rz-qpill')) paintPill(); }).observe(exp, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.RZPROGRESS = { weekly: weekly, quests: function () { loadQ(); return Q; }, bump: bump };
})();
