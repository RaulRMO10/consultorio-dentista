"""
Rotas da API - Agendamentos
"""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel
from backend.config.supabase_client import get_supabase

router = APIRouter()

def _verificar_conflito(dentista_id: str, new_start_dt: datetime, duracao: int, exclude_id: str | None = None) -> bool:
    sb = get_supabase()
    
    # Define os limites do dia para otimizar a busca
    st_day = new_start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    en_day = st_day + timedelta(days=1)
    
    res = sb.table("agendamentos").select("id, data_hora, duracao_minutos, status").eq("dentista_id", dentista_id).gte("data_hora", st_day.isoformat()).lt("data_hora", en_day.isoformat()).execute()
    
    if not res.data:
        return False
        
    new_end_dt = new_start_dt + timedelta(minutes=duracao)
    
    for ag in res.data:
        if exclude_id and ag["id"] == exclude_id:
            continue
        if ag.get("status") in ["cancelado", "falta"]:
            continue
            
        ag_dt_str = ag["data_hora"]
        if ag_dt_str.endswith("Z"):
            ag_dt_str = ag_dt_str[:-1] + "+00:00"
        
        try:
            ag_start_dt = datetime.fromisoformat(ag_dt_str)
        except Exception:
            continue
            
        # Comparar com ou sem timezone de forma segura
        if ag_start_dt.tzinfo and not new_start_dt.tzinfo:
            new_start_dt = new_start_dt.replace(tzinfo=ag_start_dt.tzinfo)
        elif new_start_dt.tzinfo and not ag_start_dt.tzinfo:
            ag_start_dt = ag_start_dt.replace(tzinfo=new_start_dt.tzinfo)
            
        ag_end_dt = ag_start_dt + timedelta(minutes=ag["duracao_minutos"])
        
        # logica de sobreposicao (start1 < end2) e (start2 < end1)
        if ag_start_dt < new_end_dt and new_start_dt < ag_end_dt:
            return True
            
    return False


class AgendamentoBase(BaseModel):
    paciente_id: str
    dentista_id: str
    clin_tratamento_id: str | None = None
    procedimentos_ids: list[str] = []
    data_hora: datetime
    duracao_minutos: int = 60
    status: str = "agendado"
    observacoes: str | None = None


class AgendamentoCreate(AgendamentoBase):
    pass


class AgendamentoUpdate(BaseModel):
    data_hora: datetime | None = None
    duracao_minutos: int | None = None
    clin_tratamento_id: str | None = None
    procedimentos_ids: list[str] | None = None
    status: str | None = None
    observacoes: str | None = None


@router.get("/")
def listar_agendamentos(
    dentista_id: str | None = None,
    paciente_id: str | None = None,
    clin_tratamento_id: str | None = None,
    status_filtro: str | None = None
):
    sb = get_supabase()
    q = sb.table("agendamentos").select("*, pacientes(nome, telefone), dentistas(nome), fin_faturamentos(id), clin_tratamentos(status, observacoes), agendamento_procedimentos(status, procedimentos(id, nome, valor_padrao, duracao_minutos))").order("data_hora", desc=True)
    if dentista_id:
        q = q.eq("dentista_id", dentista_id)
    if paciente_id:
        q = q.eq("paciente_id", paciente_id)
    if clin_tratamento_id:
        q = q.eq("clin_tratamento_id", clin_tratamento_id)
    if status_filtro:
        q = q.eq("status", status_filtro)
    return q.execute().data


@router.get("/{agendamento_id}")
def obter_agendamento(agendamento_id: str):
    sb = get_supabase()
    r = sb.table("agendamentos").select("*, pacientes(nome), dentistas(nome)").eq("id", agendamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")
    return r.data[0]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_agendamento(agendamento_data: AgendamentoCreate):
    sb = get_supabase()
    dados = agendamento_data.model_dump()
    procedimentos_ids = dados.pop("procedimentos_ids", [])
    
    dentista_id = dados.get("dentista_id")
    duracao = dados.get("duracao_minutos", 60)
    start_dt = agendamento_data.data_hora
    
    if _verificar_conflito(dentista_id, start_dt, duracao):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe um agendamento neste horário para este profissional.")

    # Validar horário no passado (com tolerância de 1 slot de 15 minutos)
    # Regra: se data_hora + 15min < agora, o slot já encerrou e não pode ser agendado
    agora = datetime.now(timezone.utc)
    data_hora_utc = agendamento_data.data_hora
    if data_hora_utc.tzinfo is None:
        data_hora_utc = data_hora_utc.replace(tzinfo=timezone.utc)
    if data_hora_utc + timedelta(minutes=15) < agora:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível agendar para um horário que já passou. O slot de 15 minutos encerrou."
        )

    
    # Remove empty strings to prevent postgres malformed UUID errors
    if dados.get("clin_tratamento_id") == "":
        dados["clin_tratamento_id"] = None
        
    # Removendo None values
    dados = {k: v for k, v in dados.items() if v is not None}
    
    if hasattr(agendamento_data.data_hora, "isoformat"):
        dados["data_hora"] = agendamento_data.data_hora.isoformat()
    elif isinstance(dados.get("data_hora"), str):
        pass # already string
    
    try:
        # Insere o agendamento
        r = sb.table("agendamentos").insert(dados).execute()
        if not r.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar agendamento. Nenhuma linha retornada.")
        
        agendamento_criado = r.data[0]
                
        # Insert M:N procedures
        if procedimentos_ids:
            rel_data = [{"agendamento_id": agendamento_criado["id"], "procedimento_id": pid} for pid in procedimentos_ids if pid]
            if rel_data:
                sb.table("agendamento_procedimentos").insert(rel_data).execute()
                
        return agendamento_criado
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erro no banco: {str(e)}")


@router.put("/{agendamento_id}")
def atualizar_agendamento(agendamento_id: str, agendamento_data: AgendamentoUpdate):
    sb = get_supabase()
    
    # Verifica estado atual para obter dados não modificados e também validar existência
    curr_res = sb.table("agendamentos").select("*").eq("id", agendamento_id).execute()
    if not curr_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")
    curr_ag = curr_res.data[0]

    dados = agendamento_data.model_dump(exclude_unset=True)
    procedimentos_ids = dados.pop("procedimentos_ids", None)
    
    # Validar sobreposição caso alterem data, duração, dentista ou reativem (status)
    if any(k in dados for k in ["data_hora", "duracao_minutos", "dentista_id", "status"]):
        dentista_id = dados.get("dentista_id", curr_ag.get("dentista_id"))
        duracao = dados.get("duracao_minutos", curr_ag.get("duracao_minutos"))
        
        if "data_hora" in dados and agendamento_data.data_hora is not None:
            start_dt = agendamento_data.data_hora
        else:
            dt_str = curr_ag.get("data_hora")
            if dt_str.endswith("Z"): dt_str = dt_str[:-1] + "+00:00"
            start_dt = datetime.fromisoformat(dt_str)

        # Se não for cancelar, tem que testar
        novo_status = dados.get("status", curr_ag.get("status"))
        if novo_status not in ["cancelado", "falta"]:
            if _verificar_conflito(dentista_id, start_dt, duracao, exclude_id=agendamento_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O novo horário entra em conflito com um agendamento existente para este profissional.")
    
    # Remove empty strings to prevent postgres malformed UUID errors
    if dados.get("clin_tratamento_id") == "":
        dados["clin_tratamento_id"] = None

    # Remove None values manually here to avoid overwriting existing data with Null if unintended,
    # except when the user actually wants to unlink the procedure/treatment.
    # Actually, if the frontend sends `""`, they intend to unlink it. We SHOULD send None to supabase.
    # Exclude unset handles omitted fields, but if it's there as `""`, we mapped it to `None`, 
    # and Supabase perfectly unlinks the UUID if `None` is passed.
        
    if "data_hora" in dados and dados["data_hora"]:
        dados["data_hora"] = dados["data_hora"].isoformat()
    try:
        r = sb.table("agendamentos").update(dados).eq("id", agendamento_id).execute()
        if not r.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")
            
        # Update M:N procedures
        if procedimentos_ids is not None:
            sb.table("agendamento_procedimentos").delete().eq("agendamento_id", agendamento_id).execute()
            if procedimentos_ids:
                rel_data = [{"agendamento_id": agendamento_id, "procedimento_id": pid} for pid in procedimentos_ids if pid]
                if rel_data:
                    sb.table("agendamento_procedimentos").insert(rel_data).execute()
                    
        return r.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erro no banco: {str(e)}")


@router.delete("/{agendamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_agendamento(agendamento_id: str):
    sb = get_supabase()
    
    # Busca o agendamento atual com faturamentos
    curr = sb.table("agendamentos").select("id, status, fin_faturamentos!left(id)").eq("id", agendamento_id).execute()
    if not curr.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado")
    
    ag = curr.data[0]
    
    # Bloquear cancelamento de consultas já realizadas ou em curso
    STATUS_PROTEGIDOS = ["concluido", "em_atendimento"]
    if ag.get("status") in STATUS_PROTEGIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível cancelar uma consulta com status '{ag['status']}'. Consultas realizadas ou em andamento não podem ser removidas."
        )
    
    # Bloquear se tiver faturamentos vinculados
    faturamentos = ag.get("fin_faturamentos") or []
    if len(faturamentos) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível cancelar esta consulta pois ela possui faturamentos vinculados."
        )
    
    # Soft-delete: marca como cancelado
    r = sb.table("agendamentos").update({"status": "cancelado"}).eq("id", agendamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado")
    return None

class AgendamentoProcedimentoStatusUpdate(BaseModel):
    status: str

@router.patch("/{agendamento_id}/procedimentos/{procedimento_id}/status")
def atualizar_status_procedimento(agendamento_id: str, procedimento_id: str, req: AgendamentoProcedimentoStatusUpdate):
    sb = get_supabase()
    r = sb.table("agendamento_procedimentos")\
        .update({"status": req.status})\
        .eq("agendamento_id", agendamento_id)\
        .eq("procedimento_id", procedimento_id)\
        .execute()
    
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relação Agendamento-Procedimento nao encontrada")
        
    # Sincroniza o array de conclusões no clin_tratamentos pai
    agend_res = sb.table("agendamentos").select("clin_tratamento_id").eq("id", agendamento_id).execute()
    if agend_res.data and agend_res.data[0].get("clin_tratamento_id"):
        trat_id = agend_res.data[0]["clin_tratamento_id"]
        trat_res = sb.table("clin_tratamentos").select("procedimentos_concluidos_ids").eq("id", trat_id).execute()
        if trat_res.data:
            atual_arr = trat_res.data[0].get("procedimentos_concluidos_ids") or []
            if req.status == "CONCLUIDO":
                if procedimento_id not in atual_arr:
                    atual_arr.append(procedimento_id)
            else:
                if procedimento_id in atual_arr:
                    atual_arr.remove(procedimento_id)
            sb.table("clin_tratamentos").update({"procedimentos_concluidos_ids": atual_arr}).eq("id", trat_id).execute()
    
    return r.data[0]
