// RAYQUAZA BACKDROP — พื้นหลังภาพ "ศึกสามตำนาน" หน้า ตรวจ ORDER กับ Stock (คู่กับ css/rz-backdrop.css)
//  ภาพ img/bg-legends.jpg (ผู้ใช้จัดหามาเอง) อยู่หลังเนื้อหา + ออร่าขยับได้ตามตำแหน่งในภาพ:
//  ไคโอกา (ลูกแก้ว/ปากเรืองฟ้า) · RAYQUAZA (แกนพลังเขียวเหลือง + วงแสง) · สายฟ้าม่วงตรงกลาง · กราดอน (หน้าไฟ/ลาวาลุก)
//  + ประกายไฟลอยฝั่งกราดอน · ละอองน้ำฝั่งไคโอกา · ประกายเขียวรอบ RAYQUAZA · กล้องเลื่อนช้าๆ (Ken Burns)
//  แสดงเมื่อเปิด ✦ FX และอยู่หน้า ตรวจ ORDER กับ Stock · โหมดโฟกัส = ภาพนิ่ง ไม่มีแอนิเมชัน
(function () {
  'use strict';

  var root = document.documentElement;
  var PAGE = 'compareTool';
  // จุดออร่า: [คลาส, x%, y%] ตำแหน่งในภาพ 1280×492
  var SPOTS = [
    ['k-orb', 13.3, 17.3], ['k-mouth', 36.7, 36.6], ['k-sea', 22, 82],
    ['r-core', 51.2, 34.6], ['r-ring', 51.2, 34.6], ['r-ribbon', 50, 22],
    ['bolt', 43.8, 59],
    ['g-face', 68, 15], ['g-lava', 90, 57], ['g-ground', 55, 86], ['g-claw', 73, 48]
  ];
  var wrap = null, cv = null, cx = null, parts = [], raf = 0, onPage = false;

  function build() {
    wrap = document.createElement('div');
    wrap.className = 'rz-legends';
    wrap.setAttribute('aria-hidden', 'true');
    var stage = '<div class="rz-lg-stage"><img alt="" src="img/bg-legends.jpg?v=1" draggable="false">';
    SPOTS.forEach(function (s) { stage += '<i class="rz-lg-spot ' + s[0] + '" style="left:' + s[1] + '%;top:' + s[2] + '%"></i>'; });
    stage += '</div><canvas class="rz-lg-fx"></canvas><div class="rz-lg-dim"></div>';
    wrap.innerHTML = stage;
    document.body.appendChild(wrap);
    cv = wrap.querySelector('canvas');
    cx = cv.getContext('2d');
    var rs = function () { cv.width = innerWidth; cv.height = innerHeight; };
    rs(); window.addEventListener('resize', rs, { passive: true });
  }
  function active() {
    var s = document.getElementById(PAGE);
    return !!(s && s.classList.contains('active')) && root.classList.contains('rz-fx-on');
  }
  function sync() {
    var v = active();
    if (v === onPage) return;
    onPage = v;
    root.classList.toggle('rz-legends-on', v);
    if (v) { if (!wrap) build(); parts = []; cancelAnimationFrame(raf); loop(); }
    else cancelAnimationFrame(raf);
  }

  // ละอองบนภาพ: ซ้าย = ละอองน้ำ/หมอก (ไคโอกา) · กลาง = ประกายเขียว (RAYQUAZA) · ขวา = ประกายไฟ (กราดอน)
  function spawn(W, H) {
    var r = Math.random(), z = r < 0.42 ? 'g' : r < 0.75 ? 'k' : 'r';
    if (z === 'g') return { z: z, x: W * (0.55 + Math.random() * 0.45), y: H + 10, vx: (Math.random() - 0.4) * 0.8, vy: -(0.6 + Math.random() * 1.8), s: 1 + Math.random() * 2.4, a: 0.6 + Math.random() * 0.4, ph: Math.random() * 6 };
    if (z === 'k') return { z: z, x: W * Math.random() * 0.42, y: H * (0.4 + Math.random() * 0.6), vx: 0.2 + Math.random() * 0.5, vy: -(0.1 + Math.random() * 0.4), s: 1 + Math.random() * 3, a: 0.25 + Math.random() * 0.35, ph: Math.random() * 6 };
    return { z: z, x: W * (0.44 + Math.random() * 0.14), y: H * (0.2 + Math.random() * 0.35), vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.6) * 1.2, s: 0.8 + Math.random() * 1.8, a: 0.9, ph: Math.random() * 6, life: 60 + Math.random() * 80 };
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!onPage || document.hidden || root.classList.contains('rz-focus')) { if (cx) cx.clearRect(0, 0, cv.width, cv.height); return; }
    var W = cv.width, H = cv.height;
    cx.clearRect(0, 0, W, H);
    while (parts.length < 90) parts.push(spawn(W, H));
    cx.globalCompositeOperation = 'lighter';
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.ph += 0.05; p.x += p.vx + Math.sin(p.ph) * 0.3; p.y += p.vy;
      var dead = p.y < -10 || p.x > W + 10;
      if (p.z === 'g') cx.fillStyle = 'rgba(255,' + (140 + ((p.ph * 30) % 90 | 0)) + ',40,' + p.a + ')';
      else if (p.z === 'k') cx.fillStyle = 'rgba(150,170,255,' + p.a * (0.6 + 0.4 * Math.sin(p.ph)) + ')';
      else { p.life--; p.a *= 0.985; dead = dead || p.life < 0; cx.fillStyle = 'rgba(200,255,90,' + p.a + ')'; }
      cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 6.283); cx.fill();
      if (dead) parts.splice(i, 1);
    }
    cx.globalCompositeOperation = 'source-over';
  }

  function init() {
    var s = document.getElementById(PAGE);
    if (s) new MutationObserver(sync).observe(s, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
