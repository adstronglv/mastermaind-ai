"""
PayPal payment integration for AdStrong LV.
"""

import json
import httpx
from fastapi import APIRouter, HTTPException, Request, Depends

from app.config import get_settings
from app.database import get_supabase
from app.auth import require_user


router = APIRouter(prefix="/api/payments", tags=["payments"])


async def get_paypal_token() -> str:
    """Get PayPal access token."""
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.paypal_api_url}/v1/oauth2/token",
            auth=(settings.paypal_client_id, settings.paypal_secret),
            data={"grant_type": "client_credentials"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if response.status_code != 200:
            raise HTTPException(500, "PayPal authentication failed")

        return response.json()["access_token"]


@router.post("/create-subscription")
async def create_subscription(user: dict = Depends(require_user)):
    """Create PayPal subscription for Pro plan."""
    settings = get_settings()

    if not settings.paypal_plan_pro:
        raise HTTPException(500, "Payment not configured")

    token = await get_paypal_token()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.paypal_api_url}/v1/billing/subscriptions",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={
                "plan_id": settings.paypal_plan_pro,
                "custom_id": str(user["id"]),
                "application_context": {
                    "brand_name": "AdStrong LV",
                    "locale": "de-DE",
                    "shipping_preference": "NO_SHIPPING",
                    "user_action": "SUBSCRIBE_NOW",
                    "return_url": f"{settings.frontend_url}/dashboard?payment=success",
                    "cancel_url": f"{settings.frontend_url}/pricing?payment=cancelled"
                }
            }
        )

        if response.status_code not in [200, 201]:
            raise HTTPException(500, "Could not create subscription")

        data = response.json()

        # Find approval URL
        for link in data.get("links", []):
            if link["rel"] == "approve":
                return {"url": link["href"], "subscription_id": data.get("id")}

        raise HTTPException(500, "Could not get approval URL")


@router.get("/subscription-status")
async def get_subscription_status(user: dict = Depends(require_user)):
    """Get current subscription status."""
    supabase = get_supabase()

    result = supabase.table("subscriptions").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).limit(1).execute()

    if not result.data:
        return {"status": "none", "plan": "free"}

    subscription = result.data[0]
    return {
        "status": subscription["status"],
        "plan": subscription["plan"],
        "subscription_id": subscription.get("paypal_subscription_id")
    }


@router.post("/cancel-subscription")
async def cancel_subscription(user: dict = Depends(require_user)):
    """Cancel PayPal subscription."""
    settings = get_settings()
    supabase = get_supabase()

    # Get subscription
    result = supabase.table("subscriptions").select("*").eq(
        "user_id", user["id"]
    ).eq("status", "active").single().execute()

    if not result.data:
        raise HTTPException(404, "No active subscription found")

    subscription_id = result.data.get("paypal_subscription_id")
    if not subscription_id:
        raise HTTPException(400, "Subscription ID not found")

    token = await get_paypal_token()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.paypal_api_url}/v1/billing/subscriptions/{subscription_id}/cancel",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            json={"reason": "Customer requested cancellation"}
        )

        if response.status_code not in [200, 204]:
            raise HTTPException(500, "Could not cancel subscription")

    # Update local status
    supabase.table("subscriptions").update({
        "status": "cancelled_pending"
    }).eq("id", result.data["id"]).execute()

    return {"status": "cancelled", "message": "Subscription will remain active until end of billing period"}


async def verify_paypal_webhook(request: Request) -> bool:
    """Verify PayPal webhook signature."""
    settings = get_settings()

    if not settings.paypal_webhook_id:
        # Skip verification in development
        return True

    headers = {
        "PAYPAL-AUTH-ALGO": request.headers.get("PAYPAL-AUTH-ALGO"),
        "PAYPAL-CERT-URL": request.headers.get("PAYPAL-CERT-URL"),
        "PAYPAL-TRANSMISSION-ID": request.headers.get("PAYPAL-TRANSMISSION-ID"),
        "PAYPAL-TRANSMISSION-SIG": request.headers.get("PAYPAL-TRANSMISSION-SIG"),
        "PAYPAL-TRANSMISSION-TIME": request.headers.get("PAYPAL-TRANSMISSION-TIME"),
    }

    # If any header is missing, skip verification
    if not all(headers.values()):
        return True

    body = await request.body()
    token = await get_paypal_token()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.paypal_api_url}/v1/notifications/verify-webhook-signature",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "webhook_id": settings.paypal_webhook_id,
                "transmission_id": headers["PAYPAL-TRANSMISSION-ID"],
                "transmission_time": headers["PAYPAL-TRANSMISSION-TIME"],
                "cert_url": headers["PAYPAL-CERT-URL"],
                "auth_algo": headers["PAYPAL-AUTH-ALGO"],
                "transmission_sig": headers["PAYPAL-TRANSMISSION-SIG"],
                "webhook_event": json.loads(body)
            }
        )

        if response.status_code != 200:
            return False

        result = response.json()
        return result.get("verification_status") == "SUCCESS"


@router.post("/webhook")
async def paypal_webhook(request: Request):
    """Handle PayPal webhooks."""
    # Verify webhook signature
    if not await verify_paypal_webhook(request):
        raise HTTPException(403, "Invalid webhook signature")

    body = await request.json()
    event_type = body.get("event_type")
    resource = body.get("resource", {})

    supabase = get_supabase()

    if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
        user_id = resource.get("custom_id")
        subscription_id = resource.get("id")

        if user_id:
            # Upgrade user to Pro
            supabase.table("users").update({
                "plan": "pro"
            }).eq("id", user_id).execute()

            # Store subscription
            supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "paypal_subscription_id": subscription_id,
                "plan": "pro",
                "status": "active"
            }, on_conflict="user_id").execute()

    elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
        subscription_id = resource.get("id")

        # Mark as cancelled but keep access until period end
        supabase.table("subscriptions").update({
            "status": "cancelled_pending"
        }).eq("paypal_subscription_id", subscription_id).execute()

    elif event_type == "BILLING.SUBSCRIPTION.EXPIRED":
        subscription_id = resource.get("id")

        # Get user and downgrade
        result = supabase.table("subscriptions").select("user_id").eq(
            "paypal_subscription_id", subscription_id
        ).single().execute()

        if result.data:
            user_id = result.data["user_id"]

            # Downgrade to free
            supabase.table("users").update({
                "plan": "free"
            }).eq("id", user_id).execute()

            # Update subscription status
            supabase.table("subscriptions").update({
                "status": "expired"
            }).eq("paypal_subscription_id", subscription_id).execute()

    elif event_type == "BILLING.SUBSCRIPTION.SUSPENDED":
        subscription_id = resource.get("id")

        # Mark as suspended
        supabase.table("subscriptions").update({
            "status": "suspended"
        }).eq("paypal_subscription_id", subscription_id).execute()

    elif event_type == "PAYMENT.SALE.COMPLETED":
        # Successful payment - nothing to do, subscription is already active
        pass

    return {"status": "ok"}
