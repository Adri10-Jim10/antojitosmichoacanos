<?php
class Producto {
    private $conn;
    private $table_name = "productos";

    public $id_producto;
    public $nombre;
    public $descripcion;
    public $precio;
    public $id_categoria;
    public $activo;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getMenu() {
        $query = "SELECT p.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo
                  FROM " . $this->table_name . " p
                  LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
                  WHERE p.activo = 1
                  ORDER BY c.tipo, p.nombre";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getProductosConOfertas() {
        $query = "SELECT p.*, c.nombre as categoria_nombre,
                         po.precio_oferta, o.nombre as oferta_nombre
                  FROM productos p
                  LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
                  LEFT JOIN productos_ofertas po ON p.id_producto = po.id_producto
                  LEFT JOIN ofertas o ON po.id_oferta = o.id_oferta
                  WHERE p.activo = 1 AND o.activa = 1
                  ORDER BY p.nombre";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Obtener todos los productos para el admin
    public function getAll() {
        $query = "SELECT p.*, c.nombre as categoria_nombre
                  FROM " . $this->table_name . " p
                  LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
                  ORDER BY p.nombre";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Eliminar un producto
    public function delete($id_producto) {
        $this->conn->beginTransaction();
    
        try {
            // Limpiar el ID del producto
            $id_producto_sanitized = htmlspecialchars(strip_tags($id_producto));
    
            // 1. Eliminar de 'detalle_pedidos_ofertas' que depende de 'productos_ofertas'
            // Esta es la parte más compleja, ya que la relación no es directa.
            $query_detalle_ofertas = "DELETE dpo FROM detalle_pedidos_ofertas dpo
                                      JOIN productos_ofertas po ON dpo.id_producto_oferta = po.id_producto_oferta
                                      WHERE po.id_producto = :id_producto";
            $stmt_detalle_ofertas = $this->conn->prepare($query_detalle_ofertas);
            $stmt_detalle_ofertas->bindParam(':id_producto', $id_producto_sanitized);
            $stmt_detalle_ofertas->execute();

            // 2. Lista de tablas que tienen una referencia directa a id_producto
            $related_tables = [
                'detalle_compras_proveedores',
                'productos_ofertas',
                'productos_combos',
                'carrito_items',
                'detalle_pedidos_normales',
                'almacen'
                // 'detalle_pedidos_ofertas' se manejó por separado arriba.
            ];
    
            // 3. Eliminar registros de las tablas con relación directa
            foreach ($related_tables as $table) {
                $query = "DELETE FROM " . $table . " WHERE id_producto = :id_producto";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':id_producto', $id_producto_sanitized);
                $stmt->execute();
            }
    
            // 4. Finalmente, eliminar el producto de la tabla 'productos'
            $query_producto = "DELETE FROM " . $this->table_name . " WHERE id_producto = :id_producto";
            $stmt_producto = $this->conn->prepare($query_producto);
            $stmt_producto->bindParam(':id_producto', $id_producto_sanitized);
            
            if ($stmt_producto->execute()) {
                // Si todo fue bien, confirmar los cambios
                $this->conn->commit();
                return true;
            } else {
                // Si la eliminación del producto falla, revertir todo
                $this->conn->rollBack();
                return false;
            }
        } catch (Exception $e) {
            // Si ocurre cualquier error durante el proceso, revertir todo
            $this->conn->rollBack();
            error_log("Error al eliminar producto: " . $e->getMessage()); // Loguear el error para depuración
            return false;
        }
    }
}