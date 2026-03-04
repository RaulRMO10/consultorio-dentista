import psycopg
import os
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.append(str(Path(__file__).parent.parent.parent))

from dotenv import load_dotenv

def run_migration():
    env_path = str(Path(__file__).parent.parent.parent / '.env')
    load_dotenv(env_path)
    
    print("Conectando ao banco para adicionar status 'aguardando'...")
    try:
        conn = psycopg.connect(
            host=os.environ.get("DB_HOST", ""),
            port=os.environ.get("DB_PORT", "5432"),
            dbname=os.environ.get("DB_NAME", "postgres"),
            user=os.environ.get("DB_USER", "postgres"),
            password=os.environ.get("DB_PASSWORD", "")
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        print("Executando ALTER TABLE na tabela agendamentos...")
        # A check constraint named 'agendamentos_status_check' was likely created implicitly
        # Let's drop and recreate it for the 'status' column.
        sql = """
        -- Remove previous constraint if it exists
        DO $$ 
        BEGIN
            ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check;
        EXCEPTION
            WHEN undefined_object THEN null;
        END $$;
        
        -- Add the new constraint with 'aguardando'
        ALTER TABLE agendamentos 
        ADD CONSTRAINT agendamentos_status_check 
        CHECK (status IN ('agendado', 'confirmado', 'aguardando', 'em_atendimento', 'concluido', 'falta', 'cancelado'));
        """
        
        cursor.execute(sql)
        print("Migração concluída com sucesso! Status 'aguardando' agora é válido.")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Erro na migração: {e}")

if __name__ == "__main__":
    run_migration()
