#!/usr/bin/env node
/**
 * Auth State Unit Tests
 * Tests for AzureAuth module (authConfig.js) covering:
 *   - DEMO_MODE simulated sign-in / sign-out
 *   - isAuthenticated() / getActiveAccount()
 *   - sessionStorage helpers
 *   - Token expiry handling stub
 *
 * Run with: node tests/test-auth.js
 */

'use strict';

// ── Minimal browser-API stubs for Node ──────────────────────────────────────
const _store = {};
global.sessionStorage = {
    getItem: (k) => _store[k] !== undefined ? _store[k] : null,
    setItem: (k, v) => { _store[k] = String(v); },
    removeItem: (k) => { delete _store[k]; },
    clear: () => { Object.keys(_store).forEach(k => delete _store[k]); },
};
global.window = global;
global.console = console;
global.window.location = { origin: 'http://localhost', pathname: '/' };

// ── Load the module under test ───────────────────────────────────────────────
const authModule = require('../authConfig.js');
if (!authModule || !authModule.handleAzureSignIn) {
    console.error('❌ AzureAuth module not exported correctly. Check authConfig.js exports.');
    process.exit(1);
}

// Map to the expected API shape (some names differ between module.exports and window.AzureAuth)
const auth = {
    isAuthenticated: authModule.isAuthenticated,
    getActiveAccount: authModule.getCurrentAccount,
    getAccessToken: authModule.getAccessToken,
    handleAzureSignIn: authModule.handleAzureSignIn,
    handleAzureSignOut: authModule.handleAzureSignOut,
    getSubscriptions: authModule.getSubscriptions,
    getSelectedSubscriptionId: authModule.getSelectedSubscriptionId,
    getSelectedSubscriptionName: authModule.getSelectedSubscriptionName,
    setSelectedSubscription: authModule.setSelectedSubscription,
};
global.AzureAuth = auth;

// ── Simple test runner ───────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

async function test(name, fn) {
    console.log(`\n🧪 ${name}`);
    try {
        await fn();
    } catch (err) {
        console.error(`  ❌ THREW: ${err.message}`);
        failed++;
    }
}

// ── Tests ────────────────────────────────────────────────────────────────────

(async () => {

    await test('Initial state — signed out', () => {
        sessionStorage.clear();
        assert(!auth.isAuthenticated(), 'isAuthenticated() returns false when no account is set');
        assert(auth.getActiveAccount() === null, 'getActiveAccount() returns null when signed out');
        assert(auth.getSelectedSubscriptionId() === null, 'No subscription selected initially');
    });

    await test('DEMO_MODE sign-in returns a fake account', async () => {
        const result = await auth.handleAzureSignIn();
        assert(result && result.account, 'handleAzureSignIn resolves with an account object');
        assert(result.accessToken, 'handleAzureSignIn resolves with an accessToken');
        assert(auth.isAuthenticated(), 'isAuthenticated() returns true after sign-in');
        const acct = auth.getActiveAccount();
        assert(acct !== null, 'getActiveAccount() is not null after sign-in');
        assert(typeof acct.username === 'string', 'account.username is a string');
    });

    await test('Subscription selection persisted in sessionStorage', async () => {
        const subId = 'sub-1234-abcd';
        const subName = 'My Dev Subscription';
        auth.setSelectedSubscription(subId, subName);
        assert(auth.getSelectedSubscriptionId() === subId, 'getSelectedSubscriptionId() returns set ID');
        assert(auth.getSelectedSubscriptionName() === subName, 'getSelectedSubscriptionName() returns set name');
    });

    await test('DEMO_MODE getSubscriptions returns at least one entry', async () => {
        const subs = await auth.getSubscriptions();
        assert(Array.isArray(subs), 'getSubscriptions() returns an array');
        assert(subs.length > 0, 'At least one subscription is returned');
        assert(typeof subs[0].subscriptionId === 'string', 'Each entry has a subscriptionId');
    });

    await test('DEMO_MODE getAccessToken returns a string token', async () => {
        const token = await auth.getAccessToken();
        assert(typeof token === 'string' && token.length > 0, 'getAccessToken() returns a non-empty string');
    });

    await test('Sign-out clears account and subscription', async () => {
        await auth.handleAzureSignOut();
        assert(!auth.isAuthenticated(), 'isAuthenticated() returns false after sign-out');
        assert(auth.getActiveAccount() === null, 'getActiveAccount() is null after sign-out');
        assert(auth.getSelectedSubscriptionId() === null, 'Subscription ID cleared after sign-out');
        assert(auth.getSelectedSubscriptionName() === null, 'Subscription name cleared after sign-out');
    });

    await test('Token expiry: getAccessToken in DEMO_MODE always resolves', async () => {
        // Sign in again to have an account, then call getAccessToken
        await auth.handleAzureSignIn();
        const token1 = await auth.getAccessToken();
        const token2 = await auth.getAccessToken();
        assert(typeof token1 === 'string', 'First token call resolves');
        assert(typeof token2 === 'string', 'Repeated token call resolves (handles silent refresh)');
    });

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Auth tests: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);

})();
