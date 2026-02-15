# Archived Features

This folder contains marketing-focused features that were temporarily removed to focus on government/enterprise use cases for Pro Arbeit presentation.

## Archived Features:

### 1. Brand DNA Analyzer (`brand-dna.html`)
- **Purpose:** Analyze brand identity, extract core values, generate messaging strategy
- **Target Audience:** Marketers, agencies, brands
- **Status:** 30-50% functional DEMO
- **Can be restored when:** Targeting marketer/agency clients

### 2. Campaign Blitz (`campaign.html`)
- **Purpose:** Generate complete marketing campaigns (ads, emails, social posts)
- **Target Audience:** Marketers, content creators, agencies
- **Status:** 30-50% functional DEMO
- **Can be restored when:** Targeting marketer/agency clients

## Why Removed?

For Pro Arbeit (government agency) presentation, these marketing features are not relevant.

**Government agencies need:**
- Database integration (SQL, RAG)
- Process automation
- Document analysis
- DSGVO compliance
- On-premise solutions

**Not:**
- Brand marketing
- Ad campaigns

## How to Restore:

1. Copy HTML files back to `app/templates/`
2. Add routes back to `app/main.py`:
```python
@app.get("/brand-dna", response_class=HTMLResponse)
async def brand_dna_page(request: Request):
    return templates.TemplateResponse("brand-dna.html", {"request": request})

@app.get("/campaign", response_class=HTMLResponse)
async def campaign_page(request: Request):
    return templates.TemplateResponse("campaign.html", {"request": request})
```
3. Add cards back to `index.html` Enterprise AI Lab section
4. Add translations to `index.html` (en/de sections)

---

**Archived:** 2026-02-15
**Reason:** Focus on Behörde-relevant features for job application
