<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

function getProductImage($productName) {
    $name = strtolower($productName);
    // Combos
    if (strpos($name, 'combo familiar') !== false) return 'img/familiar_combo.jpeg';
    if (strpos($name, 'combo individual') !== false) return 'img/2tacos_mas_1_refresco.jpeg';
    if (strpos($name, 'combo gorditas') !== false) return 'img/combo_gorditas.jpeg';
    if (strpos($name, 'combo quesadillas') !== false) return 'img/combo_quesadillas.jpeg';
    if (strpos($name, 'combo completo') !== false) return 'img/combo_completo.jpeg';
    // Productos
    if (strpos($name, 'taco') !== false) return 'img/tacos.jpg';
    if (strpos($name, 'quesadilla') !== false) return 'img/quesadillas.jpg';
    if (strpos($name, 'gordita') !== false) return 'img/gorditas.jpg';
    if (strpos($name, 'agua') !== false) return 'img/aguas.jpg';
    if (strpos($name, 'coca') !== false || strpos($name, 'refresco') !== false) return 'img/refrescos.jpg';
    return 'img/logo.png';
}

$database = new Database();
$db = $database->getConnection();

try {
    // Mapear día actual (1-7) a su equivalente en español
    $diaEsp = '';
    switch ((int)date('N')) {
        case 1: $diaEsp = 'lunes'; break;
        case 2: $diaEsp = 'martes'; break;
        case 3: $diaEsp = 'miercoles'; break;
        case 4: $diaEsp = 'jueves'; break;
        case 5: $diaEsp = 'viernes'; break;
        case 6: $diaEsp = 'sabado'; break;
        case 7: $diaEsp = 'domingo'; break;
    }

    // 🔥 Consulta: solo ofertas activas, vigentes y que aplican hoy
    $query = "SELECT * FROM ofertas
              WHERE activa = 1
                AND CURDATE() BETWEEN fecha_inicio AND fecha_fin
                AND (dias_aplicacion = 'todos' OR dias_aplicacion LIKE ?)
              ORDER BY id_oferta DESC";
    $stmt = $db->prepare($query);
    $stmt->execute(['%' . $diaEsp . '%']);

    $ofertas = [];

    while ($of = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $id_oferta = $of['id_oferta'];

        // Obtener productos con oferta
        $stmtProd = $db->prepare("
            SELECT po.id_producto, po.precio_oferta, p.nombre, p.descripcion, p.precio AS precio_original
            FROM productos_ofertas po
            JOIN productos p ON po.id_producto = p.id_producto
            WHERE po.id_oferta = ?
        ");
        $stmtProd->execute([$id_oferta]);
        $productos = [];
        while ($p = $stmtProd->fetch(PDO::FETCH_ASSOC)) {
            $productos[] = [
                'id_producto' => (int)$p['id_producto'],
                'nombre' => $p['nombre'],
                'descripcion' => $p['descripcion'],
                'precio_oferta' => (float)$p['precio_oferta'],
                'precio_original' => (float)$p['precio_original'],
                'imagen' => getProductImage($p['nombre'])
            ];
        }

        // Obtener combos de la oferta
        $stmtCombo = $db->prepare("SELECT id_combo, nombre, descripcion, precio_combo FROM combos WHERE id_oferta = ?");
        $stmtCombo->execute([$id_oferta]);
        $combos = [];
        while ($c = $stmtCombo->fetch(PDO::FETCH_ASSOC)) {
            $id_combo = $c['id_combo'];
            $stmtComboProd = $db->prepare("
                SELECT pc.id_producto, pc.cantidad, p.nombre, p.precio
                FROM productos_combos pc
                JOIN productos p ON pc.id_producto = p.id_producto
                WHERE pc.id_combo = ?
            ");
            $stmtComboProd->execute([$id_combo]);
            $comboProductos = [];
            while ($cp = $stmtComboProd->fetch(PDO::FETCH_ASSOC)) {
                $comboProductos[] = [
                    'id_producto' => (int)$cp['id_producto'],
                    'cantidad' => (int)$cp['cantidad'],
                    'nombre' => $cp['nombre'],
                    'precio_unitario' => (float)$cp['precio']
                ];
            }

            $combos[] = [
                'id_combo' => (int)$c['id_combo'],
                'nombre' => $c['nombre'],
                'descripcion' => $c['descripcion'],
                'precio_combo' => (float)$c['precio_combo'],
                'productos' => $comboProductos,
                'imagen' => getProductImage($c['nombre']) // <-- Se agrega la imagen al combo
            ];
        }

        $ofertas[] = [
            'id_oferta' => (int)$of['id_oferta'],
            'nombre' => $of['nombre'],
            'descripcion' => $of['descripcion'],
            'tipo' => $of['tipo'],
            'descuento_porcentaje' => (float)$of['descuento_porcentaje'],
            'fecha_inicio' => $of['fecha_inicio'],
            'fecha_fin' => $of['fecha_fin'],
            'productos' => $productos,
            'combos' => $combos
        ];
    }

    echo json_encode(['success' => true, 'ofertas' => $ofertas]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener ofertas', 'error' => $e->getMessage()]);
}
?>
