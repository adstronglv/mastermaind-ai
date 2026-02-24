/**
 * Mastermaind Multi-Agent Orchestrator
 */

let currentLanguage = localStorage.getItem('mastermaind_lang') || 'en';

// Demo tasks
const demoTasks = {
    en: {
        market: "Analyze the German job market for IT specialists in public administration. Consider current trends in AI adoption, salary ranges, required skills, and future outlook for digitalization in government agencies.",
        migration: "Plan a migration from on-premise Exchange Server to Microsoft 365 for a public agency with 200 employees. Consider data protection (DSGVO), training needs, timeline, and risk mitigation.",
        strategy: "Develop a KI strategy for a Jobcenter (SGB II). Consider: which processes can be automated with AI, what data protection requirements exist (DSGVO, on-premise), what training is needed for staff, and what ROI can be expected."
    },
    de: {
        market: "Analysiere den deutschen Arbeitsmarkt für IT-Fachkräfte in der öffentlichen Verwaltung. Berücksichtige aktuelle Trends bei der KI-Einführung, Gehaltsspannen, erforderliche Qualifikationen und Zukunftsaussichten für die Digitalisierung in Behörden.",
        migration: "Plane eine Migration von On-Premise Exchange Server zu Microsoft 365 für eine Behörde mit 200 Mitarbeitern. Berücksichtige Datenschutz (DSGVO), Schulungsbedarf, Zeitplan und Risikominimierung.",
        strategy: "Entwickle eine KI-Strategie für ein Jobcenter (SGB II). Berücksichtige: welche Prozesse mit KI automatisiert werden können, welche Datenschutzanforderungen bestehen (DSGVO, On-Premise), welche Schulungen für Mitarbeiter nötig sind und welcher ROI zu erwarten ist."
    }
};

// Translations
const translations = {
    en: {
        hero_title: "Multi-Agent Orchestrator",
        hero_subtitle: "Opus coordinates, Sonnet and Haiku execute. Intelligent task decomposition for cost-efficient AI processing.",
        model_opus: "Complex reasoning",
        model_sonnet: "Analysis & summaries",
        model_haiku: "Fast & efficient",
        step1_title: "Complex Task",
        demo_market: "Market Analysis",
        demo_migration: "IT Migration",
        demo_strategy: "KI Strategy",
        placeholder_task: "Describe a complex task that requires multiple AI models to solve...",
        orchestrate_btn: "Orchestrate",
        orchestrating_btn: "Orchestrating...",
        pipeline_decompose: "Task Decomposition",
        pipeline_results: "Model Results",
        pipeline_synthesis: "Synthesis",
        cost_title: "Cost Comparison",
        cost_all_opus: "All Opus",
        cost_orchestrated: "Orchestrated",
        cost_savings: "Savings",
        usage_remaining: "{n} orchestrations remaining today",
        usage_limit: "Daily limit reached. Try again tomorrow!"
    },
    de: {
        hero_title: "Multi-Agent Orchestrator",
        hero_subtitle: "Opus koordiniert, Sonnet und Haiku arbeiten. Intelligente Aufgabenzerlegung für kosteneffiziente KI-Verarbeitung.",
        model_opus: "Komplexes Reasoning",
        model_sonnet: "Analyse & Zusammenfassungen",
        model_haiku: "Schnell & effizient",
        step1_title: "Komplexe Aufgabe",
        demo_market: "Marktanalyse",
        demo_migration: "IT-Migration",
        demo_strategy: "KI-Strategie",
        placeholder_task: "Beschreiben Sie eine komplexe Aufgabe, die mehrere KI-Modelle erfordert...",
        orchestrate_btn: "Orchestrieren",
        orchestrating_btn: "Orchestriere...",
        pipeline_decompose: "Aufgabenzerlegung",
        pipeline_results: "Modell-Ergebnisse",
        pipeline_synthesis: "Synthese",
        cost_title: "Kostenvergleich",
        cost_all_opus: "Alles Opus",
        cost_orchestrated: "Orchestriert",
        cost_savings: "Ersparnis",
        usage_remaining: "{n} Orchestrierungen heute übrig",
        usage_limit: "Tageslimit erreicht. Versuchen Sie es morgen wieder!"
    }
};

// Model colors
const modelColors = {
    opus: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500' },
    sonnet: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500' },
    haiku: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500' }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
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
function loadTaskDemo(key) {
    const tasks = demoTasks[currentLanguage] || demoTasks.en;
    if (tasks[key]) {
        document.getElementById('task-input').value = tasks[key];
    }
}

// Usage
const STORAGE_KEY = 'mastermaind_orchestrator_usage';
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
async function orchestrate() {
    if (getRemainingUses() <= 0) {
        alert(translations[currentLanguage].usage_limit);
        return;
    }

    const task = document.getElementById('task-input').value.trim();
    if (!task || task.length < 10) {
        alert('Please describe the task (min 10 characters)');
        return;
    }

    const btn = document.getElementById('orchestrate-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    const t = translations[currentLanguage];

    btn.disabled = true;
    btnText.textContent = t.orchestrating_btn;
    spinner.classList.remove('hidden');
    document.getElementById('pipeline-section').classList.add('hidden');

    try {
        const response = await fetch('/api/enterprise/orchestrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task })
        });

        if (!response.ok) {
            let errorMsg = 'Orchestration failed';
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
        displayPipeline(result);

    } catch (error) {
        console.error('Orchestrator error:', error);
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btnText.textContent = t.orchestrate_btn;
        spinner.classList.add('hidden');
    }
}

function displayPipeline(result) {
    // Subtasks
    const subtasksEl = document.getElementById('subtasks-container');
    subtasksEl.innerHTML = '';
    (result.subtasks || []).forEach((subtask, i) => {
        const model = (subtask.assigned_model || 'haiku').toLowerCase();
        const colors = modelColors[model] || modelColors.haiku;

        const div = document.createElement('div');
        div.className = `${colors.bg} ${colors.border} border rounded-xl p-4`;
        div.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="${colors.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full">${model.toUpperCase()}</span>
                <span class="text-white font-medium text-sm">${escapeHtml(subtask.description)}</span>
            </div>
            <p class="text-gray-400 text-xs">${escapeHtml(subtask.reasoning || '')}</p>
        `;
        subtasksEl.appendChild(div);
    });

    // Results
    const resultsEl = document.getElementById('results-container');
    resultsEl.innerHTML = '';
    (result.results || []).forEach((res) => {
        const model = (res.model || 'haiku').toLowerCase();
        const colors = modelColors[model] || modelColors.haiku;

        const div = document.createElement('div');
        div.className = `bg-white/5 border border-white/10 rounded-xl p-4`;
        div.innerHTML = `
            <div class="flex items-center gap-2 mb-2">
                <span class="${colors.badge} text-white text-xs font-bold px-2 py-0.5 rounded-full">${model.toUpperCase()}</span>
                <span class="${colors.text} text-sm font-medium">Subtask ${res.subtask_id}</span>
            </div>
            <p class="text-gray-200 text-sm leading-relaxed">${escapeHtml(res.output || '')}</p>
        `;
        resultsEl.appendChild(div);
    });

    // Synthesis
    document.getElementById('synthesis-content').textContent = result.synthesis || '';

    // Cost comparison
    const cost = result.cost_comparison || {};
    document.getElementById('cost-opus').textContent = cost.all_opus || '$0.45';
    document.getElementById('cost-orchestrated').textContent = cost.orchestrated || '$0.12';
    document.getElementById('cost-savings').textContent = cost.savings || '73%';

    document.getElementById('pipeline-section').classList.remove('hidden');
    document.getElementById('pipeline-section').scrollIntoView({ behavior: 'smooth' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
