<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
// Permitimos GET, POST y PUT (aceptamos override _method para compatibilidad)
header("Access-Control-Allow-Methods: GET, POST, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Detectar método real o override via _method (JSON body o form)
$rawInput = file_get_contents('php://input');
$jsonInput = null;
if ($rawInput) {
    $decoded = json_decode($rawInput);
    if (json_last_error() === JSON_ERROR_NONE) {
        $jsonInput = $decoded;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
// Override si el cliente envía _method en JSON o en form-data
if ($jsonInput && isset($jsonInput->_method)) {
    $method = strtoupper($jsonInput->_method);
} elseif (isset($_POST['_method'])) {
    $method = strtoupper($_POST['_method']);
}

switch ($method) {
    case 'GET':
        $query = "SELECT a.*, p.nombre as producto_nombre, p.precio
                  FROM almacen a
                  JOIN productos p ON a.id_producto = p.id_producto
                  ORDER BY a.stock ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $inventario = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $inventario
        ]);
        break;

    case 'PUT':
    case 'POST': // soportamos POST con override _method=PUT
        // Preferir JSON decodificado si existe
        $data = $jsonInput;
        // Si no hay JSON, caer a $_POST
        if (!$data) {
            $data = (object) $_POST;
        }

        // Soportar también si el cliente envía los campos en la raíz del JSON
        $id_almacen = $data->id_almacen ?? ($data->id ?? null);
        $stock = null;
        if (isset($data->stock)) $stock = $data->stock;

        if (!empty($id_almacen) && $stock !== null) {
            $query = "UPDATE almacen SET stock = :stock, fecha_actualizacion = NOW() WHERE id_almacen = :id_almacen";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":stock", $stock);
            $stmt->bindParam(":id_almacen", $id_almacen);

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Inventario actualizado"]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al actualizar"]);
            }
        } else {
            echo json_encode(["success" => false, "message" => "Parámetros requeridos: id_almacen y stock"]);
        }
        break;
}
?>