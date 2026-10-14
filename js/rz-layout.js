// RAYQUAZA LAYOUT — เค้าโครงใหม่ "Command Deck" ทุกหน้า (คู่กับ css/rz-layout.css)
//  หัวหน้า = แบนเนอร์ใหญ่ (รหัสหน้า · ชื่อ · คำอธิบาย · ปุ่มหลัก · แถบตัวเลข HUD · ภาพมังกร)
//  เนื้อหา = 2 คอลัมน์: ซ้าย "ขั้นตอน" (การ์ดมีเลขขั้น ①②③) · ขวา "ผลลัพธ์" (ตาราง/พรีวิวกว้างเต็ม)
// วิธีทำ: ย้ายบล็อกเดิมไปไว้ในกรอบใหม่ (element เดิม · id เดิม · ตัวจัดการเหตุการณ์เดิม) — ไม่แก้/ไม่สร้างปุ่มใหม่แทนของเดิม
// โค้ดของระบบหา element ด้วย id และ closest() ของภายในบล็อกเท่านั้น จึงทำงานเหมือนเดิม
// ต้องโหลดหลัง app.js/sunshine.js ฯลฯ และก่อน rz-poke.js (rz-poke วางหลอด HP ต่อจากแถบสรุปที่ย้ายแล้ว)
(function () {
  'use strict';

  // [selector ในหน้า, ชื่อขั้น, ไอคอน] · selector ขึ้นต้นด้วย ^ = หาในทั้งเอกสาร
  var PAGES = {
    mergeTool: {
      code: '01', en: 'DATA IMPORT', icon: '⬆',
      title: 'นำเข้าข้อมูล', subSel: '.sun-imp-head p',
      host: '#sunImportTool', // CSS ของการ์ดอัปโหลดผูกกับ #sunImportTool จึงต้องวางเค้าโครงไว้ข้างใน
      actions: ['.sun-imp-bar', 'label:has(#sunAutoStartup)'],
      gone: ['.sun-imp-head'],
      full: [['#sunImportGrid', 'อัปโหลดไฟล์ทีละชนิด · ลากไฟล์มาวางในการ์ดได้เลย', '🗂']]
    },
    compareTool: {
      code: '02', en: 'ORDER × STOCK', icon: '⇄',
      title: 'ตรวจ ORDER กับ Stock', sub: 'ใส่ไฟล์ ORDER กับ Stock (หรือดึงจากฐานข้อมูล) แล้วระบบเทียบให้อัตโนมัติ — เห็นทันทีว่าพอ ขาด หรือไม่มีสต็อก พร้อมสร้างใบย้ายสินค้า',
      hud: ['#compareQuickStatus'],
      side: [
        ['.grid > .card:nth-child(1)', 'ไฟล์ ORDER', '📥'],
        ['.grid > .card:nth-child(2)', 'Stock + ประวัติเคลื่อนไหว (SI)', '📦'],
        ['.app .panel', 'สถานะการตรวจ', '⚙'],
        ['#confirmRef', 'รายการที่ยืนยันไว้', '📂']
      ],
      main: [
        ['#progress', '', ''],
        ['#compareStatus', '', ''],
        ['#downloadBox', 'ดาวน์โหลดผลตรวจ', '⬇'],
        ['#compareWebPreview', 'ผลตรวจ + ใบย้ายสินค้า', '📋'],
        ['#compareExtra', 'ค้นหาในผลตรวจ', '🔍'],
        ['#resultBox', 'ตารางผลตรวจ', '📊'],
        ['.app .stats', '', '']
      ],
      gone: ['.app > header', '.grid']
    },
    orderTool: {
      code: '03', en: 'ORDER INTAKE', icon: '📥',
      title: 'รับORDER', subSel: '.beta-card > div:first-child p',
      actions: ['#orderAuto'],
      hud: ['.beta-stats', '#orderSummaryExtra'],
      side: [
        ['#orderDrop', 'เลือกไฟล์ ORDER', '📁'],
        ['#savedFiles', 'ไฟล์ที่เคยใช้', '🕘'],
        ['.beta-progress', '', ''],
        ['#orderStatus', '', ''],
        ['.beta-actions', 'ส่งออก / ดาวน์โหลด', '⬇']
      ],
      main: [
        ['#orderFilterPanel', 'กรองข้อมูลตามหัวข้อ', '🔎'],
        ['#orderPivotWrap', 'ตาราง Pivot', '📊'],
        ['.order-preview-head', '', ''],
        ['.beta-preview', 'ตัวอย่างข้อมูล', '🧾']
      ],
      gone: ['.beta-card > div:first-child']
    },
    beforeOrderTool: {
      code: '04', en: 'PRE-ORDER', icon: '🛒',
      title: 'ก่อนสั่ง', subSel: '.before-order-head p',
      actions: ['.before-order-actions'],
      hud: ['.before-order-stats'],
      side: [
        ['#beforeOrderRef', 'ใบปริ้นที่เคยปริ้น', '🕘'],
        ['#beforeOrderStatus', 'สถานะ', 'ℹ']
      ],
      main: [['.before-order-table-wrap', 'รายการจาก Pivot · ติ๊กเลือกแล้วกดยืนยัน', '☑']],
      gone: ['.before-order-head', '.before-order-card']
    },
    scanTool: {
      code: '05', en: 'PRINT CHECK', icon: '🧾',
      title: 'ตรวจใบปริ้น', subSel: '.scan-card > p',
      side: [
        ['#scanNeed', '', ''],
        ['#scanDrop', 'ถ่ายรูป / เลือกรูปใบปริ้น', '📷'],
        ['#scanRef', 'ใบปริ้นที่บันทึกไว้', '🕘'],
        ['#scanStatus', '', '']
      ],
      main: [['#scanResult', 'ผลการอ่านกากบาท ✗ / วงกลม ○', '🎯']],
      gone: ['.scan-card > h2', '.scan-card > p']
    },
    summaryTool: {
      code: '06', en: 'ACTIVITY LOG', icon: '📈',
      title: 'สรุปงาน', subSel: '.summary-head p',
      actions: ['.summary-actions'],
      hud: ['.summary-stats'],
      full: [['#summaryList', 'ไทม์ไลน์กิจกรรม', '🕘']],
      gone: ['.summary-head']
    },
    sunTool: {
      code: 'RZ', en: 'RZ PLAN', icon: '☀',
      titleFrom: '#scCurrentPage', sub: 'ข้อมูลจากฐานข้อมูล RZ Plan — ค้นหา SKU กรอง และดาวน์โหลดได้จากแถบด้านบน',
      actions: ['.sun-toolbar'],
      full: [['#sunStatus', '', ''], ['#sunOutput', 'ข้อมูล', '📊']]
    }
  };

  function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }
  function find(sec, sel) {
    if (!sel) return null;
    if (sel.charAt(0) === '^') return document.querySelector(sel.slice(1));
    try { return sec.querySelector(sel); } catch (e) { return null; }
  }
  var STEP = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

  // กรอบการ์ด: หัวการ์ด (เลขขั้น + ชื่อ) + ตัวบล็อกเดิม · ไม่มีชื่อ = กรอบบาง (เช่นแถบ progress)
  var panels = [];
  function panel(block, title, icon, n) {
    var p = el('section', 'rz-panel' + (title ? '' : ' rz-panel-bare'));
    if (title) {
      p.appendChild(el('header', 'rz-panel-head',
        (n != null ? '<b class="rz-panel-step">' + STEP[n] + '</b>' : '<b class="rz-panel-ico">' + (icon || '◆') + '</b>') +
        '<span>' + title + '</span>'));
    }
    var body = el('div', 'rz-panel-body');
    p.appendChild(body);
    block.parentNode.insertBefore(p, block);
    body.appendChild(block);
    panels.push([p, block]);
    return p;
  }

  function build(id, cfg) {
    var sec = document.getElementById(id);
    if (!sec || sec.querySelector('.rz-hero')) return;
    sec.classList.add('rz-page');
    // หาบล็อกทั้งหมดก่อนย้าย (ถ้าย้ายไปทีละตัว selector แบบ nth-child จะเลื่อน)
    var resolve = function (list) { return (list || []).map(function (d) { return [find(sec, d[0]), d[1], d[2]]; }); };
    var sideList = resolve(cfg.side), mainList = resolve(cfg.main || cfg.full);

    // ---------- แบนเนอร์หัวหน้า ----------
    var subText = cfg.sub || '';
    var subEl = find(sec, cfg.subSel);
    if (subEl) subText = subEl.innerHTML;
    var hero = el('header', 'rz-hero',
      '<div class="rz-hero-art" aria-hidden="true"></div>' +
      '<div class="rz-hero-main">' +
      '<div class="rz-hero-eyebrow"><span class="rz-hero-code">' + cfg.code + '</span><span>' + cfg.en + '</span></div>' +
      '<h2 class="rz-hero-title"><i aria-hidden="true">' + cfg.icon + '</i><span></span></h2>' +
      '<p class="rz-hero-sub"></p>' +
      '</div>' +
      '<div class="rz-hero-actions"></div>' +
      '<div class="rz-hero-hud"></div>');
    hero.querySelector('.rz-hero-title span').textContent = cfg.title || '';
    hero.querySelector('.rz-hero-sub').innerHTML = subText;
    var host = (cfg.host && find(sec, cfg.host)) || sec;
    host.insertBefore(hero, host.firstChild);
    var acts = hero.querySelector('.rz-hero-actions'), hud = hero.querySelector('.rz-hero-hud');
    (cfg.actions || []).forEach(function (s) { var b = find(sec, s); if (b && !hero.contains(b)) acts.appendChild(b); });
    (cfg.hud || []).forEach(function (s) { var b = find(sec, s); if (b && !hero.contains(b)) hud.appendChild(b); });
    if (!acts.children.length) acts.remove();
    if (!hud.children.length) hud.classList.add('is-empty');

    // ชื่อหน้าตาม h1 เดิม (หน้า RZ Plan เปลี่ยนชื่อตามแท็บที่เลือก)
    if (cfg.titleFrom) {
      var src = document.querySelector(cfg.titleFrom), span = hero.querySelector('.rz-hero-title span');
      var syncT = function () { if (src && sec.classList.contains('active')) span.textContent = src.textContent; };
      syncT();
      if (src) new MutationObserver(syncT).observe(src, { childList: true, characterData: true, subtree: true });
      new MutationObserver(syncT).observe(sec, { attributes: true, attributeFilter: ['class'] });
    }

    // ---------- พื้นที่ทำงาน ----------
    var deck = el('div', 'rz-deck' + (cfg.full ? ' rz-deck-full' : ''));
    var side = el('div', 'rz-side'), main = el('div', 'rz-main');
    if (!cfg.full) deck.appendChild(side);
    deck.appendChild(main);
    host.appendChild(deck);
    if (!cfg.full) side.appendChild(el('div', 'rz-col-title', '<span>ขั้นตอน</span>'));
    main.appendChild(el('div', 'rz-col-title', '<span>' + (cfg.full ? 'พื้นที่ทำงาน' : 'ผลลัพธ์') + '</span>'));
    var n = 0;
    sideList.forEach(function (d) {
      var b = d[0]; if (!b || deck.contains(b) || hero.contains(b)) return;
      side.appendChild(b); panel(b, d[1], d[2], d[1] ? n++ : null);
    });
    mainList.forEach(function (d) {
      var b = d[0]; if (!b || deck.contains(b) || hero.contains(b)) return;
      main.appendChild(b); panel(b, d[1], d[2], null);
    });
    if (!cfg.full) {
      var ph = el('section', 'rz-panel rz-placeholder', '<div class="rz-ph-art" aria-hidden="true"></div><b>ผลลัพธ์จะแสดงที่นี่</b><span>เริ่มจากขั้นตอนทางซ้าย แล้วผลจะขึ้นตรงนี้</span>');
      main.appendChild(ph);
    }
    (cfg.gone || []).forEach(function (s) { var g = find(sec, s); if (g && !deck.contains(g) && !hero.contains(g)) g.classList.add('rz-gone'); });
    // กรอบเดิมที่ไม่เหลืออะไรข้างในแล้ว (ทุกลูกถูกย้าย/ซ่อน) = ซ่อนทั้งกรอบ (ไล่จากในออกนอก)
    var shells = Array.prototype.slice.call(sec.querySelectorAll('div, main, header')).filter(function (x) { return !deck.contains(x) && !hero.contains(x) && x !== deck && x !== hero; }).reverse();
    shells.forEach(function (x) {
      if (x.id && x.id !== 'sunImportTool') return; // element ที่ระบบอ้างด้วย id: ไม่ยุ่ง
      // เฉพาะกรอบที่เคยมีของข้างใน และของทั้งหมดถูกย้าย/ซ่อนแล้ว (กล่องว่างที่ระบบจะเติมทีหลังไม่ยุ่ง)
      if (!x.children.length) {
        // กรอบการ์ดเดิมที่ของถูกย้ายออกไปหมดจนว่างเปล่า
        if (/(beta-card|app|scan-card|summary-card|sun-card-wrap)/.test(x.className) && !(x.textContent || '').trim()) x.classList.add('rz-gone');
        return;
      }
      var left = Array.prototype.some.call(x.children, function (c) { return !c.classList.contains('rz-gone'); });
      if (!left) x.classList.add('rz-gone');
    });
    sec.classList.add('rz-built');
  }

  /* ---------- ซ่อนกรอบที่บล็อกข้างในถูกระบบซ่อนอยู่ + ข้อความ "ผลลัพธ์จะแสดงที่นี่" ---------- */
  function hiddenEl(b) {
    if (b.hidden) return true;
    var cs = getComputedStyle(b);
    return cs.display === 'none';
  }
  var raf = 0;
  function refresh() {
    raf = 0;
    panels.forEach(function (pb) { pb[0].classList.toggle('is-off', hiddenEl(pb[1])); });
    document.querySelectorAll('.rz-main').forEach(function (m) {
      var ph = m.querySelector('.rz-placeholder');
      if (!ph) return;
      var any = Array.prototype.some.call(m.children, function (c) { return c.classList.contains('rz-panel') && !c.classList.contains('rz-placeholder') && !c.classList.contains('is-off') && !c.classList.contains('rz-panel-bare'); });
      ph.classList.toggle('is-off', any);
    });
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(refresh); }

  for (var id in PAGES) build(id, PAGES[id]);
  document.documentElement.classList.add('rz-layout');
  refresh();
  new MutationObserver(schedule).observe(document.querySelector('.panel-wrap') || document.body, { subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
  window.addEventListener('load', refresh);
  window.RZLAYOUT = { refresh: refresh };
})();
