<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Comprueba si una columna existe en la base de datos actual
 */
function columnExists(PDO $db, string $table, string $column): bool {
    $sql = "SELECT COUNT(*) AS cnt
            FROM information_schema.columns
            WHERE table_schema = DATABASE()
              AND table_name = :table
              AND column_name = :column";
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':table', $table);
    $stmt->bindParam(':column', $column);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return (int)($row['cnt'] ?? 0) > 0;
}

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

            // Detectar columnas para evitar SQL que referencie columnas inexistentes
            $pf_has_id_combo = columnExists($db, 'pedidos_finales', 'id_combo');
            $dpo_has_id_combo = columnExists($db, 'detalle_pedidos_ofertas', 'id_combo');
            // id_subproducto puede usarse, pero no es necesario para el JOIN de combos; subproductos se unen por id_subproducto si existen
            $pf_has_id_subproducto = columnExists($db, 'pedidos_finales', 'id_subproducto');
            $dn_has_id_subproducto = columnExists($db, 'detalle_pedidos_normales', 'id_subproducto');
            $dpo_has_id_subproducto = columnExists($db, 'detalle_pedidos_ofertas', 'id_subproducto');

            // 1) pedidos_finales
            if ($pf_has_id_combo) {
                $sql_pf = "SELECT pf.id_pedido_final AS id_detalle,
                                  COALESCE(pr.nombre, c.nombre) AS nombre_producto,
                                  " . ($pf_has_id_subproducto ? "sp.nombre" : "NULL") . " AS nombre_subproducto,
                                  pf.cantidad,
                                  pf.precio_unitario,
                                  (pf.cantidad * pf.precio_unitario) AS subtotal
                           FROM pedidos_finales pf
                           LEFT JOIN productos pr ON pf.id_producto = pr.id_producto
                           LEFT JOIN combos c ON pf.id_combo = c.id_combo
                           " . ($pf_has_id_subproducto ? "LEFT JOIN sub_productos sp ON pf.id_subproducto = sp.id_subproducto" : "") . "
                           WHERE pf.id_pedido = :id_pedido";
            } else {
                $sql_pf = "SELECT pf.id_pedido_final AS id_detalle,
                                  pr.nombre AS nombre_producto,
                                  " . ($pf_has_id_subproducto ? "sp.nombre" : "NULL") . " AS nombre_subproducto,
                                  pf.cantidad,
                                  pf.precio_unitario,
                                  (pf.cantidad * pf.precio_unitario) AS subtotal
                           FROM pedidos_finales pf
                           LEFT JOIN productos pr ON pf.id_producto = pr.id_producto
                           " . ($pf_has_id_subproducto ? "LEFT JOIN sub_productos sp ON pf.id_subproducto = sp.id_subproducto" : "") . "
                           WHERE pf.id_pedido = :id_pedido";
            }

            // 2) detalle_pedidos_normales
            $sql_dn = "SELECT dp.id_detalle_pedido AS id_detalle,
                              pr.nombre AS nombre_producto,
                              " . ($dn_has_id_subproducto ? "sp.nombre" : "NULL") . " AS nombre_subproducto,
                              dp.cantidad,
                              dp.precio_unitario,
                              dp.total_linea AS subtotal
                       FROM detalle_pedidos_normales dp
                       LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
                       " . ($dn_has_id_subproducto ? "LEFT JOIN sub_productos sp ON dp.id_subproducto = sp.id_subproducto" : "") . "
                       WHERE dp.id_pedido = :id_pedido";

            // 3) detalle_pedidos_ofertas
            if ($dpo_has_id_combo) {
                $sql_do = "SELECT dpo.id_detalle_pedido_oferta AS id_detalle,
                                  COALESCE(pr.nombre, c.nombre) AS nombre_producto,
                                  " . ($dpo_has_id_subproducto ? "sp.nombre" : "NULL") . " AS nombre_subproducto,
                                  dpo.cantidad,
                                  dpo.precio_unitario,
                                  dpo.total_linea AS subtotal
                           FROM detalle_pedidos_ofertas dpo
                           LEFT JOIN productos_ofertas po ON dpo.id_producto_oferta = po.id_producto_oferta
                           LEFT JOIN productos pr ON po.id_producto = pr.id_producto
                           LEFT JOIN combos c ON dpo.id_combo = c.id_combo
                           " . ($dpo_has_id_subproducto ? "LEFT JOIN sub_productos sp ON dpo.id_subproducto = sp.id_subproducto" : "") . "
                           WHERE dpo.id_pedido = :id_pedido";
            } else {
                $sql_do = "SELECT dpo.id_detalle_pedido_oferta AS id_detalle,
                                  pr.nombre AS nombre_producto,
                                  " . ($dpo_has_id_subproducto ? "sp.nombre" : "NULL") . " AS nombre_subproducto,
                                  dpo.cantidad,
                                  dpo.precio_unitario,
                                  dpo.total_linea AS subtotal
                           FROM detalle_pedidos_ofertas dpo
                           LEFT JOIN productos_ofertas po ON dpo.id_producto_oferta = po.id_producto_oferta
                           LEFT JOIN productos pr ON po.id_producto = pr.id_producto
                           " . ($dpo_has_id_subproducto ? "LEFT JOIN sub_productos sp ON dpo.id_subproducto = sp.id_subproducto" : "") . "
                           WHERE dpo.id_pedido = :id_pedido";
            }

            // Ejecutar y combinar
            $detalles = [];

            $stmt = $db->prepare($sql_pf);
            $stmt->bindParam(':id_pedido', $id_pedido, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($rows) $detalles = array_merge($detalles, $rows);

            $stmt = $db->prepare($sql_dn);
            $stmt->bindParam(':id_pedido', $id_pedido, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($rows) $detalles = array_merge($detalles, $rows);

            $stmt = $db->prepare($sql_do);
            $stmt->bindParam(':id_pedido', $id_pedido, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($rows) $detalles = array_merge($detalles, $rows);

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