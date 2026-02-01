"""
Supabase database client for AdStrong.
"""

from supabase import create_client, Client
from app.config import get_settings


_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get Supabase client (singleton)."""
    global _supabase_client
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_key
        )
    return _supabase_client
