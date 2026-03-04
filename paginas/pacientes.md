👤 Planejamento: Aba de Pacientes
1. Objetivo da Tela
Centralizar a vida clínica do paciente, permitindo acompanhar o que já foi feito e o que ainda está em execução, garantindo que o faturamento financeiro seja condizente com os tratamentos reais.
2. Visão de Procedimentos (Lista Clínica)
Diferente da aba financeira, esta visão foca no estado clínico e não deve exibir valores monetários para evitar confusão operacional. Ela deve ser dividida em:
Procedimentos em Aberto: Tratamentos que já foram iniciados, mas ainda não foram concluídos (ex: um canal que exige várias sessões).
Procedimentos Feitos/Concluídos: Histórico de tudo que já foi finalizado no paciente.
3. Gestão de Status do Procedimento
Para cada procedimento listado no perfil do paciente, deve ser possível alterar e visualizar o seu estado:
Em Andamento: O tratamento está sendo realizado (ex: sessões intermediárias).
Finalizado/Concluído: O tratamento clínico foi encerrado.
4. Integração Inteligente com Agendamento
Esta é a funcionalidade crítica para evitar erros financeiros:
Seleção de Procedimento Existente: Ao criar um novo agendamento, o sistema deve oferecer a opção de vincular esse horário a um procedimento já em aberto.
Prevenção de Duplicidade: Se o usuário não selecionar um procedimento em andamento e criar um "novo", o sistema entenderá que é um novo serviço, gerando uma nova cobrança financeira indevida.
Vínculo com a Base: O procedimento selecionado trará automaticamente a duração média configurada no cadastro de procedimentos para organizar a grade horária.
5. Fluxo de Faturamento (Bastidores)
Embora a tela de pacientes seja clínica, as ações nela refletem no financeiro:
Fechamento de Procedimento: Quando um procedimento é marcado como "fechado" ou "iniciado", o sistema registra o faturamento e gera a conta a receber correspondente.
Controle de Inadimplência: Através do histórico, é possível cruzar o que foi feito clinicamente com o que foi efetivamente pago no módulo financeiro.

--------------------------------------------------------------------------------
Destaque para o Desenvolvedor: O ponto principal desta aba é o vínculo entre o agendamento e o procedimento em aberto. O sistema deve "forçar" ou sugerir que a secretária use um procedimento que o paciente já está realizando, em vez de sempre cadastrar um novo, para manter o financeiro limpo.