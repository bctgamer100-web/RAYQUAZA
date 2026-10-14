// RAYQUAZA SETTINGS — ศูนย์ตั้งค่ารวม + โหมดโฟกัส + วัดความลื่นของเครื่อง (คู่กับ css/rz-extra.css)
//  - เมนู ✦ > ⚙ ตั้งค่าทั้งหมด: หน้าเดียวสไตล์เมนูเกม แบ่งหมวด ภาพ / เสียง / เกม / ออนไลน์ / ความปลอดภัย
//    สวิตช์แต่ละอันกดปุ่มเดิมของโมดูลนั้นให้ (ค่าเก็บที่เดิม) · มีปุ่ม "คืนค่าเริ่มต้น" (ไม่ลบเลเวล/สถิติ/รหัสผ่าน)
//  - โหมดโฟกัส (ปุ่ม F): ปิดของหนัก/ดึงความสนใจ (3D, มังกรบินผ่าน, ฉากโฉบ, คอมโบ, อุกกาบาต, ฝน/หิมะ, ริบบิ้นบนฟ้า) ปิดแล้วคืนค่าเดิม
//    เครื่องกระตุก (ต่ำกว่า ~24 เฟรม/วินาที นานต่อเนื่อง) = เปิดโหมดโฟกัสให้เอง (ปิดได้ในศูนย์ตั้งค่า)
//  - วัดความลื่น: แสดงเฟรมต่อวินาที + เอฟเฟกต์ที่เปิดอยู่ + คำแนะนำว่าควรปิดอะไร
(function () {
  'use strict';

  var root = document.documentElement;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ข้าม */ } return null; }
  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function toast(m, t) { if (window.fxToast) window.fxToast(m, t || ''); }
  function btnOn(id) { var b = document.getElementById(id); return b ? b.getAttribute('aria-pressed') === 'true' : false; }
  function press(id) { var b = document.getElementById(id); if (b) b.click(); }

  /* ================= วัดความลื่น ================= */
  var fps = 60, frames = 0, last = performance.now(), slowSince = 0;
  (function loop(t) {
    requestAnimationFrame(loop);
    frames++;
    if (t - last >= 1000) {
      fps = Math.round(frames * 1000 / (t - last));
      frames = 0; last = t;
      if (document.hidden) { slowSince = 0; return; }
      // เครื่องกระตุกนานต่อเนื่อง 20 วินาที → เปิดโหมดโฟกัสให้เอง
      if (fps < 24 && root.classList.contains('rz-fx-on') && !root.classList.contains('rz-focus') && ls('rz_autofocus_v1') !== '0') {
        if (!slowSince) slowSince = t;
        else if (t - slowSince > 20000) { slowSince = 0; setFocus(true, 'auto'); }
      } else slowSince = 0;
      if (panel) paintPerf();
    }
  })(performance.now());

  /* ================= โหมดโฟกัส ================= */
  var FKEY = 'rz_focus_v1';
  // สิ่งที่ปิดตอนโฟกัส: [id ปุ่มเดิม] — จำสถานะก่อนเปิดไว้ คืนค่าเมื่อปิดโฟกัส
  var FOCUS_OFF = ['rz3dToggle', 'rzSwoopToggle'];
  function setFocus(v, why) {
    var st = {};
    try { st = JSON.parse(ls(FKEY) || '{}'); } catch (e) { /* ข้าม */ }
    if (v) {
      var snap = {};
      FOCUS_OFF.forEach(function (id) { snap[id] = btnOn(id); if (snap[id]) press(id); });
      ls(FKEY, JSON.stringify({ on: true, snap: snap }));
      root.classList.add('rz-focus');
      toast(why === 'auto' ? '🎯 เครื่องเริ่มหน่วง — เปิดโหมดโฟกัสให้แล้ว (ปิดเอฟเฟกต์หนัก) กด F เพื่อปิด' : '🎯 โหมดโฟกัส: ปิดเอฟเฟกต์หนักและฉากที่ดึงความสนใจแล้ว (กด F อีกครั้งเพื่อปิด)', '');
    } else {
      var s = st.snap || {};
      FOCUS_OFF.forEach(function (id) { if (s[id] && !btnOn(id)) press(id); });
      ls(FKEY, JSON.stringify({ on: false }));
      root.classList.remove('rz-focus');
      toast('✨ ปิดโหมดโฟกัส — เอฟเฟกต์กลับมาตามเดิม', '');
    }
    paintFocusBtn();
    if (panel) paint();
  }
  function focusOn() { return root.classList.contains('rz-focus'); }
  try { if (JSON.parse(ls(FKEY) || '{}').on) root.classList.add('rz-focus'); } catch (e) { /* ข้าม */ }

  /* ================= ศูนย์ตั้งค่า ================= */
  // [หมวด, ไอคอน, รายการ] · รายการ: [ชื่อ, คำอธิบาย, ชนิด, ค่า] · ชนิด: btn = ปุ่มเดิม (id) · flag = ค่า localStorage (ค่าเริ่ม=เปิด) · fn = ฟังก์ชัน
  var SECTIONS = [
    ['ภาพ', '🎨', [
      ['เอฟเฟกต์ RAYQUAZA (FX)', 'ท้องฟ้า สายฟ้า ประกายไฟ และฉากทั้งหมด — ปิดแล้วเหลือแค่ธีมสี', 'btn', 'rzFxToggle'],
      ['ฉาก 3D', 'ท้องฟ้า 3 มิติ การ์ดกระจก การ์ดเอียงตามเมาส์ (กินเครื่องที่สุด)', 'btn', 'rz3dToggle'],
      ['RAYQUAZA โฉบตอนเปลี่ยนหน้า', 'แถบพลังเฉียงตอนกดแท็บ', 'btn', 'rzSwoopToggle'],
      ['มังกรบินผ่านจอ', 'มังกรบินผ่านจอเป็นระยะและตามเหตุการณ์ (ปิดไว้เป็นค่าเริ่มต้น)', 'flag1', 'rz_flyby_v1'],
      ['เทศกาล', 'ตกแต่งตามวันสำคัญ (สงกรานต์ ลอยกระทง ตรุษจีน คริสต์มาส ปีใหม่)', 'flag', 'rz_fest_v1']
    ]],
    ['เสียง', '🔊', [
      ['เสียงประกอบ', 'เสียงกดปุ่ม เสียงสำเร็จ ฟ้าร้อง (ปิดไว้เป็นค่าเริ่มต้น)', 'btn', 'rzSoundToggle'],
      ['เพลงประกอบ', '6 เพลงแต่งเอง เปลี่ยนตามสถานการณ์ (ปุ่ม M)', 'btn', 'rzBgmToggle'],
      ['🎵 ระดับเสียงเพลง', '', 'range', 'rz_vol_bgm'],
      ['🔊 ระดับเสียงประกอบ', 'เสียงกดปุ่ม ฟ้าร้อง เสียงร้องคู่หู ฯลฯ', 'range', 'rz_vol_sfx']
    ]],
    ['เกม', '🎮', [
      ['คู่หู RAYQUAZA', 'มังกรตัวเล็กมุมจอ', 'btn', 'rzBuddyToggle'],
      ['โหมดต่อสู้', 'ฉากต่อสู้หลังตรวจ ORDER กับ Stock', 'btn', 'rzBattleToggle'],
      ['คอมโบ / OVERDRIVE', 'นับงานสำเร็จติดกัน ขอบจอลุกไฟเมื่อครบ 5', 'flag', 'rz_combo_v1'],
      ['METEOR CRISIS แบบสุ่ม', 'อุกกาบาตโผล่เองวันละไม่เกิน 1 ครั้ง (พิมพ์ comet ได้เสมอ)', 'flag', 'rz_meteor_auto_v1'],
      ['ตำนานลึกลับมาเยือน', 'เงาปริศนาโผล่ขอบฟ้าวันแดดแรง/ฝนตก แล้ว RAYQUAZA ไล่กลับ', 'flag', 'rz_visit_v1'],
      ['แจ้งเตือนสต็อก HP ต่ำ', 'ตารางหน้า RZ Plan: SKU สต็อกน้อยขึ้นป้าย ⚠ HP ต่ำ / 💀 หมดแรง', 'flag', 'rz_lowhp_v1']
    ]],
    ['ออนไลน์', '🌐', [
      ['สภาพอากาศจริง · อันดับทีม · สั่งด้วยเสียง', 'เปิดแผงตั้งค่าออนไลน์ (ทุกข้อปิดไว้ก่อน)', 'fn', function () { close(); if (window.RZONLINE) window.RZONLINE.open(); }]
    ]],
    ['ความปลอดภัย', '🔒', [
      ['ล็อกหน้าจอ / โหมดสลีป', 'รหัสผ่าน Master Ball และเวลาหลับ', 'fn', function () { close(); if (window.RZLOCK) window.RZLOCK.settings(); }]
    ]]
  ];
  var panel = null;
  function itemOn(it) {
    if (it[2] === 'btn') return btnOn(it[3]);
    if (it[2] === 'flag') return ls(it[3]) !== '0';
    if (it[2] === 'flag1') return ls(it[3]) === '1'; // สวิตช์ที่ค่าเริ่มต้นเป็น "ปิด"
    return null;
  }
  function paint() {
    if (!panel) return;
    var html = '';
    SECTIONS.forEach(function (sec, si) {
      html += '<section class="rz-set-sec"><h4><i>' + sec[1] + '</i>' + sec[0] + '</h4>';
      sec[2].forEach(function (it, ii) {
        if (it[2] === 'range') {
          var v = parseFloat(ls(it[3])); if (isNaN(v)) v = 70;
          html += '<label class="rz-set-row rz-set-range"><span class="rz-set-txt"><b>' + it[0] + ' <em>' + v + '%</em></b>' + (it[1] ? '<small>' + it[1] + '</small>' : '') + '</span>' +
            '<input type="range" min="0" max="100" step="5" value="' + v + '" data-vol="' + it[3] + '" aria-label="' + it[0] + '"></label>';
          return;
        }
        var on = itemOn(it);
        var exists = it[2] !== 'btn' || document.getElementById(it[3]);
        if (!exists) return;
        html += '<button type="button" class="rz-set-row" data-s="' + si + '" data-i="' + ii + '">' +
          '<span class="rz-set-txt"><b>' + it[0] + '</b><small>' + it[1] + '</small></span>' +
          (on === null ? '<span class="rz-set-go">เปิด ›</span>' : '<span class="rz-set-sw' + (on ? ' is-on' : '') + '"><i></i></span>') + '</button>';
      });
      html += '</section>';
    });
    panel.querySelector('.rz-set-list').innerHTML = html;
    paintPerf();
    var f = panel.querySelector('.rz-set-focus');
    f.classList.toggle('is-on', focusOn());
    f.querySelector('b').textContent = focusOn() ? '🎯 โหมดโฟกัส: เปิดอยู่' : '🎯 โหมดโฟกัส';
    panel.querySelector('.rz-set-auto input').checked = ls('rz_autofocus_v1') !== '0';
  }
  function paintPerf() {
    if (!panel) return;
    var on = [];
    if (root.classList.contains('rz-fx-on')) on.push('FX');
    if (btnOn('rz3dToggle')) on.push('3D');
    if (btnOn('rzBgmToggle')) on.push('เพลง');
    if (btnOn('rzSwoopToggle')) on.push('ฉากโฉบ');
    if (btnOn('rzBuddyToggle')) on.push('คู่หู');
    var tips = [];
    if (fps < 40) {
      if (btnOn('rz3dToggle')) tips.push('ปิด "ฉาก 3D" (ช่วยมากที่สุด)');
      if (!focusOn()) tips.push('เปิด "โหมดโฟกัส"');
      if (root.classList.contains('rz-fx-on') && !btnOn('rz3dToggle')) tips.push('ปิด "เอฟเฟกต์ FX" ถ้ายังหน่วง');
    }
    var grade = fps >= 50 ? ['ลื่นมาก', 'g'] : fps >= 35 ? ['พอใช้', 'y'] : ['หน่วง', 'r'];
    panel.querySelector('.rz-set-perf').innerHTML =
      '<div class="rz-perf-fps is-' + grade[1] + '"><b>' + fps + '</b><small>FPS · ' + grade[0] + '</small></div>' +
      '<div class="rz-perf-info"><span>เปิดอยู่: ' + (on.join(' · ') || 'ไม่มี') + '</span>' +
      '<span>' + (tips.length ? '💡 แนะนำ: ' + tips.join(' · ') : '✅ เครื่องรับไหว ไม่ต้องปิดอะไร') + '</span></div>';
  }
  function open() {
    if (panel) return;
    var dock = document.querySelector('.rz-dock'); if (dock) dock.classList.remove('is-open');
    panel = el('div', 'rz-tc-ov rz-set-ov',
      '<div class="rz-tc rz-set" role="dialog" aria-label="ตั้งค่า"><div class="rz-tc-head"><b>⚙ SETTINGS</b><span>ศูนย์ตั้งค่า RAYQUAZA</span><button type="button" class="rz-tc-x" aria-label="ปิด">×</button></div>' +
      '<div class="rz-set-top"><button type="button" class="rz-set-focus"><b></b><small>ปิดเอฟเฟกต์หนักและฉากที่ดึงความสนใจ เหมาะกับช่วงงานยุ่ง (ปุ่ม F)</small></button>' +
      '<div class="rz-set-perf"></div></div>' +
      '<label class="rz-set-auto"><input type="checkbox"> เปิดโหมดโฟกัสให้เองเมื่อเครื่องเริ่มหน่วง</label>' +
      '<div class="rz-set-list"></div>' +
      '<div class="rz-tc-foot"><button type="button" class="rz-set-reset">↺ คืนค่าเริ่มต้น</button><button type="button" class="rz-tc-close">ปิด</button></div></div>');
    document.body.appendChild(panel);
    paint();
    panel.addEventListener('click', function (e) {
      if (e.target === panel || e.target.closest('.rz-tc-x, .rz-tc-close')) { close(); return; }
      if (e.target.closest('.rz-set-focus')) { setFocus(!focusOn()); return; }
      if (e.target.closest('.rz-set-reset')) { reset(); return; }
      var row = e.target.closest('.rz-set-row');
      if (!row || row.classList.contains('rz-set-range')) return;
      var it = SECTIONS[+row.dataset.s][2][+row.dataset.i];
      if (it[2] === 'btn') press(it[3]);
      else if (it[2] === 'flag1') { ls(it[3], ls(it[3]) === '1' ? '0' : '1'); }
      else if (it[2] === 'flag') { ls(it[3], ls(it[3]) === '0' ? '1' : '0'); try { window.dispatchEvent(new CustomEvent('rz:setting', { detail: { key: it[3] } })); } catch (er) { /* ข้าม */ } }
      else if (it[2] === 'fn') { it[3](); return; }
      setTimeout(paint, 60);
    });
    var sfxTest = 0;
    panel.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-vol');
      if (!k) return;
      ls(k, e.target.value);
      var em = e.target.closest('.rz-set-range').querySelector('em'); if (em) em.textContent = e.target.value + '%';
      try { window.dispatchEvent(new CustomEvent('rz:volume', { detail: { key: k, value: +e.target.value } })); } catch (er) { /* ข้าม */ }
      if (k === 'rz_vol_sfx' && window.RZPOKE) { clearTimeout(sfxTest); sfxTest = setTimeout(function () { window.RZPOKE.sfx('ok'); }, 120); }
    });
    panel.querySelector('.rz-set-auto input').addEventListener('change', function (e) { ls('rz_autofocus_v1', e.target.checked ? '1' : '0'); });
    document.addEventListener('keydown', onEsc, true);
  }
  function onEsc(e) { if (e.key === 'Escape' && panel && !document.querySelector('.rz-ask')) { e.stopPropagation(); close(); } }
  function close() {
    if (!panel) return;
    var p = panel; panel = null;
    document.removeEventListener('keydown', onEsc, true);
    p.classList.add('is-out'); setTimeout(function () { p.remove(); }, 250);
  }
  function reset() {
    var ask = window.rzConfirm ? window.rzConfirm('คืนค่าการตั้งค่าทั้งหมดเป็นค่าเริ่มต้น?\n\n(เลเวล สถิติ เหรียญตรา ข้อมูลงาน และรหัสผ่านยังอยู่ครบ)') : Promise.resolve(window.confirm('คืนค่าเริ่มต้น?'));
    ask.then(function (yes) {
      if (!yes) return;
      ['rz_fx_v1', 'rz_3d_v1', 'rz_sound_v1', 'rz_bgm_v1', 'rz_battle_v1', 'rz_swoop_v1', 'rz_combo_v1', 'rz_meteor_auto_v1', 'rz_visit_v1', 'rz_lowhp_v1',
        'rz_fest_v1', 'rz_flyby_v1', 'rz_vol_bgm', 'rz_vol_sfx', 'rz_focus_v1', 'rz_autofocus_v1', 'rz_auto_theme_v1', 'rz_weather_v1'].forEach(function (k) { ls(k, null); });
      try { var b = JSON.parse(ls('rz_buddy_v1') || '{}'); b.on = true; b.x = null; b.y = null; ls('rz_buddy_v1', JSON.stringify(b)); } catch (e) { /* ข้าม */ }
      toast('คืนค่าเริ่มต้นแล้ว — กำลังโหลดหน้าใหม่…', 'success');
      setTimeout(function () { location.reload(); }, 900);
    });
  }

  /* ---------- ปุ่ม ---------- */
  var fBtn = null;
  function paintFocusBtn() { if (fBtn) { fBtn.setAttribute('aria-pressed', String(focusOn())); fBtn.classList.toggle('is-off', !focusOn()); } }
  function addButtons() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar) return;
    if (!document.getElementById('rzSettingsBtn')) {
      var b = el('button', 'rz-fx-toggle rz-sound-toggle'); b.type = 'button'; b.id = 'rzSettingsBtn'; b.textContent = '⚙';
      b.addEventListener('click', open); bar.appendChild(b);
    }
    if (!document.getElementById('rzFocusBtn')) {
      fBtn = el('button', 'rz-fx-toggle rz-sound-toggle'); fBtn.type = 'button'; fBtn.id = 'rzFocusBtn'; fBtn.textContent = '🎯';
      fBtn.addEventListener('click', function () { setFocus(!focusOn()); }); bar.appendChild(fBtn);
      paintFocusBtn();
    }
  }
  // ปุ่มลัดตัวอักษรเดียว (T W M V L F) ต้องไม่ทำงานตอนกำลังพิมพ์คำลับ (rayquaza, comet, hyper, shiny, pokedex)
  // = ถ้ามีการกดตัวอักษรอื่นก่อนหน้าไม่เกิน 0.7 วินาที ถือว่ากำลังพิมพ์คำ
  var prevKey = 0, lastKey = 0;
  window.addEventListener('keydown', function (e) {
    if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) { prevKey = lastKey; lastKey = Date.now(); }
  }, true);
  window.RZ_MIDWORD = function () { return lastKey - prevKey < 700; };
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if ((window.RZ_MIDWORD && window.RZ_MIDWORD()) || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.rz-lock') || (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName)))) return;
    if (e.key === 'f' || e.key === 'F') setFocus(!focusOn());
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButtons); else addButtons();
  window.RZSETTINGS = { open: open, focus: setFocus, fps: function () { return fps; } };
})();
