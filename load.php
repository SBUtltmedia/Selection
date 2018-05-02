<?

$files = glob("data/*");

foreach($files as $file) {
    $fileContents = glob($file.'/*.*');
    foreach ($fileContents as $data) {
        $fileData = file_get_contents($data);
        $netid = $fileData["netid"];
        print_r($fileData);
    }
//    print_r($fileData);
    
}

//[{"netid":"psfds",items:[{},{}{. ]}, {"netid":"pasdfd",items:[{},{}{]}]

?>
