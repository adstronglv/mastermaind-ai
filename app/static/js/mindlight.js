/**
 * MindLight - Unified AI Chat for Mastermaind
 */

let currentLanguage = localStorage.getItem('mastermaind_lang') || 'en';
let chatHistory = [];
let isLoading = false;

// Translations
const translations = {
    en: {
        hero_title: "Your Unified AI Assistant",
        hero_subtitle: "Ask about SGB-II laws, generate SQL queries, analyze processes - all in one conversation.",
        welcome_title: "Welcome to MindLight",
        welcome_subtitle: "I can answer questions about SGB-II laws, generate database queries, and analyze business processes.",
        suggestion_1: "Who is entitled to SGB-II benefits?",
        suggestion_2: "Show active recipients as SQL",
        suggestion_3: "Analyze benefits application process",
        suggestion_4: "What additional needs exist for single parents?",
        input_placeholder: "Ask MindLight anything...",
        clear_chat: "Clear chat",
        usage_remaining: "{n} messages remaining today",
        usage_limit: "Daily limit reached. Try again tomorrow!",
        tool_rag: "Document Analysis",
        tool_sql: "SQL Query",
        tool_process: "Process Analysis",
        tool_general: "General",
        sources_label: "Sources",
        sql_label: "Generated SQL",
        tables_label: "Tables used:",
        weaknesses_label: "Weaknesses",
        recommendations_label: "AI Recommendations",
        copy_sql: "Copy",
        copied: "Copied!"
    },
    de: {
        hero_title: "Ihr einheitlicher KI-Assistent",
        hero_subtitle: "Fragen zu SGB-II-Gesetzen, SQL-Abfragen generieren, Prozesse analysieren - alles in einem Chat.",
        welcome_title: "Willkommen bei MindLight",
        welcome_subtitle: "Ich kann Fragen zu SGB-II-Gesetzen beantworten, Datenbankabfragen generieren und Geschaeftsprozesse analysieren.",
        suggestion_1: "Wer hat Anspruch auf SGB-II-Leistungen?",
        suggestion_2: "Zeig aktive Leistungsberechtigte als SQL",
        suggestion_3: "Analysiere den Leistungsantrag-Prozess",
        suggestion_4: "Welche Mehrbedarfe gibt es fuer Alleinerziehende?",
        input_placeholder: "Fragen Sie MindLight...",
        clear_chat: "Chat leeren",
        usage_remaining: "{n} Nachrichten heute uebrig",
        usage_limit: "Tageslimit erreicht. Versuchen Sie es morgen wieder!",
        tool_rag: "Dokumentenanalyse",
        tool_sql: "SQL-Abfrage",
        tool_process: "Prozessanalyse",
        tool_general: "Allgemein",
        sources_label: "Quellen",
        sql_label: "Generierte SQL-Abfrage",
        tables_label: "Verwendete Tabellen:",
        weaknesses_label: "Schwachstellen",
        recommendations_label: "KI-Empfehlungen",
        copy_sql: "Kopieren",
        copied: "Kopiert!"
    }
};

// Suggestions per language
const suggestions = {
    en: [
        "Who is entitled to SGB-II benefits?",
        "Show all active recipients grouped by community type as SQL query",
        "Analyze the benefits application process: 1. Client submits application 2. Reception checks documents 3. Manual data entry 4. Case worker reviews 5. Decision sent by post",
        "What additional needs (Mehrbedarf) exist for single parents under SGB-II?"
    ],
    de: [
        "Wer hat Anspruch auf SGB-II-Leistungen?",
        "Zeig alle aktiven Leistungsberechtigten gruppiert nach Bedarfsgemeinschaftstyp als SQL-Abfrage",
        "Analysiere den Antragsprozess: 1. Kunde gibt Antrag ab 2. Empfang prueft Dokumente 3. Manuelle Datenerfassung 4. Sachbearbeiter prueft 5. Bescheid per Post",
        "Welche Mehrbedarfe gibt es fuer Alleinerziehende nach SGB II?"
    ]
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLanguage);
    updateUsageDisplay();
    loadChatFromStorage();
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

// Usage tracking
const STORAGE_KEY = 'mastermaind_chat_usage';
const DAILY_LIMIT = 10;

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

// Chat persistence
function saveChatToStorage() {
    localStorage.setItem('mindlight_history', JSON.stringify(chatHistory));
}

function loadChatFromStorage() {
    const stored = localStorage.getItem('mindlight_history');
    if (stored) {
        try {
            chatHistory = JSON.parse(stored);
            if (chatHistory.length > 0) {
                document.getElementById('welcome-screen').classList.add('hidden');
                chatHistory.forEach(msg => renderMessage(msg, false));
                scrollToBottom();
            }
        } catch { chatHistory = []; }
    }
}

// Suggestion chips
function useSuggestion(index) {
    const msgs = suggestions[currentLanguage] || suggestions.en;
    if (msgs[index]) {
        document.getElementById('chat-input').value = msgs[index];
        sendMessage();
    }
}

// Auto-resize textarea
function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// Handle Enter key
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Main send function
async function sendMessage() {
    if (isLoading) return;

    if (getRemainingUses() <= 0) {
        alert(translations[currentLanguage].usage_limit);
        return;
    }

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || text.length < 2) return;

    // Hide welcome screen
    document.getElementById('welcome-screen').classList.add('hidden');

    // Add user message
    const userMsg = { role: 'user', content: text };
    chatHistory.push(userMsg);
    renderMessage(userMsg);
    input.value = '';
    input.style.height = 'auto';

    // Show loading
    isLoading = true;
    const sendIcon = document.getElementById('send-icon');
    const sendSpinner = document.getElementById('send-spinner');
    sendIcon.classList.add('hidden');
    sendSpinner.classList.remove('hidden');
    showTypingIndicator();

    try {
        // Build history for API (only role + content)
        const apiHistory = chatHistory.slice(0, -1).map(m => ({
            role: m.role,
            content: m.content
        }));

        const response = await fetch('/api/enterprise/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: apiHistory })
        });

        if (!response.ok) {
            let errorMsg = 'Chat failed';
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

        // Add assistant message
        const assistantMsg = {
            role: 'assistant',
            content: result.message || '',
            tool_used: result.tool_used || 'general',
            sources: result.sources || [],
            sql: result.sql || '',
            tables_used: result.tables_used || [],
            weaknesses: result.weaknesses || [],
            recommendations: result.recommendations || []
        };
        chatHistory.push(assistantMsg);
        removeTypingIndicator();
        renderMessage(assistantMsg);
        saveChatToStorage();

    } catch (error) {
        console.error('MindLight error:', error);
        removeTypingIndicator();
        const errorMsg = {
            role: 'assistant',
            content: 'Error: ' + error.message,
            tool_used: 'general'
        };
        chatHistory.push(errorMsg);
        renderMessage(errorMsg);
    } finally {
        isLoading = false;
        sendIcon.classList.remove('hidden');
        sendSpinner.classList.add('hidden');
    }
}

// Render a message
function renderMessage(msg, scroll = true) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');

    if (msg.role === 'user') {
        div.className = 'flex justify-end';
        div.innerHTML = `
            <div class="bg-cyan-500/20 border border-cyan-500/30 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                <p class="text-white text-sm">${escapeHtml(msg.content)}</p>
            </div>
        `;
    } else {
        const t = translations[currentLanguage];
        const toolLabels = { rag: t.tool_rag, sql: t.tool_sql, process: t.tool_process, general: t.tool_general };
        const toolBadgeClass = `tool-badge-${msg.tool_used || 'general'}`;
        const toolLabel = toolLabels[msg.tool_used] || t.tool_general;

        let extraContent = '';

        // RAG sources
        if (msg.tool_used === 'rag' && msg.sources && msg.sources.length > 0) {
            const sourcesHtml = msg.sources.map(s =>
                `<div class="bg-indigo-500/10 border-l-2 border-indigo-500 px-3 py-2 rounded-r text-xs text-gray-300 italic">"${escapeHtml(s)}"</div>`
            ).join('');
            extraContent += `
                <div class="mt-3 space-y-2">
                    <div class="text-xs font-medium text-indigo-400">${t.sources_label}</div>
                    ${sourcesHtml}
                </div>
            `;
        }

        // SQL code
        if (msg.tool_used === 'sql' && msg.sql) {
            const tablesHtml = (msg.tables_used || []).map(t =>
                `<span class="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">${escapeHtml(t)}</span>`
            ).join('');
            extraContent += `
                <div class="mt-3">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-medium text-emerald-400">${t.sql_label}</span>
                        <button onclick="copySql(this)" class="text-xs text-gray-400 hover:text-white transition">${t.copy_sql}</button>
                    </div>
                    <pre class="bg-slate-800/80 rounded-lg p-3 text-emerald-300 text-xs font-mono overflow-x-auto border border-white/5"><code>${escapeHtml(msg.sql)}</code></pre>
                    ${tablesHtml ? `<div class="flex gap-1 mt-2 flex-wrap"><span class="text-xs text-gray-500">${t.tables_label}</span> ${tablesHtml}</div>` : ''}
                </div>
            `;
        }

        // Process weaknesses + recommendations
        if (msg.tool_used === 'process') {
            if (msg.weaknesses && msg.weaknesses.length > 0) {
                const weakHtml = msg.weaknesses.map(w =>
                    `<div class="flex items-start gap-2 text-xs text-gray-200"><span class="text-yellow-400 mt-0.5">&#9888;</span><span>${escapeHtml(w)}</span></div>`
                ).join('');
                extraContent += `
                    <div class="mt-3">
                        <div class="text-xs font-medium text-yellow-400 mb-1">${t.weaknesses_label}</div>
                        <div class="space-y-1">${weakHtml}</div>
                    </div>
                `;
            }
            if (msg.recommendations && msg.recommendations.length > 0) {
                const recHtml = msg.recommendations.map(r =>
                    `<div class="flex items-start gap-2 text-xs text-gray-200"><span class="text-green-400 mt-0.5">&#10003;</span><span>${escapeHtml(r)}</span></div>`
                ).join('');
                extraContent += `
                    <div class="mt-3">
                        <div class="text-xs font-medium text-green-400 mb-1">${t.recommendations_label}</div>
                        <div class="space-y-1">${recHtml}</div>
                    </div>
                `;
            }
        }

        div.className = 'flex justify-start';
        div.innerHTML = `
            <div class="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full ${toolBadgeClass}">${toolLabel}</span>
                </div>
                <div class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(msg.content)}</div>
                ${extraContent}
            </div>
        `;
    }

    container.appendChild(div);
    if (scroll) scrollToBottom();
}

// Typing indicator
function showTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'flex justify-start';
    div.innerHTML = `
        <div class="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
            <div class="flex gap-1">
                <div class="w-2 h-2 bg-cyan-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-cyan-400 rounded-full typing-dot"></div>
                <div class="w-2 h-2 bg-cyan-400 rounded-full typing-dot"></div>
            </div>
        </div>
    `;
    container.appendChild(div);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
}

// Copy SQL
function copySql(btn) {
    const pre = btn.closest('div').nextElementSibling;
    const sql = pre.textContent;
    const t = translations[currentLanguage];
    navigator.clipboard.writeText(sql).then(() => {
        const original = btn.textContent;
        btn.textContent = t.copied;
        setTimeout(() => { btn.textContent = original; }, 1500);
    });
}

// Clear chat
function clearChat() {
    chatHistory = [];
    localStorage.removeItem('mindlight_history');
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    // Re-add welcome screen
    const welcome = document.createElement('div');
    welcome.id = 'welcome-screen';
    welcome.className = 'flex flex-col items-center justify-center h-full text-center';
    const t = translations[currentLanguage];
    const s = suggestions[currentLanguage] || suggestions.en;
    welcome.innerHTML = `
        <div class="text-6xl mb-4">&#128172;</div>
        <h2 class="text-xl font-bold text-white mb-2">${t.welcome_title}</h2>
        <p class="text-gray-400 text-sm mb-6 max-w-md">${t.welcome_subtitle}</p>
        <div class="flex flex-wrap gap-2 justify-center max-w-lg">
            <button onclick="useSuggestion(0)" class="suggestion-chip text-xs px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-300 hover:text-white transition">${s[0]}</button>
            <button onclick="useSuggestion(1)" class="suggestion-chip text-xs px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-300 hover:text-white transition">${s[1]}</button>
            <button onclick="useSuggestion(2)" class="suggestion-chip text-xs px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-300 hover:text-white transition">${s[2]}</button>
            <button onclick="useSuggestion(3)" class="suggestion-chip text-xs px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-300 hover:text-white transition">${s[3]}</button>
        </div>
    `;
    container.appendChild(welcome);
}

// Scroll to bottom
function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
