// RAYQUAZA: แยกที่เก็บข้อมูลในเบราว์เซอร์ออกจาก ORDER Workspace
// เว็บอยู่ที่โดเมน github.io เดียวกัน จึงใช้ localStorage ร่วมกัน ถ้าไม่เติมคำนำหน้า ค่าตั้งต่างๆ/ประวัติจะปนกัน
// ทุกคีย์ของ localStorage ถูกเติม "rayquaza:" ให้อัตโนมัติ (ฐาน IndexedDB แยกชื่อไว้ใน js/saved-files.js)
// ต้องโหลดเป็นสคริปต์แรกสุดของหน้า ก่อนสคริปต์อื่นที่อ่าน/เขียน localStorage
(function () {
  'use strict';
  try {
    var PREFIX = 'rayquaza:';
    var proto = Storage.prototype;
    var get = proto.getItem, set = proto.setItem, del = proto.removeItem;
    proto.getItem = function (k) { return get.call(this, this === window.localStorage ? PREFIX + k : k); };
    proto.setItem = function (k, v) { return set.call(this, this === window.localStorage ? PREFIX + k : k, v); };
    proto.removeItem = function (k) { return del.call(this, this === window.localStorage ? PREFIX + k : k); };
  } catch (e) { /* ไม่รองรับ: ใช้คีย์เดิมต่อ */ }
})();
