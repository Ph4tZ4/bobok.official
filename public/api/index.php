<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function respond(array $data, int $status = 200): never { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
set_exception_handler(function(Throwable $e): never { error_log((string)$e); respond(['error'=>'ระบบยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง'],503); });
$configPath = getenv('BOBOK_CONFIG') ?: dirname(__DIR__, 2).'/config.php';
if (!is_file($configPath)) respond(['error'=>'ระบบยังไม่ได้เชื่อมต่อฐานข้อมูล'],503);
$config = require $configPath;
$db = new PDO($config['dsn'], $config['db_user'], $config['db_password'], [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
ini_set('session.use_strict_mode','1');
session_set_cookie_params(['httponly'=>true,'secure'=>$config['secure_cookies']??true,'samesite'=>'Strict','path'=>'/']);
session_start();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));
$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
function limit(PDO $db,string $type,int $max,int $seconds): void {
 $now=time(); $bucket=hash('sha256',$type.'|'.($_SERVER['REMOTE_ADDR']??'unknown').'|'.intdiv($now,$seconds));
 $db->prepare('INSERT INTO rate_limits (bucket,hits,expires_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE hits=hits+1')->execute([$bucket,$now+$seconds]);
 $s=$db->prepare('SELECT hits FROM rate_limits WHERE bucket=?');$s->execute([$bucket]);
 if((int)$s->fetchColumn()>$max)respond(['error'=>'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'],429);
 $db->prepare('DELETE FROM rate_limits WHERE expires_at < ?')->execute([$now]);
}
function auth(): void {if(empty($_SESSION['admin']) || time()-($_SESSION['last_active']??0)>1800){unset($_SESSION['admin']);respond(['error'=>'กรุณาเข้าสู่ระบบ'],401);}$_SESSION['last_active']=time();}
function csrf(): void {if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))respond(['error'=>'Session ไม่ถูกต้อง กรุณารีเฟรชหน้า'],403);}
$input=[];
if($method==='POST'){
 if((int)($_SERVER['CONTENT_LENGTH']??0)>20000)respond(['error'=>'ข้อมูลมีขนาดใหญ่เกินไป'],413);
 $raw=file_get_contents('php://input',false,null,0,20001);
 if(strlen($raw)>20000)respond(['error'=>'ข้อมูลมีขนาดใหญ่เกินไป'],413);
 $input=json_decode($raw,true);
 if(!is_array($input))respond(['error'=>'รูปแบบข้อมูลไม่ถูกต้อง'],400);
}
if($route==='content' && $method==='GET') {respond(['content'=>$db->query('SELECT content_key,content_value FROM content')->fetchAll(PDO::FETCH_KEY_PAIR)]);}
if($route==='inquiries' && $method==='POST') {
 limit($db,'inquiry',5,600);
 if(!empty($input['website']))respond(['error'=>'ไม่สามารถส่งข้อมูลได้'],422);
 $rules=['name'=>100,'company'=>150,'email'=>190,'phone'=>30,'service'=>100,'message'=>5000];
 foreach($rules as $key=>$max){if(isset($input[$key])&&!is_string($input[$key]))respond(['error'=>'ข้อมูลไม่ถูกต้อง'],422);$input[$key]=trim($input[$key]??'');if(preg_match_all('/./us',$input[$key])>$max)respond(['error'=>'ข้อมูลยาวเกินกำหนด'],422);}
 $services=['Web Application','Mobile Application','Desktop Application','IoT & Embedded Systems','Automation & AI','Custom Software & API','ยังไม่แน่ใจ / หลายระบบ'];
 if(!$input['name']||!filter_var($input['email'],FILTER_VALIDATE_EMAIL)||!in_array($input['service'],$services,true)||preg_match_all('/./us',$input['message'])<10||($input['consent']??'')!=='on')respond(['error'=>'กรุณากรอกข้อมูลที่จำเป็นให้ครบ และยินยอมให้ติดต่อกลับ'],422);
 $db->prepare('INSERT INTO inquiries (name,company,email,phone,service,message,consent_at) VALUES (?,?,?,?,?,?,UTC_TIMESTAMP())')->execute(array_map(fn($k)=>$input[$k],array_keys($rules)));
 respond(['ok'=>true],201);
}
if($route==='session'&&$method==='GET'){respond(['authenticated'=>!empty($_SESSION['admin'])&&time()-($_SESSION['last_active']??0)<=1800,'csrf'=>$_SESSION['csrf']]);}
if($route==='login'&&$method==='POST'){
 csrf();limit($db,'login',8,900);
 if(!is_string($input['email']??null)||!is_string($input['password']??null))respond(['error'=>'ข้อมูลไม่ถูกต้อง'],422);
 $s=$db->prepare('SELECT id,password_hash FROM admins WHERE email=?');$s->execute([strtolower(trim($input['email']))]);$admin=$s->fetch();
 if(!$admin||!password_verify($input['password'],$admin['password_hash']))respond(['error'=>'อีเมลหรือรหัสผ่านไม่ถูกต้อง'],401);
 session_regenerate_id(true);$_SESSION['admin']=$admin['id'];$_SESSION['last_active']=time();$_SESSION['csrf']=bin2hex(random_bytes(32));respond(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
}
if($route==='logout'&&$method==='POST'){csrf();$_SESSION=[];session_destroy();respond(['ok'=>true]);}
if($route==='admin/inquiries'&&$method==='GET'){auth();$page=max(1,(int)($_GET['page']??1));$offset=($page-1)*30;$total=(int)$db->query('SELECT COUNT(*) FROM inquiries')->fetchColumn();$s=$db->prepare('SELECT * FROM inquiries ORDER BY id DESC LIMIT 30 OFFSET ?');$s->bindValue(1,$offset,PDO::PARAM_INT);$s->execute();respond(['items'=>$s->fetchAll(),'total'=>$total,'page'=>$page]);}
if($route==='admin/status'&&$method==='POST'){auth();csrf();if(!in_array($input['status']??null,['new','contacted','closed'],true)||!is_numeric($input['id']??null))respond(['error'=>'สถานะไม่ถูกต้อง'],422);$s=$db->prepare('UPDATE inquiries SET status=? WHERE id=?');$s->execute([$input['status'],(int)$input['id']]);respond(['ok'=>true]);}
if($route==='admin/content'&&$method==='POST'){auth();csrf();$allowed=['hero_heading','hero_description','concept_description','contact_description'];$values=$input['content']??null;if(!is_array($values))respond(['error'=>'ข้อมูลไม่ถูกต้อง'],422);foreach($values as $key=>$value){if(!in_array($key,$allowed,true)||!is_string($value)||strlen($value)>6000)respond(['error'=>'ข้อความไม่ถูกต้องหรือยาวเกินไป'],422);}$db->beginTransaction();$s=$db->prepare('INSERT INTO content (content_key,content_value) VALUES (?,?) ON DUPLICATE KEY UPDATE content_value=VALUES(content_value)');foreach($values as $key=>$value)$s->execute([$key,trim($value)]);$db->commit();respond(['ok'=>true]);}
respond(['error'=>'ไม่พบ API ที่ร้องขอ'],404);
