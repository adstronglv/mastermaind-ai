"""
Usage limiter for AdStrong LV.
Tracks and limits API usage per user/anonymous session.
"""

from datetime import date
from typing import Optional
from fastapi import Request
import hashlib

from app.database import get_supabase
from app.config import get_settings


class Limiter:
    def __init__(self):
        self.settings = get_settings()

    def get_limits(self, plan: str) -> dict:
        """
        Get usage limits for a plan.

        Free: 10 prompts/day, 3 ads/day
        Pro: 50 prompts/day, 50 ads/month
        """
        if plan == "pro":
            return {
                "prompt": 50,
                "prompt_period": "day",
                "ad": 50,
                "ad_period": "month",
                "regenerate": 100,
                "regenerate_period": "month"
            }
        # Free plan
        return {
            "prompt": 10,
            "prompt_period": "day",
            "ad": 3,
            "ad_period": "day",
            "regenerate": 5,
            "regenerate_period": "day"
        }

    def get_anonymous_id(self, request: Request) -> str:
        """Generate anonymous ID from IP + User-Agent."""
        ip = request.client.host if request.client else "unknown"
        ua = request.headers.get("user-agent", "")
        return hashlib.sha256(f"{ip}:{ua}".encode()).hexdigest()[:32]

    def get_period_start(self, period: str) -> str:
        """Get start date for period (day or month)."""
        today = date.today()
        if period == "month":
            return today.replace(day=1).isoformat()
        return today.isoformat()

    async def check_and_increment(
        self,
        action: str,
        plan: str = "free",
        user_id: Optional[str] = None,
        anon_id: Optional[str] = None
    ) -> tuple[bool, int, int]:
        """
        Check if action is allowed and increment usage.

        Returns: (allowed, used, limit)
        """
        limits = self.get_limits(plan)
        limit = limits.get(action, 0)

        if limit == -1:  # Unlimited
            return True, 0, -1

        if limit == 0:  # Not allowed
            return False, 0, 0

        supabase = get_supabase()

        # Get period for this action
        period = limits.get(f"{action}_period", "day")
        period_start = self.get_period_start(period)

        # Query usage for period
        query = supabase.table("usage_logs").select("count").eq(
            "action_type", action
        ).gte("date", period_start)

        if user_id:
            query = query.eq("user_id", user_id)
        else:
            query = query.eq("anonymous_id", anon_id)

        result = query.execute()

        # Sum all records in period
        used = sum(r["count"] for r in result.data) if result.data else 0

        if used >= limit:
            return False, used, limit

        # Increment usage (always store by day for granularity)
        today = date.today().isoformat()

        # Check if record exists for today
        id_field = "user_id" if user_id else "anonymous_id"
        id_value = user_id or anon_id

        today_query = supabase.table("usage_logs").select("id, count").eq(
            "action_type", action
        ).eq("date", today).eq(id_field, id_value)

        today_result = today_query.execute()

        if today_result.data:
            # Update existing record
            supabase.table("usage_logs").update(
                {"count": today_result.data[0]["count"] + 1}
            ).eq("id", today_result.data[0]["id"]).execute()
        else:
            # Create new record
            data = {
                "action_type": action,
                "date": today,
                "count": 1
            }
            if user_id:
                data["user_id"] = user_id
            else:
                data["anonymous_id"] = anon_id

            supabase.table("usage_logs").insert(data).execute()

        return True, used + 1, limit

    async def get_usage(
        self,
        plan: str = "free",
        user_id: Optional[str] = None,
        anon_id: Optional[str] = None
    ) -> dict:
        """Get current usage for all actions."""
        limits = self.get_limits(plan)
        supabase = get_supabase()

        usage = {}
        for action in ["prompt", "ad", "regenerate"]:
            period = limits.get(f"{action}_period", "day")
            period_start = self.get_period_start(period)

            query = supabase.table("usage_logs").select("count").eq(
                "action_type", action
            ).gte("date", period_start)

            if user_id:
                query = query.eq("user_id", user_id)
            else:
                query = query.eq("anonymous_id", anon_id)

            result = query.execute()
            used = sum(r["count"] for r in result.data) if result.data else 0

            usage[action] = {
                "used": used,
                "limit": limits.get(action, 0),
                "period": period
            }

        return usage


# Global limiter instance
limiter = Limiter()
