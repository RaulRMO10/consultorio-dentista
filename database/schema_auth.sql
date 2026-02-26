-- ============================================================
-- Tabela de usuários do sistema OdontoSystem
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        VARCHAR(150)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    senha_hash  TEXT          NOT NULL,
    role        VARCHAR(30)   NOT NULL DEFAULT 'recepcionista'
                CHECK (role IN ('admin','dentista','recepcionista','financeiro')),
    ativo       BOOLEAN       NOT NULL DEFAULT TRUE,
    ultimo_acesso TIMESTAMPTZ,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Índice para login por e-mail
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- USUÁRIO ADMIN INICIAL
-- Senha padrão: Admin@2025
-- Hash gerado com bcrypt (12 rounds)
-- ============================================================
INSERT INTO usuarios (nome, email, senha_hash, role)
VALUES (
    'Administrador',
    'admin@odontosystem.com',
    '$2b$12$NIKyaPKf0v5tQaUcguOPveFXPFx1L41YneC62D3SUgCFteQY76AK6',
    'admin'
)
ON CONFLICT (email) DO NOTHING;
