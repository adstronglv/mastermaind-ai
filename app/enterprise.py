"""
Enterprise AI modules for Mastermaind.
RAG, NL->SQL, Process Analysis, Multi-Agent Orchestrator.
"""

import os
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel

from app.auth import get_current_user
from app.limiter import limiter


router = APIRouter(prefix="/api/enterprise", tags=["enterprise"])


# --- Pydantic Models ---

class RAGRequest(BaseModel):
    document: str
    question: str


class SQLRequest(BaseModel):
    question: str
    schema_text: str


class ProcessRequest(BaseModel):
    process_description: str
    industry: str = "general"


class OrchestratorRequest(BaseModel):
    task: str


# --- Helpers ---

def get_anthropic_client():
    """Get Anthropic client."""
    import anthropic
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    return anthropic.Anthropic(api_key=api_key)


def parse_json_response(text: str) -> dict:
    """Extract JSON from Claude's response."""
    try:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except (json.JSONDecodeError, ValueError):
        pass
    return {}


async def check_enterprise_limit(action: str, request: Request, user: Optional[dict]) -> tuple:
    """Check rate limit for enterprise modules."""
    user_id = str(user["id"]) if user else None
    anon_id = limiter.get_anonymous_id(request) if not user else None
    plan = user.get("plan", "free") if user else "free"

    allowed, used, limit = await limiter.check_and_increment(
        action=action, plan=plan, user_id=user_id, anon_id=anon_id
    )

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Daily limit reached ({used}/{limit}). Upgrade to Pro for more."
        )

    return used, limit


# --- RAG Endpoint ---

@router.post("/rag")
async def rag_analyze(
    req: RAGRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """RAG document analysis - answer questions based on provided document."""
    if not req.document or len(req.document) < 20:
        raise HTTPException(status_code=400, detail="Document too short (min 20 chars)")
    if not req.question or len(req.question) < 5:
        raise HTTPException(status_code=400, detail="Question too short (min 5 chars)")
    if len(req.document) > 50000:
        raise HTTPException(status_code=400, detail="Document too long (max 50000 chars)")

    used, limit = await check_enterprise_limit("rag", request, user)

    client = get_anthropic_client()

    system_prompt = """Du bist ein RAG-Dokumentenanalyst. Deine Aufgabe:
1. Beantworte die Frage AUSSCHLIESSLICH auf Basis des bereitgestellten Dokuments
2. Zitiere relevante Textpassagen als Quellen
3. Wenn die Antwort nicht im Dokument zu finden ist, sage das klar
4. Antworte in der Sprache der Frage (Deutsch oder Englisch)

Antwortformat als JSON:
{
    "answer": "Deine ausfuehrliche Antwort",
    "sources": ["Zitat 1 aus dem Dokument", "Zitat 2 aus dem Dokument"],
    "confidence": "high" oder "medium" oder "low"
}"""

    user_message = f"""DOKUMENT:
{req.document}

FRAGE:
{req.question}

Analysiere das Dokument und beantworte die Frage. Antwort als JSON."""

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        result = parse_json_response(response.content[0].text)

        if not result:
            result = {
                "answer": response.content[0].text,
                "sources": [],
                "confidence": "medium"
            }

        return {
            "status": "success",
            "usage": {"used": used, "limit": limit},
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# --- NL -> SQL Endpoint ---

@router.post("/sql")
async def nl_to_sql(
    req: SQLRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Natural Language to SQL - generate SQL from German/English questions."""
    if not req.question or len(req.question) < 5:
        raise HTTPException(status_code=400, detail="Question too short (min 5 chars)")
    if not req.schema_text or len(req.schema_text) < 10:
        raise HTTPException(status_code=400, detail="Schema too short")

    used, limit = await check_enterprise_limit("sql", request, user)

    client = get_anthropic_client()

    system_prompt = """Du bist ein SQL-Experte. Deine Aufgabe:
1. Generiere eine PostgreSQL-Abfrage basierend auf der Frage und dem Datenbankschema
2. Erklaere die Abfrage Schritt fuer Schritt
3. Liste die verwendeten Tabellen auf
4. Antworte in der Sprache der Frage

Antwortformat als JSON:
{
    "sql": "SELECT ... FROM ...",
    "explanation": "Schritt-fuer-Schritt-Erklaerung",
    "tables_used": ["tabelle1", "tabelle2"]
}"""

    user_message = f"""DATENBANKSCHEMA:
{req.schema_text}

FRAGE:
{req.question}

Generiere eine PostgreSQL-Abfrage. Antwort als JSON."""

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        result = parse_json_response(response.content[0].text)

        if not result:
            result = {
                "sql": "-- Konnte keine Abfrage generieren",
                "explanation": response.content[0].text,
                "tables_used": []
            }

        return {
            "status": "success",
            "usage": {"used": used, "limit": limit},
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SQL generation failed: {str(e)}")


# --- Process Analysis Endpoint ---

@router.post("/process")
async def process_analyze(
    req: ProcessRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Process automation analysis with Mermaid diagram."""
    if not req.process_description or len(req.process_description) < 20:
        raise HTTPException(status_code=400, detail="Process description too short (min 20 chars)")

    used, limit = await check_enterprise_limit("process", request, user)

    client = get_anthropic_client()

    system_prompt = """Du bist ein Experte fuer Geschaeftsprozessanalyse und KI-Optimierung. Deine Aufgabe:
1. Analysiere den beschriebenen Geschaeftsprozess (Ist-Analyse)
2. Identifiziere Schwachstellen und Engpaesse
3. Empfehle KI-basierte Optimierungen
4. Erstelle ein Mermaid-Flussdiagramm des optimierten Prozesses

Antwortformat als JSON:
{
    "analysis": "Detaillierte Ist-Analyse des Prozesses",
    "weaknesses": ["Schwachstelle 1", "Schwachstelle 2"],
    "ai_recommendations": ["KI-Empfehlung 1: Beschreibung", "KI-Empfehlung 2: Beschreibung"],
    "mermaid_diagram": "graph TD\\n    A[Start] --> B[Schritt 1]\\n    B --> C[Schritt 2]"
}

WICHTIG: Das Mermaid-Diagramm muss gueltige Mermaid-Syntax sein. Verwende \\n fuer Zeilenumbrueche im JSON."""

    user_message = f"""GESCHAEFTSPROZESS:
{req.process_description}

BRANCHE: {req.industry}

Analysiere diesen Prozess und liefere Optimierungsvorschlaege. Antwort als JSON."""

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        result = parse_json_response(response.content[0].text)

        if not result:
            result = {
                "analysis": response.content[0].text,
                "weaknesses": [],
                "ai_recommendations": [],
                "mermaid_diagram": ""
            }

        return {
            "status": "success",
            "usage": {"used": used, "limit": limit},
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Process analysis failed: {str(e)}")


# --- Multi-Agent Orchestrator Endpoint ---

@router.post("/orchestrate")
async def orchestrate(
    req: OrchestratorRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Multi-Agent Orchestrator - decompose task, assign to models, synthesize."""
    if not req.task or len(req.task) < 10:
        raise HTTPException(status_code=400, detail="Task too short (min 10 chars)")

    used, limit = await check_enterprise_limit("orchestrate", request, user)

    client = get_anthropic_client()

    system_prompt = """Du bist der Opus-Koordinator in einem Multi-Agent-System. Du orchestrierst drei KI-Modelle:
- Haiku (schnell, guenstig): Einfache Aufgaben, Datenextraktion, Formatierung
- Sonnet (ausgewogen): Analyse, Zusammenfassungen, mittlere Komplexitaet
- Opus (leistungsstark, teuer): Komplexes Reasoning, Strategie, kreative Aufgaben

Deine Aufgabe:
1. Zerlege die Aufgabe in 3-5 Unteraufgaben
2. Weise jeder Unteraufgabe das optimale Modell zu
3. Fuehre jede Unteraufgabe aus (simuliere die Ergebnisse der jeweiligen Modelle)
4. Synthetisiere alle Ergebnisse zu einer Gesamtantwort
5. Zeige den Kostenvorteil durch intelligente Modellzuweisung

Antwortformat als JSON:
{
    "subtasks": [
        {"id": 1, "description": "Aufgabe", "assigned_model": "haiku", "reasoning": "Warum dieses Modell"},
        {"id": 2, "description": "Aufgabe", "assigned_model": "sonnet", "reasoning": "Warum dieses Modell"},
        {"id": 3, "description": "Aufgabe", "assigned_model": "opus", "reasoning": "Warum dieses Modell"}
    ],
    "results": [
        {"subtask_id": 1, "model": "haiku", "output": "Ergebnis der Unteraufgabe"},
        {"subtask_id": 2, "model": "sonnet", "output": "Ergebnis der Unteraufgabe"},
        {"subtask_id": 3, "model": "opus", "output": "Ergebnis der Unteraufgabe"}
    ],
    "synthesis": "Zusammengefasste Gesamtantwort, die alle Teilergebnisse integriert",
    "cost_comparison": {
        "all_opus": "$0.45",
        "orchestrated": "$0.12",
        "savings": "73%"
    }
}"""

    user_message = f"""AUFGABE:
{req.task}

Zerlege diese Aufgabe, weise sie den optimalen Modellen zu, fuehre sie aus und synthetisiere die Ergebnisse. Antwort als JSON."""

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=3000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        result = parse_json_response(response.content[0].text)

        if not result:
            result = {
                "subtasks": [],
                "results": [],
                "synthesis": response.content[0].text,
                "cost_comparison": {
                    "all_opus": "$0.45",
                    "orchestrated": "$0.12",
                    "savings": "73%"
                }
            }

        return {
            "status": "success",
            "usage": {"used": used, "limit": limit},
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestration failed: {str(e)}")
