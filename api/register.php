<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Usuario.php';

$database = new Database();
$db = $database->getConnection();
$usuario = new Usuario($db);

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->usuario) && !empty($data->contraseña) && !empty($data->correo)) {
    $usuario->usuario = $data->usuario;
    $usuario->contraseña = $data->contraseña;
    $usuario->correo = $data->correo;

    if ($usuario->register()) {
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Usuario registrado exitosamente",
            "user" => [
                "id_usuario" => $usuario->id_usuario,
                "usuario" => $usuario->usuario,
                "correo" => $usuario->correo,
                "rol" => $usuario->rol
            ]
        ]);
    } else {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "El usuario ya existe"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Datos incompletos"]);
}
?>