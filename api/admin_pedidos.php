<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

// Verificar autenticación de administrador
session_start();
if (!isset($_SESSION['user']) || $_SESSION['user']['rol'] !== 'administrador') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Acceso no autorizado"]);
    exit;
}

$database = new Database();
$db = $database->getConnection();

try {
    $query = "SELECT p.*, u.usuario as cliente 
              FROM pedidos p 
              JOIN usuarios u ON p.id_usuario = u.id_usuario 
              ORDER BY p.fecha_pedido DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $pedidos
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>