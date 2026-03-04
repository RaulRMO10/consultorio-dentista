import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.environ.get("DB_NAME", "postgres"),
    user=os.environ.get("DB_USER", "postgres"),
    password=os.environ.get("DB_PASSWORD", ""),
    host=os.environ.get("DB_HOST", "db.pegkdkqdqxfvebhzwhyx.supabase.co"),
    port=os.environ.get("DB_PORT", "5432")
)

conn.autocommit = True
cur = conn.cursor()

try:
    cur.execute("ALTER TABLE fin_transacoes ADD COLUMN metodo_pagamento VARCHAR(100);")
    print("Added metodo_pagamento")
except Exception as e:
    print("metodo_pagamento:", e)
    
try:
    cur.execute("ALTER TABLE fin_transacoes ADD COLUMN taxa_porcentagem NUMERIC(5,2) DEFAULT 0;")
    print("Added taxa_porcentagem")
except Exception as e:
    print("taxa_porcentagem:", e)

try:
    cur.execute("ALTER TABLE fin_transacoes ADD COLUMN taxa_valor NUMERIC(15,2) DEFAULT 0;")
    print("Added taxa_valor")
except Exception as e:
    print("taxa_valor:", e)

try:
    # also add valor_desconto to the table, just in case they want it for reporting
    cur.execute("ALTER TABLE fin_transacoes ADD COLUMN valor_desconto NUMERIC(15,2) DEFAULT 0;")
    print("Added valor_desconto")
except Exception as e:
    print("valor_desconto:", e)

cur.close()
conn.close()
print("Done")
