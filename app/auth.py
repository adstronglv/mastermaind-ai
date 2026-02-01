"""
Authentication utilities for AdStrong.
"""

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
from app.config import get_settings
from app.database import get_supabase


security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Get current user from JWT token.
    Returns None if not authenticated (for optional auth).
    """
    # Try to get token from Authorization header
    token = None
    if credentials:
        token = credentials.credentials

    # Also check for token in cookie (for SSR pages)
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        return None

    try:
        settings = get_settings()

        # Decode JWT using Supabase JWT secret
        # Supabase uses the anon key as the JWT secret for client tokens
        payload = jwt.decode(
            token,
            settings.supabase_anon_key,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )

        user_id = payload.get("sub")
        if not user_id:
            return None

        # Get user from database
        supabase = get_supabase()
        result = supabase.table("users").select("*").eq("id", user_id).single().execute()

        if result.data:
            return result.data

        return None

    except JWTError:
        return None
    except Exception:
        return None


async def require_user(
    user: Optional[dict] = Depends(get_current_user)
) -> dict:
    """
    Require authenticated user.
    Raises 401 if not authenticated.
    """
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    return user


async def require_pro_user(
    user: dict = Depends(require_user)
) -> dict:
    """
    Require Pro plan user.
    Raises 403 if not Pro.
    """
    if user.get("plan") != "pro":
        raise HTTPException(
            status_code=403,
            detail="Pro plan required"
        )
    return user
