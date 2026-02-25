"""
Script para iniciar o frontend Streamlit
"""
import subprocess
import sys
import os

if __name__ == "__main__":
    print("🌐 Iniciando Frontend Streamlit...")
    print("📍 Frontend URL: http://localhost:8501")
    print("\nPressione Ctrl+C para parar\n")
    
    frontend_path = os.path.join(os.path.dirname(__file__), "frontend", "app.py")
    
    subprocess.run([
        sys.executable,
        "-m",
        "streamlit",
        "run",
        frontend_path,
        "--server.port=8501",
        "--server.address=localhost"
    ])
