import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT", "5432")

# Lendo o arquivo SQL
sql_file_path = os.path.join(os.path.dirname(__file__), 'finance_schema.sql')
with open(sql_file_path, "r", encoding="utf-8") as file:
    sql_commands = file.read()

try:
    print(f"🔄 Conectando a {DB_HOST}...")
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("⏳ Aplicando Nova Arquitetura Financeira...")
    cursor.execute(sql_commands)
    
    print("✅ Schema Financeiro Integrado aplicado com sucesso nas tabelas:")
    print("   - fin_categorias\n   - fin_faturamentos\n   - fin_transacoes")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Erro ao aplicar Schema: {e}")
