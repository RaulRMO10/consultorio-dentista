-- ================================================
-- SISTEMA DE CONSULTÓRIO DENTISTA - MVP
-- Schema PostgreSQL (Supabase)
-- ================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Limpar tabelas existentes
DROP TABLE IF EXISTS agendamentos CASCADE;
DROP TABLE IF EXISTS procedimentos CASCADE;
DROP TABLE IF EXISTS pacientes CASCADE;
DROP TABLE IF EXISTS dentistas CASCADE;

-- ================================================
-- TABELA: dentistas
-- ================================================
CREATE TABLE dentistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    cro VARCHAR(50) NOT NULL UNIQUE,
    especialidade VARCHAR(100),
    telefone VARCHAR(20),
    email VARCHAR(150),
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ================================================
-- TABELA: pacientes
-- ================================================
CREATE TABLE pacientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14),
    data_nascimento DATE,
    telefone VARCHAR(20) NOT NULL,
    celular VARCHAR(20),
    email VARCHAR(150),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- CPF único quando preenchido
CREATE UNIQUE INDEX idx_pacientes_cpf_unique ON pacientes(cpf) WHERE cpf IS NOT NULL;

-- ================================================
-- TABELA: procedimentos
-- ================================================
CREATE TABLE procedimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    valor_padrao DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duracao_minutos INTEGER DEFAULT 60 NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ================================================
-- TABELA: agendamentos
-- ================================================
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    dentista_id UUID NOT NULL REFERENCES dentistas(id) ON DELETE CASCADE,
    data_hora TIMESTAMP NOT NULL,
    duracao_minutos INTEGER DEFAULT 60 NOT NULL,
    status VARCHAR(20) DEFAULT 'agendado' NOT NULL CHECK (
        status IN ('agendado', 'confirmado', 'em_atendimento', 'concluido', 'cancelado', 'falta')
    ),
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ================================================
-- ÍNDICES
-- ================================================
CREATE INDEX idx_pacientes_nome ON pacientes(nome);
CREATE INDEX idx_pacientes_ativo ON pacientes(ativo);
CREATE INDEX idx_dentistas_ativo ON dentistas(ativo);
CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX idx_agendamentos_dentista ON agendamentos(dentista_id);
CREATE INDEX idx_agendamentos_status ON agendamentos(status);

-- =====================================================
-- TRIGGERS (Atualização automática de updated_at)
-- ==================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dentistas_updated_at BEFORE UPDATE ON dentistas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pacientes_updated_at BEFORE UPDATE ON pacientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_procedimentos_updated_at BEFORE UPDATE ON procedimentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agendamentos_updated_at BEFORE UPDATE ON agendamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- DADOS INICIAIS
-- ================================================

-- Procedimentos básicos
INSERT INTO procedimentos (nome, descricao, valor_padrao, duracao_minutos) VALUES
    ('Consulta', 'Consulta de avaliação', 100.00, 30),
    ('Limpeza', 'Limpeza e polimento dental', 150.00, 45),
    ('Restauração', 'Restauração com resina', 200.00, 60),
    ('Extração', 'Extração de dente', 250.00, 45),
    ('Canal', 'Tratamento de canal', 800.00, 90),
    ('Clareamento', 'Clareamento dental', 600.00, 60),
    ('Radiografia', 'Radiografia panorâmica', 80.00, 15),
    ('Prótese', 'Confecção de prótese', 1500.00, 60),
    ('Implante', 'Implante dentário', 3000.00, 120),
    ('Aparelho', 'Instalação de aparelho ortodôntico', 2500.00, 90);

-- Dentista exemplo
INSERT INTO dentistas (nome, cro, especialidade, telefone, email) VALUES
    ('Dr. João Silva', 'CRO-SP-12345', 'Clínico Geral', '(11) 98765-4321', 'joao@email.com');

-- ================================================
-- FIM DO SCHEMA MVP
-- ================================================
