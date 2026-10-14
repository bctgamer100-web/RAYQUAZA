// RAYQUAZA PICKER — ตัวเลือกเวลา/วันที่ของธีม ใช้แทนกล่องของเบราว์เซอร์ (ที่แต่งสีไม่ได้) กับ input[type=time] และ input[type=date]
// - คลิกช่องเพื่อเปิด · ยังพิมพ์ในช่องได้ตามปกติ · Esc / คลิกที่อื่น = ปิด
// - เลือกแล้วตั้งค่า input.value และส่งเหตุการณ์ input + change เหมือนผู้ใช้เลือกเอง (โค้ดเดิมที่ฟัง change ทำงานเหมือนเดิม)
(function () {
  'use strict';

  var MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  var DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  var pop = null, target = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fire(inp) {
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function setVal(inp, v) {
    if (inp.value === v) return;
    inp.value = v;
    fire(inp);
  }
  function btn(text, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    if (cls) b.className = cls;
    return b;
  }

  function close() {
    if (pop) { pop.remove(); pop = null; }
    target = null;
    document.removeEventListener('pointerdown', onOutside, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
  }
  function onOutside(e) {
    if (pop && !pop.contains(e.target) && e.target !== target) close();
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

  function place() {
    if (!pop || !target) return;
    if (!target.isConnected) { close(); return; }
    var r = target.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - pw - 8);
    var top = r.bottom + 6;
    if (top + ph > window.innerHeight - 8 && r.top - ph - 6 > 8) top = r.top - ph - 6; // ไม่พอด้านล่าง = เปิดขึ้นบน
    pop.style.left = left + 'px';
    pop.style.top = Math.max(8, top) + 'px';
  }

  function open(inp) {
    close();
    target = inp;
    pop = document.createElement('div');
    pop.className = 'rz-pick';
    pop.setAttribute('role', 'dialog');
    if (inp.type === 'time') buildTime(inp); else buildDate(inp);
    document.body.appendChild(pop);
    place();
    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
  }

  /* ---------- เวลา ---------- */
  function buildTime(inp) {
    var m = /^(\d{2}):(\d{2})/.exec(inp.value || '');
    var h = m ? +m[1] : null, mi = m ? +m[2] : null;
    var step = parseInt(inp.getAttribute('step'), 10);
    var mStep = step && step >= 60 && step % 60 === 0 ? Math.max(1, step / 60) : 1;

    var head = document.createElement('div');
    head.className = 'rz-pick-head';
    head.innerHTML = '<span>เลือกเวลา</span><b></b>';
    var show = head.querySelector('b');
    var cols = document.createElement('div');
    cols.className = 'rz-pick-cols';
    var hc = document.createElement('div'); hc.className = 'rz-pick-col'; hc.innerHTML = '<small>ชั่วโมง</small>';
    var mc = document.createElement('div'); mc.className = 'rz-pick-col'; mc.innerHTML = '<small>นาที</small>';
    cols.append(hc, mc);

    function paint() {
      show.textContent = (h === null ? '--' : pad(h)) + ':' + (mi === null ? '--' : pad(mi));
      Array.prototype.forEach.call(hc.querySelectorAll('button'), function (b) { b.classList.toggle('is-on', +b.dataset.v === h); });
      Array.prototype.forEach.call(mc.querySelectorAll('button'), function (b) { b.classList.toggle('is-on', +b.dataset.v === mi); });
    }
    function commit() { if (h !== null) setVal(inp, pad(h) + ':' + pad(mi === null ? 0 : mi)); }
    for (var i = 0; i < 24; i++) {
      var b = btn(pad(i)); b.dataset.v = i;
      b.addEventListener('click', function () { h = +this.dataset.v; if (mi === null) mi = 0; commit(); paint(); });
      hc.appendChild(b);
    }
    for (var j = 0; j < 60; j += mStep) {
      var c = btn(pad(j)); c.dataset.v = j;
      c.addEventListener('click', function () { mi = +this.dataset.v; if (h === null) h = new Date().getHours(); commit(); paint(); close(); });
      mc.appendChild(c);
    }
    var foot = document.createElement('div');
    foot.className = 'rz-pick-foot';
    var now = btn('ตอนนี้'), clear = btn('ล้าง'), ok = btn('ตกลง', 'rz-pick-ok');
    now.addEventListener('click', function () { var d = new Date(); h = d.getHours(); mi = d.getMinutes() - d.getMinutes() % mStep; commit(); paint(); });
    clear.addEventListener('click', function () { h = mi = null; setVal(inp, ''); paint(); });
    ok.addEventListener('click', close);
    if (inp.required) clear.disabled = true;
    foot.append(now, clear, ok);
    pop.append(head, cols, foot);
    paint();
    // เลื่อนรายการให้ค่าที่เลือกอยู่กลางกล่อง
    setTimeout(function () {
      [hc, mc].forEach(function (col) {
        var on = col.querySelector('.is-on');
        if (on) col.scrollTop = on.getBoundingClientRect().top - col.getBoundingClientRect().top + col.scrollTop - col.clientHeight / 2 + on.offsetHeight / 2;
      });
    }, 0);
  }

  /* ---------- วันที่ ---------- */
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseIso(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function buildDate(inp) {
    pop.classList.add('rz-pick-date');
    var sel = parseIso(inp.value), today = new Date();
    var min = parseIso(inp.min), max = parseIso(inp.max);
    var view = new Date((sel || today).getFullYear(), (sel || today).getMonth(), 1);

    var head = document.createElement('div');
    head.className = 'rz-pick-head';
    var prev = btn('‹', 'rz-pick-nav'), next = btn('›', 'rz-pick-nav');
    var title = document.createElement('b');
    head.append(prev, title, next);
    var grid = document.createElement('div');
    grid.className = 'rz-pick-grid';

    function render() {
      title.textContent = MONTHS[view.getMonth()] + ' ' + (view.getFullYear() + 543);
      grid.textContent = '';
      DAYS.forEach(function (d) { var s = document.createElement('span'); s.textContent = d; grid.appendChild(s); });
      var start = new Date(view.getFullYear(), view.getMonth(), 1 - view.getDay());
      for (var i = 0; i < 42; i++) {
        var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        var b = btn(String(d.getDate()));
        b.dataset.v = iso(d);
        if (d.getMonth() !== view.getMonth()) b.classList.add('is-out');
        if (iso(d) === iso(today)) b.classList.add('is-today');
        if (sel && iso(d) === iso(sel)) b.classList.add('is-on');
        if ((min && d < min) || (max && d > max)) b.disabled = true;
        b.addEventListener('click', function () { setVal(inp, this.dataset.v); close(); });
        grid.appendChild(b);
      }
    }
    prev.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    next.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });

    var foot = document.createElement('div');
    foot.className = 'rz-pick-foot';
    var tbtn = btn('วันนี้', 'rz-pick-ok'), clear = btn('ล้าง');
    tbtn.addEventListener('click', function () { setVal(inp, iso(today)); close(); });
    clear.addEventListener('click', function () { setVal(inp, ''); close(); });
    if (inp.required) clear.disabled = true;
    foot.append(clear, tbtn);
    pop.append(head, grid, foot);
    render();
  }

  /* ---------- เปิดเมื่อคลิกช่อง / Alt+↓ / F4 ---------- */
  function pickable(t) {
    return t && t.tagName === 'INPUT' && (t.type === 'time' || t.type === 'date') && !t.disabled && !t.readOnly;
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!pickable(t)) return;
    if (pop && target === t) return; // เปิดอยู่แล้ว: คลิกในช่องเพื่อพิมพ์ต่อ
    open(t);
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!pickable(t)) return;
    // ปุ่มลัดเปิดกล่องของเบราว์เซอร์ → เปิดของธีมแทน
    if ((e.altKey && e.key === 'ArrowDown') || e.key === 'F4' || (e.key === ' ' && t.type === 'date')) {
      e.preventDefault();
      open(t);
    }
  }, true);
  // เผื่อโค้ดอื่นเรียก showPicker() ของช่องเวลา/วันที่
  try {
    var native = HTMLInputElement.prototype.showPicker;
    if (native) {
      HTMLInputElement.prototype.showPicker = function () {
        if (pickable(this)) { open(this); return; }
        return native.call(this);
      };
    }
  } catch (e) { /* ข้าม */ }
})();
