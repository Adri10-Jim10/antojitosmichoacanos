<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $query = "SELECT r.*, u.usuario as cliente, p.id_pedido
                  FROM reseñas r
                  JOIN usuarios u ON r.id_usuario = u.id_usuario
                  LEFT JOIN pedidos p ON r.id_pedido = p.id_pedido
                  ORDER BY r.fecha_reseña DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $resenas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $resenas
        ]);
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->id_resena)) {
            $query = "DELETE FROM reseñas WHERE id_reseña = :id_resena";
            $stmt = $db->prepare($query);
            $stmt->bindParam(":id_resena", $data->id_resena);
            
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Reseña eliminada"]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al eliminar"]);
            }
        }
        break;
}
?>