<?php
class Pagos {
    private $conn;
    private $table_name = "pagos";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function obtenerPagos() {
        $query = "
            SELECT 
                p.id_pago,
                p.id_pedido,
                p.id_usuario,
                u.usuario AS nombre_usuario,
                p.metodo_pago,
                p.nombre_banco,
                p.monto_total,
                p.fecha_pago,
                p.estado
            FROM pagos p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            ORDER BY p.fecha_pago DESC
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crearPago($data) {
        $query = "
            INSERT INTO pagos (id_pedido, id_usuario, metodo_pago, nombre_banco, monto_total, estado)
            VALUES (:id_pedido, :id_usuario, :metodo_pago, :nombre_banco, :monto_total, :estado)
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_pedido", $data['id_pedido']);
        $stmt->bindParam(":id_usuario", $data['id_usuario']);
        $stmt->bindParam(":metodo_pago", $data['metodo_pago']);
        $stmt->bindParam(":nombre_banco", $data['nombre_banco']);
        $stmt->bindParam(":monto_total", $data['monto_total']);
        $stmt->bindParam(":estado", $data['estado']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Nuevo: actualizar el estado de un pago
    public function actualizarEstado($id_pago, $estado) {
        $query = "UPDATE " . $this->table_name . " SET estado = :estado WHERE id_pago = :id_pago";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':estado', $estado);
        $stmt->bindParam(':id_pago', $id_pago);
        return $stmt->execute();
    }
}
?>
