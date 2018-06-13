<?

$netid = $_SERVER['cn'];
$firstname = $_SERVER['nickname'];
$lastname = $_SERVER['sn'];
$userdir = "data/$netid/";

$data = json_decode($_POST["data"]);

$data -> netid = $netid;
$data -> firstname = $firstname;
$data -> lastname = $lastname;
$filename = $data -> count;
$remove = $data -> remove;


if (!file_exists($userdir)) {
    mkdir($userdir);
}
$time= microtime_float();

//file_put_contents("$userdir$time",json_encode($data));
if(strlen($remove) == 0) {
  file_put_contents("$userdir$filename",json_encode($data));
}
else {
  unlink("$userdir$filename");
}
print ("$userdir$time");

function microtime_float()
{
    list($usec, $sec) = explode(" ", microtime());
    return (int)(((float)$usec + (float)$sec)*1000);
}
?>
