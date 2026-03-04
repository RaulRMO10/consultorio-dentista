"""
Rotas da API - Tratamentos Clínicos (Prontuário)
"""
from fastapi import APIRouter, HTTPException, status
from typing import Optional
from pydantic import BaseModel
from backend.config.supabase_client import get_supabase

router = APIRouter()

class ClinTratamentoBase(BaseModel):
    paciente_id: str
    procedimento_id: Optional[str] = None
    procedimentos_ids: Optional[list[str]] = None
    procedimentos_concluidos_ids: Optional[list[str]] = []
    dentista_id: Optional[str] = None
    faturamento_id: Optional[str] = None
    status: str = "EM_ANDAMENTO"
    observacoes: Optional[str] = None

class ClinTratamentoCreate(ClinTratamentoBase):
    pass

class ClinTratamentoUpdate(BaseModel):
    status: Optional[str] = None
    observacoes: Optional[str] = None
    procedimentos_concluidos_ids: Optional[list[str]] = None

@router.get("/")
def listar_tratamentos(paciente_id: Optional[str] = None, status_filtro: Optional[str] = None):
    sb = get_supabase()
    q = sb.table("clin_tratamentos").select("*, pacientes(nome), procedimentos(nome, valor_padrao), dentistas(nome)").order("created_at", desc=True)
    if paciente_id:
        q = q.eq("paciente_id", paciente_id)
    if status_filtro:
        q = q.eq("status", status_filtro)
    return q.execute().data

@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_tratamento(tratamento_data: ClinTratamentoCreate):
    sb = get_supabase()
    dados = tratamento_data.model_dump(exclude_none=True)
    r = sb.table("clin_tratamentos").insert(dados).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar tratamento clínico")
    return r.data[0]

@router.put("/{tratamento_id}")
def atualizar_tratamento(tratamento_id: str, tratamento_data: ClinTratamentoUpdate):
    sb = get_supabase()
    dados = tratamento_data.model_dump(exclude_unset=True)
    r = sb.table("clin_tratamentos").update(dados).eq("id", tratamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tratamento nao encontrado")
    return r.data[0]
