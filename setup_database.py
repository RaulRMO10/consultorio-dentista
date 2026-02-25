"""
Script para configurar o banco de dados
Executa o schema.sql no Supabase PostgreSQL
Versão: 1.0.0
"""
import psycopg
import os
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.append(str(Path(__file__).parent))

from backend.config import get_settings


def test_connection(settings):
    """Testa a conexão com o banco de dados"""
    try:
        conn = psycopg.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            connect_timeout=5
        )
        conn.close()
        return True, None
    except Exception as e:
        return False, str(e)


def get_database_info(cursor):
    """Obtém informações do banco de dados"""
    try:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT 
                COUNT(*) FILTER (WHERE table_type = 'BASE TABLE') as tables,
                COUNT(*) FILTER (WHERE table_type = 'VIEW') as views
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        tables, views = cursor.fetchone()
        
        cursor.execute("""
            SELECT COUNT(*) 
            FROM pg_indexes 
            WHERE schemaname = 'public';
        """)
        indexes = cursor.fetchone()[0]
        
        return {
            'version': version.split(',')[0],
            'tables': tables,
            'views': views,
            'indexes': indexes
        }
    except Exception as e:
        return None


def setup_database(force=False):
    """
    Executa o script SQL de criação das tabelas
    
    Args:
        force: Se True, recria o banco mesmo se já existir
    """
    settings = get_settings()
    
    print("🔍 Verificando conexão com o banco de dados...")
    print(f"   Host: {settings.DB_HOST}")
    print(f"   Database: {settings.DB_NAME}")
    print(f"   User: {settings.DB_USER}")
    print()
    
    # Testar conexão
    conectado, erro = test_connection(settings)
    
    if not conectado:
        print("❌ ERRO: Não foi possível conectar ao banco de dados")
        print(f"   Detalhes: {erro}")
        print()
        print("💡 Verifique:")
        print("   1. Credenciais no arquivo .env")
        print("   2. Conexão com a internet")
        print("   3. Firewall/VPN")
        return False
    
    print("✅ Conexão estabelecida com sucesso!")
    print()
    
    try:
        # Conectar ao banco
        conn = psycopg.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Obter info do banco antes
        print("📊 Informações do banco ANTES:")
        info_antes = get_database_info(cursor)
        if info_antes:
            print(f"   PostgreSQL: {info_antes['version']}")
            print(f"   Tabelas: {info_antes['tables']}")
            print(f"   Views: {info_antes['views']}")
            print(f"   Índices: {info_antes['indexes']}")
        print()
        
        # Verificar se já tem dados
        if info_antes and info_antes['tables'] > 0 and not force:
            print("⚠️  ATENÇÃO: O banco já possui tabelas!")
            print()
            resposta = input("   Deseja RECRIAR o banco? Isso apagará TODOS os dados! (sim/não): ")
            if resposta.lower() not in ['sim', 's', 'yes', 'y']:
                print("❌ Operação cancelada pelo usuário.")
                return False
            print()
        
        # Ler o schema SQL
        schema_path = Path(__file__).parent / 'database' / 'schema.sql'
        
        if not schema_path.exists():
            print(f"❌ ERRO: Arquivo schema.sql não encontrado em: {schema_path}")
            return False
        
        print("📋 Lendo script SQL...")
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        print(f"   Arquivo: {schema_path.name}")
        print(f"   Tamanho: {len(sql_script)} caracteres")
        print()
        
        print("🚀 Executando script SQL...")
        print("   (Isso pode levar alguns segundos...)")
        print()
        
        # Executar o script
        try:
            cursor.execute(sql_script)
            print("✅ Script executado com sucesso!")
        except Exception as e:
            print(f"❌ ERRO ao executar SQL:")
            print(f"   {str(e)}")
            return False
        
        print()
        
        # Obter info do banco depois
        print("📊 Informações do banco DEPOIS:")
        info_depois = get_database_info(cursor)
        if info_depois:
            print(f"   PostgreSQL: {info_depois['version']}")
            print(f"   Tabelas: {info_depois['tables']}")
            print(f"   Views: {info_depois['views']}")
            print(f"   Índices: {info_depois['indexes']}")
        print()
        
        # Listar tabelas criadas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tabelas = cursor.fetchall()
        
        print("✅ Tabelas criadas:")
        for tabela in tabelas:
            print(f"   ✓ {tabela[0]}")
        print()
        
        # Listar views criadas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        views = cursor.fetchall()
        
        if views:
            print("✅ Views criadas:")
            for view in views:
                print(f"   ✓ {view[0]}")
            print()
        
        # Verificar dados iniciais
        cursor.execute("SELECT COUNT(*) FROM procedimentos;")
        qtd_procedimentos = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM dentistas;")
        qtd_dentistas = cursor.fetchone()[0]
        
        print("✅ Dados iniciais inseridos:")
        print(f"   ✓ {qtd_procedimentos} procedimentos")
        print(f"   ✓ {qtd_dentistas} dentistas")
        print()
        
        # Testar função de estatísticas
        try:
            cursor.execute("SELECT * FROM get_estatisticas_sistema();")
            stats = cursor.fetchone()
            print("✅ Funções configuradas corretamente")
            print()
        except Exception as e:
            print(f"⚠️  Aviso: Função de estatísticas não disponível: {e}")
            print()
        
        cursor.close()
        conn.close()
        
        print("="*60)
        print("  🎉 BANCO DE DADOS CONFIGURADO COM SUCESSO!")
        print("="*60)
        print()
        print("📚 Próximos passos:")
        print("   1. Execute: python start_backend.py")
        print("   2. Execute: python start_frontend.py")
        print("   3. Acesse: http://localhost:8501")
        print()
        
        return True
        
    except psycopg.Error as e:
        print(f"❌ ERRO PostgreSQL: {e}")
        return False
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print()
    print("="*60)
    print("  SETUP DO BANCO DE DADOS - CONSULTÓRIO DENTISTA")
    print("  Versão: 1.0.0")
    print("="*60)
    print()
    
    # Verificar argumentos
    force = '--force' in sys.argv or '-f' in sys.argv
    
    if force:
        print("⚠️  Modo FORCE ativado - recriará o banco sem confirmar")
        print()
    
    sucesso = setup_database(force=force)
    
    if not sucesso:
        print()
        print("❌ Setup falhou. Verifique os erros acima.")
        sys.exit(1)
    else:
        sys.exit(0)
