<?

$files = glob("data/*");
$allUsers=array();
$commentData=array();
$commentData["netid"] =$_SERVER['cn'];

foreach($files as $file) {
    $fileContents = glob($file.'/*');
    $netid= preg_split ("/\//",$file);
    $netid=$netid[1];
    print_r($components);
    if(strcmp($netid, "whitelist") == 0) {
      continue;
    }
    $userData= array();
    $userData["name"]=$netid;
    $comments=array();
    foreach ($fileContents as $data) {

        $fileData = json_decode(file_get_contents($data));
         $fileDataSplit= split("/",$data);
        //print_r($fileDataSplit);
        //$fileData->commentID=$netid."_" .$fileDataSplit[2];

        $comments[]=$fileData;
        //$netid = $fileData["firstname"];
        //print_r($fileData);

    }
    //print_r(array_map("filterComments", $comments));
    //$userData["comments"]=$comments;
    $removeArray = array("removed");
    $userData["comments"] = array_values(array_filter($comments));
//    print_r($fileData);
    $allUsers[]=$userData;
}
  //getCommentThreads("ekeough_0");
//$whitelist = file_get_contents(glob("data/whitelist/*")[0]);
$whitelist = glob("data/whitelist/*");

$commentData['replies'] = getCommentThreads();
$commentData['allUsers'] = $allUsers;
$commentData['whitelist'] = preg_split("/\n/", file_get_contents($whitelist[0]));
print_r(json_encode($commentData));

//print_r($netid);
//[{"netid":"psfds",items:[{},{}{. ]}, {"netid":"pasdfd",items:[{},{}{]}]

function getCommentThreads() {
  $files = glob("data/*/*/*");
  $replies = array();
  foreach($files as $file) {
    $fileData = json_decode(file_get_contents($file));
    $replies[] = $fileData;
  }
  return $replies;
}

?>
