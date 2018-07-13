<?

if (!file_exists("images/" . $_FILES["upload"]["name"])) {
 move_uploaded_file($_FILES["upload"]["tmp_name"],
 "userimages/" . $_FILES["upload"]["name"]);
 print_r("uploaded");
}

?>
