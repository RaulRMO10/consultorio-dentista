"""
Cliente Supabase (conexão via HTTPS)
"""
from functools import lru_cache
import os
from dotenv import load_dotenv
from postgrest import SyncPostgrestClient

load_dotenv()

class FakeSupabaseClient:
    def __init__(self, url: str, key: str):
        rest_url = f"{url}/rest/v1"
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Profile": "public"
        }
        self.postgrest = SyncPostgrestClient(rest_url, headers=headers)
        
    def table(self, table_name: str):
        return self.postgrest.table(table_name)

@lru_cache()
def get_supabase():
    """Retorna cliente Supabase (cached)"""
    url = os.getenv("SUPABASE_URL", "https://pegkdkqdqxfvebhzwhyx.supabase.co")
    key = os.getenv("SUPABASE_KEY", "sb_publishable_z-ERWQxTyrw4IzXvt5MEGw_m7uVu2J8")
    return FakeSupabaseClient(url, key)
