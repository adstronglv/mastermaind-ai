"""
PromptEngineer - AI Prompt Optimization Platform
"""

import os
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
    title="PromptEngineer",
    description="AI-powered prompt optimization platform",
    version="1.0.0",
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
    """Render home page."""
    return templates.TemplateResponse("index.html", {"request": request})


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
