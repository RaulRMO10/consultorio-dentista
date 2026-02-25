"""
Script para iniciar o backend FastAPI
"""
import uvicorn
import sys
import os

# Adicionar o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    print("🚀 Iniciando API do Consultório Dentista...")
    print("📍 API URL: http://localhost:8000")
    print("📚 Documentação: http://localhost:8000/docs")
    print("\nPressione Ctrl+C para parar\n")
    
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
