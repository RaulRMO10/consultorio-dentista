"""
Rotas da API - Dentistas
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from backend.config.supabase_client import get_supabase

router = APIRouter()


class DentistaBase(BaseModel):
    nome: str
    cro: str
    especialidade: str | None = None
    telefone: str | None = None
    email: str | None = None
    ativo: bool = True


class DentistaCreate(DentistaBase):
    pass


class DentistaUpdate(BaseModel):
    nome: str | None = None
    cro: str | None = None
    especialidade: str | None = None
    telefone: str | None = None
    email: str | None = None
    ativo: bool | None = None


@router.get("/")
def listar_dentistas(ativo: bool | None = None):
    """Lista todos os dentistas"""
    sb = get_supabase()
    query = sb.table('dentistas').select('*').order('nome')
    if ativo is not None:
        query = query.eq('ativo', ativo)
    result = query.execute()
    return result.data


@router.get("/{dentista_id}")
def obter_dentista(dentista_id: str):
    """Obtém um dentista específico"""
    sb = get_supabase()
    result = sb.table('dentistas').select('*').eq('id', dentista_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentista não encontrado")
    return result.data[0]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_dentista(dentista_data: DentistaCreate):
    """Cria um novo dentista"""
    sb = get_supabase()
    dados = dentista_data.model_dump(exclude_none=True)
    result = sb.table('dentistas').insert(dados).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar dentista")
    return result.data[0]


@router.put("/{dentista_id}")
def atualizar_dentista(dentista_id: str, dentista_data: DentistaUpdate):
    """Atualiza um dentista"""
    sb = get_supabase()
    dados = dentista_data.model_dump(exclude_unset=True)
    result = sb.table('dentistas').update(dados).eq('id', dentista_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentista não encontrado")
    return result.data[0]


@router.delete("/{dentista_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_dentista(dentista_id: str):
    """Hard delete com verificação de histórico (bloqueio de integridade)"""
    sb = get_supabase()
    
    # 1. Checa se o dentista tem histórico de agendamentos
    agendamentos = sb.table('agendamentos').select('id', count='exact').eq('dentista_id', dentista_id).execute()
    if agendamentos.count and agendamentos.count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Não é possível excluir este Dr(a) pois possui histórico de agendamentos atrelados em seu nome. Em vez de excluir, inative o cadastro (através da edição)."
        )

    # 2. Hard Delete
    result = sb.table('dentistas').delete().eq('id', dentista_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dentista não encontrado")
    return None
