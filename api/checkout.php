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

$database = new Database();
$db = $database->getConnection();
$carrito = new Carrito($db);
$pagos = new Pagos($db);

$data = json_decode(file_get_contents("php://input"));
error_log("Checkout API: " . print_r($data, true));

if (
    !empty($data->id_usuario) &&
    !empty($data->tipo_pedido) &&
    !empty($data->tipo_venta) &&
    isset($data->total_pedido) &&
    !empty($data->metodo_pago)
) {
    // Obtener el carrito activo del usuario
    // obtenerCarrito() devuelve los items (el método cargarItems interno los monta)
    $cartItems = $carrito->obtenerCarrito($data->id_usuario);
    $id_carrito_activo = $carrito->id_carrito ?? null;

    if ($id_carrito_activo) {
        // Normalizar estructura de items para insertar en pedidos_finales
        $normalizedItems = [];
        foreach ($cartItems as $it) {
            // saltar combos (si no quieres insertarlos en pedidos_finales como productos)
            if (isset($it['tipo']) && $it['tipo'] === 'combo') continue;

            $id_producto = $it['producto_id'] ?? $it['id_producto'] ?? null;
            $cantidad = $it['cantidad'] ?? ($it['cantidad'] ?? 0);
            $precio_unitario = $it['precio'] ?? $it['precio_unitario'] ?? 0;

            if ($id_producto !== null) {
                $normalizedItems[] = [
                    'id_producto' => $id_producto,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precio_unitario
                ];
            }
        }
        $cartItems = $normalizedItems;
    }

    if (!$cartItems || count($cartItems) === 0) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Carrito vacío."]);
        exit;
    }

    // Crear pedido + líneas SIN iniciar/gestionar transacción aquí
    try {
        // Crear el pedido principal usando tu método checkout (devuelve id_pedido)
        $id_pedido = $carrito->checkout($data->id_usuario, $data->tipo_pedido, $data->tipo_venta, $data->total_pedido);

        if (!$id_pedido) {
            throw new Exception("checkout() devolvió false/null");
        }

        // Insertar cada línea en pedidos_finales usando los items leídos
        $insertLinea = $db->prepare("
            INSERT INTO pedidos_finales (id_pedido, id_usuario, id_producto, cantidad, precio_unitario)
            VALUES (?, ?, ?, ?, ?)
        ");
        foreach ($cartItems as $item) {
            $insertLinea->execute([
                $id_pedido,
                $data->id_usuario,
                $item['id_producto'],
                $item['cantidad'],
                $item['precio_unitario']
            ]);
        }

        // Crear registro de pago
        $pago_data = [
            'id_pedido' => $id_pedido,
            'id_usuario' => $data->id_usuario,
            'metodo_pago' => $data->metodo_pago,
            'nombre_banco' => $data->nombre_banco ?? null,
            'monto_total' => $data->total_pedido,
            'estado' => 'completado' // o el estado que corresponda
        ];

        $id_pago = $pagos->crearPago($pago_data);

        if ($id_pago) {
            http_response_code(201);
            echo json_encode(["success" => true, "message" => "Pedido y pago creados exitosamente", "id_pedido" => $id_pedido, "id_pago" => $id_pago]);
        } else {
            // Aunque el pago falló, el pedido se creó. Se podría manejar esta inconsistencia.
            http_response_code(207);
            echo json_encode(["success" => true, "message" => "Pedido creado, pero error al registrar el pago.", "id_pedido" => $id_pedido]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error al procesar el pedido: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos para procesar el pedido."]);
}
?>