"""
API FastAPI - Consultório Dentista
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import get_settings
from backend.api.routes import pacientes, dentistas, agendamentos, procedimentos, financeiro_consultorio, financeiro_pessoal

settings = get_settings()

# Criar aplicação FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para sistema de consultório dentista",
    debug=settings.DEBUG
)

# CORS - Permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(pacientes.router, prefix="/api/pacientes", tags=["Pacientes"])
app.include_router(dentistas.router, prefix="/api/dentistas", tags=["Dentistas"])
app.include_router(agendamentos.router, prefix="/api/agendamentos", tags=["Agendamentos"])
app.include_router(procedimentos.router, prefix="/api/procedimentos", tags=["Procedimentos"])
app.include_router(financeiro_consultorio.router, prefix="/api/financeiro/consultorio", tags=["Financeiro Consultório"])
app.include_router(financeiro_pessoal.router, prefix="/api/financeiro/pessoal", tags=["Financeiro Pessoal"])


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
