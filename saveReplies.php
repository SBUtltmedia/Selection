<?
$data = json_decode($_POST["data"]);
$netid = $data -> netid;
$userdir = "data/$netid/";
$data -> firstname = $firstname;
$data -> lastname = $lastname;
$filename = $data -> commentID;
$threadDirectory = $userdir.$filename."/";
$remove = $data -> remove;
$number = $data -> number;

if($number > 0) {
  $filename = $filename."_".$number;
}

if (!file_exists($userdir)) {
    mkdir($userdir);
}

if (!file_exists($threadDirectory)) {
  mkdir($threadDirectory);
}
$time = microtime_float();

//file_put_contents("$userdir$time",json_encode($data));
if(strlen($remove) == 0) {
  file_put_contents("$threadDirectory$filename",json_encode($data));
}
else {
  unlink("$threadDirectory$filename");
}
print ("$threadDirectory$filename");

function microtime_float()
{
    list($usec, $sec) = explode(" ", microtime());
    return (int)(((float)$usec + (float)$sec)*1000);
}
?>
