<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Carrito.php';

$database = new Database();
$db = $database->getConnection();
$carrito = new Carrito($db);

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

switch ($method) {
    case 'GET':
        if (!empty($_GET['id_usuario'])) {
            $items = $carrito->obtenerCarrito($_GET['id_usuario']);
            echo json_encode(["success" => true, "items" => $items]);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID de usuario requerido"]);
        }
        break;

    case 'POST':
        if (!empty($data->id_usuario) && !empty($data->id_producto) && !empty($data->cantidad) && !empty($data->precio)) {
            $carrito->obtenerCarrito($data->id_usuario);
            if ($carrito->agregarProducto($data->id_producto, $data->cantidad, $data->precio)) {
                echo json_encode(["success" => true, "message" => "Producto agregado al carrito"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Error al agregar producto"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Datos incompletos"]);
        }
        break;

    case 'DELETE':
        if (!empty($data->id_usuario) && !empty($data->id_item) && !empty($data->tipo)) {
            $carrito->obtenerCarrito($data->id_usuario);
            if ($carrito->eliminarItem($data->id_item, $data->tipo)) {
                echo json_encode(["success" => true, "message" => "Item eliminado del carrito"]);
            } else {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Error al eliminar item"]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Datos incompletos"]);
        }
        break;
}
?>