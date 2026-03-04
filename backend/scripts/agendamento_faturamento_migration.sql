-- Adicionar coluna de procedimento no agendamento
ALTER TABLE agendamentos 
ADD COLUMN IF NOT EXISTS procedimento_id UUID REFERENCES procedimentos(id) ON DELETE SET NULL;

-- Adicionar coluna de agendamento no faturamento para amarrar o fluxo
ALTER TABLE fin_faturamentos 
ADD COLUMN IF NOT EXISTS agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL;
