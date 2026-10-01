# GitHub Actions → FTPS → bobok.site

Workflow: `.github/workflows/deploy.yml`.

## สิ่งที่ POC ตรวจแล้ว

- `z324638-w124tz.ls04.zwhhosting.com:21` และ `ls04.zwhhosting.com:21` ยอมรับ explicit FTPS พร้อมตรวจ certificate/hostname ผ่าน (TLS 1.2)
- ยังไม่ได้ยืนยัน login, passive data connection, สิทธิ์เขียน หรือ deploy จริง เพราะยังไม่มีบัญชี FTP สำหรับ deploy และ GitHub secrets
- การ build/test ใช้ GitHub runner; โฮสต์ใช้เพียง PHP + MySQL ไม่ต้องมี Node.js หรือ SSH

## ตั้งค่าครั้งเดียว

1. ใช้บัญชี FTP deploy ที่ตั้ง root เป็น `/home/zwtzlszw/domains/bobok.site` และ username `bobokofficial@bobok.site`; workflow ใช้ `server-dir: ./public_html/`
2. เมื่อล็อกอิน FTP แล้ว root ต้องเห็นโฟลเดอร์ `public_html` โดยตรง ตรวจจาก FTP client หรือ dry run ก่อน deploy จริง หาก path ที่ FTP server แสดงต่างจากนี้ ให้แก้ `server-dir` ก่อน
3. สร้างฐานข้อมูลและ import `schema.sql` ผ่าน phpMyAdmin ตาม README วาง `config.php` หนึ่งระดับเหนือ `public_html` ผ่าน File Manager บัญชี FTP ที่จำกัดไว้จะเข้าถึง config นี้ไม่ได้ สร้าง admin และเปิด HTTPS ให้เรียบร้อย
4. GitHub repo → Settings → Environments → ใช้ environment `FTP` จำกัด deployment branch เป็น `main` ไม่ต้องตั้ง required reviewer ถ้าต้องการ deploy อัตโนมัติทุก push
5. ใน **Environment secrets** ของ `FTP` เพิ่ม:

| Secret | ค่า |
| --- | --- |
| `FTP_SERVER` | `z324638-w124tz.ls04.zwhhosting.com` (ไม่มี protocol/path) |
| `FTP_USERNAME` | `bobokofficial@bobok.site` |
| `FTP_PASSWORD` | รหัสผ่านของบัญชี FTP deploy |

6. Commit/push workflow ไป `main` จะมี CI build/test แต่ยังไม่ deploy อัตโนมัติ
7. Actions → Test and deploy → Run workflow → branch `main` → คง `dry_run=true` ตรวจ path และรายการไฟล์ใน log ก่อน โหมดนี้ไม่อัปโหลด แต่ต้องเชื่อมต่อและอ่านสถานะจาก FTP ได้
8. สำรองไฟล์เว็บเดิมด้วย DirectAdmin ก่อน deploy จริงครั้งแรก จากนั้น Run workflow อีกครั้งโดยเอาเครื่องหมาย `dry_run` ออก ตรวจ workflow ผ่านและลองฟอร์มติดต่อ/admin
9. เมื่อสำเร็จ เพิ่ม **repository Actions variable** `DEPLOY_ENABLED=true` เพื่อให้ push เข้า `main` deploy อัตโนมัติ อย่าวางตัวแปรนี้เฉพาะใน environment เพราะ job condition ต้องอ่านได้ก่อนเข้า environment

## พฤติกรรม CI/CD

- Pull request และ push เข้า main: `npm ci` → PHP syntax → Vite build → Playwright ทดสอบ desktop/mobile, ฟอร์มและ admin จาก build จริง (API ถูก mock) → ตรวจไฟล์ artifact → เก็บ `site.tar.gz` 14 วัน
- Deploy ใช้ artifact ที่ทดสอบแล้วจาก workflow run เดียวกัน ไม่ build ใหม่ เก็บ `.htaccess` ไว้ใน tar ด้วย
- ใช้ FTPS พอร์ต 21 พร้อม `security: strict`; ไม่มี fallback เป็น FTP แบบไม่เข้ารหัส หาก certificate ไม่ผ่านให้แก้ hostname/certificate กับผู้ให้บริการ
- Sync เฉพาะไฟล์ที่เปลี่ยนตาม state ของ action; ไฟล์ที่เคย deploy แล้วถูกลบใน source อาจถูกลบบนโฮสต์ด้วย ห้ามลบ `.ftp-deploy-sync-state.json` เอง; `.htaccess` ปิดการอ่านไฟล์ state ผ่านเว็บสำหรับ Apache
- หลังอัปโหลดตรวจ release marker ให้ตรง commit/run, ทั้งหกหน้า, admin และ API content ซึ่งอ่านฐานข้อมูลจริง Cloudflare ต้องไม่ cache API; หากตั้ง Cache Everything ให้ bypass `/deployment.json` ด้วย
- งาน main ทำทีละงาน และไม่ยกเลิกงานที่กำลังอัปโหลดกลางทาง
- ตั้ง branch protection ของ main ให้ job `build` ผ่านก่อน merge หากต้องการ CI เป็นเงื่อนไขบังคับ

## ข้อจำกัดและการกู้คืน

- FTP sync ไม่ใช่การสลับรุ่นแบบ atomic; ระหว่าง upload ผู้ใช้บางคนอาจได้ไฟล์ต่างรุ่น หาก upload ล้มเหลว อาจมีไฟล์บางส่วนถูกแก้แล้ว workflow จะแสดง failure
- ไม่มี automatic rollback ใน POC นี้ ถ้า post-deploy check ล้มเหลว ให้ดู log และแก้สาเหตุ หรือ `git revert` commit ที่มีปัญหาแล้ว push main เพื่อ deploy รุ่นที่แก้คืน ใช้ artifact/backup ที่เก็บไว้เมื่อจำเป็นต้องคืนไฟล์ด้วยมือ
- การ rollback ไฟล์ไม่คืนฐานข้อมูล; backup/import/migration ทำผ่าน DirectAdmin/phpMyAdmin แยกต่างหาก ไม่รัน schema ซ้ำทุก deploy
- API integration suite ต้องใช้ฐานข้อมูลทดสอบแยก ยังไม่รวมใน CI นี้; health check production เป็นการอ่านข้อมูล ไม่ส่งฟอร์มหรือแก้ข้อมูล
- ตั้ง `DEPLOY_ENABLED=false` เพื่อหยุด auto deploy; CI และ manual dry run ยังใช้ได้
- `.htaccess` ต้องได้รับการรองรับจากโฮสต์ หากเป็น Nginx-only ให้ผู้ให้บริการบล็อกการอ่านไฟล์ state/config ตาม README

อ้างอิงตัวเลือก action: https://github.com/SamKirkland/FTP-Deploy-Action
