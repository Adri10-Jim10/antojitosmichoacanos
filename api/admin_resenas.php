<?php
error_reporting(0);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Resena.php';

$database = new Database();
$db = $database->getConnection();
$resena = new Resena($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id_reseña = filter_var($_GET['id'], FILTER_VALIDATE_INT);
            if ($id_reseña === false) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "ID de reseña inválido"]);
                exit;
            }
            $review = $resena->getReviewById($id_reseña);
            if ($review) {
                echo json_encode(["success" => true, "data" => $review]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Reseña no encontrada"]);
            }
        } else {
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
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if (isset($data->_method) && $data->_method === 'DELETE') {
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
        }
        break;
}
?>