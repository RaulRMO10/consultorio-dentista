-- 1. Criação da Tabela de Categorias
CREATE TABLE IF NOT EXISTS fin_categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA', 'TRANSFERENCIA')),
    escopo VARCHAR(20) NOT NULL CHECK (escopo IN ('CLINICA', 'PESSOAL', 'GLOBAL')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- População de Categorias Iniciais Básicas
INSERT INTO fin_categorias (nome, tipo, escopo) VALUES 
('Atendimento Clínico', 'RECEITA', 'CLINICA'),
('Materiais e Insumos', 'DESPESA', 'CLINICA'),
('Pró-Labore / Retirada', 'TRANSFERENCIA', 'GLOBAL'),
('Aporte / Investimento', 'TRANSFERENCIA', 'GLOBAL'),
('Moradia e Contas', 'DESPESA', 'PESSOAL'),
('Lazer', 'DESPESA', 'PESSOAL')
ON CONFLICT DO NOTHING;

-- 2. Criação da Tabela Faturamentos (O Contrato / Negociação com Paciente)
CREATE TABLE IF NOT EXISTS fin_faturamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    procedimento_id UUID REFERENCES procedimentos(id) ON DELETE SET NULL,
    descricao TEXT,
    valor_original DECIMAL(10, 2) NOT NULL,
    valor_desconto DECIMAL(10, 2) DEFAULT 0.00,
    valor_final DECIMAL(10, 2) NOT NULL,
    metodo_pagamento VARCHAR(50) NOT NULL,
    numero_parcelas INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'PAGO_PARCIAL', 'QUITADO', 'CANCELADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Criação da Tabela Transações (Motor de Fluxo de Caixa Global)
CREATE TABLE IF NOT EXISTS fin_transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id INTEGER REFERENCES fin_categorias(id) ON DELETE RESTRICT,
    faturamento_id UUID REFERENCES fin_faturamentos(id) ON DELETE CASCADE, -- opcional
    descricao TEXT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    conta_origem VARCHAR(20) CHECK (conta_origem IN ('CLINICA', 'PESSOAL', NULL)),
    conta_destino VARCHAR(20) CHECK (conta_destino IN ('CLINICA', 'PESSOAL', NULL)),
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'CANCELADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Trigger para atualização de modified_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_fin_faturamentos_modtime
BEFORE UPDATE ON fin_faturamentos
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_fin_transacoes_modtime
BEFORE UPDATE ON fin_transacoes
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
