<?php
class Resena {
    private $conn;
    private $table_name = "reseñas";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getReviewById($id_reseña) {
        $query = "SELECT r.*, u.usuario as cliente 
                  FROM " . $this->table_name . " r
                  JOIN usuarios u ON r.id_usuario = u.id_usuario
                  WHERE r.id_reseña = :id_reseña";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id_reseña", $id_reseña);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>