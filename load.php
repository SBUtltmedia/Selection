<?

$files = glob("data/*");
$allUsers=array();
foreach($files as $file) {
    $fileContents = glob($file.'/*.*');
    $netid= preg_split ("/\//",$file);
    $netid=$netid[1];
    $userData= array();
    $userData["name"]=$netid;
    $comments=array();
    foreach ($fileContents as $data) {
       
        $fileData = json_decode(file_get_contents($data));
        $comments[]=$fileData;
        //$netid = $fileData["firstname"];
        //print_r($fileData);
        
    }
    $userData["comments"]=$comments;
//    print_r($fileData);
$allUsers[]=    $userData;
}
print_r(json_encode($allUsers));

//print_r($netid);
//[{"netid":"psfds",items:[{},{}{. ]}, {"netid":"pasdfd",items:[{},{}{]}]

?>
