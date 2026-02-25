"""
Rotas da API - Pacientes
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from pydantic import BaseModel
from datetime import date

from backend.config.supabase_client import get_supabase

router = APIRouter()


# Schemas Pydantic
class PacienteBase(BaseModel):
    nome: str
    cpf: str | None = None
    data_nascimento: date | None = None
    telefone: str
    celular: str | None = None
    email: str | None = None
    endereco: str | None = None
    cidade: str | None = None
    estado: str | None = None
    cep: str | None = None
    observacoes: str | None = None
    ativo: bool = True


class PacienteCreate(PacienteBase):
    pass


class PacienteUpdate(BaseModel):
    nome: str | None = None
    cpf: str | None = None
    data_nascimento: date | None = None
    telefone: str | None = None
    celular: str | None = None
    email: str | None = None
    endereco: str | None = None
    cidade: str | None = None
    estado: str | None = None
    cep: str | None = None
    observacoes: str | None = None
    ativo: bool | None = None


@router.get("/")
def listar_pacientes(ativo: bool | None = None):
    """Lista todos os pacientes"""
    sb = get_supabase()
    query = sb.table('pacientes').select('*').order('nome')
    if ativo is not None:
        query = query.eq('ativo', ativo)
    result = query.execute()
    return result.data


@router.get("/{paciente_id}")
def obter_paciente(paciente_id: str):
    """Obtém um paciente específico"""
    sb = get_supabase()
    result = sb.table('pacientes').select('*').eq('id', paciente_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")
    return result.data[0]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_paciente(paciente_data: PacienteCreate):
    """Cria um novo paciente"""
    sb = get_supabase()
    dados = paciente_data.model_dump(exclude_none=True)
    if 'data_nascimento' in dados and dados['data_nascimento']:
        dados['data_nascimento'] = str(dados['data_nascimento'])
    result = sb.table('pacientes').insert(dados).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar paciente")
    return result.data[0]


@router.put("/{paciente_id}")
def atualizar_paciente(paciente_id: str, paciente_data: PacienteUpdate):
    """Atualiza um paciente"""
    sb = get_supabase()
    dados = paciente_data.model_dump(exclude_unset=True)
    if 'data_nascimento' in dados and dados['data_nascimento']:
        dados['data_nascimento'] = str(dados['data_nascimento'])
    result = sb.table('pacientes').update(dados).eq('id', paciente_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")
    return result.data[0]


@router.delete("/{paciente_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_paciente(paciente_id: str):
    """Soft delete - marca como inativo"""
    sb = get_supabase()
    result = sb.table('pacientes').update({'ativo': False}).eq('id', paciente_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente não encontrado")
    return None
