<?php
require 'includes/database.php';
require 'includes/header.php';

// Listar clientes
$stmt = $pdo->query("SELECT * FROM clientes ORDER BY data_cadastro DESC");
$clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<h2>Clientes</h2>
<table>
    <thead>
        <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Telefone</th>
            <th>Ações</th>
        </tr>
    </thead>
    <tbody>
        <?php foreach ($clientes as $cliente): ?>
        <tr>
            <td><?= $cliente['nome'] ?></td>
            <td><?= $cliente['cpf'] ?></td>
            <td><?= $cliente['telefone'] ?></td>
            <td>
                <a href="editar_cliente.php?id=<?= $cliente['cliente_id'] ?>">Editar</a>
            </td>
        </tr>
        <?php endforeach; ?>
    </tbody>
</table>

<?php require 'includes/footer.php'; ?>