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
}
?>