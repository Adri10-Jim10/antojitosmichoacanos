<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Usuario.php';

$database = new Database();
$db = $database->getConnection();
$usuario = new Usuario($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id_usuario = filter_var($_GET['id'], FILTER_VALIDATE_INT);
            if ($id_usuario === false) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "ID de usuario inválido"]);
                exit;
            }
            $user = $usuario->getUserById($id_usuario);
            if ($user) {
                echo json_encode(["success" => true, "data" => $user]);
            } else {
                http_response_code(404);
                echo json_encode(["success" => false, "message" => "Usuario no encontrado"]);
            }
        } else {
            $stmt = $usuario->getAllUsers();
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode([
                "success" => true,
                "data" => $usuarios
            ]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if (isset($data->_method) && $data->_method === 'PUT') {
            if (!empty($data->id_usuario) && !empty($data->usuario) && !empty($data->correo) && !empty($data->rol)) {
                if ($usuario->updateUser($data->id_usuario, $data->usuario, $data->correo, $data->rol)) {
                    echo json_encode(["success" => true, "message" => "Usuario actualizado"]);
                } else {
                    echo json_encode(["success" => false, "message" => "Error al actualizar"]);
                }
            }
        } elseif (isset($data->_method) && $data->_method === 'DELETE') {
            if (!empty($data->id_usuario)) {
                // No permitir eliminar administradores
                $check_query = "SELECT rol FROM usuarios WHERE id_usuario = :id_usuario";
                $check_stmt = $db->prepare($check_query);
                $check_stmt->bindParam(":id_usuario", $data->id_usuario);
                $check_stmt->execute();
                $user = $check_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user && $user['rol'] !== 'administrador') {
                    $query = "DELETE FROM usuarios WHERE id_usuario = :id_usuario";
                    $stmt = $db->prepare($query);
                    $stmt->bindParam(":id_usuario", $data->id_usuario);
                    
                    if ($stmt->execute()) {
                        echo json_encode(["success" => true, "message" => "Usuario eliminado"]);
                    } else {
                        echo json_encode(["success" => false, "message" => "Error al eliminar"]);
                    }
                } else {
                    echo json_encode(["success" => false, "message" => "No se puede eliminar administradores"]);
                }
            }
        }
        break;
}
?>