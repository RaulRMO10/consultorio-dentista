-- Migration to create the fin_formas_pagamento table

CREATE TABLE IF NOT EXISTS fin_formas_pagamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL, -- Ex: "Cielo - Crédito à Vista", "Pix", "Stone - Débito"
    tipo VARCHAR(50) NOT NULL, -- Ex: "CREDITO", "DEBITO", "PIX", "DINHEIRO", "BOLETO"
    taxa_padrao_porcentagem DECIMAL(5,2) DEFAULT 0.00,
    dias_repasse INTEGER DEFAULT 0, -- Em quantos dias o dinheiro cai na conta (para previsão futura)
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Trigger para updated_at (assumindo que a function update_updated_at_column() já existe finance_schema.sql)
DROP TRIGGER IF EXISTS trg_fin_formas_pagamento_updated_at ON fin_formas_pagamento;
CREATE TRIGGER trg_fin_formas_pagamento_updated_at
BEFORE UPDATE ON fin_formas_pagamento
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir formas de pagamento padrão básicas
INSERT INTO fin_formas_pagamento (nome, tipo, taxa_padrao_porcentagem, dias_repasse) VALUES
('Pix', 'PIX', 0.00, 0),
('Dinheiro Físico', 'DINHEIRO', 0.00, 0),
('Cartão de Débito (Genérico)', 'DEBITO', 1.99, 1),
('Cartão de Crédito (Genérico)', 'CREDITO', 4.99, 30);
