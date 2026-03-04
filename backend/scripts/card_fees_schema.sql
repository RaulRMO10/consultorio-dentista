-- Migration to add Taxa de Cartão / Adiantamento fields

ALTER TABLE fin_transacoes ADD COLUMN IF NOT EXISTS taxa_porcentagem DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE fin_transacoes ADD COLUMN IF NOT EXISTS taxa_valor DECIMAL(10,2) DEFAULT 0.00;
-- We calculate the net value on the fly or just store the deductions so the Dashboard can sum (valor - taxa_valor).
