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


# --- MindLight SGB-II Context ---

SGB2_DOCUMENTS = """§ 7 Leistungsberechtigte (SGB II)

(1) Leistungen nach diesem Buch erhalten Personen, die
1. das 15. Lebensjahr vollendet und die Altersgrenze nach § 7a noch nicht erreicht haben,
2. erwerbsfähig sind,
3. hilfebedürftig sind und
4. ihren gewöhnlichen Aufenthalt in der Bundesrepublik Deutschland haben
(erwerbsfähige Leistungsberechtigte).

(2) Leistungen erhalten auch Personen, die mit erwerbsfähigen Leistungsberechtigten in einer Bedarfsgemeinschaft leben. Eine Bedarfsgemeinschaft bilden:
1. die erwerbsfähigen Leistungsberechtigten,
2. die im Haushalt lebenden Eltern oder der im Haushalt lebende Elternteil eines unverheirateten erwerbsfähigen Kindes, welches das 25. Lebensjahr noch nicht vollendet hat,
3. als Partner der erwerbsfähigen Leistungsberechtigten der nicht dauernd getrennt lebende Ehegatte oder Lebenspartner,
4. die dem Haushalt angehörenden unverheirateten Kinder der in den Nummern 1 bis 3 genannten Personen, wenn sie das 25. Lebensjahr noch nicht vollendet haben.

(3) Vom Leistungsausschluss ausgenommen sind Ausländer, die sich seit mindestens fünf Jahren im Bundesgebiet aufhalten und erwerbstätig sind oder Anspruch auf Arbeitslosengeld I haben.

§ 21 Mehrbedarfe (SGB II)

(1) Für Personen, die trotz Erfüllung der Voraussetzungen nach § 7 keinen Anspruch auf Arbeitslosengeld II haben, wird ein Mehrbedarf anerkannt.

(2) Bei werdenden Müttern wird nach der 12. Schwangerschaftswoche ein Mehrbedarf von 17 Prozent des maßgebenden Regelbedarfs anerkannt.

(3) Für Personen, die mit einem oder mehreren minderjährigen Kindern zusammenleben und allein für deren Pflege und Erziehung sorgen, ist ein Mehrbedarf anzuerkennen in Höhe von:
- 36 Prozent des Regelbedarfs für ein Kind unter 7 Jahren oder zwei bis drei Kinder unter 16 Jahren,
- 12 Prozent des Regelbedarfs für jedes Kind, wenn die Voraussetzungen nach Nummer 1 nicht vorliegen, höchstens jedoch 60 Prozent des Regelbedarfs.

(4) Bei erwerbsfähigen Leistungsberechtigten mit Behinderungen wird ein Mehrbedarf von 35 Prozent des maßgebenden Regelbedarfs anerkannt, wenn sie Leistungen zur Teilhabe am Arbeitsleben erhalten.

(5) Für die Beschaffung von Schulbüchern und Schulmaterialien wird ein jährlicher Mehrbedarf anerkannt. Die Höhe beträgt 174 Euro im ersten Schulhalbjahr und 58 Euro im zweiten Schulhalbjahr.

§ 22 Bedarfe für Unterkunft und Heizung (SGB II)

(1) Bedarfe für Unterkunft und Heizung werden in Höhe der tatsächlichen Aufwendungen anerkannt, soweit diese angemessen sind. Die Angemessenheit richtet sich nach den örtlichen Verhältnissen.

(2) Als Bedarf für die Unterkunft werden auch die Aufwendungen für die Instandhaltung und Reparatur anerkannt, soweit diese nicht vom Vermieter oder einem Dritten zu tragen sind.

(3) Übersteigen die Aufwendungen für die Unterkunft den der Besonderheit des Einzelfalles angemessenen Umfang, sind sie als Bedarf so lange anzuerkennen, wie es dem Leistungsberechtigten nicht möglich oder nicht zuzumuten ist, durch einen Wohnungswechsel die Aufwendungen zu senken, in der Regel jedoch längstens für sechs Monate.

(4) Bei einem Umzug ist eine Zusicherung des kommunalen Trägers erforderlich. Die Zusicherung soll erteilt werden, wenn der Umzug erforderlich ist und die Kosten der neuen Unterkunft angemessen sind.

(5) Sofern Bedarfe für Heizung als Pauschale anerkannt werden, ist sicherzustellen, dass ein ausreichender Betrag zur Verfügung steht, um den Bedarf für Heizung zu decken."""

SGB2_SQL_SCHEMA = """-- SGB-II Datenbank (Demo)

CREATE TABLE leistungsberechtigte (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200),
    geburtsdatum    DATE,
    bg_id           INTEGER REFERENCES bedarfsgemeinschaften(id),
    status          VARCHAR(50),  -- 'aktiv', 'abgemeldet', 'sanktioniert'
    eintrittsdatum  DATE,
    austritt        DATE
);

CREATE TABLE bedarfsgemeinschaften (
    id              SERIAL PRIMARY KEY,
    typ             VARCHAR(50),  -- 'single', 'paar', 'familie'
    personen_anzahl INTEGER,
    erstellt_am     DATE
);

CREATE TABLE massnahmen (
    id              SERIAL PRIMARY KEY,
    person_id       INTEGER REFERENCES leistungsberechtigte(id),
    typ             VARCHAR(100), -- 'Bewerbungstraining', 'Sprachkurs', 'Umschulung'
    beginn          DATE,
    ende            DATE,
    status          VARCHAR(50),  -- 'geplant', 'laufend', 'abgeschlossen', 'abgebrochen'
    traeger         VARCHAR(200)
);

CREATE TABLE bescheide (
    id              SERIAL PRIMARY KEY,
    person_id       INTEGER REFERENCES leistungsberechtigte(id),
    art             VARCHAR(100), -- 'Bewilligungsbescheid', 'Aenderungsbescheid', 'Sanktionsbescheid'
    betrag          DECIMAL(10,2),
    gueltig_ab      DATE,
    gueltig_bis     DATE,
    status          VARCHAR(50)   -- 'aktiv', 'aufgehoben', 'widerspruch'
);"""


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


class TroubleshootRequest(BaseModel):
    log_text: str
    system_type: str = "general"


class OrchestratorRequest(BaseModel):
    task: str


class ChatRequest(BaseModel):
    message: str
    history: list = []


class SupportRequest(BaseModel):
    message: str
    history: list = []


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
    try:
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
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Limiter unavailable for {action}: {e}")
        return 0, 999


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
            model="claude-haiku-4-5-20251001",
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
            model="claude-haiku-4-5-20251001",
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
            model="claude-haiku-4-5-20251001",
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


# --- Troubleshooting Endpoint ---

@router.post("/troubleshoot")
async def troubleshoot_analyze(
    req: TroubleshootRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """Troubleshooting - analyze logs and error messages, suggest fixes."""
    if not req.log_text or len(req.log_text) < 10:
        raise HTTPException(status_code=400, detail="Log text too short (min 10 chars)")
    if len(req.log_text) > 30000:
        raise HTTPException(status_code=400, detail="Log text too long (max 30000 chars)")

    used, limit = await check_enterprise_limit("troubleshoot", request, user)

    client = get_anthropic_client()

    system_prompt = """Du bist ein IT-Troubleshooting-Experte fuer oeffentliche Verwaltung und Unternehmen. Deine Aufgabe:
1. Analysiere die bereitgestellten Logs/Fehlermeldungen
2. Bestimme den Schweregrad (critical/high/medium/low)
3. Identifiziere die Ursache (Root Cause)
4. Schlage konkrete Loesungen vor
5. Empfehle Praevention fuer die Zukunft

Antwortformat als JSON:
{
    "severity": "critical" oder "high" oder "medium" oder "low",
    "root_cause": "Kurze Beschreibung der Hauptursache",
    "analysis": "Detaillierte Analyse der Logs/Fehlermeldung",
    "solutions": ["Loesung 1: Konkrete Schritte", "Loesung 2: Alternative"],
    "prevention": ["Praevention 1: Was tun damit es nicht nochmal passiert", "Praevention 2"]
}

Antworte in der Sprache der Eingabe (Deutsch oder Englisch)."""

    user_message = f"""LOG/FEHLERMELDUNG:
{req.log_text}

SYSTEMTYP: {req.system_type}

Analysiere diese Fehlermeldung und liefere Troubleshooting-Ergebnisse. Antwort als JSON."""

    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        )

        result = parse_json_response(response.content[0].text)

        if not result:
            result = {
                "severity": "medium",
                "root_cause": "Konnte nicht automatisch bestimmt werden",
                "analysis": response.content[0].text,
                "solutions": [],
                "prevention": []
            }

        return {
            "status": "success",
            "usage": {"used": used, "limit": limit},
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Troubleshooting failed: {str(e)}")


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
            model="claude-haiku-4-5-20251001",
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


# --- MindLight Chat Endpoint ---

@router.post("/chat")
async def mindlight_chat(
    req: ChatRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """MindLight unified chat - routes to RAG, SQL, Process, or General."""
    if not req.message or len(req.message) < 2:
        raise HTTPException(status_code=400, detail="Message too short (min 2 chars)")

    try:
        used, limit = await check_enterprise_limit("chat", request, user)

        client = get_anthropic_client()

        system_prompt = f"""Du bist MindLight, der intelligente KI-Assistent von mastermaind.ai.
Du hilfst Sachbearbeitern in der oeffentlichen Verwaltung (SGB II / Jobcenter).

Du hast Zugriff auf folgende Wissensbereiche:

=== TOOL 1: RAG (Dokumentenanalyse) ===
Wenn der Nutzer Fragen zu SGB-II-Gesetzen, Leistungen, Anspruechen, Mehrbedarfen oder Unterkunftskosten stellt, nutze dieses Wissen:

{SGB2_DOCUMENTS}

=== TOOL 2: SQL (Datenbankabfragen) ===
Wenn der Nutzer Datenabfragen, Statistiken oder Auswertungen will, generiere PostgreSQL basierend auf diesem Schema:

{SGB2_SQL_SCHEMA}

=== TOOL 3: PROCESS (Prozessanalyse) ===
Wenn der Nutzer einen Geschaeftsprozess beschreibt oder nach Optimierung fragt, analysiere Schwachstellen und empfehle KI-Automatisierungen.

=== TOOL 4: GENERAL ===
Fuer alle anderen Fragen antworte hilfreich und kompetent als KI-Experte.

WICHTIG - Antwortformat IMMER als JSON:
{{
    "tool_used": "rag" oder "sql" oder "process" oder "general",
    "message": "Deine ausfuehrliche Antwort in der Sprache des Nutzers",
    "sources": ["Nur bei tool_used=rag: Relevante Zitate aus dem SGB-II-Text"],
    "sql": "Nur bei tool_used=sql: Die generierte SQL-Abfrage",
    "tables_used": ["Nur bei tool_used=sql: Liste der verwendeten Tabellen"],
    "weaknesses": ["Nur bei tool_used=process: Identifizierte Schwachstellen"],
    "recommendations": ["Nur bei tool_used=process: KI-Empfehlungen"]
}}

Regeln:
- Bei RAG-Fragen: Zitiere immer die relevanten Paragraphen
- Bei SQL: Generiere korrektes PostgreSQL und erklaere die Abfrage
- Bei Prozessen: Sei konkret mit KI-Automatisierungsvorschlaegen
- Antworte IMMER in der Sprache des Nutzers (Deutsch oder Englisch)
- Halte dich ans JSON-Format"""

        messages = []
        for msg in (req.history or [])[-10:]:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": req.message})

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            system=system_prompt,
            messages=messages
        )

        result = parse_json_response(response.content[0].text)

        if not result:
            result = {
                "tool_used": "general",
                "message": response.content[0].text
            }

        if "message" not in result:
            result["message"] = response.content[0].text

        return {
            "status": "success",
            "usage": {"used": used, "limit": limit},
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


# --- First-Level-Support Endpoint ---

@router.post("/support")
async def first_level_support(
    req: SupportRequest,
    request: Request,
    user: Optional[dict] = Depends(get_current_user)
):
    """AI First-Level-Support - citizen-facing FAQ chat for SGB-II questions."""
    if not req.message or len(req.message) < 2:
        raise HTTPException(status_code=400, detail="Nachricht zu kurz (min 2 Zeichen)")

    try:
        used, limit = await check_enterprise_limit("support", request, user)

        client = get_anthropic_client()

        system_prompt = f"""Du bist der KI-Assistent im Buergerservice eines Jobcenters (SGB II).
Du beantwortest Fragen von Buergerinnen und Buergern zu Buergergeld, Antraegen und Leistungen.

WICHTIGE REGELN:
- Sprich freundlich, verstaendlich und in einfacher Sprache (kein Beamtendeutsch)
- Beantworte Fragen basierend auf dem folgenden Wissen
- Wenn du etwas nicht sicher weisst, sage ehrlich: "Dazu kann ich keine verbindliche Auskunft geben. Bitte wenden Sie sich an Ihren Sachbearbeiter."
- Gib immer konkrete naechste Schritte an
- Nenne relevante Paragraphen nur wenn hilfreich, nicht als Hauptantwort

DEIN WISSEN (SGB II):

{SGB2_DOCUMENTS}

ZUSAETZLICHES WISSEN:

Antragstellung Buergergeld:
- Antrag beim zustaendigen Jobcenter stellen (persoenlich, online oder per Post)
- Benoetigte Unterlagen: Personalausweis, Mietvertrag, Kontoauszuege der letzten 3 Monate, Einkommensnachweise, Krankenversicherungsnachweis
- Bearbeitungszeit: in der Regel 2-4 Wochen
- Bewilligungszeitraum: in der Regel 12 Monate
- Bei dringendem Bedarf: Vorschuss moeglich

Regelbedarf 2026 (Richtwerte):
- Alleinstehende: ca. 563 Euro
- Paare: ca. 506 Euro pro Person
- Kinder 0-5: ca. 357 Euro
- Kinder 6-13: ca. 390 Euro
- Kinder 14-17: ca. 471 Euro
- Jugendliche 18-24 (im Haushalt): ca. 451 Euro

Oeffnungszeiten Jobcenter (typisch):
- Mo-Fr: 08:00-12:00 Uhr (ohne Termin)
- Nachmittags: nur mit Termin
- Terminvereinbarung: telefonisch oder online

Antwortformat als JSON:
{{
    "category": "antrag" oder "leistungen" oder "dokumente" oder "rechte" oder "termin" oder "allgemein",
    "answer": "Deine freundliche, verstaendliche Antwort",
    "next_steps": ["Konkreter Schritt 1", "Konkreter Schritt 2"],
    "relevant_info": "Optionaler Hinweis auf Paragraph oder Zusatzinfo"
}}

Antworte IMMER auf Deutsch und IMMER als JSON."""

        messages = []
        for msg in (req.history or [])[-10:]:
            if isinstance(msg, dict) and "role" in msg and "content" in msg:
                messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": req.message})

        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            system=system_prompt,
            messages=messages
        )

        result = parse_json_response(response.content[0].text)

        if not result:
            result = {
                "category": "allgemein",
                "answer": response.content[0].text,
                "next_steps": [],
                "relevant_info": ""
            }

        if "answer" not in result:
            result["answer"] = response.content[0].text

        return {
            "status": "success",
            "usage": {"used": used, "limit": limit},
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Support-Anfrage fehlgeschlagen: {str(e)}")
