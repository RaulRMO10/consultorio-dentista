<?php
$host = 'ep-autumn-dew-ac8ivr31-pooler.sa-east-1.aws.neon.tech';
$dbname = 'CONSULTORIO';
$user = 'neondb_owner';
$password = 'npg_kEVvplWts3q6';
$port = '5432';
$sslmode = 'require';

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=$sslmode";
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // echo "Conectado com sucesso!";
} catch (PDOException $e) {
    die("Erro de conexão: " . $e->getMessage());
}
?>