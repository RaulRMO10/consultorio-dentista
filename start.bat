@echo off
echo ========================================
echo   Consultorio Dentista - Iniciar Tudo
echo ========================================
echo.

echo [1/3] Ativando ambiente virtual...
call .venv\Scripts\activate.bat

echo.
echo [2/3] Iniciando Backend (FastAPI)...
start "Backend API" python start_backend.py

timeout /t 3 /nobreak >nul

echo.
echo [3/3] Iniciando Frontend (Streamlit)...
start "Frontend Streamlit" python start_frontend.py

echo.
echo ========================================
echo   Sistema iniciado com sucesso!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:8501
echo Docs API: http://localhost:8000/docs
echo.
echo Pressione qualquer tecla para sair...
pause >nul
