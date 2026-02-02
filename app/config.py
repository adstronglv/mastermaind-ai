"""
Configuration settings for AdStrong LV SaaS.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Existing API keys
    anthropic_api_key: str
    fal_api_key: str = ""

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # PayPal
    paypal_client_id: str = ""
    paypal_secret: str = ""
    paypal_api_url: str = "https://api-m.sandbox.paypal.com"
    paypal_plan_pro: str = ""
    paypal_webhook_id: str = ""

    # App
    frontend_url: str = "https://adstronglv.com"

    # Limits
    free_prompts: int = 10
    free_ads: int = 3
    pro_prompts: int = 50
    pro_ads: int = 50

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
