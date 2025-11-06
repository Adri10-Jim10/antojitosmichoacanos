<?php
error_reporting(0);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Producto.php';

$database = new Database();
$db = $database->getConnection();
$producto = new Producto($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id_producto = filter_var($_GET['id'], FILTER_VALIDATE_INT);
            if ($id_producto === false) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "ID de producto inválido"]);
                exit;
            }
            $prod = $producto->getProductById($id_producto);
            if ($prod) {
                echo json_encode(["success" => true, "data" => $prod]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Producto no encontrado"]);
            }
        } else {
            $query = "SELECT p.*, c.nombre as categoria_nombre, a.stock
                      FROM productos p
                      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
                      LEFT JOIN almacen a ON p.id_producto = a.id_producto
                      ORDER BY p.nombre";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "data" => $productos
            ]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if (isset($data->_method) && $data->_method === 'PUT') {
            if (!empty($data->id_producto) && !empty($data->nombre) && !empty($data->precio) && !empty($data->id_categoria)) {
                if ($producto->updateProduct($data->id_producto, $data->nombre, $data->descripcion, $data->precio, $data->id_categoria, $data->activo)) {
                    echo json_encode(["success" => true, "message" => "Producto actualizado"]);
                } else {
                    echo json_encode(["success" => false, "message" => "Error al actualizar el producto"]);
                }
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}
?>