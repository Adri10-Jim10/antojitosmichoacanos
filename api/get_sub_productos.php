<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$id_producto = isset($_GET['id_producto']) ? intval($_GET['id_producto']) : 0;

if ($id_producto <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'id_producto requerido']);
    exit;
}

try {
    $query = "SELECT id_subproducto, id_producto, nombre, precio, activo
              FROM sub_productos
              WHERE id_producto = :id_producto AND activo = 1
              ORDER BY nombre ASC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id_producto', $id_producto, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'subproductos' => $rows]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error en la consulta', 'error' => $e->getMessage()]);
}
?>