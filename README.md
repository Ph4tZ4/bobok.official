# BOBOK® — Software Studio

เว็บไซต์หลายหน้าภาษาไทยธีมดำ–ขาว เส้นเหลี่ยม ประกอบด้วยหน้า Home, Services, Solutions, Process, About และ Contact พร้อม Web / Mobile / Desktop / IoT / Automation & AI / Custom Software, pain points → solutions, FAQ และฟอร์มติดต่อ

## Stack

- Vite + JavaScript + CSS; Lenis smooth wheel scroll และ IntersectionObserver fade ต่างความเร็ว รองรับ reduced motion
- PHP 8.1+ / PDO MySQL + MySQL 5.7+ หรือ MariaDB 10.4+
- `/admin/`: เข้าสู่ระบบ, ดูผู้ติดต่อแบบแบ่งหน้า, เปลี่ยนสถานะ, แก้ข้อความหลัก 4 ตำแหน่ง
- Password hashing, prepared statements, session timeout 30 นาที, CSRF สำหรับ admin, rate limiting, honeypot และตรวจข้อมูลที่ server
- ฟอร์มบันทึกในฐานข้อมูล ไม่ได้ส่งอีเมลอัตโนมัติ

## Local development

```sh
npm ci
cp config.example.php config.php
# แก้ค่าฐานข้อมูล และ secure_cookies=false สำหรับ local HTTP เท่านั้น
# สร้างฐานข้อมูลและ import schema.sql ก่อน
BOBOK_CONFIG="$PWD/config.php" php -S 127.0.0.1:8080 -t public
# อีก terminal
npm run dev
```

เปิด http://127.0.0.1:65535 (ใช้ IP นี้เพื่อไม่ชน server ที่ bind IPv6 localhost อยู่)
สร้างบัญชี admin ด้วย `php scripts/create-admin.php your@email.com` แล้วกรอกรหัสผ่านอย่างน้อย 12 ตัว ไม่มีบัญชีหรือรหัสผ่าน default ในระบบ

## Build

```sh
npm run build
```

ได้ `dist/` รวมเว็บ, `/admin/`, `/api/index.php` และ `.htaccess`; production ไม่ต้องใช้ Node.js

## Deploy DirectAdmin → bobok.site

1. Backup เว็บเดิมก่อนแทนที่ไฟล์ เปิด Domain Setup เลือก `bobok.site`; เลือก PHP 8.1+ และเปิด extension `pdo_mysql` และ sessions
2. สร้างฐานข้อมูลและ DB user ใน MySQL Management จดชื่อเต็มที่ DirectAdmin เติม prefix แล้ว import `schema.sql` ผ่าน phpMyAdmin
3. Build แล้วอัปโหลด **ไฟล์ภายใน** `dist/` รวม `.htaccess` ไป `/home/USERNAME/domains/bobok.site/public_html/` (ไม่ใช่อัปโหลดโฟลเดอร์ dist ครอบอีกชั้น)
4. คัดลอก `config.example.php` เป็น `/home/USERNAME/domains/bobok.site/config.php` ซึ่งอยู่นอก `public_html` แก้ DSN/username/password ตั้ง `secure_cookies=true` และจำกัด permission ให้ PHP user อ่านได้เท่านั้น ไม่อัปโหลด schema, tests, scripts หรือ source ไป public_html
5. สร้าง admin ผ่าน SSH: เก็บ `scripts/create-admin.php` นอก public_html แล้วรัน `BOBOK_CONFIG=/home/USERNAME/domains/bobok.site/config.php php /path/create-admin.php your@email.com`
   หากไม่มี SSH ให้สร้าง password hash บนเครื่อง local ด้วย `password_hash(..., PASSWORD_DEFAULT)` แล้ว INSERT email กับ hash ลงตาราง admins ผ่าน phpMyAdmin; ห้ามเก็บรหัสผ่านตรง ๆ หรือนำ hash ไปใส่บริการออนไลน์
6. เปิด SSL Certificates / Let's Encrypt ให้ทั้ง `bobok.site` และ `www.bobok.site`; เปิด Force SSL ใน DirectAdmin และตั้ง `private_html` ให้ใช้เนื้อหาร่วมกับ `public_html` ตามการตั้งค่าของโฮสต์ ตรวจว่า config ยังอยู่นอก document root
7. จากภาพ DNS ที่ให้มา `@` และ `www` ชี้ `118.27.146.22` อยู่แล้ว ต้องยืนยันว่าเป็น IP ของโฮสต์ DirectAdmin ปลายทางก่อนเปลี่ยนใด ๆ ไม่ต้องเพิ่ม api subdomain เพราะใช้ same-origin `/api/index.php` และไม่ต้องแก้ MX/TXT/NS เพื่อ deploy เว็บนี้
8. เปิดเว็บผ่าน HTTPS, ส่งรายการทดสอบ, เข้าสู่ `/admin/`, ตรวจรายการ/สถานะ/แก้ข้อความ และทดสอบ logout ลบข้อมูลทดสอบผ่าน phpMyAdmin เมื่อเสร็จ
9. ตั้ง backup ฐานข้อมูลและไฟล์ตามรอบที่ต้องการ ตรวจ PHP error log และกำหนดรายละเอียดผู้ควบคุมข้อมูล/ช่องทางติดต่อ/ระยะเวลาเก็บข้อมูลจริงใน `public/privacy.html` ก่อนใช้งานธุรกิจจริง

ถ้าใช้ Nginx-only `.htaccess` จะไม่ถูกอ่าน ให้ผู้ดูแลโฮสต์ตั้ง directory listing off และ security headers เทียบเท่า ไม่ต้องใช้ rewrite สำหรับระบบนี้ เพราะเรียก PHP endpoint โดยตรง

คู่มือทางการ: [DirectAdmin directory layout](https://docs.directadmin.com/getting-started/first-steps/faq.html), [PHP versions](https://docs.directadmin.com/webservices/php/multiple-php.html), [PDO prepared statements](https://www.php.net/manual/en/pdo.prepared-statements.php)

## API

GET `content`, `session`; POST `inquiries`, `login`, `logout`; authenticated GET `admin/inquiries&page=1`; authenticated POST `admin/status`, `admin/content` โดยส่ง route เป็น query ของ `/api/index.php?route=...` และ JSON body; admin mutation ต้องส่ง `X-CSRF-Token` จาก session/login

## Verification

```sh
npx playwright install chromium
# เปิด npm run dev ก่อน
npm test
# หรือกำหนด CHROME_PATH เป็น executable Chrome ในเครื่อง
php -l public/api/index.php
php -l scripts/create-admin.php
```

Browser test ตรวจทั้ง 6 หน้าบน desktop/mobile, horizontal overflow, ภาพผู้บริหาร, FAQ, mobile navigation, ฟอร์มสำเร็จ/ล้มเหลว (mock API) และหน้า login

Integration test ใช้ฐานข้อมูลทดสอบแยกเท่านั้น: import schema และสร้าง admin `admin@example.com` รหัส `TestOnlyPassword123!` ในฐานข้อมูลทดสอบ แล้วเปิด PHP ด้วย config ทดสอบ จากนั้นรัน:

```sh
BOBOK_TEST_URL=http://127.0.0.1:8080 python3 tests/api-integration.py
```

ตรวจ validation, INSERT จริง, authentication/authorization, CSRF, สถานะ, CMS persistence และ logout; ห้ามใช้บัญชีทดสอบนี้บน production

## ขอบเขต

ยังไม่ได้อัปโหลดไปโฮสต์จริงหรือเปลี่ยน DNS; ต้องมีค่าฐานข้อมูลและสิทธิ์โฮสต์เพื่อ deploy. CMS แก้ข้อความหลัก 4 ตำแหน่ง ส่วนรายการบริการ/FAQ/เนื้อหาอื่นแก้ใน source แล้ว build ใหม่. ไม่มีการอ้างยอดลูกค้า ผลงาน หรือสถิติธุรกิจที่ยังไม่ได้รับข้อมูลยืนยัน
# bobok.official
