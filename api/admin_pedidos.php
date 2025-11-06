<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Pedido.php';

$database = new Database();
$db = $database->getConnection();

$pedido = new Pedido($db);
$method = $_SERVER['REQUEST_METHOD'];

// Manejo de diferentes métodos HTTP
switch ($method) {
    case 'GET':
        // Si se pide un pedido específico por ID
        if (isset($_GET['id_pedido'])) {
            $pedido_id = filter_var($_GET['id_pedido'], FILTER_SANITIZE_NUMBER_INT);
            $pedido_details = $pedido->getPedidoById($pedido_id);
            
            if ($pedido_details) {
                echo json_encode(["success" => true, "data" => $pedido_details]);
            } else {
                echo json_encode(["success" => false, "message" => "Pedido no encontrado."]);
            }
        } else {
            // Si no, obtener todos los pedidos
            try {
                $stmt = $pedido->getAllPedidos();
                $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(["success" => true, "data" => $pedidos]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "message" => "Error al obtener pedidos: " . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        if (isset($data->_method) && $data->_method === 'PUT') {
            if (!empty($data->id_pedido) && !empty($data->estado)) {
                try {
                    if ($pedido->updateEstado($data->id_pedido, $data->estado)) {
                        echo json_encode(["success" => true, "message" => "Estado del pedido actualizado"]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["success" => false, "message" => "Error al actualizar el estado del pedido"]);
                    }
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Datos incompletos"]);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}
?>