import os
import psycopg2
from dotenv import load_dotenv

# Carrega do diretório raiz
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

def main():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cur = conn.cursor()
        print("Adicionando coluna metodo_pagamento em fin_transacoes...")
        cur.execute("ALTER TABLE fin_transacoes ADD COLUMN IF NOT EXISTS metodo_pagamento VARCHAR(50);")
        conn.commit()
        print("Coluna adicionada com sucesso!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro: {e}")

if __name__ == '__main__':
    main()
