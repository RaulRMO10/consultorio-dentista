<?php
require 'includes/database.php';

try {
    $stmt = $pdo->query("SELECT CURRENT_TIMESTAMP AS hora_servidor");
    $resultado = $stmt->fetch();
    echo "<h1>Conexão bem-sucedida!</h1>";
    echo "Hora do servidor PostgreSQL: " . $resultado['hora_servidor'];
} catch (PDOException $e) {
    die("ERRO: " . $e->getMessage());
}
?>