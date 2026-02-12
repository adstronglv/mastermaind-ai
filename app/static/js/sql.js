/**
 * Mastermaind NL -> SQL
 */

let currentLanguage = localStorage.getItem('mastermaind_lang') || 'en';

// Demo questions
const demoQuestions = {
    en: {
        q1: "How many active recipients are there per community type?",
        q2: "Which measures are currently running and when do they end?",
        q3: "What is the total monthly cost of all active benefit notices?"
    },
    de: {
        q1: "Wie viele aktive Leistungsberechtigte gibt es pro Bedarfsgemeinschaftstyp?",
        q2: "Welche Maßnahmen laufen aktuell und wann enden sie?",
        q3: "Wie hoch sind die monatlichen Gesamtkosten aller aktiven Bescheide?"
    }
};

// Translations
const translations = {
    en: {
        hero_title: "Natural Language → SQL",
        hero_subtitle: "Ask questions in plain German or English. AI generates the SQL query and explains it step by step.",
        step1_title: "Database Schema",
        demo_schema: "SGB-II Demo",
        step2_title: "Your Question",
        example_q1: "Active recipients",
        example_q2: "Running measures",
        example_q3: "Monthly costs",
        placeholder_question: "e.g. How many active recipients are there per community type?",
        generate_btn: "Generate SQL",
        generating_btn: "Generating...",
        result_title: "Generated SQL",
        explanation_label: "Explanation",
        tables_label: "Tables used:",
        usage_remaining: "{n} queries remaining today",
        usage_limit: "Daily limit reached. Try again tomorrow!"
    },
    de: {
        hero_title: "Natürliche Sprache → SQL",
        hero_subtitle: "Stellen Sie Fragen auf Deutsch oder Englisch. Die KI generiert die SQL-Abfrage und erklärt sie Schritt für Schritt.",
        step1_title: "Datenbankschema",
        demo_schema: "SGB-II Demo",
        step2_title: "Ihre Frage",
        example_q1: "Aktive Berechtigte",
        example_q2: "Laufende Maßnahmen",
        example_q3: "Monatliche Kosten",
        placeholder_question: "z.B. Wie viele aktive Leistungsberechtigte gibt es pro Bedarfsgemeinschaftstyp?",
        generate_btn: "SQL generieren",
        generating_btn: "Generiere...",
        result_title: "Generierte SQL-Abfrage",
        explanation_label: "Erklärung",
        tables_label: "Verwendete Tabellen:",
        usage_remaining: "{n} Abfragen heute übrig",
        usage_limit: "Tageslimit erreicht. Versuchen Sie es morgen wieder!"
    }
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

// Load demo question
function loadQuestion(key) {
    const questions = demoQuestions[currentLanguage] || demoQuestions.en;
    if (questions[key]) {
        document.getElementById('question-input').value = questions[key];
    }
}

// Usage tracking
const STORAGE_KEY = 'mastermaind_sql_usage';
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
async function generateSQL() {
    if (getRemainingUses() <= 0) {
        alert(translations[currentLanguage].usage_limit);
        return;
    }

    const question = document.getElementById('question-input').value.trim();
    const schema_text = document.getElementById('schema-display').textContent;

    if (!question || question.length < 5) {
        alert('Please enter a question (min 5 characters)');
        return;
    }

    const btn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    const t = translations[currentLanguage];

    btn.disabled = true;
    btnText.textContent = t.generating_btn;
    spinner.classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');

    try {
        const response = await fetch('/api/enterprise/sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, schema_text })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'SQL generation failed');
        }

        const result = await response.json();
        incrementUsage();
        updateUsageDisplay();
        displayResults(result);

    } catch (error) {
        console.error('SQL error:', error);
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btnText.textContent = t.generate_btn;
        spinner.classList.add('hidden');
    }
}

function displayResults(result) {
    // SQL
    document.getElementById('result-sql').textContent = result.sql || '-- No SQL generated';

    // Explanation
    document.getElementById('result-explanation').textContent = result.explanation || '';

    // Tables
    const tablesEl = document.getElementById('result-tables');
    tablesEl.innerHTML = '';
    const tables = result.tables_used || [];
    tables.forEach(table => {
        const span = document.createElement('span');
        span.className = 'bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono';
        span.textContent = table;
        tablesEl.appendChild(span);
    });

    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

// Copy SQL
function copySQL() {
    const sql = document.getElementById('result-sql').textContent;
    navigator.clipboard.writeText(sql).then(() => {
        const btn = event.target.closest('button');
        const original = btn.innerHTML;
        btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> Copied!';
        setTimeout(() => { btn.innerHTML = original; }, 1500);
    });
}
