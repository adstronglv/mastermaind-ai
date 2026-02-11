/**
 * Mastermaind Authentication Module
 *
 * @copyright 2024-2026 Mastermaind. All rights reserved.
 * @author Mastermaind Team
 * @license Proprietary - Unauthorized copying, modification, or distribution prohibited.
 *
 * This software is the confidential and proprietary information of Mastermaind.
 */

(function() {
    'use strict';

    // Supabase configuration - will be set from server
    let supabaseUrl = '';
    let supabaseAnonKey = '';
    let supabaseClient = null;

    // Token storage key
    const TOKEN_KEY = 'mastermaind_token';
    const USER_KEY = 'mastermaind_user';

    /**
     * Initialize auth module with Supabase credentials
     */
    async function init() {
        try {
            // Fetch Supabase config from server
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                supabaseUrl = config.supabase_url;
                supabaseAnonKey = config.supabase_anon_key;

                if (supabaseUrl && supabaseAnonKey && window.supabase) {
                    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

                    // Listen for auth state changes
                    supabaseClient.auth.onAuthStateChange((event, session) => {
                        if (event === 'SIGNED_IN' && session) {
                            localStorage.setItem(TOKEN_KEY, session.access_token);
                            localStorage.setItem(USER_KEY, JSON.stringify(session.user));
                        } else if (event === 'SIGNED_OUT') {
                            localStorage.removeItem(TOKEN_KEY);
                            localStorage.removeItem(USER_KEY);
                        }
                    });

                    // Check for existing session
                    const { data: { session } } = await supabaseClient.auth.getSession();
                    if (session) {
                        localStorage.setItem(TOKEN_KEY, session.access_token);
                        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
                    }
                }
            }
        } catch (error) {
            console.error('Auth init error:', error);
        }
    }

    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} name - User name (optional)
     * @returns {Promise<Object>} - User data
     */
    async function signUp(email, password, name = '') {
        if (!supabaseClient) {
            throw new Error('Auth not initialized');
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (error) {
            throw error;
        }

        return data;
    }

    /**
     * Sign in an existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User data with session
     */
    async function signIn(email, password) {
        if (!supabaseClient) {
            throw new Error('Auth not initialized');
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            throw error;
        }

        if (data.session) {
            localStorage.setItem(TOKEN_KEY, data.session.access_token);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }

        return data;
    }

    /**
     * Sign out the current user
     */
    async function signOut() {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    function isLoggedIn() {
        return !!localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Get the current auth token
     * @returns {string|null}
     */
    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    /**
     * Get the current user from local storage
     * @returns {Object|null}
     */
    function getUser() {
        const userStr = localStorage.getItem(USER_KEY);
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Get auth headers for API requests
     * @returns {Object}
     */
    function getAuthHeaders() {
        const token = getToken();
        if (token) {
            return {
                'Authorization': `Bearer ${token}`
            };
        }
        return {};
    }

    /**
     * Make an authenticated API request
     * @param {string} url - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>}
     */
    async function authFetch(url, options = {}) {
        const headers = {
            ...options.headers,
            ...getAuthHeaders()
        };

        return fetch(url, {
            ...options,
            headers: headers
        });
    }

    /**
     * Reset password request
     * @param {string} email - User email
     */
    async function resetPassword(email) {
        if (!supabaseClient) {
            throw new Error('Auth not initialized');
        }

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password'
        });

        if (error) {
            throw error;
        }
    }

    /**
     * Update user password (after reset)
     * @param {string} newPassword - New password
     */
    async function updatePassword(newPassword) {
        if (!supabaseClient) {
            throw new Error('Auth not initialized');
        }

        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw error;
        }
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export to global window object
    window.auth = {
        init: init,
        signUp: signUp,
        signIn: signIn,
        signOut: signOut,
        isLoggedIn: isLoggedIn,
        getToken: getToken,
        getUser: getUser,
        getAuthHeaders: getAuthHeaders,
        authFetch: authFetch,
        resetPassword: resetPassword,
        updatePassword: updatePassword
    };

})();
