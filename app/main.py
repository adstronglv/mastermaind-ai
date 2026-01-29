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
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

load_dotenv()

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
    platforms: list[str] = ["instagram"]


# In-memory usage tracking (replace with DB in production)
usage_tracker: dict[str, int] = {}
FREE_LIMIT = 10  # prompts per day


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


@app.post("/api/optimize")
async def api_optimize(req: PromptRequest):
    """Optimize a prompt."""
    if not req.prompt or len(req.prompt) < 10:
        raise HTTPException(status_code=400, detail="Prompt too short (min 10 chars)")

    if len(req.prompt) > 5000:
        raise HTTPException(status_code=400, detail="Prompt too long (max 5000 chars)")

    result = await optimize_prompt(req.prompt, req.task_type)

    return {
        "status": "success",
        "original": req.prompt,
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
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Ad Creator API
async def generate_image_prompt(business_name: str, product: str, audience: str, usp: str, style: str) -> str:
    """Use Claude to generate an image prompt for FLUX Pro."""
    client = get_anthropic_client()

    style_descriptions = {
        "modern": "clean, minimalist, professional, sleek design with subtle gradients",
        "bold": "high contrast, vibrant colors, strong typography, eye-catching",
        "minimal": "simple, elegant, lots of white space, understated",
        "playful": "fun, colorful, dynamic, energetic, playful elements"
    }

    style_desc = style_descriptions.get(style, style_descriptions["modern"])

    prompt = f"""Create a detailed image generation prompt for an advertisement.

Business: {business_name}
Product/Service: {product}
Target Audience: {audience}
Unique Selling Point: {usp if usp else 'Not specified'}
Visual Style: {style_desc}

Generate a prompt for creating a professional advertising image. The prompt should:
1. Describe a visually appealing scene that represents the product/service
2. Include the visual style elements
3. NOT include any text or logos in the image
4. Be suitable for social media advertising
5. Be 2-3 sentences, specific and detailed
6. IMPORTANT: Avoid showing hands or fingers prominently
7. Include CONTEXT and ENVIRONMENT - show relevant settings, equipment, tools, or props related to the business
8. Show ACTION or EMOTION - people doing something, not just standing, or show the mood/atmosphere
9. Include specific details about lighting, colors, and composition

End the prompt with: "professional photography, 8k, sharp focus, cinematic lighting"

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


async def generate_image_with_flux(prompt: str) -> str:
    """Generate an image using FLUX Schnell via fal.ai (fast mode)."""
    fal_api_key = os.getenv("FAL_API_KEY")
    if not fal_api_key:
        raise HTTPException(status_code=500, detail="FAL API key not configured")
    fal_api_key = fal_api_key.strip()

    async with httpx.AsyncClient(timeout=60.0) as client:
        # FLUX Schnell via queue API
        response = await client.post(
            "https://queue.fal.run/fal-ai/flux/schnell",
            headers={
                "Authorization": f"Key {fal_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "prompt": prompt,
                "image_size": "square_hd",
                "num_images": 1
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Image generation failed: {response.text}")

        result = response.json()

        # Check if queued
        if "request_id" in result:
            request_id = result["request_id"]

            # Poll for result (increased timeout for reliability)
            for _ in range(30):
                await asyncio.sleep(2)

                status_response = await client.get(
                    f"https://queue.fal.run/fal-ai/flux/schnell/requests/{request_id}/status",
                    headers={"Authorization": f"Key {fal_api_key}"}
                )

                if status_response.status_code == 200:
                    status_data = status_response.json()

                    if status_data.get("status") == "COMPLETED":
                        result_response = await client.get(
                            f"https://queue.fal.run/fal-ai/flux/schnell/requests/{request_id}",
                            headers={"Authorization": f"Key {fal_api_key}"}
                        )

                        if result_response.status_code == 200:
                            final_result = result_response.json()
                            if "images" in final_result and len(final_result["images"]) > 0:
                                return final_result["images"][0]["url"]

                    elif status_data.get("status") == "FAILED":
                        raise HTTPException(status_code=500, detail="Image generation failed")

            raise HTTPException(status_code=500, detail="Image generation timed out")

        # Direct response
        if "images" in result and len(result["images"]) > 0:
            return result["images"][0]["url"]

        raise HTTPException(status_code=500, detail="No image generated")


@app.post("/api/ads/generate")
async def generate_ads(req: AdRequest):
    """Generate ad creatives using AI."""
    if not req.business_name or len(req.business_name) < 2:
        raise HTTPException(status_code=400, detail="Business name too short")

    if not req.product or len(req.product) < 5:
        raise HTTPException(status_code=400, detail="Product description too short")

    if not req.audience or len(req.audience) < 3:
        raise HTTPException(status_code=400, detail="Audience description too short")

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
                req.style
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
