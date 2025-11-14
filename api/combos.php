<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

function getComboImage($name) {
    $name = strtolower($name);
    if (strpos($name, 'familiar') !== false) return 'img/tacos.jpg';
    if (strpos($name, 'individual') !== false) return 'img/refrescos.jpg';
    if (strpos($name, 'gordita') !== false) return 'img/gorditas.jpg';
    if (strpos($name, 'quesadilla') !== false) return 'img/quesadillas.jpg';
    return 'img/logo.png';
}

$database = new Database();
$db = $database->getConnection();

try {
    // Obtener combos desde la tabla que mostraste
    $query = "SELECT id_combo, id_oferta, nombre, descripcion, precio_combo 
              FROM combos 
              WHERE activo = 1 
              ORDER BY id_combo DESC";

    $stmt = $db->prepare($query);
    $stmt->execute();

    $combos = [];

    while ($combo = $stmt->fetch(PDO::FETCH_ASSOC)) {

        // Imagen del combo basada en su nombre
        $imagen = getComboImage($combo['nombre']);

        $combos[] = [
            'id_combo' => (int)$combo['id_combo'],
            'id_oferta' => (int)$combo['id_oferta'],
            'nombre' => $combo['nombre'],
            'descripcion' => $combo['descripcion'],
            'precio_combo' => (float)$combo['precio_combo'],
            'imagen' => $imagen
        ];
    }

    echo json_encode(['success' => true, 'combos' => $combos]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener combos', 'error' => $e->getMessage()]);
}
?>
