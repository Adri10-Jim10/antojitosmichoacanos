<?php
class Pedido {
    private $conn;
    private $table_name = "pedidos";

    public $id_pedido;
    public $id_carrito;
    public $id_usuario;
    public $fecha_pedido;
    public $tipo_pedido;
    public $estado;
    public $total_pedido;
    public $tipo_venta;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener todos los pedidos para el dashboard
    public function getAllPedidos() {
        $query = "SELECT p.*, u.usuario as cliente_nombre 
                  FROM " . $this->table_name . " p
                  JOIN usuarios u ON p.id_usuario = u.id_usuario
                  ORDER BY p.fecha_pedido DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener estadísticas de pedidos
    public function getPedidosStats() {
        $query = "SELECT 
                    COUNT(*) as total_pedidos,
                    SUM(CASE WHEN MONTH(fecha_pedido) = MONTH(CURRENT_DATE()) THEN 1 ELSE 0 END) as pedidos_mes,
                    SUM(CASE WHEN estado = 'entregado' THEN total_pedido ELSE 0 END) as ingresos_totales,
                    SUM(CASE WHEN estado = 'entregado' AND MONTH(fecha_pedido) = MONTH(CURRENT_DATE()) THEN total_pedido ELSE 0 END) as ingresos_mes
                  FROM " . $this->table_name;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Actualizar estado del pedido
    public function updateEstado($id_pedido, $nuevo_estado) {
        $query = "UPDATE " . $this->table_name . " 
                  SET estado = :estado 
                  WHERE id_pedido = :id_pedido";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":estado", $nuevo_estado);
        $stmt->bindParam(":id_pedido", $id_pedido);
        
        return $stmt->execute();
    }

    // Obtener pedidos recientes
    public function getRecentOrders($limit = 10) {
        $query = "SELECT p.*, u.usuario as cliente 
                  FROM " . $this->table_name . " p
                  JOIN usuarios u ON p.id_usuario = u.id_usuario
                  ORDER BY p.fecha_pedido DESC 
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    // Obtener un pedido por su ID con detalles
    public function getPedidoById($id_pedido) {
        // Obtener información general del pedido
        $query_pedido = "SELECT p.*, u.usuario as cliente_nombre 
                         FROM " . $this->table_name . " p
                         JOIN usuarios u ON p.id_usuario = u.id_usuario
                         WHERE p.id_pedido = :id_pedido";
        
        $stmt_pedido = $this->conn->prepare($query_pedido);
        $stmt_pedido->bindParam(":id_pedido", $id_pedido);
        $stmt_pedido->execute();
        $pedido_data = $stmt_pedido->fetch(PDO::FETCH_ASSOC);

        if (!$pedido_data) {
            return null;
        }

        // Obtener detalles (items) del pedido
        $query_detalles = "SELECT dp.*, pr.nombre as nombre_producto 
                           FROM detalle_pedidos_normales dp
                           JOIN productos pr ON dp.id_producto = pr.id_producto
                           WHERE dp.id_pedido = :id_pedido";
        
        $stmt_detalles = $this->conn->prepare($query_detalles);
        $stmt_detalles->bindParam(":id_pedido", $id_pedido);
        $stmt_detalles->execute();
        $pedido_data['detalles'] = $stmt_detalles->fetchAll(PDO::FETCH_ASSOC);

        return $pedido_data;
    }
}
?>