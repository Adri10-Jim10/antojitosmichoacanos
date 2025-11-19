<?php
header('Content-Type: application/json');

// Incluir el archivo de conexión a la base de datos (ruta corregida)
include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$response = ['success' => false, 'message' => 'ID de combo no proporcionado.'];

if (isset($_GET['id_combo'])) {
    $id_combo = intval($_GET['id_combo']);

    try {
        // Consulta para obtener los productos asociados al combo desde la tabla 'combo_productos'
        // Se usa $db en lugar de $pdo para ser consistente con el resto del proyecto.
        $stmt = $db->prepare("
            SELECT 
                p.id_producto,
                p.nombre,
                p.precio,
                cp.cantidad
            FROM combo_productos cp
            JOIN productos p ON cp.id_producto = p.id_producto
            WHERE cp.id_combo = :id_combo
        ");
        $stmt->execute(['id_combo' => $id_combo]);
        $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if ($productos) {
            $response['success'] = true;
            $response['productos'] = $productos;
            unset($response['message']);
        } else {
            $response['message'] = 'No se encontraron productos para este combo.';
        }
    } catch (PDOException $e) {
        $response['message'] = 'Error de base de datos: ' . $e->getMessage();
    }
}

echo json_encode($response);
?>