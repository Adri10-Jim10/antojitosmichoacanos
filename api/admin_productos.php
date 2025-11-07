<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/Producto.php';

$database = new Database();
$db = $database->getConnection();

$producto = new Producto($db);
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $producto->getAll(); // Usamos el nuevo método para obtener todos los productos para el admin
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "data" => $productos]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al obtener productos: " . $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        // Simulación de métodos PUT y DELETE
        if (isset($data->_method) && $data->_method === 'DELETE') {
            if (!empty($data->id_producto)) {
                try {
                    if ($producto->delete($data->id_producto)) {
                        echo json_encode(["success" => true, "message" => "Producto eliminado correctamente"]);
                    } else {
                        http_response_code(500);
                        echo json_encode(["success" => false, "message" => "Error al eliminar el producto"]);
                    }
                } catch (Exception $e) {
                    http_response_code(500);
                    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
                }
            } else {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "ID de producto no proporcionado"]);
            }
        } elseif (isset($data->_method) && $data->_method === 'PUT') {
            if (!empty($data->id_producto) && isset($data->precio)) {
                $query = "UPDATE productos SET precio = :precio WHERE id_producto = :id_producto";
                $stmt = $db->prepare($query);
    
                $stmt->bindParam(':precio', $data->precio);
                $stmt->bindParam(':id_producto', $data->id_producto);
    
                if ($stmt->execute()) {
                    echo json_encode(["success" => true, "message" => "Precio actualizado correctamente."]);
                } else {
                    echo json_encode(["success" => false, "message" => "No se pudo actualizar el precio."]);
                }
            } else {
                echo json_encode(["success" => false, "message" => "Datos incompletos. Se requiere id_producto y precio."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Operación no soportada en POST. Use _method: 'PUT' o 'DELETE'."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método no permitido"]);
        break;
}
?>