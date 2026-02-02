// PromptEngineer - Frontend JavaScript

let currentTaskType = 'general';
let currentLang = localStorage.getItem('adstrong_lang') || 'en';

// Translations
const translations = {
    en: {
        // Navigation
        nav_demo: "Demo",
        nav_templates: "Templates",
        // Hero
        hero_title: "Optimize Your AI Prompts",
        hero_subtitle: "Get better results from ChatGPT, Claude, and other AI models. Our AI analyzes and improves your prompts instantly.",
        free_optimizations: "10 free optimizations/day",
        no_signup: "No signup required",
        // Demo
        demo_title: "See the Difference",
        before: "Before",
        after: "After",
        demo_before: '"Write me a text about AI"',
        demo_after: '"Write a 500-word blog post about artificial intelligence for beginners. Explain 3 practical applications in everyday life. Use a friendly, easy-to-understand tone. Structure the text with subheadings."',
        ex_marketing: "Marketing",
        ex_marketing_desc: '"Write advertising for my product"',
        ex_coding: "Programming",
        ex_coding_desc: '"Write a function that does X"',
        ex_email: "Email",
        ex_email_desc: '"Write a professional email"',
        // Categories
        cat_general: "General",
        cat_coding: "Coding",
        cat_creative: "Creative",
        cat_marketing: "Marketing",
        // Form
        your_prompt: "Your Prompt",
        prompt_placeholder: "Enter your prompt here... (e.g. 'Write a blog post about AI')",
        min_chars: "Min 10 characters",
        optimize_btn: "Optimize Prompt",
        optimizing: "Optimizing...",
        // Results
        optimized_prompt: "Optimized Prompt",
        copy: "Copy",
        copied: "Copied!",
        improvements: "Improvements Made",
        pro_tips: "Pro Tips",
        // Templates & CTA
        templates_title: "Prompt Templates",
        cta_title: "Ready for Better Prompts?",
        cta_subtitle: "Start for free - no credit card required.",
        cta_button: "Try It Now",
        // Footer
        privacy: "Privacy Policy",
        terms: "Terms",
        // Errors
        error_min_chars: "Please enter at least 10 characters",
        error_max_chars: "Prompt too long (max 5000 characters)",
        error_generic: "Error: ",
        // Action buttons
        regenerate_btn: "Regenerate",
        further_optimize_btn: "Further Optimize",
        regenerating: "Regenerating...",
        further_optimizing: "Optimizing further..."
    },
    de: {
        // Navigation
        nav_demo: "Demo",
        nav_templates: "Vorlagen",
        // Hero
        hero_title: "Optimiere deine KI-Prompts",
        hero_subtitle: "Bessere Ergebnisse von ChatGPT, Claude und anderen KI-Modellen. Unsere KI analysiert und verbessert deine Prompts sofort.",
        free_optimizations: "10 kostenlose Optimierungen/Tag",
        no_signup: "Keine Registrierung nötig",
        // Demo
        demo_title: "Sieh den Unterschied",
        before: "Vorher",
        after: "Nachher",
        demo_before: '"Schreib mir einen Text über KI"',
        demo_after: '"Schreibe einen 500-Wort Blogbeitrag über künstliche Intelligenz für Einsteiger. Erkläre 3 praktische Anwendungen im Alltag. Nutze einen freundlichen, leicht verständlichen Ton. Strukturiere den Text mit Zwischenüberschriften."',
        ex_marketing: "Marketing",
        ex_marketing_desc: '"Schreib Werbung für mein Produkt"',
        ex_coding: "Programmierung",
        ex_coding_desc: '"Schreib eine Funktion die X macht"',
        ex_email: "E-Mail",
        ex_email_desc: '"Schreib eine professionelle E-Mail"',
        // Categories
        cat_general: "Allgemein",
        cat_coding: "Coding",
        cat_creative: "Kreativ",
        cat_marketing: "Marketing",
        // Form
        your_prompt: "Dein Prompt",
        prompt_placeholder: "Gib deinen Prompt hier ein... (z.B. 'Schreib einen Blogbeitrag über KI')",
        min_chars: "Min 10 Zeichen",
        optimize_btn: "Prompt Optimieren",
        optimizing: "Optimiere...",
        // Results
        optimized_prompt: "Optimierter Prompt",
        copy: "Kopieren",
        copied: "Kopiert!",
        improvements: "Verbesserungen",
        pro_tips: "Profi-Tipps",
        // Templates & CTA
        templates_title: "Prompt-Vorlagen",
        cta_title: "Bereit für bessere Prompts?",
        cta_subtitle: "Starte jetzt kostenlos - keine Kreditkarte erforderlich.",
        cta_button: "Jetzt ausprobieren",
        // Footer
        privacy: "Datenschutz",
        terms: "AGB",
        // Errors
        error_min_chars: "Bitte mindestens 10 Zeichen eingeben",
        error_max_chars: "Prompt zu lang (max 5000 Zeichen)",
        error_generic: "Fehler: ",
        // Action buttons
        regenerate_btn: "Neu generieren",
        further_optimize_btn: "Weiter optimieren",
        regenerating: "Generiere neu...",
        further_optimizing: "Optimiere weiter..."
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
    // Check saved language (use same key as ads.js and index.html)
    currentLang = localStorage.getItem('adstrong_lang') || 'en';
    updateLanguageUI();
    applyTranslations();

    loadTemplates();
    setupCharCounter();
});

// Set language (called by language switcher buttons)
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('adstrong_lang', lang);
    updateLanguageUI();
    applyTranslations();
}

// Update language toggle button styles
function updateLanguageUI() {
    const langEn = document.getElementById('lang-en');
    const langDe = document.getElementById('lang-de');

    if (langEn && langDe) {
        // EN button
        langEn.classList.toggle('bg-purple-500', currentLang === 'en');
        langEn.classList.toggle('text-white', currentLang === 'en');
        langEn.classList.toggle('text-gray-400', currentLang !== 'en');

        // DE button
        langDe.classList.toggle('bg-purple-500', currentLang === 'de');
        langDe.classList.toggle('text-white', currentLang === 'de');
        langDe.classList.toggle('text-gray-400', currentLang !== 'de');
    }
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
        showNotification(t.error_min_chars, 'error');
        return;
    }

    if (prompt.length > 5000) {
        showNotification(t.error_max_chars, 'error');
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
        showNotification(t.error_generic + error.message, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
        btnText.textContent = t.optimize_btn;
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
        showNotification(t.copied || 'Copied!', 'success');
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

// Store last result for further optimization
let lastOptimizedPrompt = '';

// Regenerate - create completely new optimization from original input
function regeneratePrompt() {
    // Just call optimize again with the original input
    optimizePrompt();
}

// Further optimize - take current result and optimize it again
async function furtherOptimize() {
    const t = translations[currentLang];
    const currentOptimized = document.getElementById('optimized-prompt').textContent.trim();

    if (!currentOptimized) {
        showNotification(t.error_min_chars, 'error');
        return;
    }

    // Show loading state on the button
    const btn = document.querySelector('[onclick="furtherOptimize()"]');
    const btnSpan = btn.querySelector('span');
    const originalText = btnSpan.textContent;
    btn.disabled = true;
    btn.classList.add('opacity-50');
    btnSpan.textContent = t.further_optimizing;

    try {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: currentOptimized,
                task_type: currentTaskType,
                is_further_optimization: true
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Optimization failed');
        }

        const data = await response.json();
        displayResults(data);

    } catch (error) {
        showNotification(t.error_generic + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50');
        btnSpan.textContent = originalText;
    }
}
