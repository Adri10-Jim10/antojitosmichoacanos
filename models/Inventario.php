<?php
class Inventario {
    private $conn;
    private $table_name = "almacen";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Obtener inventario con datos de producto
    public function obtenerInventario() {
        $query = "SELECT a.*, p.nombre AS producto_nombre, p.precio
                  FROM " . $this->table_name . " a
                  JOIN productos p ON a.id_producto = p.id_producto
                  ORDER BY a.stock ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Actualizar stock
    public function actualizarStock($id_almacen, $stock) {
        $query = "UPDATE " . $this->table_name . "
                  SET stock = :stock, fecha_actualizacion = NOW()
                  WHERE id_almacen = :id_almacen";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":stock", $stock);
        $stmt->bindParam(":id_almacen", $id_almacen);

        return $stmt->execute();
    }

    // Reducir stock por ID de producto
    public function reducirStockPorProducto($id_producto, $cantidad) {
        $query = "UPDATE " . $this->table_name . "
                  SET stock = stock - :cantidad, fecha_actualizacion = NOW()
                  WHERE id_producto = :id_producto";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":cantidad", $cantidad);
        $stmt->bindParam(":id_producto", $id_producto);

        return $stmt->execute();
    }
}
?>
