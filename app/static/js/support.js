/**
 * First-Level-Support - Citizen-facing AI chat for SGB-II questions
 */

let chatHistory = [];
let isLoading = false;

const STORAGE_KEY = 'support_chat_usage';
const HISTORY_KEY = 'support_chat_history';
const DAILY_LIMIT = 10;

const suggestions = [
    "Wie beantrage ich Buergergeld?",
    "Welche Unterlagen brauche ich fuer den Antrag?",
    "Wie hoch ist der Regelbedarf fuer Alleinstehende?",
    "Welche Mehrbedarfe gibt es fuer Alleinerziehende?",
    "Werden meine Mietkosten uebernommen?",
    "Wann hat das Jobcenter geoeffnet?"
];

const categoryLabels = {
    antrag: "Antrag",
    leistungen: "Leistungen",
    dokumente: "Dokumente",
    rechte: "Ihre Rechte",
    termin: "Termin & Kontakt",
    allgemein: "Allgemein"
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateUsageDisplay();
    loadChatFromStorage();
});

// Usage tracking
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
    if (remaining === 0) {
        info.textContent = 'Tageslimit erreicht. Versuchen Sie es morgen wieder!';
        info.classList.add('text-yellow-500');
    } else {
        info.textContent = remaining + ' Nachrichten heute verfuegbar';
        info.classList.remove('text-yellow-500');
    }
}

// Chat persistence
function saveChatToStorage() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory));
}

function loadChatFromStorage() {
    const stored = localStorage.getItem(HISTORY_KEY);
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

// Suggestions
function useSuggestion(index) {
    if (suggestions[index]) {
        document.getElementById('chat-input').value = suggestions[index];
        sendMessage();
    }
}

// Auto-resize
function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// Enter key
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Send message
async function sendMessage() {
    if (isLoading) return;

    if (getRemainingUses() <= 0) {
        alert('Tageslimit erreicht. Versuchen Sie es morgen wieder!');
        return;
    }

    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || text.length < 2) return;

    document.getElementById('welcome-screen').classList.add('hidden');

    const userMsg = { role: 'user', content: text };
    chatHistory.push(userMsg);
    renderMessage(userMsg);
    input.value = '';
    input.style.height = 'auto';

    isLoading = true;
    document.getElementById('send-icon').classList.add('hidden');
    document.getElementById('send-spinner').classList.remove('hidden');
    showTypingIndicator();

    try {
        const apiHistory = chatHistory.slice(0, -1).map(m => ({
            role: m.role,
            content: m.content
        }));

        const response = await fetch('/api/enterprise/support', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, history: apiHistory })
        });

        if (!response.ok) {
            let errorMsg = 'Anfrage fehlgeschlagen';
            try {
                const error = await response.json();
                errorMsg = error.detail || errorMsg;
            } catch {
                errorMsg = 'Serverfehler (' + response.status + ')';
            }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        incrementUsage();
        updateUsageDisplay();

        const assistantMsg = {
            role: 'assistant',
            content: result.answer || '',
            category: result.category || 'allgemein',
            next_steps: result.next_steps || [],
            relevant_info: result.relevant_info || ''
        };
        chatHistory.push(assistantMsg);
        removeTypingIndicator();
        renderMessage(assistantMsg);
        saveChatToStorage();

    } catch (error) {
        console.error('Support error:', error);
        removeTypingIndicator();
        const errorMsg = {
            role: 'assistant',
            content: 'Es tut mir leid, es ist ein Fehler aufgetreten: ' + error.message,
            category: 'allgemein',
            next_steps: [],
            relevant_info: ''
        };
        chatHistory.push(errorMsg);
        renderMessage(errorMsg);
    } finally {
        isLoading = false;
        document.getElementById('send-icon').classList.remove('hidden');
        document.getElementById('send-spinner').classList.add('hidden');
    }
}

// Render message
function renderMessage(msg, scroll = true) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');

    if (msg.role === 'user') {
        div.className = 'flex justify-end';
        div.innerHTML = '<div class="bg-green-500/20 border border-green-500/30 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]"><p class="text-white text-sm">' + escapeHtml(msg.content) + '</p></div>';
    } else {
        const cat = msg.category || 'allgemein';
        const catLabel = categoryLabels[cat] || 'Allgemein';
        const catClass = 'cat-' + cat;

        let extra = '';

        // Next steps
        if (msg.next_steps && msg.next_steps.length > 0) {
            const stepsHtml = msg.next_steps.map(function(s) {
                return '<div class="flex items-start gap-2 text-xs text-gray-200"><span class="text-green-400 mt-0.5 shrink-0">&#10148;</span><span>' + escapeHtml(s) + '</span></div>';
            }).join('');
            extra += '<div class="mt-3 bg-green-500/5 border border-green-500/10 rounded-lg p-3"><div class="text-xs font-medium text-green-400 mb-2">Naechste Schritte</div><div class="space-y-1.5">' + stepsHtml + '</div></div>';
        }

        // Relevant info
        if (msg.relevant_info) {
            extra += '<div class="mt-2 text-xs text-gray-500 italic"><i class="fas fa-info-circle mr-1"></i>' + escapeHtml(msg.relevant_info) + '</div>';
        }

        div.className = 'flex justify-start';
        div.innerHTML = '<div class="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">' +
            '<div class="flex items-center gap-2 mb-2"><span class="text-xs font-semibold px-2 py-0.5 rounded-full ' + catClass + '">' + catLabel + '</span></div>' +
            '<div class="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">' + escapeHtml(msg.content) + '</div>' +
            extra +
            '</div>';
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
    div.innerHTML = '<div class="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3"><div class="flex gap-1"><div class="w-2 h-2 bg-green-400 rounded-full typing-dot"></div><div class="w-2 h-2 bg-green-400 rounded-full typing-dot"></div><div class="w-2 h-2 bg-green-400 rounded-full typing-dot"></div></div></div>';
    container.appendChild(div);
    scrollToBottom();
}

function removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

// Clear chat
function clearChat() {
    chatHistory = [];
    localStorage.removeItem(HISTORY_KEY);
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    const welcome = document.createElement('div');
    welcome.id = 'welcome-screen';
    welcome.className = 'flex flex-col items-center justify-center h-full text-center';
    welcome.innerHTML = '<div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4"><i class="fas fa-headset text-green-400 text-2xl"></i></div>' +
        '<h2 class="text-xl font-bold text-white mb-2">Willkommen beim Buergerservice</h2>' +
        '<p class="text-gray-400 text-sm mb-6 max-w-md">Ich beantworte Ihre Fragen zu Buergergeld, Antraegen und Leistungen nach SGB II.</p>' +
        '<div class="flex flex-wrap gap-2 justify-center max-w-lg">' +
        suggestions.map(function(s, i) {
            return '<button onclick="useSuggestion(' + i + ')" class="faq-chip text-xs px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-gray-300 hover:text-white transition">' + s + '</button>';
        }).join('') +
        '</div>';
    container.appendChild(welcome);
}

// Helpers
function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}