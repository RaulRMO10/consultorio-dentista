"""
Configurações da aplicação
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configurações do sistema — todos os valores sensíveis devem vir do .env"""

    # Database (Supabase PostgreSQL)
    DB_HOST: str = ""
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""

    # Supabase REST API
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # JWT Auth
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 8

    # Application
    APP_NAME: str = "OdontoSystem API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # API
    API_HOST: str = "localhost"
    API_PORT: int = 8000

    # Frontend
    BACKEND_URL: str = "http://localhost:8000"

    @property
    def DATABASE_URL(self) -> str:
        """URL de conexão do banco de dados"""
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Retorna as configurações (cached)"""
    return Settings()
