<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id_usuario) || empty($data->id_combo) || empty($data->cantidad) || !isset($data->precio)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

try {
    // Obtener carrito activo (el más reciente) o crear uno nuevo
    $stmt = $db->prepare("SELECT id_carrito FROM carritos WHERE id_usuario = ? ORDER BY id_carrito DESC LIMIT 1");
    $stmt->execute([$data->id_usuario]);
    $carrito = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($carrito) {
        $id_carrito = $carrito['id_carrito'];
    } else {
        $ins = $db->prepare("INSERT INTO carritos (id_usuario) VALUES (?)");
        $ins->execute([$data->id_usuario]);
        $id_carrito = $db->lastInsertId();
    }

    // Insertar en carrito_combos
    $insCombo = $db->prepare("INSERT INTO carrito_combos (id_carrito, id_combo, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
    $ok = $insCombo->execute([$id_carrito, $data->id_combo, $data->cantidad, $data->precio]);

    if ($ok) {
        echo json_encode(['success' => true, 'message' => 'Combo agregado al carrito']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al agregar combo']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno', 'error' => $e->getMessage()]);
}
?>