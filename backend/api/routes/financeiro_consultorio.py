"""
Rotas da API - Financeiro Consultorio
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import date
from typing import Optional

from backend.config.supabase_client import get_supabase

router = APIRouter()

CATEGORIAS_RECEITA = [
    "Procedimento Odontologico", "Consulta", "Convenio", "Particular", "Outros"
]
CATEGORIAS_DESPESA = [
    "Aluguel", "Materiais Odontologicos", "Equipamentos", "Funcionarios",
    "Energia/Agua/Internet", "Marketing", "Contabilidade", "Manutencao", "Outros"
]


def _proximo_mes(mes: int, ano: int):
    if mes == 12:
        return 1, ano + 1
    return mes + 1, ano


class LancamentoBase(BaseModel):
    tipo: str
    descricao: str
    valor: float
    data: date
    categoria: str
    agendamento_id: Optional[str] = None
    observacoes: Optional[str] = None


class LancamentoCreate(LancamentoBase):
    pass


class LancamentoUpdate(BaseModel):
    tipo: Optional[str] = None
    descricao: Optional[str] = None
    valor: Optional[float] = None
    data: Optional[date] = None
    categoria: Optional[str] = None
    observacoes: Optional[str] = None


@router.get("/categorias")
def listar_categorias():
    return {"receita": CATEGORIAS_RECEITA, "despesa": CATEGORIAS_DESPESA}


@router.get("/resumo")
def resumo_financeiro(mes: Optional[int] = None, ano: Optional[int] = None):
    sb = get_supabase()
    ano = ano or date.today().year
    mes = mes or date.today().month
    q = sb.table("lancamentos_consultorio").select("tipo, valor")
    prox_mes, prox_ano = _proximo_mes(mes, ano)
    q = q.gte("data", f"{ano}-{mes:02d}-01").lt("data", f"{prox_ano}-{prox_mes:02d}-01")
    result = q.execute()
    receitas = sum(r["valor"] for r in result.data if r["tipo"] == "receita")
    despesas = sum(r["valor"] for r in result.data if r["tipo"] == "despesa")
    return {"mes": mes, "ano": ano, "receitas": receitas, "despesas": despesas, "saldo": receitas - despesas}


@router.get("/")
def listar_lancamentos(
    tipo: Optional[str] = None,
    mes: Optional[int] = None,
    ano: Optional[int] = None
):
    sb = get_supabase()
    q = sb.table("lancamentos_consultorio").select("*").order("data", desc=True)
    if tipo: q = q.eq("tipo", tipo)
    if mes:
        _ano = ano or date.today().year
        prox_mes, prox_ano = _proximo_mes(mes, _ano)
        q = q.gte("data", f"{_ano}-{mes:02d}-01").lt("data", f"{prox_ano}-{prox_mes:02d}-01")
    return q.execute().data


@router.get("/{lancamento_id}")
def obter_lancamento(lancamento_id: str):
    sb = get_supabase()
    r = sb.table("lancamentos_consultorio").select("*").eq("id", lancamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lancamento nao encontrado")
    return r.data[0]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_lancamento(dados: LancamentoCreate):
    sb = get_supabase()
    payload = dados.model_dump(exclude_none=True)
    payload["data"] = str(payload["data"])
    r = sb.table("lancamentos_consultorio").insert(payload).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar lancamento")
    return r.data[0]


@router.put("/{lancamento_id}")
def atualizar_lancamento(lancamento_id: str, dados: LancamentoUpdate):
    sb = get_supabase()
    payload = dados.model_dump(exclude_unset=True)
    if "data" in payload and payload["data"]:
        payload["data"] = str(payload["data"])
    r = sb.table("lancamentos_consultorio").update(payload).eq("id", lancamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lancamento nao encontrado")
    return r.data[0]


@router.delete("/{lancamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_lancamento(lancamento_id: str):
    sb = get_supabase()
    r = sb.table("lancamentos_consultorio").delete().eq("id", lancamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lancamento nao encontrado")
    return None
