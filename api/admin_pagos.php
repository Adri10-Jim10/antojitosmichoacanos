<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT p.*, u.usuario as cliente, ped.id_pedido
              FROM pagos p
              JOIN usuarios u ON p.id_usuario = u.id_usuario
              JOIN pedidos ped ON p.id_pedido = ped.id_pedido
              ORDER BY p.fecha_pago DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $pagos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $pagos
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>