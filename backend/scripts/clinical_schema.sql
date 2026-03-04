-- Schema Database for the Clinical Module (EMR / Prontuário)

CREATE TABLE IF NOT EXISTS clin_tratamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
    procedimento_id UUID REFERENCES procedimentos(id) ON DELETE SET NULL,
    dentista_id UUID REFERENCES dentistas(id) ON DELETE SET NULL,
    faturamento_id UUID REFERENCES fin_faturamentos(id) ON DELETE SET NULL, -- Link to the financial invoice
    status VARCHAR(20) DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_clin_tratamentos_modtime()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now());
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_clin_tratamentos_modtime_trigger
BEFORE UPDATE ON clin_tratamentos
FOR EACH ROW EXECUTE FUNCTION update_clin_tratamentos_modtime();

-- Add clin_tratamento_id to Agendamentos so an appointment is linked to the ongoing treatment
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS clin_tratamento_id UUID REFERENCES clin_tratamentos(id) ON DELETE SET NULL;
