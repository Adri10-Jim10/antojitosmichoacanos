<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$query = "
    SELECT p.nombre, a.stock
    FROM almacen a
    JOIN productos p ON a.id_producto = p.id_producto
    JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE (c.nombre = 'Refrescos' OR c.nombre = 'Aguas Frescas' OR c.nombre = 'Aguas Naturales') AND a.stock <= 5
";

try {
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $alertas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(["success" => true, "alertas" => $alertas]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al obtener las alertas de inventario: " . $e->getMessage()]);
}
?>