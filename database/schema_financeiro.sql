-- ============================================================
-- MÓDULO FINANCEIRO - Consultório + Pessoal
-- Colar no SQL Editor do Supabase e clicar em Run
-- ============================================================

-- Lançamentos financeiros do CONSULTÓRIO
CREATE TABLE IF NOT EXISTS lancamentos_consultorio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria VARCHAR(100) NOT NULL,
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lançamentos financeiros PESSOAIS
CREATE TABLE IF NOT EXISTS lancamentos_pessoal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria VARCHAR(100) NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metas de orçamento pessoal mensal
CREATE TABLE IF NOT EXISTS metas_pessoal (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    valor_meta NUMERIC(10,2) NOT NULL CHECK (valor_meta > 0),
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    ano INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (categoria, mes, ano)
);

-- Trigger updated_at para consultorio
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lancamentos_consultorio_updated ON lancamentos_consultorio;
CREATE TRIGGER trg_lancamentos_consultorio_updated
    BEFORE UPDATE ON lancamentos_consultorio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_lancamentos_pessoal_updated ON lancamentos_pessoal;
CREATE TRIGGER trg_lancamentos_pessoal_updated
    BEFORE UPDATE ON lancamentos_pessoal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_lanc_consultorio_data ON lancamentos_consultorio(data DESC);
CREATE INDEX IF NOT EXISTS idx_lanc_consultorio_tipo ON lancamentos_consultorio(tipo);
CREATE INDEX IF NOT EXISTS idx_lanc_pessoal_data ON lancamentos_pessoal(data DESC);
CREATE INDEX IF NOT EXISTS idx_lanc_pessoal_tipo ON lancamentos_pessoal(tipo);
