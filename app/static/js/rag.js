/**
 * Mastermaind RAG Document Analysis
 */

let currentLanguage = localStorage.getItem('mastermaind_lang') || 'en';

// Demo documents (SGB-II excerpts)
const demoDocuments = {
    sgb2_7: `§ 7 Leistungsberechtigte (SGB II)

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

(3) Vom Leistungsausschluss ausgenommen sind Ausländer, die sich seit mindestens fünf Jahren im Bundesgebiet aufhalten und erwerbstätig sind oder Anspruch auf Arbeitslosengeld I haben.`,

    sgb2_21: `§ 21 Mehrbedarfe (SGB II)

(1) Für Personen, die trotz Erfüllung der Voraussetzungen nach § 7 keinen Anspruch auf Arbeitslosengeld II haben, wird ein Mehrbedarf anerkannt.

(2) Bei werdenden Müttern wird nach der 12. Schwangerschaftswoche ein Mehrbedarf von 17 Prozent des maßgebenden Regelbedarfs anerkannt.

(3) Für Personen, die mit einem oder mehreren minderjährigen Kindern zusammenleben und allein für deren Pflege und Erziehung sorgen, ist ein Mehrbedarf anzuerkennen in Höhe von:
- 36 Prozent des Regelbedarfs für ein Kind unter 7 Jahren oder zwei bis drei Kinder unter 16 Jahren,
- 12 Prozent des Regelbedarfs für jedes Kind, wenn die Voraussetzungen nach Nummer 1 nicht vorliegen, höchstens jedoch 60 Prozent des Regelbedarfs.

(4) Bei erwerbsfähigen Leistungsberechtigten mit Behinderungen wird ein Mehrbedarf von 35 Prozent des maßgebenden Regelbedarfs anerkannt, wenn sie Leistungen zur Teilhabe am Arbeitsleben erhalten.

(5) Für die Beschaffung von Schulbüchern und Schulmaterialien wird ein jährlicher Mehrbedarf anerkannt. Die Höhe beträgt 174 Euro im ersten Schulhalbjahr und 58 Euro im zweiten Schulhalbjahr.`,

    sgb2_22: `§ 22 Bedarfe für Unterkunft und Heizung (SGB II)

(1) Bedarfe für Unterkunft und Heizung werden in Höhe der tatsächlichen Aufwendungen anerkannt, soweit diese angemessen sind. Die Angemessenheit richtet sich nach den örtlichen Verhältnissen.

(2) Als Bedarf für die Unterkunft werden auch die Aufwendungen für die Instandhaltung und Reparatur anerkannt, soweit diese nicht vom Vermieter oder einem Dritten zu tragen sind.

(3) Übersteigen die Aufwendungen für die Unterkunft den der Besonderheit des Einzelfalles angemessenen Umfang, sind sie als Bedarf so lange anzuerkennen, wie es dem Leistungsberechtigten nicht möglich oder nicht zuzumuten ist, durch einen Wohnungswechsel die Aufwendungen zu senken, in der Regel jedoch längstens für sechs Monate.

(4) Bei einem Umzug ist eine Zusicherung des kommunalen Trägers erforderlich. Die Zusicherung soll erteilt werden, wenn der Umzug erforderlich ist und die Kosten der neuen Unterkunft angemessen sind.

(5) Sofern Bedarfe für Heizung als Pauschale anerkannt werden, ist sicherzustellen, dass ein ausreichender Betrag zur Verfügung steht, um den Bedarf für Heizung zu decken.`
};

// Translations
const translations = {
    en: {
        hero_title: "RAG Document Analysis",
        hero_subtitle: "Upload a document and ask questions in natural language. AI answers with citations from the text.",
        step1_title: "Document",
        demo_label: "Demo available",
        placeholder_document: "Paste your document text here, or select a demo above...",
        step2_title: "Your Question",
        placeholder_question: "e.g. Who is entitled to benefits under this law?",
        analyze_btn: "Analyze Document",
        analyzing_btn: "Analyzing...",
        result_title: "Analysis Result",
        answer_label: "Answer",
        sources_label: "Sources from Document",
        confidence_label: "Confidence:",
        usage_remaining: "{n} analyses remaining today",
        usage_limit: "Daily limit reached. Try again tomorrow!"
    },
    de: {
        hero_title: "RAG-Dokumentenanalyse",
        hero_subtitle: "Laden Sie ein Dokument hoch und stellen Sie Fragen in natürlicher Sprache. Die KI antwortet mit Zitaten aus dem Text.",
        step1_title: "Dokument",
        demo_label: "Demo verfügbar",
        placeholder_document: "Fügen Sie Ihren Dokumenttext hier ein, oder wählen Sie eine Demo oben...",
        step2_title: "Ihre Frage",
        placeholder_question: "z.B. Wer hat Anspruch auf Leistungen nach diesem Gesetz?",
        analyze_btn: "Dokument analysieren",
        analyzing_btn: "Analysiere...",
        result_title: "Analyseergebnis",
        answer_label: "Antwort",
        sources_label: "Quellen aus dem Dokument",
        confidence_label: "Konfidenz:",
        usage_remaining: "{n} Analysen heute übrig",
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

// Demo loading
function loadDemo(key) {
    if (demoDocuments[key]) {
        document.getElementById('document-input').value = demoDocuments[key];
    }
}

// Usage tracking
const STORAGE_KEY = 'mastermaind_rag_usage';
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
async function analyzeDocument() {
    if (getRemainingUses() <= 0) {
        alert(translations[currentLanguage].usage_limit);
        return;
    }

    const document_text = document.getElementById('document-input').value.trim();
    const question = document.getElementById('question-input').value.trim();

    if (!document_text || document_text.length < 20) {
        alert('Please enter a document (min 20 characters)');
        return;
    }
    if (!question || question.length < 5) {
        alert('Please enter a question (min 5 characters)');
        return;
    }

    // UI loading
    const btn = document.getElementById('analyze-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    const t = translations[currentLanguage];

    btn.disabled = true;
    btnText.textContent = t.analyzing_btn;
    spinner.classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');

    try {
        const response = await fetch('/api/enterprise/rag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ document: document_text, question })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Analysis failed');
        }

        const result = await response.json();
        incrementUsage();
        updateUsageDisplay();
        displayResults(result);

    } catch (error) {
        console.error('RAG error:', error);
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btnText.textContent = t.analyze_btn;
        spinner.classList.add('hidden');
    }
}

function displayResults(result) {
    // Answer
    document.getElementById('result-answer').textContent = result.answer || 'No answer generated';

    // Sources
    const sourcesEl = document.getElementById('result-sources');
    sourcesEl.innerHTML = '';
    const sources = result.sources || [];
    if (sources.length > 0) {
        sources.forEach(source => {
            const div = document.createElement('div');
            div.className = 'bg-indigo-500/10 border-l-2 border-indigo-500 px-3 py-2 rounded-r text-sm text-gray-300 italic';
            div.textContent = `"${source}"`;
            sourcesEl.appendChild(div);
        });
    } else {
        sourcesEl.innerHTML = '<p class="text-gray-500 text-sm">No specific sources cited</p>';
    }

    // Confidence
    const confEl = document.getElementById('result-confidence');
    const conf = (result.confidence || 'medium').toLowerCase();
    const confColors = {
        high: 'bg-green-500/20 text-green-400',
        medium: 'bg-yellow-500/20 text-yellow-400',
        low: 'bg-red-500/20 text-red-400'
    };
    confEl.className = `text-sm font-medium px-2 py-0.5 rounded-full ${confColors[conf] || confColors.medium}`;
    confEl.textContent = conf.charAt(0).toUpperCase() + conf.slice(1);

    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}
