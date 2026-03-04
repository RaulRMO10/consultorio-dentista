"""
Rotas da API - Configurações Financeiras (Formas de Pagamento, etc)
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

from backend.config.supabase_client import get_supabase

router = APIRouter()


class FormaPagamentoBase(BaseModel):
    nome: str
    tipo: str
    taxa_padrao_porcentagem: float = 0.0
    dias_repasse: int = 0
    ativo: bool = True


class FormaPagamentoCreate(FormaPagamentoBase):
    pass


class FormaPagamentoUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    taxa_padrao_porcentagem: Optional[float] = None
    dias_repasse: Optional[int] = None
    ativo: Optional[bool] = None


@router.get("/formas-pagamento")
def listar_formas_pagamento(ativo: Optional[bool] = None):
    sb = get_supabase()
    q = sb.table("fin_formas_pagamento").select("*").order("nome")
    if ativo is not None:
        q = q.eq("ativo", ativo)
    return q.execute().data


@router.post("/formas-pagamento", status_code=status.HTTP_201_CREATED)
def criar_forma_pagamento(dados: FormaPagamentoCreate):
    sb = get_supabase()
    r = sb.table("fin_formas_pagamento").insert(dados.model_dump()).execute()
    if not r.data:
        raise HTTPException(status_code=400, detail="Erro ao criar forma de pagamento")
    return r.data[0]


@router.put("/formas-pagamento/{id}")
def atualizar_forma_pagamento(id: str, dados: FormaPagamentoUpdate):
    sb = get_supabase()
    r = sb.table("fin_formas_pagamento").update(dados.model_dump(exclude_unset=True)).eq("id", id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Forma de pagamento não encontrada")
    return r.data[0]


@router.delete("/formas-pagamento/{id}", status_code=status.HTTP_204_NO_CONTENT)
def inativar_forma_pagamento(id: str):
    sb = get_supabase()
    r = sb.table("fin_formas_pagamento").update({"ativo": False}).eq("id", id).execute()
    if not r.data:
         raise HTTPException(status_code=404, detail="Forma de pagamento não encontrada")
    return None
