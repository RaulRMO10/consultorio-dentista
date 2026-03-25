"""
Rotas da API - Faturamentos (Contas a Receber)
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date
from backend.config.supabase_client import get_supabase

router = APIRouter()


class FaturamentoCreate(BaseModel):
    paciente_id: str
    procedimento_id: Optional[str] = None
    procedimentos_ids: Optional[list[str]] = None
    agendamento_id: Optional[str] = None
    descricao: str
    valor_original: float
    valor_desconto: float = 0.0
    valor_final: float
    valor_entrada: float = 0.0
    taxa_porcentagem_entrada: float = 0.0
    taxa_valor_entrada: float = 0.0
    data_vencimento_primeira: Optional[str] = None
    metodo_pagamento: str
    numero_parcelas: int = 1


@router.get("/")
def listar_faturamentos(status_filtro: Optional[str] = None):
    sb = get_supabase()
    q = sb.table("fin_faturamentos").select("*, pacientes(nome), procedimentos(nome)").order("created_at", desc=True)
    if status_filtro:
        q = q.eq("status", status_filtro)
    return q.execute().data

@router.get("/resumo-clientes")
def listar_resumo_clientes():
    sb = get_supabase()
    # Pega pacientes list
    pacientes_res = sb.table("pacientes").select("id, nome, cpf, telefone").order("nome").execute()
    pacientes = pacientes_res.data

    # Pega faturamentos globais com transações
    fat_res = sb.table("fin_faturamentos").select("paciente_id, valor_final, status, agendamento_id, fin_transacoes(valor, status, descricao)").execute()
    faturamentos = fat_res.data
    
    # Pega todos os agendamentos com procedimentos para calcular o que falta faturar
    agends_query = sb.table("agendamentos").select("id, paciente_id, status, agendamento_procedimentos(procedimentos(valor_padrao))").in_("status", ["agendado", "confirmado", "em_atendimento", "concluido"]).execute()
    agendamentos = agends_query.data
    agendamentos_faturados_ids = [f["agendamento_id"] for f in faturamentos if f.get("agendamento_id")]
    
    resumo = []
    for p in pacientes:
        fat_paciente = [f for f in faturamentos if f["paciente_id"] == p["id"] and f["status"] != "CANCELADO"]
        total_pendente = 0
        total_faturado = 0
        for f in fat_paciente:
            txs = f.get("fin_transacoes", []) or []
            
            pago = sum(t["valor"] for t in txs if t["status"] == "PAGO" and "Taxa de Operadora" not in (t.get("descricao") or ""))
            pend = sum(t["valor"] for t in txs if t["status"] == "PENDENTE" and "Taxa de Operadora" not in (t.get("descricao") or ""))
            
            if txs:
                f["valor_final"] = pago + pend
                
            total_pendente += pend
            total_faturado += f["valor_final"]
        
        # Calcula total a faturar baseado em agendamentos não faturados
        a_faturar_pac = [a for a in agendamentos if a["paciente_id"] == p["id"] and a["id"] not in agendamentos_faturados_ids]
        total_a_faturar = 0
        for ag in a_faturar_pac:
            for ap in ag.get("agendamento_procedimentos", []) or []:
                if ap and ap.get("procedimentos") and ap["procedimentos"].get("valor_padrao"):
                    total_a_faturar += ap["procedimentos"]["valor_padrao"]

        status_financeiro = "EM_DIA"
        if total_pendente > 0:
            status_financeiro = "PENDENTE"
        elif total_a_faturar > 0:
            status_financeiro = "A_FATURAR"
            
        resumo.append({
            "paciente_id": p["id"],
            "nome": p["nome"],
            "cpf": p["cpf"],
            "telefone": p["telefone"],
            "total_faturado": total_faturado,
            "total_pendente": total_pendente,
            "total_a_faturar": total_a_faturar,
            "qtd_faturamentos": len(fat_paciente),
            "status_financeiro": status_financeiro
        })
        
    return resumo

@router.get("/cliente/{paciente_id}")
def detalhes_financeiros_cliente(paciente_id: str):
    sb = get_supabase()
    
    # 1. Busca Faturamentos Existentes do Paciente
    fats_res = sb.table("fin_faturamentos").select("*, procedimentos(nome), fin_transacoes(valor, status, descricao)").eq("paciente_id", paciente_id).order("created_at", desc=True).execute()
    faturamentos = fats_res.data
    
    for fat in faturamentos:
        txs = fat.get("fin_transacoes", []) or []
        valor_pago = sum(t["valor"] for t in txs if t["status"] == "PAGO" and "Taxa de Operadora" not in (t.get("descricao") or ""))
        valor_pendente = sum(t["valor"] for t in txs if t["status"] == "PENDENTE" and "Taxa de Operadora" not in (t.get("descricao") or ""))
        fat["valor_pago"] = valor_pago
        fat["saldo_devedor"] = valor_pendente
        
        if txs:
            fat["valor_final"] = valor_pago + valor_pendente
            
        fat.pop("fin_transacoes", None)
    
    # 2. Busca Procedimentos a Faturar (Agendamentos concluidos sem Faturamento)
    agendamentos_faturados_ids = [f["agendamento_id"] for f in faturamentos if f.get("agendamento_id")]
    
    agends_query = sb.table("agendamentos").select("id, data_hora, duracao_minutos, observacoes, dentistas(nome), agendamento_procedimentos(procedimentos(id, nome, valor_padrao))").eq("paciente_id", paciente_id).in_("status", ["agendado", "confirmado", "em_atendimento", "concluido"]).execute()
    agendamentos_concluidos = agends_query.data
    
    a_faturar = [a for a in agendamentos_concluidos if a["id"] not in agendamentos_faturados_ids]
    
    return {
        "faturamentos": faturamentos,
        "a_faturar": a_faturar
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_faturamento(dados: FaturamentoCreate):
    try:
        sb = get_supabase()
        payload = dados.model_dump(exclude_none=True)
        
        # Helper fields to pop
        payload.pop("procedimento_id", None)
        payload.pop("procedimentos_ids", None)
        payload.pop("valor_entrada", None)
        payload.pop("taxa_porcentagem_entrada", None)
        payload.pop("taxa_valor_entrada", None)
        payload.pop("data_vencimento_primeira", None)
        payload.pop("numero_parcelas", None)
        
        # 1. Cria o Faturamento (Contrato Macro)
        fat_res = sb.table("fin_faturamentos").insert(payload).execute()
        if not fat_res.data:
            raise HTTPException(status_code=400, detail="Erro ao criar faturamento")
        
        faturamento_criado = fat_res.data[0]
        fat_id = faturamento_criado["id"]
        
        # 1.1 Cria o vínculo com Tratamento Clínico
        tratamento_payload = {
            "paciente_id": dados.paciente_id,
            "procedimento_id": dados.procedimento_id,
            "procedimentos_ids": dados.procedimentos_ids,
            "faturamento_id": fat_id,
            "status": "EM_ANDAMENTO",
            "observacoes": f"Tratamento gerado a partir do Orçamento: {dados.descricao}"
        }
        sb.table("clin_tratamentos").insert(tratamento_payload).execute()
        
        # 1.1 Cálculos da Entrada
        valor_entrada = dados.valor_entrada if dados.valor_entrada else 0.0
        valor_parcelar = dados.valor_final - valor_entrada
        numero_parcelas = dados.numero_parcelas if dados.numero_parcelas > 0 else 1
        valor_parcela = round(valor_parcelar / numero_parcelas, 2)
        
        # Pegar Categoria ID Receita Clínica Omissa
        cat_res = sb.table("fin_categorias").select("id").eq("nome", "Atendimento Clínico").execute()
        categoria_receita_id = cat_res.data[0]["id"] if cat_res.data else 1
    
        # 2. Cria as Parcelas
        transacoes = []
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        hoje = datetime.now()
        
        if valor_entrada > 0:
            transacoes.append({
                "categoria_id": categoria_receita_id,
                "faturamento_id": fat_id,
                "descricao": f"Entrada (À Vista) - {dados.descricao}",
                "valor": valor_entrada,
                "taxa_porcentagem": dados.taxa_porcentagem_entrada,
                "taxa_valor": dados.taxa_valor_entrada,
                "data_vencimento": hoje.date().isoformat(),
                "data_pagamento": hoje.date().isoformat(),
                "conta_destino": "CLINICA",
                "status": "PAGO",
                "metodo_pagamento": dados.metodo_pagamento
            })
            
            # Se teve taxa na operadora, gerar a despesa correspondente (igual ao 'Dar Baixa')
            if dados.taxa_valor_entrada and dados.taxa_valor_entrada > 0:
                cat_taxa_res = sb.table("fin_categorias").select("id").eq("nome", "Taxa de Operadora").execute()
                if cat_taxa_res.data:
                    cat_taxa_id = cat_taxa_res.data[0]["id"]
                else:
                    nova_cat = sb.table("fin_categorias").insert({"nome": "Taxa de Operadora", "tipo": "DESPESA", "escopo": "CLINICA", "ativo": True}).execute()
                    cat_taxa_id = nova_cat.data[0]["id"] if nova_cat.data else None
                    
                if cat_taxa_id:
                    sb.table("fin_transacoes").insert({
                        "categoria_id": cat_taxa_id,
                        "faturamento_id": fat_id,
                        "descricao": f"Taxa de Operadora ({dados.metodo_pagamento}) — Entrada",
                        "valor": round(dados.taxa_valor_entrada, 2),
                        "data_vencimento": hoje.date().isoformat(),
                        "data_pagamento": hoje.date().isoformat(),
                        "conta_origem": "CLINICA",
                        "status": "PAGO",
                        "metodo_pagamento": dados.metodo_pagamento,
                    }).execute()
            
        if dados.data_vencimento_primeira:
            data_base = datetime.fromisoformat(str(dados.data_vencimento_primeira))
        else:
            data_base = hoje if numero_parcelas == 1 else (hoje + relativedelta(months=1))
            
        if valor_parcelar > 0:
            for i in range(numero_parcelas):
                vencimento = (data_base + relativedelta(months=i)).date().isoformat()
                estado_pagamento = "PENDENTE"
                data_pag = None
    
                transacoes.append({
                    "categoria_id": categoria_receita_id,
                    "faturamento_id": fat_id,
                    "descricao": f"Parcela {i+1}/{numero_parcelas} - {dados.descricao}",
                    "valor": valor_parcela,
                    "data_vencimento": vencimento,
                    "data_pagamento": data_pag,
                    "conta_destino": "CLINICA" if estado_pagamento == "PAGO" else None,
                    "status": estado_pagamento
                })
    
        t_res = sb.table("fin_transacoes").insert(transacoes).execute()
        if not t_res.data:
             raise HTTPException(status_code=500, detail="Faturamento gerado, mas erro ao criar parcelas")
        
        if valor_parcelar == 0 and valor_entrada > 0:
            status_global = "QUITADO"
        elif valor_entrada > 0:
            status_global = "PAGO_PARCIAL"
        else:
            status_global = "ABERTO"  # Aceitando faturamento zerado/100% aberto
            
        sb.table("fin_faturamentos").update({"status": status_global}).eq("id", fat_id).execute()
        faturamento_criado["status"] = status_global
            
        if dados.agendamento_id:
            sb.table("agendamentos").update({"status": "concluido"}).eq("id", dados.agendamento_id).execute()
    
        return {"message": "Faturamento processado com sucesso", "faturamento": faturamento_criado, "parcelas_geradas": len(transacoes)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{faturamento_id}")
def setup_faturamento(faturamento_id: str, dados: FaturamentoCreate):
    sb = get_supabase()
    
    # 1. Update the existing Draft Macro Contract
    payload = dados.model_dump(exclude_none=True)
    fat_res = sb.table("fin_faturamentos").update(payload).eq("id", faturamento_id).execute()
    if not fat_res.data:
        raise HTTPException(status_code=404, detail="Faturamento rascunho não encontrado")
    
    faturamento_atualizado = fat_res.data[0]
    fat_id = faturamento_atualizado["id"]
    
    # 1.1 Cálculos da Entrada
    valor_entrada = dados.valor_entrada if dados.valor_entrada else 0.0
    valor_parcelar = dados.valor_final - valor_entrada
    numero_parcelas = dados.numero_parcelas if dados.numero_parcelas > 0 else 1
    valor_parcela = round(valor_parcelar / numero_parcelas, 2)
    
    # Clear any existing transactions just in case (safe-guard)
    sb.table("fin_transacoes").delete().eq("faturamento_id", fat_id).execute()
    
    cat_res = sb.table("fin_categorias").select("id").eq("nome", "Atendimento Clínico").execute()
    categoria_receita_id = cat_res.data[0]["id"] if cat_res.data else 1

    # 2. Re-create the Installments
    transacoes = []
    from datetime import datetime
    from dateutil.relativedelta import relativedelta
    hoje = datetime.now()
    
    # Se tem entrada, cria a transação de entrada como Parcela 0 (À Vista)
    if valor_entrada > 0:
        transacoes.append({
            "categoria_id": categoria_receita_id,
            "faturamento_id": fat_id,
            "descricao": f"Entrada (À Vista) - {dados.descricao}",
            "valor": valor_entrada,
            "data_vencimento": hoje.date().isoformat(),
            "data_pagamento": hoje.date().isoformat(),
            "conta_destino": "CLINICA",
            "status": "PAGO"
        })
    
    # Define a data base para os vencimentos do restante
    if dados.data_vencimento_primeira:
        data_base = datetime.fromisoformat(str(dados.data_vencimento_primeira))
    else:
        # Se não especificou, o primeiro vencimento cai pro mês que vem (ou hoje se for só 1 parcela)
        data_base = hoje if numero_parcelas == 1 else (hoje + relativedelta(months=1))
    
    # Se não houver saldo a parcelar (pagou tudo na entrada), a gente não gera parcelas extras.
    if valor_parcelar > 0:
        for i in range(numero_parcelas):
            vencimento = (data_base + relativedelta(months=i)).date().isoformat()
            
            estado_pagamento = "PENDENTE"
            data_pag = None

            transacoes.append({
                "categoria_id": categoria_receita_id,
                "faturamento_id": fat_id,
                "descricao": f"Parcela {i+1}/{numero_parcelas} - {dados.descricao}",
                "valor": valor_parcela,
                "data_vencimento": vencimento,
                "data_pagamento": data_pag,
                "conta_destino": "CLINICA" if estado_pagamento == "PAGO" else None,
                "status": estado_pagamento
            })

    sb.table("fin_transacoes").insert(transacoes).execute()
    
    # Verifica o "overall status"
    if valor_parcelar == 0 and valor_entrada > 0:
        # Pagou 100% de entrada
        status_global = "QUITADO"
    elif valor_entrada > 0:
        # Deu entrada, mas parcelou o resto
        status_global = "PAGO_PARCIAL"
    else:
        status_global = "PENDENTE"

    sb.table("fin_faturamentos").update({"status": status_global}).eq("id", fat_id).execute()
    faturamento_atualizado["status"] = status_global
        
    if dados.agendamento_id:
        sb.table("agendamentos").update({"status": "concluido"}).eq("id", dados.agendamento_id).execute()

    return {"message": "Setup de faturamento concluído", "faturamento": faturamento_atualizado}
