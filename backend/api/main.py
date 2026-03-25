"""
API FastAPI - Consultório Dentista
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import get_settings
from backend.api.routes import pacientes, dentistas, agendamentos, procedimentos, financeiro_consultorio, financeiro_pessoal, faturamentos, clin_tratamentos, financeiro_settings, odontograma, anamneses, laboratorios, ordens_proteticas
from backend.api.routes import auth

settings = get_settings()

# Criar aplicação FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API REST para sistema de consultório dentista",
    debug=settings.DEBUG,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# CORS - Permitir acesso do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(auth.router,                  prefix="/auth",                            tags=["Autenticação"])
app.include_router(pacientes.router,             prefix="/api/pacientes",                   tags=["Pacientes"])
app.include_router(dentistas.router,             prefix="/api/dentistas",                   tags=["Dentistas"])
app.include_router(agendamentos.router,          prefix="/api/agendamentos",                tags=["Agendamentos"])
app.include_router(procedimentos.router,         prefix="/api/procedimentos",               tags=["Procedimentos"])
app.include_router(faturamentos.router,          prefix="/api/faturamentos",                tags=["Faturamentos"])
app.include_router(financeiro_consultorio.router,prefix="/api/financeiro/consultorio",      tags=["Financeiro Consultório"])
app.include_router(financeiro_pessoal.router,    prefix="/api/financeiro/pessoal",          tags=["Financeiro Pessoal"])
app.include_router(financeiro_settings.router,   prefix="/api/financeiro/settings",         tags=["Configurações Financeiras"])
app.include_router(clin_tratamentos.router,      prefix="/api/tratamentos",                 tags=["Tratamentos Clínicos"])
app.include_router(odontograma.router,           prefix="/api/odontograma",                 tags=["Odontograma"])
app.include_router(anamneses.router,             prefix="/api/anamneses",                   tags=["Anamneses"])
app.include_router(laboratorios.router,          prefix="/api/protetico/laboratorios",       tags=["Laboratórios"])
app.include_router(ordens_proteticas.router,     prefix="/api/protetico/ordens",             tags=["Controle Protético"])


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
