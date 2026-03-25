from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.config.supabase_client import get_supabase

router = APIRouter()

class LaboratorioSchema(BaseModel):
    nome: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    responsavel: Optional[str] = None
    ativo: Optional[bool] = True

@router.get("/")
def listar_laboratorios():
    sb = get_supabase()
    res = sb.table("laboratorios").select("*").eq("ativo", True).order("nome").execute()
    return res.data

@router.post("/")
def criar_laboratorio(lab: LaboratorioSchema):
    sb = get_supabase()
    res = sb.table("laboratorios").insert(lab.model_dump()).execute()
    return res.data[0]

@router.put("/{id}")
def editar_laboratorio(id: str, lab: LaboratorioSchema):
    sb = get_supabase()
    res = sb.table("laboratorios").update(lab.model_dump()).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Laboratório não encontrado")
    return res.data[0]

@router.delete("/{id}")
def desativar_laboratorio(id: str):
    sb = get_supabase()
    res = sb.table("laboratorios").update({"ativo": False}).eq("id", id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Laboratório não encontrado")
    return {"ok": True}
