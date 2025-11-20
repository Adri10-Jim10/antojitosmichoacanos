<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Carrito.php';
include_once '../models/Pagos.php';
include_once '../models/Inventario.php'; // Incluir el modelo de Inventario

$database = new Database();
$db = $database->getConnection();
$carrito = new Carrito($db);
$pagos = new Pagos($db);
$inventario = new Inventario($db); // Instanciar Inventario


$data = json_decode(file_get_contents("php://input"));

if (
    empty($data->id_usuario) ||
    empty($data->tipo_pedido) ||
    empty($data->tipo_venta) ||
    !isset($data->total_pedido) ||
    empty($data->metodo_pago)
) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos para procesar el pedido."]);
    exit;
}

// Iniciar transacción
$db->beginTransaction();

try {
    // 1. Obtener el carrito activo del usuario
    $cartItems = $carrito->obtenerCarrito($data->id_usuario);
    $id_carrito_activo = $carrito->id_carrito ?? null;

    if (!$id_carrito_activo || empty($cartItems)) {
        throw new Exception("El carrito está vacío o no se encontró.");
    }

    // 2. Crear el pedido principal
    $query_pedido = "INSERT INTO pedidos (id_carrito, id_usuario, fecha_pedido, tipo_pedido, estado, total_pedido, tipo_venta)
                     VALUES (:id_carrito, :id_usuario, NOW(), :tipo_pedido, 'pendiente', :total_pedido, :tipo_venta)";
    
    $stmt_pedido = $db->prepare($query_pedido);
    $stmt_pedido->bindParam(":id_carrito", $id_carrito_activo);
    $stmt_pedido->bindParam(":id_usuario", $data->id_usuario);
    $stmt_pedido->bindParam(":tipo_pedido", $data->tipo_pedido);
    $stmt_pedido->bindParam(":total_pedido", $data->total_pedido);
    $stmt_pedido->bindParam(":tipo_venta", $data->tipo_venta);
    
    if (!$stmt_pedido->execute()) {
        throw new Exception("Error al crear el pedido.");
    }
    
    $id_pedido = $db->lastInsertId();

    // 3. Insertar detalles del pedido
    $stmt_detalle_normal = $db->prepare(
        "INSERT INTO detalle_pedidos_normales (id_pedido, id_producto, id_subproducto, cantidad, precio_unitario, total_linea)
         VALUES (:id_pedido, :id_producto, :id_subproducto, :cantidad, :precio_unitario, :total_linea)"
    );

    $stmt_detalle_oferta = $db->prepare(
        "INSERT INTO detalle_pedidos_ofertas (id_pedido, id_combo, id_producto_oferta, cantidad, precio_unitario, total_linea, tipo_oferta)
         VALUES (:id_pedido, :id_combo, :id_producto_oferta, :cantidad, :precio_unitario, :total_linea, :tipo_oferta)"
    );

    foreach ($cartItems as $item) {
        if ($item['tipo'] === 'producto') {
            $stmt_detalle_normal->execute([
                ':id_pedido' => $id_pedido,
                ':id_producto' => $item['producto_id'],
                ':id_subproducto' => $item['id_subproducto'] ?? null,
                ':cantidad' => $item['cantidad'],
                ':precio_unitario' => $item['precio'],
                ':total_linea' => $item['total']
            ]);
        } elseif ($item['tipo'] === 'combo') {
            $stmt_detalle_oferta->execute([
                ':id_pedido' => $id_pedido,
                ':id_combo' => $item['combo_id'],
                ':id_producto_oferta' => null, // Es un combo, no un producto de oferta individual
                ':cantidad' => $item['cantidad'],
                ':precio_unitario' => $item['precio'],
                ':total_linea' => $item['total'],
                ':tipo_oferta' => 'combo'
            ]);
        }
    }

    // 4. Reducir stock de bebidas (Refrescos y Aguas Frescas)
    $query_cat_bebidas = "SELECT id_categoria FROM categorias WHERE nombre IN ('Refrescos', 'Aguas Frescas')";
    $stmt_cat_bebidas = $db->prepare($query_cat_bebidas);
    $stmt_cat_bebidas->execute();
    $id_cats_bebidas = $stmt_cat_bebidas->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($id_cats_bebidas)) {
        foreach ($cartItems as $item) {
            if ($item['tipo'] === 'producto') {
                // Verificar si el producto es una bebida a descontar
                $query_prod_cat = "SELECT id_categoria FROM productos WHERE id_producto = :id_producto";
                $stmt_prod_cat = $db->prepare($query_prod_cat);
                $stmt_prod_cat->execute([':id_producto' => $item['producto_id']]);
                $id_categoria_producto = $stmt_prod_cat->fetchColumn();

                if (in_array($id_categoria_producto, $id_cats_bebidas)) {
                    $inventario->reducirStockPorProducto($item['producto_id'], $item['cantidad']);
                }
            }
        }
    }


    // 5. Crear registro de pago
    $pago_data = [
        'id_pedido' => $id_pedido,
        'id_usuario' => $data->id_usuario,
        'metodo_pago' => $data->metodo_pago,
        'nombre_banco' => $data->nombre_banco ?? null,
        'monto_total' => $data->total_pedido,
        'estado' => 'completado' // o 'pendiente' si se requiere confirmación
    ];

    $id_pago = $pagos->crearPago($pago_data);
    if (!$id_pago) {
        throw new Exception("Error al registrar el pago.");
    }

    // 6. Desactivar el carrito
    $query_desactivar = "UPDATE carritos SET activo = 0 WHERE id_carrito = :id_carrito";
    $stmt_desactivar = $db->prepare($query_desactivar);
    $stmt_desactivar->bindParam(":id_carrito", $id_carrito_activo);
    if (!$stmt_desactivar->execute()) {
        throw new Exception("Error al desactivar el carrito.");
    }

    // 7. Confirmar transacción
    $db->commit();

    http_response_code(201);
    echo json_encode(["success" => true, "message" => "Pedido y pago creados exitosamente", "id_pedido" => $id_pedido, "id_pago" => $id_pago]);

} catch (Exception $e) {
    // Revertir en caso de error
    $db->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error al procesar el pedido: " . $e->getMessage()]);
}
?>