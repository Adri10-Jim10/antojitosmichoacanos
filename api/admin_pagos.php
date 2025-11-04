<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Pagos.php';

$database = new Database();
$db = $database->getConnection();
$pagos = new Pagos($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $result = $pagos->obtenerPagos();
            echo json_encode([
                "success" => true,
                "data" => $result
            ]);
        } catch (Exception $e) {
            echo json_encode([
                "success" => false,
                "message" => "Error al obtener pagos",
                "error" => $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        // Registrar un nuevo pago (opcional)
        $data = json_decode(file_get_contents("php://input"));

        if (!empty($data->id_pedido) && !empty($data->id_usuario) && !empty($data->metodo_pago) && !empty($data->monto_total)) {
            $nuevoPago = [
                "id_pedido" => $data->id_pedido,
                "id_usuario" => $data->id_usuario,
                "metodo_pago" => $data->metodo_pago,
                "nombre_banco" => $data->nombre_banco ?? null,
                "monto_total" => $data->monto_total,
                "estado" => $data->estado ?? "Pendiente"
            ];

            $id = $pagos->crearPago($nuevoPago);

            if ($id) {
                echo json_encode(["success" => true, "message" => "Pago creado correctamente", "id_pago" => $id]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al crear el pago"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Datos incompletos"]);
        }
        break;

    case 'DELETE':
        // Implementar si luego necesitas eliminar pagos
        echo json_encode(["success" => false, "message" => "Método DELETE no implementado aún"]);
        break;

    default:
        echo json_encode(["success" => false, "message" => "Método HTTP no soportado"]);
        break;
}
?>
