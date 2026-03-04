-- Tabela de relacionamento N:N entre agendamentos e procedimentos
CREATE TABLE IF NOT EXISTS agendamento_procedimentos (
    agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE,
    procedimento_id UUID REFERENCES procedimentos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (agendamento_id, procedimento_id)
);

-- Ativar RLS (Opcional, mas boa prática no Supabase)
ALTER TABLE agendamento_procedimentos ENABLE ROW LEVEL SECURITY;

-- Policy aberta para facilitar (ajuste conforme autenticação)
CREATE POLICY "Permitir tudo para autenticados" ON agendamento_procedimentos FOR ALL USING (true);
