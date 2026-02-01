"""
AdStrong - AI Marketing Tools Platform
Includes: Prompt Engineer + Ad Creator
"""

import os
import json
import asyncio
import httpx
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

# Initialize FastAPI
app = FastAPI(
    title="AdStrong",
    description="AI-powered marketing tools platform",
    version="2.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates and static files
BASE_DIR = Path(__file__).parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Include payments router
app.include_router(payments_router)


# Models
class PromptRequest(BaseModel):
    prompt: str
    model: str = "claude-3-haiku"
    task_type: str = "general"  # general, coding, creative, marketing


class OptimizationResult(BaseModel):
    original: str
    optimized: str
    improvements: list[str]
    score_before: int
    score_after: int
    tips: list[str]


class AdRequest(BaseModel):
    business_name: str
    product: str
    audience: str
    usp: str = ""
    style: str = "modern"
    niche: str = "other"
    platforms: list[str] = ["instagram"]
    include_people: bool = True


class RegenerateRequest(BaseModel):
    prompt: str


def get_anthropic_client():
    """Get Anthropic client."""
    import anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    return anthropic.Anthropic(api_key=api_key)


async def optimize_prompt(prompt: str, task_type: str) -> dict[str, Any]:
    """Optimize a prompt using Claude."""
    client = get_anthropic_client()

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

    user_message = f"""Analyze and optimize this prompt for {task_type} tasks:

ORIGINAL PROMPT:
{prompt}

Context: {task_context.get(task_type, task_context["general"])}

Provide your analysis in JSON format."""

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        import json
        result_text = response.content[0].text

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
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/prompt", response_class=HTMLResponse)
async def prompt_page(request: Request):
    """Render Prompt Engineer page."""
    return templates.TemplateResponse("prompt.html", {"request": request})


@app.get("/ads", response_class=HTMLResponse)
async def ads_page(request: Request):
    """Render Ad Creator page."""
    return templates.TemplateResponse("ads.html", {"request": request})


@app.get("/pricing", response_class=HTMLResponse)
async def pricing(request: Request):
    """Render pricing page."""
    return templates.TemplateResponse("pricing.html", {"request": request})


@app.get("/impressum", response_class=HTMLResponse)
async def impressum(request: Request):
    """Render impressum page."""
    return templates.TemplateResponse("impressum.html", {"request": request})


@app.get("/datenschutz", response_class=HTMLResponse)
async def datenschutz(request: Request):
    """Render privacy policy page."""
    return templates.TemplateResponse("datenschutz.html", {"request": request})


@app.get("/terms", response_class=HTMLResponse)
async def terms(request: Request):
    """Render terms of service page."""
    return templates.TemplateResponse("terms.html", {"request": request})


@app.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    """Render login page."""
    return templates.TemplateResponse("login.html", {"request": request})


@app.get("/signup", response_class=HTMLResponse)
async def signup(request: Request):
    """Render signup page."""
    return templates.TemplateResponse("signup.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    """Render dashboard page (auth checked client-side)."""
    # Don't check auth server-side - let client-side JS handle it
    # This avoids redirect loop since token is in localStorage, not cookies
    return templates.TemplateResponse("dashboard.html", {"request": request})


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

    result = await optimize_prompt(req.prompt, req.task_type)

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


# Ad Creator API
async def generate_image_prompt(business_name: str, product: str, audience: str, usp: str, style: str, niche: str = "other", include_people: bool = True) -> str:
    """Use Claude to generate an image prompt for FLUX Pro."""
    client = get_anthropic_client()

    style_descriptions = {
        "modern": "clean, minimalist, professional, sleek design with subtle gradients",
        "bold": "high contrast, vibrant colors, strong typography, eye-catching",
        "minimal": "simple, elegant, lots of white space, understated",
        "playful": "fun, colorful, dynamic, energetic, playful elements"
    }

    # Niche-specific guidance for better image generation
    niche_guidance = {
        "fitness": "gym equipment, workout environment, athletic atmosphere, energy and motivation, modern fitness studio",
        "restaurant": "delicious food presentation, elegant table setting, warm restaurant ambiance, appetizing dishes, culinary excellence",
        "beauty": "luxurious spa atmosphere, beauty products, elegant salon interior, skincare and wellness, premium aesthetic",
        "ecommerce": "product showcase, clean product photography, lifestyle context, shopping appeal, premium packaging",
        "realestate": "stunning property exterior/interior, luxury living space, architectural beauty, dream home atmosphere",
        "coaching": "professional setting, success imagery, motivational atmosphere, achievement and growth, executive style",
        "tech": "modern technology, sleek devices, digital innovation, futuristic workspace, cutting-edge design",
        "other": "professional business setting, high-quality commercial photography"
    }

    style_desc = style_descriptions.get(style, style_descriptions["modern"])
    niche_desc = niche_guidance.get(niche, niche_guidance["other"])

    if include_people:
        people_rules = """CRITICAL RULES FOR PHOTOREALISM WITH PEOPLE:
- People should be shown in NATURAL, RELAXED poses (standing, sitting, walking naturally)
- Faces must look real: natural expressions, proper symmetry, realistic skin texture
- Hands must have exactly 5 fingers with normal proportions, natural nail shapes
- Bodies must have correct anatomy and proportions
- AVOID: twisted poses, unnatural angles, contorted limbs, exaggerated expressions
- AVOID: multiple people interacting (keep it simple - 1 person max)
- Lighting should be soft and natural, no harsh shadows on faces"""
    else:
        people_rules = """CRITICAL RULES - NO PEOPLE:
- DO NOT include any people, faces, or human body parts in the image
- Focus ONLY on: products, equipment, interiors, environments, objects, food, items
- Show the product/service environment without human presence
- Use atmospheric shots: equipment close-ups, interior views, product arrangements"""

    prompt = f"""Create a detailed image generation prompt for an advertisement.

Business: {business_name}
Industry: {niche}
Product/Service: {product}
Target Audience: {audience}
Unique Selling Point: {usp if usp else 'Not specified'}
Visual Style: {style_desc}
Industry-specific elements: {niche_desc}

Generate a prompt for creating a professional advertising image. The prompt should:
1. Describe a visually appealing scene that represents the product/service
2. Include industry-specific visual elements relevant to {niche}
3. Include the visual style elements
4. NOT include any text or logos in the image
5. Be suitable for social media advertising
6. Be 2-3 sentences, specific and detailed

{people_rules}

End the prompt with: "ultra photorealistic, 8K detail, shot on Canon EOS R5 with 85mm f/1.4 lens, natural soft lighting, anatomically correct, magazine quality advertisement"

Respond with ONLY the image prompt, nothing else."""

    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text.strip()


async def generate_ad_copy(business_name: str, product: str, audience: str, usp: str, variant: int) -> dict:
    """Use Claude to generate headline and copy for the ad."""
    client = get_anthropic_client()

    prompt = f"""Create advertising copy for a social media ad.

Business: {business_name}
Product/Service: {product}
Target Audience: {audience}
Unique Selling Point: {usp if usp else 'Quality and reliability'}
Variant: {variant} of 3 (make each variant unique in tone/approach)

Generate:
1. A compelling headline (max 10 words, attention-grabbing)
2. Ad copy (max 30 words, persuasive, includes call-to-action)

Respond in JSON format:
{{"headline": "...", "copy": "..."}}"""

    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}]
    )

    result_text = response.content[0].text.strip()

    try:
        start = result_text.find("{")
        end = result_text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(result_text[start:end])
    except:
        pass

    return {
        "headline": f"Discover {business_name}",
        "copy": f"The best {product} for {audience}. Try it today!"
    }


def generate_image_with_flux_sync(prompt: str) -> str:
    """Generate an image using FLUX Schnell via fal_client (synchronous)."""
    import fal_client

    fal_api_key = os.getenv("FAL_API_KEY")
    if not fal_api_key:
        raise HTTPException(status_code=500, detail="FAL API key not configured")

    os.environ["FAL_KEY"] = fal_api_key.strip()

    try:
        result = fal_client.subscribe(
            "fal-ai/flux/schnell",
            arguments={
                "prompt": prompt,
                "image_size": "square_hd",
                "num_images": 1
            }
        )

        if result and "images" in result and len(result["images"]) > 0:
            return result["images"][0]["url"]

        raise HTTPException(status_code=500, detail="No image generated")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


async def generate_image_with_flux(prompt: str) -> str:
    """Async wrapper for image generation."""
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, generate_image_with_flux_sync, prompt)


@app.post("/api/ads/generate")
async def generate_ads(
    req: AdRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Generate ad creatives using AI."""
    if not req.business_name or len(req.business_name) < 2:
        raise HTTPException(status_code=400, detail="Business name too short")

    if not req.product or len(req.product) < 5:
        raise HTTPException(status_code=400, detail="Product description too short")

    if not req.audience or len(req.audience) < 3:
        raise HTTPException(status_code=400, detail="Audience description too short")

    # Check usage limits
    user_id = str(user["id"]) if user else None
    anon_id = limiter.get_anonymous_id(request) if not user else None
    plan = user.get("plan", "free") if user else "free"

    allowed, used, limit = await limiter.check_and_increment(
        action="ad",
        plan=plan,
        user_id=user_id,
        anon_id=anon_id
    )

    if not allowed:
        period = "month" if plan == "pro" else "day"
        raise HTTPException(
            status_code=429,
            detail=f"Ad creation limit reached ({used}/{limit} per {period}). Upgrade to Pro for more."
        )

    try:
        ads = []

        # Generate 3 ad variants
        for i in range(3):
            # Generate image prompt with slight variation
            variation_suffix = ["", " with warm lighting", " with cool tones"][i]
            image_prompt = await generate_image_prompt(
                req.business_name,
                req.product,
                req.audience,
                req.usp,
                req.style,
                req.niche,
                req.include_people
            )
            image_prompt += variation_suffix

            # Generate image and copy in parallel
            image_url_task = generate_image_with_flux(image_prompt)
            copy_task = generate_ad_copy(
                req.business_name,
                req.product,
                req.audience,
                req.usp,
                i + 1
            )

            image_url, copy_data = await asyncio.gather(image_url_task, copy_task)

            ads.append({
                "image_url": image_url,
                "headline": copy_data["headline"],
                "copy": copy_data["copy"],
                "prompt_used": image_prompt
            })

        return {
            "status": "success",
            "ads": ads
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ad generation failed: {str(e)}")


@app.post("/api/ads/regenerate")
async def regenerate_ad(
    req: RegenerateRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Regenerate a single ad image using the same prompt."""
    if not req.prompt or len(req.prompt) < 10:
        raise HTTPException(status_code=400, detail="Invalid prompt")

    # Check regeneration limits
    user_id = str(user["id"]) if user else None
    anon_id = limiter.get_anonymous_id(request) if not user else None
    plan = user.get("plan", "free") if user else "free"

    allowed, used, limit = await limiter.check_and_increment(
        action="regenerate",
        plan=plan,
        user_id=user_id,
        anon_id=anon_id
    )

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Regeneration limit reached ({used}/{limit}). Upgrade to Pro for more."
        )

    try:
        image_url = await generate_image_with_flux(req.prompt)
        return {
            "status": "success",
            "image_url": image_url,
            "usage": {"used": used, "limit": limit}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regeneration failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
