#!/usr/bin/env node
/**
 * Repeatability Tests
 * Asserts that identical environment profiles + resource selections always produce
 * identical parameter file JSON (no timestamps, randomness, or env-sensitive values
 * in the content itself).
 *
 * Run with: node tests/test-repeatability.js
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

// ── Load the module under test ───────────────────────────────────────────────
const svc = require('../deploymentService.js');
if (!svc || !svc.generateParameterFile) {
    console.error('❌ DeploymentService module not exported correctly. Check deploymentService.js exports.');
    process.exit(1);
}

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

function test(name, fn) {
    console.log(`\n🧪 ${name}`);
    try {
        fn();
    } catch (err) {
        console.error(`  ❌ THREW: ${err.message}`);
        failed++;
    }
}

// ── Fixtures ─────────────────────────────────────────────────────────────────
const PROFILE_A = {
    environment: 'dev',
    resourceGroup: 'bicep-rg',
    location: 'eastus',
    subscriptionId: 'sub-0000-0001',
    resourcePrefix: 'myapp',
    tags: { env: 'dev' },
};

const PROFILE_B = {
    environment: 'prod',
    resourceGroup: 'bicep-prod-rg',
    location: 'westeurope',
    subscriptionId: 'sub-0000-0002',
    resourcePrefix: 'myapp',
    tags: { env: 'prod' },
};

const RESOURCE_IDS_1 = ['Microsoft.Storage/storageAccounts', 'Microsoft.Network/virtualNetworks'];
const RESOURCE_IDS_2 = ['Microsoft.Compute/virtualMachines'];

// ── Tests ────────────────────────────────────────────────────────────────────

test('generateParameterFile: same inputs produce identical output', () => {
    const out1 = svc.generateParameterFile('Microsoft.Storage/storageAccounts', PROFILE_A);
    const out2 = svc.generateParameterFile('Microsoft.Storage/storageAccounts', PROFILE_A);
    assert(JSON.stringify(out1) === JSON.stringify(out2), 'Two calls with identical inputs return identical objects');
});

test('generateParameterFile: different profiles produce different output', () => {
    const outA = svc.generateParameterFile('Microsoft.Storage/storageAccounts', PROFILE_A);
    const outB = svc.generateParameterFile('Microsoft.Storage/storageAccounts', PROFILE_B);
    assert(JSON.stringify(outA) !== JSON.stringify(outB), 'Different profiles produce different parameter files');
});

test('generateParameterFile: output contains no timestamps or random values', () => {
    const out = svc.generateParameterFile('Microsoft.Storage/storageAccounts', PROFILE_A);
    const serialised = JSON.stringify(out);
    // Timestamps would look like a 13-digit Unix ms or ISO date
    const hasTimestamp = /\d{13}/.test(serialised) || /\d{4}-\d{2}-\d{2}T/.test(serialised);
    assert(!hasTimestamp, 'Parameter file content contains no embedded timestamps');
});

test('generateParameterFile: profile values appear in output', () => {
    // Use a short key that matches RESOURCE_DEFAULTS so prefix interpolation fires
    const out = svc.generateParameterFile('storage', PROFILE_A);
    const serialised = JSON.stringify(out);
    assert(serialised.includes(PROFILE_A.environment), 'Environment name present in parameter file');
    assert(serialised.includes(PROFILE_A.location), 'Location present in parameter file');
    assert(serialised.includes(PROFILE_A.resourcePrefix), 'Resource prefix present in parameter file (via interpolation)');
});

test('generateAllParameterFiles: same inputs produce identical output across multiple calls', () => {
    const files1 = svc.generateAllParameterFiles(RESOURCE_IDS_1, PROFILE_A);
    const files2 = svc.generateAllParameterFiles(RESOURCE_IDS_1, PROFILE_A);
    assert(typeof files1 === 'object', 'generateAllParameterFiles returns an object');
    assert(Object.keys(files1).length === RESOURCE_IDS_1.length, `Returns one entry per resource (${RESOURCE_IDS_1.length})`);
    const keys1 = Object.keys(files1).sort();
    const keys2 = Object.keys(files2).sort();
    assert(JSON.stringify(keys1) === JSON.stringify(keys2), 'Same keys on both calls');
    keys1.forEach(k => {
        assert(
            JSON.stringify(files1[k]) === JSON.stringify(files2[k]),
            `Identical content for resource: ${k}`
        );
    });
});

test('generateAllParameterFiles: different resource sets produce different output', () => {
    const files1 = svc.generateAllParameterFiles(RESOURCE_IDS_1, PROFILE_A);
    const files2 = svc.generateAllParameterFiles(RESOURCE_IDS_2, PROFILE_A);
    assert(JSON.stringify(files1) !== JSON.stringify(files2), 'Different resource IDs produce different parameter sets');
});

test('loadEnvProfile / saveEnvProfile round-trips correctly', () => {
    svc.saveEnvProfile(PROFILE_A);
    const loaded = svc.loadEnvProfile();
    assert(loaded.environment === PROFILE_A.environment, 'environment round-trips');
    assert(loaded.resourceGroup === PROFILE_A.resourceGroup, 'resourceGroup round-trips');
    assert(loaded.location === PROFILE_A.location, 'location round-trips');
    assert(loaded.resourcePrefix === PROFILE_A.resourcePrefix, 'resourcePrefix round-trips');
});

test('DEFAULT_ENV_PROFILE has expected shape', () => {
    const d = svc.DEFAULT_ENV_PROFILE;
    assert(d && typeof d.environment === 'string', 'DEFAULT_ENV_PROFILE.environment is a string');
    assert(d && typeof d.resourceGroup === 'string', 'DEFAULT_ENV_PROFILE.resourceGroup is a string');
    assert(d && typeof d.location === 'string', 'DEFAULT_ENV_PROFILE.location is a string');
    assert(d && typeof d.resourcePrefix === 'string', 'DEFAULT_ENV_PROFILE.resourcePrefix is a string');
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Repeatability tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
