"""
Cliente Supabase (conexão via HTTPS)
"""
from supabase import create_client, Client
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


@lru_cache()
def get_supabase() -> Client:
    """Retorna cliente Supabase (cached)"""
    url = os.getenv("SUPABASE_URL", "https://pegkdkqdqxfvebhzwhyx.supabase.co")
    key = os.getenv("SUPABASE_KEY", "sb_publishable_z-ERWQxTyrw4IzXvt5MEGw_m7uVu2J8")
    return create_client(url, key)
