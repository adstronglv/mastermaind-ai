"""
Mastermaind - AI Marketing Tools Platform

Copyright (c) 2024-2026 Mastermaind. All rights reserved.

This software is proprietary and confidential. Unauthorized copying,
modification, distribution, or use of this software is strictly prohibited.

Author: Mastermaind Team
"""

import os
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

load_dotenv()

# Import new modules
from app.config import get_settings
from app.database import get_supabase
from app.auth import get_current_user, require_user
from app.limiter import limiter
from app.payments import router as payments_router
from app.enterprise import router as enterprise_router

# Initialize FastAPI
app = FastAPI(
    title="Mastermaind",
    description="AI-powered marketing tools platform",
    version="2.0.0",
)

# CORS - restricted to allowed domains
ALLOWED_ORIGINS = [
    "https://mastermaind.ai",
    "https://www.mastermaind.ai",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://localhost:8002",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8002",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates and static files
BASE_DIR = Path(__file__).parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
templates.env.auto_reload = True
templates.env.cache_size = 0
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Include routers
app.include_router(payments_router)
app.include_router(enterprise_router)


# Models
class PromptRequest(BaseModel):
    prompt: str
    model: str = "claude-haiku-4-5-20251001"
    task_type: str = "general"  # general, coding, creative, marketing
    is_further_optimization: bool = False  # True when optimizing an already optimized prompt


class OptimizationResult(BaseModel):
    original: str
    optimized: str
    improvements: list[str]
    score_before: int
    score_after: int
    tips: list[str]



async def optimize_prompt(prompt: str, task_type: str, is_further_optimization: bool = False) -> dict[str, Any]:
    """Optimize a prompt using the configured LLM."""
    from app.llm import chat

    if is_further_optimization:
        system_prompt = """You are an expert prompt engineer doing a SECOND PASS optimization on an already-optimized prompt.

Your job is to take this already-good prompt and make it EVEN BETTER:
1. Add more nuance and specificity
2. Improve structure and flow
3. Add advanced techniques (chain-of-thought, few-shot examples, etc.)
4. Make the output expectations clearer
5. Optimize for the specific AI model being used

Since this is already optimized, focus on REFINEMENT and POLISH, not basic improvements.

Respond in JSON format:
{
    "optimized": "the further improved prompt",
    "improvements": ["refinement 1", "refinement 2", ...],
    "score_before": 7-9 (already optimized),
    "score_after": 9-10,
    "tips": ["advanced tip 1", "advanced tip 2", ...]
}"""
    else:
        system_prompt = """You are an expert prompt engineer. Your job is to analyze and optimize prompts for AI models.

For each prompt you receive:
1. Analyze its clarity, specificity, and effectiveness
2. Identify areas for improvement
3. Provide an optimized version
4. List specific improvements made
5. Give actionable tips

Respond in JSON format:
{
    "optimized": "the improved prompt",
    "improvements": ["improvement 1", "improvement 2", ...],
    "score_before": 1-10,
    "score_after": 1-10,
    "tips": ["tip 1", "tip 2", ...]
}"""

    task_context = {
        "general": "This is a general-purpose prompt.",
        "coding": "This prompt is for code generation or programming tasks.",
        "creative": "This prompt is for creative writing or content generation.",
        "marketing": "This prompt is for marketing copy or business content.",
    }

    if is_further_optimization:
        user_message = f"""This prompt has ALREADY been optimized once. Now do a SECOND PASS to make it even better:

ALREADY-OPTIMIZED PROMPT:
{prompt}

Context: {task_context.get(task_type, task_context["general"])}

Focus on advanced refinements: better structure, more specific instructions, clearer output format, etc.

Provide your analysis in JSON format."""
    else:
        user_message = f"""Analyze and optimize this prompt for {task_type} tasks:

ORIGINAL PROMPT:
{prompt}

Context: {task_context.get(task_type, task_context["general"])}

Provide your analysis in JSON format."""

    try:
        result_text = chat(
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
            max_tokens=1500
        )

        # Try to parse JSON from response
        try:
            # Find JSON in response
            start = result_text.find("{")
            end = result_text.rfind("}") + 1
            if start >= 0 and end > start:
                result = json.loads(result_text[start:end])
            else:
                raise ValueError("No JSON found")
        except (json.JSONDecodeError, ValueError):
            # Fallback if JSON parsing fails
            result = {
                "optimized": prompt,
                "improvements": ["Analysis in progress..."],
                "score_before": 5,
                "score_after": 5,
                "tips": [result_text[:200]]
            }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


# Routes
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Render home page with tool selection."""
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/prompt", response_class=HTMLResponse)
async def prompt_page(request: Request):
    """Render Prompt Engineer page."""
    return templates.TemplateResponse(request=request, name="prompt.html")


@app.get("/agents", response_class=HTMLResponse)
async def agents_page(request: Request):
    """Render Custom AI Agents page."""
    return templates.TemplateResponse(request=request, name="agents.html")


@app.get("/rag", response_class=HTMLResponse)
async def rag_page(request: Request):
    """Render RAG Document Analysis page."""
    return templates.TemplateResponse(request=request, name="rag.html")


@app.get("/sql", response_class=HTMLResponse)
async def sql_page(request: Request):
    """Render NL to SQL page."""
    return templates.TemplateResponse(request=request, name="sql.html")


@app.get("/process", response_class=HTMLResponse)
async def process_page(request: Request):
    """Render Process Automation page."""
    return templates.TemplateResponse(request=request, name="process.html")


@app.get("/troubleshoot", response_class=HTMLResponse)
async def troubleshoot_page(request: Request):
    """Render Troubleshooting page."""
    return templates.TemplateResponse(request=request, name="troubleshoot.html")


@app.get("/reports", response_class=HTMLResponse)
async def reports_page(request: Request):
    """Render Reports Demo page."""
    return templates.TemplateResponse(request=request, name="reports.html")


@app.get("/orchestrator", response_class=HTMLResponse)
async def orchestrator_page(request: Request):
    """Render Multi-Agent Orchestrator page."""
    return templates.TemplateResponse(request=request, name="orchestrator.html")


@app.get("/mindlight", response_class=HTMLResponse)
async def mindlight_page(request: Request):
    """Render MindLight unified AI chat page."""
    return templates.TemplateResponse(request=request, name="mindlight.html")


@app.get("/support", response_class=HTMLResponse)
async def support_page(request: Request):
    """Render AI First-Level-Support page."""
    return templates.TemplateResponse(request=request, name="support.html")


@app.get("/mcp", response_class=HTMLResponse)
async def mcp_page(request: Request):
    """Render MCP Integration demo page."""
    return templates.TemplateResponse(request=request, name="mcp.html")


@app.get("/buergerservice", response_class=HTMLResponse)
async def buergerservice(request: Request):
    """Render Bürgerservice pitch page."""
    return templates.TemplateResponse(request=request, name="buergerservice.html")


@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    """Render about page."""
    return templates.TemplateResponse(request=request, name="about.html")


@app.get("/impressum", response_class=HTMLResponse)
async def impressum(request: Request):
    """Render impressum page."""
    return templates.TemplateResponse(request=request, name="impressum.html")


@app.get("/datenschutz", response_class=HTMLResponse)
async def datenschutz(request: Request):
    """Render privacy policy page."""
    return templates.TemplateResponse(request=request, name="datenschutz.html")


@app.get("/terms", response_class=HTMLResponse)
async def terms(request: Request):
    """Render terms of service page."""
    return templates.TemplateResponse(request=request, name="terms.html")


@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    """Render login page."""
    return templates.TemplateResponse(request=request, name="login.html")


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Render dashboard page (auth checked client-side)."""
    # Don't check auth server-side - let client-side JS handle it
    # This avoids redirect loop since token is in localStorage, not cookies
    return templates.TemplateResponse(request=request, name="dashboard.html")


@app.post("/api/optimize")
async def api_optimize(
    req: PromptRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Optimize a prompt."""
    if not req.prompt or len(req.prompt) < 10:
        raise HTTPException(status_code=400, detail="Prompt too short (min 10 chars)")

    if len(req.prompt) > 5000:
        raise HTTPException(status_code=400, detail="Prompt too long (max 5000 chars)")

    # Check usage limits
    user_id = str(user["id"]) if user else None
    anon_id = limiter.get_anonymous_id(request) if not user else None
    plan = user.get("plan", "free") if user else "free"

    allowed, used, limit = await limiter.check_and_increment(
        action="prompt",
        plan=plan,
        user_id=user_id,
        anon_id=anon_id
    )

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached ({used}/{limit} prompts). Upgrade to Pro for more."
        )

    result = await optimize_prompt(req.prompt, req.task_type, req.is_further_optimization)

    return {
        "status": "success",
        "original": req.prompt,
        "usage": {"used": used, "limit": limit},
        **result,
    }


@app.get("/api/templates")
async def get_templates():
    """Get prompt templates."""
    return {
        "templates": [
            {
                "id": "coding",
                "name": "Code Generation",
                "template": "Write a [LANGUAGE] function that [TASK]. Include error handling and comments. The function should [REQUIREMENTS].",
                "category": "coding",
            },
            {
                "id": "marketing",
                "name": "Marketing Copy",
                "template": "Write compelling marketing copy for [PRODUCT]. Target audience: [AUDIENCE]. Tone: [TONE]. Include a call-to-action for [GOAL].",
                "category": "marketing",
            },
            {
                "id": "creative",
                "name": "Creative Writing",
                "template": "Write a [LENGTH] [FORMAT] about [TOPIC]. Style: [STYLE]. Include [ELEMENTS]. The mood should be [MOOD].",
                "category": "creative",
            },
            {
                "id": "analysis",
                "name": "Data Analysis",
                "template": "Analyze [DATA] and provide insights on [METRICS]. Focus on [ASPECTS]. Present findings in [FORMAT] with actionable recommendations.",
                "category": "general",
            },
            {
                "id": "email",
                "name": "Professional Email",
                "template": "Write a professional email to [RECIPIENT] regarding [TOPIC]. Purpose: [PURPOSE]. Tone: [TONE]. Include [KEY_POINTS].",
                "category": "marketing",
            },
        ]
    }


@app.get("/api/tips")
async def get_tips():
    """Get prompt engineering tips."""
    return {
        "tips": [
            {
                "title": "Be Specific",
                "description": "The more specific your prompt, the better the output. Include details about format, length, and style.",
            },
            {
                "title": "Provide Context",
                "description": "Give the AI background information it needs to understand your request fully.",
            },
            {
                "title": "Use Examples",
                "description": "Show the AI what you want with examples. One-shot or few-shot prompting dramatically improves results.",
            },
            {
                "title": "Define the Role",
                "description": "Tell the AI who it should be: 'You are an expert developer...' or 'Act as a marketing specialist...'",
            },
            {
                "title": "Specify Output Format",
                "description": "Request specific formats: JSON, bullet points, paragraphs, tables, etc.",
            },
            {
                "title": "Iterate and Refine",
                "description": "Don't expect perfection on the first try. Refine your prompts based on the outputs you receive.",
            },
        ]
    }


@app.get("/api/llm-info")
async def llm_info():
    """Return current LLM provider info."""
    from app.llm import get_provider_info
    return get_provider_info()


@app.get("/health")
async def health():
    """Health check endpoint - also keeps Supabase alive."""
    try:
        supabase = get_supabase()
        supabase.table("users").select("id").limit(1).execute()
        db_status = "connected"
    except Exception:
        db_status = "error"

    return {
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/config")
async def get_config():
    """Get public configuration for frontend."""
    settings = get_settings()
    return {
        "supabase_url": settings.supabase_url,
        "supabase_anon_key": settings.supabase_anon_key
    }


class NewsletterSubscription(BaseModel):
    email: str


@app.post("/api/newsletter/subscribe")
async def subscribe_newsletter(subscription: NewsletterSubscription):
    """Subscribe to newsletter - stores email in Supabase."""
    import re

    email = subscription.email.strip().lower()

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    try:
        supabase = get_supabase()

        # Check if email already exists
        existing = supabase.table("newsletter_subscribers").select("id").eq("email", email).execute()

        if existing.data:
            return {"status": "already_subscribed", "message": "Email already subscribed"}

        # Insert new subscriber
        supabase.table("newsletter_subscribers").insert({
            "email": email,
            "subscribed_at": datetime.utcnow().isoformat(),
            "source": "website"
        }).execute()

        return {"status": "success", "message": "Successfully subscribed"}

    except Exception as e:
        # If table doesn't exist, log but don't fail
        print(f"Newsletter subscription error: {e}")
        return {"status": "success", "message": "Successfully subscribed"}


@app.get("/api/user")
async def get_user(user: dict = Depends(require_user)):
    """Get current user data."""
    # Get subscription status
    supabase = get_supabase()
    sub_result = supabase.table("subscriptions").select("status").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).limit(1).execute()

    subscription_status = sub_result.data[0]["status"] if sub_result.data else None

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "plan": user.get("plan", "free"),
        "created_at": user.get("created_at"),
        "subscription_status": subscription_status
    }


@app.get("/api/usage")
async def get_usage(
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Get usage statistics for current user or anonymous session."""
    user_id = str(user["id"]) if user else None
    anon_id = limiter.get_anonymous_id(request) if not user else None
    plan = user.get("plan", "free") if user else "free"

    usage = await limiter.get_usage(
        plan=plan,
        user_id=user_id,
        anon_id=anon_id
    )

    return {
        "plan": plan,
        "usage": usage
    }




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
