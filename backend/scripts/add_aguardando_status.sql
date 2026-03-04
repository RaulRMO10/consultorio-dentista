-- 1. Remover a constraint atual (se existir)
DO $$ 
BEGIN
    ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- 2. Recriar a constraint com o novo status 'aguardando' incluído
ALTER TABLE agendamentos 
ADD CONSTRAINT agendamentos_status_check 
CHECK (status IN ('agendado', 'confirmado', 'aguardando', 'em_atendimento', 'concluido', 'falta', 'cancelado'));
