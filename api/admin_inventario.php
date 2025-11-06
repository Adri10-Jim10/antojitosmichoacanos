<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Inventario.php';

$database = new Database();
$db = $database->getConnection();
$inventario = new Inventario($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $inventario->obtenerInventario();
        $inventario_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $inventario_data
        ]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->id_almacen) && isset($data->stock)) {
            if ($inventario->actualizarStock($data->id_almacen, $data->stock)) {
                echo json_encode(["success" => true, "message" => "Inventario actualizado"]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al actualizar"]);
            }
        }
        break;
}
?>