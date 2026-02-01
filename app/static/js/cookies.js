/**
 * AdStrong Cookie Consent Banner
 * Simple GDPR-compliant cookie consent
 */

(function() {
    'use strict';

    const CONSENT_KEY = 'adstrong_cookie_consent';

    // Check if consent was already given
    function hasConsent() {
        return localStorage.getItem(CONSENT_KEY) === 'accepted';
    }

    // Accept cookies
    function acceptCookies() {
        localStorage.setItem(CONSENT_KEY, 'accepted');
        hideBanner();
    }

    // Show the banner
    function showBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('hidden');
        }
    }

    // Hide the banner
    function hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.add('hidden');
        }
    }

    // Create and inject the banner HTML
    function createBanner() {
        const lang = localStorage.getItem('adstrong_lang') || 'en';

        const text = {
            en: {
                message: 'We use cookies to improve your experience.',
                accept: 'Accept',
                more: 'Learn more'
            },
            de: {
                message: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.',
                accept: 'Akzeptieren',
                more: 'Mehr erfahren'
            }
        };

        const t = text[lang] || text.en;

        const bannerHTML = `
            <div id="cookie-banner" class="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-lg border-t border-white/10 p-4 z-50 hidden">
                <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p class="text-gray-300 text-sm text-center sm:text-left">
                        ${t.message}
                        <a href="/datenschutz" class="text-purple-400 hover:text-purple-300 ml-1">${t.more}</a>
                    </p>
                    <button onclick="window.acceptCookies()" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition whitespace-nowrap">
                        ${t.accept}
                    </button>
                </div>
            </div>
        `;

        // Insert at the end of body
        document.body.insertAdjacentHTML('beforeend', bannerHTML);
    }

    // Initialize
    function init() {
        if (!hasConsent()) {
            createBanner();
            showBanner();
        }
    }

    // Expose acceptCookies to window for onclick
    window.acceptCookies = acceptCookies;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
