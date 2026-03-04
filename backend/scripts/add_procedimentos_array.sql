-- Migration para adicionar suporte a múltiplos procedimentos por Tratamento no Prontuário Clínico
ALTER TABLE clin_tratamentos ADD COLUMN IF NOT EXISTS procedimentos_ids UUID[];
