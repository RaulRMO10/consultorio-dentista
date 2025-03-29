<?php
include 'includes/database.php';
include 'includes/header.php';

// Processar formulário
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $stmt = $pdo->prepare("INSERT INTO clientes 
            (nome, data_nascimento, cpf, endereco, telefone, email, data_cadastro)
            VALUES (?, ?, ?, ?, ?, ?, NOW())");
        
        $stmt->execute([
            $_POST['nome'],
            $_POST['data_nascimento'],
            $_POST['cpf'],
            $_POST['endereco'],
            $_POST['telefone'],
            $_POST['email']
        ]);
        
        header('Location: clientes.php?sucesso=1');
        exit();
    } catch (PDOException $e) {
        $erro = "Erro ao cadastrar: " . $e->getMessage();
    }
}
?>

<h2>Novo Cliente</h2>

<?php if (isset($erro)): ?>
    <div class="erro"><?= $erro ?></div>
<?php endif; ?>

<form method="post">
    <div>
        <label>Nome:</label>
        <input type="text" name="nome" required>
    </div>
    
    <div>
        <label>Data de Nascimento:</label>
        <input type="date" name="data_nascimento">
    </div>
    
    <div>
        <label>CPF:</label>
        <input type="text" name="cpf" pattern="\d{11}" placeholder="11 dígitos sem pontuação">
    </div>
    
    <div>
        <label>Telefone:</label>
        <input type="tel" name="telefone" placeholder="(00) 00000-0000">
    </div>
    
    <div>
        <label>Email:</label>
        <input type="email" name="email">
    </div>
    
    <div>
        <label>Endereço:</label>
        <textarea name="endereco"></textarea>
    </div>
    
    <button type="submit">Cadastrar</button>
</form>

<?php include 'includes/footer.php'; ?>