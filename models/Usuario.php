<?php
class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public $id_usuario;
    public $usuario;
    public $contraseña;
    public $correo;
    public $rol;
    public $fecha_registro;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login() {
        $query = "SELECT id_usuario, usuario, contraseña, correo, rol, fecha_registro 
                  FROM " . $this->table_name . " 
                  WHERE usuario = :usuario OR correo = :usuario";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario", $this->usuario);
        $stmt->execute();

        if ($stmt->rowCount() == 1) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Verificar contraseña con hash
            if (password_verify($this->contraseña, $row['contraseña'])) {
                $this->id_usuario = $row['id_usuario'];
                $this->usuario = $row['usuario'];
                $this->correo = $row['correo'];
                $this->rol = $row['rol'];
                $this->fecha_registro = $row['fecha_registro'];
                return true;
            }
        }
        return false;
    }

    public function register() {
        // Verificar si el usuario ya existe
        $check_query = "SELECT id_usuario FROM " . $this->table_name . " 
                       WHERE usuario = :usuario OR correo = :correo";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(":usuario", $this->usuario);
        $check_stmt->bindParam(":correo", $this->correo);
        $check_stmt->execute();

        if ($check_stmt->rowCount() > 0) {
            return false; // Usuario ya existe
        }

        // Hash de contraseña
        $hashed_password = password_hash($this->contraseña, PASSWORD_DEFAULT);

        // Insertar nuevo usuario - CORREGIDO: usar nombres de parámetros consistentes
        $query = "INSERT INTO " . $this->table_name . " 
                 (usuario, contraseña, correo, tipo_registro, rol) 
                 VALUES (:usuario, :contraseña, :correo, 'email', 'cliente')";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":usuario", $this->usuario);
        $stmt->bindParam(":contraseña", $hashed_password);
        $stmt->bindParam(":correo", $this->correo);

        if ($stmt->execute()) {
            $this->id_usuario = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    // Método para dashboard admin
    public function getAllUsers() {
        $query = "SELECT id_usuario, usuario, correo, rol, fecha_registro 
                  FROM " . $this->table_name . " 
                  ORDER BY fecha_registro DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getUsersCount() {
        $query = "SELECT COUNT(*) as total, 
                         SUM(CASE WHEN rol = 'cliente' THEN 1 ELSE 0 END) as clientes,
                         SUM(CASE WHEN rol = 'administrador' THEN 1 ELSE 0 END) as administradores
                  FROM " . $this->table_name;
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>