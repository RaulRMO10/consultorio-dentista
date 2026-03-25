from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.config.supabase_client import get_supabase

router = APIRouter()

class AnamneseSchema(BaseModel):
    paciente_id: str
    dados: Dict[str, Any]

@router.get("/{paciente_id}")
def obter_anamnese(paciente_id: str):
    sb = get_supabase()
    res = sb.table("anamneses").select("*").eq("paciente_id", paciente_id).order("created_at", desc=True).execute()
    
    return res.data

@router.post("/")
def salvar_anamnese(anamnese: AnamneseSchema):
    sb = get_supabase()
    
    # Criar sempre uma nova ficha (Histórico de Fichas)
    res = sb.table("anamneses").insert({
        "paciente_id": anamnese.paciente_id,
        "dados": anamnese.dados
    }).execute()
    return res.data[0]
