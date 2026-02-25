"""
Rotas da API - Agendamentos
"""
from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from pydantic import BaseModel
from backend.config.supabase_client import get_supabase

router = APIRouter()


class AgendamentoBase(BaseModel):
    paciente_id: str
    dentista_id: str
    data_hora: datetime
    duracao_minutos: int = 60
    status: str = "agendado"
    observacoes: str | None = None


class AgendamentoCreate(AgendamentoBase):
    pass


class AgendamentoUpdate(BaseModel):
    data_hora: datetime | None = None
    duracao_minutos: int | None = None
    status: str | None = None
    observacoes: str | None = None


@router.get("/")
def listar_agendamentos(
    dentista_id: str | None = None,
    paciente_id: str | None = None,
    status_filtro: str | None = None
):
    sb = get_supabase()
    q = sb.table("agendamentos").select("*, pacientes(nome), dentistas(nome)").order("data_hora", desc=True)
    if dentista_id:
        q = q.eq("dentista_id", dentista_id)
    if paciente_id:
        q = q.eq("paciente_id", paciente_id)
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
    dados = agendamento_data.model_dump(exclude_none=True)
    dados["data_hora"] = dados["data_hora"].isoformat()
    r = sb.table("agendamentos").insert(dados).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar agendamento")
    return r.data[0]


@router.put("/{agendamento_id}")
def atualizar_agendamento(agendamento_id: str, agendamento_data: AgendamentoUpdate):
    sb = get_supabase()
    dados = agendamento_data.model_dump(exclude_unset=True)
    if "data_hora" in dados and dados["data_hora"]:
        dados["data_hora"] = dados["data_hora"].isoformat()
    r = sb.table("agendamentos").update(dados).eq("id", agendamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")
    return r.data[0]


@router.delete("/{agendamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_agendamento(agendamento_id: str):
    sb = get_supabase()
    r = sb.table("agendamentos").update({"status": "cancelado"}).eq("id", agendamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento nao encontrado")
    return None
