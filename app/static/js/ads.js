/**
 * AdStrong LV Ad Creator - JavaScript
 */

// State
let selectedStyle = 'modern';
let selectedNiche = '';
let currentLanguage = localStorage.getItem('adstrong_lang') || 'en';
const DAILY_LIMIT = 3;
const STORAGE_KEY = 'adstrong_usage';

// Niche templates with pre-filled examples
const nicheTemplates = {
    fitness: {
        en: {
            business: "FitLife Studio",
            product: "Personal training, group fitness classes, gym membership",
            audience: "Health-conscious adults 25-45, people looking to get in shape",
            usp: "Expert trainers, modern equipment, flexible schedules"
        },
        de: {
            business: "FitLife Studio",
            product: "Personal Training, Gruppenfitness, Mitgliedschaft",
            audience: "Gesundheitsbewusste Erwachsene 25-45, Menschen die fit werden wollen",
            usp: "Erfahrene Trainer, moderne Geräte, flexible Zeiten"
        }
    },
    restaurant: {
        en: {
            business: "La Bella Italia",
            product: "Authentic Italian cuisine, fresh pasta, wood-fired pizza",
            audience: "Food lovers, families, couples looking for dining experience",
            usp: "Family recipes, imported ingredients, cozy atmosphere"
        },
        de: {
            business: "La Bella Italia",
            product: "Authentische italienische Küche, frische Pasta, Holzofenpizza",
            audience: "Feinschmecker, Familien, Paare für besonderes Dinner",
            usp: "Familienrezepte, importierte Zutaten, gemütliche Atmosphäre"
        }
    },
    beauty: {
        en: {
            business: "Glow Beauty Salon",
            product: "Hair styling, manicure, skincare treatments, makeup",
            audience: "Women 20-50, brides, professionals wanting to look their best",
            usp: "Luxury products, experienced stylists, relaxing atmosphere"
        },
        de: {
            business: "Glow Beauty Salon",
            product: "Haarstyling, Maniküre, Hautpflege, Make-up",
            audience: "Frauen 20-50, Bräute, Berufstätige die gut aussehen wollen",
            usp: "Luxusprodukte, erfahrene Stylisten, entspannte Atmosphäre"
        }
    },
    ecommerce: {
        en: {
            business: "StyleShop",
            product: "Trendy clothing, accessories, fashion items online",
            audience: "Fashion-conscious millennials, online shoppers",
            usp: "Fast shipping, easy returns, exclusive designs"
        },
        de: {
            business: "StyleShop",
            product: "Trendige Kleidung, Accessoires, Mode-Artikel online",
            audience: "Modebewusste Millennials, Online-Käufer",
            usp: "Schneller Versand, einfache Rückgabe, exklusive Designs"
        }
    },
    realestate: {
        en: {
            business: "Prime Properties",
            product: "Luxury apartments, family homes, investment properties",
            audience: "Home buyers, investors, relocating professionals",
            usp: "Best locations, trusted agents, seamless process"
        },
        de: {
            business: "Prime Properties",
            product: "Luxuswohnungen, Familienhäuser, Anlageimmobilien",
            audience: "Hauskäufer, Investoren, umziehende Berufstätige",
            usp: "Beste Lagen, vertrauenswürdige Makler, reibungsloser Ablauf"
        }
    },
    coaching: {
        en: {
            business: "Success Coaching",
            product: "Life coaching, business mentoring, personal development",
            audience: "Entrepreneurs, executives, people seeking growth",
            usp: "Proven methods, personalized approach, real results"
        },
        de: {
            business: "Success Coaching",
            product: "Life Coaching, Business Mentoring, Persönlichkeitsentwicklung",
            audience: "Unternehmer, Führungskräfte, Menschen die wachsen wollen",
            usp: "Bewährte Methoden, persönlicher Ansatz, echte Ergebnisse"
        }
    },
    tech: {
        en: {
            business: "TechFlow Solutions",
            product: "Project management software, productivity tools, SaaS platform",
            audience: "Small businesses, startups, remote teams",
            usp: "Easy to use, saves time, excellent support"
        },
        de: {
            business: "TechFlow Solutions",
            product: "Projektmanagement-Software, Produktivitäts-Tools, SaaS-Plattform",
            audience: "Kleine Unternehmen, Startups, Remote-Teams",
            usp: "Einfach zu bedienen, spart Zeit, exzellenter Support"
        }
    },
    other: {
        en: {
            business: "",
            product: "",
            audience: "",
            usp: ""
        },
        de: {
            business: "",
            product: "",
            audience: "",
            usp: ""
        }
    }
};

// Translations
const translations = {
    en: {
        hero_title: "Create Ads with AI",
        hero_subtitle: "Generate stunning ad creatives in seconds. Just describe your business and let AI do the rest.",
        free_generations: "3 free generations/day",
        no_signup: "No signup required",
        niche_title: "Choose Your Industry",
        niche_badge: "Quick Start",
        niche_fitness: "Fitness",
        niche_restaurant: "Restaurant",
        niche_beauty: "Beauty Salon",
        niche_ecommerce: "E-commerce",
        niche_realestate: "Real Estate",
        niche_coaching: "Coaching",
        niche_tech: "Tech/SaaS",
        niche_other: "Other",
        step1_title: "Describe Your Business",
        label_business: "Business Name",
        label_product: "What do you sell?",
        label_audience: "Target Audience",
        label_usp: "Unique Selling Point",
        placeholder_business: "e.g. TechFlow Solutions",
        placeholder_product: "e.g. Project management software",
        placeholder_audience: "e.g. Small business owners, Startups",
        placeholder_usp: "e.g. 10x faster than competitors",
        step2_title: "Choose Style",
        step3_title: "Select Platforms",
        step4_title: "Image Content",
        include_people: "Include people in images",
        include_people_note: "AI-generated people may occasionally have imperfections. Use Regenerate if needed.",
        generate_btn: "Generate 3 Ad Variants",
        generating_btn: "Generating...",
        loading_title: "Creating Your Ads...",
        loading_subtitle: "This usually takes 20-30 seconds",
        warning_expire: "Download now! Image links expire in 1 hour.",
        results_title: "Your Ad Creatives",
        usage_remaining: "{n} generation{s} remaining today",
        usage_limit: "Daily limit reached. Try again tomorrow!"
    },
    de: {
        hero_title: "Werbung mit KI erstellen",
        hero_subtitle: "Erstelle beeindruckende Werbeanzeigen in Sekunden. Beschreibe einfach dein Unternehmen und lass die KI den Rest erledigen.",
        free_generations: "3 kostenlose Generierungen/Tag",
        no_signup: "Keine Anmeldung erforderlich",
        niche_title: "Wähle deine Branche",
        niche_badge: "Schnellstart",
        niche_fitness: "Fitness",
        niche_restaurant: "Restaurant",
        niche_beauty: "Kosmetik",
        niche_ecommerce: "E-Commerce",
        niche_realestate: "Immobilien",
        niche_coaching: "Coaching",
        niche_tech: "Tech/SaaS",
        niche_other: "Andere",
        step1_title: "Beschreibe dein Unternehmen",
        label_business: "Firmenname",
        label_product: "Was verkaufst du?",
        label_audience: "Zielgruppe",
        label_usp: "Alleinstellungsmerkmal",
        placeholder_business: "z.B. TechFlow Solutions",
        placeholder_product: "z.B. Projektmanagement-Software",
        placeholder_audience: "z.B. Kleinunternehmer, Startups",
        placeholder_usp: "z.B. 10x schneller als die Konkurrenz",
        step2_title: "Stil wählen",
        step3_title: "Plattformen wählen",
        step4_title: "Bildinhalt",
        include_people: "Personen in Bildern einbeziehen",
        include_people_note: "KI-generierte Personen können gelegentlich Unvollkommenheiten aufweisen. Nutze bei Bedarf Regenerieren.",
        generate_btn: "3 Anzeigenvarianten generieren",
        generating_btn: "Generiere...",
        loading_title: "Deine Anzeigen werden erstellt...",
        loading_subtitle: "Dies dauert normalerweise 20-30 Sekunden",
        warning_expire: "Jetzt herunterladen! Bildlinks laufen in 1 Stunde ab.",
        results_title: "Deine Werbeanzeigen",
        usage_remaining: "{n} Generierung{s} heute übrig",
        usage_limit: "Tageslimit erreicht. Versuche es morgen wieder!"
    }
};

// Loading quotes from famous people
const loadingQuotes = [
    { quote: "The best marketing doesn't feel like marketing.", author: "Tom Fishburne" },
    { quote: "Content is fire, social media is gasoline.", author: "Jay Baer" },
    { quote: "Make the customer the hero of your story.", author: "Ann Handley" },
    { quote: "People don't buy what you do, they buy why you do it.", author: "Simon Sinek" },
    { quote: "The aim of marketing is to know the customer so well the product sells itself.", author: "Peter Drucker" },
    { quote: "Good advertising does not just circulate information. It penetrates the public mind with desires.", author: "Leo Burnett" },
    { quote: "Creativity without strategy is called art. Creativity with strategy is called advertising.", author: "Jef Richards" },
    { quote: "In advertising, not to be different is virtually suicidal.", author: "Bill Bernbach" },
    { quote: "The best ideas come as jokes. Make your thinking as funny as possible.", author: "David Ogilvy" },
    { quote: "Your brand is what people say about you when you're not in the room.", author: "Jeff Bezos" },
    { quote: "Marketing is no longer about the stuff you make, but the stories you tell.", author: "Seth Godin" },
    { quote: "Don't find customers for your products, find products for your customers.", author: "Seth Godin" },
    { quote: "The consumer is not a moron. She is your wife.", author: "David Ogilvy" },
    { quote: "Advertising is fundamentally persuasion.", author: "William Bernbach" },
    { quote: "Great companies don't hire skilled people and motivate them, they hire already motivated people.", author: "Simon Sinek" }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateUsageDisplay();
    setInterval(rotateLoadingQuote, 6000);  // Slower rotation - 6 seconds
    applyLanguage(currentLanguage);  // Apply saved language
});

// Language functions
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('adstrong_lang', lang);
    applyLanguage(lang);

    // Update button styles
    document.getElementById('lang-en').classList.toggle('bg-pink-500', lang === 'en');
    document.getElementById('lang-en').classList.toggle('text-white', lang === 'en');
    document.getElementById('lang-en').classList.toggle('text-gray-400', lang !== 'en');
    document.getElementById('lang-de').classList.toggle('bg-pink-500', lang === 'de');
    document.getElementById('lang-de').classList.toggle('text-white', lang === 'de');
    document.getElementById('lang-de').classList.toggle('text-gray-400', lang !== 'de');
}

function applyLanguage(lang) {
    const t = translations[lang];

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.placeholder = t[key];
        }
    });

    // Update usage display with correct language
    updateUsageDisplay();
}

// Niche selection
function selectNiche(niche) {
    selectedNiche = niche;

    // Update button styles
    document.querySelectorAll('.niche-btn').forEach(btn => {
        btn.classList.remove('border-pink-500', 'bg-pink-500/10');
        btn.classList.add('border-white/20', 'bg-white/5');
    });

    const activeBtn = document.querySelector(`[data-niche="${niche}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('border-white/20', 'bg-white/5');
        activeBtn.classList.add('border-pink-500', 'bg-pink-500/10');
    }

    // Pre-fill form with template data
    if (nicheTemplates[niche]) {
        const template = nicheTemplates[niche][currentLanguage] || nicheTemplates[niche].en;

        document.getElementById('business-name').value = template.business;
        document.getElementById('product').value = template.product;
        document.getElementById('audience').value = template.audience;
        document.getElementById('usp').value = template.usp;

        // Smooth scroll to form if template has content
        if (template.business) {
            document.getElementById('business-name').focus();
        }
    }
}

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
    const t = translations[currentLanguage];

    if (remaining === 0) {
        usageInfo.textContent = t.usage_limit;
        usageInfo.classList.add('text-yellow-500');
    } else {
        const plural = remaining !== 1 ? (currentLanguage === 'de' ? 'en' : 's') : '';
        usageInfo.textContent = t.usage_remaining.replace('{n}', remaining).replace('{s}', plural);
        usageInfo.classList.remove('text-yellow-500');
    }
}

// Rotate loading quotes
function rotateLoadingQuote() {
    const quoteEl = document.getElementById('loading-quote');
    const authorEl = document.getElementById('loading-author');
    const loadingState = document.getElementById('loading-state');

    if (quoteEl && authorEl && loadingState && !loadingState.classList.contains('hidden')) {
        const randomQuote = loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)];

        // Fade out
        quoteEl.style.opacity = '0';
        authorEl.style.opacity = '0';

        setTimeout(() => {
            quoteEl.textContent = `"${randomQuote.quote}"`;
            authorEl.textContent = `— ${randomQuote.author}`;
            // Fade in
            quoteEl.style.opacity = '1';
            authorEl.style.opacity = '1';
        }, 300);
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
        niche: selectedNiche || 'other',
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
