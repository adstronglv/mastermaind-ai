/**
 * Troubleshooting Module - mastermaind.ai
 * Analyze logs and error messages with AI.
 */

let currentLanguage = localStorage.getItem('mastermaind_lang') || 'en';

const translations = {
    en: {
        badge_text: 'IT Troubleshooting',
        hero_title: 'AI Troubleshooting',
        hero_subtitle: 'Paste error messages and logs. AI analyzes the root cause and suggests solutions.',
        step1_title: 'Log / Error Message',
        step2_title: 'System Type',
        demo_windows: 'Windows Event Log',
        demo_linux: 'Linux Syslog',
        demo_app: 'Application Error',
        placeholder_log: 'Paste error message or log excerpt here...',
        analyze_btn: 'Analyze Error',
        result_severity: 'Severity',
        result_analysis: 'Analysis',
        result_solutions: 'Solutions',
        result_prevention: 'Prevention',
        remaining: 'analyses remaining today',
        limit_reached: 'Daily limit reached. Try again tomorrow.',
        too_short: 'Please enter at least 10 characters.',
        error_generic: 'Analysis failed. Please try again.',
        sys_windows: 'Windows Server',
        sys_linux: 'Linux Server',
        sys_webapp: 'Web Application',
        sys_db: 'Database',
        sys_network: 'Network',
        sys_general: 'General / Other'
    },
    de: {
        badge_text: 'IT Troubleshooting',
        hero_title: 'KI-Troubleshooting',
        hero_subtitle: 'Fehlermeldungen und Logs einfügen. KI analysiert die Ursache und schlägt Lösungen vor.',
        step1_title: 'Log / Fehlermeldung',
        step2_title: 'Systemtyp',
        demo_windows: 'Windows Event Log',
        demo_linux: 'Linux Syslog',
        demo_app: 'Anwendungsfehler',
        placeholder_log: 'Fehlermeldung oder Log-Auszug hier einfügen...',
        analyze_btn: 'Fehler analysieren',
        result_severity: 'Schweregrad',
        result_analysis: 'Analyse',
        result_solutions: 'Lösungsvorschläge',
        result_prevention: 'Prävention',
        remaining: 'Analysen verbleibend heute',
        limit_reached: 'Tageslimit erreicht. Versuche es morgen erneut.',
        too_short: 'Bitte mindestens 10 Zeichen eingeben.',
        error_generic: 'Analyse fehlgeschlagen. Bitte erneut versuchen.',
        sys_windows: 'Windows Server',
        sys_linux: 'Linux Server',
        sys_webapp: 'Web-Anwendung',
        sys_db: 'Datenbank',
        sys_network: 'Netzwerk',
        sys_general: 'Allgemein / Sonstige'
    }
};

// Demo log data
const demoLogs = {
    windows: {
        en: `Event ID: 7034
Source: Service Control Manager
Level: Error
Date: 2026-02-15 08:23:41

The Print Spooler service terminated unexpectedly. It has done this 3 time(s).
The following corrective action will be taken in 60000 milliseconds: Restart the service.

Additional Data:
- Service: Spooler
- PID: 4528
- Exit Code: 0xC0000005 (ACCESS_VIOLATION)
- Last successful start: 2026-02-15 06:00:12
- Memory usage at crash: 2.1 GB (normal: ~200 MB)`,
        de: `Event ID: 7034
Quelle: Dienststeuerungs-Manager
Ebene: Fehler
Datum: 15.02.2026 08:23:41

Der Dienst "Druckwarteschlange" wurde unerwartet beendet. Dies ist bereits 3 Mal vorgekommen.
Folgende Korrekturmaßnahme wird in 60000 Millisekunden durchgeführt: Dienst neu starten.

Zusätzliche Daten:
- Dienst: Spooler
- PID: 4528
- Exit-Code: 0xC0000005 (ZUGRIFFSVERLETZUNG)
- Letzter erfolgreicher Start: 15.02.2026 06:00:12
- Speicherverbrauch beim Absturz: 2,1 GB (normal: ~200 MB)`
    },
    linux: {
        en: `Feb 15 03:42:18 srv-db01 kernel: [482916.234] Out of memory: Kill process 8412 (postgres) score 892 or sacrifice child
Feb 15 03:42:18 srv-db01 kernel: [482916.234] Killed process 8412 (postgres) total-vm:8234560kB, anon-rss:7891234kB
Feb 15 03:42:19 srv-db01 systemd[1]: postgresql.service: Main process exited, code=killed, status=9/KILL
Feb 15 03:42:19 srv-db01 systemd[1]: postgresql.service: Failed with result 'signal'.
Feb 15 03:42:20 srv-db01 systemd[1]: postgresql.service: Scheduled restart job, restart counter is at 5.
Feb 15 03:42:21 srv-db01 postgresql[8501]: LOG: database system was not shut down cleanly
Feb 15 03:42:21 srv-db01 postgresql[8501]: LOG: automatic recovery in progress`,
        de: `Feb 15 03:42:18 srv-db01 kernel: [482916.234] Out of memory: Kill process 8412 (postgres) score 892 or sacrifice child
Feb 15 03:42:18 srv-db01 kernel: [482916.234] Killed process 8412 (postgres) total-vm:8234560kB, anon-rss:7891234kB
Feb 15 03:42:19 srv-db01 systemd[1]: postgresql.service: Hauptprozess beendet, code=killed, status=9/KILL
Feb 15 03:42:19 srv-db01 systemd[1]: postgresql.service: Fehlgeschlagen mit Ergebnis 'signal'.
Feb 15 03:42:20 srv-db01 systemd[1]: postgresql.service: Geplanter Neustart, Neustart-Zähler bei 5.
Feb 15 03:42:21 srv-db01 postgresql[8501]: LOG: Datenbanksystem wurde nicht sauber heruntergefahren
Feb 15 03:42:21 srv-db01 postgresql[8501]: LOG: automatische Wiederherstellung läuft`
    },
    app: {
        en: `[2026-02-15 14:32:07] ERROR [app.api.handlers] Unhandled exception in request handler
Traceback (most recent call last):
  File "/app/api/handlers.py", line 142, in process_request
    result = await db.execute(query, params)
  File "/app/database/connection.py", line 89, in execute
    async with self.pool.acquire() as conn:
asyncpg.exceptions.TooManyConnectionsError: sorry, too many clients already
  Connection pool exhausted: 50/50 connections in use
  Oldest connection age: 847 seconds

[2026-02-15 14:32:07] WARNING [app.database] Connection pool at capacity (50/50)
[2026-02-15 14:32:08] ERROR [app.api.handlers] 23 requests queued, avg wait time: 12.4s
[2026-02-15 14:32:10] CRITICAL [app.monitoring] Health check failed: database connection timeout after 30s`,
        de: `[15.02.2026 14:32:07] FEHLER [app.api.handlers] Unbehandelte Ausnahme im Request-Handler
Traceback (most recent call last):
  File "/app/api/handlers.py", Zeile 142, in process_request
    result = await db.execute(query, params)
  File "/app/database/connection.py", Zeile 89, in execute
    async with self.pool.acquire() as conn:
asyncpg.exceptions.TooManyConnectionsError: sorry, too many clients already
  Verbindungspool erschöpft: 50/50 Verbindungen in Benutzung
  Älteste Verbindung: 847 Sekunden

[15.02.2026 14:32:07] WARNUNG [app.database] Verbindungspool bei Kapazitätsgrenze (50/50)
[15.02.2026 14:32:08] FEHLER [app.api.handlers] 23 Anfragen in Warteschlange, Ø Wartezeit: 12,4s
[15.02.2026 14:32:10] KRITISCH [app.monitoring] Health-Check fehlgeschlagen: Datenbankverbindung Timeout nach 30s`
    }
};

// Usage tracking
const STORAGE_KEY = 'mastermaind_troubleshoot_usage';
const DAILY_LIMIT = 5;

function getUsageData() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const today = new Date().toISOString().split('T')[0];
        if (data.date !== today) {
            return { date: today, count: 0 };
        }
        return data;
    } catch {
        return { date: new Date().toISOString().split('T')[0], count: 0 };
    }
}

function getRemainingUses() {
    const data = getUsageData();
    return Math.max(0, DAILY_LIMIT - data.count);
}

function incrementUsage() {
    const data = getUsageData();
    data.count++;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function updateUsageDisplay() {
    const t = translations[currentLanguage];
    const remaining = getRemainingUses();
    const el = document.getElementById('usage-info');
    if (el) {
        el.textContent = `${remaining} ${t.remaining}`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Language
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('mastermaind_lang', lang);
    applyLanguage(lang);

    const enBtn = document.getElementById('lang-en');
    const deBtn = document.getElementById('lang-de');
    if (lang === 'en') {
        enBtn.className = 'px-2 py-1 rounded text-sm font-medium transition bg-pink-500 text-white';
        deBtn.className = 'px-2 py-1 rounded text-sm font-medium transition text-gray-400 hover:text-white';
    } else {
        deBtn.className = 'px-2 py-1 rounded text-sm font-medium transition bg-pink-500 text-white';
        enBtn.className = 'px-2 py-1 rounded text-sm font-medium transition text-gray-400 hover:text-white';
    }

    updateUsageDisplay();
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
    document.querySelectorAll('[data-i18n-option]').forEach(el => {
        const key = el.getAttribute('data-i18n-option');
        if (t[key]) el.textContent = t[key];
    });
}

// Demo data
function loadDemo(type) {
    const lang = currentLanguage;
    const demo = demoLogs[type];
    if (demo) {
        document.getElementById('log-input').value = demo[lang] || demo.en;

        // Set matching system type
        const systemMap = { windows: 'windows_server', linux: 'linux_server', app: 'web_application' };
        const select = document.getElementById('system-select');
        if (systemMap[type]) select.value = systemMap[type];
    }
}

// Main analysis function
async function analyzeLog() {
    const t = translations[currentLanguage];

    if (getRemainingUses() <= 0) {
        alert(t.limit_reached);
        return;
    }

    const logText = document.getElementById('log-input').value.trim();
    if (!logText || logText.length < 10) {
        alert(t.too_short);
        return;
    }

    const systemType = document.getElementById('system-select').value;
    const btn = document.getElementById('analyze-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');

    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = currentLanguage === 'de' ? 'Analysiere...' : 'Analyzing...';

    try {
        const response = await fetch('/api/enterprise/troubleshoot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ log_text: logText, system_type: systemType })
        });

        if (!response.ok) {
            let errorMsg = t.error_generic;
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
        alert(error.message || t.error_generic);
    } finally {
        btn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = t.analyze_btn;
    }
}

function displayResults(result) {
    // Severity badge
    const severityBadge = document.getElementById('severity-badge');
    const severity = (result.severity || 'medium').toLowerCase();
    const severityColors = {
        critical: 'bg-red-500 text-white',
        high: 'bg-orange-500 text-white',
        medium: 'bg-yellow-500 text-black',
        low: 'bg-green-500 text-white'
    };
    const severityLabels = {
        critical: currentLanguage === 'de' ? 'Kritisch' : 'Critical',
        high: currentLanguage === 'de' ? 'Hoch' : 'High',
        medium: currentLanguage === 'de' ? 'Mittel' : 'Medium',
        low: currentLanguage === 'de' ? 'Niedrig' : 'Low'
    };
    severityBadge.className = `px-4 py-1.5 rounded-full text-sm font-bold uppercase ${severityColors[severity] || severityColors.medium}`;
    severityBadge.textContent = severityLabels[severity] || severity;

    // Root cause
    const rootCauseEl = document.getElementById('result-root-cause');
    rootCauseEl.innerHTML = result.root_cause
        ? `<div class="mt-2 bg-white/5 rounded-lg p-3 border border-white/10"><span class="text-red-300 font-medium">${currentLanguage === 'de' ? 'Ursache:' : 'Root Cause:'}</span> ${escapeHtml(result.root_cause)}</div>`
        : '';

    // Analysis
    document.getElementById('result-analysis').textContent = result.analysis || '';

    // Solutions
    const solEl = document.getElementById('result-solutions');
    solEl.innerHTML = '';
    (result.solutions || []).forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-start gap-2 text-sm text-gray-200';
        div.innerHTML = `<span class="text-green-400 mt-0.5 flex-shrink-0">&#10003;</span><span>${escapeHtml(s)}</span>`;
        solEl.appendChild(div);
    });

    // Prevention
    const prevEl = document.getElementById('result-prevention');
    prevEl.innerHTML = '';
    (result.prevention || []).forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'flex items-start gap-2 text-sm text-gray-200';
        div.innerHTML = `<span class="text-blue-400 mt-0.5 flex-shrink-0">&#128737;</span><span>${escapeHtml(p)}</span>`;
        prevEl.appendChild(div);
    });

    // Show results
    document.getElementById('results-section').classList.remove('hidden');
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLanguage);
    updateUsageDisplay();

    // Set correct language button state
    if (currentLanguage === 'de') {
        setLanguage('de');
    }
});
