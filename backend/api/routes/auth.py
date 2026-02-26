"""
Rotas de Autenticação — OdontoSystem
POST /auth/login      → retorna JWT
GET  /auth/me         → retorna usuário atual (requer token)
POST /auth/usuarios   → criar usuário (admin)
GET  /auth/usuarios   → listar usuários (admin)
PUT  /auth/usuarios/{id}  → atualizar usuário (admin)
DELETE /auth/usuarios/{id} → desativar usuário (admin)
POST /auth/change-password → alterar própria senha
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from jose import jwt, JWTError

from backend.config.supabase_client import get_supabase
from backend.config.settings import get_settings

router = APIRouter()

# ── Configurações JWT ────────────────────────────────────────────
def _get_secret() -> str:
    secret = get_settings().JWT_SECRET_KEY
    if not secret:
        raise RuntimeError("JWT_SECRET_KEY deve estar definido no arquivo .env")
    return secret

ALGORITHM         = get_settings().JWT_ALGORITHM
TOKEN_EXPIRE_HOURS = get_settings().JWT_EXPIRE_HOURS

# ── Hashing ──────────────────────────────────────────────────────────────────
bearer  = HTTPBearer(auto_error=False)

def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(12)).decode()

def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ── Schemas ───────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    role: str = "recepcionista"

class UsuarioUpdate(BaseModel):
    nome: Optional[str]   = None
    email: Optional[str]  = None
    role: Optional[str]   = None
    ativo: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    senha_atual: str
    nova_senha: str


# ── Helpers JWT ───────────────────────────────────────────────────────────────
def create_token(user_id: str, email: str, nome: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS)
    payload = {
        "sub":   user_id,
        "email": email,
        "nome":  nome,
        "role":  role,
        "exp":   expire,
    }
    return jwt.encode(payload, _get_secret(), algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, _get_secret(), algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    return decode_token(creds.credentials)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return user


# ── Rotas ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    sb = get_supabase()
    res = sb.table("usuarios").select("*").eq("email", body.email.lower().strip()).execute()

    if not res.data:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    user = res.data[0]

    if not user.get("ativo", True):
        raise HTTPException(status_code=403, detail="Usuário inativo. Contate o administrador.")

    if not _verify_password(body.senha, user["senha_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    # Registra último acesso
    sb.table("usuarios").update({"ultimo_acesso": datetime.now(timezone.utc).isoformat()}).eq("id", user["id"]).execute()

    token = create_token(user["id"], user["email"], user["nome"], user["role"])

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":    user["id"],
            "nome":  user["nome"],
            "email": user["email"],
            "role":  user["role"],
        }
    }


@router.get("/me")
def get_me(current: dict = Depends(get_current_user)):
    return current


@router.get("/usuarios")
def listar_usuarios(current: dict = Depends(require_admin)):
    sb = get_supabase()
    res = sb.table("usuarios").select(
        "id,nome,email,role,ativo,ultimo_acesso,created_at"
    ).order("nome").execute()
    return res.data


@router.post("/usuarios", status_code=201)
def criar_usuario(body: UsuarioCreate, current: dict = Depends(require_admin)):
    roles_validos = ("admin", "dentista", "recepcionista", "financeiro")
    if body.role not in roles_validos:
        raise HTTPException(status_code=400, detail=f"Role inválido. Use: {roles_validos}")

    if len(body.senha) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")

    sb = get_supabase()
    # Verificar e-mail duplicado
    existing = sb.table("usuarios").select("id").eq("email", body.email.lower().strip()).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    senha_hash = _hash_password(body.senha)
    res = sb.table("usuarios").insert({
        "nome":       body.nome.strip(),
        "email":      body.email.lower().strip(),
        "senha_hash": senha_hash,
        "role":       body.role,
        "ativo":      True,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Erro ao criar usuário")

    u = res.data[0]
    return {"id": u["id"], "nome": u["nome"], "email": u["email"], "role": u["role"]}


@router.put("/usuarios/{usuario_id}")
def atualizar_usuario(usuario_id: str, body: UsuarioUpdate, current: dict = Depends(require_admin)):
    dados = {k: v for k, v in body.model_dump().items() if v is not None}
    if not dados:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")

    sb = get_supabase()
    res = sb.table("usuarios").update(dados).eq("id", usuario_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return res.data[0]


@router.delete("/usuarios/{usuario_id}", status_code=204)
def desativar_usuario(usuario_id: str, current: dict = Depends(require_admin)):
    if usuario_id == current["sub"]:
        raise HTTPException(status_code=400, detail="Você não pode desativar a própria conta")
    sb = get_supabase()
    sb.table("usuarios").update({"ativo": False}).eq("id", usuario_id).execute()
    return None


@router.post("/change-password")
def change_password(body: ChangePasswordRequest, current: dict = Depends(get_current_user)):
    sb = get_supabase()
    res = sb.table("usuarios").select("senha_hash").eq("id", current["sub"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not _verify_password(body.senha_atual, res.data[0]["senha_hash"]):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")

    if len(body.nova_senha) < 6:
        raise HTTPException(status_code=400, detail="Nova senha deve ter pelo menos 6 caracteres")

    nova_hash = _hash_password(body.nova_senha)
    sb.table("usuarios").update({"senha_hash": nova_hash}).eq("id", current["sub"]).execute()
    return {"message": "Senha alterada com sucesso"}
