<?php
class Database {
    private $host = "localhost";  // CAMBIA "3306" por "localhost"
    private $db_name = "crm_antojitosmichoacanos";
    private $username = "root";
    private $password = "123456789A";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            error_log("Error de conexión: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
        return $this->conn;
    }
}
?>