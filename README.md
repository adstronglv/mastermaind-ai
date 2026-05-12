# mastermAInd.ai — Web Application

Source code for [mastermaind.ai](https://mastermaind.ai). FastAPI + Jinja2 + Tailwind, deployed on Render with Supabase as auth and database backend.

> **Honest status:** This is a multi-tool AI demo platform in active development.
> - **Production-ready & live:** Prompt Optimizer (`/api/optimize`, Anthropic Claude API)
> - **UI built, backend in progress:** RAG (MindLight), NL-to-SQL, Multi-Agent Orchestrator, Process Analyzer, Troubleshoot, MCP demo page. Frontends are deployed; backend implementations are being lifted from my local agent system (Triple Alpha) which uses Ollama with nomic-embed-text and sqlcoder.

## What runs today on mastermaind.ai

| Route | Status | What it does |
|-------|--------|--------------|
| `/` | Live | Landing page |
| `/prompt` + `POST /api/optimize` | **Live + functional** | Prompt Optimizer: takes a user prompt, returns improved version with score before/after, explained improvements, tips. Backed by Anthropic Claude. |
| `/rag`, `/mindlight` | UI only | Document Q&A frontend. Backend integration pending. |
| `/sql` | UI only | NL-to-SQL frontend. Backend integration pending. |
| `/agents`, `/orchestrator` | UI only | Multi-agent demo frontend. Backend integration pending. |
| `/process`, `/troubleshoot`, `/reports` | UI only | Frontends. Backend integration pending. |
| `/mcp` | Explainer page | Conceptual explainer of Model Context Protocol (no MCP server implemented). |
| `/login`, `/dashboard` | Live | Supabase-backed auth + per-plan rate-limit dashboard. |

## Stack

- **Web:** FastAPI (Python 3.11), Jinja2 templates, Tailwind CSS
- **Auth/DB:** Supabase (Postgres + JWT)
- **LLM:** Anthropic Claude (Haiku 4.5 default), with abstraction for swapping in Ollama on-premise
- **Deployment:** Docker → Render, custom domain with TLS
- **Keep-alive:** External cron (every 5 min) pings health endpoint to keep Render free tier awake

## Why this exists

This is my portfolio platform — the visible side of the AI work I've been doing since mid-2025 alongside a full-time aviation operations job at DHL Frankfurt. The deeper engineering (RAG with embeddings, NL-to-SQL with sqlcoder, multi-agent orchestration) is in a local Triple Alpha agent system that I'm progressively connecting as backend services here.

If you want to see the focused engineering examples that **are** public:
- [rag-fastapi-cloud-onprem](https://github.com/adstronglv/rag-fastapi-cloud-onprem) — Cloud↔On-Premise LLM switch, Document Q&A demo
- [mastermAind-showcase](https://github.com/adstronglv/mastermAind-showcase) — Architecture documentation

## Author

Aliaksandr Belafostau — currently transitioning from operational logistics work (DHL Airways Frankfurt, deputy supervisor Network Control) into AI implementation roles.

- Live: [mastermaind.ai](https://mastermaind.ai)
- Email: info@mastermaind.ai
- LinkedIn: [Aliaksandr Belafostau](https://www.linkedin.com/in/aliaksandr-belafostau-a793393aa)
