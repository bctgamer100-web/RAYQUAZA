/* ส่วนขยาย "ค้นหาสต็อก" — ทำงานในหน้า BigSeller (world: MAIN)
   ตอนส่วนขยายกด "พิมพ์ใบย้ายสินค้า" ให้ (มี data-order-print บน <html>) Chrome มักบล็อกแท็บพิมพ์ที่เปิดขึ้น
   เพราะไม่ได้เกิดจากการกดของคนจริง → ส่ง URL ไปให้ content.js เปิดแท็บผ่านส่วนขยายแทน
   นอกช่วงนั้นไม่ทำอะไร หน้าเว็บทำงานตามปกติ */
(function () {
  'use strict';
  const active = () => document.documentElement && document.documentElement.hasAttribute('data-order-print');
  const send = url => {
    try { url = new URL(String(url), location.href).href; } catch (e) { return; }
    window.postMessage({ source: 'order-stock-peek-hook', type: 'openTab', url }, '*');
  };

  // window.open: เปิดตามปกติก่อน ถ้าโดนบล็อก (ได้ null) ค่อยส่งให้ส่วนขยายเปิด
  const open = window.open;
  window.open = function (url) {
    const w = open.apply(this, arguments);
    if (!w && active() && url) send(url);
    return w;
  };

  // ลิงก์ target=_blank ที่ถูกกดด้วยโค้ด (ไม่ใช่คนกด) โดนบล็อกเหมือนกัน → ส่งให้ส่วนขยายเปิดแทน
  const isBlank = a => a && a.href && /^_blank$/i.test(a.target || '');
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (active() && isBlank(this)) { send(this.href); return; }
    return click.apply(this, arguments);
  };
  window.addEventListener('click', e => {
    if (e.isTrusted || !active()) return;
    const a = e.target && e.target.closest && e.target.closest('a');
    if (isBlank(a)) { e.preventDefault(); send(a.href); }
  }, true);
})();
