/**
 * authConfig.js – MSAL.js authentication configuration and lifecycle
 *
 * SETUP:
 *   1. Create an Azure App Registration in Entra ID (single-tenant, SPA platform).
 *   2. Set MSAL_CONFIG.auth.clientId and MSAL_CONFIG.auth.authority below.
 *   3. Add the GitHub Pages URL as an allowed redirect URI in the app registration.
 *   4. Grant "Azure Service Management – user_impersonation" delegated permission.
 *   5. Set DEMO_MODE = false once credentials are configured.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DEMO_MODE = true  → uses a simulated auth flow (no real Azure credentials needed).
 *                      Useful for local development and UI testing.
 * DEMO_MODE = false → uses real MSAL browser sign-in with MFA support.
 */
const DEMO_MODE = true; // ← set to false once you have configured clientId / tenantId below

const MSAL_CONFIG = {
    auth: {
        // Replace with your Entra app registration Application (client) ID
        clientId: 'YOUR_CLIENT_ID',
        // Single-tenant authority – replace YOUR_TENANT_ID with your Entra tenant GUID or domain
        authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
        redirectUri: window.location.origin + window.location.pathname,
        postLogoutRedirectUri: window.location.origin + window.location.pathname
    },
    cache: {
        // sessionStorage: tokens do not persist across browser tabs or sessions
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (!containsPii && typeof msal !== 'undefined') {
                    if (level === msal.LogLevel.Error) {
                        console.error('[MSAL]', message);
                    } else if (level === msal.LogLevel.Warning) {
                        console.warn('[MSAL]', message);
                    }
                }
            },
            logLevel: typeof msal !== 'undefined' ? msal.LogLevel.Warning : 0
        }
    }
};

// Scopes requested for Azure Resource Manager (ARM) API access
const ARM_SCOPES = ['https://management.azure.com/user_impersonation'];

// ─────────────────────────────────────────────────────────────────────────────
// MSAL instance
// ─────────────────────────────────────────────────────────────────────────────

let msalInstance = null;
let _demoAccount = null;  // stores fake account object in DEMO_MODE

function getMsalInstance() {
    if (!msalInstance && typeof msal !== 'undefined') {
        msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
    }
    return msalInstance;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the currently signed-in account, or null if not authenticated.
 * In DEMO_MODE returns the fake account set by _demoSignIn.
 */
function getCurrentAccount() {
    if (DEMO_MODE) {
        return _demoAccount;
    }
    const instance = getMsalInstance();
    if (!instance) return null;
    const accounts = instance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
}

/**
 * Returns true when a user is signed in.
 */
function isAuthenticated() {
    if (DEMO_MODE) {
        return !!sessionStorage.getItem('demo_access_token');
    }
    return getCurrentAccount() !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token acquisition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Acquires an Azure ARM access token.
 * Attempts silent token refresh first; falls back to an interactive popup.
 *
 * @returns {Promise<string>} ****** token
 */
async function getAccessToken() {
    if (DEMO_MODE) {
        const token = sessionStorage.getItem('demo_access_token');
        if (!token) throw new Error('Not authenticated (DEMO_MODE). Please sign in first.');
        return token;
    }

    const instance = getMsalInstance();
    if (!instance) throw new Error('MSAL is not initialised. Ensure the MSAL script has loaded.');

    const account = getCurrentAccount();
    if (!account) throw new Error('No signed-in account found. Please sign in first.');

    const tokenRequest = { scopes: ARM_SCOPES, account };

    try {
        const response = await instance.acquireTokenSilent(tokenRequest);
        return response.accessToken;
    } catch (silentError) {
        // Token is expired or missing from cache; prompt the user interactively
        if (
            silentError instanceof msal.InteractionRequiredAuthError ||
            silentError.name === 'InteractionRequiredAuthError'
        ) {
            const response = await instance.acquireTokenPopup(tokenRequest);
            return response.accessToken;
        }
        throw silentError;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-in
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triggers the Azure sign-in flow (popup, with MFA if required by Conditional Access).
 * In DEMO_MODE a simulated sign-in is used instead.
 *
 * @returns {Promise<{ account: object, accessToken: string }>}
 */
async function handleAzureSignIn() {
    if (DEMO_MODE) {
        return _demoSignIn();
    }

    const instance = getMsalInstance();
    if (!instance) {
        throw new Error(
            'MSAL library not loaded. Check that the msal-browser script tag is present in index.html.'
        );
    }

    const loginRequest = {
        scopes: ARM_SCOPES,
        prompt: 'select_account' // forces account picker even when already signed in
    };

    const response = await instance.loginPopup(loginRequest);
    return {
        account: response.account,
        accessToken: response.accessToken
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-out
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Signs the current user out and clears the token cache.
 */
async function handleAzureSignOut() {
    if (DEMO_MODE) {
        sessionStorage.removeItem('demo_access_token');
        sessionStorage.removeItem('selected_subscription_id');
        sessionStorage.removeItem('selected_subscription_name');
        _demoAccount = null;
        return;
    }

    const instance = getMsalInstance();
    const account = getCurrentAccount();
    if (!instance || !account) return;

    await instance.logoutPopup({
        account,
        postLogoutRedirectUri: MSAL_CONFIG.auth.postLogoutRedirectUri
    });

    sessionStorage.removeItem('selected_subscription_id');
    sessionStorage.removeItem('selected_subscription_name');
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lists all Azure subscriptions accessible to the signed-in user.
 *
 * @returns {Promise<Array<{ subscriptionId: string, displayName: string, state: string }>>}
 */
async function getSubscriptions() {
    if (DEMO_MODE) {
        return [
            { subscriptionId: 'demo-sub-001', displayName: 'Demo Subscription 1 (Dev)', state: 'Enabled' },
            { subscriptionId: 'demo-sub-002', displayName: 'Demo Subscription 2 (Prod)', state: 'Enabled' }
        ];
    }

    const token = await getAccessToken();
    const response = await fetch('https://management.azure.com/subscriptions?api-version=2020-01-01', {
        headers: { Authorization: 'Bearer ' + token }
    });

    if (!response.ok) {
        throw new Error(`Failed to list subscriptions: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return (data.value || []).map(sub => ({
        subscriptionId: sub.subscriptionId,
        displayName: sub.displayName,
        state: sub.state
    }));
}

/**
 * Returns the currently selected subscription ID from sessionStorage.
 */
function getSelectedSubscriptionId() {
    return sessionStorage.getItem('selected_subscription_id') || null;
}

/**
 * Returns the display name of the currently selected subscription, or null.
 */
function getSelectedSubscriptionName() {
    return sessionStorage.getItem('selected_subscription_name') || null;
}

/**
 * Persists the selected subscription for the current session.
 */
function setSelectedSubscription(subscriptionId, displayName) {
    sessionStorage.setItem('selected_subscription_id', subscriptionId);
    sessionStorage.setItem('selected_subscription_name', displayName);
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO_MODE helpers (private)
// ─────────────────────────────────────────────────────────────────────────────

async function _demoSignIn() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const fakeToken = 'demo-token-' + Date.now();
            const account = {
                username: 'demo@example.com',
                name: 'Demo User (DEMO_MODE)',
                tenantId: 'demo-tenant'
            };
            sessionStorage.setItem('demo_access_token', fakeToken);
            _demoAccount = account;
            resolve({ account, accessToken: fakeToken });
        }, 800);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports (works in both browser globals and Node.js/test environments)
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DEMO_MODE,
        MSAL_CONFIG,
        ARM_SCOPES,
        isAuthenticated,
        getCurrentAccount,
        getAccessToken,
        handleAzureSignIn,
        handleAzureSignOut,
        getSubscriptions,
        getSelectedSubscriptionId,
        getSelectedSubscriptionName,
        setSelectedSubscription
    };
} else {
    window.AzureAuth = {
        DEMO_MODE,
        MSAL_CONFIG,
        ARM_SCOPES,
        isAuthenticated,
        getActiveAccount: getCurrentAccount,
        getAccessToken,
        handleAzureSignIn,
        handleAzureSignOut,
        getSubscriptions,
        getSelectedSubscriptionId,
        getSelectedSubscriptionName,
        setSelectedSubscription
    };
}
