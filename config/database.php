<?php
class Database {
    private $host = "localhost:3307";  // AGREGA EL PUERTO 3307
    private $db_name = "crm_antojitosmichoacanos";
    private $username = "root";
    private $password = ""; // XAMPP por defecto tiene password vacío
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            error_log("✅ Conexión a MySQL exitosa en puerto 3307");
        } catch(PDOException $exception) {
            error_log("Error de conexión: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos: " . $exception->getMessage());
        }
        return $this->conn;
    }
}
?>