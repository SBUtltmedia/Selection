<?

$files = glob("data/*");
$allUsers=array();
$commentData=array();
$commentData["netid"] =$_SERVER['cn'];
foreach($files as $file) {
    $fileContents = glob($file.'/*');
    $netid= preg_split ("/\//",$file);
    $netid=$netid[1];
    $userData= array();
    $userData["name"]=$netid;
    $comments=array();
    foreach ($fileContents as $data) {

        $fileData = json_decode(file_get_contents($data));
         $fileDataSplit= split("/",$data);
        //print_r($fileDataSplit);
        $fileData->commentID=$netid."_" .$fileDataSplit[2];
        $comments[]=$fileData;
        //$netid = $fileData["firstname"];
        //print_r($fileData);

    }
    $userData["comments"]=$comments;
//    print_r($fileData);
    $allUsers[]=$userData;
}

$commentData['allUsers'] = $allUsers;
print_r(json_encode($commentData));

//print_r($netid);
//[{"netid":"psfds",items:[{},{}{. ]}, {"netid":"pasdfd",items:[{},{}{]}]

?>
