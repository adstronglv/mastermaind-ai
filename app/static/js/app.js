// PromptEngineer - Frontend JavaScript

let currentTaskType = 'general';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    loadTips();
    setupCharCounter();
});

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
    const prompt = document.getElementById('input-prompt').value.trim();

    if (prompt.length < 10) {
        alert('Please enter at least 10 characters');
        return;
    }

    if (prompt.length > 5000) {
        alert('Prompt is too long (max 5000 characters)');
        return;
    }

    // Show loading
    const btn = document.getElementById('optimize-btn');
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');

    btn.classList.add('loading');
    btnText.textContent = 'Optimizing...';
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
        alert('Error: ' + error.message);
    } finally {
        btn.classList.remove('loading');
        btnText.textContent = 'Optimize Prompt';
        spinner.classList.add('hidden');
    }
}

// Display results
function displayResults(data) {
    const results = document.getElementById('results');
    results.classList.remove('hidden');
    results.classList.add('fade-in');

    // Scores
    document.getElementById('score-before').textContent = data.score_before || '-';
    document.getElementById('score-after').textContent = data.score_after || '-';

    // Score bar
    const scoreBar = document.getElementById('score-bar');
    const improvement = ((data.score_after || 0) / 10) * 100;
    scoreBar.style.width = `${improvement}%`;

    // Optimized prompt
    document.getElementById('optimized-prompt').textContent = data.optimized || data.original;

    // Improvements
    const improvementsList = document.getElementById('improvements-list');
    improvementsList.innerHTML = '';
    (data.improvements || []).forEach(imp => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-2 text-gray-300';
        li.innerHTML = `
            <svg class="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span>${imp}</span>
        `;
        improvementsList.appendChild(li);
    });

    // Tips
    const tipsList = document.getElementById('tips-list');
    tipsList.innerHTML = '';
    (data.tips || []).forEach(tip => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-2 text-gray-300';
        li.innerHTML = `
            <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <span>${tip}</span>
        `;
        tipsList.appendChild(li);
    });

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Copy optimized prompt
function copyOptimized() {
    const text = document.getElementById('optimized-prompt').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    });
}

// Load templates
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();

        const grid = document.getElementById('templates-grid');
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load tips
async function loadTips() {
    try {
        const response = await fetch('/api/tips');
        const data = await response.json();

        const grid = document.getElementById('tips-grid');
        grid.innerHTML = '';

        data.tips.forEach(tip => {
            const card = document.createElement('div');
            card.className = 'tip-card';
            card.innerHTML = `
                <h3 class="text-white font-semibold mb-2">${tip.title}</h3>
                <p class="text-gray-400 text-sm">${tip.description}</p>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Failed to load tips:', error);
    }
}
