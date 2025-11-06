<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id_usuario) || empty($data->comentario) || !isset($data->calificacion)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos. Se requiere id_usuario, comentario y calificacion."]);
    exit;
}

$id_usuario = $data->id_usuario;
$comentario = trim($data->comentario);
$calificacion = (int) $data->calificacion;
$id_pedido = !empty($data->id_pedido) ? $data->id_pedido : null;

try {
    $query = "INSERT INTO `reseñas` (id_usuario, id_pedido, comentario, calificacion, fecha_reseña)
              VALUES (:id_usuario, :id_pedido, :comentario, :calificacion, NOW())";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id_usuario', $id_usuario);
    $stmt->bindParam(':id_pedido', $id_pedido);
    $stmt->bindParam(':comentario', $comentario);
    $stmt->bindParam(':calificacion', $calificacion);

    if ($stmt->execute()) {
        $insertId = $db->lastInsertId();
        http_response_code(201);
        echo json_encode(["success" => true, "message" => "Reseña guardada", "id_reseña" => $insertId]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al insertar reseña"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Excepción: " . $e->getMessage()]);
}
?>