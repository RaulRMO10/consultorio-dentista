"""
Rotas da API - Financeiro Global (Transações Core)
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import date
from typing import Optional

from backend.config.supabase_client import get_supabase

router = APIRouter()


class TransacaoCreate(BaseModel):
    categoria_id: int
    descricao: str
    valor: float
    data_vencimento: date
    data_pagamento: Optional[date] = None
    conta_origem: Optional[str] = None
    conta_destino: Optional[str] = None
    status: str = "PENDENTE"


class TransacaoUpdate(BaseModel):
    categoria_id: Optional[int] = None
    descricao: Optional[str] = None
    valor: Optional[float] = None
    data_vencimento: Optional[date] = None
    data_pagamento: Optional[date] = None
    conta_origem: Optional[str] = None
    conta_destino: Optional[str] = None
    status: Optional[str] = None


class TransacaoAvulsaCreate(BaseModel):
    escopo: str # 'CLINICA' ou 'PESSOAL'
    tipo: str # 'DESPESA', 'RECEITA', ou 'TRANSFERENCIA'
    valor: float
    data_vencimento: date
    categoria_id: Optional[int] = None
    descricao: str
    metodo_pagamento: str
    status: str = "PAGO" # Por padrão lançamentos avulsos são criados liquidados, ou PENDENTE


def _proximo_mes(mes: int, ano: int):
    if mes == 12:
        return 1, ano + 1
    return mes + 1, ano


@router.get("/categorias")
def listar_categorias_ativas():
    sb = get_supabase()
    return sb.table("fin_categorias").select("*").eq("ativo", True).execute().data


@router.get("/dashboard")
def resumo_dashboard_global(mes: Optional[int] = None, ano: Optional[int] = None):
    # Calcula todos os 7 KPIs do novo motor global.
    sb = get_supabase()
    ano = ano or date.today().year
    mes = mes or date.today().month
    prox_mes, prox_ano = _proximo_mes(mes, ano)

    # Pegamos TODAS as transações do mês para processar em memória rapidamente
    res = sb.table("fin_transacoes").select("*, fin_categorias(nome, tipo, escopo)").gte("data_vencimento", f"{ano}-{mes:02d}-01").lt("data_vencimento", f"{prox_ano}-{prox_mes:02d}-01").execute()
    txs = res.data

    # KPI 1: Faturamento Bruto (Entrou na conta clínica)
    faturamento_bruto = sum(t["valor"] for t in txs if t["fin_categorias"]["tipo"] == "RECEITA" and t["conta_destino"] == "CLINICA" and t["status"] == "PAGO")
    
    # KPI 2: Lucro Operacional (Faturamento - Despesas da Clínica pagas)
    despesas_clinica = sum(t["valor"] for t in txs if t["fin_categorias"]["tipo"] == "DESPESA" and t["fin_categorias"]["escopo"] == "CLINICA" and t["status"] == "PAGO")
    lucro_operacional = faturamento_bruto - despesas_clinica

    # KPI 3: A Receber no Mês (Inadimplência ou a Vencer)
    a_receber = sum(t["valor"] for t in txs if t["fin_categorias"]["tipo"] == "RECEITA" and t["status"] == "PENDENTE")

    # KPI 4: Aportes (O que o dentista injetou do próprio bolso na clínica)
    aportes = sum(t["valor"] for t in txs if t["conta_origem"] == "PESSOAL" and t["conta_destino"] == "CLINICA" and t["status"] == "PAGO")

    # KPI 5: Retiradas / Pró-Labore (O que tirou da clínica pro bolso)
    retiradas = sum(t["valor"] for t in txs if t["conta_origem"] == "CLINICA" and t["conta_destino"] == "PESSOAL" and t["status"] == "PAGO")

    # KPI 6: Despesas Pessoais
    despesas_pessoais = sum(t["valor"] for t in txs if t["fin_categorias"]["tipo"] == "DESPESA" and t["fin_categorias"]["escopo"] == "PESSOAL" and t["status"] == "PAGO")

    # KPI 7: Caixa Pessoal Disponível Mensal (O que sobrou da retirada após as contas dele)
    caixa_pessoal = retiradas - despesas_pessoais

    return {
        "periodo": f"{mes:02d}/{ano}",
        "kpis": {
            "faturamento_bruto": faturamento_bruto,
            "lucro_operacional": lucro_operacional,
            "a_receber": a_receber,
            "aportes_pessoais": aportes,
            "retiradas_pro_labore": retiradas,
            "despesas_pessoais": despesas_pessoais,
            "caixa_pessoal_livre": caixa_pessoal
        },
        "txs_count": len(txs)
    }


@router.get("/")
def listar_transacoes(
    escopo: Optional[str] = None, # CLINICA, PESSOAL, GLOBAL
    mes: Optional[int] = None,
    ano: Optional[int] = None,
    faturamento_id: Optional[str] = None
):
    sb = get_supabase()
    q = sb.table("fin_transacoes").select("*, fin_categorias(nome, tipo, escopo)").order("data_vencimento", desc=True)
    
    if faturamento_id:
        q = q.eq("faturamento_id", faturamento_id)
    
    if mes:
        _ano = ano or date.today().year
        prox_mes, prox_ano = _proximo_mes(mes, _ano)
        q = q.gte("data_vencimento", f"{_ano}-{mes:02d}-01").lt("data_vencimento", f"{prox_ano}-{prox_mes:02d}-01")
        
    dados = q.execute().data
    
    # Filtragem por escopo no Python para tratar Transferências de Pessoal para Clínica (Dono investiu)
    if escopo == "CLINICA":
        return [d for d in dados if d["conta_origem"] == "CLINICA" or d["conta_destino"] == "CLINICA" or d["fin_categorias"]["escopo"] == "CLINICA"]
    if escopo == "PESSOAL":
         return [d for d in dados if d["conta_origem"] == "PESSOAL" or d["conta_destino"] == "PESSOAL" or d["fin_categorias"]["escopo"] == "PESSOAL"]

    return dados


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_transacao(dados: TransacaoCreate):
    sb = get_supabase()
    payload = dados.model_dump(exclude_none=True)
    payload["data_vencimento"] = str(payload["data_vencimento"])
    if payload.get("data_pagamento"):
        payload["data_pagamento"] = str(payload["data_pagamento"])
        
    r = sb.table("fin_transacoes").insert(payload).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar transação manual")
    return r.data[0]


@router.post("/transacao-avulsa", status_code=status.HTTP_201_CREATED)
def criar_transacao_avulsa(dados: TransacaoAvulsaCreate):
    sb = get_supabase()
    
    # Validação de Bloqueio (Regras de Negócio)
    if dados.escopo == "CLINICA" and dados.tipo == "RECEITA":
        raise HTTPException(status_code=403, detail="Não é permitido criar receitas manuais no caixa da clínica. O faturamento deve advir de procedimentos.")
        
    payload = {
        "descricao": dados.descricao,
        "valor": round(dados.valor, 2),
        "data_vencimento": str(dados.data_vencimento),
        "status": dados.status,
        "metodo_pagamento": dados.metodo_pagamento
    }
    
    if dados.status == "PAGO":
        payload["data_pagamento"] = str(dados.data_vencimento) # Simplificação: se marcou pago, a data pag foi a de venc

    if dados.categoria_id:
        payload["categoria_id"] = dados.categoria_id

    # Tratamento de Origem e Destino
    if dados.tipo == "TRANSFERENCIA":
        if dados.escopo == "CLINICA":
            # Retirada / Pró-labore
            payload["conta_origem"] = "CLINICA"
            payload["conta_destino"] = "PESSOAL"
        elif dados.escopo == "PESSOAL":
            # Aporte / Investimento na Clínica
            payload["conta_origem"] = "PESSOAL"
            payload["conta_destino"] = "CLINICA"
        # Obrigar pago nas transferências instantâneas
        payload["status"] = "PAGO"
        payload["data_pagamento"] = str(dados.data_vencimento)
    elif dados.tipo == "DESPESA":
        payload["conta_origem"] = dados.escopo # O dinheiro SAIU dessa conta
    elif dados.tipo == "RECEITA":
        payload["conta_destino"] = dados.escopo # O dinheiro ENTROU nessa conta
        
    r = sb.table("fin_transacoes").insert(payload).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao processar lançamento financeiro.")
    return r.data[0]


@router.put("/{tx_id}")
def atualizar_transacao(tx_id: str, dados: TransacaoUpdate):
    sb = get_supabase()
    payload = dados.model_dump(exclude_unset=True)
    
    if "data_vencimento" in payload and payload["data_vencimento"]:
        payload["data_vencimento"] = str(payload["data_vencimento"])
    if "data_pagamento" in payload and payload["data_pagamento"]:
        payload["data_pagamento"] = str(payload["data_pagamento"])
        
    r = sb.table("fin_transacoes").update(payload).eq("id", tx_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    return r.data[0]


@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_transacao(tx_id: str):
    sb = get_supabase()
    r = sb.table("fin_transacoes").delete().eq("id", tx_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    return None


class PagamentoTx(BaseModel):
    taxa_porcentagem: Optional[float] = 0.0
    taxa_valor: Optional[float] = 0.0
    data_pagamento: Optional[str] = None
    valor_pago: Optional[float] = None
    metodo_pagamento: Optional[str] = None
    acao_residual: Optional[str] = "somar_proxima"
    valor_desconto: Optional[float] = 0.0

@router.post("/{tx_id}/pagar")
def pagar_parcela(tx_id: str, dados: Optional[PagamentoTx] = None):
    import traceback
    try:
        sb = get_supabase()
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        
        # Busca a transação original
        r_tx = sb.table("fin_transacoes").select("*").eq("id", tx_id).execute()
        if not r_tx.data:
            raise HTTPException(status_code=404, detail="Transação não encontrada")
        tx_original = r_tx.data[0]
        fat_id = tx_original.get("faturamento_id")

        valor_original = tx_original["valor"]
        valor_pago = dados.valor_pago if dados and dados.valor_pago is not None else valor_original
        valor_desconto = dados.valor_desconto if dados and dados.valor_desconto is not None else 0.0
        residual = max(0, valor_original - valor_pago - valor_desconto)

        hoje = datetime.now().date().isoformat()
        if dados and dados.data_pagamento:
            hoje = dados.data_pagamento

        update_payload = {
            "status": "PAGO",
            "data_pagamento": hoje,
            "conta_destino": "CLINICA",
            "valor": round(valor_pago, 2)
        }

        if dados:
            if dados.taxa_porcentagem is not None:
                update_payload["taxa_porcentagem"] = dados.taxa_porcentagem
            if dados.taxa_valor is not None:
                update_payload["taxa_valor"] = dados.taxa_valor
            if dados.metodo_pagamento is not None:
                update_payload["metodo_pagamento"] = dados.metodo_pagamento

        r = sb.table("fin_transacoes").update(update_payload).eq("id", tx_id).execute()
        
        # Tratamento do Saldo Residual (Pagamento Parcial)
        if fat_id and residual > 0.001:
            # Busca transações pendentes para jogar a dívida
            r_pendentes = sb.table("fin_transacoes").select("*").eq("faturamento_id", fat_id).eq("status", "PENDENTE").order("data_vencimento").execute()
            pendentes = r_pendentes.data

            if not pendentes:
                # Se não há mais parcelas pra frente, cria uma nova
                proximo_venc = (datetime.fromisoformat(tx_original["data_vencimento"]) + relativedelta(months=1)).date().isoformat()
                nova_tx = {
                    "faturamento_id": fat_id,
                    "categoria_id": tx_original["categoria_id"],
                    "descricao": f"Residual Parcial - {tx_original['descricao']}",
                    "valor": round(residual, 2),
                    "data_vencimento": proximo_venc,
                    "status": "PENDENTE"
                }
                sb.table("fin_transacoes").insert(nova_tx).execute()
            else:
                if dados and dados.acao_residual == "recalcular_todas":
                    qtd = len(pendentes)
                    add_per_parcela = residual / qtd
                    for p in pendentes:
                        novo_valor = round(p["valor"] + add_per_parcela, 2)
                        sb.table("fin_transacoes").update({"valor": novo_valor}).eq("id", p["id"]).execute()
                else:
                    # somar_proxima
                    prox = pendentes[0] # Amais próxima (ordenada por vencimento)
                    novo_valor = round(prox["valor"] + residual, 2)
                    sb.table("fin_transacoes").update({"valor": novo_valor}).eq("id", prox["id"]).execute()

        # Re-avalia o Status do Faturamento Global
        if fat_id:
            todas_txs = sb.table("fin_transacoes").select("status").eq("faturamento_id", fat_id).execute().data
            todas_pagas = all(t["status"] == "PAGO" for t in todas_txs)
            alguma_paga = any(t["status"] == "PAGO" for t in todas_txs)
            
            novo_status = "QUITADO" if todas_pagas else ("PAGO_PARCIAL" if alguma_paga else "ABERTO")
            sb.table("fin_faturamentos").update({"status": novo_status}).eq("id", fat_id).execute()
            
        return r.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar pagamento: {str(e)}")

