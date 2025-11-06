<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Producto.php';

$database = new Database();
$db = $database->getConnection();

$producto = new Producto($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $producto->getAll(); // Usamos el nuevo método para obtener todos los productos para el admin
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "data" => $productos]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al obtener productos: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        // Simulación de método DELETE
        if (isset($data->_method) && $data->_method === 'DELETE') {
            if (!empty($data->id_producto)) {
                try {
                    if ($producto->delete($data->id_producto)) {
                        echo json_encode(["success" => true, "message" => "Producto eliminado correctamente"]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["success" => false, "message" => "Error al eliminar el producto"]);
                    }
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "ID de producto no proporcionado"]);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}
?>