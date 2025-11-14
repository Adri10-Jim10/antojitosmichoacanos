<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (isset($_GET['id_pedido'])) {
            $id_pedido = intval($_GET['id_pedido']);

            // Obtener datos generales del pedido
            $sqlPedido = "SELECT p.id_pedido, p.id_usuario, p.fecha_pedido, p.tipo_pedido, p.estado, p.total_pedido,
                                 u.usuario AS cliente_nombre
                          FROM pedidos p
                          LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
                          WHERE p.id_pedido = :id_pedido
                          LIMIT 1";
            $stmt = $db->prepare($sqlPedido);
            $stmt->bindParam(':id_pedido', $id_pedido, PDO::PARAM_INT);
            $stmt->execute();
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pedido) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Pedido no encontrado']);
                exit;
            }

            // 1) detalle_pedidos_normales
            $sql_dn = "SELECT dp.id_detalle_pedido AS id_detalle,
                              pr.nombre AS nombre_producto,
                              sp.nombre AS nombre_subproducto,
                              dp.cantidad,
                              dp.precio_unitario,
                              dp.total_linea AS subtotal
                       FROM detalle_pedidos_normales dp
                       LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
                       LEFT JOIN sub_productos sp ON dp.id_subproducto = sp.id_subproducto
                       WHERE dp.id_pedido = :id_pedido";

            // 2) detalle_pedidos_ofertas
            $sql_do = "SELECT dpo.id_detalle_pedido_oferta AS id_detalle,
                              COALESCE(pr.nombre, c.nombre) AS nombre_producto,
                              sp.nombre AS nombre_subproducto,
                              dpo.cantidad,
                              dpo.precio_unitario,
                              dpo.total_linea AS subtotal
                       FROM detalle_pedidos_ofertas dpo
                       LEFT JOIN productos_ofertas po ON dpo.id_producto_oferta = po.id_producto_oferta
                       LEFT JOIN productos pr ON po.id_producto = pr.id_producto
                       LEFT JOIN combos c ON dpo.id_combo = c.id_combo
                       LEFT JOIN sub_productos sp ON dpo.id_subproducto = sp.id_subproducto
                       WHERE dpo.id_pedido = :id_pedido";

            // Ejecutar y combinar
            $detalles = [];

            $stmt_dn = $db->prepare($sql_dn);
            $stmt_dn->bindParam(':id_pedido', $id_pedido, PDO::PARAM_INT);
            $stmt_dn->execute();
            $rows_dn = $stmt_dn->fetchAll(PDO::FETCH_ASSOC);
            if ($rows_dn) $detalles = array_merge($detalles, $rows_dn);

            $stmt_do = $db->prepare($sql_do);
            $stmt_do->bindParam(':id_pedido', $id_pedido, PDO::PARAM_INT);
            $stmt_do->execute();
            $rows_do = $stmt_do->fetchAll(PDO::FETCH_ASSOC);
            if ($rows_do) $detalles = array_merge($detalles, $rows_do);

            // Normalizar nombre_subproducto a null/trim y tipos numéricos
            foreach ($detalles as &$d) {
                $d['nombre_subproducto'] = isset($d['nombre_subproducto']) && $d['nombre_subproducto'] !== '' ? $d['nombre_subproducto'] : null;
                $d['cantidad'] = (int) ($d['cantidad'] ?? 0);
                $d['precio_unitario'] = isset($d['precio_unitario']) ? (float)$d['precio_unitario'] : 0.0;
                $d['subtotal'] = isset($d['subtotal']) ? (float)$d['subtotal'] : ($d['cantidad'] * $d['precio_unitario']);
            }
            unset($d);

            // Preparar respuesta
            $responseData = [
                'id_pedido' => (int)$pedido['id_pedido'],
                'cliente_nombre' => $pedido['cliente_nombre'] ?? '',
                'fecha_pedido' => $pedido['fecha_pedido'],
                'tipo_pedido' => $pedido['tipo_pedido'],
                'estado' => $pedido['estado'],
                'total_pedido' => (float)$pedido['total_pedido'],
                'detalles' => $detalles
            ];

            echo json_encode(['success' => true, 'data' => $responseData]);
            exit;
        } else {
            // Si no se pide id_pedido, devolver lista de pedidos (para tabla)
            $sql = "SELECT p.*, u.usuario as cliente
                    FROM pedidos p
                    LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
                    ORDER BY p.fecha_pedido DESC";
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $pedidos]);
            exit;
        }
    } else if ($method === 'POST') {
        // Manejo updates vía POST _method = PUT (actualizar estado)
        $input = json_decode(file_get_contents('php://input'));
        if (isset($input->_method) && $input->_method === 'PUT') {
            if (!empty($input->id_pedido) && isset($input->estado)) {
                $sqlUp = "UPDATE pedidos SET estado = :estado WHERE id_pedido = :id_pedido";
                $stmt = $db->prepare($sqlUp);
                $stmt->bindParam(':estado', $input->estado);
                $stmt->bindParam(':id_pedido', $input->id_pedido, PDO::PARAM_INT);
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Estado actualizado']);
                } else {
                    http_response_code(500);
                    echo json_encode(['success' => false, 'message' => 'No se pudo actualizar estado']);
                }
                exit;
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                exit;
            }
        }
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>