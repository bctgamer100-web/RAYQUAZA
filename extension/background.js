/* ส่วนขยาย "ค้นหาสต็อก" (ORDER Workspace) — ทำงานเบื้องหลัง
   - ดึงสต็อก (op_stock) จาก Supabase ให้หน้าเว็บ (ทำที่นี่เพราะบางเว็บ เช่น BigSeller ตั้ง CSP บล็อกการเชื่อมต่อจากหน้าเว็บ)
   - สร้างไฟล์ใบย้ายสินค้า (ฟอร์ม BigSeller) แล้วสั่งดาวน์โหลด
   - กดไอคอนส่วนขยาย = เปิด/ปิดกล่องค้นหาบนแท็บที่เปิดอยู่ */
importScripts('vendor/xlsx.full.min.js', 'vendor/jszip.min.js');

// ค่าเดียวกับ js/sunshine.js ของ ORDER Workspace (publishable key อ่านอย่างเดียวได้)
const SUPABASE_URL = 'https://yvfqxlgkwaylivopctno.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xNq2vHHwVe8v_rujH3P_QQ_ep6-g6ol';

let cache = null, cacheAt = 0, loading = null;

async function fetchStock() {
  let rows = [], offset = 0;
  for (;;) {
    const url = SUPABASE_URL + '/rest/v1/op_stock?select=sku,location,qty&order=id&offset=' + offset + '&limit=1000';
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY } });
    if (!res.ok) throw new Error('ดึงสต็อกไม่สำเร็จ (' + res.status + ')');
    const page = await res.json();
    rows = rows.concat(page);
    if (page.length < 1000) break;
    offset += 1000;
  }
  return rows;
}

// force = ดึงใหม่ (เปิดกล่องทุกครั้ง) · ถ้าเพิ่งดึงไม่ถึง 30 วินาที ใช้ของเดิม กันยิงซ้ำถี่ๆ
async function getStock(force) {
  if (cache && (!force || Date.now() - cacheAt < 30000)) return { rows: cache, at: cacheAt };
  if (!loading) {
    loading = fetchStock().then(rows => { cache = rows; cacheAt = Date.now(); return rows; })
      .finally(() => { loading = null; });
  }
  await loading;
  return { rows: cache, at: cacheAt };
}

// ประวัติ SKU ที่ส่งออกใบย้ายไปแล้ว "วันนี้" (ใช้ร่วมกับหน้า ตรวจ ORDER กับ Stock ของแอป ทุกเครื่องเห็นชุดเดียวกัน)
// อยู่ในตาราง op_pick_log ผ่านฟังก์ชัน op_pick_today / op_pick_record (ต้องรัน supabase/op_pick_log.sql ของ ORDER Workspace ก่อน)
async function rpc(name, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  if (!res.ok) {
    let m = String(res.status);
    try { m = (await res.json()).message || m; } catch (e) { /* ไม่กระทบ */ }
    throw new Error(m);
  }
  return res.json();
}

const MOVE_HEADERS = [
  '*เลข SKU（กรอกเลข SKU หรือ GTIN อย่างใดอย่างหนึ่ง）',
  '*GTIN（กรอกเลข SKU หรือ GTIN อย่างใดอย่างหนึ่ง）',
  '*ตำแหน่งที่ย้ายออก (จำเป็นต้องกรอก)',
  '*จำนวนสินค้าที่ย้ายออก (จำเป็นต้องกรอก)',
  '*ตำแหน่งที่ย้ายเข้า (จำเป็นต้องกรอก)',
  '*จำนวนสินค้าที่ย้ายเข้า (จำเป็นต้องกรอก)'
];

function sheetBytes(rows) {
  rows = rows.slice().sort((a, b) => String(a[2]).localeCompare(String(b[2]), undefined, { numeric: true }) || String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }));
  const ws = XLSX.utils.aoa_to_sheet([MOVE_HEADERS, ...rows]);
  const width = (i, min) => Math.max(min, ...rows.map(r => String(r[i]).length + 2));
  ws['!cols'] = [{ wch: width(0, 24) }, { wch: 10 }, { wch: width(2, 20) }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SKU');
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}

// files: { "C": [[sku,'',loc,qty,'FRONT',qty], ...], ... } → ไฟล์เดียว .xlsx / หลายไฟล์ .zip
async function downloadMoveFiles(files) {
  const names = Object.keys(files).sort();
  if (!names.length) return;
  const safe = n => String(n).replace(/[\\/:*?"<>|]/g, '_');
  if (names.length === 1) {
    const b64 = sheetBytes(files[names[0]]);
    await chrome.downloads.download({ url: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + b64, filename: safe(names[0]) + '.xlsx', saveAs: false });
    return;
  }
  const zip = new JSZip();
  names.forEach(n => zip.file(safe(n) + '.xlsx', sheetBytes(files[n]), { base64: true }));
  const b64 = await zip.generateAsync({ type: 'base64' });
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  await chrome.downloads.download({
    url: 'data:application/zip;base64,' + b64,
    filename: `ใบย้าย_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.zip`,
    saveAs: false
  });
}

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg && msg.type === 'stock') {
    getStock(!!msg.force).then(r => reply({ ok: true, rows: r.rows, at: r.at })).catch(e => reply({ ok: false, error: e.message }));
    return true;
  }
  // ประวัติการเบิกวันนี้ (ต่อ SKU) และบันทึกการเบิก — ล้มเหลวก็ไม่กระทบการค้นหา/การเบิก
  if (msg && msg.type === 'pickToday') {
    rpc('op_pick_today').then(rows => reply({ ok: true, rows })).catch(e => reply({ ok: false, error: e.message }));
    return true;
  }
  if (msg && msg.type === 'recordPicks') {
    rpc('op_pick_record', { p_rows: msg.rows || [] }).then(() => reply({ ok: true })).catch(e => reply({ ok: false, error: e.message }));
    return true;
  }
  // สร้างไฟล์ใบย้ายแล้วส่งกลับเป็น base64 (ใช้ใส่ไฟล์ลงหน้าต่างนำเข้าของ BigSeller โดยตรง ไม่ต้องดาวน์โหลด)
  if (msg && msg.type === 'build') {
    try {
      const out = {};
      Object.keys(msg.files || {}).sort().forEach(n => { out[String(n).replace(/[\\/:*?"<>|]/g, '_') + '.xlsx'] = sheetBytes(msg.files[n]); });
      reply({ ok: true, files: out });
    } catch (e) { reply({ ok: false, error: e.message }); }
    return true;
  }
  if (msg && msg.type === 'download') {
    downloadMoveFiles(msg.files || {}).then(() => reply({ ok: true })).catch(e => reply({ ok: false, error: e.message }));
    return true;
  }
});

// ไม่ได้อยู่หน้า "ย้ายสินค้า": เก็บไฟล์ที่รอนำเข้าไว้ แล้วเปลี่ยนแท็บเดิมไปหน้านั้น (content.js ในหน้าใหม่จะมารับไปใส่ต่อเอง)
const MOVING_URL = 'https://www.bigseller.com/web/inventory/movingGoods/index.htm';
let pendingImport = null; // { queue:[{name,b64}], at }
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg && msg.type === 'openMoving') {
    pendingImport = { queue: msg.queue || [], at: Date.now() };
    chrome.storage.local.set({ pendingImport }); // กัน service worker หลับแล้วข้อมูลหาย
    const url = /^https:\/\/([a-z0-9-]+\.)*bigseller\.com\//i.test(msg.url || '') ? msg.url : MOVING_URL;
    if (msg.otherTab) {
      // ส่งมาจากแอป: ไม่แตะหน้าแอป ใช้แท็บ BigSeller ที่เปิดอยู่ (เปลี่ยนไปหน้าย้ายสินค้า) ไม่มีค่อยเปิดแท็บใหม่
      chrome.tabs.query({ url: '*://*.bigseller.com/*' }, tabs => {
        tabs = tabs || [];
        const t = tabs.find(x => /\/inventory\/movingGoods/i.test(x.url || '')) || tabs.find(x => sender.tab && x.windowId === sender.tab.windowId) || tabs[0];
        if (!t) { chrome.tabs.create({ url: MOVING_URL, index: sender.tab ? sender.tab.index + 1 : undefined }); return; }
        chrome.tabs.update(t.id, { url: new URL(t.url).origin + '/web/inventory/movingGoods/index.htm', active: true });
        chrome.windows.update(t.windowId, { focused: true });
      });
    }
    // ใช้แท็บเดิม: เปลี่ยนหน้าไปหน้าย้ายสินค้าเลย (ไม่มีแท็บต้นทาง ค่อยเปิดแท็บใหม่)
    else if (sender.tab && sender.tab.id) chrome.tabs.update(sender.tab.id, { url });
    else chrome.tabs.create({ url });
    reply({ ok: true });
    return true;
  }
  if (msg && msg.type === 'takePending') {
    const done = p => {
      pendingImport = null;
      chrome.storage.local.remove('pendingImport');
      // ใช้ได้ภายใน 5 นาที กันเปิดหน้าย้ายสินค้าทีหลังแล้วเด้งใส่ไฟล์เก่า
      reply({ ok: true, queue: p && Date.now() - p.at < 5 * 60 * 1000 ? p.queue : [] });
    };
    if (pendingImport) done(pendingImport);
    else chrome.storage.local.get('pendingImport', v => done(v && v.pendingImport));
    return true;
  }
});

// จำเวลาที่เปิดหน้าพิมพ์ใบย้าย (ใช้เช็คว่ากดปุ่มพิมพ์ติดไหม)
let printTabAt = 0;
const notePrint = url => { if (/bigseller\.com\/web\/print\/movingOrder/i.test(url || '')) printTabAt = Date.now(); };
chrome.tabs.onCreated.addListener(t => notePrint(t.pendingUrl || t.url));
chrome.tabs.onUpdated.addListener((id, info, t) => notePrint(info.url || (t && t.url)));

// หน้าพิมพ์ใบย้าย: แคปหน้าจอที่เห็นอยู่ (content.js ตัดเอาเฉพาะใบ) และบันทึกภาพลงโฟลเดอร์ดาวน์โหลด
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg && msg.type === 'capture') {
    chrome.tabs.captureVisibleTab(sender.tab ? sender.tab.windowId : undefined, { format: 'png' }, url => {
      const err = chrome.runtime.lastError;
      reply(url ? { ok: true, url } : { ok: false, error: err ? err.message : 'แคปไม่ได้' });
    });
    return true;
  }
  // แท็บพิมพ์ใบย้ายที่ BigSeller เปิดไม่ได้ (โดนบล็อกป๊อปอัป): เปิดให้ข้างๆ แท็บเดิม
  if (msg && msg.type === 'openTab') {
    if (/^https:\/\/([a-z0-9-]+\.)*bigseller\.com\//i.test(String(msg.url || ''))) {
      chrome.tabs.create({ url: msg.url, index: sender.tab ? sender.tab.index + 1 : undefined, openerTabId: sender.tab ? sender.tab.id : undefined });
    }
    reply({ ok: true });
    return true;
  }
  if (msg && msg.type === 'saveImages') {
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    const dir = `ใบย้าย_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    Promise.all((msg.files || []).map(f => chrome.downloads.download({
      url: f.url, filename: dir + '/' + String(f.name).replace(/[\\/:*?"<>|]/g, '_'), saveAs: false, conflictAction: 'uniquify'
    }))).then(() => reply({ ok: true })).catch(e => reply({ ok: false, error: e.message }));
    return true;
  }
});

chrome.action.onClicked.addListener(tab => {
  if (tab && tab.id) chrome.tabs.sendMessage(tab.id, { type: 'toggle' }).catch(() => {});
});
