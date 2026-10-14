// RAYQUAZA 3D — ฉากท้องฟ้า 3 มิติ (WebGL เขียนเอง ไม่ใช้ไลบรารี ใช้ออฟไลน์ได้) + การ์ดเอียงตามเมาส์
//  - ทะเลเมฆด้านล่าง + เพดานเมฆพายุด้านบน วิ่งเข้าหากล้องเหมือนกำลังบินผ่านท้องฟ้า
//  - กล้องขยับตามเมาส์ (พารัลแลกซ์) · ฟ้าผ่าจาก rz-fx.js จุดแสงในเมฆ
//  - การ์ดเล็ก (สถิติ/การ์ดนำเข้า) เอียงตามเมาส์พร้อมแสงสะท้อน
// ทำงานเมื่อเปิดทั้ง ✦ FX และปุ่ม ◈ 3D (จำค่าไว้ในเบราว์เซอร์) · เครื่องช้าจะลดความละเอียดเอง ช้ามากจะปิดฉาก 3D เอง
(function () {
  'use strict';

  var KEY = 'rz_3d_v1';
  var root = document.documentElement;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ข้าม */ }
  var enabled = !reduce;
  try { var saved = localStorage.getItem(KEY); if (saved !== null) enabled = saved === '1'; } catch (e) { /* ข้าม */ }
  function fxOn() { return root.classList.contains('rz-fx-on'); }
  function active() { return enabled && !reduce && fxOn() && !document.hidden; }
  function isDay() { return root.getAttribute('data-prod-theme') === 'light'; }
  function setClass() { root.classList.toggle('rz-3d-on', enabled && !reduce); }
  setClass();

  /* ================= ฉากท้องฟ้า (WebGL) ================= */
  var VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS = [
    'precision mediump float;',
    'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uScroll;',
    'uniform vec3 uCloud;uniform vec3 uLit;uniform vec3 uGlow;uniform vec3 uFlashC;',
    'uniform float uFlash;uniform float uFlashX;uniform float uDens;',
    'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    // ชั้นเมฆบนระนาบ: z = ความลึก, ยิ่งไกลยิ่งจางในหมอก
    'vec4 layer(vec2 p,float hor,float k,float sp,float seed,float th){',
    ' float dy=abs(p.y-hor);if(dy<.004)return vec4(0.);',
    ' float z=k/dy;vec2 uv=vec2((p.x+uM.x*.05)*z*1.4,z+uT*sp+seed);',
    ' float d=fbm(uv*.55);float d2=fbm(uv*.55+vec2(.07,.11));',
    ' float a=smoothstep(th,th+.32,d);',
    ' float shade=clamp((d-d2)*6.+.5,0.,1.);',
    ' vec3 c=mix(uCloud,uLit,shade);',
    ' float fl=uFlash*exp(-abs(p.x-uFlashX)*2.6)*smoothstep(0.,.4,a);c+=uFlashC*fl*1.6;',
    ' float fog=exp(-z*.09);',
    ' return vec4(c,a*fog);}',
    'void main(){',
    ' vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' p+=uM*vec2(.04,.03);',
    ' float hor=-.05+uM.y*.04+uScroll*.12;',
    ' vec4 lo=p.y<hor?layer(p,hor,.32,.32,0.,.46):vec4(0.);',
    ' vec4 hi=p.y>hor?layer(p,hor,.5,.22,40.,.5):vec4(0.);',
    ' vec4 cl=lo+hi;',
    // แสงเรืองแนวขอบฟ้า + แสงจากพลังมังกรใต้ทะเลเมฆ
    ' float band=exp(-abs(p.y-hor)*9.);',
    ' vec3 col=cl.rgb*cl.a+uGlow*band*.55;',
    ' float a=clamp(cl.a*uDens+band*.4,0.,1.);',
    ' a+=uFlash*.18*exp(-abs(p.x-uFlashX)*2.)*(.4+band);col+=uFlashC*uFlash*.18*exp(-abs(p.x-uFlashX)*2.);',
    ' gl_FragColor=vec4(col*uDens,min(a,.92));}'
  ].join('\n');

  var cv, gl, prog, U = {}, scale = 0.5, broken = false;
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, flash = 0, flashX = 0;
  var slow = 0, fast = 0, last = 0, acc = 0, skyT = 0, lastDraw = 0;
  // สภาพอากาศ (ตั้งจาก rz-world.js): dens = ความหนาเมฆ, speed = ความเร็วเมฆ, tint = สีที่ผสมเข้าเมฆ/ขอบฟ้า
  window.RZ3D = { weather: { dens: 1, speed: 1, tint: null, tintAmt: 0 } };

  function palette() {
    return isDay()
      // กลางวัน: เมฆขาวอมเขียว · ขอบฟ้าทอง
      ? { cloud: [0.55, 0.85, 0.76], lit: [1.0, 0.96, 0.82], glow: [1.0, 0.82, 0.35], flash: [1.0, 0.95, 0.7], dens: 0.75 }
      // กลางคืน: เมฆพายุดำแดง · ขอบฟ้าส้มไฟ
      : { cloud: [0.10, 0.05, 0.06], lit: [0.55, 0.16, 0.08], glow: [1.0, 0.36, 0.12], flash: [1.0, 0.62, 0.35], dens: 1.0 };
  }

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function setup() {
    cv = document.createElement('canvas');
    cv.id = 'rz3d';
    cv.setAttribute('aria-hidden', 'true');
    gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
    if (!gl) { broken = true; return; }
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { broken = true; return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes', 'uT', 'uM', 'uScroll', 'uCloud', 'uLit', 'uGlow', 'uFlashC', 'uFlash', 'uFlashX', 'uDens'].forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); broken = true; cv.style.display = 'none'; });
    document.body.insertBefore(cv, document.body.firstChild);
    resize();
  }
  function resize() {
    if (!cv) return;
    cv.width = Math.max(2, Math.round(window.innerWidth * scale));
    cv.height = Math.max(2, Math.round(window.innerHeight * scale));
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    if (broken) return;
    if (!active()) { if (cv.style.display !== 'none') cv.style.display = 'none'; last = 0; return; }
    if (cv.style.display === 'none') cv.style.display = '';
    var dt = last ? ts - last : 16;
    last = ts;
    // จำกัด ~30 เฟรม/วินาที พอสำหรับเมฆ และประหยัดเครื่อง
    acc += dt;
    if (acc < 30) return;
    // ปรับความละเอียดตามความเร็วเครื่อง
    if (acc > 60) { slow++; fast = 0; } else if (acc < 40) { fast++; if (slow > 0) slow--; }
    acc = 0;
    if (slow > 45) {
      slow = 0;
      if (scale > 0.26) { scale = Math.max(0.25, scale * 0.7); resize(); }
      else { broken = true; cv.style.display = 'none'; return; } // ช้ามาก: ปิดฉาก 3D
    }

    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    flash *= 0.9;
    var pal = palette();
    var wx = window.RZ3D.weather;
    skyT += Math.min(0.2, (ts - (lastDraw || ts)) / 1000) * (wx.speed || 1);
    lastDraw = ts;
    if (wx.tint && wx.tintAmt) {
      var mix = function (c) { return c.map(function (v, i) { return v + (wx.tint[i] - v) * wx.tintAmt; }); };
      pal = { cloud: mix(pal.cloud), lit: mix(pal.lit), glow: mix(pal.glow), flash: pal.flash, dens: pal.dens };
    }
    var sc = Math.min(1, (window.scrollY || 0) / Math.max(1, document.documentElement.scrollHeight - window.innerHeight));

    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(U.uRes, cv.width, cv.height);
    gl.uniform1f(U.uT, skyT);
    gl.uniform2f(U.uM, mouse.x, mouse.y);
    gl.uniform1f(U.uScroll, sc);
    gl.uniform3fv(U.uCloud, pal.cloud);
    gl.uniform3fv(U.uLit, pal.lit);
    gl.uniform3fv(U.uGlow, pal.glow);
    gl.uniform3fv(U.uFlashC, pal.flash);
    gl.uniform1f(U.uFlash, flash);
    gl.uniform1f(U.uFlashX, flashX);
    gl.uniform1f(U.uDens, Math.min(1.6, pal.dens * (wx.dens || 1)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function onMove(e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  /* ================= การ์ดเอียงตามเมาส์ ================= */
  var TILT_SEL = '.beta-stat, .sun-imp-card, .quick-status-item, .stat, .summary-stats > *, .before-order-stats > *, .scan-stats > *';
  var tiltEl = null;
  function tiltOn() { return enabled && !reduce && fxOn(); }
  function glare(el) {
    var g = el.querySelector(':scope > .rz-glare');
    if (!g) { g = document.createElement('span'); g.className = 'rz-glare'; g.setAttribute('aria-hidden', 'true'); el.appendChild(g); }
    return g;
  }
  function untilt(el) {
    el.classList.remove('rz-tilt');
    el.style.removeProperty('--rz-rx'); el.style.removeProperty('--rz-ry');
  }
  function onTiltMove(e) {
    if (!tiltOn()) { if (tiltEl) { untilt(tiltEl); tiltEl = null; } return; }
    var el = e.target.closest ? e.target.closest(TILT_SEL) : null;
    if (el !== tiltEl) { if (tiltEl) untilt(tiltEl); tiltEl = el; }
    if (!el) return;
    var r = el.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    // การ์ดใหญ่เอียงน้อยลง จะได้ไม่เวียนหัว
    var max = r.width > 360 ? 4 : 9;
    glare(el);
    el.classList.add('rz-tilt');
    el.style.setProperty('--rz-rx', ((0.5 - py) * max).toFixed(2) + 'deg');
    el.style.setProperty('--rz-ry', ((px - 0.5) * max).toFixed(2) + 'deg');
    el.style.setProperty('--rz-gx', (px * 100).toFixed(1) + '%');
    el.style.setProperty('--rz-gy', (py * 100).toFixed(1) + '%');
  }

  /* ================= ปุ่ม ◈ 3D ================= */
  function addToggle() {
    var bar = document.querySelector('.shell > .top:not(.side-right)');
    if (!bar || document.getElementById('rz3dToggle')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'rz3dToggle';
    b.className = 'rz-fx-toggle rz-3d-toggle';
    b.title = 'เปิด/ปิดฉาก 3 มิติ (ท้องฟ้า 3D + การ์ดเอียง) — ทำงานเมื่อเปิด FX';
    var paint = function () { b.textContent = enabled ? '◈ 3D' : '◇ 3D'; b.setAttribute('aria-pressed', String(enabled)); };
    b.addEventListener('click', function () {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch (e) { /* ข้าม */ }
      if (enabled && broken && gl && !gl.isContextLost()) { broken = false; scale = 0.5; resize(); }
      setClass(); paint();
      if (!enabled && tiltEl) { untilt(tiltEl); tiltEl = null; }
    });
    paint();
    var fx = document.getElementById('rzFxToggle');
    bar.insertBefore(b, fx ? fx.nextSibling : bar.querySelector('.theme-switch'));
  }

  function init() {
    if (reduce) return;
    setup();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointermove', onTiltMove, { passive: true });
    document.addEventListener('pointerleave', function () { if (tiltEl) { untilt(tiltEl); tiltEl = null; } });
    addToggle();
    if (window.RZFX) window.RZFX.onBolt = function (x) { flash = 1; flashX = (x - 0.5) * (window.innerWidth / window.innerHeight); };
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
