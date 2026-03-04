🗓️ Planejamento: Aba de Agendamentos
1. Objetivo da Tela
Proporcionar um controle dinâmico e fluido da agenda diária e mensal, servindo para manter a ordem dos atendimentos do dentista sem distrações financeiras.
2. Estrutura do Agendamento (Campos)
Cada item na lista de agendamentos deve conter as seguintes informações:
Cliente: Identificação do paciente.
Horário: Horário previsto (baseado na média de duração).
Dentista: Profissional responsável pelo atendimento.
Procedimento: O que será realizado (buscando da base de procedimentos ou do histórico do paciente).
Observações: Notas adicionais relevantes para o atendimento.
Status: Situação atual do paciente no fluxo da clínica.
3. Fluxo de Status e Atendimento
O agendamento e baseado no cliente então se 
Aguardando: O paciente ainda não chegou
Em Andamento: O dentista iniciou o procedimento. Mesmo que o horário do próximo paciente já tenha passado, o status "Em Andamento" permanece até a finalização real.
Finalizado: O atendimento foi concluído, liberando o dentista para o próximo paciente da fila.
4. Funcionalidade de Agendamento Dinâmico
A principal característica é ser um sistema à parte do agendamento fixo, permitindo ajustes rápidos:
Ajuste por Arrastar (Subir/Descer): Capacidade de mover um paciente para cima ou para baixo na lista de horários sem precisar entrar no cadastro e mudar o horário manualmente.
Reordenamento Inteligente: Se o paciente das 8:00 ainda não chegou e o das 8:30 já está presente, o usuário pode "subir" o das 8:30 para iniciar o atendimento imediatamente.
Independência de Horário Estrito: O sistema deve entender que o horário é uma referência, mas a ordem de entrada depende da finalização do procedimento anterior e da presença do paciente.
5. Integrações Essenciais
Com Procedimentos: O sistema utiliza a duração média cadastrada (ex: 60 min) como base para organizar a agenda, embora o tempo real possa variar.
Com Pacientes: Ao agendar, o sistema deve permitir selecionar procedimentos já em aberto/andamento do paciente. Isso evita que novos procedimentos sejam contabilizados financeiramente de forma errada quando o paciente está apenas continuando um tratamento já iniciado.
