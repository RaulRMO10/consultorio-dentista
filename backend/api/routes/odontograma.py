"""
Rotas da API - Odontograma do Paciente
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from backend.config.supabase_client import get_supabase

router = APIRouter()


class DenteUpdate(BaseModel):
    numero_dente: int
    condicao: str  # HIGIDO, CARIE, RESTAURADO, EXTRAIDO, PROTESE, ENDODONTIA, OBSERVACAO
    observacao: Optional[str] = None


class OdontogramaUpdate(BaseModel):
    dentes: List[DenteUpdate]
    dentes_removidos: Optional[List[int]] = []


@router.get("/{paciente_id}")
def get_odontograma(paciente_id: str):
    """Retorna o estado atual do odontograma de um paciente."""
    sb = get_supabase()
    r = sb.table("paciente_odontograma").select("*").eq("paciente_id", paciente_id).execute()
    # Transforma lista de registros em dict indexado pelo numero_dente
    resultado = {str(d["numero_dente"]): d for d in r.data}
    return resultado


@router.post("/{paciente_id}", status_code=status.HTTP_200_OK)
def salvar_odontograma(paciente_id: str, dados: OdontogramaUpdate):
    """Salva ou atualiza o odontograma completo de um paciente (upsert por dente) e deleta os removidos."""
    sb = get_supabase()
    
    # Processa deleções primeiro (se houver)
    qtd_removida = 0
    if dados.dentes_removidos:
        r_del = sb.table("paciente_odontograma")\
            .delete()\
            .eq("paciente_id", paciente_id)\
            .in_("numero_dente", dados.dentes_removidos)\
            .execute()
        qtd_removida = len(dados.dentes_removidos)

    # Depois processa inserções/atualizações
    registros = []
    if dados.dentes:
        registros = [
            {
                "paciente_id": paciente_id,
                "numero_dente": d.numero_dente,
                "condicao": d.condicao,
                "observacao": d.observacao,
            }
            for d in dados.dentes
        ]

        r = sb.table("paciente_odontograma").upsert(
            registros,
            on_conflict="paciente_id,numero_dente"
        ).execute()

        if r.data is None:
            raise HTTPException(status_code=400, detail="Erro ao salvar odontograma")

    return {"ok": True, "saved": len(registros), "deleted": qtd_removida}
