"""
Rotas da API - Procedimentos
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from backend.config.supabase_client import get_supabase

router = APIRouter()


class ProcedimentoBase(BaseModel):
    nome: str
    descricao: str | None = None
    valor_padrao: float
    duracao_minutos: int = 60
    ativo: bool = True


class ProcedimentoCreate(ProcedimentoBase):
    pass


class ProcedimentoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    valor_padrao: float | None = None
    duracao_minutos: int | None = None
    ativo: bool | None = None


@router.get("/")
def listar_procedimentos(ativo: bool | None = None):
    sb = get_supabase()
    q = sb.table("procedimentos").select("*").order("nome")
    if ativo is not None:
        q = q.eq("ativo", ativo)
    return q.execute().data


@router.get("/{procedimento_id}")
def obter_procedimento(procedimento_id: str):
    sb = get_supabase()
    r = sb.table("procedimentos").select("*").eq("id", procedimento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedimento nao encontrado")
    return r.data[0]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_procedimento(procedimento_data: ProcedimentoCreate):
    sb = get_supabase()
    dados = procedimento_data.model_dump(exclude_none=True)
    r = sb.table("procedimentos").insert(dados).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar procedimento")
    return r.data[0]


@router.put("/{procedimento_id}")
def atualizar_procedimento(procedimento_id: str, procedimento_data: ProcedimentoUpdate):
    sb = get_supabase()
    dados = procedimento_data.model_dump(exclude_unset=True)
    r = sb.table("procedimentos").update(dados).eq("id", procedimento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedimento nao encontrado")
    return r.data[0]


@router.delete("/{procedimento_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_procedimento(procedimento_id: str):
    sb = get_supabase()
    r = sb.table("procedimentos").delete().eq("id", procedimento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Procedimento nao encontrado")
    return None
