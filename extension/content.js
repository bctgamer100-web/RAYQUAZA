/* หมายเหตุ: สีของกล่องอ่านจากตัวแปร CSS --rzp-* ของหน้าเว็บ (Shadow DOM สืบทอดตัวแปรจากหน้า) ถ้าหน้านั้นไม่มีตัวแปร (เช่น BigSeller) ใช้สีฟ้าเดิม — หน้า RAYQUAZA กำหนดตัวแปรไว้ใน css/rayquaza.css */
/* ส่วนขยาย "ค้นหาสต็อก" (ORDER Workspace) — กล่องค้นหาบนทุกหน้าเว็บ
   กด Tab = เปิด/ปิด (ตอนไม่ได้พิมพ์อยู่ในช่องอื่นของหน้าเว็บ) หรือกดไอคอนส่วนขยาย
   ทำงานเหมือนช่องค้นหาสต็อกในแอป: ค้นหลายรหัส · รหัสที่ไม่มีสต็อกขึ้นกล่องแดง · จิ้มเลือกตำแหน่ง/แก้จำนวน · โหลดใบย้าย
   กติกาไฟล์ใบย้ายเหมือนในแอป (js/app.js): ลัง H เบิกทั้งลัง + SKU อื่นในลังติดไปด้วย · แยกไฟล์ H / K / C / J
   UI อยู่ใน Shadow DOM ไม่ปนกับสไตล์ของหน้าเว็บ */
(function () {
  'use strict';
  if (window.__orderStockPeek) return;
  window.__orderStockPeek = true;

  /* ---------- กติกาเดียวกับแอป ---------- */
  const DAMAGED = ['X001'];
  const BOX = 'H';
  const J_FILE = 'J';
  const ALIAS = { KT: 'K', F: 'C', D: 'C', M: 'C', R: J_FILE, P: J_FILE, SD: J_FILE };
  const MAX_SKUS = 60;
  const isDamaged = loc => { const u = String(loc).trim().toUpperCase(); return DAMAGED.some(x => u === x || u.startsWith(x + '-')); };
  const prefixOf = loc => (String(loc).trim().split('-')[0] || '').trim().toUpperCase();
  function fileKey(prefix, loc) {
    if (prefix !== BOX && /\sJ$/i.test(String(loc).trim())) return J_FILE;
    if (/^EQ/.test(prefix)) return J_FILE;
    return ALIAS[prefix] || prefix;
  }
  const normSku = v => String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toUpperCase();
  const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fmt = n => Number(n || 0).toLocaleString();

  /* ---------- UI ---------- */
  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:auto;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{all:initial}
    *{box-sizing:border-box;font-family:var(--rzp-font,"Prompt","Noto Sans Thai","Segoe UI",Tahoma,sans-serif)}
    .box{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(720px,calc(100vw - 32px));height:min(60vh,520px);min-width:340px;min-height:180px;
      max-width:calc(100vw - 8px);max-height:calc(100vh - 8px);display:flex;flex-direction:column;background:var(--rzp-bg,#0c0f14);color:var(--rzp-fg,#e5e7eb);border:1px solid var(--rzp-accent,#78a9ff);
      border-radius:var(--rzp-radius,12px);box-shadow:0 12px 40px rgba(0,0,0,.5);overflow:hidden;font-size:13px}
    .box[hidden]{display:none}
    .title{display:flex;align-items:center;gap:10px;padding:6px 8px 6px 12px;border-bottom:1px solid var(--rzp-line,#263041);cursor:move;user-select:none;touch-action:none;background:var(--rzp-accent-soft,rgba(120,169,255,.10))}
    .name{font-size:12.5px;font-weight:700}
    .hint{flex:1;font-size:11px;color:var(--rzp-muted2,#8b95a5);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    button{font:inherit;color:inherit;cursor:pointer}
    .x{width:28px;height:26px;border:0;border-radius:7px;background:transparent;color:var(--rzp-muted,#9ca3af)}
    .x:hover{background:var(--rzp-accent-soft,rgba(120,169,255,.15));color:#fff}
    .head{display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border-bottom:1px solid var(--rzp-line,#263041)}
    .bulk{flex:0 0 38px;height:38px;display:flex;align-items:center;justify-content:center;border:1px solid var(--rzp-line2,#2b3647);border-radius:8px;background:transparent;color:var(--rzp-muted,#9ca3af)}
    .bulk[aria-pressed="true"],.bulk:hover{color:var(--rzp-accent,#78a9ff);border-color:var(--rzp-accent,#78a9ff)}
    .bulk svg{width:17px;height:17px}
    textarea{flex:1;height:38px;min-height:38px;padding:9px 12px;font-size:14px;line-height:1.4;resize:none;overflow:hidden;white-space:nowrap;
      background:var(--rzp-input,#05070a);color:var(--rzp-fg,#e5e7eb);border:1px solid var(--rzp-line2,#2b3647);border-radius:8px;outline:none}
    textarea:focus{border-color:var(--rzp-accent,#78a9ff)}
    .multi textarea{height:130px;overflow:auto;white-space:pre-wrap}
    .body{flex:1;min-height:0;overflow:auto;padding:6px 12px 10px}
    .src{font-size:11px;color:var(--rzp-muted2,#6b7280);padding:4px 0 2px}
    .empty{padding:14px 2px;color:var(--rzp-muted,#9ca3af)}
    .missing{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px;padding:8px 10px;border:1px solid rgba(239,68,68,.45);border-radius:9px;background:rgba(239,68,68,.08)}
    .missing-head{flex:0 0 100%;font-weight:700;color:#f87171;font-size:12.5px}
    .miss{font-size:12px;padding:3px 8px;border:1px solid rgba(239,68,68,.45);border-radius:999px}
    .miss small{color:var(--rzp-muted2,#8b95a5)}
    .row{display:grid;grid-template-columns:minmax(150px,240px) 1fr;gap:10px;padding:8px 0;border-bottom:1px solid var(--rzp-line-soft,#1c2330)}
    .row:last-child{border-bottom:0}
    .sku b{display:block;font-size:13px;overflow-wrap:anywhere}
    .sku span{font-size:11px;color:var(--rzp-muted2,#8b95a5)}
    .locs{display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start}
    .loc{font-size:12px;padding:3px 8px;border:1px solid var(--rzp-line2,#2b3647);border-radius:999px;white-space:nowrap;background:transparent}
    button.loc:hover{border-color:var(--rzp-accent,#78a9ff)}
    .loc.dmg{opacity:.5;text-decoration:line-through}
    .loc.on{display:inline-flex;align-items:center;gap:4px;border-color:var(--rzp-accent,#78a9ff);background:var(--rzp-accent-soft,rgba(120,169,255,.12));padding:2px 6px 2px 8px}
    .unpick{border:0;background:none;padding:0;color:var(--rzp-accent,#78a9ff);font-weight:700;text-decoration:underline;text-underline-offset:3px}
    .qty{width:58px;height:24px;padding:0 6px;text-align:center;background:var(--rzp-input,#05070a);color:var(--rzp-fg,#e5e7eb);border:1px solid var(--rzp-line2,#2b3647);border-radius:6px;font-size:12px}
    .loc small{font-size:10px;color:var(--rzp-muted2,#8b95a5)}
    /* SKU ที่เคยเบิกไปแล้ววันนี้ (ประวัติร่วมกับหน้า ตรวจ ORDER กับ Stock): ทั้งแถวเปลี่ยนสี เหลือง 1 ครั้ง · ส้ม 2 · แดง 3+ */
    .row.dup{margin:0 -8px;padding-left:8px;padding-right:8px;border-radius:8px}
    .row.dup1{background:rgba(250,204,21,.14)}
    .row.dup2{background:rgba(251,146,60,.22)}
    .row.dup3{background:rgba(239,68,68,.26)}
    .pickd{display:block;margin-top:2px;font-size:11px;font-weight:700;color:#fbbf24}
    .dup3 .pickd{color:#f87171}
    .bar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid var(--rzp-line,#263041);font-size:12.5px}
    .bar[hidden]{display:none}
    .bar span{flex:1}
    .bar button{height:30px;padding:0 12px;border-radius:8px;border:1px solid var(--rzp-line2,#2b3647);background:transparent;font-size:12px}
    .bar .dl{background:var(--rzp-accent,#78a9ff);border-color:var(--rzp-accent,#78a9ff);color:var(--rzp-accent-fg,#08111c);font-weight:600}
    .grip{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;touch-action:none;
      background:linear-gradient(135deg,transparent 0 50%,var(--rzp-accent,#78a9ff) 50% 60%,transparent 60% 70%,var(--rzp-accent,#78a9ff) 70% 80%,transparent 80%)}
    @media(max-width:600px){.row{grid-template-columns:1fr}}
  </style>
  <div class="box" hidden role="dialog" aria-label="ค้นหาสต็อก">
    <div class="title"><span class="name">🔍 ค้นหาสต็อก</span><span class="hint">กดตำแหน่งเพื่อเลือก · Tab = ปิด · ลากมุม ◢ เพื่อย่อ/ขยาย</span><button type="button" class="x" title="ปิด">✕</button></div>
    <div class="head">
      <button type="button" class="bulk" title="วางหลาย SKU พร้อมกัน" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg></button>
      <textarea rows="1" placeholder="พิมพ์รหัส SKU เพื่อดูตำแหน่งในสต็อก (หลายรหัสคั่นด้วยเว้นวรรคหรือ ,)" spellcheck="false"></textarea>
    </div>
    <div class="body"></div>
    <div class="bar" hidden></div>
    <div class="grip" title="ลากเพื่อย่อ/ขยาย"></div>
  </div>`;
  (document.body || document.documentElement).appendChild(host);

  const box = root.querySelector('.box');
  const input = root.querySelector('textarea');
  const out = root.querySelector('.body');
  const bar = root.querySelector('.bar');
  const bulk = root.querySelector('.bulk');
  const drag = root.querySelector('.title');
  const grip = root.querySelector('.grip');

  let rows = null, rowsAt = 0, loading = false, loadError = '';
  const picks = new Map(); // "SKU@LOC" → {sku, loc, prefix, max, qty}

  function loadStock(force) {
    loading = true; loadError = '';
    render();
    chrome.runtime.sendMessage({ type: 'stock', force: !!force }, res => {
      loading = false;
      if (chrome.runtime.lastError || !res || !res.ok) {
        loadError = (res && res.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'ดึงสต็อกไม่สำเร็จ';
      } else {
        rows = res.rows.map(r => ({ sku: String(r.sku || '').trim(), loc: String(r.location || '').trim(), qty: Number(r.qty) || 0, damaged: isDamaged(r.location) }));
        rowsAt = res.at;
      }
      if (!box.hidden) render();
    });
  }

  // ประวัติ SKU ที่เบิกไปแล้ววันนี้ (จากฐานข้อมูล ใช้ร่วมกับแอป): คีย์ SKU (normSku) → { n, qty, last }
  let pickHist = new Map();
  function loadPickHist() {
    try {
      chrome.runtime.sendMessage({ type: 'pickToday' }, res => {
        if (chrome.runtime.lastError || !res || !res.ok) return; // ยังไม่ได้รัน supabase/op_pick_log.sql หรือออฟไลน์ → ไม่แสดงประวัติ ไม่กระทบอย่างอื่น
        pickHist = new Map((res.rows || []).map(r => [normSku(r.sku_key), { n: Number(r.n) || 0, qty: Number(r.qty) || 0, last: r.last_at }]));
        if (!box.hidden) render();
      });
    } catch (e) { /* ส่วนขยายถูกอัปเดต: ไม่กระทบ */ }
  }
  // บันทึกว่า SKU ใดบ้างถูกส่งออกใบย้ายไปแล้ว (files = แถวใบย้ายแยกไฟล์ จาก buildFiles) แล้วโหลดประวัติใหม่
  function recordPicks(files) {
    const per = new Map();
    Object.keys(files || {}).forEach(f => files[f].forEach(r => {
      const key = normSku(r[0]);
      if (!key) return;
      const cur = per.get(key) || { sku_key: key, sku: String(r[0]), qty: 0 };
      cur.qty += Number(r[3]) || 0;
      per.set(key, cur);
    }));
    if (!per.size) return;
    try {
      chrome.runtime.sendMessage({ type: 'recordPicks', rows: [...per.values()] }, () => { void chrome.runtime.lastError; setTimeout(loadPickHist, 400); });
    } catch (e) { /* ไม่กระทบการเบิก */ }
  }

  function render() {
    const terms = [...new Set(String(input.value || '').split(/[\s,]+/).map(normSku).filter(Boolean))];
    const src = `<div class="src">${rows ? 'สต็อกจากฐานข้อมูล ดึงเมื่อ ' + new Date(rowsAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''}${loading ? ' · ⏳ กำลังดึงสต็อกล่าสุด...' : ''}${loadError ? ' · ⚠️ ' + esc(loadError) : ''}</div>`;
    if (!terms.length) { out.innerHTML = src + '<div class="empty">พิมพ์รหัส SKU เพื่อค้นหา</div>'; return; }
    if (!rows) { out.innerHTML = src + '<div class="empty">' + (loadError ? 'ดึงสต็อกไม่สำเร็จ ปิดแล้วเปิดใหม่เพื่อลองอีกครั้ง' : '⏳ กำลังดึงสต็อกจากฐานข้อมูล...') + '</div>'; return; }

    const bySku = new Map(), hit = new Set(), hitDmg = new Set();
    rows.forEach(r => {
      const key = normSku(r.sku);
      if (!key || r.qty <= 0) return;
      const m = terms.filter(t => key.includes(t));
      if (!m.length) return;
      m.forEach(t => (r.damaged ? hitDmg : hit).add(t));
      if (!bySku.has(key)) bySku.set(key, { sku: r.sku, total: 0, locs: [] });
      const it = bySku.get(key);
      if (!r.damaged) it.total += r.qty;
      it.locs.push(r);
    });
    const list = [...bySku.values()].sort((a, b) => a.sku.localeCompare(b.sku, undefined, { numeric: true }));
    const missing = terms.filter(t => !hit.has(t));
    let html = src;
    if (missing.length) {
      html += `<div class="missing"><div class="missing-head">❌ ไม่มีสต็อก ${missing.length} รหัส</div>` +
        missing.map(t => `<span class="miss">${esc(t)}${hitDmg.has(t) ? ' <small>(มีแค่ตำแหน่งชำรุด)</small>' : ''}</span>`).join('') + '</div>';
    }
    html += list.slice(0, MAX_SKUS).map(it => {
      const locs = it.locs.slice().sort((a, b) => a.loc.localeCompare(b.loc, undefined, { numeric: true })).map(l => {
        if (l.damaged) return `<span class="loc dmg" title="ตำแหน่งชำรุด ไม่นับเป็นสต็อก">${esc(l.loc)} = <b>${fmt(l.qty)}</b></span>`;
        const k = normSku(it.sku) + '@' + l.loc.toUpperCase();
        const p = picks.get(k);
        const prefix = prefixOf(l.loc);
        const data = `data-k="${encodeURIComponent(k)}" data-sku="${esc(it.sku)}" data-loc="${esc(l.loc)}" data-prefix="${esc(prefix)}" data-max="${l.qty}"`;
        if (!p) return `<button type="button" class="loc" ${data} title="กดเพื่อเลือกเบิกตำแหน่งนี้">${esc(l.loc)} = <b>${fmt(l.qty)}</b></button>`;
        const q = prefix === BOX ? `<b title="ลัง H เบิกทั้งลัง">${fmt(p.qty)}</b>`
          : `<input type="number" class="qty" min="1" max="${l.qty}" step="1" value="${p.qty}" data-k="${encodeURIComponent(k)}">`;
        return `<span class="loc on"><button type="button" class="unpick" ${data} title="กดเพื่อยกเลิก">${esc(l.loc)}</button> ${q}<small>/${fmt(l.qty)}</small></span>`;
      }).join('');
      const h = pickHist.get(normSku(it.sku));
      const t = h && h.last ? new Date(h.last).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
      const dup = h && h.n > 0 ? ` dup dup${Math.min(h.n, 3)}` : '';
      const note = dup ? `<span class="pickd" title="ประวัติร่วมกับหน้า ตรวจ ORDER กับ Stock — รีเซ็ตทุกเที่ยงคืน">⚠️ เบิกไปแล้ววันนี้ ${h.n} ครั้ง · ${fmt(h.qty)} ชิ้น${t ? ' · ล่าสุด ' + t : ''}</span>` : '';
      return `<div class="row${dup}"><div class="sku"><b>${esc(it.sku)}</b><span>รวม ${fmt(it.total)}</span>${note}</div><div class="locs">${locs}</div></div>`;
    }).join('');
    if (list.length > MAX_SKUS) html += `<div class="empty">แสดง ${MAX_SKUS} จาก ${fmt(list.length)} รหัส — พิมพ์ให้เจาะจงขึ้น</div>`;
    out.innerHTML = html;
  }

  // ใส่ไฟล์ใบย้ายลงหน้าต่าง "นำเข้า" ของ BigSeller ให้เลย (ไม่ต้องดาวน์โหลดแล้วไปเลือกไฟล์เอง)
  // อยู่หน้าอื่น (หรือเว็บอื่น) = เปลี่ยนแท็บนี้ไปหน้า สินค้าคงคลัง > ย้ายสินค้า แล้วนำเข้าต่อให้ในแท็บเดิม
  const ON_BIGSELLER = /(^|\.)bigseller\.com$/i.test(location.hostname);
  const ON_MOVING = ON_BIGSELLER && /\/inventory\/movingGoods/i.test(location.pathname);
  let importQueue = []; // [{name, b64}] ไฟล์ที่รอใส่ทีละไฟล์ (หลายโซน H/K/C/J)
  // เก็บไฟล์ที่เหลือไว้ใน storage ด้วย: กดนำเข้าแล้ว BigSeller มักโหลดหน้าใหม่ ถ้าเก็บแค่ในหน้า รายการที่เหลือจะหาย
  const QUEUE_KEY = 'importQueueLeft';
  function saveQueue(stopped) {
    try {
      if (importQueue.length) chrome.storage.local.set({ [QUEUE_KEY]: { queue: importQueue, at: Date.now(), stopped: !!stopped } });
      else chrome.storage.local.remove(QUEUE_KEY);
    } catch (e) { /* ไม่กระทบ */ }
  }

  function renderBar() {
    if (!picks.size && !importQueue.length && !barNote) { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    if (importQueue.length) {
      bar.innerHTML = `<span>${barNote ? esc(barNote) + '<br>' : ''}เหลือ <b>${importQueue.length}</b> ไฟล์: ${esc(importQueue.map(f => f.name).join(', '))}</span>` +
        `<button type="button" data-act="cancel-import">ยกเลิกที่เหลือ</button>` +
        (barNote.indexOf('⚠️') === 0 ? `<button type="button" data-act="skip-import" title="ไม่นำเข้าไฟล์นี้ซ้ำ ไปไฟล์ถัดไป">ข้าม ${esc(importQueue[0].name)}</button>` : '') +
        `<button type="button" class="dl" data-act="next-import">▶ นำเข้าต่อ</button>`;
      return;
    }
    if (barNote && !picks.size) { bar.innerHTML = `<span>${esc(barNote)}</span>`; return; }
    const total = [...picks.values()].reduce((s, p) => s + p.qty, 0);
    bar.innerHTML = `<span>เลือก <b>${picks.size}</b> ตำแหน่ง · รวม <b>${fmt(total)}</b> ชิ้น</span><button type="button" data-act="clear">ล้าง</button>` +
      `<button type="button" data-act="import" title="${ON_MOVING ? 'นำเข้าใบย้ายเข้า BigSeller อัตโนมัติทีละไฟล์ (ถามยืนยันก่อนเริ่ม)' : 'ไปหน้า ย้ายสินค้า ของ BigSeller (แท็บเดิม) แล้วนำเข้าอัตโนมัติ (ถามยืนยันก่อนเริ่ม)'}">📥 นำเข้า BigSeller</button>` +
      `<button type="button" class="dl" data-act="download">⬇ โหลดใบย้าย</button>`;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // มองเห็นอยู่จริงไหม (ไม่ใช้ offsetParent เพราะหน้าต่างลอยของ BigSeller เป็น position:fixed ซึ่ง offsetParent = null เสมอ)
  // checkVisibility (Chrome 105+) ดูรวมถึงตัวแม่ทุกชั้นด้วย (display/visibility/opacity) — หน้าต่างของ BigSeller ปิดด้วยการซ่อนตัวแม่
  const visible = el => {
    if (!el || host.contains(el) || !el.isConnected || !el.getClientRects().length) return false;
    if (typeof el.checkVisibility === 'function' &&
        !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true })) return false;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
    // ต้องมีขนาดและอยู่ในจอ (บางหน้าเว็บปิดหน้าต่างด้วยการเลื่อนออกนอกจอ / ย่อเป็น 0)
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  };
  const DIALOG_TITLE = /นำเข้าเพื่อสร้างใบย้ายสินค้า/;
  // หาหน้าต่าง "นำเข้าเพื่อสร้างใบย้ายสินค้า" ที่เปิดอยู่: กล่องเล็กสุดที่มีหัวข้อนี้ และ (ถ้ามี) ช่องอัปโหลดอยู่ข้างใน
  function findImportDialog() {
    const all = [...document.querySelectorAll('div,section,form')].filter(el => DIALOG_TITLE.test(el.textContent || '') && visible(el));
    if (!all.length) return null;
    const withInput = all.filter(el => el.querySelector('input[type="file"]'));
    const pool = withInput.length ? withInput : all;
    return pool.sort((a, b) => a.textContent.length - b.textContent.length)[0];
  }
  // ช่องเลือกไฟล์: ในหน้าต่างก่อน ถ้าไม่มี (บาง UI วาง input ไว้นอกกล่อง) ใช้ input[type=file] ตัวล่าสุดในหน้า ที่รับ .xlsx ได้
  function findFileInput(dlg) {
    let inp = dlg && dlg.querySelector('input[type="file"]');
    if (inp) return inp;
    const all = [...document.querySelectorAll('input[type="file"]')].filter(i => !host.contains(i));
    const xl = all.filter(i => !i.accept || /xls|sheet|excel|\*/i.test(i.accept));
    return (xl.length ? xl : all).pop() || null;
  }
  // ปุ่ม "นำเข้า" บนหน้าย้ายสินค้า (ไม่ใช่ปุ่ม "นำเข้า" ในหน้าต่าง ซึ่งยังไม่เปิด)
  function findImportButton() {
    const cands = [...document.querySelectorAll('button,a,[role="button"],span,div')]
      .filter(el => (el.textContent || '').replace(/\s+/g, '') === 'นำเข้า' && visible(el));
    // เลือกตัวที่เป็นปุ่มจริงก่อน (button/a) แล้วค่อยตัวอื่น
    return cands.find(el => /^(BUTTON|A)$/.test(el.tagName)) || cands.find(el => el.closest('button,a')) || cands[0] || null;
  }
  // แท็บ "รอนำเข้า (N)" ของหน้าย้ายสินค้า (ปุ่ม "นำเข้า" มีเฉพาะแท็บนี้ หลังกดพิมพ์ BigSeller จะย้ายไปแท็บ "รอหยิบสินค้า")
  function findWaitingTab() {
    const c = [...document.querySelectorAll('div,span,a,li,[role="tab"]')]
      .filter(el => !host.contains(el) && /^รอนำเข้า(\(\d+\))?$/.test((el.textContent || '').replace(/\s+/g, '')) && visible(el));
    return c.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0] || null;
  }
  async function openImportDialog() {
    let dlg = findImportDialog();
    if (dlg) return dlg;
    let btn = findImportButton();
    if (!btn) {
      const tab = findWaitingTab();
      if (tab) { (tab.closest('[role="tab"],li,a') || tab).click(); btn = await waitFor(findImportButton, 8000); }
    }
    if (!btn) return null;
    (btn.closest('button,a') || btn).click();
    for (let i = 0; i < 40 && !(dlg = findImportDialog()); i++) await sleep(150);
    return dlg;
  }
  function b64ToFile(b64, name) {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  // ---------- นำเข้าอัตโนมัติ ----------
  // ใส่ไฟล์ → กด "นำเข้า" → รอหน้าต่าง "ผลลัพธ์" → ถ้าไม่มีล้มเหลว กด "ปิด" → ไฟล์ถัดไป วนจนครบ
  // มีล้มเหลว / หาปุ่มไม่เจอ / รอนานเกิน = หยุดทันที เปิดผลค้างไว้ให้ดู ไฟล์ที่เหลืออยู่ในคิว (กด "นำเข้าต่อ" ในแถบเพื่อทำต่อ)
  let running = false;
  let barNote = '';
  const enabled = b => !b.disabled && !b.classList.contains('is-disabled') && b.getAttribute('aria-disabled') !== 'true';
  const btnByText = (scope, text) => [...scope.querySelectorAll('button,a,[role="button"]')]
    .find(b => (b.textContent || '').replace(/\s+/g, '') === text && visible(b) && enabled(b));
  // หน้าต่าง "ผลลัพธ์" หลังกดนำเข้า (มีบรรทัด วิเคราะห์สำเร็จ / วิเคราะห์ล้มเหลว)
  function findResultDialog() {
    const all = [...document.querySelectorAll('div,section')].filter(el => /วิเคราะห์สำเร็จ/.test(el.textContent || '') && /ผลลัพธ์/.test(el.textContent || '') && visible(el));
    return all.sort((a, b) => a.textContent.length - b.textContent.length)[0] || null;
  }
  function parseResult(dlg) {
    const t = (dlg.textContent || '').replace(/\s+/g, ' ');
    const n = re => { const m = re.exec(t); return m ? Number(m[1]) : null; };
    return { ok: n(/วิเคราะห์สำเร็จ\s*(\d+)/), fail: n(/วิเคราะห์ล้มเหลว\s*(\d+)/), skuOk: n(/นำเข้าสำเร็จ\s*(\d+)/), skuFail: n(/นำเข้าล้มเหลว\s*(\d+)/) };
  }
  async function waitFor(fn, ms) {
    const end = Date.now() + ms;
    let v;
    while (!(v = fn()) && Date.now() < end) await sleep(250);
    return v;
  }

  // นำเข้า 1 ไฟล์จนจบ คืนข้อความผิดพลาด (null = สำเร็จ)
  async function importOne(f) {
    const dlg = await openImportDialog();
    const input = dlg ? findFileInput(dlg) : null;
    if (!input) {
      console.warn('[ค้นหาสต็อก] หาหน้าต่างนำเข้าไม่เจอ', { dialog: !!dlg, importButton: !!findImportButton(), fileInputs: document.querySelectorAll('input[type="file"]').length });
      return 'หาหน้าต่างนำเข้าของ BigSeller ไม่เจอ (ต้องอยู่ที่หน้า สินค้าคงคลัง > ย้ายสินค้า)';
    }
    const dt = new DataTransfer();
    dt.items.add(b64ToFile(f.b64, f.name));
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    // รอชื่อไฟล์ขึ้นในหน้าต่าง และปุ่ม "นำเข้า" กดได้
    const submit = await waitFor(() => (dlg.textContent || '').includes(f.name) && btnByText(dlg, 'นำเข้า'), 10000);
    if (!submit) return 'ใส่ไฟล์ ' + f.name + ' แล้ว แต่ปุ่ม "นำเข้า" ยังกดไม่ได้ (ลองกดเองในหน้าต่างนำเข้า)';
    submit.click();
    const res = await waitFor(findResultDialog, 60000);
    if (!res) return 'กดนำเข้า ' + f.name + ' แล้ว แต่ไม่เห็นหน้าต่างผลลัพธ์ (ตรวจในหน้า BigSeller ว่านำเข้าแล้วหรือยัง)';
    // รอแถบโหลดจบ: มีตัวเลขครบ และวิเคราะห์ไปแล้วอย่างน้อย 1 รายการ
    await waitFor(() => { const r = parseResult(res); return r.ok !== null && r.fail !== null && r.ok + r.fail > 0; }, 60000);
    await sleep(500);
    const r = parseResult(res);
    if (r.ok === null || r.fail === null || r.ok + r.fail === 0) return 'อ่านผลลัพธ์ของ ' + f.name + ' ไม่ได้ (ดูในหน้าต่างผลลัพธ์)';
    if (r.fail > 0 || (r.skuFail || 0) > 0) return f.name + ' นำเข้าไม่สำเร็จบางส่วน (วิเคราะห์ล้มเหลว ' + r.fail + ' · SKU ล้มเหลว ' + (r.skuFail || 0) + ') ดูรายละเอียดในหน้าต่างผลลัพธ์';
    const closeBtn = btnByText(res, 'ปิด') || res.querySelector('[aria-label="Close"],.el-dialog__headerbtn,.ant-modal-close');
    if (closeBtn) closeBtn.click();
    await waitFor(() => !findResultDialog(), 5000);
    lastOk = r.ok;
    return null;
  }

  // newBatch = เริ่มนำเข้าชุดใหม่ (จำเลขใบย้ายล่าสุดก่อนนำเข้า ไว้หาใบที่เพิ่งสร้างตอนจบ)
  async function runAutoImport(newBatch) {
    if (running || !importQueue.length) return;
    running = true; barNote = '';
    saveQueue();
    box.hidden = true;
    let batch = newBatch ? null : await getBatch();
    if (!batch) {
      await waitFor(() => slipEls().length, 5000); // รอตารางใบย้ายโหลด (ถ้ายังไม่มีใบเลย = ทุกใบหลังนำเข้าเป็นของใหม่)
      batch = { beforeMax: maxSlip(), files: 0, rows: 0, at: Date.now() };
      setBatch(batch);
    }
    while (importQueue.length) {
      lastOk = 0;
      const err = await importOne(importQueue[0]);
      if (err) {
        running = false;
        saveQueue(true); // หยุดเพราะผิดพลาด: โหลดหน้าใหม่แล้วไม่ทำต่อเอง รอผู้ใช้กด "นำเข้าต่อ"
        barNote = '⚠️ ' + err;
        box.hidden = false; applyGeo(); renderBar();
        return;
      }
      importQueue.shift();
      batch.files++; batch.rows += lastOk || 0; batch.at = Date.now();
      setBatch(batch);
      saveQueue();
      await sleep(800);
    }
    running = false;
    finishImport();
  }

  /* ---------- นำเข้าครบแล้ว: ติ๊กเฉพาะใบย้ายที่เพิ่งสร้าง → กด "พิมพ์ใบย้ายสินค้า" → หน้าพิมพ์แคปภาพทีละใบ ---------- */
  let lastOk = 0;
  const BATCH_KEY = 'importBatch', AFTER_KEY = 'importDone', PRINT_KEY = 'printCapture';
  const store = {
    get: k => new Promise(r => { try { chrome.storage.local.get(k, v => r(v && v[k])); } catch (e) { r(null); } }),
    set: (k, v) => { try { if (v) chrome.storage.local.set({ [k]: v }); else chrome.storage.local.remove(k); } catch (e) { /* ไม่กระทบ */ } }
  };
  const getBatch = async () => { const b = await store.get(BATCH_KEY); return b && Date.now() - b.at < 60 * 60 * 1000 ? b : null; };
  const setBatch = b => store.set(BATCH_KEY, b);
  // เลขที่ใบย้าย เช่น REN8DD032340 (เลขเรียงขึ้นเรื่อยๆ ใบใหม่เลขมากกว่า)
  const SLIP_RE = /^RE[A-Z0-9]{8,}$/;
  const slipCmp = (a, b) => a.localeCompare(b, undefined, { numeric: true });
  const slipEls = () => [...document.querySelectorAll('a,span,div,td')]
    .filter(el => !host.contains(el) && el.children.length === 0 && SLIP_RE.test((el.textContent || '').trim()));
  const maxSlip = () => slipEls().map(el => el.textContent.trim()).sort(slipCmp).pop() || '';

  async function finishImport() {
    const batch = await getBatch();
    setBatch(null);
    if (!batch || !batch.files) { barNote = ''; renderBar(); close(); return; }
    barNote = '✅ นำเข้าครบ ' + batch.files + ' ไฟล์แล้ว · กำลังโหลดรายการใหม่เพื่อเลือกใบย้ายไปพิมพ์...';
    box.hidden = false; applyGeo(); renderBar();
    // โหลดหน้าใหม่ให้ตารางมีใบที่เพิ่งสร้าง แล้วทำต่อหลังโหลด (resumePendingImport)
    store.set(AFTER_KEY, { beforeMax: batch.beforeMax, rows: batch.rows, files: batch.files, at: Date.now() });
    await sleep(1500);
    location.reload();
  }

  // checkbox ของแถวที่มีเลขใบย้ายนี้: ในแถวเดียวกันก่อน ถ้าไม่มี (ตารางแยกคอลัมน์ติ๊กไว้อีกตาราง) ใช้ตัวที่อยู่ระดับเดียวกันทางซ้าย
  function rowCheckbox(el) {
    const wrap = c => {
      const inp = c.matches('input') ? c : c.querySelector('input[type="checkbox"]');
      const box_ = inp ? (inp.closest('label,[class*="checkbox"]') || inp) : c;
      return {
        checked: () => inp ? inp.checked : /checked/.test(String(c.className)) || !!c.querySelector('[class*="checked"]'),
        click: () => (inp || c).click(), el: box_
      };
    };
    const row = el.closest('tr,[role="row"],[class*="table-row"],[class*="body--row"]');
    const inRow = row && (row.querySelector('input[type="checkbox"]') || row.querySelector('[class*="checkbox"]'));
    if (inRow) return wrap(inRow);
    const r = el.getBoundingClientRect();
    const near = [...document.querySelectorAll('input[type="checkbox"]')].filter(i => !host.contains(i)).map(i => {
      const b = (i.closest('label,[class*="checkbox"]') || i).getBoundingClientRect();
      return { i, d: Math.abs((b.top + b.bottom) / 2 - (r.top + r.bottom) / 2), x: b.left };
    }).filter(o => o.d < 16 && o.x < r.left).sort((a, b) => a.d - b.d)[0];
    return near ? wrap(near.i) : null;
  }

  async function printNewSlips(after) {
    box.hidden = false; applyGeo();
    barNote = '🖨️ กำลังหาใบย้ายที่เพิ่งนำเข้า...'; renderBar();
    await waitFor(() => slipEls().length, 15000);
    const isNew = n => !after.beforeMax || slipCmp(n, after.beforeMax) > 0;
    const want = Math.max(1, after.rows || after.files || 1);
    const newCount = () => new Set(slipEls().map(e => e.textContent.trim()).filter(isNew)).size;
    await waitFor(() => newCount() >= want, 15000);
    // ไม่เจอใบใหม่เลย = ตารางค้างอยู่แท็บอื่น (เช่น รอหยิบสินค้า หลังพิมพ์รอบก่อน) ค่อยกดไปแท็บ "รอนำเข้า"
    const tab = !newCount() && findWaitingTab();
    if (tab) { (tab.closest('[role="tab"],li,a') || tab).click(); await sleep(1000); await waitFor(() => newCount() >= want, 10000); }
    await sleep(500);
    const els = slipEls();
    const news = [...new Set(els.map(e => e.textContent.trim()).filter(isNew))].sort(slipCmp);
    if (!news.length) {
      barNote = '⚠️ ไม่เจอใบย้ายที่เพิ่งนำเข้าในแท็บ "รอนำเข้า" ติ๊กเลือกแล้วกด "พิมพ์ใบย้ายสินค้า" เองนะ';
      renderBar(); return;
    }
    // ติ๊กเฉพาะใบใหม่ ใบอื่นที่ติ๊กค้างอยู่เอาออก
    let miss = 0;
    for (const el of els) {
      const cb = rowCheckbox(el);
      const on = isNew(el.textContent.trim());
      if (!cb) { if (on) miss++; continue; }
      if (cb.checked() !== on) { cb.click(); await sleep(120); }
      if (on && !cb.checked()) miss++;
    }
    if (miss) {
      barNote = '⚠️ ติ๊กใบย้ายไม่ครบ (' + miss + ' ใบ) ใบที่เพิ่งนำเข้า: ' + news.join(', ') + ' ติ๊กแล้วกด "พิมพ์ใบย้ายสินค้า" เองนะ';
      renderBar(); return;
    }
    // ปุ่มพิมพ์ด้านบนตาราง (ไม่ใช่ลิงก์ "พิมพ์ใบย้ายสินค้า" ในแต่ละแถว) เอาตัวในสุด (ข้อความ) เพราะบางปุ่มรับคลิกที่ตัวใน
    const findPrint = () => {
      const c = [...document.querySelectorAll('button,a,[role="button"],span,div')]
        .filter(el => !host.contains(el) && !el.closest('tr,[role="row"]') && (el.textContent || '').replace(/\s+/g, '') === 'พิมพ์ใบย้ายสินค้า' && visible(el));
      return c.filter(el => !c.some(o => o !== el && el.contains(o)))
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0] || null;
    };
    const btnOf = el => el.closest('button,a,[role="button"]') || el;
    await waitFor(() => { const b = findPrint(); return b && enabled(btnOf(b)); }, 5000);
    const printBtn = findPrint();
    if (!printBtn) {
      barNote = '⚠️ ติ๊กใบย้าย ' + news.length + ' ใบแล้ว แต่หาปุ่ม "พิมพ์ใบย้ายสินค้า" ไม่เจอ กดเองนะ';
      renderBar(); return;
    }
    store.set(PRINT_KEY, { slips: news, at: Date.now() });
    // ช่วงนี้ถ้า BigSeller เปิดแท็บพิมพ์แล้วโดน Chrome บล็อกป๊อปอัป ให้ page-hook.js ส่ง URL มาเปิดผ่านส่วนขยายแทน
    document.documentElement.setAttribute('data-order-print', String(Date.now()));
    setTimeout(() => document.documentElement.removeAttribute('data-order-print'), 15000);
    const since = Date.now();
    const call = msg => new Promise(res => chrome.runtime.sendMessage(msg, x => res(chrome.runtime.lastError ? null : x)));
    const opened = async ms => { const end = Date.now() + ms; while (Date.now() < end) { const x = await call({ type: 'printOpened', since }); if (x && x.ok) return true; await sleep(400); } return false; };
    printBtn.scrollIntoView({ block: 'center' });
    await sleep(300);
    const r = printBtn.getBoundingClientRect(), xy = { bubbles: true, cancelable: true, view: window, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    printBtn.dispatchEvent(new PointerEvent('pointerdown', xy));
    printBtn.dispatchEvent(new MouseEvent('mousedown', xy));
    printBtn.dispatchEvent(new PointerEvent('pointerup', xy));
    printBtn.dispatchEvent(new MouseEvent('mouseup', xy));
    printBtn.click();
    if (!await opened(4000)) {
      // BigSeller ไม่รับคลิกจากโค้ด: ไฮไลต์ปุ่มให้กดเอง (ติ๊กไว้แล้ว และหน้าพิมพ์ยังแคปภาพให้เองเหมือนเดิม)
      const b = btnOf(printBtn), keep = b.style.outline;
      b.style.outline = '3px solid #f59e0b'; b.style.outlineOffset = '2px';
      setTimeout(() => { b.style.outline = keep; b.style.outlineOffset = ''; }, 60000);
      store.set(PRINT_KEY, { slips: news, at: Date.now() }); // นับเวลาใหม่ ให้มีเวลากดเอง
      barNote = '👉 ติ๊ก ' + news.length + ' ใบแล้ว กดปุ่ม "พิมพ์ใบย้ายสินค้า" (กรอบสีส้ม) ได้เลย หน้าพิมพ์จะแคปภาพแต่ละใบให้เอง';
      renderBar(); return;
    }
    barNote = '🖨️ เลือก ' + news.length + ' ใบ แล้วกดพิมพ์ — หน้าพิมพ์จะแคปภาพแต่ละใบให้เอง';
    renderBar();
    if (news.length < want) barNote += ' (เจอ ' + news.length + ' จาก ' + want + ' ใบ ถ้าขาด ดูหน้าถัดไปของตาราง)';
    renderBar();
    setTimeout(() => { if (barNote.indexOf('🖨️') === 0) { barNote = ''; close(); } }, 6000);
  }

  // หน้าพิมพ์ใบย้าย (web/print/movingOrder.htm): แคปภาพเฉพาะใบสีขาวทีละใบ บันทึกเป็น PNG ชื่อเลขใบย้าย
  const ON_PRINT = ON_BIGSELLER && /\/print\/movingOrder/i.test(location.pathname);
  const SLIP_HEAD = /เลขที่ใบย้ายสินค้า/g;
  function sheetFor(slip) {
    const leaf = [...document.querySelectorAll('body *')].filter(el => !host.contains(el) && (el.textContent || '').includes(slip))
      .sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (!leaf) return null;
    // ขึ้นไปเรื่อยๆ ตราบที่ยังมีใบย้ายแค่ใบเดียว ได้กรอบใบนั้นทั้งใบ
    const chain = [];
    for (let el = leaf; el && el !== document.body; el = el.parentElement) {
      if (((el.textContent || '').match(SLIP_HEAD) || []).length > 1) break;
      chain.push(el);
    }
    const narrow = chain.filter(el => el.getBoundingClientRect().width < document.documentElement.clientWidth * 0.9);
    return (narrow.length ? narrow : chain).pop() || leaf;
  }
  const loadImg = url => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const grab = () => new Promise(r => chrome.runtime.sendMessage({ type: 'capture' }, x => r(x && x.ok ? x.url : null)));
  // แคปทีละช่วงจอแล้วต่อกัน (ใบยาวกว่าจอก็ได้ครบ)
  async function captureEl(el) {
    const total = el.getBoundingClientRect().height;
    const absTop = el.getBoundingClientRect().top + scrollY;
    let canvas = null, ctx = null, done = 0;
    for (let guard = 0; done < total - 0.5 && guard < 30; guard++) {
      scrollTo(0, absTop + done);
      await sleep(400);
      const r = el.getBoundingClientRect();
      const url = await grab();
      if (!url) return null;
      const img = await loadImg(url);
      const s = img.width / innerWidth;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = Math.round(r.width * s); canvas.height = Math.round(total * s);
        ctx = canvas.getContext('2d');
      }
      const top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
      if (bottom <= top) break;
      ctx.drawImage(img, r.left * s, top * s, r.width * s, (bottom - top) * s, 0, (top - r.top) * s, r.width * s, (bottom - top) * s);
      done = bottom - r.top;
      await sleep(550); // Chrome ให้แคปได้ไม่เกิน 2 ครั้ง/วินาที
    }
    return canvas ? canvas.toDataURL('image/png') : null;
  }
  // คัดลอกลงคลิปบอร์ดทีละรายการ: ภาพใบย้าย แล้วตามด้วยเลขใบย้าย (เว้นช่วง ให้ประวัติคลิปบอร์ด Win+V เก็บครบ)
  // ทำจากใบสุดท้ายย้อนขึ้นมา ใน Win+V จะเรียงจากบน: เลขใบ 1, ภาพใบ 1, เลขใบ 2, ภาพใบ 2 ...
  async function copyShots(shots) {
    let n = 0;
    const put = async fn => { await waitFor(() => document.hasFocus(), 30000); await fn(); await sleep(1000); }; // คัดลอกได้เฉพาะตอนหน้านี้อยู่ด้านหน้า
    for (const s of [...shots].reverse()) {
      try {
        const bin = atob(s.url.split(',')[1]), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        await put(() => navigator.clipboard.write([new ClipboardItem({ 'image/png': new Blob([bytes], { type: 'image/png' }) })]));
        await put(() => navigator.clipboard.writeText(s.name.replace(/\.png$/i, '')));
        n++;
      } catch (e) { console.warn('[ค้นหาสต็อก] คัดลอกไม่สำเร็จ', s.name, e); }
    }
    return n;
  }
  async function capturePrintPage() {
    const job = await store.get(PRINT_KEY);
    if (!job || Date.now() - job.at > 3 * 60 * 1000) return;
    store.set(PRINT_KEY, null);
    await waitFor(() => job.slips.every(s => (document.body.innerText || '').includes(s)), 20000);
    await waitFor(() => [...document.images].every(i => i.complete), 10000);
    await waitFor(() => document.visibilityState === 'visible', 120000); // แคปได้เฉพาะแท็บที่เปิดดูอยู่
    await sleep(800);
    host.style.display = 'none';
    const keepY = scrollY, shots = [];
    for (const slip of job.slips) {
      const el = sheetFor(slip);
      const url = el && await captureEl(el);
      if (url) shots.push({ name: slip + '.png', url });
    }
    scrollTo(0, keepY);
    host.style.display = '';
    if (shots.length) chrome.runtime.sendMessage({ type: 'saveImages', files: shots }, () => {});
    const copied = await copyShots(shots);
    barNote = shots.length === job.slips.length
      ? '📸 แคปภาพใบย้าย ' + shots.length + ' ใบแล้ว · คัดลอกภาพ+เลขใบไว้ ' + copied + ' ใบ (กด Win+V เลือกวาง) · ไฟล์อยู่ในโฟลเดอร์ดาวน์โหลด'
      : '⚠️ แคปภาพได้ ' + shots.length + ' จาก ' + job.slips.length + ' ใบ · คัดลอกไว้ ' + copied + ' ใบ';
    box.hidden = false; applyGeo(); renderBar();
    setTimeout(() => { if (/^(📸|⚠️ แคป)/.test(barNote)) { barNote = ''; close(); } }, 6000);
  }

  // fromApp = ไฟล์ที่ส่งมาจากหน้า ตรวจ ORDER กับ Stock ของแอป: ไม่เปลี่ยนหน้าแอป ไปทำในแท็บ BigSeller ที่เปิดอยู่ (หรือแท็บใหม่)
  function startImport(appFiles) {
    const fromApp = !!appFiles;
    const files = appFiles || buildFiles();
    const names = Object.keys(files).sort();
    const rowsCount = names.reduce((s, n) => s + files[n].length, 0);
    if (!names.length) return;
    if (!confirm('นำเข้าใบย้าย ' + names.length + ' ไฟล์ (' + names.join(', ') + ') รวม ' + rowsCount + ' แถว เข้า BigSeller อัตโนมัติ\n' +
      (fromApp ? 'จะไปทำในแท็บ BigSeller ที่เปิดอยู่ (ไม่มีจะเปิดแท็บใหม่) ' : '') +
      'ระบบจะใส่ไฟล์ กด "นำเข้า" และกด "ปิด" ผลลัพธ์ให้เองทีละไฟล์ (หยุดเองถ้ามีรายการล้มเหลว)\nกด "ตกลง" เพื่อเริ่ม')) return;
    if (fromApp) {
      chrome.runtime.sendMessage({ type: 'build', files }, res => {
        if (chrome.runtime.lastError || !res || !res.ok) {
          alert('สร้างไฟล์ใบย้ายไม่สำเร็จ: ' + ((res && res.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || ''));
          return;
        }
        const queue = Object.keys(res.files).map(name => ({ name, b64: res.files[name] }));
        chrome.runtime.sendMessage({ type: 'openMoving', queue, otherTab: true }, () => {});
      });
      return;
    }
    recordPicks(files); // เบิกจากกล่องนี้ (ไม่ใช่ที่ส่งมาจากแอป ซึ่งแอปบันทึกเองแล้ว) → จำว่าเบิกไปแล้ววันนี้
    const btn = bar.querySelector('[data-act="import"]');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลังสร้างไฟล์...'; }
    chrome.runtime.sendMessage({ type: 'build', files }, res => {
      if (chrome.runtime.lastError || !res || !res.ok) {
        alert('สร้างไฟล์ใบย้ายไม่สำเร็จ: ' + ((res && res.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || ''));
        renderBar();
        return;
      }
      const queue = Object.keys(res.files).map(name => ({ name, b64: res.files[name] }));
      picks.clear();
      if (!ON_MOVING) {
        // ไม่ได้อยู่หน้าย้ายสินค้า: เก็บไฟล์ไว้ แล้วเปลี่ยนแท็บนี้ไปหน้านั้น นำเข้าต่อเมื่อหน้าโหลดเสร็จ
        // อยู่บน BigSeller อยู่แล้ว ใช้โดเมนเดียวกับที่เปิดอยู่ (มี/ไม่มี www) จะได้ไม่ต้องล็อกอินใหม่
        const url = ON_BIGSELLER ? location.origin + '/web/inventory/movingGoods/index.htm' : '';
        chrome.runtime.sendMessage({ type: 'openMoving', queue, url }, () => {});
        close();
        return;
      }
      importQueue = queue;
      render();
      runAutoImport(true);
    });
  }

  // เปิดหน้าย้ายสินค้า: รับไฟล์ที่ส่งมาจากหน้าอื่น หรือไฟล์ที่ยังค้าง (หน้าโหลดใหม่ระหว่างนำเข้า) แล้วนำเข้าต่อเอง
  async function resumePendingImport() {
    if (ON_PRINT) { capturePrintPage(); return; }
    if (!ON_MOVING) return;
    // เพิ่งนำเข้าครบแล้วโหลดหน้าใหม่: เลือกใบที่เพิ่งสร้างแล้วกดพิมพ์
    const after = await store.get(AFTER_KEY);
    if (after) {
      store.set(AFTER_KEY, null);
      if (Date.now() - after.at < 5 * 60 * 1000) { printNewSlips(after); return; }
    }
    const res = await new Promise(r => chrome.runtime.sendMessage({ type: 'takePending' }, x => r(x)));
    let queue = res && res.ok && res.queue && res.queue.length ? res.queue : null;
    const fresh = !!queue;
    let stopped = false;
    if (!queue) {
      const left = await new Promise(r => { try { chrome.storage.local.get(QUEUE_KEY, v => r(v && v[QUEUE_KEY])); } catch (e) { r(null); } });
      if (left && left.queue && left.queue.length && Date.now() - left.at < 30 * 60 * 1000) { queue = left.queue; stopped = !!left.stopped; }
      else if (left) chrome.storage.local.remove(QUEUE_KEY);
    }
    if (!queue) return;
    importQueue = queue;
    if (stopped) {
      // รอบก่อนหยุดเพราะผิดพลาด: ไม่ทำต่อเอง ให้ผู้ใช้ตรวจแล้วกด "นำเข้าต่อ"
      barNote = '⚠️ รอบก่อนหยุดกลางทาง ตรวจในหน้า BigSeller ก่อน แล้วกด "นำเข้าต่อ"';
      box.hidden = false; applyGeo(); renderBar();
      return;
    }
    for (let i = 0; i < 100 && !findImportButton() && !findImportDialog() && !findWaitingTab(); i++) await sleep(200);
    await sleep(500);
    runAutoImport(fresh);
  }

  function downloadPicks() {
    const files = buildFiles();
    recordPicks(files); // จำว่า SKU เหล่านี้เบิกไปแล้ววันนี้ (คนอื่นเห็นด้วย)
    const btn = bar.querySelector('.dl');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลังสร้างไฟล์...'; }
    chrome.runtime.sendMessage({ type: 'download', files }, res => {
      if (btn) { btn.disabled = false; btn.textContent = '⬇ โหลดใบย้าย'; }
      if (chrome.runtime.lastError || !res || !res.ok) alert('สร้างไฟล์ใบย้ายไม่สำเร็จ: ' + ((res && res.error) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || ''));
    });
  }

  // แถวใบย้ายแยกตามไฟล์ (H/K/C/J) จากตำแหน่งที่เลือก + SKU อื่นในลัง H เดียวกัน
  function buildFiles() {
    const files = {}, have = new Set();
    const add = (sku, loc, prefix, qty) => {
      const k = normSku(sku) + '@' + loc.toUpperCase();
      if (have.has(k) || qty <= 0) return;
      have.add(k);
      const f = fileKey(prefix, loc);
      (files[f] = files[f] || []).push([sku, '', loc, qty, 'FRONT', qty]);
    };
    picks.forEach(p => add(p.sku, p.loc, p.prefix, p.qty));
    // ลัง H: SKU อื่นในลังเดียวกันย้ายไปด้วยทั้งหมด
    picks.forEach(p => {
      if (p.prefix !== BOX) return;
      (rows || []).forEach(r => { if (r.loc.toUpperCase() === p.loc.toUpperCase()) add(r.sku, p.loc, p.prefix, r.qty); });
    });
    return files;
  }

  root.addEventListener('click', e => {
    if (orphaned()) { alert('ส่วนขยาย "ค้นหาสต็อก" ถูกอัปเดตแล้ว กรุณารีเฟรชหน้านี้ (F5) ก่อนใช้งาน'); return; }
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'clear') { picks.clear(); render(); renderBar(); }
      else if (a === 'download') downloadPicks();
      else if (a === 'import') startImport();
      else if (a === 'next-import') runAutoImport();
      else if (a === 'cancel-import') { importQueue = []; barNote = ''; saveQueue(); setBatch(null); renderBar(); }
      else if (a === 'skip-import') { importQueue.shift(); barNote = ''; saveQueue(true); if (importQueue.length) renderBar(); else finishImport(); } // ข้ามไฟล์สุดท้าย = จบชุด ไปพิมพ์ใบที่นำเข้าแล้ว
      return;
    }
    if (e.target.closest('.x')) { close(); return; }
    if (e.target.closest('.bulk')) { setMulti(!box.classList.contains('multi')); render(); return; }
    const b = e.target.closest('button.loc[data-k], .unpick');
    if (!b) return;
    const k = decodeURIComponent(b.dataset.k);
    if (picks.has(k)) picks.delete(k);
    else picks.set(k, { sku: b.dataset.sku, loc: b.dataset.loc, prefix: b.dataset.prefix, max: Number(b.dataset.max) || 0, qty: Number(b.dataset.max) || 0 });
    const keep = out.scrollTop;
    render(); renderBar();
    out.scrollTop = keep;
  });
  root.addEventListener('change', e => {
    const q = e.target.closest('.qty');
    if (!q) return;
    const p = picks.get(decodeURIComponent(q.dataset.k));
    if (!p) return;
    p.qty = Math.min(p.max, Math.max(1, Math.floor(Number(q.value) || 0)));
    q.value = p.qty;
    renderBar();
  });

  function setMulti(on) {
    box.classList.toggle('multi', on);
    bulk.setAttribute('aria-pressed', String(on));
    if (!on) input.value = input.value.replace(/\s*\n\s*/g, ' ').trim();
    input.focus();
  }
  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    e.stopPropagation(); // ไม่ให้คีย์ลัดของหน้าเว็บ (เช่น BigSeller) แย่งตอนพิมพ์
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Enter' && !box.classList.contains('multi')) e.preventDefault();
  });
  input.addEventListener('paste', () => setTimeout(() => { if (/\n/.test(input.value) && !box.classList.contains('multi')) setMulti(true); }, 0));

  /* ---------- หน้าต่างลอย: ลากย้าย / ย่อขยาย / จำตำแหน่ง ---------- */
  const GEO_KEY = 'stockPeekGeo';
  function saveGeo() {
    const r = box.getBoundingClientRect();
    try { chrome.storage.local.set({ [GEO_KEY]: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } }); } catch (e) { /* ไม่กระทบ */ }
  }
  function place(x, y) {
    const r = box.getBoundingClientRect();
    box.style.left = Math.min(Math.max(0, x), Math.max(0, innerWidth - r.width)) + 'px';
    box.style.top = Math.min(Math.max(0, y), Math.max(0, innerHeight - r.height)) + 'px';
    box.style.transform = 'none';
  }
  function applyGeo() {
    try {
      chrome.storage.local.get(GEO_KEY, v => {
        const g = v && v[GEO_KEY];
        if (!g) return;
        box.style.width = Math.min(g.w, innerWidth - 16) + 'px';
        box.style.height = Math.min(g.h, innerHeight - 16) + 'px';
        place(g.x, g.y);
      });
    } catch (e) { /* ไม่กระทบ */ }
  }
  drag.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('button')) return;
    const r = box.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    drag.setPointerCapture(e.pointerId);
    const move = ev => place(ev.clientX - dx, ev.clientY - dy);
    const up = () => { drag.removeEventListener('pointermove', move); drag.removeEventListener('pointerup', up); saveGeo(); };
    drag.addEventListener('pointermove', move); drag.addEventListener('pointerup', up);
    e.preventDefault();
  });
  grip.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const r = box.getBoundingClientRect();
    box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.transform = 'none';
    const sx = e.clientX, sy = e.clientY;
    grip.setPointerCapture(e.pointerId);
    const move = ev => {
      box.style.width = Math.min(innerWidth - r.left - 4, Math.max(340, r.width + ev.clientX - sx)) + 'px';
      box.style.height = Math.min(innerHeight - r.top - 4, Math.max(180, r.height + ev.clientY - sy)) + 'px';
    };
    const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); saveGeo(); };
    grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up);
    e.preventDefault();
  });

  /* ---------- เปิด/ปิด ---------- */
  function open() { box.hidden = false; applyGeo(); loadStock(true); loadPickHist(); render(); renderBar(); input.focus(); input.select(); }
  // ปิดแล้วเริ่มใหม่ทุกครั้ง: ล้างคำค้น ผล และตำแหน่งที่เลือก
  function close() {
    box.hidden = true;
    input.value = ''; input.blur();
    box.classList.remove('multi'); bulk.setAttribute('aria-pressed', 'false');
    picks.clear(); out.innerHTML = ''; renderBar();
  }
  function toggle() { if (box.hidden) open(); else close(); }

  // ส่วนขยายถูกรีโหลด/อัปเดตแล้ว แต่แท็บนี้ยังรันโค้ดชุดเก่า (ยังไม่ได้รีเฟรชหน้า): ใช้งานไม่ได้แล้ว บอกให้รีเฟรช
  const orphaned = () => { try { return !chrome.runtime || !chrome.runtime.id; } catch (e) { return true; } };

  // Tab (ไม่กด Shift/Ctrl/Alt) = เปิด/ปิด · ตอนพิมพ์อยู่ในช่องของหน้าเว็บ Tab ยังเลื่อนช่องตามปกติ
  window.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
    if (orphaned()) {
      if (!box.hidden) { e.preventDefault(); box.hidden = true; return; }
      return; // ปล่อย Tab ทำงานปกติ ส่วนขยายชุดใหม่จะทำงานหลังรีเฟรชหน้า
    }
    const inBox = document.activeElement === host;
    if (!box.hidden) { e.preventDefault(); e.stopPropagation(); close(); return; }
    const a = document.activeElement;
    const typing = a && !inBox && (a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || (a.tagName === 'INPUT' && !/^(checkbox|radio|button|submit)$/i.test(a.type)) || a.isContentEditable);
    if (typing) return;
    e.preventDefault(); e.stopPropagation();
    open();
  }, true);

  chrome.runtime.onMessage.addListener(msg => { if (msg && msg.type === 'toggle') toggle(); });
  resumePendingImport();

  // page-hook.js (ทำงานในหน้า BigSeller): แท็บพิมพ์ที่เปิดไม่ได้เพราะโดนบล็อกป๊อปอัป → เปิดผ่านส่วนขยาย
  if (ON_BIGSELLER) {
    window.addEventListener('message', e => {
      const d = e.data;
      if (e.source !== window || !d || d.source !== 'order-stock-peek-hook' || d.type !== 'openTab') return;
      if (!document.documentElement.hasAttribute('data-order-print')) return; // เฉพาะตอนส่วนขยายกดพิมพ์ให้
      if (!/^https:\/\/([a-z0-9-]+\.)*bigseller\.com\//i.test(String(d.url || ''))) return;
      document.documentElement.removeAttribute('data-order-print');
      chrome.runtime.sendMessage({ type: 'openTab', url: d.url }, () => {});
    });
  }

  // ปุ่ม "📥 นำเข้า BigSeller" ในแอป ORDER Workspace (เว็บ github.io / แอปที่ติดตั้งในเครื่อง file:// / ทดสอบ localhost)
  const ON_APP = /\.github\.io$/i.test(location.hostname) || location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if (ON_APP) {
    document.documentElement.setAttribute('data-order-stock-peek', '1');
    window.addEventListener('message', e => {
      const d = e.data;
      if (e.source !== window || !d || (d.source !== 'order-workspace' && d.source !== 'rayquaza-page') || d.type !== 'bigsellerImport' || !d.files || typeof d.files !== 'object') return;
      if (orphaned()) { alert('ส่วนขยายค้นหาสต็อกเพิ่งอัปเดต กด F5 รีเฟรชหน้านี้ก่อน'); return; }
      const files = {};
      Object.keys(d.files).forEach(k => {
        const rows = Array.isArray(d.files[k]) ? d.files[k].filter(r => Array.isArray(r) && r.length === 6).map(r => r.map(v => (typeof v === 'number' ? v : String(v)))) : [];
        if (rows.length) files[String(k)] = rows;
      });
      startImport(files);
    });
  }
})();
