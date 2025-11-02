<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PUT");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

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
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->id_almacen) && isset($data->stock)) {
            $query = "UPDATE almacen SET stock = :stock, fecha_actualizacion = NOW() WHERE id_almacen = :id_almacen";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":stock", $data->stock);
            $stmt->bindParam(":id_almacen", $data->id_almacen);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Inventario actualizado"]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al actualizar"]);
            }
        }
        break;
}
?>