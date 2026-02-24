/**
 * Mastermaind Process Automation Analysis
 */

let currentLanguage = localStorage.getItem('mastermaind_lang') || 'en';

// Demo processes
const demoProcesses = {
    en: {
        antrag: `Benefits Application Process (SGB II):

1. Client submits application at reception
2. Reception checks if all documents are present (ID, income proof, rental contract)
3. If documents incomplete: client gets a list, must return later
4. Application is registered in comp.ASS system manually
5. File is placed in physical inbox of assigned case worker
6. Case worker reviews application (average wait: 2 weeks)
7. Case worker requests additional documents if needed (by letter)
8. Client sends documents by post
9. Benefit calculation done manually in Excel
10. Decision entered into comp.ASS
11. Benefit notice printed and sent by post
12. Client receives notice after 3-5 business days`,

        onboarding: `Employee Onboarding Process:

1. HR receives signed contract
2. HR creates employee profile in SAP manually
3. IT receives ticket via email to set up workstation
4. IT creates Active Directory account, email, VPN access (1-2 days)
5. Department head is informed by email
6. On first day: employee goes to reception, gets badge
7. Employee receives paper folder with policies, org chart
8. IT sets up laptop at desk (30 min)
9. Department head gives introduction tour
10. Employee fills out tax forms, insurance paperwork (paper)
11. Training schedule is created manually in Outlook
12. After 1 week: HR checks if everything is set up`
    },
    de: {
        antrag: `Leistungsantrag-Prozess (SGB II):

1. Kunde gibt Antrag am Empfang ab
2. Empfang prüft ob alle Dokumente vorhanden sind (Ausweis, Einkommensnachweis, Mietvertrag)
3. Bei fehlenden Unterlagen: Kunde bekommt eine Liste, muss wiederkommen
4. Antrag wird manuell im comp.ASS-System erfasst
5. Akte wird in das physische Postfach des zuständigen Sachbearbeiters gelegt
6. Sachbearbeiter prüft den Antrag (durchschnittliche Wartezeit: 2 Wochen)
7. Sachbearbeiter fordert ggf. weitere Unterlagen an (per Brief)
8. Kunde sendet Unterlagen per Post
9. Leistungsberechnung wird manuell in Excel durchgeführt
10. Entscheidung wird in comp.ASS eingetragen
11. Bescheid wird ausgedruckt und per Post versendet
12. Kunde erhält Bescheid nach 3-5 Werktagen`,

        onboarding: `Mitarbeiter-Onboarding-Prozess:

1. HR erhält unterschriebenen Vertrag
2. HR legt Mitarbeiterprofil manuell in SAP an
3. IT erhält Ticket per E-Mail für Arbeitsplatzeinrichtung
4. IT erstellt Active-Directory-Konto, E-Mail, VPN-Zugang (1-2 Tage)
5. Abteilungsleiter wird per E-Mail informiert
6. Am ersten Tag: Mitarbeiter geht zum Empfang, bekommt Ausweis
7. Mitarbeiter erhält Papiermappe mit Richtlinien, Organigramm
8. IT richtet Laptop am Platz ein (30 Min)
9. Abteilungsleiter gibt Einführungstour
10. Mitarbeiter füllt Steuerformulare und Versicherungspapiere aus (Papier)
11. Schulungsplan wird manuell in Outlook erstellt
12. Nach 1 Woche: HR prüft ob alles eingerichtet ist`
    }
};

// Translations
const translations = {
    en: {
        badge_text: "Process Automation",
        hero_title: "Process Automation Analysis",
        hero_subtitle: "Describe a business process. AI analyzes weaknesses, recommends optimizations, and generates a flow diagram.",
        step1_title: "Process Description",
        demo_antrag: "Benefits Application",
        demo_onboarding: "Employee Onboarding",
        placeholder_process: "Describe the business process step by step...",
        step2_title: "Industry",
        ind_public: "Public Sector / Government",
        ind_health: "Healthcare",
        ind_finance: "Finance & Banking",
        ind_manufacturing: "Manufacturing",
        ind_retail: "Retail & E-Commerce",
        ind_general: "General / Other",
        analyze_btn: "Analyze Process",
        analyzing_btn: "Analyzing...",
        result_analysis: "Current State Analysis",
        result_weaknesses: "Weaknesses & Bottlenecks",
        result_recommendations: "AI Recommendations",
        result_diagram: "Optimized Process Flow",
        usage_remaining: "{n} analyses remaining today",
        usage_limit: "Daily limit reached. Try again tomorrow!"
    },
    de: {
        badge_text: "Prozessautomatisierung",
        hero_title: "Prozessautomatisierungs-Analyse",
        hero_subtitle: "Beschreiben Sie einen Geschäftsprozess. Die KI analysiert Schwachstellen, empfiehlt Optimierungen und generiert ein Flussdiagramm.",
        step1_title: "Prozessbeschreibung",
        demo_antrag: "Leistungsantrag",
        demo_onboarding: "Mitarbeiter-Onboarding",
        placeholder_process: "Beschreiben Sie den Geschäftsprozess Schritt für Schritt...",
        step2_title: "Branche",
        ind_public: "Öffentlicher Sektor / Verwaltung",
        ind_health: "Gesundheitswesen",
        ind_finance: "Finanzen & Banking",
        ind_manufacturing: "Fertigung / Produktion",
        ind_retail: "Einzelhandel & E-Commerce",
        ind_general: "Allgemein / Andere",
        analyze_btn: "Prozess analysieren",
        analyzing_btn: "Analysiere...",
        result_analysis: "Ist-Analyse",
        result_weaknesses: "Schwachstellen & Engpässe",
        result_recommendations: "KI-Empfehlungen",
        result_diagram: "Optimierter Prozessablauf",
        usage_remaining: "{n} Analysen heute übrig",
        usage_limit: "Tageslimit erreicht. Versuchen Sie es morgen wieder!"
    }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
    applyLanguage(currentLanguage);
    updateUsageDisplay();
});

// Language
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('mastermaind_lang', lang);
    applyLanguage(lang);

    document.getElementById('lang-en').classList.toggle('bg-pink-500', lang === 'en');
    document.getElementById('lang-en').classList.toggle('text-white', lang === 'en');
    document.getElementById('lang-en').classList.toggle('text-gray-400', lang !== 'en');
    document.getElementById('lang-de').classList.toggle('bg-pink-500', lang === 'de');
    document.getElementById('lang-de').classList.toggle('text-white', lang === 'de');
    document.getElementById('lang-de').classList.toggle('text-gray-400', lang !== 'de');
}

function applyLanguage(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
    updateUsageDisplay();
}

// Demo loading
function loadProcessDemo(key) {
    const processes = demoProcesses[currentLanguage] || demoProcesses.en;
    if (processes[key]) {
        document.getElementById('process-input').value = processes[key];
    }
}

// Usage
const STORAGE_KEY = 'mastermaind_process_usage';
const DAILY_LIMIT = 5;

function getUsageData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { date: '', count: 0 };
    try { return JSON.parse(stored); }
    catch { return { date: '', count: 0 }; }
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function getRemainingUses() {
    const usage = getUsageData();
    if (usage.date !== getTodayString()) return DAILY_LIMIT;
    return Math.max(0, DAILY_LIMIT - usage.count);
}

function incrementUsage() {
    const today = getTodayString();
    const usage = getUsageData();
    if (usage.date !== today) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }));
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: usage.count + 1 }));
    }
}

function updateUsageDisplay() {
    const remaining = getRemainingUses();
    const info = document.getElementById('usage-info');
    const t = translations[currentLanguage];
    if (remaining === 0) {
        info.textContent = t.usage_limit;
        info.classList.add('text-yellow-500');
    } else {
        info.textContent = t.usage_remaining.replace('{n}', remaining);
        info.classList.remove('text-yellow-500');
    }
}

// Main function
async function analyzeProcess() {
    if (getRemainingUses() <= 0) {
        alert(translations[currentLanguage].usage_limit);
        return;
    }

    const process_description = document.getElementById('process-input').value.trim();
    const industry = document.getElementById('industry-select').value;

    if (!process_description || process_description.length < 20) {
        alert('Please describe the process (min 20 characters)');
        return;
    }

    const btn = document.getElementById('analyze-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    const t = translations[currentLanguage];

    btn.disabled = true;
    btnText.textContent = t.analyzing_btn;
    spinner.classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');

    try {
        const response = await fetch('/api/enterprise/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ process_description, industry })
        });

        if (!response.ok) {
            let errorMsg = 'Analysis failed';
            try {
                const error = await response.json();
                errorMsg = error.detail || errorMsg;
            } catch {
                errorMsg = `Server error (${response.status})`;
            }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        incrementUsage();
        updateUsageDisplay();
        displayResults(result);

    } catch (error) {
        console.error('Process error:', error);
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btnText.textContent = t.analyze_btn;
        spinner.classList.add('hidden');
    }
}

function displayResults(result) {
    // Analysis
    document.getElementById('result-analysis').textContent = result.analysis || '';

    // Weaknesses
    const weakEl = document.getElementById('result-weaknesses');
    weakEl.innerHTML = '';
    (result.weaknesses || []).forEach(w => {
        const div = document.createElement('div');
        div.className = 'flex items-start gap-2 text-sm text-gray-200';
        div.innerHTML = `<span class="text-yellow-400 mt-0.5">&#9888;</span><span>${escapeHtml(w)}</span>`;
        weakEl.appendChild(div);
    });

    // Recommendations
    const recEl = document.getElementById('result-recommendations');
    recEl.innerHTML = '';
    (result.ai_recommendations || []).forEach(r => {
        const div = document.createElement('div');
        div.className = 'flex items-start gap-2 text-sm text-gray-200';
        div.innerHTML = `<span class="text-green-400 mt-0.5">&#10003;</span><span>${escapeHtml(r)}</span>`;
        recEl.appendChild(div);
    });

    // Mermaid diagram
    const mermaidContainer = document.getElementById('mermaid-container');
    const diagram = result.mermaid_diagram || '';
    if (diagram) {
        try {
            // Clean up the diagram string
            const cleanDiagram = diagram.replace(/\\n/g, '\n');
            mermaidContainer.innerHTML = '';
            mermaid.render('mermaid-svg', cleanDiagram).then(({ svg }) => {
                mermaidContainer.innerHTML = svg;
            }).catch(() => {
                mermaidContainer.innerHTML = `<pre class="text-sm text-gray-600 p-4">${escapeHtml(cleanDiagram)}</pre>`;
            });
        } catch {
            mermaidContainer.innerHTML = `<pre class="text-sm text-gray-600 p-4">${escapeHtml(diagram)}</pre>`;
        }
    } else {
        mermaidContainer.innerHTML = '<p class="text-gray-500 text-sm">No diagram generated</p>';
    }

    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
