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

        // Cargar productos individuales (ahora trayendo también id_subproducto y nombre del subproducto si existe)
        $query_items = "SELECT ci.*, p.nombre, p.descripcion, ci.precio_unitario, ci.cantidad, ci.id_carrito_item, ci.id_subproducto,
                        sp.nombre AS subproducto_nombre
                       FROM " . $this->table_items . " ci
                       JOIN productos p ON ci.id_producto = p.id_producto
                       LEFT JOIN sub_productos sp ON ci.id_subproducto = sp.id_subproducto
                       WHERE ci.id_carrito = :id_carrito";
        
        $stmt = $this->conn->prepare($query_items);
        $stmt->bindParam(":id_carrito", $this->id_carrito);
        $stmt->execute();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $detalle = null;
            if (!empty($row['subproducto_nombre'])) {
                $detalle = $row['subproducto_nombre'];
            }
            $items[] = [
                'tipo' => 'producto',
                'id' => $row['id_carrito_item'],
                'producto_id' => $row['id_producto'],
                'nombre' => $row['nombre'],
                'cantidad' => $row['cantidad'],
                'precio' => $row['precio_unitario'],
                'total' => $row['cantidad'] * $row['precio_unitario'],
                'id_subproducto' => $row['id_subproducto'] ?? null,
                'detalle' => $detalle
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

    /**
     * Agregar producto.
     * Si se provee id_subproducto se inserta siempre una fila nueva (para distinguir sabores/medidas).
     * Si no se provee id_subproducto se mantiene comportamiento de sumar cantidades por duplicado.
     */
    public function agregarProducto($id_producto, $cantidad, $precio, $id_subproducto = null) {
        if ($id_subproducto !== null) {
            $query = "INSERT INTO " . $this->table_items . " 
                     (id_carrito, id_producto, id_subproducto, cantidad, precio_unitario) 
                     VALUES (:id_carrito, :id_producto, :id_subproducto, :cantidad, :precio)";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id_carrito", $this->id_carrito);
            $stmt->bindParam(":id_producto", $id_producto);
            $stmt->bindParam(":id_subproducto", $id_subproducto);
            $stmt->bindParam(":cantidad", $cantidad);
            $stmt->bindParam(":precio", $precio);
            
            return $stmt->execute();
        } else {
            // Comportamiento anterior (suma si existe entrada igual)
            $query = "INSERT INTO " . $this->table_items . " 
                     (id_carrito, id_producto, cantidad, precio_unitario) 
                     VALUES (:id_carrito, :id_producto, :cantidad, :precio)
                     ON DUPLICATE KEY UPDATE cantidad = cantidad + :cantidad";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id_carrito", $this->id_carrito);
            $stmt->bindParam(":id_producto", $id_producto);
            $stmt->bindParam(":cantidad", $cantidad);
            $stmt->bindParam(":precio", $precio);
            
            return $stmt->execute();
        }
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
}
?>