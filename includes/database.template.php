<?php
// database.template.php
$host = '[[HOST]]';
$dbname = '[[DATABASE]]';
$user = '[[USER]]';
$password = '[[PASSWORD]]';
$port = '5432';
$sslmode = 'require';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=$sslmode";
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erro de conexão: " . $e->getMessage());
}
?>