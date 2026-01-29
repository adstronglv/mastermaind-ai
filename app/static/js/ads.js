/**
 * AdStrong Ad Creator - JavaScript
 */

// State
let selectedStyle = 'modern';
const DAILY_LIMIT = 3;
const STORAGE_KEY = 'adstrong_usage';

// Loading tips
const loadingTips = [
    "High-quality images increase CTR by up to 40%",
    "Ads with clear CTAs convert 2x better",
    "Emotional headlines outperform logical ones",
    "Using faces in ads increases engagement",
    "Consistent branding builds trust",
    "A/B testing can improve conversions by 300%",
    "Mobile-first design is essential in 2026"
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateUsageDisplay();
    setInterval(rotateLoadingTip, 3000);
});

// Style selection
function selectStyle(style) {
    selectedStyle = style;

    // Update button styles
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.classList.remove('active', 'border-pink-500', 'bg-pink-500/10');
        btn.classList.add('border-white/20', 'bg-white/5');
    });

    const activeBtn = document.getElementById(`style-${style}`);
    if (activeBtn) {
        activeBtn.classList.remove('border-white/20', 'bg-white/5');
        activeBtn.classList.add('active', 'border-pink-500', 'bg-pink-500/10');
    }
}

// Rate limiting with localStorage
function getUsageData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { date: '', count: 0 };

    try {
        return JSON.parse(stored);
    } catch {
        return { date: '', count: 0 };
    }
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function getRemainingGenerations() {
    const usage = getUsageData();
    const today = getTodayString();

    if (usage.date !== today) {
        return DAILY_LIMIT;
    }

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
    const remaining = getRemainingGenerations();
    const usageInfo = document.getElementById('usage-info');

    if (remaining === 0) {
        usageInfo.textContent = 'Daily limit reached. Try again tomorrow!';
        usageInfo.classList.add('text-yellow-500');
    } else {
        usageInfo.textContent = `${remaining} generation${remaining !== 1 ? 's' : ''} remaining today`;
        usageInfo.classList.remove('text-yellow-500');
    }
}

// Rotate loading tips
function rotateLoadingTip() {
    const tipEl = document.getElementById('loading-tip');
    if (tipEl && !tipEl.closest('#loading-state').classList.contains('hidden')) {
        const randomTip = loadingTips[Math.floor(Math.random() * loadingTips.length)];
        tipEl.textContent = `"${randomTip}"`;
    }
}

// Form validation
function validateForm() {
    const businessName = document.getElementById('business-name').value.trim();
    const product = document.getElementById('product').value.trim();
    const audience = document.getElementById('audience').value.trim();

    if (!businessName || businessName.length < 2) {
        alert('Please enter a business name');
        return false;
    }

    if (!product || product.length < 5) {
        alert('Please describe what you sell (at least 5 characters)');
        return false;
    }

    if (!audience || audience.length < 3) {
        alert('Please describe your target audience');
        return false;
    }

    return true;
}

// Get selected platforms
function getSelectedPlatforms() {
    const platforms = [];

    if (document.getElementById('platform-instagram').checked) platforms.push('instagram');
    if (document.getElementById('platform-facebook').checked) platforms.push('facebook');
    if (document.getElementById('platform-google').checked) platforms.push('google');
    if (document.getElementById('platform-linkedin').checked) platforms.push('linkedin');

    return platforms.length > 0 ? platforms : ['instagram'];
}

// Main generate function
async function generateAds() {
    // Check rate limit
    if (getRemainingGenerations() <= 0) {
        alert('You have reached your daily limit. Try again tomorrow!');
        return;
    }

    // Validate form
    if (!validateForm()) return;

    // Get form data
    const data = {
        business_name: document.getElementById('business-name').value.trim(),
        product: document.getElementById('product').value.trim(),
        audience: document.getElementById('audience').value.trim(),
        usp: document.getElementById('usp').value.trim() || '',
        style: selectedStyle,
        platforms: getSelectedPlatforms(),
        include_people: document.getElementById('include-people').checked
    };

    // UI: Show loading
    const generateBtn = document.getElementById('generate-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const loadingState = document.getElementById('loading-state');
    const resultsSection = document.getElementById('results-section');

    generateBtn.disabled = true;
    btnText.textContent = 'Generating...';
    btnSpinner.classList.remove('hidden');
    loadingState.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    // Animate progress bar
    const progressBar = document.getElementById('progress-bar');
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressBar.style.width = `${progress}%`;
    }, 1000);

    try {
        const response = await fetch('/api/ads/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Generation failed');
        }

        const result = await response.json();

        // Complete progress bar
        clearInterval(progressInterval);
        progressBar.style.width = '100%';

        // Increment usage
        incrementUsage();
        updateUsageDisplay();

        // Display results
        displayResults(result);

    } catch (error) {
        console.error('Generation error:', error);
        alert('Something went wrong. Please try again. Error: ' + error.message);
    } finally {
        // Reset UI
        clearInterval(progressInterval);
        generateBtn.disabled = false;
        btnText.textContent = 'Generate 3 Ad Variants';
        btnSpinner.classList.add('hidden');
        loadingState.classList.add('hidden');
    }
}

// Display results
function displayResults(result) {
    const resultsSection = document.getElementById('results-section');
    const resultsGrid = document.getElementById('results-grid');

    // Clear previous results
    resultsGrid.innerHTML = '';

    // Create cards for each ad variant
    result.ads.forEach((ad, index) => {
        const card = document.createElement('div');
        card.className = 'bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden';

        card.innerHTML = `
            <div class="relative">
                <img src="${ad.image_url}" alt="Ad variant ${index + 1}" class="w-full aspect-square object-cover">
                <div class="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Variant ${index + 1}
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-white font-semibold mb-2">${escapeHtml(ad.headline)}</h3>
                <p class="text-gray-400 text-sm mb-4">${escapeHtml(ad.copy)}</p>
                <div class="flex gap-2">
                    <button onclick="downloadImage('${ad.image_url}', 'adstrong-ad-${index + 1}.png')" class="flex-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download
                    </button>
                    <button onclick="regenerateImage(${index})" id="regen-btn-${index}" class="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-2 px-3 rounded-lg text-sm font-medium transition" title="Regenerate image">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                    </button>
                    <button onclick="copyText('${escapeHtml(ad.headline)}\\n\\n${escapeHtml(ad.copy)}')" class="bg-white/10 hover:bg-white/20 text-white py-2 px-3 rounded-lg text-sm font-medium transition" title="Copy text">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        resultsGrid.appendChild(card);
    });

    // Store results for download all
    window.currentResults = result;

    // Show results section
    resultsSection.classList.remove('hidden');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Download single image
async function downloadImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
        // Fallback: open in new tab
        window.open(url, '_blank');
    }
}

// Download all images
async function downloadAll() {
    if (!window.currentResults || !window.currentResults.ads) {
        alert('No images to download');
        return;
    }

    for (let i = 0; i < window.currentResults.ads.length; i++) {
        const ad = window.currentResults.ads[i];
        await downloadImage(ad.image_url, `adstrong-ad-${i + 1}.png`);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// Regenerate single image
async function regenerateImage(index) {
    if (!window.currentResults || !window.currentResults.ads[index]) {
        alert('No image to regenerate');
        return;
    }

    const ad = window.currentResults.ads[index];
    const btn = document.getElementById(`regen-btn-${index}`);
    const card = btn.closest('.bg-white\\/5');
    const img = card.querySelector('img');

    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';
    img.style.opacity = '0.5';

    try {
        const response = await fetch('/api/ads/regenerate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: ad.prompt_used })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Regeneration failed');
        }

        const result = await response.json();

        // Update the image
        img.src = result.image_url;
        img.style.opacity = '1';

        // Update stored results
        window.currentResults.ads[index].image_url = result.image_url;

        // Update download button
        const downloadBtn = card.querySelector('button[onclick^="downloadImage"]');
        downloadBtn.setAttribute('onclick', `downloadImage('${result.image_url}', 'adstrong-ad-${index + 1}.png')`);

    } catch (error) {
        console.error('Regeneration error:', error);
        alert('Failed to regenerate. Please try again.');
        img.style.opacity = '1';
    } finally {
        // Restore button
        btn.disabled = false;
        btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>';
    }
}

// Copy text to clipboard
function copyText(text) {
    // Unescape the text
    const unescaped = text.replace(/\\n/g, '\n');

    navigator.clipboard.writeText(unescaped).then(() => {
        // Show brief feedback
        const originalText = event.target.innerHTML;
        event.target.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
        setTimeout(() => {
            event.target.innerHTML = originalText;
        }, 1500);
    }).catch(err => {
        console.error('Copy failed:', err);
        alert('Failed to copy text');
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
