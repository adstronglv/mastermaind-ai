// PromptEngineer - Frontend JavaScript

let currentTaskType = 'general';
let currentLang = 'de';

// Translations
const translations = {
    de: {
        heroTitle: "Optimiere deine KI-Prompts",
        heroSubtitle: "Bessere Ergebnisse von ChatGPT, Claude und anderen KI-Modellen. Unsere KI analysiert und verbessert deine Prompts sofort.",
        freeOptimizations: "10 kostenlose Optimierungen/Tag",
        noSignup: "Keine Registrierung nötig",
        demoTitle: "✨ Sieh den Unterschied",
        before: "Vorher",
        after: "Nachher",
        demoBefore: '"Schreib mir einen Text über KI"',
        demoAfter: '"Schreibe einen 500-Wort Blogbeitrag über künstliche Intelligenz für Einsteiger. Erkläre 3 praktische Anwendungen im Alltag. Nutze einen freundlichen, leicht verständlichen Ton. Strukturiere den Text mit Zwischenüberschriften."',
        exMarketing: "Marketing",
        exMarketingDesc: '"Schreib Werbung für mein Produkt"',
        exCoding: "Programmierung",
        exCodingDesc: '"Schreib eine Funktion die X macht"',
        exEmail: "E-Mail",
        exEmailDesc: '"Schreib eine professionelle E-Mail"',
        catGeneral: "Allgemein",
        catCoding: "Coding",
        catCreative: "Kreativ",
        catMarketing: "Marketing",
        yourPrompt: "Dein Prompt",
        promptPlaceholder: "Gib deinen Prompt hier ein... (z.B. 'Schreib einen Blogbeitrag über KI')",
        minChars: "Min 10 Zeichen",
        optimizeBtn: "🚀 Prompt Optimieren",
        optimizing: "Optimiere...",
        optimizedPrompt: "Optimierter Prompt",
        copy: "Kopieren",
        copied: "Kopiert!",
        improvements: "Verbesserungen",
        proTips: "Profi-Tipps",
        statsOptimized: "Prompts optimiert",
        statsBetter: "Bessere Ergebnisse",
        statsRating: "Nutzerbewertung",
        templatesTitle: "Prompt-Vorlagen",
        ctaTitle: "Bereit für bessere Prompts?",
        ctaSubtitle: "Starte jetzt kostenlos - keine Kreditkarte erforderlich.",
        ctaButton: "Jetzt ausprobieren",
        goPro: "Pro Version",
        errorMinChars: "Bitte mindestens 10 Zeichen eingeben",
        errorMaxChars: "Prompt zu lang (max 5000 Zeichen)",
        errorGeneric: "Fehler: "
    },
    en: {
        heroTitle: "Optimize Your AI Prompts",
        heroSubtitle: "Get better results from ChatGPT, Claude, and other AI models. Our AI analyzes and improves your prompts instantly.",
        freeOptimizations: "10 free optimizations/day",
        noSignup: "No signup required",
        demoTitle: "✨ See the Difference",
        before: "Before",
        after: "After",
        demoBefore: '"Write me a text about AI"',
        demoAfter: '"Write a 500-word blog post about artificial intelligence for beginners. Explain 3 practical applications in everyday life. Use a friendly, easy-to-understand tone. Structure the text with subheadings."',
        exMarketing: "Marketing",
        exMarketingDesc: '"Write an ad for my product"',
        exCoding: "Programming",
        exCodingDesc: '"Write a function that does X"',
        exEmail: "Email",
        exEmailDesc: '"Write a professional email"',
        catGeneral: "General",
        catCoding: "Coding",
        catCreative: "Creative",
        catMarketing: "Marketing",
        yourPrompt: "Your Prompt",
        promptPlaceholder: "Enter your prompt here... (e.g., 'Write a blog post about AI')",
        minChars: "Min 10 characters",
        optimizeBtn: "🚀 Optimize Prompt",
        optimizing: "Optimizing...",
        optimizedPrompt: "Optimized Prompt",
        copy: "Copy",
        copied: "Copied!",
        improvements: "Improvements",
        proTips: "Pro Tips",
        statsOptimized: "Prompts optimized",
        statsBetter: "Better results",
        statsRating: "User rating",
        templatesTitle: "Prompt Templates",
        ctaTitle: "Ready for better prompts?",
        ctaSubtitle: "Start for free - no credit card required.",
        ctaButton: "Try it now",
        goPro: "Go Pro",
        errorMinChars: "Please enter at least 10 characters",
        errorMaxChars: "Prompt too long (max 5000 characters)",
        errorGeneric: "Error: "
    }
};

// Example prompts
const examples = {
    marketing: {
        de: "Schreib Werbung für mein neues Fitness-App",
        en: "Write an ad for my new fitness app"
    },
    coding: {
        de: "Schreib eine Python Funktion die eine Liste sortiert",
        en: "Write a Python function that sorts a list"
    },
    email: {
        de: "Schreib eine E-Mail an meinen Chef wegen Urlaub",
        en: "Write an email to my boss about vacation"
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check saved language
    const savedLang = localStorage.getItem('lang') || 'de';
    currentLang = savedLang;
    updateLanguageUI();

    loadTemplates();
    setupCharCounter();
});

// Toggle language
function toggleLanguage() {
    currentLang = currentLang === 'de' ? 'en' : 'de';
    localStorage.setItem('lang', currentLang);
    updateLanguageUI();
    applyTranslations();
}

// Update language toggle button
function updateLanguageUI() {
    const flag = document.getElementById('lang-flag');
    const code = document.getElementById('lang-code');
    if (flag && code) {
        flag.textContent = currentLang === 'de' ? '🇩🇪' : '🇬🇧';
        code.textContent = currentLang === 'de' ? 'Deutsch' : 'English';
    }
    applyTranslations();
}

// Apply translations
function applyTranslations() {
    const t = translations[currentLang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });
}

// Load example
function loadExample(type) {
    const example = examples[type];
    if (example) {
        const prompt = example[currentLang] || example.de;
        const inputField = document.getElementById('input-prompt');
        inputField.value = prompt;
        inputField.dispatchEvent(new Event('input'));

        // Set task type
        if (type === 'coding') setTaskType('coding');
        else if (type === 'marketing' || type === 'email') setTaskType('marketing');
        else setTaskType('general');

        // Highlight the input field
        inputField.style.borderColor = '#a855f7';
        setTimeout(() => {
            inputField.style.borderColor = '';
        }, 2000);

        // Scroll to input with offset
        setTimeout(() => {
            const mainTool = document.querySelector('.max-w-4xl.mx-auto.px-4.pb-16');
            if (mainTool) {
                mainTool.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
}

// Task type selection
function setTaskType(type) {
    currentTaskType = type;
    document.querySelectorAll('.task-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
}

// Character counter
function setupCharCounter() {
    const textarea = document.getElementById('input-prompt');
    const counter = document.getElementById('char-count');

    textarea.addEventListener('input', () => {
        const count = textarea.value.length;
        counter.textContent = `${count} / 5000`;
        counter.style.color = count > 5000 ? '#ef4444' : count < 10 ? '#f59e0b' : '#9ca3af';
    });
}

// Optimize prompt
async function optimizePrompt() {
    const t = translations[currentLang];
    const prompt = document.getElementById('input-prompt').value.trim();

    if (prompt.length < 10) {
        showNotification(t.errorMinChars, 'error');
        return;
    }

    if (prompt.length > 5000) {
        showNotification(t.errorMaxChars, 'error');
        return;
    }

    // Show loading
    const btn = document.getElementById('optimize-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');

    btn.classList.add('loading');
    btn.disabled = true;
    btnText.textContent = t.optimizing;
    spinner.classList.remove('hidden');

    try {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                task_type: currentTaskType,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Optimization failed');
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        showNotification(t.errorGeneric + error.message, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
        btnText.textContent = t.optimizeBtn;
        spinner.classList.add('hidden');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white font-medium`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Display results
function displayResults(data) {
    const results = document.getElementById('results');
    results.classList.remove('hidden');

    // Animate scores
    const scoreBefore = document.getElementById('score-before');
    const scoreAfter = document.getElementById('score-after');
    const scoreBar = document.getElementById('score-bar');

    // Reset
    scoreBefore.textContent = '0';
    scoreAfter.textContent = '0';
    scoreBar.style.width = '0%';

    // Animate after a brief delay
    setTimeout(() => {
        animateNumber(scoreBefore, 0, data.score_before || 0, 500);
        animateNumber(scoreAfter, 0, data.score_after || 0, 800);
        scoreBar.style.width = `${((data.score_after || 0) / 10) * 100}%`;
    }, 100);

    // Optimized prompt
    document.getElementById('optimized-prompt').textContent = data.optimized || data.original;

    // Improvements
    const improvementsList = document.getElementById('improvements-list');
    improvementsList.innerHTML = '';
    (data.improvements || []).forEach((imp, i) => {
        setTimeout(() => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-2 text-gray-300 fade-in';
            li.innerHTML = `
                <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>${imp}</span>
            `;
            improvementsList.appendChild(li);
        }, i * 150);
    });

    // Tips
    const tipsList = document.getElementById('tips-list');
    tipsList.innerHTML = '';
    (data.tips || []).forEach((tip, i) => {
        setTimeout(() => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-2 text-gray-300 fade-in';
            li.innerHTML = `
                <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <span>${tip}</span>
            `;
            tipsList.appendChild(li);
        }, (data.improvements?.length || 0) * 150 + i * 150);
    });

    // Scroll to results
    setTimeout(() => {
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
}

// Animate number
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(start + range * progress);
        element.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Copy optimized prompt
function copyOptimized() {
    const t = translations[currentLang];
    const text = document.getElementById('optimized-prompt').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showNotification(t.copied, 'success');
    });
}

// Load templates
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();

        const grid = document.getElementById('templates-grid');
        if (!grid) return;
        grid.innerHTML = '';

        data.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.onclick = () => useTemplate(template.template);
            card.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">${template.category}</span>
                </div>
                <h3 class="text-white font-semibold mb-2">${template.name}</h3>
                <p class="text-gray-400 text-sm">${template.template.substring(0, 80)}...</p>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}

// Use template
function useTemplate(template) {
    document.getElementById('input-prompt').value = template;
    document.getElementById('input-prompt').dispatchEvent(new Event('input'));
    document.getElementById('input-prompt').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
