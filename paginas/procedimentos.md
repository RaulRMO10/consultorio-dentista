🛠️ Planejamento: Aba de Procedimentos
1. Objetivo da Tela
Servir como um catálogo mestre de todos os serviços oferecidos pela clínica. Esta lista define os padrões de tempo para a organização da agenda e os valores para o controle financeiro.
2. Estrutura do Cadastro (Campos)
A lista de procedimentos deve ser totalmente editável e conter:
Nome do Procedimento: Ex: Canal, Limpeza, Restauração.
Valor: Preço base do serviço.
Duração Estimada: Tempo padrão em horas e minutos (ex: 60 min).
Descrição/Notas: Breve detalhamento sobre o que o procedimento envolve (opcional).
3. Função como Base da Agenda
O tempo cadastrado aqui não é uma regra rígida, mas um padrão de base:
Organização: Ao selecionar um procedimento no agendamento, o sistema utiliza a média de minutos cadastrada para sugerir o bloco de tempo na agenda.
Flexibilidade: O sistema deve entender que o atendimento real pode durar mais ou menos que o padrão (ex: um procedimento de 60 min pode terminar em 40 min ou levar 80 min), permitindo o ajuste dinâmico na tela de agendamentos.
4. Integração com a Vida do Paciente
Os procedimentos cadastrados aqui são os mesmos que aparecerão na aba do paciente:
Vínculo Clínico: Permite identificar se o paciente está realizando um "Canal" que já está em aberto ou se está iniciando um novo serviço.
Evitar Erros Financeiros: Ao usar a lista padronizada, o sistema garante que a secretária selecione o item correto, evitando que um retorno de um tratamento em andamento seja contabilizado como uma nova venda.
5. Gatilho Financeiro
A definição do procedimento é o ponto de partida para o faturamento:
Geração de Conta: Assim que um procedimento da lista é "fechado" com o paciente, o sistema registra automaticamente o faturamento e gera uma conta a receber no valor estipulado no cadastro.
Consistência: Garante que os valores cobrados sigam a tabela de preços definida pelo dentista na aba de procedimentos.