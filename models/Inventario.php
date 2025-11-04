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
}
?>
