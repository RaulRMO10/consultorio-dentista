"""
Rotas da API - Financeiro Pessoal
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import date
from typing import Optional

from backend.config.supabase_client import get_supabase

router = APIRouter()

CATEGORIAS_RECEITA = [
    "Salario", "Pro-labore", "Dividendos", "Freelance", "Investimentos", "Outros"
]
CATEGORIAS_DESPESA = [
    "Moradia", "Alimentacao", "Transporte", "Saude", "Educacao",
    "Lazer", "Vestuario", "Financiamentos", "Seguros", "Outros"
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


class MetaBase(BaseModel):
    categoria: str
    valor_meta: float
    mes: int
    ano: int


@router.get("/categorias")
def listar_categorias():
    return {"receita": CATEGORIAS_RECEITA, "despesa": CATEGORIAS_DESPESA}


@router.get("/resumo")
def resumo_financeiro(mes: Optional[int] = None, ano: Optional[int] = None):
    sb = get_supabase()
    ano = ano or date.today().year
    mes = mes or date.today().month
    prox_mes, prox_ano = _proximo_mes(mes, ano)
    lanc = (
        sb.table("lancamentos_pessoal").select("tipo, valor, categoria")
        .gte("data", f"{ano}-{mes:02d}-01")
        .lt("data", f"{prox_ano}-{prox_mes:02d}-01")
        .execute().data
    )
    metas = sb.table("metas_pessoal").select("*") \
        .eq("mes", mes).eq("ano", ano).execute().data
    receitas = sum(r["valor"] for r in lanc if r["tipo"] == "receita")
    despesas = sum(r["valor"] for r in lanc if r["tipo"] == "despesa")
    por_categoria = {}
    for r in lanc:
        if r["tipo"] == "despesa":
            por_categoria[r["categoria"]] = por_categoria.get(r["categoria"], 0) + r["valor"]
    comparativo = []
    for meta in metas:
        gasto = por_categoria.get(meta["categoria"], 0)
        comparativo.append({
            "categoria": meta["categoria"],
            "meta": meta["valor_meta"],
            "gasto": gasto,
            "saldo": meta["valor_meta"] - gasto,
            "percentual": round((gasto / meta["valor_meta"]) * 100, 1) if meta["valor_meta"] > 0 else 0
        })
    return {
        "mes": mes, "ano": ano,
        "receitas": receitas, "despesas": despesas,
        "saldo": receitas - despesas,
        "por_categoria": por_categoria, "metas": comparativo
    }


@router.get("/metas")
def listar_metas(mes: Optional[int] = None, ano: Optional[int] = None):
    sb = get_supabase()
    q = sb.table("metas_pessoal").select("*")
    if mes: q = q.eq("mes", mes)
    if ano: q = q.eq("ano", ano)
    return q.execute().data


@router.post("/metas", status_code=status.HTTP_201_CREATED)
def criar_meta(meta: MetaBase):
    sb = get_supabase()
    r = sb.table("metas_pessoal").upsert(meta.model_dump(), on_conflict="categoria,mes,ano").execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao salvar meta")
    return r.data[0]


@router.get("/")
def listar_lancamentos(
    tipo: Optional[str] = None,
    mes: Optional[int] = None,
    ano: Optional[int] = None
):
    sb = get_supabase()
    q = sb.table("lancamentos_pessoal").select("*").order("data", desc=True)
    if tipo: q = q.eq("tipo", tipo)
    if mes:
        _ano = ano or date.today().year
        prox_mes, prox_ano = _proximo_mes(mes, _ano)
        q = q.gte("data", f"{_ano}-{mes:02d}-01").lt("data", f"{prox_ano}-{prox_mes:02d}-01")
    return q.execute().data


@router.get("/{lancamento_id}")
def obter_lancamento(lancamento_id: str):
    sb = get_supabase()
    r = sb.table("lancamentos_pessoal").select("*").eq("id", lancamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lancamento nao encontrado")
    return r.data[0]


@router.post("/", status_code=status.HTTP_201_CREATED)
def criar_lancamento(dados: LancamentoCreate):
    sb = get_supabase()
    payload = dados.model_dump(exclude_none=True)
    payload["data"] = str(payload["data"])
    r = sb.table("lancamentos_pessoal").insert(payload).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erro ao criar lancamento")
    return r.data[0]


@router.put("/{lancamento_id}")
def atualizar_lancamento(lancamento_id: str, dados: LancamentoUpdate):
    sb = get_supabase()
    payload = dados.model_dump(exclude_unset=True)
    if "data" in payload and payload["data"]:
        payload["data"] = str(payload["data"])
    r = sb.table("lancamentos_pessoal").update(payload).eq("id", lancamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lancamento nao encontrado")
    return r.data[0]


@router.delete("/{lancamento_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_lancamento(lancamento_id: str):
    sb = get_supabase()
    r = sb.table("lancamentos_pessoal").delete().eq("id", lancamento_id).execute()
    if not r.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lancamento nao encontrado")
    return None
