<? 

$netid = $_SERVER['cn'];
$firstname = $_SERVER['nickname'];
$lastname = $_SERVER['sn'];
$userdir = "data/$netid/";

$data = json_decode($_POST["data"]);

$data -> netid = $netid;
$data -> firstname = $firstname;
$data -> lastname = $lastname;

if (!file_exists($userdir)) {
    mkdir($userdir);
}
 $time= microtime_float();

file_put_contents("$userdir$time",json_encode($data));


function microtime_float()
{
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
}






?>




