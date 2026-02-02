// Error Logger for AdStrong LV - using Supabase
// Logs client-side errors to Supabase table

(function() {
    const SUPABASE_URL = window.SUPABASE_URL || '';
    const SUPABASE_KEY = window.SUPABASE_ANON_KEY || '';

    // Don't log in development
    if (window.location.hostname === 'localhost') {
        console.log('Error logging disabled in development');
        return;
    }

    async function logError(errorData) {
        if (!SUPABASE_URL || !SUPABASE_KEY) return;

        try {
            await fetch(`${SUPABASE_URL}/rest/v1/error_logs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                body: JSON.stringify(errorData)
            });
        } catch (e) {
            // Silent fail - don't cause more errors
            console.error('Failed to log error:', e);
        }
    }

    // Catch uncaught errors
    window.onerror = function(message, source, lineno, colno, error) {
        logError({
            error_type: 'javascript',
            error_message: message,
            page_url: window.location.href,
            source_file: source,
            line_number: lineno,
            column_number: colno,
            stack_trace: error?.stack || null,
            user_agent: navigator.userAgent,
            language: localStorage.getItem('adstrong_lang') || 'en'
        });
    };

    // Catch unhandled promise rejections
    window.onunhandledrejection = function(event) {
        logError({
            error_type: 'promise_rejection',
            error_message: event.reason?.message || String(event.reason),
            page_url: window.location.href,
            stack_trace: event.reason?.stack || null,
            user_agent: navigator.userAgent,
            language: localStorage.getItem('adstrong_lang') || 'en'
        });
    };

    console.log('Error logging initialized');
})();
