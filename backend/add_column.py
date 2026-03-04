import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "aws-0-sa-east-1.pooler.supabase.com")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def main():
    if not DB_PASSWORD:
        print("Senha do banco não encontrada.")
        return

    conn = None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cur = conn.cursor()
        print("Conectado. Executando ALTER TABLE...")
        
        # Adding the array column
        cur.execute("ALTER TABLE clin_tratamentos ADD COLUMN IF NOT EXISTS procedimentos_concluidos_ids UUID[] DEFAULT '{}';")
        
        conn.commit()
        cur.close()
        print("Coluna adicionada com sucesso!")
        
    except psycopg2.Error as e:
        print(f"Erro no banco: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main()
