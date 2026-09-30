<?php
// CLI only: BOBOK_CONFIG=/path/config.php php scripts/create-admin.php admin@example.com
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
$config=require(getenv('BOBOK_CONFIG')?:dirname(__DIR__).'/config.php');
$email=strtolower(trim($argv[1]??''));
if(!filter_var($email,FILTER_VALIDATE_EMAIL))exit("Usage: php scripts/create-admin.php email@example.com\n");
fwrite(STDOUT,"Admin password (12+ characters): ");
$hidden=PHP_OS_FAMILY!=='Windows' && function_exists('shell_exec') && stream_isatty(STDIN);
if($hidden)shell_exec('stty -echo');
try{$password=rtrim(fgets(STDIN),"\r\n");}finally{if($hidden)shell_exec('stty echo');fwrite(STDOUT,"\n");}
if(strlen($password)<12)exit("Password must contain at least 12 characters.\n");
$db=new PDO($config['dsn'],$config['db_user'],$config['db_password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->prepare('INSERT INTO admins (email,password_hash) VALUES (?,?)')->execute([$email,password_hash($password,PASSWORD_DEFAULT)]);
echo "Admin created.\n";
