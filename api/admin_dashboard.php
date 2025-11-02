<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Usuario.php';
include_once '../models/Pedido.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Estadísticas generales
    $stats = [
        'totalPedidos' => 0,
        'pedidosEsteMes' => 0,
        'totalUsuarios' => 0,
        'totalClientes' => 0,
        'ingresosTotales' => 0,
        'ingresosEsteMes' => 0,
        'promedioResenas' => 0,
        'totalResenas' => 0
    ];

    // Total pedidos
    $query = "SELECT COUNT(*) as total FROM pedidos";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['totalPedidos'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Pedidos este mes
    $query = "SELECT COUNT(*) as total FROM pedidos WHERE MONTH(fecha_pedido) = MONTH(CURRENT_DATE()) AND YEAR(fecha_pedido) = YEAR(CURRENT_DATE())";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['pedidosEsteMes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Total usuarios
    $usuario = new Usuario($db);
    $userStats = $usuario->getUsersCount();
    $stats['totalUsuarios'] = $userStats['total'];
    $stats['totalClientes'] = $userStats['clientes'];

    // Ingresos
    $query = "SELECT SUM(total_pedido) as total FROM pedidos WHERE estado = 'entregado'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['ingresosTotales'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    $query = "SELECT SUM(total_pedido) as total FROM pedidos WHERE estado = 'entregado' AND MONTH(fecha_pedido) = MONTH(CURRENT_DATE()) AND YEAR(fecha_pedido) = YEAR(CURRENT_DATE())";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $stats['ingresosEsteMes'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

    // Reseñas
    $query = "SELECT AVG(calificacion) as promedio, COUNT(*) as total FROM reseñas";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $resenaData = $stmt->fetch(PDO::FETCH_ASSOC);
    $stats['promedioResenas'] = $resenaData['promedio'] ?? 0;
    $stats['totalResenas'] = $resenaData['total'] ?? 0;

    // Pedidos recientes
    $query = "SELECT p.*, u.usuario as cliente 
              FROM pedidos p 
              JOIN usuarios u ON p.id_usuario = u.id_usuario 
              ORDER BY p.fecha_pedido DESC 
              LIMIT 10";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $recentOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Datos para gráficos
    $chartData = [
        'pedidosEstados' => [
            'labels' => ['Pendiente', 'Preparando', 'Listo', 'Entregado', 'Cancelado'],
            'data' => [0, 0, 0, 0, 0]
        ],
        'ingresosMensuales' => [
            'labels' => ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            'data' => array_fill(0, 12, 0)
        ]
    ];

    // Pedidos por estado
    $query = "SELECT estado, COUNT(*) as total FROM pedidos GROUP BY estado";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $estadosData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $estadosMap = ['pendiente' => 0, 'preparando' => 1, 'listo' => 2, 'entregado' => 3, 'cancelado' => 4];
    foreach ($estadosData as $estado) {
        $index = $estadosMap[$estado['estado']] ?? 4;
        $chartData['pedidosEstados']['data'][$index] = (int)$estado['total'];
    }

    // Ingresos mensuales (últimos 6 meses)
    $query = "SELECT MONTH(fecha_pedido) as mes, SUM(total_pedido) as total 
              FROM pedidos 
              WHERE fecha_pedido >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH) 
              AND estado = 'entregado'
              GROUP BY MONTH(fecha_pedido), YEAR(fecha_pedido)
              ORDER BY YEAR(fecha_pedido), MONTH(fecha_pedido)";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $ingresosData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($ingresosData as $ingreso) {
        $mesIndex = (int)$ingreso['mes'] - 1;
        if ($mesIndex >= 0 && $mesIndex < 12) {
            $chartData['ingresosMensuales']['data'][$mesIndex] = (float)$ingreso['total'];
        }
    }

    echo json_encode([
        "success" => true,
        "stats" => $stats,
        "recentOrders" => $recentOrders,
        "chartData" => $chartData
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>