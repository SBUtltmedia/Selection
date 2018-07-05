<?

$netid = $_SERVER['cn'];
$firstname = $_SERVER['nickname'];
$lastname = $_SERVER['sn'];
$userdir = "data/$netid/";

$data = json_decode($_POST["data"]);

$data -> netid = $netid;
$data -> firstname = $firstname;
$data -> lastname = $lastname;
$filename = $data -> commentID;
$threadDirectory = "$userdir$filename"."Replies/";
$remove = $data -> remove;
$number = $data -> number;

if (!file_exists($userdir)) {
    mkdir($userdir);
}
if (!file_exists($threadDirectory) && strcmp($threadDirectory, $userdir."Replies/") != 0) {
    mkdir($threadDirectory);
}

if($number > 0) {

  print("this is a reply");
  $filename = $filename."_".$number;
  if(strlen($remove) == 0) {
    file_put_contents("$threadDirectory$filename",json_encode($data));
  }
  else {
    unlink("$threadDirectory$filename");
  }
  print ("$threadDirectory$filename");
}

else{
  if(strlen($remove) == 0) {
    file_put_contents("$userdir$filename",json_encode($data));
  }
  else {
    unlink("$userdir$filename");
  }
  //print ("$userdir$filename");
  print("$threadDirectory");
}
//file_put_contents("$userdir$time",json_encode($data));
file_put_contents("test",$threadDirectory);
function microtime_float()
{
    list($usec, $sec) = explode(" ", microtime());
    return (int)(((float)$usec + (float)$sec)*1000);
}
?>
