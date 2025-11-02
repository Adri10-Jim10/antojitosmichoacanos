<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Producto.php';

// Función para obtener la imagen correcta del producto
function getProductImage($productName) {
    $name = strtolower($productName);
    
    if (strpos($name, 'taco') !== false) return 'img/tacos.jpg';
    if (strpos($name, 'quesadilla') !== false) return 'img/quesadillas.jpg';
    if (strpos($name, 'gordita') !== false) return 'img/gorditas.jpg';
    if (strpos($name, 'agua') !== false) return 'img/aguas.jpg';
    if (strpos($name, 'coca') !== false || strpos($name, 'refresco') !== false) return 'img/refrescos.jpg';
    
    return 'img/logo.png'; // imagen por defecto que SÍ existe
}

$database = new Database();
$db = $database->getConnection();
$producto = new Producto($db);

$stmt = $producto->getMenu();
$num = $stmt->rowCount();

if ($num > 0) {
    $menu_arr = array();
    $menu_arr["productos"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $menu_item = array(
            "id_producto" => $row['id_producto'],
            "nombre" => $row['nombre'],
            "descripcion" => $row['descripcion'],
            "precio" => $row['precio'],
            "categoria" => $row['categoria_nombre'],
            "tipo" => $row['categoria_tipo'],
            "imagen" => getProductImage($row['nombre'])
        );
        array_push($menu_arr["productos"], $menu_item);
    }

    http_response_code(200);
    echo json_encode($menu_arr);
} else {
    http_response_code(404);
    echo json_encode(array("message" => "No se encontraron productos."));
}
?>