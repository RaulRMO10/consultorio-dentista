import os
from supabase import create_client

# Usa config basica
url = os.environ.get("SUPABASE_URL", "https://qeqxobpgydgyjxtrbluw.supabase.co")
key = os.environ.get("SUPABASE_KEY")

if not key:
    with open(".env") as f:
        for line in f:
            if line.startswith("SUPABASE_KEY="):
                key = line.split("=")[1].strip()

sb = create_client(url, key)
res = sb.table("fin_transacoes").select("faturamento_id, descricao, valor, status, taxa_valor").execute()
for r in res.data:
    print(r)
