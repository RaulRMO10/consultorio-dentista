📌 1️⃣ Cadastro das Formas de Pagamento

Você vai cadastrar previamente:

Pix

Dinheiro

Cartão Crédito – Repasse Parcelado

Cartão Crédito – Antecipado

Parcelamento Interno

Cada forma deve ter configurado:

Se recebe no mesmo dia ou depois

Se permite parcelamento

Taxa (%) da operadora

Prazo de repasse (ex: 30 dias por parcela)

📌 2️⃣ Fluxo Completo – Do Procedimento ao Caixa
🔹 Etapa 1 – Procedimento é Fechado

Paciente fecha:

Canal = 1.000

O sistema registra:

Faturamento = 1.000

Gera conta a receber = 1.000

Nesse momento ainda não entrou dinheiro.

🔹 Etapa 2 – Escolha da Forma de Pagamento

Aqui muda tudo.

💰 Caso 1 – Pix ou Dinheiro

Paciente paga 1.000.

Sistema:

Marca conta como quitada.

Gera entrada de caixa hoje: +1.000.

Impacto:

✔ Faturamento = 1.000
✔ Caixa hoje = +1.000

💳 Caso 2 – Cartão Crédito com Taxa

Suponha:

Valor: 1.000
Taxa da operadora: 5%

Valor líquido que você recebe:
1.000 – 5% = 950

🔹 Se for cartão com repasse parcelado (5x)

Paciente parcela 1.000 em 5x.

Sistema:

Conta fica quitada (cliente já pagou).

Gera previsão de recebimento:

190 por mês durante 5 meses
(950 ÷ 5)

Cada mês você confirma quando cair.

Impacto:

✔ Faturamento: 1.000
✔ Receita líquida real: 950
✔ Caixa entra parcelado

🔹 Se for cartão com antecipação

Paciente parcela 1.000.

Operadora deposita tudo amanhã com taxa.

Sistema:

Conta quitada.

Gera previsão única: 950 amanhã.

Quando cair, marca como recebido.

Impacto:

✔ Faturamento: 1.000
✔ Receita líquida: 950
✔ Caixa entra de uma vez

🧾 Caso 3 – Parcelamento Interno

Paciente combina:

1.000 em 5x direto com o consultório.

Sistema:

Gera 5 parcelas de 200.

Cada parcela vira uma conta separada.

Só entra no caixa quando ele pagar.

Se atrasar, você enxerga.

Impacto:

✔ Faturamento: 1.000
✔ Caixa entra conforme pagamento real

📊 Como isso retorna para o Financeiro

Seu financeiro terá três visões:

🔹 1. Faturamento (Competência)

Mostra o que foi vendido no período.

Exemplo:

Março: 20.000 vendidos.

Não importa se foi Pix, cartão ou parcelado.

🔹 2. Previsão de Recebimento

Mostra o que está previsto para cair.

Exemplo:

Março:

5.000 Pix

3.000 Cartão (parcelas)

2.000 Parcelamento interno

Total previsto: 10.000

🔹 3. Caixa Real

Mostra o que realmente entrou.

Exemplo:

Entrou hoje:

1.000 Pix

190 cartão parcela

200 parcelamento interno

📌 Sobre a Taxa do Cartão

A taxa:

Nunca reduz o faturamento.

Reduz apenas o valor líquido recebido.

Você pode tratar como:

✔ Receita líquida direta
ou
✔ Receita bruta + despesa financeira

Se quiser controle mais profissional, registre a taxa como despesa financeira.

🎯 Resumo Final do Fluxo

Procedimento fechado
→ Gera faturamento
→ Gera conta
→ Escolhe forma de pagamento
→ Sistema calcula taxa (se cartão)
→ Gera previsão de recebimento
→ Quando cair, confirma
→ Impacta caixa

🔥 O que isso resolve

✔ Caixa nunca fica distorcido
✔ Você sabe o que vendeu
✔ Você sabe o que vai receber
✔ Você controla taxa de cartão
✔ Você controla inadimplência
✔ Você consegue prever fluxo de meses futuros

Esse modelo é simples, manual e profissional ao mesmo tempo.
Sem integração bancária, mas com controle real.

Se quiser, no próximo passo eu organizo isso em uma arquitetura final enxuta para você implementar sem complexidade excessiva.