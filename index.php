<?php
include 'includes/database.php';
include 'includes/header.php';

// Teste de conexão
$stmt = $pdo->query("SELECT * FROM clientes LIMIT 5");
$clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<h2>Últimos Clientes</h2>
<ul>
<?php foreach ($clientes as $cliente): ?>
    <li><?= $cliente['nome'] ?> - <?= $cliente['email'] ?></li>
<?php endforeach; ?>
</ul>

<?php include 'includes/footer.php'; ?>