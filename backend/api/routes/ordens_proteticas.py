from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.config.supabase_client import get_supabase

router = APIRouter()

COLUNAS_VALIDAS = ["PRE_ENVIO", "EM_LABORATORIO", "RETORNOU", "AGENDADO", "INSTALADO"]

class OrdemSchema(BaseModel):
    paciente_id: str
    dentista_id: Optional[str] = None
    laboratorio_id: Optional[str] = None
    agendamento_id: Optional[str] = None
    procedimento_id: Optional[str] = None
    descricao: str
    dente_regiao: Optional[str] = None
    cor_escala: Optional[str] = None
    tipo_werk: Optional[str] = None
    data_envio: Optional[str] = None
    previsao_retorno: Optional[str] = None
    custo_laboratorio: Optional[float] = None
    observacoes: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

@router.get("/")
def listar_ordens(dentista_id: Optional[str] = None, status: Optional[str] = None):
    sb = get_supabase()
    query = sb.table("ordens_proteticas").select(
        "*, pacientes(nome, telefone), dentistas(nome), laboratorios(nome)"
    ).order("created_at", desc=True)

    if dentista_id:
        query = query.eq("dentista_id", dentista_id)
    if status:
        query = query.eq("status", status)

    res = query.execute()
    return res.data

@router.post("/")
def criar_ordem(ordem: OrdemSchema):
    sb = get_supabase()
    payload = ordem.model_dump(exclude_none=True)
    if "status" not in payload:
        payload["status"] = "PRE_ENVIO"
    res = sb.table("ordens_proteticas").insert(payload).execute()
    return res.data[0]

@router.patch("/{id}/status")
def atualizar_status(id: str, update: StatusUpdate):
    if update.status not in COLUNAS_VALIDAS:
        raise HTTPException(status_code=400, detail=f"Status inválido. Use: {COLUNAS_VALIDAS}")
    sb = get_supabase()
    
    # Set date fields automatically on status transitions
    extra = {}
    if update.status == "RETORNOU":
        extra["data_retorno"] = "now()"
    elif update.status == "INSTALADO":
        extra["data_instalacao"] = "now()"

    res = sb.table("ordens_proteticas").update({"status": update.status, **extra}).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Ordem não encontrada")
    return res.data[0]

@router.put("/{id}")
def editar_ordem(id: str, ordem: OrdemSchema):
    sb = get_supabase()
    res = sb.table("ordens_proteticas").update(ordem.model_dump(exclude_none=True)).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Ordem não encontrada")
    return res.data[0]

@router.delete("/{id}")
def deletar_ordem(id: str):
    sb = get_supabase()
    res = sb.table("ordens_proteticas").delete().eq("id", id).execute()
    return {"ok": True}
