"""
Script para criar o usuário administrador inicial.
Execute UMA VEZ após criar a tabela usuarios no Supabase.

Uso:
    python criar_admin.py
    python criar_admin.py --email "meu@email.com" --nome "Meu Nome" --senha "MinhaS3nha!"
"""
import sys, argparse
sys.path.insert(0, ".")

import bcrypt as _bcrypt
from backend.config.supabase_client import get_supabase

def _hash(senha: str) -> str:
    return _bcrypt.hashpw(senha.encode(), _bcrypt.gensalt(12)).decode()

def criar_usuario(nome: str, email: str, senha: str, role: str = "admin"):
    if len(senha) < 6:
        print("❌ Senha deve ter pelo menos 6 caracteres.")
        return

    sb = get_supabase()
    existing = sb.table("usuarios").select("id").eq("email", email.lower().strip()).execute()
    if existing.data:
        print(f"⚠️  E-mail '{email}' já está cadastrado.")
        return

    senha_hash = _hash(senha)
    res = sb.table("usuarios").insert({
        "nome":       nome.strip(),
        "email":      email.lower().strip(),
        "senha_hash": senha_hash,
        "role":       role,
        "ativo":      True,
    }).execute()

    if res.data:
        u = res.data[0]
        print(f"✅ Usuário criado com sucesso!")
        print(f"   Nome:  {u['nome']}")
        print(f"   E-mail: {u['email']}")
        print(f"   Role:  {u['role']}")
        print(f"   ID:    {u['id']}")
    else:
        print("❌ Erro ao criar usuário. Verifique se a tabela 'usuarios' existe no banco.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Criar usuário admin inicial")
    parser.add_argument("--nome",  default="Administrador",           help="Nome do usuário")
    parser.add_argument("--email", default="admin@odontosystem.com",  help="E-mail de login")
    parser.add_argument("--senha", default="Admin@2025",              help="Senha inicial")
    parser.add_argument("--role",  default="admin",
                        choices=["admin","dentista","recepcionista","financeiro"],
                        help="Perfil de acesso")
    args = parser.parse_args()

    print(f"\n🦷 OdontoSystem — Criação de usuário")
    print(f"   Nome:   {args.nome}")
    print(f"   E-mail: {args.email}")
    print(f"   Role:   {args.role}\n")
    criar_usuario(args.nome, args.email, args.senha, args.role)
