"""
Script para iniciar o frontend React (antigo Streamlit)
"""
import subprocess
import os

if __name__ == "__main__":
    print("🌐 Iniciando Frontend React (Vite)...")
    print("📍 Frontend URL: http://localhost:5173")
    print("\nPressione Ctrl+C para parar\n")
    
    frontend_path = os.path.join(os.path.dirname(__file__), "frontend-react")
    
    # Try to use npm.cmd on Windows if available, fallback to npm
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    
    try:
        subprocess.run(
            [npm_cmd, "run", "dev"], 
            cwd=frontend_path
        )
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    except Exception as e:
        print(f"\nErro ao iniciar frontend: {e}")
