<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Pedido.php';

$database = new Database();
$db = $database->getConnection();

$pedido = new Pedido($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pedido->getAllPedidos();
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                "success" => true,
                "data" => $pedidos
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));

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
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}
?>