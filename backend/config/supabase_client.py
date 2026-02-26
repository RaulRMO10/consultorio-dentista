"""
Cliente Supabase (conexão via HTTPS/PostgREST)
"""
from functools import lru_cache
from postgrest import SyncPostgrestClient
from backend.config.settings import get_settings


class FakeSupabaseClient:
    def __init__(self, url: str, key: str):
        rest_url = f"{url}/rest/v1"
        headers = {
            "apikey":        key,
            "Authorization": f"Bearer {key}",
            "Content-Profile": "public",
        }
        self.postgrest = SyncPostgrestClient(rest_url, headers=headers)

    def table(self, table_name: str):
        return self.postgrest.table(table_name)


@lru_cache()
def get_supabase() -> FakeSupabaseClient:
    """Retorna cliente Supabase (cached) usando variáveis do .env"""
    settings = get_settings()
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise RuntimeError(
            "SUPABASE_URL e SUPABASE_KEY devem estar definidos no arquivo .env"
        )
    return FakeSupabaseClient(settings.SUPABASE_URL, settings.SUPABASE_KEY)
