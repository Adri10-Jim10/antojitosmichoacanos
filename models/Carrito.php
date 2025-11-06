<?php
class Carrito {
    private $conn;
    private $table_carrito = "carritos";
    private $table_items = "carrito_items";
    private $table_combos = "carrito_combos";

    public $id_carrito;
    public $id_usuario;
    public $items = [];

    public function __construct($db) {
        $this->conn = $db;
    }

    public function obtenerCarrito($id_usuario) {
        // Obtener o crear carrito activo
        $query = "SELECT id_carrito FROM " . $this->table_carrito . " 
                 WHERE id_usuario = :id_usuario AND activo = 1 
                 ORDER BY fecha_creacion DESC LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id_carrito = $row['id_carrito'];
        } else {
            $this->crearCarrito($id_usuario);
        }

        return $this->cargarItems();
    }

    private function crearCarrito($id_usuario) {
        $query = "INSERT INTO " . $this->table_carrito . " 
                 (id_usuario, fecha_creacion, activo) 
                 VALUES (:id_usuario, NOW(), 1)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_usuario", $id_usuario);
        
        if ($stmt->execute()) {
            $this->id_carrito = $this->conn->lastInsertId();
        }
    }

    private function cargarItems() {
        $items = [];

        // Cargar productos individuales
        $query_items = "SELECT ci.*, p.nombre, p.descripcion 
                       FROM " . $this->table_items . " ci
                       JOIN productos p ON ci.id_producto = p.id_producto
                       WHERE ci.id_carrito = :id_carrito";
        
        $stmt = $this->conn->prepare($query_items);
        $stmt->bindParam(":id_carrito", $this->id_carrito);
        $stmt->execute();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $items[] = [
                'tipo' => 'producto',
                'id' => $row['id_carrito_item'],
                'producto_id' => $row['id_producto'],
                'nombre' => $row['nombre'],
                'cantidad' => $row['cantidad'],
                'precio' => $row['precio_unitario'],
                'total' => $row['cantidad'] * $row['precio_unitario']
            ];
        }

        // Cargar combos
        $query_combos = "SELECT cc.*, c.nombre, c.descripcion 
                        FROM " . $this->table_combos . " cc
                        JOIN combos c ON cc.id_combo = c.id_combo
                        WHERE cc.id_carrito = :id_carrito";
        
        $stmt = $this->conn->prepare($query_combos);
        $stmt->bindParam(":id_carrito", $this->id_carrito);
        $stmt->execute();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $items[] = [
                'tipo' => 'combo',
                'id' => $row['id_carrito_combo'],
                'combo_id' => $row['id_combo'],
                'nombre' => $row['nombre'],
                'cantidad' => $row['cantidad'],
                'precio' => $row['precio_unitario'],
                'total' => $row['cantidad'] * $row['precio_unitario']
            ];
        }

        $this->items = $items;
        return $items;
    }

    public function agregarProducto($id_producto, $cantidad, $precio, $tipo_pedido) {
        $query = "INSERT INTO " . $this->table_items . " 
                 (id_carrito, id_producto, cantidad, precio_unitario, tipo_pedido) 
                 VALUES (:id_carrito, :id_producto, :cantidad, :precio, :tipo_pedido)
                 ON DUPLICATE KEY UPDATE cantidad = cantidad + :cantidad";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_carrito", $this->id_carrito);
        $stmt->bindParam(":id_producto", $id_producto);
        $stmt->bindParam(":cantidad", $cantidad);
        $stmt->bindParam(":precio", $precio);
        $stmt->bindParam(":tipo_pedido", $tipo_pedido);
        
        return $stmt->execute();
    }

    public function eliminarItem($id_item, $tipo) {
        $table = ($tipo === 'producto') ? $this->table_items : $this->table_combos;
        $id_field = ($tipo === 'producto') ? 'id_carrito_item' : 'id_carrito_combo';
        
        $query = "DELETE FROM " . $table . " WHERE " . $id_field . " = :id_item";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_item", $id_item);
        
        return $stmt->execute();
    }

    public function vaciarCarrito() {
        $query_items = "DELETE FROM " . $this->table_items . " WHERE id_carrito = :id_carrito";
        $query_combos = "DELETE FROM " . $this->table_combos . " WHERE id_carrito = :id_carrito";
        
        $stmt1 = $this->conn->prepare($query_items);
        $stmt2 = $this->conn->prepare($query_combos);
        
        $stmt1->bindParam(":id_carrito", $this->id_carrito);
        $stmt2->bindParam(":id_carrito", $this->id_carrito);
        
        return $stmt1->execute() && $stmt2->execute();
    }

    public function checkout($id_usuario, $tipo_pedido, $tipo_venta, $total_pedido) {
        // 1. Iniciar transacción
        $this->conn->beginTransaction();

        try {
            // 2. Crear el pedido
            $query_pedido = "INSERT INTO pedidos (id_carrito, id_usuario, fecha_pedido, tipo_pedido, estado, total_pedido, tipo_venta)
                             VALUES (:id_carrito, :id_usuario, NOW(), :tipo_pedido, 'pendiente', :total_pedido, :tipo_venta)";
            
            $stmt_pedido = $this->conn->prepare($query_pedido);
            $stmt_pedido->bindParam(":id_carrito", $this->id_carrito);
            $stmt_pedido->bindParam(":id_usuario", $id_usuario);
            $stmt_pedido->bindParam(":tipo_pedido", $tipo_pedido);
            $stmt_pedido->bindParam(":total_pedido", $total_pedido);
            $stmt_pedido->bindParam(":tipo_venta", $tipo_venta);
            
            if (!$stmt_pedido->execute()) {
                throw new Exception("Error al crear el pedido.");
            }
            
            $id_pedido = $this->conn->lastInsertId();

            // 3. Desactivar el carrito
            $query_desactivar = "UPDATE " . $this->table_carrito . " SET activo = 0 WHERE id_carrito = :id_carrito";
            $stmt_desactivar = $this->conn->prepare($query_desactivar);
            $stmt_desactivar->bindParam(":id_carrito", $this->id_carrito);

            if (!$stmt_desactivar->execute()) {
                throw new Exception("Error al desactivar el carrito.");
            }

            // 4. Confirmar transacción
            $this->conn->commit();
            
            return $id_pedido;

        } catch (Exception $e) {
            // 5. Revertir en caso de error
            $this->conn->rollBack();
            return false;
        }
    }
}
?>